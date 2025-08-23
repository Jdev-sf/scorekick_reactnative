import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useSelectedLeague } from '../../../contexts/SelectedLeagueContext';
import { useUserLeagues, useUserPositionInLeague } from '../hooks/useHomeData';
import { TYPOGRAPHY } from '../../../constants/theme';
import type { League } from '../../leagues/types';

export const OtherLeaguesCard: React.FC = () => {
  const { colors } = useTheme();
  const { selectedLeague, setSelectedLeague } = useSelectedLeague();
  const { data: userLeagues = [] } = useUserLeagues();

  // Filter out the currently selected league
  const otherLeagues = userLeagues.filter(league => league.id !== selectedLeague?.id);

  if (otherLeagues.length === 0) {
    return null;
  }

  const handleLeagueSwitch = (league: League) => {
    setSelectedLeague(league);
  };

  return (
    <View 
      className="mx-6 rounded-2xl overflow-hidden"
      style={{ backgroundColor: colors.surface }}
    >
      {/* Header */}
      <View className="p-4 border-b" style={{ borderBottomColor: colors.border }}>
        <Text 
          className="font-bold"
          style={{ 
            color: colors.textPrimary,
            fontSize: TYPOGRAPHY.fontSizes.lg
          }}
        >
          Altre tue leghe
        </Text>
        <Text 
          className="text-sm mt-1"
          style={{ color: colors.textSecondary }}
        >
          Tocca per cambiare lega attiva
        </Text>
      </View>

      {/* Other Leagues List */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}
        className="space-x-3"
      >
        {otherLeagues.map((league) => (
          <OtherLeagueItem
            key={league.id}
            league={league}
            onPress={() => handleLeagueSwitch(league)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

interface OtherLeagueItemProps {
  league: League;
  onPress: () => void;
}

const OtherLeagueItem: React.FC<OtherLeagueItemProps> = ({ league, onPress }) => {
  const { colors } = useTheme();
  const { data: userPosition } = useUserPositionInLeague(league.id);

  return (
    <TouchableOpacity
      onPress={onPress}
      className="w-40 p-4 rounded-2xl border"
      style={{ 
        backgroundColor: colors.background,
        borderColor: colors.border
      }}
      accessible={true}
      accessibilityLabel={`Cambia a lega ${league.name}`}
      accessibilityRole="button"
    >
      {/* League Name */}
      <Text 
        className="font-semibold mb-2"
        style={{ 
          color: colors.textPrimary,
          fontSize: TYPOGRAPHY.fontSizes.base
        }}
        numberOfLines={1}
      >
        {league.name}
      </Text>

      {/* Stats */}
      <View className="space-y-2">
        <View className="flex-row justify-between items-center">
          <Text 
            className="text-xs"
            style={{ color: colors.textSecondary }}
          >
            Posizione
          </Text>
          <Text 
            className="font-medium"
            style={{ color: colors.textPrimary }}
          >
            {userPosition?.position ? `${userPosition.position}°` : '-'}
          </Text>
        </View>

        <View className="flex-row justify-between items-center">
          <Text 
            className="text-xs"
            style={{ color: colors.textSecondary }}
          >
            Punti
          </Text>
          <Text 
            className="font-medium"
            style={{ color: colors.primary }}
          >
            {userPosition?.stats?.total_points || 0}
          </Text>
        </View>

        <View className="flex-row justify-between items-center">
          <Text 
            className="text-xs"
            style={{ color: colors.textSecondary }}
          >
            Accuratezza
          </Text>
          <Text 
            className="font-medium"
            style={{ color: colors.success }}
          >
            {userPosition?.stats?.accuracy_percentage?.toFixed(1) || 0}%
          </Text>
        </View>
      </View>

      {/* Members count */}
      <View className="mt-3 pt-3 border-t" style={{ borderTopColor: colors.border }}>
        <Text 
          className="text-xs text-center"
          style={{ color: colors.textSecondary }}
        >
          {league.member_count} membri
        </Text>
      </View>
    </TouchableOpacity>
  );
};