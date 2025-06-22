import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import type { Match, SerieAStanding } from '../features/matches/types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

export class OfflineCacheService {
  private static readonly CACHE_KEYS = {
    MATCHES: '@scorekick/matches',
    STANDINGS: '@scorekick/standings',
    NETWORK_STATUS: '@scorekick/network_status',
    SYNC_QUEUE: '@scorekick/sync_queue'
  };

  private static readonly CACHE_EXPIRY = {
    MATCHES: 5 * 60 * 1000, // 5 minutes
    STANDINGS: 30 * 60 * 1000, // 30 minutes
    NETWORK_STATUS: 1 * 60 * 1000, // 1 minute
  };

  /**
   * Cache matches data
   */
  static async cacheMatches(matches: Match[], round?: number): Promise<void> {
    try {
      const cacheKey = round ? `${this.CACHE_KEYS.MATCHES}_round_${round}` : this.CACHE_KEYS.MATCHES;
      const cacheEntry: CacheEntry<Match[]> = {
        data: matches,
        timestamp: Date.now(),
        expiry: Date.now() + this.CACHE_EXPIRY.MATCHES
      };
      
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
    } catch (error) {
      console.error('[OfflineCache] Failed to cache matches:', error);
    }
  }

  /**
   * Get cached matches
   */
  static async getCachedMatches(round?: number): Promise<Match[] | null> {
    try {
      const cacheKey = round ? `${this.CACHE_KEYS.MATCHES}_round_${round}` : this.CACHE_KEYS.MATCHES;
      const cached = await AsyncStorage.getItem(cacheKey);
      
      if (!cached) return null;
      
      const cacheEntry: CacheEntry<Match[]> = JSON.parse(cached);
      
      // Check if cache is expired
      if (Date.now() > cacheEntry.expiry) {
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }
      
      return cacheEntry.data;
    } catch (error) {
      console.error('[OfflineCache] Failed to get cached matches:', error);
      return null;
    }
  }

  /**
   * Cache standings data
   */
  static async cacheStandings(standings: SerieAStanding[], season?: string): Promise<void> {
    try {
      const cacheKey = season ? `${this.CACHE_KEYS.STANDINGS}_${season}` : this.CACHE_KEYS.STANDINGS;
      const cacheEntry: CacheEntry<SerieAStanding[]> = {
        data: standings,
        timestamp: Date.now(),
        expiry: Date.now() + this.CACHE_EXPIRY.STANDINGS
      };
      
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
    } catch (error) {
      console.error('[OfflineCache] Failed to cache standings:', error);
    }
  }

  /**
   * Get cached standings
   */
  static async getCachedStandings(season?: string): Promise<SerieAStanding[] | null> {
    try {
      const cacheKey = season ? `${this.CACHE_KEYS.STANDINGS}_${season}` : this.CACHE_KEYS.STANDINGS;
      const cached = await AsyncStorage.getItem(cacheKey);
      
      if (!cached) return null;
      
      const cacheEntry: CacheEntry<SerieAStanding[]> = JSON.parse(cached);
      
      // Check if cache is expired
      if (Date.now() > cacheEntry.expiry) {
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }
      
      return cacheEntry.data;
    } catch (error) {
      console.error('[OfflineCache] Failed to get cached standings:', error);
      return null;
    }
  }

  /**
   * Check if device is online
   */
  static async isOnline(): Promise<boolean> {
    try {
      const netInfo = await NetInfo.fetch();
      return netInfo.isConnected === true && netInfo.isInternetReachable === true;
    } catch (error) {
      console.error('[OfflineCache] Failed to check network status:', error);
      return false;
    }
  }

  /**
   * Clear all cached data
   */
  static async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const scorekickKeys = keys.filter(key => key.startsWith('@scorekick/'));
      await AsyncStorage.multiRemove(scorekickKeys);
      console.log('[OfflineCache] Cache cleared successfully');
    } catch (error) {
      console.error('[OfflineCache] Failed to clear cache:', error);
    }
  }

  /**
   * Clear expired cache entries
   */
  static async clearExpiredCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const scorekickKeys = keys.filter(key => key.startsWith('@scorekick/'));
      
      for (const key of scorekickKeys) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          try {
            const cacheEntry: CacheEntry<any> = JSON.parse(cached);
            if (Date.now() > cacheEntry.expiry) {
              await AsyncStorage.removeItem(key);
            }
          } catch (error) {
            // Invalid cache entry, remove it
            await AsyncStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('[OfflineCache] Failed to clear expired cache:', error);
    }
  }

  /**
   * Get cache size information
   */
  static async getCacheInfo(): Promise<{
    totalKeys: number;
    scorekickKeys: number;
    estimatedSize: number;
  }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const scorekickKeys = keys.filter(key => key.startsWith('@scorekick/'));
      
      let estimatedSize = 0;
      for (const key of scorekickKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          estimatedSize += value.length;
        }
      }
      
      return {
        totalKeys: keys.length,
        scorekickKeys: scorekickKeys.length,
        estimatedSize: estimatedSize
      };
    } catch (error) {
      console.error('[OfflineCache] Failed to get cache info:', error);
      return {
        totalKeys: 0,
        scorekickKeys: 0,
        estimatedSize: 0
      };
    }
  }
}