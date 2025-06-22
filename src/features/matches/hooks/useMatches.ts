import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MatchSyncService } from '../services/matchSyncService';
import { EdgeFunctionService } from '../services/edgeFunctionService';
import { SeasonService } from '../services/seasonService';
import { OfflineCacheService } from '../../../services/offlineCache';
import type { Match, SerieAStanding, SyncResult, MatchFilters, Season } from '../types';

// Query keys
export const matchKeys = {
  all: ['matches'] as const,
  lists: () => [...matchKeys.all, 'list'] as const,
  list: (filters: MatchFilters) => [...matchKeys.lists(), filters] as const,
  rounds: () => [...matchKeys.all, 'rounds'] as const,
  round: (round: number, seasonId?: string) => [...matchKeys.rounds(), round, seasonId] as const,
  live: () => [...matchKeys.all, 'live'] as const,
  upcoming: () => [...matchKeys.all, 'upcoming'] as const,
  standings: () => ['standings'] as const,
  serieAStandings: (season?: string) => [...matchKeys.standings(), 'serie-a', season] as const,
  seasons: () => ['seasons'] as const,
};

/**
 * Hook to get matches by round with offline support
 */
export function useMatchesByRound(round: number) {
  return useQuery({
    queryKey: matchKeys.round(round),
    queryFn: async () => {
      try {
        // Try online first
        const isOnline = await OfflineCacheService.isOnline();
        
        if (isOnline) {
          const matches = await MatchSyncService.getMatchesByRound(round);
          // Cache the result
          await OfflineCacheService.cacheMatches(matches, round);
          return matches;
        } else {
          // Use cached data when offline
          const cachedMatches = await OfflineCacheService.getCachedMatches(round);
          if (cachedMatches) {
            return cachedMatches;
          }
          throw new Error('No cached data available for round ' + round);
        }
      } catch (error) {
        // Fallback to cache on any error
        const cachedMatches = await OfflineCacheService.getCachedMatches(round);
        if (cachedMatches) {
          return cachedMatches;
        }
        throw error;
      }
    },
    enabled: !!round && round >= 1 && round <= 38,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 30, // Keep in memory for 30 minutes
    retry: false, // Don't retry to avoid multiple cache reads
  });
}

/**
 * Hook to get live matches
 * Reduced refetch interval to be API-friendly
 */
export function useLiveMatches() {
  return useQuery({
    queryKey: matchKeys.live(),
    queryFn: MatchSyncService.getLiveMatches,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes for live matches
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to get upcoming matches
 */
export function useUpcomingMatches(limit: number = 10) {
  return useQuery({
    queryKey: [...matchKeys.upcoming(), limit],
    queryFn: () => MatchSyncService.getUpcomingMatches(limit),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to get Serie A standings for a specific season with offline support
 * Longer cache time since standings don't change often
 */
export function useSerieAStandings(season?: string) {
  return useQuery({
    queryKey: matchKeys.serieAStandings(season),
    queryFn: async () => {
      try {
        // Try online first
        const isOnline = await OfflineCacheService.isOnline();
        
        if (isOnline) {
          const standings = await MatchSyncService.getSerieAStandings(season);
          // Cache the result
          await OfflineCacheService.cacheStandings(standings, season);
          return standings;
        } else {
          // Use cached data when offline
          const cachedStandings = await OfflineCacheService.getCachedStandings(season);
          if (cachedStandings) {
            return cachedStandings;
          }
          throw new Error('No cached standings available for season ' + (season || 'current'));
        }
      } catch (error) {
        // Fallback to cache on any error
        const cachedStandings = await OfflineCacheService.getCachedStandings(season);
        if (cachedStandings) {
          return cachedStandings;
        }
        throw error;
      }
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 2, // Keep in memory for 2 hours
    retry: false, // Don't retry to avoid multiple cache reads
  });
}

/**
 * Hook to sync all data (matches and standings) using Edge Function
 * This runs server-side with proper database permissions
 */
export function useSyncData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: EdgeFunctionService.syncAllData,
    onSuccess: (result: SyncResult) => {
      // Invalidate all match-related queries
      queryClient.invalidateQueries({ queryKey: matchKeys.all });
      queryClient.invalidateQueries({ queryKey: matchKeys.standings() });
      
      console.log('Data sync completed via Edge Function:', result);
    },
    onError: (error) => {
      console.error('Data sync failed:', error);
    },
  });
}

/**
 * Hook to sync only matches
 */
export function useSyncMatches() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: MatchSyncService.syncMatches,
    onSuccess: (result: SyncResult) => {
      // Invalidate match queries
      queryClient.invalidateQueries({ queryKey: matchKeys.all });
      
      console.log('Matches sync completed:', result);
    },
    onError: (error) => {
      console.error('Matches sync failed:', error);
    },
  });
}

/**
 * Hook to sync only standings for a specific season
 */
export function useSyncStandings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ season }: { season?: string } = {}) => MatchSyncService.syncStandings(season),
    onSuccess: (result: SyncResult) => {
      // Invalidate standings queries
      queryClient.invalidateQueries({ queryKey: matchKeys.standings() });
      
      console.log('Standings sync completed:', result);
    },
    onError: (error) => {
      console.error('Standings sync failed:', error);
    },
  });
}

/**
 * Hook to get all available seasons
 */
export function useAllSeasons() {
  return useQuery({
    queryKey: matchKeys.seasons(),
    queryFn: SeasonService.getAllSeasons,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

/**
 * Hook to get current active season
 */
export function useCurrentSeason() {
  return useQuery({
    queryKey: [...matchKeys.seasons(), 'current'],
    queryFn: SeasonService.getCurrentSeason,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

/**
 * Hook to get historical standings for a league
 */
export function useHistoricalStandings(leagueId: string) {
  return useQuery({
    queryKey: ['historical-standings', leagueId],
    queryFn: () => SeasonService.getHistoricalStandings(leagueId),
    enabled: !!leagueId,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}