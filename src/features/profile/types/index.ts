export interface UserProfile {
  id: string;
  username: string;
  display_name?: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  favorite_team?: string;
  created_at: string;
  updated_at: string;
  
  // Privacy settings
  is_public: boolean;
  show_email: boolean;
  show_stats: boolean;
  show_achievements: boolean;
  
  // Social features
  followers_count: number;
  following_count: number;
  is_verified: boolean;
  
  // Preferences
  notification_settings: {
    achievements: boolean;
    league_updates: boolean;
    friend_requests: boolean;
    match_reminders: boolean;
  };
  
  // Stats summary (cached for performance)
  stats_summary?: {
    total_points: number;
    accuracy_percentage: number;
    total_predictions: number;
    leagues_count: number;
    achievements_count: number;
    best_streak: number;
    last_active: string;
  };
}

export interface UserStats {
  user_id: string;
  league_id?: string;
  
  // Overall performance
  total_points: number;
  total_predictions: number;
  correct_predictions: number;
  accuracy_percentage: number;
  
  // Streaks
  current_streak: number;
  best_streak: number;
  
  // Scoring breakdown
  exact_predictions: number;
  result_predictions: number;
  goal_difference_predictions: number;
  
  // Participation
  leagues_joined: number;
  leagues_created: number;
  seasons_played: number;
  
  // Rankings
  global_rank?: number;
  league_rank?: number;
  percentile?: number;
  
  // Time-based stats
  daily_stats: {
    date: string;
    points: number;
    predictions: number;
    accuracy: number;
  }[];
  
  monthly_stats: {
    month: string;
    points: number;
    predictions: number;
    accuracy: number;
  }[];
  
  // Achievement stats
  achievements_unlocked: number;
  achievement_categories: {
    milestone: number;
    accuracy: number;
    streak: number;
    participation: number;
    special: number;
  };
}

export interface UserComparison {
  user1: UserProfile;
  user2: UserProfile;
  
  stats_comparison: {
    total_points: {
      user1: number;
      user2: number;
      difference: number;
      better_user: string;
    };
    accuracy: {
      user1: number;
      user2: number;
      difference: number;
      better_user: string;
    };
    best_streak: {
      user1: number;
      user2: number;
      difference: number;
      better_user: string;
    };
    achievements: {
      user1: number;
      user2: number;
      difference: number;
      better_user: string;
    };
  };
  
  head_to_head?: {
    leagues_together: number;
    user1_wins: number;
    user2_wins: number;
    draws: number;
  };
}

export interface ProfileActivity {
  id: string;
  user_id: string;
  type: 'achievement' | 'prediction' | 'league_join' | 'league_create' | 'milestone';
  title: string;
  description: string;
  metadata?: {
    achievement_id?: string;
    league_id?: string;
    points?: number;
    [key: string]: any;
  };
  created_at: string;
  is_public: boolean;
}

export interface SocialConnection {
  id: string;
  follower_id: string;
  following_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  
  // Populated relations
  follower?: UserProfile;
  following?: UserProfile;
}

export interface ProfileUpdateData {
  display_name?: string;
  bio?: string;
  location?: string;
  favorite_team?: string;
  avatar_url?: string;
  is_public?: boolean;
  show_email?: boolean;
  show_stats?: boolean;
  show_achievements?: boolean;
  notification_settings?: Partial<UserProfile['notification_settings']>;
}