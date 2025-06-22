import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
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
        return '#EF4444';
      case 'completed':
        return '#10B981';
      case 'scheduled':
      default:
        return '#6B7280';
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
        <Text style={styles.predictionLabel}>La tua previsione:</Text>
        <Text style={styles.predictionScore}>
          {userPrediction.home_score_predicted} - {userPrediction.away_score_predicted}
        </Text>
        {userPrediction.points_earned !== undefined && (
          <View style={[
            styles.pointsBadge,
            { backgroundColor: getPointsColor(userPrediction.points_earned) }
          ]}>
            <Text style={styles.pointsText}>
              {userPrediction.points_earned} pt{userPrediction.points_earned !== 1 ? 'i' : 'o'}
            </Text>
          </View>
        )}
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

const styles = StyleSheet.create({
  touchable: {
    marginBottom: 12,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    marginBottom: 12,
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
    fontSize: 12,
    color: '#6B7280',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  scoreContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 12,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  timeContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 12,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  predictionContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  predictionLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  predictionScore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
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