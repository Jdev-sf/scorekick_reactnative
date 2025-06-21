import { supabase } from '../../../lib/supabase/client';
import type { LeagueStanding } from '../types';

export class StandingsService {
  /**
   * Get league standings/leaderboard
   */
  static async getLeagueStandings(leagueId: string): Promise<LeagueStanding[]> {
    const { data: standings, error } = await supabase
      .from('league_standings')
      .select(`
        *,
        user:users(
          display_name,
          email,
          photo_url
        )
      `)
      .eq('league_id', leagueId)
      .order('position', { ascending: true });

    if (error) throw error;

    return standings || [];
  }

  /**
   * Get current user's position in league
   */
  static async getUserPosition(leagueId: string, userId: string): Promise<LeagueStanding | null> {
    const { data: userStanding, error } = await supabase
      .from('league_standings')
      .select(`
        *,
        user:users(
          display_name,
          email,
          photo_url
        )
      `)
      .eq('league_id', leagueId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return userStanding || null;
  }

  /**
   * Get league statistics summary
   */
  static async getLeagueStatsSummary(leagueId: string) {
    // Get basic league info
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .select(`
        name,
        created_at,
        creator_id,
        creator:users(display_name)
      `)
      .eq('id', leagueId)
      .single();

    if (leagueError) throw leagueError;

    // Get member count and statistics
    const { data: memberStats, error: statsError } = await supabase
      .from('league_members')
      .select('total_points, user_id')
      .eq('league_id', leagueId)
      .eq('is_active', true);

    if (statsError) throw statsError;

    const totalMembers = memberStats?.length || 0;
    const totalPoints = memberStats?.reduce((sum, member) => sum + (member.total_points || 0), 0) || 0;
    const averagePoints = totalMembers > 0 ? Math.round((totalPoints / totalMembers) * 100) / 100 : 0;

    // Get predictions count
    const { count: totalPredictions, error: predictionsError } = await supabase
      .from('predictions')
      .select('*', { count: 'exact', head: true })
      .eq('league_id', leagueId);

    if (predictionsError) throw predictionsError;

    // Get top 3 performers
    const { data: topPerformers, error: topError } = await supabase
      .from('league_standings')
      .select(`
        points,
        exact_results,
        correct_results,
        user:users(display_name, photo_url)
      `)
      .eq('league_id', leagueId)
      .order('position', { ascending: true })
      .limit(3);

    if (topError) throw topError;

    const processedTopPerformers = (topPerformers || []).map(performer => ({
      ...performer,
      user: {
        display_name: Array.isArray(performer.user) 
          ? (performer.user as any)[0]?.display_name || 'Unknown'
          : (performer.user as any)?.display_name || 'Unknown',
        photo_url: Array.isArray(performer.user) 
          ? (performer.user as any)[0]?.photo_url 
          : (performer.user as any)?.photo_url,
      }
    }));

    return {
      league: {
        name: league.name,
        created_at: league.created_at,
        creator_name: Array.isArray(league.creator) 
          ? (league.creator as any)[0]?.display_name || 'Unknown'
          : (league.creator as any)?.display_name || 'Unknown',
      },
      stats: {
        totalMembers,
        totalPredictions: totalPredictions || 0,
        averagePoints,
        totalPoints,
      },
      topPerformers: processedTopPerformers,
    };
  }

  /**
   * Get member performance over time (for historical tracking)
   */
  static async getMemberPerformanceHistory(leagueId: string, userId: string) {
    // This would require a separate table to track historical data
    // For now, we'll return current performance data
    const { data: predictions, error } = await supabase
      .from('predictions')
      .select(`
        points_earned,
        created_at,
        match:matches(
          home_team,
          away_team,
          round,
          match_date
        )
      `)
      .eq('league_id', leagueId)
      .eq('user_id', userId)
      .not('points_earned', 'is', null)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Group predictions by round for trend analysis
    const roundPerformance = predictions?.reduce((acc, prediction) => {
      const matchData = Array.isArray(prediction.match) ? prediction.match[0] : prediction.match;
      const round = matchData?.round || 0;
      if (!acc[round]) {
        acc[round] = {
          round,
          totalPoints: 0,
          predictions: 0,
          exactResults: 0,
          correctResults: 0,
        };
      }
      
      acc[round].totalPoints += prediction.points_earned || 0;
      acc[round].predictions += 1;
      
      if (prediction.points_earned === 3) acc[round].exactResults += 1;
      if ((prediction.points_earned || 0) > 0) acc[round].correctResults += 1;
      
      return acc;
    }, {} as Record<number, any>);

    return {
      predictions: predictions || [],
      roundPerformance: Object.values(roundPerformance || {}),
    };
  }

  /**
   * Get comparative stats between members
   */
  static async getComparativeStats(leagueId: string, userId1: string, userId2: string) {
    const [user1Stats, user2Stats] = await Promise.all([
      this.getUserPosition(leagueId, userId1),
      this.getUserPosition(leagueId, userId2),
    ]);

    if (!user1Stats || !user2Stats) {
      throw new Error('One or both users not found in league standings');
    }

    const comparison = {
      user1: {
        ...user1Stats,
        winRate: user1Stats.predictions_made > 0 
          ? Math.round((user1Stats.correct_results / user1Stats.predictions_made) * 100) 
          : 0,
        exactRate: user1Stats.predictions_made > 0 
          ? Math.round((user1Stats.exact_results / user1Stats.predictions_made) * 100) 
          : 0,
      },
      user2: {
        ...user2Stats,
        winRate: user2Stats.predictions_made > 0 
          ? Math.round((user2Stats.correct_results / user2Stats.predictions_made) * 100) 
          : 0,
        exactRate: user2Stats.predictions_made > 0 
          ? Math.round((user2Stats.exact_results / user2Stats.predictions_made) * 100) 
          : 0,
      },
    };

    return {
      ...comparison,
      leader: comparison.user1.points > comparison.user2.points ? 'user1' : 
              comparison.user2.points > comparison.user1.points ? 'user2' : 'tie',
      pointsDifference: Math.abs(comparison.user1.points - comparison.user2.points),
    };
  }
}