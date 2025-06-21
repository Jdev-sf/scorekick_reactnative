export interface League {
  id: string;
  name: string;
  invite_code: string;
  creator_id: string;
  created_at: string;
  creator?: {
    display_name: string;
    email: string;
  };
  _count?: {
    count: number;
  };
  league_members?: Array<{
    role: string;
    joined_at: string;
    total_points: number;
  }>;
}

export interface LeagueMember {
  id: string;
  league_id: string;
  user_id: string;
  role: 'creator' | 'admin' | 'member';
  joined_at: string;
  total_points: number;
  is_active: boolean;
  user?: {
    display_name: string;
    email: string;
    photo_url?: string;
  };
  league?: {
    name: string;
    invite_code: string;
  };
}

export interface LeagueStanding {
  id: string;
  league_id: string;
  user_id: string;
  position: number;
  points: number;
  exact_results: number;
  correct_results: number;
  predictions_made: number;
  updated_at: string;
  user?: {
    display_name: string;
    email: string;
    photo_url?: string;
  };
}

export interface CreateLeagueData {
  name: string;
}

export interface JoinLeagueData {
  inviteCode: string;
}

export interface LeagueFilters {
  search?: string;
  role?: 'creator' | 'admin' | 'member';
  sortBy?: 'created_at' | 'name' | 'member_count';
  sortOrder?: 'asc' | 'desc';
}

export interface LeagueStats {
  totalMembers: number;
  totalPredictions: number;
  averagePoints: number;
  topScorer?: {
    user_id: string;
    display_name: string;
    points: number;
  };
}