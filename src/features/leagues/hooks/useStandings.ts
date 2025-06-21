import { useQuery } from '@tanstack/react-query';
import { StandingsService } from '../services/standingsService';
import { useAuth } from '../../auth/hooks/useAuth';

// Query keys for standings
export const standingsKeys = {
  all: ['standings'] as const,
  league: (leagueId: string) => [...standingsKeys.all, 'league', leagueId] as const,
  userPosition: (leagueId: string, userId: string) => [...standingsKeys.league(leagueId), 'user', userId] as const,
  summary: (leagueId: string) => [...standingsKeys.league(leagueId), 'summary'] as const,
  history: (leagueId: string, userId: string) => [...standingsKeys.league(leagueId), 'history', userId] as const,
  comparison: (leagueId: string, user1: string, user2: string) => 
    [...standingsKeys.league(leagueId), 'comparison', user1, user2] as const,
};

/**
 * Hook to get league standings/leaderboard
 */
export function useLeagueStandings(leagueId: string) {
  return useQuery({
    queryKey: standingsKeys.league(leagueId),
    queryFn: () => StandingsService.getLeagueStandings(leagueId),
    enabled: !!leagueId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to get current user's position in league
 */
export function useUserPosition(leagueId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: user ? standingsKeys.userPosition(leagueId, user.id) : ['no-user'],
    queryFn: () => user ? StandingsService.getUserPosition(leagueId, user.id) : null,
    enabled: !!leagueId && !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to get league statistics summary
 */
export function useLeagueStatsSummary(leagueId: string) {
  return useQuery({
    queryKey: standingsKeys.summary(leagueId),
    queryFn: () => StandingsService.getLeagueStatsSummary(leagueId),
    enabled: !!leagueId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to get member performance history
 */
export function useMemberPerformanceHistory(leagueId: string, userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  
  return useQuery({
    queryKey: targetUserId ? standingsKeys.history(leagueId, targetUserId) : ['no-user'],
    queryFn: () => targetUserId ? StandingsService.getMemberPerformanceHistory(leagueId, targetUserId) : null,
    enabled: !!leagueId && !!targetUserId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to compare two members' performance
 */
export function useComparativeStats(leagueId: string, userId1: string, userId2: string) {
  return useQuery({
    queryKey: standingsKeys.comparison(leagueId, userId1, userId2),
    queryFn: () => StandingsService.getComparativeStats(leagueId, userId1, userId2),
    enabled: !!leagueId && !!userId1 && !!userId2 && userId1 !== userId2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}