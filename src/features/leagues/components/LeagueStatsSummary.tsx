import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useLeagueStatsSummary } from '../hooks/useStandings';

interface LeagueStatsSummaryProps {
  leagueId: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  color?: string;
  backgroundColor?: string;
}

function StatCard({ title, value, subtitle, icon, color, backgroundColor }: StatCardProps) {
  const { colors, isDark } = useTheme();
  
  return (
    <View style={[
      styles.statCard,
      { 
        backgroundColor: backgroundColor || colors.primary + (isDark ? '25' : '10'),
        borderWidth: isDark ? 1 : 0,
        borderColor: colors.border,
      }
    ]}>
      {icon && <Text style={styles.statIcon}>{icon}</Text>}
      <Text style={[
        styles.statValue,
        { color: color || colors.primary }
      ]}>{value}</Text>
      <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
      {subtitle && <Text style={[styles.statSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
    </View>
  );
}

export function LeagueStatsSummary({ leagueId }: LeagueStatsSummaryProps) {
  const { colors, isDark } = useTheme();
  const { data: summary, isLoading, error } = useLeagueStatsSummary(leagueId);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading stats...</Text>
      </View>
    );
  }

  if (error || !summary) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: colors.error }]}>Failed to load league stats</Text>
      </View>
    );
  }

  const { league, stats, topPerformers } = summary;
  const leagueAge = Math.ceil(
    (new Date().getTime() - new Date(league.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.card,
        shadowColor: colors.shadow,
        shadowOpacity: isDark ? 0.3 : 0.1,
        elevation: isDark ? 6 : 3,
        borderWidth: isDark ? 1 : 0,
        borderColor: colors.border,
      }
    ]}>
      <View style={styles.header}>
        <Text style={[styles.leagueName, { color: colors.text }]}>{league.name}</Text>
        <Text style={[styles.leagueInfo, { color: colors.textSecondary }]}>
          Creata da {league.creator_name} • {leagueAge} giorni fa
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          icon="👥"
          title="Membri"
          value={stats.totalMembers}
          subtitle="Partecipanti attivi"
          color={colors.primary}
          backgroundColor={colors.primary + (isDark ? '25' : '10')}
        />
        <StatCard
          icon="🎯"
          title="Predizioni"
          value={stats.totalPredictions}
          subtitle="Totali effettuate"
          color={colors.success}
          backgroundColor={colors.success + (isDark ? '25' : '10')}
        />
        <StatCard
          icon="⭐"
          title="Media Punti"
          value={stats.averagePoints}
          subtitle="Per membro"
          color={colors.warning}
          backgroundColor={colors.warning + (isDark ? '25' : '10')}
        />
        <StatCard
          icon="🏆"
          title="Punti Totali"
          value={stats.totalPoints}
          subtitle="Tutti i membri"
          color={colors.secondary}
          backgroundColor={colors.secondary + (isDark ? '25' : '10')}
        />
      </View>

      {topPerformers.length > 0 && (
        <View style={styles.topPerformersSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🏅 Top Performers</Text>
          <View style={styles.topPerformersList}>
            {topPerformers.slice(0, 3).map((performer, index) => (
              <View key={index} style={[
                styles.performerCard,
                { 
                  backgroundColor: isDark ? colors.surface2 : colors.surfaceVariant,
                  borderWidth: isDark ? 1 : 0,
                  borderColor: colors.border,
                }
              ]}>
                <View style={styles.performerRank}>
                  <Text style={styles.rankEmoji}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </Text>
                </View>
                <View style={styles.performerInfo}>
                  <Text style={[styles.performerName, { color: colors.text }]}>
                    {performer.user?.display_name || 'Unknown'}
                  </Text>
                  <Text style={[styles.performerStats, { color: colors.textSecondary }]}>
                    {performer.points} pts • {performer.exact_results} exact
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={[
        styles.leagueHealthSection,
        { 
          borderTopColor: colors.border,
          backgroundColor: isDark ? colors.surface1 + '50' : 'transparent',
          borderRadius: isDark ? 8 : 0,
          padding: isDark ? 16 : 16,
          marginTop: isDark ? 8 : 0,
        }
      ]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>📊 League Health</Text>
        <View style={[
          styles.healthMetrics,
          { 
            gap: isDark ? 12 : 16,
          }
        ]}>
          <View style={[
            styles.healthMetric,
            {
              backgroundColor: isDark ? colors.surface2 : colors.surfaceVariant,
              padding: 12,
              borderRadius: 8,
              borderWidth: isDark ? 1 : 0,
              borderColor: colors.border,
            }
          ]}>
            <Text style={[styles.healthLabel, { color: colors.textSecondary }]}>Activity Level</Text>
            <Text style={[styles.healthValue, { color: colors.text }]}>
              {stats.totalMembers > 0 
                ? `${Math.round((stats.totalPredictions / stats.totalMembers) * 10) / 10} pred/member`
                : 'No activity'
              }
            </Text>
          </View>
          <View style={[
            styles.healthMetric,
            {
              backgroundColor: isDark ? colors.surface2 : colors.surfaceVariant,
              padding: 12,
              borderRadius: 8,
              borderWidth: isDark ? 1 : 0,
              borderColor: colors.border,
            }
          ]}>
            <Text style={[styles.healthLabel, { color: colors.textSecondary }]}>Engagement</Text>
            <Text style={[
              styles.healthValue, 
              { 
                color: stats.totalMembers >= 5 ? colors.success : 
                       stats.totalMembers >= 3 ? colors.warning : 
                       colors.error
              }
            ]}>
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
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 8,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    // Color handled inline
  },
  header: {
    marginBottom: 20,
  },
  leagueName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  leagueInfo: {
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statTitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 2,
  },
  statSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 1,
  },
  topPerformersSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  topPerformersList: {
    gap: 8,
  },
  performerCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  performerStats: {
    fontSize: 12,
    marginTop: 2,
  },
  leagueHealthSection: {
    borderTopWidth: 1,
    paddingTop: 16,
  },
  healthMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  healthMetric: {
    alignItems: 'center',
    flex: 1,
  },
  healthLabel: {
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  healthValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});