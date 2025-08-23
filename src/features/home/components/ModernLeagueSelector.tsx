import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import type { League } from '../../leagues/types';

const { width: screenWidth } = Dimensions.get('window');

interface ModernLeagueSelectorProps {
  leagues: League[];
  selectedLeague?: League | null;
  onLeagueSelect: (league: League) => void;
  userPosition?: number;
  userPoints?: number;
}

export const ModernLeagueSelector: React.FC<ModernLeagueSelectorProps> = ({
  leagues,
  selectedLeague,
  onLeagueSelect,
  userPosition,
  userPoints,
}) => {
  const { colors } = useTheme();

  const renderLeagueChip = (league: League) => {
    const isSelected = selectedLeague?.id === league.id;

    return (
      <TouchableOpacity
        key={league.id}
        style={[
          styles.chipContainer,
          {
            backgroundColor: isSelected ? colors.primary : colors.surface,
            borderColor: isSelected ? colors.primary : colors.border,
          }
        ]}
        onPress={() => {
          console.log('League selected:', league.name);
          onLeagueSelect(league);
        }}
        activeOpacity={0.8}
      >
        <Text style={[
          styles.chipText,
          { color: isSelected ? '#FFFFFF' : colors.textPrimary }
        ]} numberOfLines={1}>
          {league.name}
        </Text>
        {isSelected && userPosition && (
          <View style={styles.chipBadge}>
            <Text style={[styles.chipBadgeText, { color: isSelected ? colors.primary : '#FFFFFF' }]}>
              {userPosition}°
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (leagues.length === 0) {
    return (
      <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Nessuna lega disponibile
        </Text>
      </View>
    );
  }

  // Sempre mostra il selettore anche con una sola lega per debug
  // if (leagues.length === 1) {
  //   return (
  //     <View style={styles.singleLeague}>
  //       {renderLeagueCard(leagues[0])}
  //     </View>
  //   );
  // }

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        Le tue leghe
      </Text>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipScrollContent}
        decelerationRate="fast"
      >
        {leagues.map(renderLeagueChip)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },

  scrollContent: {
    paddingHorizontal: 16,
  },

  chipScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },

  chipContainer: {
    width: screenWidth - 48, // Stessa larghezza delle card originali
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  chipText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },

  chipBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
    alignItems: 'center',
  },

  chipBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },

  leagueCard: {
    width: screenWidth - 48, // Screen width minus padding (16*2) and margins (8*2)
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginHorizontal: 8,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  leagueName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },

  selectedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  selectedBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },

  cardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  statItem: {
    alignItems: 'center',
  },

  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  statLabel: {
    fontSize: 9,
    fontWeight: '500',
    marginTop: 1,
  },

  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },

  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  emptyState: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    borderStyle: 'dashed',
  },

  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },

  singleLeague: {
    alignItems: 'center',
  },
});