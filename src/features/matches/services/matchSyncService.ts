import { supabase } from '../../../lib/supabase/client';
import { footballDataService } from './footballDataService';
import type { Match, SerieAStanding, SyncResult } from '../types';

export class MatchSyncService {
  /**
   * Sync all Serie A matches from Football-data.org API
   * Uses rate limiting to respect free plan limits (10 requests/minute)
   */
  static async syncMatches(): Promise<SyncResult> {
    const result: SyncResult = {
      matchesUpdated: 0,
      standingsUpdated: 0,
      errors: [],
    };

    try {
      if (!footballDataService.isConfigured()) {
        result.errors.push('Football-data.org API not configured');
        return result;
      }

      console.log('[MatchSync] Starting match synchronization...');
      
      // Get matches from API - this will be rate limited automatically
      const apiMatches = await footballDataService.getSerieAMatches();
      
      for (const apiMatch of apiMatches) {
        try {
          const matchData = footballDataService.transformMatch(apiMatch);
          
          // Check if match already exists
          const { data: existingMatch } = await supabase
            .from('matches')
            .select('id, home_score, away_score, status')
            .eq('external_api_id', matchData.external_api_id)
            .single();

          if (existingMatch) {
            // Update existing match if scores or status changed
            const needsUpdate = 
              existingMatch.home_score !== matchData.home_score ||
              existingMatch.away_score !== matchData.away_score ||
              existingMatch.status !== matchData.status;

            if (needsUpdate) {
              const { error } = await supabase
                .from('matches')
                .update({
                  home_score: matchData.home_score,
                  away_score: matchData.away_score,
                  status: matchData.status,
                })
                .eq('id', existingMatch.id);

              if (error) {
                result.errors.push(`Failed to update match ${matchData.home_team} vs ${matchData.away_team}: ${error.message}`);
              } else {
                result.matchesUpdated++;
                
                // If match is completed and scores changed, recalculate predictions
                if (matchData.status === 'completed' && 
                    (existingMatch.home_score !== matchData.home_score || 
                     existingMatch.away_score !== matchData.away_score)) {
                  await MatchSyncService.recalculatePredictions(existingMatch.id);
                }
              }
            }
          } else {
            // Insert new match
            const { error } = await supabase
              .from('matches')
              .insert(matchData);

            if (error) {
              result.errors.push(`Failed to insert match ${matchData.home_team} vs ${matchData.away_team}: ${error.message}`);
            } else {
              result.matchesUpdated++;
            }
          }
        } catch (error) {
          result.errors.push(`Error processing match: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      result.errors.push(`Failed to fetch matches: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Sync Serie A standings from Football-data.org API
   * 
   * Note: Standings are dynamic - teams change positions after each matchday
   * based on points, goal difference, etc. We upsert based on team+season
   * to allow position changes while maintaining team history.
   */
  static async syncStandings(season?: string): Promise<SyncResult> {
    const result: SyncResult = {
      matchesUpdated: 0,
      standingsUpdated: 0,
      errors: [],
    };

    try {
      if (!footballDataService.isConfigured()) {
        result.errors.push('Football-data.org API not configured');
        return result;
      }

      const targetSeason = season || footballDataService.getCurrentSeason();
      console.log(`[MatchSync] Syncing standings for season: ${targetSeason}`);
      const apiStandings = await footballDataService.getSerieAStandings(targetSeason);

      // Upsert all standings data - positions can change between matchdays
      // This will update existing teams or insert new ones based on team_name+season
      const standingsData = apiStandings.map(apiStanding => 
        footballDataService.transformStanding(apiStanding, targetSeason)
      );

      for (const standingData of standingsData) {
        try {
          const { error } = await supabase
            .from('serie_a_standings')
            .upsert(standingData, {
              onConflict: 'team_name,season',
              ignoreDuplicates: false
            });

          if (error) {
            result.errors.push(`Failed to sync standing for ${standingData.team_name}: ${error.message}`);
          } else {
            result.standingsUpdated++;
          }
        } catch (error) {
          result.errors.push(`Error processing standing for ${standingData.team_name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      result.errors.push(`Failed to fetch standings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Full sync: matches and standings
   */
  static async syncAll(): Promise<SyncResult> {
    const matchResult = await MatchSyncService.syncMatches();
    const standingsResult = await MatchSyncService.syncStandings();

    return {
      matchesUpdated: matchResult.matchesUpdated,
      standingsUpdated: standingsResult.standingsUpdated,
      errors: [...matchResult.errors, ...standingsResult.errors],
    };
  }

  /**
   * Recalculate prediction points when match results are updated
   */
  private static async recalculatePredictions(matchId: string): Promise<void> {
    try {
      // Get the completed match
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('home_score, away_score')
        .eq('id', matchId)
        .single();

      if (matchError || !match || match.home_score === null || match.away_score === null) {
        return;
      }

      // Get all predictions for this match
      const { data: predictions, error: predictionsError } = await supabase
        .from('predictions')
        .select('id, user_id, league_id, home_score_predicted, away_score_predicted')
        .eq('match_id', matchId);

      if (predictionsError || !predictions) {
        return;
      }

      // Calculate points for each prediction
      for (const prediction of predictions) {
        const points = MatchSyncService.calculatePredictionPoints(
          prediction.home_score_predicted,
          prediction.away_score_predicted,
          match.home_score,
          match.away_score
        );

        // Update prediction with calculated points
        await supabase
          .from('predictions')
          .update({ points_earned: points })
          .eq('id', prediction.id);
      }

      // Update league standings for all leagues that have predictions for this match
      const { data: leagueIds } = await supabase
        .from('predictions')
        .select('league_id')
        .eq('match_id', matchId);

      if (leagueIds) {
        const uniqueLeagueIds = [...new Set(leagueIds.map(p => p.league_id))];
        for (const leagueId of uniqueLeagueIds) {
          // Call the database function to update league standings
          await supabase.rpc('update_league_standings', { p_league_id: leagueId });
        }
      }

      // Check achievements for all users who made predictions for this match
      // Import achievement service dynamically to avoid circular dependencies
      const { AchievementService } = await import('../../achievements/services/achievementService');
      const { LeaderboardService } = await import('../../leaderboards/services/leaderboardService');
      
      const uniqueUsers = [...new Set(predictions.map(p => ({ userId: p.user_id, leagueId: p.league_id })))];
      
      for (const { userId, leagueId } of uniqueUsers) {
        try {
          // Get updated user stats
          const userStats = await LeaderboardService.getUserPerformanceStats(userId, leagueId);
          
          // Check and award achievements
          await AchievementService.checkAchievements(userId, leagueId, userStats);
        } catch (error) {
          console.error(`Failed to check achievements for user ${userId}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to recalculate predictions:', error);
    }
  }

  /**
   * Calculate points for a prediction
   * 3 points for exact score, 1 point for correct result sign, 0 for wrong
   */
  private static calculatePredictionPoints(
    predictedHome: number,
    predictedAway: number,
    actualHome: number,
    actualAway: number
  ): number {
    // Exact score match
    if (predictedHome === actualHome && predictedAway === actualAway) {
      return 3;
    }

    // Check if the result sign (win/draw/loss) is correct
    const predictedResult = MatchSyncService.getMatchResult(predictedHome, predictedAway);
    const actualResult = MatchSyncService.getMatchResult(actualHome, actualAway);

    if (predictedResult === actualResult) {
      return 1;
    }

    return 0;
  }

  /**
   * Get match result: 'home_win', 'away_win', or 'draw'
   */
  private static getMatchResult(homeScore: number, awayScore: number): 'home_win' | 'away_win' | 'draw' {
    if (homeScore > awayScore) return 'home_win';
    if (homeScore < awayScore) return 'away_win';
    return 'draw';
  }

  /**
   * Get matches by round
   */
  static async getMatchesByRound(round: number): Promise<Match[]> {
    const { data: matches, error } = await supabase
      .from('matches')
      .select('*')
      .eq('round', round)
      .order('match_date', { ascending: true });

    if (error) throw error;
    return matches || [];
  }

  /**
   * Get live matches
   */
  static async getLiveMatches(): Promise<Match[]> {
    const { data: matches, error } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'live')
      .order('match_date', { ascending: true });

    if (error) throw error;
    return matches || [];
  }

  /**
   * Get upcoming matches
   */
  static async getUpcomingMatches(limit: number = 10): Promise<Match[]> {
    const { data: matches, error } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'scheduled')
      .gte('match_date', new Date().toISOString())
      .order('match_date', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return matches || [];
  }

  /**
   * Get Serie A standings for specified season (defaults to current season)
   */
  static async getSerieAStandings(season?: string): Promise<SerieAStanding[]> {
    const targetSeason = season || footballDataService.getCurrentSeason();
    
    const { data: standings, error } = await supabase
      .from('serie_a_standings')
      .select('*')
      .eq('season', targetSeason)
      .order('position', { ascending: true });

    if (error) throw error;
    return standings || [];
  }
}