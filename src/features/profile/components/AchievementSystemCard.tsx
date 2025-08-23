import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAchievements } from '../../achievements/hooks/useAchievements';
import { useSelectedLeague } from '../../../contexts/SelectedLeagueContext';
import { AchievementBadge } from '../../achievements/components/AchievementBadge';
import { TYPOGRAPHY } from '../../../constants/theme';

export const AchievementSystemCard: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { selectedLeague } = useSelectedLeague();
  const { userAchievements, achievementStats } = useAchievements({ leagueId: selectedLeague?.id });

  const handleViewAll = () => {
    navigation.navigate('Achievements');
  };

  // Get recent achievements (last 6)
  const recentAchievements = userAchievements.slice(0, 6);

  // Mock progress achievements for demo
  const mockProgressAchievements = [
    {
      id: 'progress-1',
      name: 'Century Club',
      description: 'Reach 100 total points',
      icon: '💯',
      category: 'milestone',
      condition_value: 100,
      current_value: 75,
      progress: 75,
      earned: false,
    },
    {
      id: 'progress-2',
      name: 'Sharp Shooter',
      description: 'Achieve 70% accuracy',
      icon: '🎯',
      category: 'accuracy',
      condition_value: 70,
      current_value: 65.5,
      progress: 93.6,
      earned: false,
    }
  ];

  return (
    <View 
      className="mx-6 rounded-2xl overflow-hidden"
      style={{ backgroundColor: colors.surface }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 border-b"
            style={{ borderBottomColor: colors.border }}>
        <View>
          <Text 
            className="font-bold"
            style={{ 
              color: colors.textPrimary,
              fontSize: TYPOGRAPHY.fontSizes.lg
            }}
          >
            Achievement System
          </Text>
          <Text 
            className="text-sm"
            style={{ color: colors.textSecondary }}
          >
            {achievementStats.total} sbloccati • {achievementStats.byCategory.milestone || 0} milestone
          </Text>
        </View>
        
        <TouchableOpacity
          onPress={handleViewAll}
          className="px-3 py-1 rounded-full"
          style={{ backgroundColor: colors.primary + '20' }}
        >
          <Text 
            className="font-medium"
            style={{ 
              color: colors.primary,
              fontSize: TYPOGRAPHY.fontSizes.sm
            }}
          >
            Vedi tutti
          </Text>
        </TouchableOpacity>
      </View>

      {/* Achievement Categories Summary */}
      <View className="p-4 border-b" style={{ borderBottomColor: colors.border }}>
        <View className="flex-row justify-between">
          {[
            { key: 'milestone', label: 'Milestone', icon: '🎯', color: colors.primary },
            { key: 'accuracy', label: 'Accuratezza', icon: '🎪', color: colors.success },
            { key: 'streak', label: 'Serie', icon: '🔥', color: colors.warning },
            { key: 'special', label: 'Speciali', icon: '⭐', color: colors.secondary },
          ].map((category) => (
            <View key={category.key} className="items-center flex-1">
              <Text className="text-lg mb-1">{category.icon}</Text>
              <Text 
                className="font-bold"
                style={{ 
                  color: category.color,
                  fontSize: TYPOGRAPHY.fontSizes.base
                }}
              >
                {achievementStats.byCategory[category.key] || 0}
              </Text>
              <Text 
                className="text-xs"
                style={{ color: colors.textSecondary }}
              >
                {category.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <View className="p-4 border-b" style={{ borderBottomColor: colors.border }}>
          <Text 
            className="font-semibold mb-3"
            style={{ 
              color: colors.textPrimary,
              fontSize: TYPOGRAPHY.fontSizes.base
            }}
          >
            Sbloccati di Recente
          </Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 16 }}
          >
            <View className="flex-row space-x-3">
              {recentAchievements.map((userAchievement) => (
                <View key={userAchievement.achievement_id} className="w-24">
                  <AchievementBadge
                    achievement={userAchievement.achievement}
                    earned={true}
                  />
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* In Progress Achievements */}
      <View className="p-4">
        <Text 
          className="font-semibold mb-3"
          style={{ 
            color: colors.textPrimary,
            fontSize: TYPOGRAPHY.fontSizes.base
          }}
        >
          In Progresso
        </Text>
        
        <View className="space-y-3">
          {mockProgressAchievements.map((achievement) => (
            <View 
              key={achievement.id}
              className="p-3 rounded-xl"
              style={{ backgroundColor: colors.background }}
            >
              <View className="flex-row items-center space-x-3">
                <Text className="text-xl">{achievement.icon}</Text>
                
                <View className="flex-1">
                  <Text 
                    className="font-medium"
                    style={{ 
                      color: colors.textPrimary,
                      fontSize: TYPOGRAPHY.fontSizes.sm
                    }}
                  >
                    {achievement.name}
                  </Text>
                  <Text 
                    className="text-xs"
                    style={{ color: colors.textSecondary }}
                  >
                    {achievement.current_value} / {achievement.condition_value}
                  </Text>
                </View>
                
                <Text 
                  className="text-xs font-medium"
                  style={{ color: colors.primary }}
                >
                  {Math.round(achievement.progress)}%
                </Text>
              </View>
              
              {/* Progress Bar */}
              <View 
                className="mt-2 h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: colors.border }}
              >
                <View 
                  className="h-full rounded-full"
                  style={{ 
                    width: `${Math.min(achievement.progress, 100)}%`,
                    backgroundColor: colors.primary
                  }}
                />
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};