import type { 
  FootballDataMatch, 
  FootballDataStanding, 
  FootballDataResponse,
  Match,
  SerieAStanding 
} from '../types';

// Football-data.org API configuration
const FOOTBALL_DATA_API_URL = 'https://api.football-data.org/v4';
const SERIE_A_COMPETITION_ID = 'SA'; // Serie A competition code

class FootballDataService {
  private apiKey: string;
  private lastRequestTime: number = 0;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue: boolean = false;
  
  constructor() {
    // Use environment variable only - never hardcode API keys
    this.apiKey = process.env.EXPO_PUBLIC_FOOTBALL_DATA_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('Football-data.org API key not configured. Set EXPO_PUBLIC_FOOTBALL_DATA_API_KEY environment variable.');
    }
  }

  /**
   * Rate limiting for free plan: 10 requests per minute
   * Ensures 6 seconds between requests to stay within limits
   */
  private async makeRequest<T>(endpoint: string): Promise<T> {
    if (!this.apiKey) {
      throw new Error('Football-data.org API key not configured');
    }

    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await this.executeRequest<T>(endpoint);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      const minInterval = 6000; // 6 seconds between requests (10 per minute)

      if (timeSinceLastRequest < minInterval) {
        const waitTime = minInterval - timeSinceLastRequest;
        console.log(`[Football-data API] Rate limiting: waiting ${waitTime}ms`);
        await this.delay(waitTime);
      }

      const request = this.requestQueue.shift();
      if (request) {
        this.lastRequestTime = Date.now();
        await request();
      }
    }

    this.isProcessingQueue = false;
  }

  private async executeRequest<T>(endpoint: string): Promise<T> {
    console.log(`[Football-data API] Making request to: ${endpoint}`);
    
    const response = await fetch(`${FOOTBALL_DATA_API_URL}${endpoint}`, {
      headers: {
        'X-Auth-Token': this.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      // Handle rate limiting specifically
      if (response.status === 429) {
        throw new Error('API rate limit exceeded. Please wait before making more requests.');
      }
      
      throw new Error(`Football-data.org API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`[Football-data API] Request successful: ${endpoint}`);
    return data;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get Serie A matches for specified season (defaults to current season)
   */
  async getSerieAMatches(matchday?: number, season?: string): Promise<FootballDataMatch[]> {
    let endpoint = `/competitions/${SERIE_A_COMPETITION_ID}/matches?status=SCHEDULED,LIVE,FINISHED`;
    
    if (matchday) {
      endpoint += `&matchday=${matchday}`;
    }

    // Convert season format and add parameter if provided
    if (season) {
      const apiYear = this.convertSeasonToApiFormat(season);
      endpoint += `&season=${apiYear}`;
    }

    const response = await this.makeRequest<FootballDataResponse<FootballDataMatch>>(endpoint);
    return response.matches || [];
  }

  /**
   * Get Serie A standings for specified season (defaults to current season)
   */
  async getSerieAStandings(season?: string): Promise<FootballDataStanding[]> {
    let endpoint = `/competitions/${SERIE_A_COMPETITION_ID}/standings`;
    
    // Convert season format and add parameter if provided
    if (season) {
      const apiYear = this.convertSeasonToApiFormat(season);
      endpoint += `?season=${apiYear}`;
    }
    
    const response = await this.makeRequest<FootballDataResponse<FootballDataStanding>>(endpoint);
    
    // Serie A should have one standings table
    return response.standings?.[0]?.table || [];
  }

  /**
   * Get specific match by ID
   */
  async getMatch(matchId: number): Promise<FootballDataMatch> {
    const endpoint = `/matches/${matchId}`;
    return this.makeRequest<FootballDataMatch>(endpoint);
  }

  /**
   * Transform Football-data.org match to our Match format
   */
  transformMatch(apiMatch: FootballDataMatch, season?: string): Omit<Match, 'id'> {
    return {
      home_team: apiMatch.homeTeam.name,
      away_team: apiMatch.awayTeam.name,
      home_score: apiMatch.score.fullTime.home,
      away_score: apiMatch.score.fullTime.away,
      match_date: apiMatch.utcDate,
      round: apiMatch.matchday,
      status: this.mapMatchStatus(apiMatch.status),
      external_api_id: apiMatch.id.toString(),
      season_id: season || this.getCurrentSeason(),
    };
  }

  /**
   * Transform Football-data.org standing to our SerieAStanding format
   */
  transformStanding(apiStanding: FootballDataStanding, season: string): Omit<SerieAStanding, 'id' | 'updated_at'> {
    return {
      team_name: apiStanding.team.name,
      position: apiStanding.position,
      played: apiStanding.playedGames,
      won: apiStanding.won,
      drawn: apiStanding.draw,
      lost: apiStanding.lost,
      goals_for: apiStanding.goalsFor,
      goals_against: apiStanding.goalsAgainst,
      goal_difference: apiStanding.goalDifference,
      points: apiStanding.points,
      season,
    };
  }

  /**
   * Map Football-data.org status to our status format
   */
  private mapMatchStatus(apiStatus: string): 'scheduled' | 'live' | 'completed' {
    switch (apiStatus) {
      case 'SCHEDULED':
      case 'TIMED':
        return 'scheduled';
      case 'IN_PLAY':
      case 'PAUSED':
      case 'LIVE':
        return 'live';
      case 'FINISHED':
      case 'AWARDED':
      case 'POSTPONED':
      case 'CANCELLED':
      case 'SUSPENDED':
        return 'completed';
      default:
        return 'scheduled';
    }
  }

  /**
   * Get current Serie A season string (e.g., "2024-25")
   * 
   * TEMP: For demo purposes, return 2024-25 which matches our database
   * In production, this should be dynamic based on actual season dates
   */
  getCurrentSeason(): string {
    // TESTING STRATEGY: Start with 2024-25 (known good data)
    // Switch to 2025-26 after verifying sync works
    return '2024-25';
    
    /* Dynamic logic (to be restored when needed):
    const now = new Date();
    const year = now.getFullYear();
    
    // Serie A season typically starts in August and ends in May/June
    // If we're before August, we're still in the previous season
    if (now.getMonth() < 7) { // 7 = August (0-indexed)
      const startYear = year - 1;
      const endYear = year;
      return `${startYear}-${endYear.toString().slice(-2)}`;
    } else {
      const startYear = year;
      const endYear = year + 1;
      return `${startYear}-${endYear.toString().slice(-2)}`;
    }
    */
  }

  /**
   * Convert our season format (2024-25) to Football-data.org format (2024)
   * @param season Season string like "2024-25"
   * @returns Year for API call like "2024"
   */
  convertSeasonToApiFormat(season: string): string {
    const [startYear] = season.split('-');
    return startYear;
  }

  /**
   * Convert Football-data.org format (2024) to our season format (2024-25)
   * @param apiYear Year from API like "2024"
   * @returns Season string like "2024-25"
   */
  convertApiYearToSeason(apiYear: string): string {
    const startYear = parseInt(apiYear);
    const endYear = startYear + 1;
    return `${startYear}-${endYear.toString().slice(-2)}`;
  }

  /**
   * Get a specific season string for historical data
   * @param startYear The starting year of the season (e.g., 2024 for "2024-25")
   */
  getSeasonString(startYear: number): string {
    const endYear = startYear + 1;
    return `${startYear}-${endYear.toString().slice(-2)}`;
  }

  /**
   * Parse season string to get start and end years
   * @param season Season string like "2024-25"
   * @returns Object with startYear and endYear
   */
  parseSeasonString(season: string): { startYear: number; endYear: number } {
    const [startStr, endStr] = season.split('-');
    const startYear = parseInt(startStr);
    const endYear = endStr.length === 2 ? 2000 + parseInt(endStr) : parseInt(endStr);
    
    return { startYear, endYear };
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

export const footballDataService = new FootballDataService();