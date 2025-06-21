import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLeagueStandings, useUserPosition } from '../hooks/useStandings';
import { getRoleInfo } from '../utils/permissions';
import type { LeagueStanding } from '../types';

interface LeagueStandingsProps {
  leagueId: string;
  showUserHighlight?: boolean;
  limit?: number;
}

interface StandingRowProps {
  standing: LeagueStanding;
  isCurrentUser?: boolean;
  onPress?: () => void;
}

function StandingRow({ standing, isCurrentUser = false, onPress }: StandingRowProps) {
  const getPositionStyle = (position: number) => {
    switch (position) {
      case 1:
        return { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }; // Gold
      case 2:
        return { backgroundColor: '#F3F4F6', borderColor: '#9CA3AF' }; // Silver
      case 3:
        return { backgroundColor: '#FEF2F2', borderColor: '#F87171' }; // Bronze
      default:
        return { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' };
    }
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${position}`;
    }
  };

  const positionStyle = getPositionStyle(standing.position);
  const winRate = standing.predictions_made > 0 
    ? Math.round((standing.correct_results / standing.predictions_made) * 100) 
    : 0;

  return (
    <TouchableOpacity
      style={[
        styles.standingRow,
        positionStyle,
        isCurrentUser && styles.currentUserRow,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.positionContainer}>
        <Text style={styles.positionText}>
          {getPositionIcon(standing.position)}
        </Text>
      </View>

      <View style={styles.userInfo}>
        <Text style={[styles.userName, isCurrentUser && styles.currentUserText]}>
          {standing.user?.display_name || 'Unknown User'}
        </Text>
        <Text style={styles.userStats}>
          {standing.predictions_made} predictions • {winRate}% success
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{standing.points}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{standing.exact_results}</Text>
          <Text style={styles.statLabel}>Exact</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function LeagueStandings({ leagueId, showUserHighlight = true, limit }: LeagueStandingsProps) {
  const { data: standings, isLoading, error } = useLeagueStandings(leagueId);
  const { data: userPosition } = useUserPosition(leagueId);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading standings...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load standings</Text>
      </View>
    );
  }

  if (!standings || standings.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📊</Text>
        <Text style={styles.emptyTitle}>No Standings Yet</Text>
        <Text style={styles.emptyText}>
          Standings will appear once members start making predictions
        </Text>
      </View>
    );
  }

  const displayStandings = limit ? standings.slice(0, limit) : standings;
  const userPositionNumber = userPosition?.position;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>League Standings</Text>
        {showUserHighlight && userPositionNumber && (
          <Text style={styles.userPositionText}>
            Your position: #{userPositionNumber}
          </Text>
        )}
      </View>

      <ScrollView style={styles.standingsList}>
        {displayStandings.map((standing) => (
          <StandingRow
            key={standing.user_id}
            standing={standing}
            isCurrentUser={showUserHighlight && standing.user_id === userPosition?.user_id}
          />
        ))}
      </ScrollView>

      {limit && standings.length > limit && (
        <View style={styles.showMoreContainer}>
          <Text style={styles.showMoreText}>
            Showing top {limit} of {standings.length} members
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    color: '#DC2626',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    color: '#6B7280',
    textAlign: 'center',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  userPositionText: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  standingsList: {
    flex: 1,
  },
  standingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
  },
  currentUserRow: {
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  positionContainer: {
    width: 40,
    alignItems: 'center',
  },
  positionText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  currentUserText: {
    color: '#3B82F6',
  },
  userStats: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    marginLeft: 16,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  showMoreContainer: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  showMoreText: {
    color: '#6B7280',
    fontSize: 14,
  },
});