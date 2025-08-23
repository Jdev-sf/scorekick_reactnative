import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useUpcomingMatches } from '../hooks/useHomeData';
import { TYPOGRAPHY } from '../../../constants/theme';

export const UpcomingMatchesCard: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { data: matches = [], isLoading } = useUpcomingMatches();

  const handleViewCalendar = () => {
    navigation.navigate('Matches');
  };

  const getTimeUntilDeadline = (deadline: string) => {
    const now = new Date().getTime();
    const deadlineTime = new Date(deadline).getTime();
    const timeDiff = deadlineTime - now;
    
    if (timeDiff <= 0) return { text: 'Scaduto', color: colors.error };
    
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours < 1) {
      return { 
        text: `${minutes}m rimanenti`, 
        color: colors.error 
      };
    } else if (hours < 3) {
      return { 
        text: `${hours}h ${minutes}m rimanenti`, 
        color: colors.warning 
      };
    } else {
      return { 
        text: `${hours}h ${minutes}m rimanenti`, 
        color: colors.success 
      };
    }
  };

  const formatMatchTime = (datetime: string) => {
    const date = new Date(datetime);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    const timeString = date.toLocaleTimeString('it-IT', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    if (isToday) return `Oggi ${timeString}`;
    if (isTomorrow) return `Domani ${timeString}`;
    
    return `${date.toLocaleDateString('it-IT', { 
      day: '2-digit', 
      month: '2-digit' 
    })} ${timeString}`;
  };

  // Filter matches with upcoming deadlines (within 24 hours)
  const urgentMatches = matches.filter(match => {
    const now = new Date().getTime();
    const deadlineTime = new Date(match.prediction_deadline).getTime();
    const timeDiff = deadlineTime - now;
    return timeDiff > 0 && timeDiff <= 24 * 60 * 60 * 1000; // Within 24 hours
  }).slice(0, 3);

  if (urgentMatches.length === 0) {
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
        <View>
          <Text 
            className="font-bold"
            style={{ 
              color: colors.textPrimary,
              fontSize: TYPOGRAPHY.fontSizes.lg
            }}
          >
            Prossime Partite
          </Text>
          <Text 
            className="text-sm"
            style={{ color: colors.textSecondary }}
          >
            Deadline in scadenza
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleViewCalendar}
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
            Calendario
          </Text>
        </TouchableOpacity>
      </View>

      {/* Matches List */}
      <View className="p-4">
        {isLoading ? (
          <View className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <View key={index} className="space-y-2">
                <View className="flex-row items-center space-x-3">
                  <View className="flex-1 h-4 bg-gray-200 rounded" />
                  <View className="w-16 h-4 bg-gray-200 rounded" />
                </View>
                <View className="h-3 bg-gray-200 rounded w-24" />
              </View>
            ))}
          </View>
        ) : (
          <View className="space-y-4">
            {urgentMatches.map((match) => {
              const timeUntilDeadline = getTimeUntilDeadline(match.prediction_deadline);
              
              return (
                <TouchableOpacity
                  key={match.id}
                  className="p-3 rounded-xl border"
                  style={{ 
                    backgroundColor: colors.background,
                    borderColor: timeUntilDeadline.color + '40'
                  }}
                  onPress={() => navigation.navigate('MatchDetails', { matchId: match.id })}
                >
                  {/* Teams */}
                  <View className="flex-row items-center justify-between mb-2">
                    <Text 
                      className="font-semibold flex-1"
                      style={{ 
                        color: colors.textPrimary,
                        fontSize: TYPOGRAPHY.fontSizes.base
                      }}
                      numberOfLines={1}
                    >
                      {match.home_team} vs {match.away_team}
                    </Text>
                  </View>

                  {/* Match Time */}
                  <Text 
                    className="text-sm mb-2"
                    style={{ color: colors.textSecondary }}
                  >
                    📅 {formatMatchTime(match.datetime)}
                  </Text>

                  {/* Deadline Countdown */}
                  <View className="flex-row items-center justify-between">
                    <Text 
                      className="text-sm"
                      style={{ color: colors.textSecondary }}
                    >
                      ⏰ Deadline previsioni:
                    </Text>
                    <View 
                      className="px-2 py-1 rounded-full"
                      style={{ backgroundColor: timeUntilDeadline.color + '20' }}
                    >
                      <Text 
                        className="font-medium text-xs"
                        style={{ color: timeUntilDeadline.color }}
                      >
                        {timeUntilDeadline.text}
                      </Text>
                    </View>
                  </View>

                  {/* Prediction Status */}
                  {match.user_prediction ? (
                    <View className="mt-2 pt-2 border-t" 
                          style={{ borderTopColor: colors.border }}>
                      <Text 
                        className="text-sm"
                        style={{ color: colors.success }}
                      >
                        ✅ Previsione inserita: {match.user_prediction.home_score}-{match.user_prediction.away_score}
                      </Text>
                    </View>
                  ) : (
                    <View className="mt-2 pt-2 border-t" 
                          style={{ borderTopColor: colors.border }}>
                      <Text 
                        className="text-sm"
                        style={{ color: colors.warning }}
                      >
                        ⚠️ Previsione mancante - Tocca per inserire
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
};