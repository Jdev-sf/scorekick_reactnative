import { Database } from './database';

export type User = Database['public']['Tables']['users']['Row'];
export type League = Database['public']['Tables']['leagues']['Row'];
export type LeagueMember = Database['public']['Tables']['league_members']['Row'];
export type Match = Database['public']['Tables']['matches']['Row'];
export type Prediction = Database['public']['Tables']['predictions']['Row'];
export type Achievement = Database['public']['Tables']['achievements']['Row'];
export type UserAchievement = Database['public']['Tables']['user_achievements']['Row'];

export type UserRole = 'creator' | 'admin' | 'member';
export type MatchStatus = 'scheduled' | 'live' | 'completed';

export interface CreateLeagueData {
  name: string;
  invite_code: string;
  creator_id: string;
}

export interface CreatePredictionData {
  user_id: string;
  match_id: string;
  league_id: string;
  home_score_predicted: number;
  away_score_predicted: number;
}

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  photo_url: string | null;
  total_points: number;
  position: number;
}

export interface PredictionWithMatch extends Prediction {
  match: Match;
}

export interface LeagueWithMembers extends League {
  league_members: (LeagueMember & { users: User })[];
}

export interface AuthState {
  user: User | null;
  session: any;
  loading: boolean;
}