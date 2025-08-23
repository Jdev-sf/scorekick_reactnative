import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useUserStats } from '../../home/hooks/useHomeData';
import { AnimatedScore } from '../../../components/animations/AnimatedScore';
import { TYPOGRAPHY } from '../../../constants/theme';

export const GeneralStatsCard: React.FC = () => {
  const { colors } = useTheme();
  const { data: userStats, isLoading } = useUserStats();

  if (isLoading) {
    return (
      <View 
        className="mx-6 p-6 rounded-2xl"
        style={{ backgroundColor: colors.surface }}
      >
        <Text 
          className="font-bold mb-4"
          style={{ 
            color: colors.textPrimary,
            fontSize: TYPOGRAPHY.fontSizes.lg
          }}
        >
          Statistiche Generali
        </Text>
        
        <View className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, index) => (
            <View key={index} className="items-center p-4">
              <View className="w-16 h-8 bg-gray-200 rounded mb-2" />
              <View className="w-20 h-4 bg-gray-200 rounded" />
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (!userStats) {
    return (
      <View 
        className="mx-6 p-6 rounded-2xl"
        style={{ backgroundColor: colors.surface }}
      >
        <Text 
          className="font-bold mb-4"
          style={{ 
            color: colors.textPrimary,
            fontSize: TYPOGRAPHY.fontSizes.lg
          }}
        >
          Statistiche Generali
        </Text>
        
        <Text 
          className="text-center py-8"
          style={{ color: colors.textSecondary }}
        >
          Nessun dato disponibile
        </Text>
      </View>
    );
  }

  const stats = [
    {
      label: 'Punti Totali',
      value: userStats.totalPoints,
      color: colors.primary,
      suffix: '',
      icon: '🎯'
    },
    {
      label: 'Risultati Esatti',
      value: userStats.totalExactPredictions,
      color: colors.success,
      suffix: '',
      icon: '🎪'
    },
    {
      label: 'Accuratezza',
      value: userStats.accuracyPercentage,
      color: colors.warning,
      suffix: '%',
      icon: '📊'
    },
    {
      label: 'Leghe Attive',
      value: userStats.activeLeagues,
      color: colors.secondary,
      suffix: '',
      icon: '🏆'
    }
  ];

  return (
    <View 
      className="mx-6 p-6 rounded-2xl"
      style={{ backgroundColor: colors.surface }}
    >
      <Text 
        className="font-bold mb-6"
        style={{ 
          color: colors.textPrimary,
          fontSize: TYPOGRAPHY.fontSizes.lg
        }}
      >
        Statistiche Generali
      </Text>
      
      <View className="flex-row flex-wrap">
        {stats.map((stat, index) => (
          <View key={index} className="w-1/2 mb-6">
            <View className="items-center p-4">
              {/* Icon */}
              <Text className="text-2xl mb-2">{stat.icon}</Text>
              
              {/* Value */}
              <AnimatedScore
                score={stat.value}
                size="medium"
                suffix={stat.suffix}
                color={stat.color}
                animated={true}
              />
              
              {/* Label */}
              <Text 
                className="text-center mt-2"
                style={{ 
                  color: colors.textSecondary,
                  fontSize: TYPOGRAPHY.fontSizes.sm
                }}
              >
                {stat.label}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Additional Info */}
      <View className="pt-4 border-t" style={{ borderTopColor: colors.border }}>
        <View className="flex-row justify-between items-center">
          <Text 
            className="text-sm"
            style={{ color: colors.textSecondary }}
          >
            Previsioni Totali
          </Text>
          <Text 
            className="font-semibold"
            style={{ color: colors.textPrimary }}
          >
            {userStats.totalPredictions}
          </Text>
        </View>
        
        <View className="flex-row justify-between items-center mt-2">
          <Text 
            className="text-sm"
            style={{ color: colors.textSecondary }}
          >
            Media Punti per Lega
          </Text>
          <Text 
            className="font-semibold"
            style={{ color: colors.textPrimary }}
          >
            {userStats.activeLeagues > 0 
              ? Math.round(userStats.totalPoints / userStats.activeLeagues)
              : 0}
          </Text>
        </View>
      </View>
    </View>
  );
};