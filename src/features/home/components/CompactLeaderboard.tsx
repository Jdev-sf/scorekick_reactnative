import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../contexts/ThemeContext';

interface LeaderboardUser {
  id: string;
  user_id: string;
  display_name?: string;
  username: string;
  total_points: number;
  position: number;
  is_current_user: boolean;
}

interface CompactLeaderboardProps {
  standings: LeaderboardUser[];
  leagueName?: string;
  userStats?: {
    totalPoints: number;
    accuracyPercentage: number;
    totalPredictions: number;
    correctPredictions: number;
  };
}

export const CompactLeaderboard: React.FC<CompactLeaderboardProps> = ({
  standings,
  leagueName,
  userStats,
}) => {
  const { colors } = useTheme();
  const navigation = useNavigation();

  const handleViewFullLeaderboard = () => {
    navigation.navigate('Matches' as never, { initialTab: 2 } as never);
  };

  const currentUser = standings.find(user => user.is_current_user);
  const topUsers = standings.slice(0, 3);
  const otherUsers = standings.slice(3, 5);

  // Mock trend data - in production would come from props or API
  const getTrendEmoji = (position: number) => {
    if (position <= 3) return '↗️';
    if (position <= 5) return '→';
    return '↘️';
  };

  const renderCompactUser = (user: LeaderboardUser, index: number) => {
    const isTop3 = index < 3;
    const positionEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';

    return (
      <View 
        key={user.user_id}
        style={[
          styles.userRow,
          user.is_current_user && [styles.currentUserRow, { backgroundColor: colors.primary + '10', borderColor: colors.primary }],
          isTop3 && !user.is_current_user && [styles.topUserRow, { backgroundColor: colors.warning + '10' }]
        ]}
      >
        <View style={styles.leftSection}>
          <View style={styles.positionContainer}>
            {positionEmoji ? (
              <Text style={styles.positionEmoji}>{positionEmoji}</Text>
            ) : (
              <Text style={[styles.positionNumber, { color: colors.textSecondary }]}>
                {user.position}
              </Text>
            )}
          </View>
          <Text 
            style={[
              styles.userName,
              { color: colors.textPrimary },
              user.is_current_user && [styles.currentUserName, { color: colors.primary }]
            ]}
            numberOfLines={1}
          >
            {user.is_current_user ? 'Tu' : user.display_name || user.username}
          </Text>
        </View>

        <View style={styles.rightSection}>
          <Text style={styles.trendEmoji}>{getTrendEmoji(user.position)}</Text>
          <Text 
            style={[
              styles.userPoints,
              { color: colors.textPrimary },
              user.is_current_user && [styles.currentUserPoints, { color: colors.primary }]
            ]}
          >
            {user.total_points}
          </Text>
        </View>
      </View>
    );
  };

  if (standings.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Classifica Lega
          </Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Nessun dato classifica disponibile
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Classifica Lega
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {currentUser 
              ? `Sei ${currentUser.position}° con ${currentUser.total_points} punti`
              : `${leagueName || 'Lega'}`
            }
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.viewAllButton, { backgroundColor: colors.success }]}
          onPress={handleViewFullLeaderboard}
        >
          <Text style={styles.viewAllText}>Vedi tutto</Text>
        </TouchableOpacity>
      </View>

      {/* Top 3 */}
      <View style={styles.topSection}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          🏆 Podio
        </Text>
        {topUsers.map((user, index) => renderCompactUser(user, index))}
      </View>

      {/* Other users */}
      {otherUsers.length > 0 && (
        <View style={styles.othersSection}>
          {otherUsers.map((user, index) => renderCompactUser(user, index + 3))}
        </View>
      )}

      {/* Footer with quick stats */}
      {userStats && (
        <View style={[styles.footer, { backgroundColor: colors.background }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.textPrimary }]}>
              {userStats.totalPoints > 0 ? '+' + Math.floor(userStats.totalPoints * 0.1) : '0'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Ultima gior.
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.textPrimary }]}>
              {userStats.accuracyPercentage?.toFixed(0) || '0'}%
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Precisione
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.textPrimary }]}>
              {userStats.correctPredictions || 0}/{userStats.totalPredictions || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Pronostici
            </Text>
          </View>
        </View>
      )}
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
    marginTop: 2,
  },

  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },

  viewAllText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  topSection: {
    padding: 16,
    paddingBottom: 8,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },

  othersSection: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 2,
  },

  currentUserRow: {
    borderWidth: 1,
  },

  topUserRow: {
    // Styling handled via backgroundColor in render
  },

  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  positionContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  positionEmoji: {
    fontSize: 16,
  },

  positionNumber: {
    fontSize: 14,
    fontWeight: '600',
  },

  userName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },

  currentUserName: {
    fontWeight: '600',
  },

  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  trendEmoji: {
    fontSize: 12,
    marginRight: 6,
  },

  userPoints: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 35,
    textAlign: 'right',
  },

  currentUserPoints: {
    // Color handled in render
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },

  statItem: {
    alignItems: 'center',
  },

  statNumber: {
    fontSize: 14,
    fontWeight: '700',
  },

  statLabel: {
    fontSize: 10,
    marginTop: 2,
  },

  emptyState: {
    padding: 32,
    alignItems: 'center',
  },

  emptyText: {
    textAlign: 'center',
  },
});