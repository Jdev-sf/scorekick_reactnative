export interface Prediction {
  id: string;
  user_id: string;
  match_id: string;
  league_id: string;
  home_score_predicted: number;
  away_score_predicted: number;
  points_earned?: number;
  created_at: string;
  updated_at: string;
}

export interface PredictionCreate {
  match_id: string;
  league_id: string;
  home_score_predicted: number;
  away_score_predicted: number;
}

export interface PredictionUpdate {
  home_score_predicted: number;
  away_score_predicted: number;
}

export interface PredictionWithMatch extends Prediction {
  match: {
    id: string;
    home_team: string;
    away_team: string;
    home_score?: number;
    away_score?: number;
    match_date: string;
    round: number;
    status: 'scheduled' | 'live' | 'completed';
  };
}

export interface PredictionStats {
  total_predictions: number;
  correct_predictions: number;
  exact_predictions: number;
  total_points: number;
  accuracy_percentage: number;
}

export interface LeaguePredictionSummary {
  league_id: string;
  league_name: string;
  total_predictions: number;
  completed_predictions: number;
  pending_predictions: number;
  total_points: number;
  position?: number;
}