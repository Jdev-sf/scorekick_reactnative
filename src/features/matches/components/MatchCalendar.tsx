import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useMatchesByRound } from '../hooks/useMatches';
import { MatchCard } from './MatchCard';
import type { Match } from '../types';

interface MatchCalendarProps {
  onMatchPress?: (match: Match) => void;
  initialRound?: number;
  onRefresh?: () => Promise<void>;
  refreshing?: boolean;
}

export function MatchCalendar({ onMatchPress, initialRound = 1, onRefresh, refreshing = false }: MatchCalendarProps) {
  const { colors } = useTheme();
  const [selectedRound, setSelectedRound] = useState(initialRound);
  
  const { data: matches, isLoading, error } = useMatchesByRound(selectedRound);

  const renderRoundSelector = () => {
    const rounds = Array.from({ length: 38 }, (_, i) => i + 1);
    
    return (
      <View style={[styles.roundSelector, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.roundSelectorTitle, { color: colors.textPrimary }]}>Giornata</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.roundScrollContent}
        >
          {rounds.map((round) => (
            <TouchableOpacity
              key={round}
              style={[
                styles.roundButton,
                { backgroundColor: selectedRound === round ? colors.primary : colors.surface2 },
              ]}
              onPress={() => setSelectedRound(round)}
            >
              <Text style={[
                styles.roundButtonText,
                { color: selectedRound === round ? '#FFFFFF' : colors.textSecondary },
              ]}>
                {round}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderMatches = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Caricamento partite...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>Errore nel caricamento delle partite</Text>
          <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>
            {error instanceof Error ? error.message : 'Errore sconosciuto'}
          </Text>
        </View>
      );
    }

    if (!matches || matches.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>⚽</Text>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Nessuna partita</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Non ci sono partite programmate per la giornata {selectedRound}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.matchesList}>
        <Text style={[styles.matchesHeader, { color: colors.textPrimary }]}>
          Giornata {selectedRound} • {matches.length} partite
        </Text>
        {matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            onPress={() => onMatchPress?.(match)}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderRoundSelector()}
      <View style={styles.content}>
        {renderMatches()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  roundSelector: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  roundSelectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  roundScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  roundButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 40,
    alignItems: 'center',
  },
  roundButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    textAlign: 'center',
  },
  matchesList: {
    padding: 16,
  },
  matchesHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
});