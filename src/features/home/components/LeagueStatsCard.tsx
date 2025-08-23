import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useSelectedLeague } from '../../../contexts/SelectedLeagueContext';
import { useUserPositionInLeague } from '../hooks/useHomeData';
import { AnimatedScore } from '../../../components/animations/AnimatedScore';
import { TYPOGRAPHY } from '../../../constants/theme';

export const LeagueStatsCard: React.FC = () => {
  const { colors } = useTheme();
  const { selectedLeague } = useSelectedLeague();
  const { data: userPosition, isLoading } = useUserPositionInLeague(selectedLeague?.id);

  if (!selectedLeague) {
    return (
      <View 
        className="mx-6 p-6 rounded-2xl"
        style={{ backgroundColor: colors.surface }}
      >
        <Text 
          className="text-center"
          style={{ color: colors.textSecondary }}
        >
          Seleziona una lega per vedere le tue statistiche
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View 
        className="mx-6 p-6 rounded-2xl"
        style={{ backgroundColor: colors.surface }}
      >
        <View className="flex-row justify-between items-center">
          <View className="flex-1 space-y-3">
            <View className="h-4 bg-gray-200 rounded w-20" />
            <View className="h-6 bg-gray-200 rounded w-16" />
          </View>
          <View className="flex-1 items-center space-y-3">
            <View className="h-4 bg-gray-200 rounded w-16" />
            <View className="h-6 bg-gray-200 rounded w-8" />
          </View>
          <View className="flex-1 items-end space-y-3">
            <View className="h-4 bg-gray-200 rounded w-20" />
            <View className="h-6 bg-gray-200 rounded w-12" />
          </View>
        </View>
      </View>
    );
  }

  const stats = userPosition?.stats;
  const position = userPosition?.position || 0;

  const getPositionSuffix = (pos: number) => {
    if (pos === 1) return '°';
    if (pos === 2) return '°';
    if (pos === 3) return '°';
    return '°';
  };

  const getPositionColor = (pos: number) => {
    if (pos === 1) return '#FFD700'; // Gold
    if (pos === 2) return '#C0C0C0'; // Silver
    if (pos === 3) return '#CD7F32'; // Bronze
    return colors.textPrimary;
  };

  return (
    <TouchableOpacity
      className="mx-6 p-6 rounded-2xl"
      style={{ backgroundColor: colors.surface }}
      accessible={true}
      accessibilityLabel={`Le tue statistiche in ${selectedLeague.name}`}
    >
      <Text 
        className="font-bold mb-4 text-center"
        style={{ 
          color: colors.textPrimary,
          fontSize: TYPOGRAPHY.fontSizes.lg
        }}
      >
        Le tue statistiche - {selectedLeague.name}
      </Text>

      <View className="flex-row justify-between items-center">
        {/* Punti */}
        <View className="flex-1 items-center">
          <Text 
            className="text-sm mb-2"
            style={{ color: colors.textSecondary }}
          >
            Punti
          </Text>
          <AnimatedScore
            score={stats?.total_points || 0}
            size="medium"
            color={colors.primary}
            animated={true}
          />
        </View>

        {/* Posizione */}
        <View className="flex-1 items-center">
          <Text 
            className="text-sm mb-2"
            style={{ color: colors.textSecondary }}
          >
            Posizione
          </Text>
          <View className="items-center">
            {position > 0 ? (
              <>
                <Text 
                  className="font-bold"
                  style={{ 
                    color: getPositionColor(position),
                    fontSize: TYPOGRAPHY.fontSizes['2xl']
                  }}
                >
                  {position}{getPositionSuffix(position)}
                </Text>
                {position <= 3 && (
                  <Text className="text-lg">
                    {position === 1 ? '🥇' : position === 2 ? '🥈' : '🥉'}
                  </Text>
                )}
              </>
            ) : (
              <Text 
                className="font-bold"
                style={{ 
                  color: colors.textSecondary,
                  fontSize: TYPOGRAPHY.fontSizes['2xl']
                }}
              >
                -
              </Text>
            )}
          </View>
        </View>

        {/* Accuratezza */}
        <View className="flex-1 items-center">
          <Text 
            className="text-sm mb-2"
            style={{ color: colors.textSecondary }}
          >
            Accuratezza
          </Text>
          <AnimatedScore
            score={stats?.accuracy_percentage || 0}
            size="medium"
            suffix="%"
            color={colors.success}
            animated={true}
          />
        </View>
      </View>

      {/* Additional Stats Row */}
      <View className="flex-row justify-between items-center mt-6 pt-4 border-t" 
            style={{ borderTopColor: colors.border }}>
        <View className="items-center">
          <Text 
            className="text-xs"
            style={{ color: colors.textSecondary }}
          >
            Previsioni
          </Text>
          <Text 
            className="font-semibold mt-1"
            style={{ color: colors.textPrimary }}
          >
            {stats?.total_predictions || 0}
          </Text>
        </View>

        <View className="items-center">
          <Text 
            className="text-xs"
            style={{ color: colors.textSecondary }}
          >
            Esatti
          </Text>
          <Text 
            className="font-semibold mt-1"
            style={{ color: colors.success }}
          >
            {stats?.exact_predictions || 0}
          </Text>
        </View>

        <View className="items-center">
          <Text 
            className="text-xs"
            style={{ color: colors.textSecondary }}
          >
            Serie
          </Text>
          <Text 
            className="font-semibold mt-1"
            style={{ color: colors.warning }}
          >
            {stats?.best_correct_streak || 0}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};