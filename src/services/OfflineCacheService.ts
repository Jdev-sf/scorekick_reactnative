import { storage } from '../lib/storage/asyncStorage';
import type { Match, SerieAStanding, Season } from '../features/matches/types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheMetadata {
  key: string;
  size: number;
  lastAccessed: number;
  priority: number; // 1-5, higher = more important
}

/**
 * Offline-First Cache Service for Match Data
 * 
 * Features:
 * - Persistent storage with MMKV
 * - Cache expiration management
 * - Size-based cache eviction
 * - Priority-based cache retention
 * - Offline-first data loading patterns
 */
export class OfflineCacheService {
  private static readonly CACHE_PREFIX = 'cache_';
  private static readonly METADATA_KEY = 'cache_metadata';
  private static readonly MAX_CACHE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Cache TTL configuration for different data types
   */
  private static readonly CACHE_CONFIG = {
    // Live matches - short TTL for frequent updates
    liveMatches: { ttl: 30 * 1000, priority: 5 }, // 30 seconds
    
    // Today's matches - medium TTL
    todayMatches: { ttl: 5 * 60 * 1000, priority: 4 }, // 5 minutes
    
    // Upcoming matches - longer TTL
    upcomingMatches: { ttl: 30 * 60 * 1000, priority: 3 }, // 30 minutes
    
    // Completed matches - very long TTL (rarely change)
    completedMatches: { ttl: 24 * 60 * 60 * 1000, priority: 2 }, // 24 hours
    
    // Standings - medium TTL (changes after matches)
    standings: { ttl: 60 * 60 * 1000, priority: 4 }, // 1 hour
    
    // Rounds data - long TTL
    roundMatches: { ttl: 2 * 60 * 60 * 1000, priority: 3 }, // 2 hours
    
    // Seasons - very long TTL
    seasons: { ttl: 7 * 24 * 60 * 60 * 1000, priority: 2 }, // 7 days
  } as const;

  /**
   * Store data in cache with automatic expiration
   */
  static async set<T>(key: string, data: T, cacheType?: keyof typeof OfflineCacheService.CACHE_CONFIG): Promise<void> {
    try {
      const config = cacheType ? this.CACHE_CONFIG[cacheType] : { ttl: this.DEFAULT_TTL, priority: 1 };
      const now = Date.now();
      
      const entry: CacheEntry<T> = {
        data,
        timestamp: now,
        expiresAt: now + config.ttl,
      };

      const cacheKey = this.CACHE_PREFIX + key;
      const serialized = JSON.stringify(entry);
      
      await storage.set(cacheKey, serialized);
      
      // Update metadata
      await this.updateMetadata(cacheKey, serialized.length, config.priority);
      
      // Check if cache cleanup is needed
      await this.cleanupIfNeeded();
      
      console.log(`📦 Cache SET: ${key} (${(serialized.length / 1024).toFixed(1)}KB, TTL: ${config.ttl / 1000}s)`);
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }

  /**
   * Get data from cache with automatic expiration check
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const cacheKey = this.CACHE_PREFIX + key;
      const cached = await storage.getString(cacheKey);
      
      if (!cached) {
        console.log(`📦 Cache MISS: ${key}`);
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(cached);
      const now = Date.now();

      // Check if expired
      if (now > entry.expiresAt) {
        console.log(`📦 Cache EXPIRED: ${key} (expired ${(now - entry.expiresAt) / 1000}s ago)`);
        await this.delete(key);
        return null;
      }

      // Update last accessed time
      await this.updateLastAccessed(cacheKey);
      
      console.log(`📦 Cache HIT: ${key} (age: ${(now - entry.timestamp) / 1000}s)`);
      return entry.data;
    } catch (error) {
      console.error(`Failed to get cached data for key ${key}:`, error);
      await this.delete(key); // Remove corrupted cache entry
      return null;
    }
  }

  /**
   * Check if data exists and is not expired
   */
  static async has(key: string): Promise<boolean> {
    const result = await this.get(key);
    return result !== null;
  }

  /**
   * Delete specific cache entry
   */
  static async delete(key: string): Promise<void> {
    const cacheKey = this.CACHE_PREFIX + key;
    await storage.delete(cacheKey);
    await this.removeFromMetadata(cacheKey);
    console.log(`📦 Cache DELETE: ${key}`);
  }

  /**
   * Clear all cache data
   */
  static async clear(): Promise<void> {
    const allKeys = await storage.getAllKeys();
    const cacheKeys = Array.from(allKeys).filter(key => key.startsWith(this.CACHE_PREFIX));
    
    await Promise.all(cacheKeys.map(key => storage.delete(key)));
    await storage.delete(this.METADATA_KEY);
    
    console.log(`📦 Cache CLEARED: ${cacheKeys.length} entries removed`);
  }

  /**
   * Get cache statistics
   */
  static async getStats(): Promise<{
    totalEntries: number;
    totalSize: number;
    sizeMB: number;
    oldestEntry: number;
    newestEntry: number;
  }> {
    const metadata = await this.getMetadata();
    const entries = Object.values(metadata);
    
    if (entries.length === 0) {
      return {
        totalEntries: 0,
        totalSize: 0,
        sizeMB: 0,
        oldestEntry: 0,
        newestEntry: 0,
      };
    }

    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const timestamps = entries.map(entry => entry.lastAccessed);
    
    return {
      totalEntries: entries.length,
      totalSize,
      sizeMB: totalSize / (1024 * 1024),
      oldestEntry: Math.min(...timestamps),
      newestEntry: Math.max(...timestamps),
    };
  }

  /**
   * Cache-first data loading pattern
   * Returns cached data immediately, then fetches fresh data in background
   */
  static async loadWithCacheFallback<T>(
    key: string,
    fetchFn: () => Promise<T>,
    cacheType?: keyof typeof OfflineCacheService.CACHE_CONFIG
  ): Promise<{ data: T; fromCache: boolean }> {
    // Try cache first
    const cached = await this.get<T>(key);
    
    if (cached) {
      // Return cached data immediately, but still fetch fresh data in background
      fetchFn().then(async freshData => {
        await this.set(key, freshData, cacheType);
      }).catch(error => {
        console.warn(`Background fetch failed for ${key}:`, error);
      });
      
      return { data: cached, fromCache: true };
    }

    // No cache, fetch fresh data
    try {
      const freshData = await fetchFn();
      await this.set(key, freshData, cacheType);
      return { data: freshData, fromCache: false };
    } catch (error) {
      console.error(`Failed to fetch fresh data for ${key}:`, error);
      throw error;
    }
  }

  /**
   * Stale-while-revalidate pattern
   * Returns stale data immediately, fetches fresh data in background
   */
  static async staleWhileRevalidate<T>(
    key: string,
    fetchFn: () => Promise<T>,
    cacheType?: keyof typeof OfflineCacheService.CACHE_CONFIG,
    onUpdate?: (data: T) => void
  ): Promise<T> {
    const cached = await this.get<T>(key);
    
    // Fetch fresh data in background
    fetchFn().then(async freshData => {
      await this.set(key, freshData, cacheType);
      if (onUpdate && JSON.stringify(cached) !== JSON.stringify(freshData)) {
        onUpdate(freshData);
      }
    }).catch(error => {
      console.warn(`Background revalidation failed for ${key}:`, error);
    });
    
    if (cached) {
      return cached;
    }

    // No cache, wait for fresh data
    return fetchFn();
  }

  // Private helper methods

  private static async getMetadata(): Promise<Record<string, CacheMetadata>> {
    try {
      const metadata = await storage.getString(this.METADATA_KEY);
      return metadata ? JSON.parse(metadata) : {};
    } catch {
      return {};
    }
  }

  private static async saveMetadata(metadata: Record<string, CacheMetadata>): Promise<void> {
    await storage.set(this.METADATA_KEY, JSON.stringify(metadata));
  }

  private static async updateMetadata(key: string, size: number, priority: number): Promise<void> {
    const metadata = await this.getMetadata();
    metadata[key] = {
      key,
      size,
      lastAccessed: Date.now(),
      priority,
    };
    await this.saveMetadata(metadata);
  }

  private static async updateLastAccessed(key: string): Promise<void> {
    const metadata = await this.getMetadata();
    if (metadata[key]) {
      metadata[key].lastAccessed = Date.now();
      await this.saveMetadata(metadata);
    }
  }

  private static async removeFromMetadata(key: string): Promise<void> {
    const metadata = await this.getMetadata();
    delete metadata[key];
    await this.saveMetadata(metadata);
  }

  private static async cleanupIfNeeded(): Promise<void> {
    const stats = await this.getStats();
    
    if (stats.totalSize > this.MAX_CACHE_SIZE) {
      console.log(`📦 Cache cleanup needed: ${stats.sizeMB.toFixed(1)}MB > ${this.MAX_CACHE_SIZE / (1024 * 1024)}MB`);
      await this.performCleanup();
    }
  }

  private static async performCleanup(): Promise<void> {
    const metadata = await this.getMetadata();
    const entries = Object.values(metadata);
    
    // Sort by priority (desc) then by last accessed (asc)
    // This keeps high-priority recent items, removes low-priority old items
    entries.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Higher priority first
      }
      return a.lastAccessed - b.lastAccessed; // Older items first within same priority
    });

    // Remove bottom 25% of items
    const itemsToRemove = Math.ceil(entries.length * 0.25);
    const toRemove = entries.slice(-itemsToRemove);
    
    let removedSize = 0;
    await Promise.all(toRemove.map(async item => {
      await storage.delete(item.key);
      removedSize += item.size;
    }));

    // Update metadata
    const newMetadata = { ...metadata };
    toRemove.forEach(item => {
      delete newMetadata[item.key];
    });
    await this.saveMetadata(newMetadata);
    
    console.log(`📦 Cache cleanup: removed ${toRemove.length} items (${(removedSize / 1024).toFixed(1)}KB)`);
  }
}

/**
 * Specialized Match Cache Service
 * Provides semantic caching methods for match data
 */
export class MatchCacheService {
  /**
   * Cache live matches with short TTL
   */
  static async cacheLiveMatches(matches: Match[]): Promise<void> {
    await OfflineCacheService.set('live_matches', matches, 'liveMatches');
  }

  static async getLiveMatches(): Promise<Match[] | null> {
    return await OfflineCacheService.get<Match[]>('live_matches');
  }

  /**
   * Cache matches by round
   */
  static async cacheRoundMatches(round: number, matches: Match[]): Promise<void> {
    await OfflineCacheService.set(`round_${round}_matches`, matches, 'roundMatches');
  }

  static async getRoundMatches(round: number): Promise<Match[] | null> {
    return await OfflineCacheService.get<Match[]>(`round_${round}_matches`);
  }

  /**
   * Cache upcoming matches
   */
  static async cacheUpcomingMatches(matches: Match[]): Promise<void> {
    await OfflineCacheService.set('upcoming_matches', matches, 'upcomingMatches');
  }

  static async getUpcomingMatches(): Promise<Match[] | null> {
    return await OfflineCacheService.get<Match[]>('upcoming_matches');
  }

  /**
   * Cache Serie A standings
   */
  static async cacheStandings(standings: SerieAStanding[]): Promise<void> {
    await OfflineCacheService.set('serie_a_standings', standings, 'standings');
  }

  static async getStandings(): Promise<SerieAStanding[] | null> {
    return await OfflineCacheService.get<SerieAStanding[]>('serie_a_standings');
  }

  /**
   * Cache seasons
   */
  static async cacheSeasons(seasons: Season[]): Promise<void> {
    await OfflineCacheService.set('seasons', seasons, 'seasons');
  }

  static async getSeasons(): Promise<Season[] | null> {
    return await OfflineCacheService.get<Season[]>('seasons');
  }

  /**
   * Cache-first loading for matches with automatic refresh
   */
  static async loadRoundMatchesOfflineFirst(
    round: number,
    fetchFn: () => Promise<Match[]>
  ): Promise<{ data: Match[]; fromCache: boolean }> {
    return OfflineCacheService.loadWithCacheFallback(
      `round_${round}_matches`,
      fetchFn,
      'roundMatches'
    );
  }

  static async loadStandingsOfflineFirst(
    fetchFn: () => Promise<SerieAStanding[]>
  ): Promise<{ data: SerieAStanding[]; fromCache: boolean }> {
    return OfflineCacheService.loadWithCacheFallback(
      'serie_a_standings',
      fetchFn,
      'standings'
    );
  }
}