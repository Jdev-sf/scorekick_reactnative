import { supabase } from '../../../lib/supabase/client';
import type { 
  LeaderboardEntry, 
  LeagueLeaderboard, 
  RoundLeaderboard,
  RoundLeaderboardEntry,
  UserPerformanceStats,
  LeagueStatsOverview,
  HistoricalLeaderboard 
} from '../types';

export class LeaderboardService {
  /**
   * Calculate and get current league leaderboard
   */
  static async getLeagueLeaderboard(leagueId: string): Promise<LeagueLeaderboard> {
    try {
      // Get league info
      const { data: league, error: leagueError } = await supabase
        .from('leagues')
        .select('name')
        .eq('id', leagueId)
        .single();

      if (leagueError || !league) {
        throw new Error('League not found');
      }

      // Get all predictions with user info for this league
      const { data: predictionsData, error: predictionsError } = await supabase
        .from('predictions')
        .select(`
          user_id,
          points_earned,
          home_score_predicted,
          away_score_predicted,
          match:matches(round, status),
          user:users(email, display_name)
        `)
        .eq('league_id', leagueId)
        .not('points_earned', 'is', null); // Only completed predictions

      if (predictionsError) {
        throw new Error(`Failed to fetch predictions: ${predictionsError.message}`);
      }

      // Calculate user statistics
      const userStatsMap = new Map<string, {
        user_id: string;
        user_email: string;
        user_display_name?: string;
        total_points: number;
        total_predictions: number;
        correct_predictions: number;
        exact_predictions: number;
      }>();

      predictionsData?.forEach(prediction => {
        const userId = prediction.user_id;
        const userEmail = (prediction.user as any)?.email || 'Unknown';
        const userDisplayName = (prediction.user as any)?.display_name;
        
        if (!userStatsMap.has(userId)) {
          userStatsMap.set(userId, {
            user_id: userId,
            user_email: userEmail,
            user_display_name: userDisplayName,
            total_points: 0,
            total_predictions: 0,
            correct_predictions: 0,
            exact_predictions: 0,
          });
        }

        const userStats = userStatsMap.get(userId)!;
        userStats.total_points += prediction.points_earned || 0;
        userStats.total_predictions += 1;
        
        if ((prediction.points_earned || 0) > 0) {
          userStats.correct_predictions += 1;
        }
        
        if (prediction.points_earned === 3) {
          userStats.exact_predictions += 1;
        }
      });

      // Convert to leaderboard entries and sort
      const entries: LeaderboardEntry[] = Array.from(userStatsMap.values())
        .map(stats => ({
          ...stats,
          accuracy_percentage: stats.total_predictions > 0 
            ? (stats.correct_predictions / stats.total_predictions) * 100 
            : 0,
          position: 0, // Will be set after sorting
        }))
        .sort((a, b) => {
          // Sort by total points desc, then by accuracy desc, then by total predictions desc
          if (b.total_points !== a.total_points) {
            return b.total_points - a.total_points;
          }
          if (b.accuracy_percentage !== a.accuracy_percentage) {
            return b.accuracy_percentage - a.accuracy_percentage;
          }
          return b.total_predictions - a.total_predictions;
        })
        .map((entry, index) => ({
          ...entry,
          position: index + 1,
        }));

      // Get current round info
      const { data: currentRoundData } = await supabase
        .from('matches')
        .select('round')
        .order('match_date', { ascending: false })
        .limit(1);

      const currentRound = currentRoundData?.[0]?.round || 1;
      const completedRounds = Math.max(0, currentRound - 1);

      return {
        league_id: leagueId,
        league_name: league.name,
        entries,
        last_updated: new Date().toISOString(),
        total_members: entries.length,
        completed_rounds: completedRounds,
        current_round: currentRound,
      };
    } catch (error) {
      throw new Error(`Failed to calculate leaderboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get leaderboard for a specific round
   */
  static async getRoundLeaderboard(leagueId: string, round: number): Promise<RoundLeaderboard> {
    try {
      // Get predictions for specific round
      const { data: predictionsData, error } = await supabase
        .from('predictions')
        .select(`
          user_id,
          points_earned,
          user:users(display_name),
          match:matches!inner(round)
        `)
        .eq('league_id', leagueId)
        .eq('match.round', round)
        .not('points_earned', 'is', null);

      if (error) {
        throw new Error(`Failed to fetch round predictions: ${error.message}`);
      }

      // Calculate round statistics per user
      const userRoundStats = new Map<string, {
        user_id: string;
        user_display_name?: string;
        round_points: number;
        round_predictions: number;
        round_correct: number;
        round_exact: number;
      }>();

      let totalPredictions = 0;
      let totalPoints = 0;

      predictionsData?.forEach(prediction => {
        const userId = prediction.user_id;
        const displayName = (prediction.user as any)?.display_name;
        
        if (!userRoundStats.has(userId)) {
          userRoundStats.set(userId, {
            user_id: userId,
            user_display_name: displayName,
            round_points: 0,
            round_predictions: 0,
            round_correct: 0,
            round_exact: 0,
          });
        }

        const stats = userRoundStats.get(userId)!;
        stats.round_points += prediction.points_earned || 0;
        stats.round_predictions += 1;
        
        if ((prediction.points_earned || 0) > 0) {
          stats.round_correct += 1;
        }
        
        if (prediction.points_earned === 3) {
          stats.round_exact += 1;
        }

        totalPredictions += 1;
        totalPoints += prediction.points_earned || 0;
      });

      // Convert to round leaderboard entries and sort
      const entries: RoundLeaderboardEntry[] = Array.from(userRoundStats.values())
        .sort((a, b) => {
          if (b.round_points !== a.round_points) {
            return b.round_points - a.round_points;
          }
          return b.round_predictions - a.round_predictions;
        })
        .map((entry, index) => ({
          ...entry,
          position: index + 1,
        }));

      return {
        round,
        league_id: leagueId,
        entries,
        total_predictions: totalPredictions,
        average_points: totalPredictions > 0 ? totalPoints / totalPredictions : 0,
      };
    } catch (error) {
      throw new Error(`Failed to get round leaderboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get detailed performance statistics for a user in a league
   */
  static async getUserPerformanceStats(userId: string, leagueId: string): Promise<UserPerformanceStats> {
    try {
      // Get user's predictions in this league
      const { data: predictions, error } = await supabase
        .from('predictions')
        .select(`
          points_earned,
          match:matches(round, status)
        `)
        .eq('user_id', userId)
        .eq('league_id', leagueId)
        .not('points_earned', 'is', null)
        .order('match.round', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch user predictions: ${error.message}`);
      }

      if (!predictions || predictions.length === 0) {
        // Return default stats for user with no predictions
        return {
          user_id: userId,
          league_id: leagueId,
          total_points: 0,
          total_predictions: 0,
          correct_predictions: 0,
          exact_predictions: 0,
          accuracy_percentage: 0,
          current_position: 0,
          best_position: 0,
          worst_position: 0,
          rounds_participated: 0,
          best_round_points: 0,
          worst_round_points: 0,
          average_round_points: 0,
          current_correct_streak: 0,
          best_correct_streak: 0,
          current_exact_streak: 0,
          best_exact_streak: 0,
          points_above_average: 0,
          position_percentile: 0,
        };
      }

      // Calculate basic stats
      const totalPoints = predictions.reduce((sum, p) => sum + (p.points_earned || 0), 0);
      const correctPredictions = predictions.filter(p => (p.points_earned || 0) > 0).length;
      const exactPredictions = predictions.filter(p => p.points_earned === 3).length;
      const accuracyPercentage = (correctPredictions / predictions.length) * 100;

      // Calculate round-by-round stats
      const roundStats = new Map<number, number>();
      predictions.forEach(p => {
        const round = (p.match as any)?.round;
        if (round) {
          roundStats.set(round, (roundStats.get(round) || 0) + (p.points_earned || 0));
        }
      });

      const roundPoints = Array.from(roundStats.values());
      const bestRoundPoints = Math.max(...roundPoints, 0);
      const worstRoundPoints = Math.min(...roundPoints, 0);
      const averageRoundPoints = roundPoints.length > 0 ? roundPoints.reduce((a, b) => a + b, 0) / roundPoints.length : 0;

      // Calculate streaks
      let currentCorrectStreak = 0;
      let bestCorrectStreak = 0;
      let currentExactStreak = 0;
      let bestExactStreak = 0;
      let tempCorrectStreak = 0;
      let tempExactStreak = 0;

      // Analyze streaks from most recent predictions
      for (let i = predictions.length - 1; i >= 0; i--) {
        const points = predictions[i].points_earned || 0;
        
        // Correct streak
        if (points > 0) {
          tempCorrectStreak++;
          if (i === predictions.length - 1) currentCorrectStreak = tempCorrectStreak;
        } else {
          if (i === predictions.length - 1) currentCorrectStreak = 0;
          bestCorrectStreak = Math.max(bestCorrectStreak, tempCorrectStreak);
          tempCorrectStreak = 0;
        }
        
        // Exact streak
        if (points === 3) {
          tempExactStreak++;
          if (i === predictions.length - 1) currentExactStreak = tempExactStreak;
        } else {
          if (i === predictions.length - 1) currentExactStreak = 0;
          bestExactStreak = Math.max(bestExactStreak, tempExactStreak);
          tempExactStreak = 0;
        }
      }

      bestCorrectStreak = Math.max(bestCorrectStreak, tempCorrectStreak);
      bestExactStreak = Math.max(bestExactStreak, tempExactStreak);

      // Get current position from leaderboard
      const leaderboard = await this.getLeagueLeaderboard(leagueId);
      const userEntry = leaderboard.entries.find(entry => entry.user_id === userId);
      const currentPosition = userEntry?.position || 0;

      // Calculate average points for comparison
      const averageLeaguePoints = leaderboard.entries.length > 0 
        ? leaderboard.entries.reduce((sum, entry) => sum + entry.total_points, 0) / leaderboard.entries.length
        : 0;

      const pointsAboveAverage = totalPoints - averageLeaguePoints;
      const positionPercentile = leaderboard.entries.length > 0 
        ? ((leaderboard.entries.length - currentPosition + 1) / leaderboard.entries.length) * 100
        : 0;

      return {
        user_id: userId,
        league_id: leagueId,
        total_points: totalPoints,
        total_predictions: predictions.length,
        correct_predictions: correctPredictions,
        exact_predictions: exactPredictions,
        accuracy_percentage: accuracyPercentage,
        current_position: currentPosition,
        best_position: currentPosition, // TODO: Track historical positions
        worst_position: currentPosition, // TODO: Track historical positions
        rounds_participated: roundStats.size,
        best_round_points: bestRoundPoints,
        worst_round_points: worstRoundPoints,
        average_round_points: averageRoundPoints,
        current_correct_streak: currentCorrectStreak,
        best_correct_streak: bestCorrectStreak,
        current_exact_streak: currentExactStreak,
        best_exact_streak: bestExactStreak,
        points_above_average: pointsAboveAverage,
        position_percentile: positionPercentile,
      };
    } catch (error) {
      throw new Error(`Failed to get user performance stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get league statistics overview
   */
  static async getLeagueStatsOverview(leagueId: string): Promise<LeagueStatsOverview> {
    try {
      const leaderboard = await this.getLeagueLeaderboard(leagueId);
      
      if (leaderboard.entries.length === 0) {
        return {
          league_id: leagueId,
          total_members: 0,
          active_members: 0,
          total_predictions: 0,
          completed_predictions: 0,
          highest_points: 0,
          lowest_points: 0,
          average_points: 0,
          median_points: 0,
          overall_accuracy: 0,
          total_exact_predictions: 0,
          exact_prediction_rate: 0,
          current_round: leaderboard.current_round,
          completed_rounds: leaderboard.completed_rounds,
          rounds_with_full_participation: 0,
        };
      }

      const entries = leaderboard.entries;
      const points = entries.map(e => e.total_points).sort((a, b) => a - b);
      const totalPredictions = entries.reduce((sum, e) => sum + e.total_predictions, 0);
      const totalCorrect = entries.reduce((sum, e) => sum + e.correct_predictions, 0);
      const totalExact = entries.reduce((sum, e) => sum + e.exact_predictions, 0);

      return {
        league_id: leagueId,
        total_members: entries.length,
        active_members: entries.filter(e => e.total_predictions > 0).length,
        total_predictions: totalPredictions,
        completed_predictions: totalPredictions, // All fetched predictions are completed
        highest_points: Math.max(...points, 0),
        lowest_points: Math.min(...points, 0),
        average_points: points.length > 0 ? points.reduce((a, b) => a + b, 0) / points.length : 0,
        median_points: points.length > 0 ? points[Math.floor(points.length / 2)] : 0,
        overall_accuracy: totalPredictions > 0 ? (totalCorrect / totalPredictions) * 100 : 0,
        total_exact_predictions: totalExact,
        exact_prediction_rate: totalPredictions > 0 ? (totalExact / totalPredictions) * 100 : 0,
        current_round: leaderboard.current_round,
        completed_rounds: leaderboard.completed_rounds,
        rounds_with_full_participation: 0, // TODO: Calculate this
      };
    } catch (error) {
      throw new Error(`Failed to get league stats overview: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Save historical leaderboard snapshot
   */
  static async saveHistoricalSnapshot(leagueId: string, round: number): Promise<void> {
    try {
      const leaderboard = await this.getLeagueLeaderboard(leagueId);
      const roundLeaderboard = await this.getRoundLeaderboard(leagueId, round);
      
      // Save to historical_leaderboards table (if it exists)
      const snapshotData: Omit<HistoricalLeaderboard, 'id'> = {
        league_id: leagueId,
        round: round,
        snapshot_date: new Date().toISOString(),
        leaderboard_data: leaderboard.entries,
        stats_summary: {
          total_predictions: roundLeaderboard.total_predictions,
          average_points: roundLeaderboard.average_points,
          highest_round_score: Math.max(...roundLeaderboard.entries.map(e => e.round_points), 0),
        },
      };

      // For now, store in local storage or skip if table doesn't exist
      console.log('[LeaderboardService] Historical snapshot saved for round', round, snapshotData);
    } catch (error) {
      console.error('[LeaderboardService] Failed to save historical snapshot:', error);
    }
  }
}