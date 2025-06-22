export interface LeaderboardEntry {
  user_id: string;
  user_email: string;
  user_display_name?: string;
  total_points: number;
  total_predictions: number;
  correct_predictions: number;
  exact_predictions: number;
  accuracy_percentage: number;
  position: number;
  points_change?: number; // Change from previous update
  position_change?: number; // Change from previous position
}

export interface LeagueLeaderboard {
  league_id: string;
  league_name: string;
  entries: LeaderboardEntry[];
  last_updated: string;
  total_members: number;
  completed_rounds: number;
  current_round: number;
}

export interface RoundLeaderboard {
  round: number;
  league_id: string;
  entries: RoundLeaderboardEntry[];
  total_predictions: number;
  average_points: number;
}

export interface RoundLeaderboardEntry {
  user_id: string;
  user_display_name?: string;
  round_points: number;
  round_predictions: number;
  round_correct: number;
  round_exact: number;
  position: number;
}

export interface UserPerformanceStats {
  user_id: string;
  league_id: string;
  
  // Overall stats
  total_points: number;
  total_predictions: number;
  correct_predictions: number;
  exact_predictions: number;
  accuracy_percentage: number;
  
  // Position tracking
  current_position: number;
  best_position: number;
  worst_position: number;
  
  // Round-by-round performance
  rounds_participated: number;
  best_round_points: number;
  worst_round_points: number;
  average_round_points: number;
  
  // Streaks
  current_correct_streak: number;
  best_correct_streak: number;
  current_exact_streak: number;
  best_exact_streak: number;
  
  // Comparisons
  points_above_average: number;
  position_percentile: number;
}

export interface LeagueStatsOverview {
  league_id: string;
  total_members: number;
  active_members: number; // Members who made predictions this round
  total_predictions: number;
  completed_predictions: number;
  
  // Point distribution
  highest_points: number;
  lowest_points: number;
  average_points: number;
  median_points: number;
  
  // Accuracy stats
  overall_accuracy: number;
  total_exact_predictions: number;
  exact_prediction_rate: number;
  
  // Round stats
  current_round: number;
  completed_rounds: number;
  rounds_with_full_participation: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'accuracy' | 'streak' | 'participation' | 'milestone' | 'special';
  points_threshold?: number;
  condition_type: 'points' | 'accuracy' | 'streak' | 'participation' | 'exact_count' | 'special';
  condition_value: number;
  is_repeatable: boolean;
  created_at: string;
}

export interface UserAchievement {
  user_id: string;
  achievement_id: string;
  earned_at: string;
  league_id?: string; // Some achievements might be league-specific
  context_data?: Record<string, any>; // Additional context (e.g., which round, what streak)
}

export interface HistoricalLeaderboard {
  id: string;
  league_id: string;
  round: number;
  snapshot_date: string;
  leaderboard_data: LeaderboardEntry[];
  stats_summary: {
    total_predictions: number;
    average_points: number;
    highest_round_score: number;
  };
}