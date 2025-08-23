import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Football-data.org API configuration
const FOOTBALL_DATA_API_URL = 'https://api.football-data.org/v4'
const SERIE_A_COMPETITION_ID = 'SA'
const FOOTBALL_DATA_API_KEY = Deno.env.get('FOOTBALL_DATA_API_KEY') ?? ''

interface FootballDataMatch {
  id: number
  utcDate: string
  status: string
  matchday: number
  homeTeam: {
    id: number
    name: string
  }
  awayTeam: {
    id: number
    name: string
  }
  score: {
    fullTime: {
      home: number | null
      away: number | null
    }
  }
}

interface FootballDataStanding {
  position: number
  team: {
    id: number
    name: string
  }
  playedGames: number
  won: number
  draw: number
  lost: number
  points: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const result = {
      matchesUpdated: 0,
      standingsUpdated: 0,
      errors: [] as string[]
    }

    // Rate limiting: wait between requests
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    // Check if API key is configured
    if (!FOOTBALL_DATA_API_KEY) {
      throw new Error('FOOTBALL_DATA_API_KEY environment variable not configured')
    }

    // Function to make Football-data.org API requests
    const makeApiRequest = async (endpoint: string) => {
      const response = await fetch(`${FOOTBALL_DATA_API_URL}${endpoint}`, {
        headers: {
          'X-Auth-Token': FOOTBALL_DATA_API_KEY,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status} - ${await response.text()}`)
      }

      return response.json()
    }

    // Transform Football-data match to our format
    const transformMatch = (apiMatch: FootballDataMatch) => {
      const mapStatus = (status: string) => {
        switch (status) {
          case 'SCHEDULED':
          case 'TIMED':
            return 'scheduled'
          case 'IN_PLAY':
          case 'PAUSED':
          case 'LIVE':
            return 'live'
          case 'FINISHED':
          case 'AWARDED':
          case 'POSTPONED':
          case 'CANCELLED':
          case 'SUSPENDED':
            return 'completed'
          default:
            return 'scheduled'
        }
      }

      return {
        home_team: apiMatch.homeTeam.name,
        away_team: apiMatch.awayTeam.name,
        home_score: apiMatch.score.fullTime.home,
        away_score: apiMatch.score.fullTime.away,
        match_date: apiMatch.utcDate,
        round: apiMatch.matchday,
        status: mapStatus(apiMatch.status),
        external_api_id: apiMatch.id.toString(),
      }
    }

    // Transform Football-data standing to our format
    const transformStanding = (apiStanding: FootballDataStanding, season: string) => {
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
      }
    }

    // Get current season based on actual match data
    const getCurrentSeason = async () => {
      const now = new Date()
      const year = now.getFullYear()
      
      // Try both possible seasons for current year
      const possibleSeasons = [
        `${year}-${(year + 1).toString().slice(-2)}`,    // e.g., 2025-26
        `${year - 1}-${year.toString().slice(-2)}`       // e.g., 2024-25
      ]
      
      // Check which season has active matches by querying Football Data API
      for (const season of possibleSeasons) {
        try {
          const apiSeason = convertSeasonToApiFormat(season)
          console.log(`Checking season ${season} (API: ${apiSeason}) for current matches...`)
          
          const response = await makeApiRequest(`/competitions/${SERIE_A_COMPETITION_ID}/matches?status=SCHEDULED,LIVE&season=${apiSeason}&limit=5`)
          const matches = response.matches || []
          
          if (matches.length > 0) {
            // Check if any matches are in the near future (within 6 months)
            const sixMonthsFromNow = new Date()
            sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6)
            
            const hasUpcomingMatches = matches.some((match: FootballDataMatch) => {
              const matchDate = new Date(match.utcDate)
              return matchDate >= now && matchDate <= sixMonthsFromNow
            })
            
            if (hasUpcomingMatches) {
              console.log(`Found active season: ${season} with ${matches.length} upcoming matches`)
              return season
            }
          }
        } catch (error) {
          console.log(`Season ${season} not available or no matches found`)
          continue
        }
      }
      
      // Fallback to date-based logic if API check fails
      console.log('Falling back to date-based season detection...')
      if (now.getMonth() < 7) { // January to July
        return `${year - 1}-${year.toString().slice(-2)}`
      } else { // August to December  
        return `${year}-${(year + 1).toString().slice(-2)}`
      }
    }
    
    // Convert season format for API calls (2024-25 -> 2024)
    const convertSeasonToApiFormat = (season: string): string => {
      const [startYear] = season.split('-')
      return startYear
    }

    // Ensure season exists in database and get its UUID
    const ensureSeasonExists = async (seasonYear: string): Promise<string> => {
      console.log(`Ensuring season ${seasonYear} exists in database...`)
      
      // Check if season exists
      const { data: existingSeason, error: fetchError } = await supabaseAdmin
        .from('seasons')
        .select('id, is_active')
        .eq('year', seasonYear)
        .single()

      if (existingSeason) {
        console.log(`Season ${seasonYear} found with ID: ${existingSeason.id}`)
        return existingSeason.id
      }

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error(`Error checking season: ${fetchError.message}`)
      }

      // Season doesn't exist, create it
      console.log(`Creating season ${seasonYear}...`)
      
      // Calculate dates based on season year
      const [startYearStr] = seasonYear.split('-')
      const startYear = parseInt(startYearStr)
      const startDate = `${startYear}-08-01`
      const endDate = `${startYear + 1}-05-31`

      // First deactivate all seasons
      await supabaseAdmin
        .from('seasons')
        .update({ is_active: false })
        .neq('id', '00000000-0000-0000-0000-000000000000') // Update all

      // Create new season as active
      const { data: newSeason, error: createError } = await supabaseAdmin
        .from('seasons')
        .insert({
          year: seasonYear,
          start_date: startDate,
          end_date: endDate,
          is_active: true
        })
        .select('id')
        .single()

      if (createError) {
        throw new Error(`Error creating season: ${createError.message}`)
      }

      console.log(`Created season ${seasonYear} with ID: ${newSeason.id}`)
      return newSeason.id
    }

    console.log('Starting sync process...')

    // Sync Matches
    try {
      const currentSeason = await getCurrentSeason()
      const seasonId = await ensureSeasonExists(currentSeason)
      const apiSeason = convertSeasonToApiFormat(currentSeason)
      
      console.log(`Fetching matches from Football-data.org for season ${currentSeason} (API: ${apiSeason})...`)
      const matchesResponse = await makeApiRequest(`/competitions/${SERIE_A_COMPETITION_ID}/matches?status=SCHEDULED,LIVE,FINISHED&season=${apiSeason}`)
      const apiMatches = matchesResponse.matches || []

      console.log(`Processing ${apiMatches.length} matches for season ${currentSeason} (season_id: ${seasonId})...`)
      
      // DEBUG: Log first match to verify season
      if (apiMatches.length > 0) {
        console.log(`DEBUG - First match: ${apiMatches[0].homeTeam.name} vs ${apiMatches[0].awayTeam.name} on ${apiMatches[0].utcDate}`)
      }

      for (const apiMatch of apiMatches) {
        await delay(100) // Small delay to avoid overwhelming the database

        try {
          const matchData = transformMatch(apiMatch)
          
          // Check if match exists
          const { data: existingMatch } = await supabaseAdmin
            .from('matches')
            .select('id, home_score, away_score, status')
            .eq('external_api_id', matchData.external_api_id)
            .single()

          if (existingMatch) {
            // Update existing match if needed
            const needsUpdate = 
              existingMatch.home_score !== matchData.home_score ||
              existingMatch.away_score !== matchData.away_score ||
              existingMatch.status !== matchData.status

            if (needsUpdate) {
              const { error } = await supabaseAdmin
                .from('matches')
                .update({
                  home_score: matchData.home_score,
                  away_score: matchData.away_score,
                  status: matchData.status,
                })
                .eq('id', existingMatch.id)

              if (error) {
                result.errors.push(`Failed to update match ${matchData.home_team} vs ${matchData.away_team}: ${error.message}`)
              } else {
                result.matchesUpdated++
              }
            }
          } else {
            // Insert new match with correct season_id
            const { error } = await supabaseAdmin
              .from('matches')
              .insert({
                ...matchData,
                season_id: seasonId
              })

            if (error) {
              result.errors.push(`Failed to insert match ${matchData.home_team} vs ${matchData.away_team}: ${error.message}`)
            } else {
              result.matchesUpdated++
            }
          }
        } catch (error) {
          result.errors.push(`Error processing match: ${error.message}`)
        }
      }
    } catch (error) {
      result.errors.push(`Failed to fetch matches: ${error.message}`)
    }

    // Wait before next API call (rate limiting)
    await delay(6000)

    // Sync Standings
    try {
      const currentSeason = await getCurrentSeason()
      const apiSeason = convertSeasonToApiFormat(currentSeason)
      console.log(`Fetching standings from Football-data.org for season ${currentSeason} (API: ${apiSeason})...`)
      const standingsResponse = await makeApiRequest(`/competitions/${SERIE_A_COMPETITION_ID}/standings?season=${apiSeason}`)
      const apiStandings = standingsResponse.standings?.[0]?.table || []

      console.log(`Processing ${apiStandings.length} standings for season ${currentSeason}...`)
      
      // DEBUG: Log first few teams to verify season
      if (apiStandings.length > 0) {
        const topTeams = apiStandings.slice(0, 3).map(t => t.team.name).join(', ')
        console.log(`DEBUG - Top teams: ${topTeams}`)
      }

      for (const apiStanding of apiStandings) {
        await delay(50) // Small delay

        try {
          const standingData = transformStanding(apiStanding, currentSeason)
          
          const { error } = await supabaseAdmin
            .from('serie_a_standings')
            .upsert(standingData, {
              onConflict: 'team_name,season',
              ignoreDuplicates: false
            })

          if (error) {
            result.errors.push(`Failed to sync standing for ${standingData.team_name}: ${error.message}`)
          } else {
            result.standingsUpdated++
          }
        } catch (error) {
          result.errors.push(`Error processing standing: ${error.message}`)
        }
      }
    } catch (error) {
      result.errors.push(`Failed to fetch standings: ${error.message}`)
    }

    console.log('Sync completed:', result)

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})