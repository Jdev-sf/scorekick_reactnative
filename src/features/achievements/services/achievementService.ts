import { supabase } from '../../../lib/supabase/client';
import type { Achievement, UserAchievement } from '../../leaderboards/types';
import type { UserPerformanceStats } from '../../leaderboards/types';

export class AchievementService {
  // Predefined achievements
  private static readonly ACHIEVEMENTS: Omit<Achievement, 'id' | 'created_at'>[] = [
    // Points Milestones
    {
      name: 'First Blood',
      description: 'Score your first points',
      icon: '🎯',
      category: 'milestone',
      condition_type: 'points',
      condition_value: 1,
      is_repeatable: false,
    },
    {
      name: 'Century Club',
      description: 'Reach 100 total points',
      icon: '💯',
      category: 'milestone',
      condition_type: 'points',
      condition_value: 100,
      is_repeatable: false,
    },
    {
      name: 'Points Machine',
      description: 'Reach 500 total points',
      icon: '🚀',
      category: 'milestone',
      condition_type: 'points',
      condition_value: 500,
      is_repeatable: false,
    },
    {
      name: 'Prediction Master',
      description: 'Reach 1000 total points',
      icon: '👑',
      category: 'milestone',
      condition_type: 'points',
      condition_value: 1000,
      is_repeatable: false,
    },

    // Accuracy Achievements
    {
      name: 'Sharp Shooter',
      description: 'Achieve 70% accuracy (min 10 predictions)',
      icon: '🎯',
      category: 'accuracy',
      condition_type: 'accuracy',
      condition_value: 70,
      is_repeatable: false,
    },
    {
      name: 'Oracle',
      description: 'Achieve 90% accuracy (min 20 predictions)',
      icon: '🔮',
      category: 'accuracy',
      condition_type: 'accuracy',
      condition_value: 90,
      is_repeatable: false,
    },

    // Streak Achievements
    {
      name: 'Hot Streak',
      description: 'Get 5 correct predictions in a row',
      icon: '🔥',
      category: 'streak',
      condition_type: 'streak',
      condition_value: 5,
      is_repeatable: true,
    },
    {
      name: 'On Fire',
      description: 'Get 10 correct predictions in a row',
      icon: '🔥🔥',
      category: 'streak',
      condition_type: 'streak',
      condition_value: 10,
      is_repeatable: true,
    },
    {
      name: 'Unstoppable',
      description: 'Get 15 correct predictions in a row',
      icon: '🔥🔥🔥',
      category: 'streak',
      condition_type: 'streak',
      condition_value: 15,
      is_repeatable: true,
    },

    // Exact Score Achievements
    {
      name: 'Bullseye',
      description: 'Get your first exact score prediction',
      icon: '🎯',
      category: 'accuracy',
      condition_type: 'exact_count',
      condition_value: 1,
      is_repeatable: false,
    },
    {
      name: 'Precision Pro',
      description: 'Get 10 exact score predictions',
      icon: '🎯🎯',
      category: 'accuracy',
      condition_type: 'exact_count',
      condition_value: 10,
      is_repeatable: false,
    },
    {
      name: 'Crystal Ball',
      description: 'Get 25 exact score predictions',
      icon: '🔮',
      category: 'accuracy',
      condition_type: 'exact_count',
      condition_value: 25,
      is_repeatable: false,
    },

    // Participation Achievements
    {
      name: 'Regular',
      description: 'Make predictions in 10 different rounds',
      icon: '📅',
      category: 'participation',
      condition_type: 'participation',
      condition_value: 10,
      is_repeatable: false,
    },
    {
      name: 'Dedicated',
      description: 'Make predictions in 20 different rounds',
      icon: '📅📅',
      category: 'participation',
      condition_type: 'participation',
      condition_value: 20,
      is_repeatable: false,
    },
    {
      name: 'Season Warrior',
      description: 'Make predictions in 30 different rounds',
      icon: '⚔️',
      category: 'participation',
      condition_type: 'participation',
      condition_value: 30,
      is_repeatable: false,
    },

    // Special Achievements
    {
      name: 'Perfect Round',
      description: 'Get all predictions correct in a single round (min 5 matches)',
      icon: '⭐',
      category: 'special',
      condition_type: 'special',
      condition_value: 1,
      is_repeatable: true,
    },
  ];

  /**
   * Initialize achievements in the database
   */
  static async initializeAchievements(): Promise<void> {
    try {
      for (const achievement of this.ACHIEVEMENTS) {
        // Check if achievement already exists
        const { data: existing } = await supabase
          .from('achievements')
          .select('id')
          .eq('name', achievement.name)
          .single();

        if (!existing) {
          // Insert new achievement
          const { error } = await supabase
            .from('achievements')
            .insert(achievement);

          if (error) {
            console.error(`Failed to create achievement ${achievement.name}:`, error);
          } else {
            console.log(`Created achievement: ${achievement.name}`);
          }
        }
      }
    } catch (error) {
      console.error('Failed to initialize achievements:', error);
    }
  }

  /**
   * Check and award achievements for a user
   */
  static async checkAchievements(userId: string, leagueId: string, stats: UserPerformanceStats): Promise<UserAchievement[]> {
    const newAchievements: UserAchievement[] = [];

    try {
      // Get all achievements
      const { data: achievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('*');

      if (achievementsError || !achievements) {
        throw new Error('Failed to fetch achievements');
      }

      // Get user's existing achievements
      const { data: userAchievements, error: userAchievementsError } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', userId)
        .eq('league_id', leagueId);

      if (userAchievementsError) {
        throw new Error('Failed to fetch user achievements');
      }

      const earnedAchievementIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);

      // Check each achievement
      for (const achievement of achievements) {
        // Skip if already earned and not repeatable
        if (!achievement.is_repeatable && earnedAchievementIds.has(achievement.id)) {
          continue;
        }

        const isEarned = await this.checkAchievementCondition(achievement, stats, userId, leagueId);

        if (isEarned) {
          // Award achievement
          const userAchievement: Omit<UserAchievement, 'earned_at'> = {
            user_id: userId,
            achievement_id: achievement.id,
            league_id: leagueId,
            context_data: {
              stats_snapshot: stats,
              earned_value: this.getEarnedValue(achievement, stats),
            },
          };

          const { error: awardError } = await supabase
            .from('user_achievements')
            .insert({
              ...userAchievement,
              earned_at: new Date().toISOString(),
            });

          if (!awardError) {
            newAchievements.push({
              ...userAchievement,
              earned_at: new Date().toISOString(),
            });
            console.log(`Awarded achievement "${achievement.name}" to user ${userId}`);
          }
        }
      }
    } catch (error) {
      console.error('Failed to check achievements:', error);
    }

    return newAchievements;
  }

  /**
   * Check if a specific achievement condition is met
   */
  private static async checkAchievementCondition(
    achievement: Achievement, 
    stats: UserPerformanceStats,
    userId: string,
    leagueId: string
  ): Promise<boolean> {
    switch (achievement.condition_type) {
      case 'points':
        return stats.total_points >= achievement.condition_value;

      case 'accuracy':
        // Require minimum predictions for accuracy achievements
        const minPredictions = achievement.condition_value >= 90 ? 20 : 10;
        return stats.total_predictions >= minPredictions && 
               stats.accuracy_percentage >= achievement.condition_value;

      case 'streak':
        return stats.best_correct_streak >= achievement.condition_value;

      case 'exact_count':
        return stats.exact_predictions >= achievement.condition_value;

      case 'participation':
        return stats.rounds_participated >= achievement.condition_value;

      case 'special':
        // Check for perfect round achievement
        if (achievement.name === 'Perfect Round') {
          return await this.checkPerfectRound(userId, leagueId);
        }
        return false;

      default:
        return false;
    }
  }

  /**
   * Check if user has achieved a perfect round
   */
  private static async checkPerfectRound(userId: string, leagueId: string): Promise<boolean> {
    try {
      // Get user's predictions grouped by round
      const { data: predictions, error } = await supabase
        .from('predictions')
        .select(`
          points_earned,
          match:matches(round)
        `)
        .eq('user_id', userId)
        .eq('league_id', leagueId)
        .not('points_earned', 'is', null);

      if (error || !predictions) return false;

      // Group by round
      const roundStats = new Map<number, { total: number; correct: number }>();
      
      predictions.forEach(prediction => {
        const round = (prediction.match as any)?.round;
        if (!round) return;

        if (!roundStats.has(round)) {
          roundStats.set(round, { total: 0, correct: 0 });
        }

        const stats = roundStats.get(round)!;
        stats.total++;
        if ((prediction.points_earned || 0) > 0) {
          stats.correct++;
        }
      });

      // Check for perfect rounds (min 5 matches, all correct)
      for (const [round, stats] of roundStats) {
        if (stats.total >= 5 && stats.correct === stats.total) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Failed to check perfect round:', error);
      return false;
    }
  }

  /**
   * Get the value that earned the achievement
   */
  private static getEarnedValue(achievement: Achievement, stats: UserPerformanceStats): number {
    switch (achievement.condition_type) {
      case 'points':
        return stats.total_points;
      case 'accuracy':
        return stats.accuracy_percentage;
      case 'streak':
        return stats.best_correct_streak;
      case 'exact_count':
        return stats.exact_predictions;
      case 'participation':
        return stats.rounds_participated;
      default:
        return 0;
    }
  }

  /**
   * Get user's achievements for a league
   */
  static async getUserAchievements(userId: string, leagueId?: string): Promise<(UserAchievement & { achievement: Achievement })[]> {
    try {
      let query = supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', userId);

      if (leagueId) {
        query = query.eq('league_id', leagueId);
      }

      const { data, error } = await query.order('earned_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get user achievements: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get user achievements:', error);
      return [];
    }
  }

  /**
   * Reset seasonal achievements for all users
   */
  static async resetSeasonalAchievements(seasonId?: string): Promise<void> {
    try {
      // Get all repeatable achievements (seasonal achievements)
      const { data: seasonalAchievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('id, name')
        .eq('is_repeatable', true);

      if (achievementsError || !seasonalAchievements) {
        throw new Error('Failed to fetch seasonal achievements');
      }

      console.log(`Resetting ${seasonalAchievements.length} seasonal achievements...`);

      // Archive current seasonal achievements instead of deleting
      const { error: archiveError } = await supabase
        .from('user_achievements')
        .update({ 
          archived: true,
          archived_at: new Date().toISOString(),
          season_context: seasonId || 'legacy'
        })
        .in('achievement_id', seasonalAchievements.map(a => a.id));

      if (archiveError) {
        throw new Error(`Failed to archive seasonal achievements: ${archiveError.message}`);
      }

      console.log('Seasonal achievements reset successfully');
    } catch (error) {
      console.error('Failed to reset seasonal achievements:', error);
      throw error;
    }
  }

  /**
   * Get user's achievements for a specific season
   */
  static async getUserSeasonalAchievements(
    userId: string, 
    leagueId: string, 
    seasonId?: string,
    includeArchived: boolean = false
  ): Promise<(UserAchievement & { achievement: Achievement })[]> {
    try {
      let query = supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', userId)
        .eq('league_id', leagueId);

      if (!includeArchived) {
        query = query.or('archived.is.null,archived.eq.false');
      }

      if (seasonId) {
        query = query.eq('season_context', seasonId);
      }

      const { data, error } = await query.order('earned_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get seasonal achievements: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get seasonal achievements:', error);
      return [];
    }
  }

  /**
   * Get seasonal achievement summary
   */
  static async getSeasonalSummary(userId: string, leagueId: string): Promise<{
    currentSeason: {
      total: number;
      earned: number;
      recentUnlocks: Array<UserAchievement & { achievement: Achievement }>;
    };
    previousSeasons: Array<{
      seasonId: string;
      total: number;
      topAchievements: Array<UserAchievement & { achievement: Achievement }>;
    }>;
  }> {
    try {
      // Get current season achievements
      const currentSeasonAchievements = await this.getUserSeasonalAchievements(
        userId, 
        leagueId, 
        undefined, 
        false
      );

      // Get archived achievements grouped by season
      const { data: archivedAchievements, error: archivedError } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', userId)
        .eq('league_id', leagueId)
        .eq('archived', true)
        .order('archived_at', { ascending: false });

      if (archivedError) {
        throw new Error(`Failed to get archived achievements: ${archivedError.message}`);
      }

      // Group archived achievements by season
      const seasonGroups = (archivedAchievements || []).reduce((acc, achievement) => {
        const season = achievement.season_context || 'legacy';
        if (!acc[season]) {
          acc[season] = [];
        }
        acc[season].push(achievement);
        return acc;
      }, {} as Record<string, Array<UserAchievement & { achievement: Achievement }>>);

      // Get total available achievements for comparison
      const { data: allAchievements, error: allError } = await supabase
        .from('achievements')
        .select('id');

      const totalAchievements = allAchievements?.length || 0;

      return {
        currentSeason: {
          total: totalAchievements,
          earned: currentSeasonAchievements.length,
          recentUnlocks: currentSeasonAchievements.slice(0, 5),
        },
        previousSeasons: Object.entries(seasonGroups).map(([seasonId, achievements]) => ({
          seasonId,
          total: achievements.length,
          topAchievements: achievements
            .sort((a, b) => {
              // Sort by rarity (special > streak > accuracy > milestone > participation)
              const rarityOrder = { special: 0, streak: 1, accuracy: 2, milestone: 3, participation: 4 };
              return rarityOrder[a.achievement.category as keyof typeof rarityOrder] - 
                     rarityOrder[b.achievement.category as keyof typeof rarityOrder];
            })
            .slice(0, 3),
        })),
      };
    } catch (error) {
      console.error('Failed to get seasonal summary:', error);
      return {
        currentSeason: { total: 0, earned: 0, recentUnlocks: [] },
        previousSeasons: [],
      };
    }
  }

  /**
   * Get achievement progress for a user
   */
  static async getAchievementProgress(userId: string, leagueId: string, stats: UserPerformanceStats): Promise<{
    total: number;
    earned: number;
    progress: Array<{
      achievement: Achievement;
      earned: boolean;
      progress: number;
      current_value: number;
    }>;
  }> {
    try {
      // Get all achievements
      const { data: achievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .order('condition_value', { ascending: true });

      if (achievementsError || !achievements) {
        throw new Error('Failed to fetch achievements');
      }

      // Get user's earned achievements
      const userAchievements = await this.getUserAchievements(userId, leagueId);
      const earnedIds = new Set(userAchievements.map(ua => ua.achievement_id));

      const progress = achievements.map((achievement: Achievement) => {
        const earned = earnedIds.has(achievement.id);
        const currentValue = this.getEarnedValue(achievement, stats);
        const progressPercent = Math.min(100, (currentValue / achievement.condition_value) * 100);

        return {
          achievement,
          earned,
          progress: progressPercent,
          current_value: currentValue,
        };
      });

      return {
        total: achievements.length,
        earned: userAchievements.length,
        progress,
      };
    } catch (error) {
      console.error('Failed to get achievement progress:', error);
      return {
        total: 0,
        earned: 0,
        progress: [],
      };
    }
  }
}