export interface Season {
  id: string;
  year: string; // e.g. "2024-25"
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  match_date: string;
  round: number;
  status: 'scheduled' | 'live' | 'completed';
  external_api_id?: string;
  season_id: string;
}

export interface SerieAStanding {
  id: string;
  team_name: string;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  season: string;
  updated_at: string;
}

export interface FootballDataMatch {
  id: number;
  utcDate: string;
  status: string;
  matchday: number;
  homeTeam: {
    id: number;
    name: string;
    shortName: string;
    tla: string;
  };
  awayTeam: {
    id: number;
    name: string;
    shortName: string;
    tla: string;
  };
  score: {
    fullTime: {
      home: number | null;
      away: number | null;
    };
  };
}

export interface FootballDataStanding {
  position: number;
  team: {
    id: number;
    name: string;
    shortName: string;
    tla: string;
  };
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface FootballDataResponse<T> {
  matches?: T[];
  standings?: Array<{
    table: T[];
  }>;
}

export interface MatchFilters {
  round?: number;
  status?: 'scheduled' | 'live' | 'completed';
  dateFrom?: string;
  dateTo?: string;
}

export interface LeagueParticipation {
  id: string;
  league_id: string;
  season_id: string;
  user_id: string;
  role: 'creator' | 'admin' | 'member';
  joined_at: string;
  total_points: number;
  final_position: number | null; // NULL for active season
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SeasonContext {
  currentSeason: Season | null;
  selectedSeason: Season | null;
  availableSeasons: Season[];
  isLoadingSeasons: boolean;
}

export interface SyncResult {
  matchesUpdated: number;
  standingsUpdated: number;
  errors: string[];
}