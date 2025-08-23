import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RealtimeService, RealtimeCallbacks, RealtimeSubscriptionConfig } from '../services/realtimeService';
import { useAuth } from '../features/auth/hooks/useAuth';

/**
 * Hook for managing realtime subscriptions with automatic cleanup
 */
export function useRealtimeSubscription(
  channelName: string,
  config: RealtimeSubscriptionConfig,
  callbacks: RealtimeCallbacks,
  enabled: boolean = true
) {
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    if (!enabled || isSubscribedRef.current) return;

    const channel = RealtimeService.subscribe(channelName, config, callbacks);
    isSubscribedRef.current = true;

    return () => {
      RealtimeService.unsubscribe(channelName);
      isSubscribedRef.current = false;
    };
  }, [channelName, enabled]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (isSubscribedRef.current) {
        RealtimeService.unsubscribe(channelName);
        isSubscribedRef.current = false;
      }
    };
  }, []);
}

/**
 * Hook for live match updates with React Query integration
 */
export function useLiveMatchUpdates(enabled: boolean = true) {
  const queryClient = useQueryClient();

  const callbacks: RealtimeCallbacks = {
    onUpdate: (payload) => {
      console.log('[LiveMatches] Match updated:', payload.new);
      
      // Invalidate match queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      
      // Optionally update specific match in cache
      if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
        queryClient.setQueryData(['matches', 'detail', payload.new.id], payload.new);
      }
    },
    onError: (error) => {
      console.error('[LiveMatches] Subscription error:', error);
    },
  };

  useRealtimeSubscription(
    'live-matches',
    { table: 'matches', event: 'UPDATE' },
    callbacks,
    enabled
  );
}

/**
 * Hook for live prediction updates in a league
 */
export function useLivePredictionUpdates(leagueId: string, enabled: boolean = true) {
  const queryClient = useQueryClient();

  const callbacks: RealtimeCallbacks = {
    onInsert: (payload) => {
      console.log('[LivePredictions] New prediction:', payload.new);
      queryClient.invalidateQueries({ 
        queryKey: ['predictions', 'league', leagueId] 
      });
    },
    onUpdate: (payload) => {
      console.log('[LivePredictions] Prediction updated:', payload.new);
      queryClient.invalidateQueries({ 
        queryKey: ['predictions', 'league', leagueId] 
      });
    },
    onDelete: (payload) => {
      console.log('[LivePredictions] Prediction deleted:', payload.old);
      queryClient.invalidateQueries({ 
        queryKey: ['predictions', 'league', leagueId] 
      });
    },
    onError: (error) => {
      console.error('[LivePredictions] Subscription error:', error);
    },
  };

  useRealtimeSubscription(
    `predictions-${leagueId}`,
    { 
      table: 'predictions', 
      filter: `league_id=eq.${leagueId}` 
    },
    callbacks,
    enabled && !!leagueId
  );
}

/**
 * Hook for live leaderboard updates
 */
export function useLiveLeaderboardUpdates(leagueId: string, enabled: boolean = true) {
  const queryClient = useQueryClient();

  const callbacks: RealtimeCallbacks = {
    onUpdate: (payload) => {
      console.log('[LiveLeaderboard] Prediction scored:', payload.new);
      
      // Invalidate leaderboard queries
      queryClient.invalidateQueries({ 
        queryKey: ['leaderboards', 'leagues', leagueId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['leaderboards', 'userStats'] 
      });
    },
    onError: (error) => {
      console.error('[LiveLeaderboard] Subscription error:', error);
    },
  };

  useRealtimeSubscription(
    `leaderboard-${leagueId}`,
    { 
      table: 'predictions', 
      event: 'UPDATE',
      filter: `league_id=eq.${leagueId} AND points_earned=not.is.null`
    },
    callbacks,
    enabled && !!leagueId
  );
}

/**
 * Hook for live league member updates
 */
export function useLiveLeagueMemberUpdates(leagueId: string, enabled: boolean = true) {
  const queryClient = useQueryClient();

  const callbacks: RealtimeCallbacks = {
    onInsert: (payload) => {
      console.log('[LiveMembers] New member joined:', payload.new);
      queryClient.invalidateQueries({ 
        queryKey: ['leagues', leagueId, 'members'] 
      });
    },
    onUpdate: (payload) => {
      console.log('[LiveMembers] Member updated:', payload.new);
      queryClient.invalidateQueries({ 
        queryKey: ['leagues', leagueId, 'members'] 
      });
    },
    onDelete: (payload) => {
      console.log('[LiveMembers] Member left:', payload.old);
      queryClient.invalidateQueries({ 
        queryKey: ['leagues', leagueId, 'members'] 
      });
    },
    onError: (error) => {
      console.error('[LiveMembers] Subscription error:', error);
    },
  };

  useRealtimeSubscription(
    `members-${leagueId}`,
    { 
      table: 'league_members', 
      filter: `league_id=eq.${leagueId}` 
    },
    callbacks,
    enabled && !!leagueId
  );
}

/**
 * Hook for live achievement notifications
 */
export function useLiveAchievementUpdates(enabled: boolean = true) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const callbacks: RealtimeCallbacks = {
    onInsert: (payload) => {
      console.log('[LiveAchievements] New achievement unlocked:', payload.new);
      
      // Invalidate user achievements
      queryClient.invalidateQueries({ 
        queryKey: ['achievements', 'user', user?.id] 
      });
      
      // Could trigger a notification here
      if (payload.new) {
        console.log('🎉 Achievement unlocked!', payload.new);
        // TODO: Show achievement notification
      }
    },
    onError: (error) => {
      console.error('[LiveAchievements] Subscription error:', error);
    },
  };

  useRealtimeSubscription(
    `achievements-${user?.id}`,
    { 
      table: 'user_achievements', 
      event: 'INSERT',
      filter: `user_id=eq.${user?.id}` 
    },
    callbacks,
    enabled && !!user?.id
  );
}

/**
 * Hook for comprehensive realtime updates in a league context
 */
export function useLeagueRealtimeUpdates(leagueId: string, enabled: boolean = true) {
  // Enable all relevant subscriptions for a league
  useLivePredictionUpdates(leagueId, enabled);
  useLiveLeaderboardUpdates(leagueId, enabled);
  useLiveLeagueMemberUpdates(leagueId, enabled);
  useLiveMatchUpdates(enabled);
  useLiveAchievementUpdates(enabled);

  return {
    isConnected: RealtimeService.getConnectionStatus(),
    activeChannels: RealtimeService.getActiveChannels(),
  };
}