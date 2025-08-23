import { useQuery } from '@tanstack/react-query';
import { useSelectedLeague } from '../../../contexts/SelectedLeagueContext';
import { useAuth } from '../../auth/hooks/useAuth';
import { LeaderboardService } from '../../leaderboards/services/leaderboardService';
import { LeagueService } from '../../leagues/services/leagueService';
import { MatchService } from '../../matches/services/matchSyncService';

export const useUserLeagues = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['userLeagues', user?.id],
    queryFn: () => user?.id ? LeagueService.getUserLeagues(user.id) : [],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useLeagueStandings = (leagueId?: string) => {
  return useQuery({
    queryKey: ['leagueStandings', leagueId],
    queryFn: () => leagueId ? LeaderboardService.getLeagueStandings(leagueId) : null,
    enabled: !!leagueId,
    staleTime: 2 * 60 * 1000, // 2 minutes for real-time feel
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

export const useUserPositionInLeague = (leagueId?: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['userPosition', leagueId, user?.id],
    queryFn: async () => {
      if (!leagueId || !user?.id) return null;
      
      const standings = await LeaderboardService.getLeagueStandings(leagueId);
      const userPosition = standings.findIndex(standing => standing.user_id === user.id) + 1;
      const userStats = standings.find(standing => standing.user_id === user.id);
      
      return userPosition > 0 ? { position: userPosition, stats: userStats } : null;
    },
    enabled: !!leagueId && !!user?.id,
    staleTime: 2 * 60 * 1000,
  });
};

export const useSerieAStandings = () => {
  return useQuery({
    queryKey: ['serieAStandings'],
    queryFn: () => MatchService.getSerieAStandings(),
    staleTime: 60 * 60 * 1000, // 1 hour - Serie A standings don't change frequently
    refetchInterval: 60 * 60 * 1000, // Refetch every hour
  });
};

export const useUpcomingMatches = () => {
  return useQuery({
    queryKey: ['upcomingMatches'],
    queryFn: () => MatchService.getUpcomingMatches(3), // Get next 3 matches
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // Refetch every minute for deadline countdown
  });
};

export const useUserStats = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['userStats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      // Get stats from all leagues and aggregate
      const userLeagues = await LeagueService.getUserLeagues(user.id);
      let totalPoints = 0;
      let totalExactPredictions = 0;
      let totalPredictions = 0;
      let totalCorrectPredictions = 0;
      
      for (const league of userLeagues) {
        const standings = await LeaderboardService.getLeagueStandings(league.id);
        const userStats = standings.find(s => s.user_id === user.id);
        
        if (userStats) {
          totalPoints += userStats.total_points;
          totalExactPredictions += userStats.exact_predictions || 0;
          totalPredictions += userStats.total_predictions;
          totalCorrectPredictions += userStats.correct_predictions;
        }
      }
      
      const accuracyPercentage = totalPredictions > 0 
        ? (totalCorrectPredictions / totalPredictions) * 100 
        : 0;
      
      return {
        totalPoints,
        totalExactPredictions,
        accuracyPercentage,
        activeLeagues: userLeagues.length,
        totalPredictions,
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
};