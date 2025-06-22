import { supabase } from '../../../lib/supabase/client';
import type { 
  Prediction, 
  PredictionCreate, 
  PredictionUpdate, 
  PredictionWithMatch,
  PredictionStats,
  LeaguePredictionSummary 
} from '../types';

export class PredictionService {
  private static readonly PREDICTION_DEADLINE_MINUTES = 15; // 15 minutes before kickoff

  /**
   * Check if predictions are allowed for a match
   * Predictions must be made at least 15 minutes before kickoff
   */
  static async isPredictionAllowed(matchId: string): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const { data: match, error } = await supabase
        .from('matches')
        .select('match_date, status')
        .eq('id', matchId)
        .single();

      if (error || !match) {
        return { allowed: false, reason: 'Match not found' };
      }

      // Check if match has already started or finished
      if (match.status === 'live' || match.status === 'completed') {
        return { allowed: false, reason: 'Match has already started or finished' };
      }

      // Check deadline (15 minutes before kickoff)
      const matchDate = new Date(match.match_date);
      const deadline = new Date(matchDate.getTime() - (this.PREDICTION_DEADLINE_MINUTES * 60 * 1000));
      const now = new Date();

      if (now > deadline) {
        return { allowed: false, reason: 'Prediction deadline has passed' };
      }

      return { allowed: true };
    } catch (error) {
      return { allowed: false, reason: 'Error checking prediction deadline' };
    }
  }

  /**
   * Create a new prediction
   */
  static async createPrediction(userId: string, prediction: PredictionCreate): Promise<Prediction> {
    // Check if prediction is allowed
    const deadlineCheck = await this.isPredictionAllowed(prediction.match_id);
    if (!deadlineCheck.allowed) {
      throw new Error(deadlineCheck.reason || 'Prediction not allowed');
    }

    // Verify user is member of the league
    const { data: membership, error: membershipError } = await supabase
      .from('league_members')
      .select('id')
      .eq('league_id', prediction.league_id)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (membershipError || !membership) {
      throw new Error('You are not a member of this league');
    }

    // Create the prediction
    const { data, error } = await supabase
      .from('predictions')
      .insert({
        user_id: userId,
        ...prediction,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('You have already made a prediction for this match in this league');
      }
      throw new Error(`Failed to create prediction: ${error.message}`);
    }

    return data;
  }

  /**
   * Update an existing prediction
   */
  static async updatePrediction(
    userId: string, 
    predictionId: string, 
    update: PredictionUpdate
  ): Promise<Prediction> {
    // Get the existing prediction to check match deadline
    const { data: existingPrediction, error: fetchError } = await supabase
      .from('predictions')
      .select('match_id, user_id')
      .eq('id', predictionId)
      .single();

    if (fetchError || !existingPrediction) {
      throw new Error('Prediction not found');
    }

    // Verify ownership
    if (existingPrediction.user_id !== userId) {
      throw new Error('You can only update your own predictions');
    }

    // Check if prediction is still allowed
    const deadlineCheck = await this.isPredictionAllowed(existingPrediction.match_id);
    if (!deadlineCheck.allowed) {
      throw new Error(deadlineCheck.reason || 'Prediction deadline has passed');
    }

    // Update the prediction
    const { data, error } = await supabase
      .from('predictions')
      .update({
        ...update,
        updated_at: new Date().toISOString(),
      })
      .eq('id', predictionId)
      .eq('user_id', userId) // Extra security check
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update prediction: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a prediction
   */
  static async deletePrediction(userId: string, predictionId: string): Promise<void> {
    // Get the existing prediction to check match deadline
    const { data: existingPrediction, error: fetchError } = await supabase
      .from('predictions')
      .select('match_id, user_id')
      .eq('id', predictionId)
      .single();

    if (fetchError || !existingPrediction) {
      throw new Error('Prediction not found');
    }

    // Verify ownership
    if (existingPrediction.user_id !== userId) {
      throw new Error('You can only delete your own predictions');
    }

    // Check if prediction is still allowed to be modified
    const deadlineCheck = await this.isPredictionAllowed(existingPrediction.match_id);
    if (!deadlineCheck.allowed) {
      throw new Error(deadlineCheck.reason || 'Prediction deadline has passed');
    }

    // Delete the prediction
    const { error } = await supabase
      .from('predictions')
      .delete()
      .eq('id', predictionId)
      .eq('user_id', userId); // Extra security check

    if (error) {
      throw new Error(`Failed to delete prediction: ${error.message}`);
    }
  }

  /**
   * Get user's prediction for a specific match and league
   */
  static async getUserPrediction(
    userId: string, 
    matchId: string, 
    leagueId: string
  ): Promise<Prediction | null> {
    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', userId)
      .eq('match_id', matchId)
      .eq('league_id', leagueId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null;
      }
      throw new Error(`Failed to get prediction: ${error.message}`);
    }

    return data;
  }

  /**
   * Get user's predictions for a league with match details
   */
  static async getUserPredictionsForLeague(
    userId: string, 
    leagueId: string,
    round?: number
  ): Promise<PredictionWithMatch[]> {
    let query = supabase
      .from('predictions')
      .select(`
        *,
        match:matches (
          id,
          home_team,
          away_team,
          home_score,
          away_score,
          match_date,
          round,
          status
        )
      `)
      .eq('user_id', userId)
      .eq('league_id', leagueId);

    if (round) {
      query = query.eq('match.round', round);
    }

    const { data, error } = await query.order('match.match_date', { ascending: true });

    if (error) {
      throw new Error(`Failed to get predictions: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get prediction statistics for a user in a league
   */
  static async getUserPredictionStats(userId: string, leagueId: string): Promise<PredictionStats> {
    const { data, error } = await supabase
      .from('predictions')
      .select('points_earned')
      .eq('user_id', userId)
      .eq('league_id', leagueId)
      .not('points_earned', 'is', null); // Only completed predictions

    if (error) {
      throw new Error(`Failed to get prediction stats: ${error.message}`);
    }

    const predictions = data || [];
    const totalPredictions = predictions.length;
    const totalPoints = predictions.reduce((sum, p) => sum + (p.points_earned || 0), 0);
    const correctPredictions = predictions.filter(p => (p.points_earned || 0) > 0).length;
    const exactPredictions = predictions.filter(p => p.points_earned === 3).length;

    return {
      total_predictions: totalPredictions,
      correct_predictions: correctPredictions,
      exact_predictions: exactPredictions,
      total_points: totalPoints,
      accuracy_percentage: totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0,
    };
  }

  /**
   * Get all predictions for a match (for league admins)
   */
  static async getMatchPredictions(matchId: string, leagueId: string): Promise<PredictionWithMatch[]> {
    const { data, error } = await supabase
      .from('predictions')
      .select(`
        *,
        user:users (
          display_name,
          email
        ),
        match:matches (
          id,
          home_team,
          away_team,
          home_score,
          away_score,
          match_date,
          round,
          status
        )
      `)
      .eq('match_id', matchId)
      .eq('league_id', leagueId);

    if (error) {
      throw new Error(`Failed to get match predictions: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get league prediction summary for a user
   */
  static async getUserLeaguePredictionSummaries(userId: string): Promise<LeaguePredictionSummary[]> {
    const { data, error } = await supabase
      .from('predictions')
      .select(`
        league_id,
        points_earned,
        league:leagues (
          name
        )
      `)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to get league summaries: ${error.message}`);
    }

    // Group by league and calculate stats
    const leagueMap = new Map<string, LeaguePredictionSummary>();
    
    data?.forEach(prediction => {
      const leagueId = prediction.league_id;
      const existing = leagueMap.get(leagueId) || {
        league_id: leagueId,
        league_name: (prediction.league as any)?.name || 'Unknown League',
        total_predictions: 0,
        completed_predictions: 0,
        pending_predictions: 0,
        total_points: 0,
      };

      existing.total_predictions++;
      if (prediction.points_earned !== null) {
        existing.completed_predictions++;
        existing.total_points += prediction.points_earned || 0;
      } else {
        existing.pending_predictions++;
      }

      leagueMap.set(leagueId, existing);
    });

    return Array.from(leagueMap.values());
  }
}