import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLeagueStatsSummary } from '../hooks/useStandings';

interface LeagueStatsSummaryProps {
  leagueId: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
}

function StatCard({ title, value, subtitle, icon }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      {icon && <Text style={styles.statIcon}>{icon}</Text>}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );
}

export function LeagueStatsSummary({ leagueId }: LeagueStatsSummaryProps) {
  const { data: summary, isLoading, error } = useLeagueStatsSummary(leagueId);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading stats...</Text>
      </View>
    );
  }

  if (error || !summary) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load league stats</Text>
      </View>
    );
  }

  const { league, stats, topPerformers } = summary;
  const leagueAge = Math.ceil(
    (new Date().getTime() - new Date(league.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.leagueName}>{league.name}</Text>
        <Text style={styles.leagueInfo}>
          Created by {league.creator_name} • {leagueAge} days ago
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          icon="👥"
          title="Members"
          value={stats.totalMembers}
          subtitle="Active participants"
        />
        <StatCard
          icon="🎯"
          title="Predictions"
          value={stats.totalPredictions}
          subtitle="Total made"
        />
        <StatCard
          icon="⭐"
          title="Avg Points"
          value={stats.averagePoints}
          subtitle="Per member"
        />
        <StatCard
          icon="🏆"
          title="Total Points"
          value={stats.totalPoints}
          subtitle="All members"
        />
      </View>

      {topPerformers.length > 0 && (
        <View style={styles.topPerformersSection}>
          <Text style={styles.sectionTitle}>🏅 Top Performers</Text>
          <View style={styles.topPerformersList}>
            {topPerformers.slice(0, 3).map((performer, index) => (
              <View key={index} style={styles.performerCard}>
                <View style={styles.performerRank}>
                  <Text style={styles.rankEmoji}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </Text>
                </View>
                <View style={styles.performerInfo}>
                  <Text style={styles.performerName}>
                    {performer.user?.display_name || 'Unknown'}
                  </Text>
                  <Text style={styles.performerStats}>
                    {performer.points} pts • {performer.exact_results} exact
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.leagueHealthSection}>
        <Text style={styles.sectionTitle}>📊 League Health</Text>
        <View style={styles.healthMetrics}>
          <View style={styles.healthMetric}>
            <Text style={styles.healthLabel}>Activity Level</Text>
            <Text style={styles.healthValue}>
              {stats.totalMembers > 0 
                ? `${Math.round((stats.totalPredictions / stats.totalMembers) * 10) / 10} pred/member`
                : 'No activity'
              }
            </Text>
          </View>
          <View style={styles.healthMetric}>
            <Text style={styles.healthLabel}>Engagement</Text>
            <Text style={styles.healthValue}>
              {stats.totalMembers >= 5 ? 'High' : stats.totalMembers >= 3 ? 'Medium' : 'Low'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 8,
    color: '#6B7280',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#DC2626',
  },
  header: {
    marginBottom: 20,
  },
  leagueName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  leagueInfo: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    margin: 8,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  statTitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 2,
  },
  statSubtitle: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 1,
  },
  topPerformersSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  topPerformersList: {
    gap: 8,
  },
  performerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  performerRank: {
    marginRight: 12,
  },
  rankEmoji: {
    fontSize: 20,
  },
  performerInfo: {
    flex: 1,
  },
  performerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  performerStats: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  leagueHealthSection: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  healthMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  healthMetric: {
    alignItems: 'center',
  },
  healthLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  healthValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
});