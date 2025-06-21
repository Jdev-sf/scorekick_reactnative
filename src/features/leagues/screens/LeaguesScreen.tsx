import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useUserLeagues } from '../hooks/useLeagues';
import { Button } from '../../../components/ui/Button';
import type { LeaguesNavigationProp } from '../../../navigation/types';

export function LeaguesScreen() {
  const navigation = useNavigation<LeaguesNavigationProp>();
  const { data: leagues, isLoading, error, refetch } = useUserLeagues();
  const insets = useSafeAreaInsets();

  const handleCreateLeague = () => {
    navigation.navigate('CreateLeague');
  };

  const handleJoinLeague = () => {
    navigation.navigate('JoinLeague');
  };

  const handleLeaguePress = (leagueId: string) => {
    navigation.navigate('LeagueDetails', { leagueId });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading your leagues...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>
            Failed to load leagues: {error.message}
          </Text>
          <Button
            title="Try Again"
            onPress={() => refetch()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Leagues</Text>
        
        <View style={styles.buttonRow}>
          <Button
            title="Create League"
            onPress={handleCreateLeague}
          />
          <Button
            title="Join League"
            onPress={handleJoinLeague}
            variant="outline"
          />
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 60, 80) }}
      >
        {!leagues || leagues.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⚽</Text>
            <Text style={styles.emptyTitle}>No Leagues Yet</Text>
            <Text style={styles.emptyText}>
              Create your first league or join an existing one to start predicting match results!
            </Text>
            <View style={styles.emptyButtons}>
              <Button
                title="Create Your First League"
                onPress={handleCreateLeague}
              />
              <Button
                title="Join a League"
                onPress={handleJoinLeague}
                variant="outline"
              />
            </View>
          </View>
        ) : (
          <View style={styles.leaguesList}>
            {leagues.map((league) => (
              <TouchableOpacity
                key={league.id}
                onPress={() => handleLeaguePress(league.id)}
                style={styles.leagueCard}
                activeOpacity={0.7}
              >
                <View style={styles.leagueHeader}>
                  <Text style={styles.leagueName}>{league.name}</Text>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>Member</Text>
                  </View>
                </View>
                
                <View style={styles.leagueFooter}>
                  <Text style={styles.leagueInfo}>
                    {league._count?.count || 0} members • Code: {league.invite_code}
                  </Text>
                  <Text style={styles.points}>0 pts ›</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
  },
  errorText: {
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  header: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButtons: {
    width: '100%',
    gap: 12,
  },
  leaguesList: {
    padding: 24,
  },
  leagueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  leagueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  leagueName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  roleBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  roleText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  leagueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leagueInfo: {
    color: '#6B7280',
    fontSize: 14,
  },
  points: {
    color: '#2563EB',
    fontWeight: '500',
  },
});