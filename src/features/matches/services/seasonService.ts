import { supabase } from '../../../lib/supabase/client';
import type { Season, LeagueParticipation } from '../types';

export class SeasonService {
  /**
   * Get current season string based on date (e.g., "2025-26")
   */
  static getCurrentSeasonString(): string {
    const now = new Date();
    const year = now.getFullYear();
    
    // Serie A season starts in August and ends in May/June
    // If we're in January-July, we're in the second half of the season (e.g., 2024-25)
    // If we're in August-December, we're in the first half of the new season (e.g., 2025-26)
    
    if (now.getMonth() < 7) { // January to July (months 0-6)
      // We're in the second half of the season
      return `${year - 1}-${year.toString().slice(-2)}`;
    } else { // August to December (months 7-11)  
      // We're in the first half of the new season
      return `${year}-${(year + 1).toString().slice(-2)}`;
    }
  }

  /**
   * Check if a season is currently active (can make predictions)
   */
  static isSeasonActive(seasonYear: string): boolean {
    return seasonYear === this.getCurrentSeasonString();
  }

  /**
   * Get all available seasons, ordered by most recent first
   */
  static async getAllSeasons(): Promise<Season[]> {
    const { data: seasons, error } = await supabase
      .from('seasons')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) throw error;
    return seasons || [];
  }

  /**
   * Get the currently active season
   */
  static async getCurrentSeason(): Promise<Season | null> {
    const { data: season, error } = await supabase
      .from('seasons')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null;
      }
      throw error;
    }
    
    return season;
  }

  /**
   * Get season by ID
   */
  static async getSeasonById(seasonId: string): Promise<Season | null> {
    const { data: season, error } = await supabase
      .from('seasons')
      .select('*')
      .eq('id', seasonId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null;
      }
      throw error;
    }
    
    return season;
  }

  /**
   * Get season by year string (e.g., "2024-25")
   */
  static async getSeasonByYear(year: string): Promise<Season | null> {
    const { data: season, error } = await supabase
      .from('seasons')
      .select('*')
      .eq('year', year)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null;
      }
      throw error;
    }
    
    return season;
  }

  /**
   * Create a new season
   */
  static async createSeason(
    year: string,
    startDate: string,
    endDate: string,
    isActive: boolean = false
  ): Promise<Season> {
    const { data: season, error } = await supabase
      .from('seasons')
      .insert({
        year,
        start_date: startDate,
        end_date: endDate,
        is_active: isActive,
      })
      .select()
      .single();

    if (error) throw error;
    return season;
  }

  /**
   * Update season
   */
  static async updateSeason(
    seasonId: string,
    updates: Partial<Pick<Season, 'year' | 'start_date' | 'end_date' | 'is_active'>>
  ): Promise<Season> {
    const { data: season, error } = await supabase
      .from('seasons')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', seasonId)
      .select()
      .single();

    if (error) throw error;
    return season;
  }

  /**
   * Set a season as active (deactivates all other seasons)
   */
  static async setActiveSeason(seasonId: string): Promise<Season> {
    // First deactivate all seasons
    await supabase
      .from('seasons')
      .update({ is_active: false })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all rows

    // Then activate the specified season
    const { data: season, error } = await supabase
      .from('seasons')
      .update({ 
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', seasonId)
      .select()
      .single();

    if (error) throw error;
    return season;
  }

  /**
   * Get league participations for a specific season
   */
  static async getLeagueParticipations(
    seasonId: string,
    leagueId?: string,
    userId?: string
  ): Promise<LeagueParticipation[]> {
    let query = supabase
      .from('league_participations')
      .select('*')
      .eq('season_id', seasonId);

    if (leagueId) {
      query = query.eq('league_id', leagueId);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: participations, error } = await query
      .order('total_points', { ascending: false });

    if (error) throw error;
    return participations || [];
  }

  /**
   * Get historical standings for a league across all seasons
   */
  static async getHistoricalStandings(leagueId: string): Promise<{
    season: Season;
    participations: LeagueParticipation[];
  }[]> {
    // Get all seasons with participations for this league
    const { data, error } = await supabase
      .from('league_participations')
      .select(`
        *,
        seasons!inner(*)
      `)
      .eq('league_id', leagueId)
      .not('final_position', 'is', null) // Only completed seasons
      .order('seasons.end_date', { ascending: false });

    if (error) throw error;

    // Group participations by season
    const seasonMap = new Map<string, {
      season: Season;
      participations: LeagueParticipation[];
    }>();

    data?.forEach((participation: any) => {
      const season = participation.seasons;
      const seasonId = season.id;

      if (!seasonMap.has(seasonId)) {
        seasonMap.set(seasonId, {
          season,
          participations: [],
        });
      }

      seasonMap.get(seasonId)!.participations.push({
        ...participation,
        seasons: undefined, // Remove the nested season data
      });
    });

    // Sort participations within each season by final position
    Array.from(seasonMap.values()).forEach(({ participations }) => {
      participations.sort((a, b) => (a.final_position || 0) - (b.final_position || 0));
    });

    return Array.from(seasonMap.values());
  }

  /**
   * Check if a season is currently active based on dates
   */
  static isSeasonActive(season: Season): boolean {
    const now = new Date();
    const startDate = new Date(season.start_date);
    const endDate = new Date(season.end_date);
    
    return now >= startDate && now <= endDate;
  }

  /**
   * Get season status display string
   */
  static getSeasonStatus(season: Season): 'current' | 'upcoming' | 'completed' {
    const now = new Date();
    const startDate = new Date(season.start_date);
    const endDate = new Date(season.end_date);
    
    if (now < startDate) return 'upcoming';
    if (now > endDate) return 'completed';
    return 'current';
  }

  /**
   * Format season for display (e.g., "2024-25 (Current)" or "2023-24")
   */
  static formatSeasonDisplay(season: Season): string {
    const status = this.getSeasonStatus(season);
    const baseYear = season.year;
    
    switch (status) {
      case 'current':
        return `${baseYear} (Attuale)`;
      case 'upcoming':
        return `${baseYear} (Prossima)`;
      case 'completed':
        return baseYear;
      default:
        return baseYear;
    }
  }
}