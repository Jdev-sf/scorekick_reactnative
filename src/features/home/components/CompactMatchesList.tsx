import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useMatchesByRound } from '../../matches/hooks/useMatches';
import type { Match } from '../../matches/types';

interface CompactMatchesListProps {
  initialRound: number;
  onRoundChange?: (round: number) => void;
}

export const CompactMatchesList: React.FC<CompactMatchesListProps> = ({
  initialRound,
  onRoundChange,
}) => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [selectedRound, setSelectedRound] = useState(initialRound);
  
  const { data: matches = [], isLoading, error } = useMatchesByRound(selectedRound);

  const handleRoundPress = (round: number) => {
    setSelectedRound(round);
    onRoundChange?.(round);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    if (isToday) return 'Oggi';
    if (isTomorrow) return 'Dom';
    
    return date.toLocaleDateString('it-IT', { 
      weekday: 'short',
      day: 'numeric',
      month: 'numeric',
    });
  };

  const formatMatchTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('it-IT', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return colors.error;
      case 'completed': return colors.success;
      default: return colors.textSecondary;
    }
  };

  const getStatusText = (match: Match) => {
    switch (match.status) {
      case 'live': return 'LIVE';
      case 'completed': return 'FINITA';
      default: return formatMatchTime(match.match_date);
    }
  };

  const renderRoundSelector = () => {
    const rounds = Array.from({ length: 38 }, (_, i) => i + 1);
    
    return (
      <View style={styles.roundSelectorContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.roundSelector}
        >
          {rounds.map(round => (
            <TouchableOpacity
              key={round}
              style={[
                styles.roundButton,
                { 
                  backgroundColor: selectedRound === round ? colors.primary : colors.surface,
                  borderColor: selectedRound === round ? colors.primary : colors.border,
                }
              ]}
              onPress={() => handleRoundPress(round)}
            >
              <Text style={[
                styles.roundButtonText,
                { color: selectedRound === round ? '#FFFFFF' : colors.textPrimary }
              ]}>
                {round}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderMatch = (match: Match) => (
    <TouchableOpacity 
      key={match.id} 
      style={[styles.matchItem, { borderBottomColor: colors.border }]}
      onPress={() => navigation.navigate('MatchDetails' as never, { matchId: match.id } as never)}
    >
      <View style={styles.matchHeader}>
        <Text style={[styles.roundText, { color: colors.textSecondary }]}>
          G{match.round}
        </Text>
        <View style={styles.statusContainer}>
          <Text style={[styles.statusText, { color: getStatusColor(match.status) }]}>
            {getStatusText(match)}
          </Text>
          {match.status === 'live' && (
            <View style={[styles.liveDot, { backgroundColor: colors.error }]} />
          )}
        </View>
      </View>

      <View style={styles.matchContent}>
        <View style={styles.teamsContainer}>
          <View style={styles.teamRow}>
            <Text style={[styles.teamName, { color: colors.textPrimary }]} numberOfLines={1}>
              {match.home_team}
            </Text>
            {(match.status === 'completed' || match.status === 'live') && match.home_score !== null && (
              <Text style={[styles.score, { color: colors.textPrimary }]}>
                {match.home_score}
              </Text>
            )}
          </View>
          
          <View style={styles.teamRow}>
            <Text style={[styles.teamName, { color: colors.textPrimary }]} numberOfLines={1}>
              {match.away_team}
            </Text>
            {(match.status === 'completed' || match.status === 'live') && match.away_score !== null && (
              <Text style={[styles.score, { color: colors.textPrimary }]}>
                {match.away_score}
              </Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.dateContainer}>
        <Text style={[styles.dateText, { color: colors.textSecondary }]}>
          {formatTime(match.match_date)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Calendario Partite
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Giornata {selectedRound}
        </Text>
      </View>

      {/* Round Selector */}
      {renderRoundSelector()}

      {/* Matches List */}
      <View style={styles.matchesList}>
        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Caricamento partite...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.error }]}>
              Errore nel caricamento
            </Text>
          </View>
        ) : matches.length > 0 ? (
          matches.map(renderMatch)
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Nessuna partita per la giornata {selectedRound}
            </Text>
          </View>
        )}
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
    fontWeight: '500',
  },

  roundSelectorContainer: {
    paddingVertical: 12,
  },

  roundSelector: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },

  roundButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  roundButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  matchesList: {
    paddingBottom: 8,
  },

  matchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },

  matchHeader: {
    width: 60,
    alignItems: 'center',
  },

  roundText: {
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 4,
  },

  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },

  liveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginLeft: 4,
  },

  matchContent: {
    flex: 1,
    marginHorizontal: 12,
  },

  teamsContainer: {
    marginBottom: 8,
  },

  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },

  teamName: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },

  score: {
    fontSize: 14,
    fontWeight: 'bold',
    minWidth: 20,
    textAlign: 'right',
  },

  predictionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  predictionLabel: {
    fontSize: 10,
  },

  predictionScore: {
    fontSize: 11,
    fontWeight: '600',
  },

  pointsBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },

  pointsText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '600',
  },

  dateContainer: {
    width: 50,
    alignItems: 'center',
  },

  dateText: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },

  loadingState: {
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
    fontSize: 14,
  },
});