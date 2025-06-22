import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LeaderboardService } from '../services/leaderboardService';
import { useAuth } from '../../auth/hooks/useAuth';
import type { 
  LeagueLeaderboard, 
  RoundLeaderboard, 
  UserPerformanceStats,
  LeagueStatsOverview 
} from '../types';

// Query keys
export const leaderboardKeys = {
  all: ['leaderboards'] as const,
  leagues: () => [...leaderboardKeys.all, 'leagues'] as const,
  league: (leagueId: string) => [...leaderboardKeys.leagues(), leagueId] as const,
  rounds: () => [...leaderboardKeys.all, 'rounds'] as const,
  round: (leagueId: string, round: number) => [...leaderboardKeys.rounds(), leagueId, round] as const,
  userStats: () => [...leaderboardKeys.all, 'userStats'] as const,
  userStat: (userId: string, leagueId: string) => [...leaderboardKeys.userStats(), userId, leagueId] as const,
  leagueStats: () => [...leaderboardKeys.all, 'leagueStats'] as const,
  leagueStat: (leagueId: string) => [...leaderboardKeys.leagueStats(), leagueId] as const,
};

/**
 * Hook to get league leaderboard
 */
export function useLeagueLeaderboard(leagueId: string) {
  return useQuery({
    queryKey: leaderboardKeys.league(leagueId),
    queryFn: () => LeaderboardService.getLeagueLeaderboard(leagueId),
    enabled: !!leagueId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // Keep in memory for 15 minutes
  });
}

/**
 * Hook to get round-specific leaderboard
 */
export function useRoundLeaderboard(leagueId: string, round: number) {
  return useQuery({
    queryKey: leaderboardKeys.round(leagueId, round),
    queryFn: () => LeaderboardService.getRoundLeaderboard(leagueId, round),
    enabled: !!leagueId && !!round && round >= 1 && round <= 38,
    staleTime: 1000 * 60 * 10, // 10 minutes for round data
    gcTime: 1000 * 60 * 30, // Keep in memory for 30 minutes
  });
}

/**
 * Hook to get user's performance statistics in a league
 */
export function useUserPerformanceStats(leagueId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: leaderboardKeys.userStat(user?.id || '', leagueId),
    queryFn: () => LeaderboardService.getUserPerformanceStats(user!.id, leagueId),
    enabled: !!user?.id && !!leagueId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // Keep in memory for 15 minutes
  });
}

/**
 * Hook to get league statistics overview
 */
export function useLeagueStatsOverview(leagueId: string) {
  return useQuery({
    queryKey: leaderboardKeys.leagueStat(leagueId),
    queryFn: () => LeaderboardService.getLeagueStatsOverview(leagueId),
    enabled: !!leagueId,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 20, // Keep in memory for 20 minutes
  });
}

/**
 * Hook to save historical leaderboard snapshot
 */
export function useSaveHistoricalSnapshot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leagueId, round }: { leagueId: string; round: number }) => 
      LeaderboardService.saveHistoricalSnapshot(leagueId, round),
    onSuccess: (_, variables) => {
      // Invalidate relevant queries after saving snapshot
      queryClient.invalidateQueries({ 
        queryKey: leaderboardKeys.league(variables.leagueId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: leaderboardKeys.round(variables.leagueId, variables.round) 
      });
      
      console.log('Historical snapshot saved successfully');
    },
    onError: (error) => {
      console.error('Failed to save historical snapshot:', error);
    },
  });
}

/**
 * Hook to get user's position in a league
 */
export function useUserPosition(leagueId: string) {
  const { user } = useAuth();
  const { data: leaderboard } = useLeagueLeaderboard(leagueId);
  
  if (!user?.id || !leaderboard) {
    return null;
  }
  
  const userEntry = leaderboard.entries.find(entry => entry.user_id === user.id);
  return userEntry ? {
    position: userEntry.position,
    totalPoints: userEntry.total_points,
    totalParticipants: leaderboard.entries.length,
    percentile: ((leaderboard.entries.length - userEntry.position + 1) / leaderboard.entries.length) * 100,
  } : null;
}

/**
 * Hook to get top performers in a league
 */
export function useTopPerformers(leagueId: string, limit: number = 3) {
  const { data: leaderboard } = useLeagueLeaderboard(leagueId);
  
  return leaderboard ? leaderboard.entries.slice(0, limit) : [];
}

/**
 * Hook to get users around current user's position
 */
export function useUsersAroundPosition(leagueId: string, range: number = 2) {
  const { user } = useAuth();
  const { data: leaderboard } = useLeagueLeaderboard(leagueId);
  
  if (!user?.id || !leaderboard) {
    return [];
  }
  
  const userEntry = leaderboard.entries.find(entry => entry.user_id === user.id);
  if (!userEntry) {
    return [];
  }
  
  const userPosition = userEntry.position;
  const startIndex = Math.max(0, userPosition - range - 1);
  const endIndex = Math.min(leaderboard.entries.length, userPosition + range);
  
  return leaderboard.entries.slice(startIndex, endIndex);
}

/**
 * Hook to compare user performance with league average
 */
export function useUserComparison(leagueId: string) {
  const { user } = useAuth();
  const { data: userStats } = useUserPerformanceStats(leagueId);
  const { data: leagueStats } = useLeagueStatsOverview(leagueId);
  
  if (!user?.id || !userStats || !leagueStats) {
    return null;
  }
  
  return {
    pointsVsAverage: userStats.total_points - leagueStats.average_points,
    accuracyVsAverage: userStats.accuracy_percentage - leagueStats.overall_accuracy,
    predictionsVsAverage: userStats.total_predictions - (leagueStats.total_predictions / leagueStats.total_members),
    exactVsAverage: userStats.exact_predictions - (leagueStats.total_exact_predictions / leagueStats.total_members),
    positionPercentile: userStats.position_percentile,
  };
}

/**
 * Hook to get league participation rate for current round
 */
export function useLeagueParticipation(leagueId: string, currentRound: number) {
  const { data: roundLeaderboard } = useRoundLeaderboard(leagueId, currentRound);
  const { data: leagueLeaderboard } = useLeagueLeaderboard(leagueId);
  
  if (!roundLeaderboard || !leagueLeaderboard) {
    return null;
  }
  
  const participatingUsers = roundLeaderboard.entries.length;
  const totalUsers = leagueLeaderboard.total_members;
  
  return {
    participatingUsers,
    totalUsers,
    participationRate: totalUsers > 0 ? (participatingUsers / totalUsers) * 100 : 0,
  };
}