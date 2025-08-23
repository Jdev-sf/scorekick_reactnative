import { supabase } from '../../../lib/supabase/client';
import type { UserProfile, UserStats, ProfileUpdateData, ProfileActivity, UserComparison } from '../types';

export class ProfileService {
  /**
   * Get user profile by ID
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          stats_summary:user_stats_summary(*)
        `)
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Failed to get user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, updates: ProfileUpdateData): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update profile: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive user stats
   */
  static async getUserStats(userId: string, leagueId?: string): Promise<UserStats | null> {
    try {
      let query = supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId);

      if (leagueId) {
        query = query.eq('league_id', leagueId);
      }

      const { data, error } = await query.single();

      if (error) {
        console.error('Failed to get user stats:', error);
        return null;
      }

      // Get additional time-based stats
      const [dailyStats, monthlyStats] = await Promise.all([
        this.getDailyStats(userId, leagueId),
        this.getMonthlyStats(userId, leagueId),
      ]);

      return {
        ...data,
        daily_stats: dailyStats,
        monthly_stats: monthlyStats,
      };
    } catch (error) {
      console.error('Failed to get user stats:', error);
      return null;
    }
  }

  /**
   * Get daily stats for the last 30 days
   */
  private static async getDailyStats(userId: string, leagueId?: string) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      let query = supabase
        .from('predictions')
        .select('created_at, points_earned')
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (leagueId) {
        query = query.eq('league_id', leagueId);
      }

      const { data, error } = await query;

      if (error || !data) return [];

      // Group by date
      const dailyGroups: Record<string, { points: number; predictions: number; correct: number }> = {};

      data.forEach(prediction => {
        const date = new Date(prediction.created_at).toISOString().split('T')[0];
        
        if (!dailyGroups[date]) {
          dailyGroups[date] = { points: 0, predictions: 0, correct: 0 };
        }

        dailyGroups[date].predictions++;
        dailyGroups[date].points += prediction.points_earned || 0;
        if ((prediction.points_earned || 0) > 0) {
          dailyGroups[date].correct++;
        }
      });

      return Object.entries(dailyGroups).map(([date, stats]) => ({
        date,
        points: stats.points,
        predictions: stats.predictions,
        accuracy: stats.predictions > 0 ? (stats.correct / stats.predictions) * 100 : 0,
      }));
    } catch (error) {
      console.error('Failed to get daily stats:', error);
      return [];
    }
  }

  /**
   * Get monthly stats for the last 12 months
   */
  private static async getMonthlyStats(userId: string, leagueId?: string) {
    try {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      let query = supabase
        .from('predictions')
        .select('created_at, points_earned')
        .eq('user_id', userId)
        .gte('created_at', oneYearAgo.toISOString());

      if (leagueId) {
        query = query.eq('league_id', leagueId);
      }

      const { data, error } = await query;

      if (error || !data) return [];

      // Group by month
      const monthlyGroups: Record<string, { points: number; predictions: number; correct: number }> = {};

      data.forEach(prediction => {
        const date = new Date(prediction.created_at);
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyGroups[month]) {
          monthlyGroups[month] = { points: 0, predictions: 0, correct: 0 };
        }

        monthlyGroups[month].predictions++;
        monthlyGroups[month].points += prediction.points_earned || 0;
        if ((prediction.points_earned || 0) > 0) {
          monthlyGroups[month].correct++;
        }
      });

      return Object.entries(monthlyGroups).map(([month, stats]) => ({
        month,
        points: stats.points,
        predictions: stats.predictions,
        accuracy: stats.predictions > 0 ? (stats.correct / stats.predictions) * 100 : 0,
      }));
    } catch (error) {
      console.error('Failed to get monthly stats:', error);
      return [];
    }
  }

  /**
   * Get user's recent activities
   */
  static async getUserActivities(userId: string, limit = 20): Promise<ProfileActivity[]> {
    try {
      const { data, error } = await supabase
        .from('profile_activities')
        .select('*')
        .eq('user_id', userId)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to get user activities:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get user activities:', error);
      return [];
    }
  }

  /**
   * Add activity to user's profile
   */
  static async addActivity(
    userId: string, 
    type: ProfileActivity['type'],
    title: string,
    description: string,
    metadata?: ProfileActivity['metadata'],
    isPublic = true
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('profile_activities')
        .insert({
          user_id: userId,
          type,
          title,
          description,
          metadata,
          is_public: isPublic,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Failed to add activity:', error);
      }
    } catch (error) {
      console.error('Failed to add activity:', error);
    }
  }

  /**
   * Search users by username or display name
   */
  static async searchUsers(query: string, limit = 10): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .eq('is_public', true)
        .limit(limit);

      if (error) {
        console.error('Failed to search users:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to search users:', error);
      return [];
    }
  }

  /**
   * Get user rankings
   */
  static async getUserRankings(userId: string, leagueId?: string): Promise<{
    global_rank: number;
    league_rank?: number;
    percentile: number;
    total_users: number;
  } | null> {
    try {
      // Global ranking
      const { data: globalRank, error: globalError } = await supabase
        .rpc('get_user_global_rank', { p_user_id: userId });

      if (globalError) {
        console.error('Failed to get global rank:', globalError);
        return null;
      }

      let leagueRank;
      if (leagueId) {
        const { data: leagueRankData, error: leagueError } = await supabase
          .rpc('get_user_league_rank', { 
            p_user_id: userId, 
            p_league_id: leagueId 
          });

        if (!leagueError) {
          leagueRank = leagueRankData;
        }
      }

      // Get total users for percentile calculation
      const { count: totalUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      const percentile = totalUsers ? ((totalUsers - globalRank.rank + 1) / totalUsers) * 100 : 0;

      return {
        global_rank: globalRank.rank,
        league_rank: leagueRank?.rank,
        percentile,
        total_users: totalUsers || 0,
      };
    } catch (error) {
      console.error('Failed to get user rankings:', error);
      return null;
    }
  }

  /**
   * Compare two users
   */
  static async compareUsers(userId1: string, userId2: string): Promise<UserComparison | null> {
    try {
      const [user1, user2, stats1, stats2] = await Promise.all([
        this.getUserProfile(userId1),
        this.getUserProfile(userId2),
        this.getUserStats(userId1),
        this.getUserStats(userId2),
      ]);

      if (!user1 || !user2 || !stats1 || !stats2) {
        return null;
      }

      const comparison: UserComparison = {
        user1,
        user2,
        stats_comparison: {
          total_points: {
            user1: stats1.total_points,
            user2: stats2.total_points,
            difference: stats1.total_points - stats2.total_points,
            better_user: stats1.total_points > stats2.total_points ? userId1 : userId2,
          },
          accuracy: {
            user1: stats1.accuracy_percentage,
            user2: stats2.accuracy_percentage,
            difference: stats1.accuracy_percentage - stats2.accuracy_percentage,
            better_user: stats1.accuracy_percentage > stats2.accuracy_percentage ? userId1 : userId2,
          },
          best_streak: {
            user1: stats1.best_streak,
            user2: stats2.best_streak,
            difference: stats1.best_streak - stats2.best_streak,
            better_user: stats1.best_streak > stats2.best_streak ? userId1 : userId2,
          },
          achievements: {
            user1: stats1.achievements_unlocked,
            user2: stats2.achievements_unlocked,
            difference: stats1.achievements_unlocked - stats2.achievements_unlocked,
            better_user: stats1.achievements_unlocked > stats2.achievements_unlocked ? userId1 : userId2,
          },
        },
      };

      return comparison;
    } catch (error) {
      console.error('Failed to compare users:', error);
      return null;
    }
  }

  /**
   * Update user's stats summary (cached data)
   */
  static async updateStatsummary(userId: string): Promise<void> {
    try {
      const stats = await this.getUserStats(userId);
      if (!stats) return;

      const { error } = await supabase
        .from('user_stats_summary')
        .upsert({
          user_id: userId,
          total_points: stats.total_points,
          accuracy_percentage: stats.accuracy_percentage,
          total_predictions: stats.total_predictions,
          leagues_count: stats.leagues_joined,
          achievements_count: stats.achievements_unlocked,
          best_streak: stats.best_streak,
          last_active: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Failed to update stats summary:', error);
      }
    } catch (error) {
      console.error('Failed to update stats summary:', error);
    }
  }
}