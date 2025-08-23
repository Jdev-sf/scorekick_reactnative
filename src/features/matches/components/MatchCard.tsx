import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import type { Match } from '../types';

interface MatchCardProps {
  match: Match;
  onPress?: () => void;
  showPrediction?: boolean;
  userPrediction?: {
    home_score_predicted: number;
    away_score_predicted: number;
    points_earned?: number;
  };
}

export function MatchCard({ match, onPress, showPrediction, userPrediction }: MatchCardProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  
  const formatMatchDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    if (isToday) {
      return `Oggi ${date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isTomorrow) {
      return `Domani ${date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleString('it-IT', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return colors.error;
      case 'completed':
        return colors.success;
      case 'scheduled':
      default:
        return colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'live':
        return 'LIVE';
      case 'completed':
        return 'FINITA';
      case 'scheduled':
      default:
        return formatMatchDate(match.match_date);
    }
  };

  const renderScore = () => {
    if (match.status === 'completed' && match.home_score !== null && match.away_score !== null) {
      return (
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>
            {match.home_score} - {match.away_score}
          </Text>
        </View>
      );
    }

    if (match.status === 'live') {
      return (
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>
            {match.home_score || 0} - {match.away_score || 0}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>
          {new Date(match.match_date).toLocaleTimeString('it-IT', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </View>
    );
  };

  const renderPrediction = () => {
    if (!showPrediction || !userPrediction) return null;

    return (
      <View style={styles.predictionContainer}>
        <Text style={styles.predictionScore}>
          Prev: {userPrediction.home_score_predicted}-{userPrediction.away_score_predicted}
          {userPrediction.points_earned !== undefined && (
            <Text style={[styles.pointsText, { color: getPointsColor(userPrediction.points_earned) }]}>
              {' '}({userPrediction.points_earned}pt)
            </Text>
          )}
        </Text>
      </View>
    );
  };

  const getPointsColor = (points: number) => {
    if (points === 3) return '#10B981'; // Green for exact score
    if (points === 1) return '#F59E0B'; // Orange for correct result
    return '#DC2626'; // Red for wrong prediction
  };

  const content = (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(match.status) }]}>
          <Text style={styles.statusText}>{getStatusText(match.status)}</Text>
        </View>
        <Text style={styles.roundText}>Giornata {match.round}</Text>
      </View>

      <View style={styles.matchContent}>
        <View style={styles.teamContainer}>
          <Text style={styles.teamName} numberOfLines={1}>
            {match.home_team}
          </Text>
        </View>

        {renderScore()}

        <View style={styles.teamContainer}>
          <Text style={styles.teamName} numberOfLines={1}>
            {match.away_team}
          </Text>
        </View>
      </View>

      {renderPrediction()}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} style={styles.touchable}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const getPointsColor = (points: number) => {
  if (points === 3) return '#10B981'; // Green for exact score
  if (points === 1) return '#F59E0B'; // Orange for correct result
  return '#DC2626'; // Red for wrong prediction
};

const createStyles = (colors: any) => StyleSheet.create({
  touchable: {
    marginBottom: 8,
  },
  container: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  roundText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  matchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamContainer: {
    flex: 1,
    alignItems: 'center',
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  scoreContainer: {
    backgroundColor: colors.surface2,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginHorizontal: 8,
    minWidth: 50,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  timeContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginHorizontal: 8,
    minWidth: 50,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  predictionContainer: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  predictionLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  predictionScore: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  pointsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  pointsText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});