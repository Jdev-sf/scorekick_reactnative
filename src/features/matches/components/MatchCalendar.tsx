import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useMatchesByRound } from '../hooks/useMatches';
import { MatchCard } from './MatchCard';
import type { Match } from '../types';

interface MatchCalendarProps {
  onMatchPress?: (match: Match) => void;
  initialRound?: number;
}

export function MatchCalendar({ onMatchPress, initialRound = 1 }: MatchCalendarProps) {
  const [selectedRound, setSelectedRound] = useState(initialRound);
  
  const { data: matches, isLoading, error } = useMatchesByRound(selectedRound);

  const renderRoundSelector = () => {
    const rounds = Array.from({ length: 38 }, (_, i) => i + 1);
    
    return (
      <View style={styles.roundSelector}>
        <Text style={styles.roundSelectorTitle}>Giornata</Text>
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
                selectedRound === round && styles.roundButtonActive,
              ]}
              onPress={() => setSelectedRound(round)}
            >
              <Text style={[
                styles.roundButtonText,
                selectedRound === round && styles.roundButtonTextActive,
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
          <ActivityIndicator size=\"large\" color=\"#3B82F6\" />
          <Text style={styles.loadingText}>Caricamento partite...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Errore nel caricamento delle partite</Text>
          <Text style={styles.errorSubtext}>
            {error instanceof Error ? error.message : 'Errore sconosciuto'}
          </Text>
        </View>
      );
    }

    if (!matches || matches.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>⚽</Text>
          <Text style={styles.emptyTitle}>Nessuna partita</Text>
          <Text style={styles.emptySubtext}>
            Non ci sono partite programmate per la giornata {selectedRound}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.matchesList}>
        <Text style={styles.matchesHeader}>
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
    <View style={styles.container}>
      {renderRoundSelector()}
      <ScrollView style={styles.content}>
        {renderMatches()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  roundSelector: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  roundSelectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
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
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    minWidth: 40,
    alignItems: 'center',
  },
  roundButtonActive: {
    backgroundColor: '#3B82F6',
  },
  roundButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  roundButtonTextActive: {
    color: '#FFFFFF',
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
    color: '#6B7280',
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
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#6B7280',
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
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  matchesList: {
    padding: 16,
  },
  matchesHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
});