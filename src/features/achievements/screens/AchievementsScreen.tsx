import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolate
} from 'react-native-reanimated';
import { useRoundLeaderboard } from '../../leaderboards/hooks/useLeaderboards';
import { useAchievements } from '../hooks/useAchievements';
import { AchievementBadge } from '../components/AchievementBadge';
import { AchievementUnlockModal } from '../components/AchievementUnlockModal';
import { COLORS, SPACING, TYPOGRAPHY } from '../../../constants/theme';
import type { UserPerformanceStats } from '../../leaderboards/types';

interface AchievementsScreenProps {
  leagueId: string;
}

const { width } = Dimensions.get('window');

export const AchievementsScreen: React.FC<AchievementsScreenProps> = ({ leagueId }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [userStats, setUserStats] = useState<UserPerformanceStats | null>(null);

  const { 
    data: userPerformanceStats,
    isLoading: isLoadingUserStats,
    refetch: refetchStats 
  } = useRoundLeaderboard(leagueId, 1);

  const {
    userAchievements,
    achievementStats,
    isLoading,
    showUnlockModal,
    currentUnlock,
    onUnlockModalClose,
    onShareAchievement,
    getAchievementProgress,
  } = useAchievements({ leagueId });

  const [achievementProgress, setAchievementProgress] = React.useState<any>(null);

  // Load achievement progress when user stats are available
  React.useEffect(() => {
    if (userPerformanceStats && userPerformanceStats.entries && userPerformanceStats.entries.length > 0) {
      const stats = userPerformanceStats.entries[0];
      setUserStats(stats);
      getAchievementProgress(stats).then(setAchievementProgress);
    }
  }, [userPerformanceStats, getAchievementProgress]);

  const categories = [
    { key: 'all', label: 'All', icon: '🏆' },
    { key: 'milestone', label: 'Milestones', icon: '🎯' },
    { key: 'accuracy', label: 'Accuracy', icon: '🎯' },
    { key: 'streak', label: 'Streaks', icon: '🔥' },
    { key: 'participation', label: 'Activity', icon: '📅' },
    { key: 'special', label: 'Special', icon: '⭐' },
  ];

  const filteredAchievements = useMemo(() => {
    if (!achievementProgress?.progress) return [];
    
    return achievementProgress.progress.filter((item: any) => 
      selectedCategory === 'all' || item.achievement.category === selectedCategory
    );
  }, [achievementProgress, selectedCategory]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchStats();
    setRefreshing(false);
  };

  const progressIndicatorScale = useSharedValue(1);

  const progressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: progressIndicatorScale.value }],
  }));

  React.useEffect(() => {
    progressIndicatorScale.value = withSpring(1.1, { damping: 8 });
    setTimeout(() => {
      progressIndicatorScale.value = withSpring(1, { damping: 12 });
    }, 150);
  }, [achievementProgress?.earned]);

  if (isLoading || isLoadingUserStats) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#6b7280' }}>Loading achievements...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingVertical: 16, backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }}>
        <Text 
          style={{ fontWeight: 'bold', color: '#111827', marginBottom: 8, fontSize: TYPOGRAPHY.fontSizes['2xl'] }}
        >
          Achievements
        </Text>
        
        {/* Progress Overview */}
        <Animated.View style={[progressStyle]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#6B7280', marginBottom: 4 }}>
                Progress: {achievementProgress?.earned || 0} / {achievementProgress?.total || 0}
              </Text>
              <View style={{ backgroundColor: '#E5E7EB', borderRadius: 9999, height: 12, overflow: 'hidden' }}>
                <View 
                  style={{ 
                    height: '100%', 
                    backgroundColor: '#3B82F6', 
                    borderRadius: 9999,
                    width: `${achievementProgress?.total ? (achievementProgress.earned / achievementProgress.total) * 100 : 0}%` 
                  }}
                />
              </View>
            </View>
            
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24 }}>🏆</Text>
              <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                {Math.round(achievementProgress?.total ? (achievementProgress.earned / achievementProgress.total) * 100 : 0)}%
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={{ backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 12 }}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.key}
            onPress={() => setSelectedCategory(category.key)}
            style={{
              marginRight: 12,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 9999,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: selectedCategory === category.key ? '#3B82F6' : '#F3F4F6'
            }}
          >
            <Text style={{ fontSize: 14, marginRight: 8 }}>{category.icon}</Text>
            <Text 
              style={{
                fontWeight: '500',
                color: selectedCategory === category.key ? 'white' : '#374151',
                fontSize: TYPOGRAPHY.fontSizes.sm
              }}
              style={{ fontSize: TYPOGRAPHY.fontSizes.sm }}
            >
              {category.label}
            </Text>
            
            {/* Badge count */}
            {category.key !== 'all' && achievementStats.byCategory[category.key] && (
              <View style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: 4,
                backgroundColor: selectedCategory === category.key ? 'rgba(255,255,255,0.2)' : '#3B82F6'
              }}>
                <Text 
                  style={{
                    fontSize: 12,
                    fontWeight: 'bold',
                    color: 'white'
                  }}
                >
                  {achievementStats.byCategory[category.key] || 0}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Achievements Grid */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Stats Summary */}
        {userStats && (
          <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
            <Text 
              style={{ fontWeight: '600', color: '#111827', marginBottom: 12, fontSize: TYPOGRAPHY.fontSizes.lg }}
              style={{ fontSize: TYPOGRAPHY.fontSizes.lg }}
            >
              Your Stats
            </Text>
            
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              <View style={{ width: '50%', marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 14 }}>Total Points</Text>
                <Text style={{ fontWeight: 'bold', color: '#2563EB', fontSize: 20 }}>
                  {userStats.total_points}
                </Text>
              </View>
              
              <View style={{ width: '50%', marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 14 }}>Accuracy</Text>
                <Text style={{ fontWeight: 'bold', color: '#16A34A', fontSize: 20 }}>
                  {userStats.accuracy_percentage.toFixed(1)}%
                </Text>
              </View>
              
              <View style={{ width: '50%', marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 14 }}>Best Streak</Text>
                <Text style={{ fontWeight: 'bold', color: '#EA580C', fontSize: 20 }}>
                  {userStats.best_correct_streak}
                </Text>
              </View>
              
              <View style={{ width: '50%', marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 14 }}>Exact Scores</Text>
                <Text style={{ fontWeight: 'bold', color: '#9333EA', fontSize: 20 }}>
                  {userStats.exact_predictions}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Achievements Grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {filteredAchievements.map((item: any, index: number) => (
            <View 
              key={item.achievement.id} 
              style={{ width: '48%', marginBottom: 16 }}
            >
              <AchievementBadge
                achievement={item.achievement}
                earned={item.earned}
                progress={item.progress}
                currentValue={item.current_value}
                onPress={() => {
                  // Could show achievement details modal
                }}
              />
            </View>
          ))}
        </View>

        {filteredAchievements.length === 0 && (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 48 }}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>🏆</Text>
            <Text style={{ color: '#6B7280', textAlign: 'center' }}>
              No achievements in this category yet.
              {selectedCategory !== 'all' && '\nTry playing more matches to unlock them!'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Achievement Unlock Modal */}
      <AchievementUnlockModal
        visible={showUnlockModal}
        achievement={currentUnlock}
        onClose={onUnlockModalClose}
        onShare={() => currentUnlock && onShareAchievement(currentUnlock)}
      />
    </SafeAreaView>
  );
};