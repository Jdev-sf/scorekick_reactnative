import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MatchCalendar } from '../components/MatchCalendar';
import { SerieAStandings } from '../components/SerieAStandings';
import { useSyncData } from '../hooks/useMatches';
import { Button } from '../../../components/ui/Button';
import type { Match } from '../types';

type TabType = 'calendar' | 'standings';

export function MatchesScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<TabType>('calendar');
  const syncDataMutation = useSyncData();

  const tabs = [
    { key: 'calendar', label: 'Calendario', icon: '📅' },
    { key: 'standings', label: 'Classifica', icon: '📊' },
  ];

  const handleMatchPress = (match: Match) => {
    navigation.navigate('MatchDetails', { match });
  };

  const handleSync = async () => {
    try {
      const result = await syncDataMutation.mutateAsync();
      
      Alert.alert(
        'Sincronizzazione Completata',
        `Aggiornate ${result.matchesUpdated} partite e ${result.standingsUpdated} posizioni in classifica.${
          result.errors.length > 0 ? `\\n\\nErrori: ${result.errors.length}` : ''
        }`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Errore Sincronizzazione',
        'Non è stato possibile sincronizzare i dati. Riprova più tardi.',
        [{ text: 'OK' }]
      );
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'calendar':
        return <MatchCalendar onMatchPress={handleMatchPress} />;
      case 'standings':
        return <SerieAStandings showSyncButton={false} />;
      default:
        return <MatchCalendar onMatchPress={handleMatchPress} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Serie A 2024/25</Text>
        <Button
          title={syncDataMutation.isPending ? 'Sincronizzando...' : '↻ Sync'}
          onPress={handleSync}
          disabled={syncDataMutation.isPending}
          variant=\"outline\"
          style={styles.syncButton}
        />
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
  syncButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
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