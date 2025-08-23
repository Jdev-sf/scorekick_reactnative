import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useSerieAStandings } from '../../matches/hooks/useMatches';
import type { SerieAStanding } from '../../matches/types';

export const ImprovedCompactSerieAStandings: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { data: standings, isLoading } = useSerieAStandings();

  const handleViewFullStandings = () => {
    navigation.navigate('Matches' as never, { 
      screen: 'MatchesOverview',
      params: { initialTab: 1 } // Index 1 = Classifica tab
    } as never);
  };

  const getPositionZone = (position: number) => {
    if (position <= 4) return 'champions';
    if (position <= 6) return 'europa';
    if (position >= 18) return 'relegation';
    return 'safe';
  };

  const getZoneColor = (zone: string) => {
    switch (zone) {
      case 'champions': return colors.success;
      case 'europa': return colors.warning;
      case 'relegation': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const getZoneIcon = (zone: string) => {
    switch (zone) {
      case 'champions': return '🟢';
      case 'europa': return '🟡';
      case 'relegation': return '🔴';
      default: return '⚪';
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Classifica Serie A
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Caricamento...
          </Text>
        </View>
      </View>
    );
  }

  if (!standings || standings.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Classifica Serie A
          </Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Classifica non disponibile
          </Text>
        </View>
      </View>
    );
  }

  const renderTeamRow = (team: SerieAStanding) => {
    const zone = getPositionZone(team.position);
    const zoneColor = getZoneColor(zone);
    const zoneIcon = getZoneIcon(zone);

    return (
      <View key={team.team_name} style={styles.teamRow}>
        <View style={styles.positionContainer}>
          <Text style={[styles.positionNumber, { color: zoneColor }]}>
            {team.position}
          </Text>
          <Text style={styles.zoneIcon}>{zoneIcon}</Text>
        </View>
        
        <Text style={[styles.teamName, { color: colors.textPrimary }]} numberOfLines={1}>
          {team.team_name}
        </Text>
        
        <View style={styles.statsContainer}>
          <Text style={[styles.points, { color: colors.textPrimary }]}>
            {team.points}
          </Text>
          <Text style={[styles.matches, { color: colors.textSecondary }]}>
            {team.played}
          </Text>
          <Text style={[
            styles.goalDiff, 
            { color: team.goal_difference >= 0 ? colors.success : colors.error }
          ]}>
            {team.goal_difference >= 0 ? '+' : ''}{team.goal_difference}
          </Text>
        </View>
      </View>
    );
  };

  // Show meaningful positions: top 6, user's favorite team zone, bottom 3
  const topTeams = standings.slice(0, 6);
  const bottomTeams = standings.slice(-3);
  
  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Classifica Serie A
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Stagione 2024-25
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.viewAllButton, { backgroundColor: colors.primary }]}
          onPress={handleViewFullStandings}
        >
          <Text style={styles.viewAllText}>Completa</Text>
        </TouchableOpacity>
      </View>

      {/* Header Row */}
      <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
        <View style={styles.headerPosContainer}>
          <Text style={[styles.headerText, { color: colors.textSecondary }]}>Pos</Text>
        </View>
        <Text style={[styles.headerTeamText, { color: colors.textSecondary }]}>Squadra</Text>
        <View style={styles.statsHeaderContainer}>
          <Text style={[styles.headerText, { color: colors.textSecondary }]}>Pt</Text>
          <Text style={[styles.headerText, { color: colors.textSecondary }]}>G</Text>
          <Text style={[styles.headerText, { color: colors.textSecondary }]}>±</Text>
        </View>
      </View>

      {/* Top Teams */}
      <View style={styles.teamsSection}>
        {topTeams.map(renderTeamRow)}
        
        {/* Separator */}
        <View style={styles.separator}>
          <View style={[styles.separatorLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.separatorText, { color: colors.textSecondary }]}>...</Text>
          <View style={[styles.separatorLine, { backgroundColor: colors.border }]} />
        </View>
        
        {/* Bottom Teams */}
        {bottomTeams.map(renderTeamRow)}
      </View>

      {/* Legend */}
      <View style={[styles.legend, { backgroundColor: colors.background }]}>
        <View style={styles.legendItem}>
          <Text style={styles.legendIcon}>🟢</Text>
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Champions</Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={styles.legendIcon}>🟡</Text>
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Europa</Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={styles.legendIcon}>🔴</Text>
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Serie B</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },

  title: {
    fontSize: 16,
    fontWeight: '600',
  },

  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },

  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },

  viewAllText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },

  headerPosContainer: {
    width: 40,
  },

  headerText: {
    fontSize: 11,
    fontWeight: '600',
  },

  headerTeamText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
    marginLeft: 8,
  },

  statsHeaderContainer: {
    flexDirection: 'row',
    width: 80,
    justifyContent: 'space-between',
  },

  teamsSection: {
    paddingBottom: 8,
  },

  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },

  positionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 40,
  },

  positionNumber: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 20,
  },

  zoneIcon: {
    fontSize: 8,
    marginLeft: 4,
  },

  teamName: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    marginLeft: 8,
  },

  statsContainer: {
    flexDirection: 'row',
    width: 80,
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  points: {
    fontSize: 12,
    fontWeight: '700',
    minWidth: 20,
    textAlign: 'center',
  },

  matches: {
    fontSize: 11,
    minWidth: 20,
    textAlign: 'center',
  },

  goalDiff: {
    fontSize: 11,
    fontWeight: '600',
    minWidth: 25,
    textAlign: 'center',
  },

  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  separatorLine: {
    flex: 1,
    height: 1,
  },

  separatorText: {
    marginHorizontal: 12,
    fontSize: 12,
    fontWeight: 'bold',
  },

  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  legendIcon: {
    fontSize: 8,
    marginRight: 4,
  },

  legendText: {
    fontSize: 9,
  },

  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },

  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  },

  emptyState: {
    padding: 32,
    alignItems: 'center',
  },

  emptyText: {
    textAlign: 'center',
    fontSize: 14,
  },
});