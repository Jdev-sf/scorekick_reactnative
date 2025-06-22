import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MatchCalendar } from '../components/MatchCalendar';
import { SerieAStandings } from '../components/SerieAStandings';
import { SeasonProvider, useSeasonContext } from '../contexts/SeasonContext';
import { useSyncData } from '../hooks/useMatches';
import type { Match } from '../types';

type TabType = 'calendar' | 'standings';

function MatchesScreenContent() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<TabType>('calendar');
  const syncDataMutation = useSyncData();
  const { selectedSeason, getSeasonDisplay } = useSeasonContext();

  const tabs = [
    { key: 'calendar', label: 'Calendario', icon: '📅' },
    { key: 'standings', label: 'Classifica', icon: '📊' },
  ];

  // Auto-sync on component mount (one time only)
  useEffect(() => {
    const autoSync = async () => {
      try {
        console.log('[MatchesScreen] Auto-syncing data...');
        await syncDataMutation.mutateAsync();
      } catch (error) {
        console.log('[MatchesScreen] Auto-sync failed, will rely on cached data:', error);
        // Fail silently - users will still see cached data
      }
    };

    // Auto-sync only on first mount
    autoSync();
  }, []);

  const handleMatchPress = (match: Match) => {
    navigation.navigate('MatchDetails', { match });
  };

  const handleRefresh = async () => {
    try {
      console.log('[MatchesScreen] Manual refresh triggered');
      await syncDataMutation.mutateAsync();
    } catch (error) {
      console.log('[MatchesScreen] Refresh failed:', error);
      // Fail silently for better UX
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'calendar':
        return (
          <MatchCalendar 
            onMatchPress={handleMatchPress} 
            onRefresh={handleRefresh}
            refreshing={syncDataMutation.isPending}
          />
        );
      case 'standings':
        return (
          <SerieAStandings 
            onRefresh={handleRefresh}
            refreshing={syncDataMutation.isPending}
          />
        );
      default:
        return (
          <MatchCalendar 
            onMatchPress={handleMatchPress} 
            onRefresh={handleRefresh}
            refreshing={syncDataMutation.isPending}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            Serie A {selectedSeason ? getSeasonDisplay(selectedSeason) : '2024-25'}
          </Text>
          {syncDataMutation.isPending && (
            <Text style={styles.syncStatus}>Aggiornando...</Text>
          )}
        </View>

        <View style={styles.tabBar}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabButton,
                activeTab === tab.key && styles.activeTabButton,
              ]}
              onPress={() => setActiveTab(tab.key as TabType)}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[
                styles.tabLabel,
                activeTab === tab.key && styles.activeTabLabel,
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.content}>
          {renderTabContent()}
        </View>
    </SafeAreaView>
  );
}

export function MatchesScreen() {
  return (
    <SeasonProvider autoSelectCurrent={true}>
      <MatchesScreenContent />
    </SeasonProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  syncStatus: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  tabIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  activeTabLabel: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
});