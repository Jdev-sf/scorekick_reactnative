import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useSerieAStandings } from '../hooks/useHomeData';
import { TYPOGRAPHY } from '../../../constants/theme';

export const SerieAStandingsCard: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { data: standings = [], isLoading } = useSerieAStandings();

  const handleViewAll = () => {
    navigation.navigate('SerieAStandings');
  };

  const topStandings = standings.slice(0, 5);

  const getPositionColor = (position: number) => {
    if (position <= 4) return colors.success; // Champions League (green)
    if (position <= 6) return colors.warning; // Europa League (orange)
    if (position >= 18) return colors.error; // Relegation (red)
    return colors.textPrimary;
  };

  const getPositionBadge = (position: number) => {
    if (position <= 4) return 'CL';
    if (position <= 6) return 'EL';
    if (position >= 18) return 'R';
    return null;
  };

  return (
    <View 
      className="mx-6 rounded-2xl overflow-hidden"
      style={{ backgroundColor: colors.surface }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 border-b"
            style={{ borderBottomColor: colors.border }}>
        <Text 
          className="font-bold"
          style={{ 
            color: colors.textPrimary,
            fontSize: TYPOGRAPHY.fontSizes.lg
          }}
        >
          Classifica Serie A
        </Text>
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
            Vedi tutto
          </Text>
        </TouchableOpacity>
      </View>

      {/* Standings List */}
      <View className="p-4">
        {isLoading ? (
          <View className="space-y-3">
            {[...Array(5)].map((_, index) => (
              <View key={index} className="flex-row items-center space-x-3">
                <View className="w-8 h-6 bg-gray-200 rounded" />
                <View className="flex-1 h-4 bg-gray-200 rounded" />
                <View className="w-8 h-4 bg-gray-200 rounded" />
                <View className="w-8 h-4 bg-gray-200 rounded" />
              </View>
            ))}
          </View>
        ) : topStandings.length === 0 ? (
          <Text 
            className="text-center py-8"
            style={{ color: colors.textSecondary }}
          >
            Dati non disponibili
          </Text>
        ) : (
          <View className="space-y-3">
            {topStandings.map((team, index) => {
              const position = index + 1;
              const positionBadge = getPositionBadge(position);
              const positionColor = getPositionColor(position);

              return (
                <View
                  key={team.id || index}
                  className="flex-row items-center p-3 rounded-xl"
                  style={{ backgroundColor: colors.background }}
                >
                  {/* Position with badge */}
                  <View className="w-12 items-center">
                    <View className="relative">
                      <Text 
                        className="font-bold"
                        style={{ 
                          color: positionColor,
                          fontSize: TYPOGRAPHY.fontSizes.base
                        }}
                      >
                        {position}
                      </Text>
                      {positionBadge && (
                        <View 
                          className="absolute -top-1 -right-3 px-1 py-0.5 rounded"
                          style={{ backgroundColor: positionColor }}
                        >
                          <Text 
                            className="text-white font-bold"
                            style={{ fontSize: 8 }}
                          >
                            {positionBadge}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Team Info */}
                  <View className="flex-1 ml-2">
                    <Text 
                      className="font-semibold"
                      style={{ 
                        color: colors.textPrimary,
                        fontSize: TYPOGRAPHY.fontSizes.base
                      }}
                      numberOfLines={1}
                    >
                      {team.name}
                    </Text>
                    <Text 
                      className="text-sm"
                      style={{ color: colors.textSecondary }}
                    >
                      {team.played || 0} partite
                    </Text>
                  </View>

                  {/* Goals */}
                  <View className="items-center mx-2">
                    <Text 
                      className="font-medium"
                      style={{ 
                        color: colors.textPrimary,
                        fontSize: TYPOGRAPHY.fontSizes.sm
                      }}
                    >
                      {team.goals_for || 0}-{team.goals_against || 0}
                    </Text>
                    <Text 
                      className="text-xs"
                      style={{ color: colors.textSecondary }}
                    >
                      diff {((team.goals_for || 0) - (team.goals_against || 0)) >= 0 ? '+' : ''}{(team.goals_for || 0) - (team.goals_against || 0)}
                    </Text>
                  </View>

                  {/* Points */}
                  <View className="items-center w-12">
                    <Text 
                      className="font-bold"
                      style={{ 
                        color: colors.primary,
                        fontSize: TYPOGRAPHY.fontSizes.lg
                      }}
                    >
                      {team.points || 0}
                    </Text>
                    <Text 
                      className="text-xs"
                      style={{ color: colors.textSecondary }}
                    >
                      pt
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Legend */}
      <View className="px-4 pb-4">
        <View className="flex-row justify-around pt-3 border-t" 
              style={{ borderTopColor: colors.border }}>
          <View className="items-center">
            <View 
              className="w-3 h-3 rounded-full mb-1"
              style={{ backgroundColor: colors.success }}
            />
            <Text 
              className="text-xs"
              style={{ color: colors.textSecondary }}
            >
              Champions
            </Text>
          </View>
          
          <View className="items-center">
            <View 
              className="w-3 h-3 rounded-full mb-1"
              style={{ backgroundColor: colors.warning }}
            />
            <Text 
              className="text-xs"
              style={{ color: colors.textSecondary }}
            >
              Europa
            </Text>
          </View>
          
          <View className="items-center">
            <View 
              className="w-3 h-3 rounded-full mb-1"
              style={{ backgroundColor: colors.error }}
            />
            <Text 
              className="text-xs"
              style={{ color: colors.textSecondary }}
            >
              Retrocessione
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};