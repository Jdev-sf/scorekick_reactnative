export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          display_name: string | null
          photo_url: string | null
          total_points: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          display_name?: string | null
          photo_url?: string | null
          total_points?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          photo_url?: string | null
          total_points?: number
          created_at?: string
          updated_at?: string
        }
      }
      leagues: {
        Row: {
          id: string
          name: string
          invite_code: string
          creator_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          invite_code: string
          creator_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          invite_code?: string
          creator_id?: string
          created_at?: string
        }
      }
      league_members: {
        Row: {
          id: string
          league_id: string
          user_id: string
          role: 'creator' | 'admin' | 'member'
          joined_at: string
          total_points: number
          is_active: boolean
        }
        Insert: {
          id?: string
          league_id: string
          user_id: string
          role?: 'creator' | 'admin' | 'member'
          joined_at?: string
          total_points?: number
          is_active?: boolean
        }
        Update: {
          id?: string
          league_id?: string
          user_id?: string
          role?: 'creator' | 'admin' | 'member'
          joined_at?: string
          total_points?: number
          is_active?: boolean
        }
      }
      matches: {
        Row: {
          id: string
          home_team: string
          away_team: string
          home_score: number | null
          away_score: number | null
          match_date: string
          round: number
          status: 'scheduled' | 'live' | 'completed'
          external_api_id: string | null
        }
        Insert: {
          id?: string
          home_team: string
          away_team: string
          home_score?: number | null
          away_score?: number | null
          match_date: string
          round: number
          status?: 'scheduled' | 'live' | 'completed'
          external_api_id?: string | null
        }
        Update: {
          id?: string
          home_team?: string
          away_team?: string
          home_score?: number | null
          away_score?: number | null
          match_date?: string
          round?: number
          status?: 'scheduled' | 'live' | 'completed'
          external_api_id?: string | null
        }
      }
      predictions: {
        Row: {
          id: string
          user_id: string
          match_id: string
          league_id: string
          home_score_predicted: number
          away_score_predicted: number
          points_earned: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          match_id: string
          league_id: string
          home_score_predicted: number
          away_score_predicted: number
          points_earned?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          match_id?: string
          league_id?: string
          home_score_predicted?: number
          away_score_predicted?: number
          points_earned?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      achievements: {
        Row: {
          id: string
          name: string
          description: string
          icon: string
          points_threshold: number
          type: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          icon: string
          points_threshold: number
          type: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          icon?: string
          points_threshold?: number
          type?: string
        }
      }
      user_achievements: {
        Row: {
          user_id: string
          achievement_id: string
          earned_at: string
        }
        Insert: {
          user_id: string
          achievement_id: string
          earned_at?: string
        }
        Update: {
          user_id?: string
          achievement_id?: string
          earned_at?: string
        }
      }
    }
  }
}