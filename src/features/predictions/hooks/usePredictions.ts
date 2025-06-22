import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PredictionService } from '../services/predictionService';
import { useAuth } from '../../auth/hooks/useAuth';
import type { 
  Prediction, 
  PredictionCreate, 
  PredictionUpdate, 
  PredictionWithMatch,
  PredictionStats,
  LeaguePredictionSummary 
} from '../types';

// Query keys
export const predictionKeys = {
  all: ['predictions'] as const,
  lists: () => [...predictionKeys.all, 'list'] as const,
  userPrediction: (userId: string, matchId: string, leagueId: string) => 
    [...predictionKeys.all, 'user', userId, 'match', matchId, 'league', leagueId] as const,
  userLeaguePredictions: (userId: string, leagueId: string, round?: number) => 
    [...predictionKeys.all, 'user', userId, 'league', leagueId, round] as const,
  userStats: (userId: string, leagueId: string) => 
    [...predictionKeys.all, 'stats', userId, leagueId] as const,
  matchPredictions: (matchId: string, leagueId: string) => 
    [...predictionKeys.all, 'match', matchId, 'league', leagueId] as const,
  userSummaries: (userId: string) => 
    [...predictionKeys.all, 'summaries', userId] as const,
  deadlineCheck: (matchId: string) => 
    [...predictionKeys.all, 'deadline', matchId] as const,
};

/**
 * Hook to check if predictions are allowed for a match
 */
export function usePredictionDeadlineCheck(matchId: string) {
  return useQuery({
    queryKey: predictionKeys.deadlineCheck(matchId),
    queryFn: () => PredictionService.isPredictionAllowed(matchId),
    enabled: !!matchId,
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Hook to get user's prediction for a specific match and league
 */
export function useUserPrediction(matchId: string, leagueId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: predictionKeys.userPrediction(user?.id || '', matchId, leagueId),
    queryFn: () => PredictionService.getUserPrediction(user!.id, matchId, leagueId),
    enabled: !!user?.id && !!matchId && !!leagueId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to get user's predictions for a league
 */
export function useUserLeaguePredictions(leagueId: string, round?: number) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: predictionKeys.userLeaguePredictions(user?.id || '', leagueId, round),
    queryFn: () => PredictionService.getUserPredictionsForLeague(user!.id, leagueId, round),
    enabled: !!user?.id && !!leagueId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to get user's prediction statistics for a league
 */
export function useUserPredictionStats(leagueId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: predictionKeys.userStats(user?.id || '', leagueId),
    queryFn: () => PredictionService.getUserPredictionStats(user!.id, leagueId),
    enabled: !!user?.id && !!leagueId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to get all predictions for a match (for league admins)
 */
export function useMatchPredictions(matchId: string, leagueId: string) {
  return useQuery({
    queryKey: predictionKeys.matchPredictions(matchId, leagueId),
    queryFn: () => PredictionService.getMatchPredictions(matchId, leagueId),
    enabled: !!matchId && !!leagueId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to get user's league prediction summaries
 */
export function useUserLeaguePredictionSummaries() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: predictionKeys.userSummaries(user?.id || ''),
    queryFn: () => PredictionService.getUserLeaguePredictionSummaries(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to create a prediction
 */
export function useCreatePrediction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (prediction: PredictionCreate) => 
      PredictionService.createPrediction(user!.id, prediction),
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: predictionKeys.userPrediction(user!.id, variables.match_id, variables.league_id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: predictionKeys.userLeaguePredictions(user!.id, variables.league_id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: predictionKeys.userStats(user!.id, variables.league_id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: predictionKeys.matchPredictions(variables.match_id, variables.league_id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: predictionKeys.userSummaries(user!.id) 
      });
      
      console.log('Prediction created successfully:', data);
    },
    onError: (error) => {
      console.error('Failed to create prediction:', error);
    },
  });
}

/**
 * Hook to update a prediction
 */
export function useUpdatePrediction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ predictionId, update }: { predictionId: string; update: PredictionUpdate }) => 
      PredictionService.updatePrediction(user!.id, predictionId, update),
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: predictionKeys.userPrediction(user!.id, data.match_id, data.league_id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: predictionKeys.userLeaguePredictions(user!.id, data.league_id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: predictionKeys.userStats(user!.id, data.league_id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: predictionKeys.matchPredictions(data.match_id, data.league_id) 
      });
      
      console.log('Prediction updated successfully:', data);
    },
    onError: (error) => {
      console.error('Failed to update prediction:', error);
    },
  });
}

/**
 * Hook to delete a prediction
 */
export function useDeletePrediction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (predictionId: string) => 
      PredictionService.deletePrediction(user!.id, predictionId),
    onSuccess: (_, predictionId) => {
      // Invalidate all prediction queries for this user
      queryClient.invalidateQueries({ queryKey: predictionKeys.all });
      
      console.log('Prediction deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete prediction:', error);
    },
  });
}