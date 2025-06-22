import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSerieAStandings } from '../hooks/useMatches';
import { useSeasonContext } from '../contexts/SeasonContext';
import { SeasonSelector } from './SeasonSelector';
import { usePreciseBottomPadding } from '../../../hooks/useBottomTabBarHeight';
import type { SerieAStanding } from '../types';

// Hook per gestire il context opzionale
function useOptionalSeasonContext() {
  try {
    return useSeasonContext();
  } catch (error) {
    // Se non c'è il provider, restituisci valori di default
    return {
      selectedSeason: null,
      selectSeason: () => {},
      getSeasonDisplay: () => '',
      isCurrentSeasonSelected: true,
    };
  }
}

interface SerieAStandingsProps {
  onTeamPress?: (team: SerieAStanding) => void;
  onRefresh?: () => Promise<void>;
  refreshing?: boolean;
}

export function SerieAStandings({ onTeamPress, onRefresh, refreshing = false }: SerieAStandingsProps) {
  const { 
    selectedSeason, 
    selectSeason, 
    getSeasonDisplay,
    isCurrentSeasonSelected 
  } = useOptionalSeasonContext();
  
  const { data: standings, isLoading, error } = useSerieAStandings(
    selectedSeason?.year
  );
  
  const contentPadding = usePreciseBottomPadding();

  const getPositionColor = (position: number) => {
    if (position <= 4) return '#10B981'; // Champions League
    if (position <= 6) return '#F59E0B'; // Europa League
    if (position >= 18) return '#DC2626'; // Relegation
    return '#6B7280'; // Regular
  };

  const getPositionLabel = (position: number) => {
    if (position <= 4) return 'Champions League';
    if (position === 5) return 'Europa League';
    if (position === 6) return 'Conference League';
    if (position >= 18) return 'Retrocessione';
    return '';
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Classifica Serie A</Text>
        {!isCurrentSeasonSelected && selectedSeason && (
          <View style={styles.historicalBadge}>
            <Text style={styles.historicalBadgeText}>Storico</Text>
          </View>
        )}
      </View>
      
      {selectedSeason !== null && (
        <SeasonSelector
          selectedSeason={selectedSeason}
          onSeasonSelect={selectSeason}
          style={styles.seasonSelector}
        />
      )}
    </View>
  );

  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.headerCell, styles.positionCell]}>#</Text>
      <Text style={[styles.headerCell, styles.teamCell]}>Squadra</Text>
      <Text style={[styles.headerCell, styles.statCell]}>PG</Text>
      <Text style={[styles.headerCell, styles.statCell]}>V</Text>
      <Text style={[styles.headerCell, styles.statCell]}>N</Text>
      <Text style={[styles.headerCell, styles.statCell]}>P</Text>
      <Text style={[styles.headerCell, styles.statCell]}>GF</Text>
      <Text style={[styles.headerCell, styles.statCell]}>GS</Text>
      <Text style={[styles.headerCell, styles.statCell]}>DR</Text>
      <Text style={[styles.headerCell, styles.pointsCell]}>Pt</Text>
    </View>
  );

  const renderTeamRow = (team: SerieAStanding) => {
    const positionColor = getPositionColor(team.position);
    const positionLabel = getPositionLabel(team.position);

    const content = (
      <View style={styles.teamRow}>
        <View style={[styles.positionIndicator, { backgroundColor: positionColor }]} />
        <Text style={[styles.cell, styles.positionCell]}>{team.position}</Text>
        <View style={[styles.cell, styles.teamCell]}>
          <Text style={styles.teamName} numberOfLines={1}>
            {team.team_name}
          </Text>
          {positionLabel && (
            <Text style={[styles.positionLabel, { color: positionColor }]}>
              {positionLabel}
            </Text>
          )}
        </View>
        <Text style={[styles.cell, styles.statCell]}>{team.played}</Text>
        <Text style={[styles.cell, styles.statCell]}>{team.won}</Text>
        <Text style={[styles.cell, styles.statCell]}>{team.drawn}</Text>
        <Text style={[styles.cell, styles.statCell]}>{team.lost}</Text>
        <Text style={[styles.cell, styles.statCell]}>{team.goals_for}</Text>
        <Text style={[styles.cell, styles.statCell]}>{team.goals_against}</Text>
        <Text style={[styles.cell, styles.statCell]}>
          {team.goal_difference >= 0 ? '+' : ''}{team.goal_difference}
        </Text>
        <Text style={[styles.cell, styles.pointsCell, styles.pointsValue]}>
          {team.points}
        </Text>
      </View>
    );

    if (onTeamPress) {
      return (
        <TouchableOpacity key={team.id} onPress={() => onTeamPress(team)}>
          {content}
        </TouchableOpacity>
      );
    }

    return <View key={team.id}>{content}</View>;
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Caricamento classifica...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Errore nel caricamento della classifica</Text>
          <Text style={styles.errorSubtext}>
            {error instanceof Error ? error.message : 'Errore sconosciuto'}
          </Text>
        </View>
      </View>
    );
  }

  if (!standings || standings.length === 0) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>📊</Text>
          <Text style={styles.emptyTitle}>Classifica non disponibile</Text>
          <Text style={styles.emptySubtext}>
            I dati della classifica non sono ancora stati sincronizzati
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      <View style={styles.tableContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.table}>
            {renderTableHeader()}
            <ScrollView 
              style={styles.tableBody}
              contentContainerStyle={{
                paddingBottom: contentPadding
              }}
              refreshControl={
                onRefresh ? (
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={['#3B82F6']}
                    tintColor="#3B82F6"
                  />
                ) : undefined
              }
            >
              {standings.map(renderTeamRow)}
            </ScrollView>
          </View>
        </ScrollView>
      </View>
      
      <View style={styles.legend}>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.legendText}>Champions League</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
          <Text style={styles.legendText}>Europa/Conference League</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: '#DC2626' }]} />
          <Text style={styles.legendText}>Retrocessione</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  historicalBadge: {
    backgroundColor: '#FF9500',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  historicalBadgeText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '600',
  },
  seasonSelector: {
    marginTop: 8,
  },
  tableContainer: {
    flex: 1,
  },
  table: {
    minWidth: 800,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableBody: {
    flex: 1,
  },
  headerCell: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    position: 'relative',
  },
  positionIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  cell: {
    fontSize: 14,
    color: '#111827',
    textAlign: 'center',
  },
  positionCell: {
    width: 30,
    fontWeight: '600',
  },
  teamCell: {
    width: 150,
    alignItems: 'flex-start',
    paddingLeft: 8,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  positionLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  statCell: {
    width: 35,
  },
  pointsCell: {
    width: 40,
  },
  pointsValue: {
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 10,
    color: '#6B7280',
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
});