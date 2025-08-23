import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useSelectedLeague } from '../../../contexts/SelectedLeagueContext';
import { useLeagueStandings } from '../hooks/useHomeData';
import { useAuth } from '../../auth/hooks/useAuth';
import { TYPOGRAPHY } from '../../../constants/theme';

export const LeagueStandingsCard: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { selectedLeague } = useSelectedLeague();
  const { data: standings = [], isLoading } = useLeagueStandings(selectedLeague?.id);

  const handleViewAll = () => {
    if (selectedLeague) {
      navigation.navigate('LeagueDetails', { leagueId: selectedLeague.id });
    }
  };

  const getPositionIcon = (position: number) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return null;
  };

  const topStandings = standings.slice(0, 5);

  if (!selectedLeague) {
    return null;
  }

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
          Classifica - {selectedLeague.name}
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
                <View className="w-12 h-4 bg-gray-200 rounded" />
              </View>
            ))}
          </View>
        ) : topStandings.length === 0 ? (
          <Text 
            className="text-center py-8"
            style={{ color: colors.textSecondary }}
          >
            Nessun dato disponibile
          </Text>
        ) : (
          <View className="space-y-3">
            {topStandings.map((standing, index) => {
              const position = index + 1;
              const isCurrentUser = standing.user_id === user?.id;
              const positionIcon = getPositionIcon(position);

              return (
                <View
                  key={standing.user_id}
                  className={`
                    flex-row items-center p-3 rounded-xl
                    ${isCurrentUser ? 'border-2' : ''}
                  `}
                  style={{
                    backgroundColor: isCurrentUser 
                      ? colors.primary + '10' 
                      : colors.background,
                    borderColor: isCurrentUser ? colors.primary : 'transparent'
                  }}
                >
                  {/* Position */}
                  <View className="w-8 items-center">
                    {positionIcon ? (
                      <Text className="text-lg">{positionIcon}</Text>
                    ) : (
                      <Text 
                        className="font-bold"
                        style={{ 
                          color: isCurrentUser ? colors.primary : colors.textSecondary,
                          fontSize: TYPOGRAPHY.fontSizes.base
                        }}
                      >
                        {position}
                      </Text>
                    )}
                  </View>

                  {/* User Info */}
                  <View className="flex-1 ml-3">
                    <Text 
                      className={`font-semibold ${isCurrentUser ? 'font-bold' : ''}`}
                      style={{ 
                        color: isCurrentUser ? colors.primary : colors.textPrimary,
                        fontSize: TYPOGRAPHY.fontSizes.base
                      }}
                      numberOfLines={1}
                    >
                      {standing.user_name || 'Utente'}
                      {isCurrentUser && ' (Tu)'}
                    </Text>
                    <Text 
                      className="text-sm"
                      style={{ color: colors.textSecondary }}
                    >
                      {standing.total_predictions} previsioni • {standing.accuracy_percentage.toFixed(1)}% accuratezza
                    </Text>
                  </View>

                  {/* Points */}
                  <View className="items-end">
                    <Text 
                      className="font-bold"
                      style={{ 
                        color: isCurrentUser ? colors.primary : colors.textPrimary,
                        fontSize: TYPOGRAPHY.fontSizes.lg
                      }}
                    >
                      {standing.total_points}
                    </Text>
                    <Text 
                      className="text-xs"
                      style={{ color: colors.textSecondary }}
                    >
                      punti
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
};