import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AchievementService } from '../services/achievementService';
import { useAuth } from '../../auth/hooks/useAuth';
import type { Achievement, UserAchievement } from '../../leaderboards/types';
import type { UserPerformanceStats } from '../../leaderboards/types';

interface AchievementProgress {
  total: number;
  earned: number;
  progress: Array<{
    achievement: Achievement;
    earned: boolean;
    progress: number;
    current_value: number;
  }>;
}

interface UseAchievementsOptions {
  leagueId?: string;
  autoCheck?: boolean;
}

export const useAchievements = (options: UseAchievementsOptions = {}) => {
  const { leagueId, autoCheck = true } = options;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [pendingUnlocks, setPendingUnlocks] = useState<Achievement[]>([]);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [currentUnlock, setCurrentUnlock] = useState<Achievement | null>(null);

  // Get user achievements
  const {
    data: userAchievements = [],
    isLoading: isLoadingUserAchievements,
    error: userAchievementsError,
  } = useQuery({
    queryKey: ['userAchievements', user?.id, leagueId],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        const result = await AchievementService.getUserAchievements(user.id, leagueId);
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error('Error fetching user achievements:', error);
        return [];
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Get achievement progress
  const getAchievementProgressQuery = useCallback(
    (stats: UserPerformanceStats) => ({
      queryKey: ['achievementProgress', user?.id, leagueId, stats],
      queryFn: () => 
        user?.id && leagueId 
          ? AchievementService.getAchievementProgress(user.id, leagueId, stats)
          : Promise.resolve({ total: 0, earned: 0, progress: [] }),
      enabled: !!user?.id && !!leagueId,
    }),
    [user?.id, leagueId]
  );

  // Check achievements mutation
  const checkAchievementsMutation = useMutation({
    mutationFn: async (stats: UserPerformanceStats) => {
      if (!user?.id || !leagueId) return [];
      return AchievementService.checkAchievements(user.id, leagueId, stats);
    },
    onSuccess: (newAchievements) => {
      if (newAchievements && Array.isArray(newAchievements) && newAchievements.length > 0) {
        // Add to pending unlocks
        const achievements = newAchievements.map(ua => {
          if (!ua || !userAchievements || !Array.isArray(userAchievements)) {
            return null;
          }
          const userAchievement = userAchievements.find(existing => existing?.achievement_id === ua.achievement_id);
          return userAchievement?.achievement;
        }).filter(Boolean) as Achievement[];
        
        if (achievements.length > 0) {
          setPendingUnlocks(prev => [...prev, ...achievements]);
        }
        
        // Invalidate related queries
        queryClient.invalidateQueries({ 
          queryKey: ['userAchievements', user?.id] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['achievementProgress', user?.id] 
        });
      }
    },
    onError: (error) => {
      console.error('Failed to check achievements:', error);
    },
  });

  // Initialize achievements mutation
  const initializeAchievementsMutation = useMutation({
    mutationFn: AchievementService.initializeAchievements,
    onError: (error) => {
      console.error('Failed to initialize achievements:', error);
    },
  });

  // Check achievements automatically when stats change
  const checkAchievements = useCallback(
    (stats: UserPerformanceStats) => {
      if (autoCheck && user?.id && leagueId) {
        checkAchievementsMutation.mutate(stats);
      }
    },
    [autoCheck, user?.id, leagueId, checkAchievementsMutation]
  );

  // Show next pending unlock
  useEffect(() => {
    if (pendingUnlocks.length > 0 && !showUnlockModal) {
      const nextUnlock = pendingUnlocks[0];
      setCurrentUnlock(nextUnlock);
      setShowUnlockModal(true);
    }
  }, [pendingUnlocks, showUnlockModal]);

  // Handle unlock modal close
  const handleUnlockModalClose = useCallback(() => {
    setShowUnlockModal(false);
    setCurrentUnlock(null);
    
    // Remove the shown achievement from pending unlocks
    setPendingUnlocks(prev => prev.slice(1));
  }, []);

  // Share achievement
  const shareAchievement = useCallback(async (achievement: Achievement) => {
    // Implement sharing logic here
    // Could use expo-sharing or native sharing APIs
    console.log('Sharing achievement:', achievement.name);
  }, []);

  // Get achievement statistics
  const getAchievementStats = useCallback(() => {
    if (!userAchievements || !Array.isArray(userAchievements)) {
      return {
        total: 0,
        byCategory: {},
        recentUnlocks: [],
      };
    }
    
    const total = userAchievements.length;
    const byCategory = userAchievements.reduce((acc, ua) => {
      if (ua && ua.achievement && ua.achievement.category) {
        const category = ua.achievement.category;
        acc[category] = (acc[category] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const recentUnlocks = userAchievements
      .filter(ua => ua && ua.earned_at)
      .sort((a, b) => new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime())
      .slice(0, 5);

    return {
      total,
      byCategory,
      recentUnlocks,
    };
  }, [userAchievements]);

  // Initialize achievements on first load
  useEffect(() => {
    if (user?.id) {
      initializeAchievementsMutation.mutate();
    }
  }, [user?.id]);

  return {
    // Data
    userAchievements,
    achievementStats: getAchievementStats(),
    
    // Loading states
    isLoading: isLoadingUserAchievements,
    isCheckingAchievements: checkAchievementsMutation.isPending,
    
    // Errors
    error: userAchievementsError,
    
    // Actions
    checkAchievements,
    getAchievementProgress: (stats: UserPerformanceStats) => 
      queryClient.fetchQuery(getAchievementProgressQuery(stats)),
    
    // Unlock modal state
    showUnlockModal,
    currentUnlock,
    pendingUnlocks: pendingUnlocks.length,
    onUnlockModalClose: handleUnlockModalClose,
    onShareAchievement: shareAchievement,
    
    // Utilities
    hasAchievement: (achievementId: string) =>
      userAchievements.some(ua => ua.achievement_id === achievementId),
    
    getAchievementById: (achievementId: string) =>
      userAchievements.find(ua => ua.achievement_id === achievementId),
  };
};