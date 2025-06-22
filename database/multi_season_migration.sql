-- ScoreKick Multi-Season Architecture Migration
-- This script implements the multi-season architecture as described in the requirements

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===== STEP 1: Create Seasons Table =====
CREATE TABLE IF NOT EXISTS seasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year VARCHAR(10) NOT NULL UNIQUE, -- e.g. "2024-25"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure only one active season at a time
  CONSTRAINT unique_active_season EXCLUDE (is_active WITH =) WHERE (is_active = true)
);

-- ===== STEP 2: Create League Participations Table =====
-- This replaces the old league_members table with season-aware participations
CREATE TABLE IF NOT EXISTS league_participations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(10) CHECK (role IN ('creator', 'admin', 'member')) NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_points INTEGER DEFAULT 0,
  final_position INTEGER, -- NULL during active season, set when season ends
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique participation per user/league/season
  CONSTRAINT unique_user_league_season UNIQUE (league_id, season_id, user_id),
  
  -- Only one creator per league per season
  CONSTRAINT unique_creator_per_league_season EXCLUDE (league_id WITH =, season_id WITH =) WHERE (role = 'creator')
);

-- ===== STEP 3: Add Season Context to Existing Tables =====

-- Add season_id to matches table (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'matches' AND column_name = 'season_id') THEN
        ALTER TABLE matches ADD COLUMN season_id UUID REFERENCES seasons(id);
    END IF;
END $$;

-- Add season_id to predictions table (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'predictions' AND column_name = 'season_id') THEN
        ALTER TABLE predictions ADD COLUMN season_id UUID REFERENCES seasons(id);
    END IF;
END $$;

-- ===== STEP 4: Create Default Current Season =====
-- Insert the current 2024-25 season as active (only if it doesn't exist)
INSERT INTO seasons (year, start_date, end_date, is_active) 
SELECT '2024-25', '2024-08-01', '2025-05-31', true
WHERE NOT EXISTS (SELECT 1 FROM seasons WHERE year = '2024-25');

-- ===== STEP 5: Migrate Existing Data =====

-- Get the current season ID for data migration
DO $$
DECLARE
    current_season_id UUID;
    league_members_count INTEGER;
BEGIN
    -- Get the active season ID
    SELECT id INTO current_season_id FROM seasons WHERE is_active = true LIMIT 1;
    
    -- Check if league_members table exists and has data
    SELECT COUNT(*) INTO league_members_count 
    FROM information_schema.tables 
    WHERE table_name = 'league_members';
    
    -- Migrate existing league_members to league_participations (only if league_members exists and league_participations is empty)
    IF league_members_count > 0 AND NOT EXISTS (SELECT 1 FROM league_participations LIMIT 1) THEN
        INSERT INTO league_participations (league_id, season_id, user_id, role, joined_at, total_points, is_active)
        SELECT 
            league_id,
            current_season_id,
            user_id,
            role,
            joined_at,
            total_points,
            is_active
        FROM league_members;
    END IF;
    
    -- Update existing matches with current season (only if season_id is NULL)
    UPDATE matches 
    SET season_id = current_season_id 
    WHERE season_id IS NULL AND current_season_id IS NOT NULL;
    
    -- Update existing predictions with current season (only if season_id is NULL)
    UPDATE predictions 
    SET season_id = current_season_id 
    WHERE season_id IS NULL AND current_season_id IS NOT NULL;
END $$;

-- ===== STEP 6: Add Constraints After Migration =====

-- Make season_id NOT NULL after migration
ALTER TABLE matches 
ALTER COLUMN season_id SET NOT NULL;

ALTER TABLE predictions 
ALTER COLUMN season_id SET NOT NULL;

-- ===== STEP 7: Create Indexes for Performance =====

-- Core indexes for season-based queries
CREATE INDEX IF NOT EXISTS idx_matches_season_id ON matches(season_id);
CREATE INDEX IF NOT EXISTS idx_predictions_season_id ON predictions(season_id);
CREATE INDEX IF NOT EXISTS idx_league_participations_league_season ON league_participations(league_id, season_id);
CREATE INDEX IF NOT EXISTS idx_league_participations_user_season ON league_participations(user_id, season_id);
CREATE INDEX IF NOT EXISTS idx_serie_a_standings_season ON serie_a_standings(season);

-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_matches_season_round ON matches(season_id, round);
CREATE INDEX IF NOT EXISTS idx_matches_season_status ON matches(season_id, status);
CREATE INDEX IF NOT EXISTS idx_predictions_league_season ON predictions(league_id, season_id);

-- ===== STEP 8: Update Database Functions =====

-- Update the league standings function to be season-aware
CREATE OR REPLACE FUNCTION update_league_standings(p_league_id UUID, p_season_id UUID DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
    current_season_id UUID;
BEGIN
    -- Use provided season_id or get active season
    IF p_season_id IS NULL THEN
        SELECT id INTO current_season_id FROM seasons WHERE is_active = true LIMIT 1;
    ELSE
        current_season_id := p_season_id;
    END IF;
    
    -- Update total points for all participants in this league/season
    UPDATE league_participations lp
    SET total_points = COALESCE(points_sum.total, 0),
        updated_at = NOW()
    FROM (
        SELECT 
            p.user_id,
            SUM(COALESCE(p.points_earned, 0)) as total
        FROM predictions p
        WHERE p.league_id = p_league_id 
        AND p.season_id = current_season_id
        GROUP BY p.user_id
    ) points_sum
    WHERE lp.user_id = points_sum.user_id
    AND lp.league_id = p_league_id
    AND lp.season_id = current_season_id;
END;
$$ LANGUAGE plpgsql;

-- Function to finalize a season (set final positions)
CREATE OR REPLACE FUNCTION finalize_season(p_season_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Set final positions based on total points for all leagues
    WITH ranked_participants AS (
        SELECT 
            id,
            ROW_NUMBER() OVER (PARTITION BY league_id ORDER BY total_points DESC, joined_at ASC) as position
        FROM league_participations
        WHERE season_id = p_season_id
    )
    UPDATE league_participations lp
    SET 
        final_position = rp.position,
        updated_at = NOW()
    FROM ranked_participants rp
    WHERE lp.id = rp.id;
    
    -- Mark season as inactive
    UPDATE seasons 
    SET 
        is_active = false,
        updated_at = NOW()
    WHERE id = p_season_id;
END;
$$ LANGUAGE plpgsql;

-- Function to start a new season
CREATE OR REPLACE FUNCTION start_new_season(
    p_year VARCHAR(10),
    p_start_date DATE,
    p_end_date DATE
)
RETURNS UUID AS $$
DECLARE
    new_season_id UUID;
BEGIN
    -- Deactivate current season
    UPDATE seasons SET is_active = false WHERE is_active = true;
    
    -- Create new season
    INSERT INTO seasons (year, start_date, end_date, is_active)
    VALUES (p_year, p_start_date, p_end_date, true)
    RETURNING id INTO new_season_id;
    
    -- Migrate active participants to new season
    INSERT INTO league_participations (league_id, season_id, user_id, role, total_points, is_active)
    SELECT 
        league_id,
        new_season_id,
        user_id,
        role,
        0, -- Reset points for new season
        is_active
    FROM league_participations lp
    WHERE lp.season_id = (
        SELECT id FROM seasons 
        WHERE is_active = false 
        ORDER BY created_at DESC 
        LIMIT 1
    )
    AND lp.is_active = true;
    
    RETURN new_season_id;
END;
$$ LANGUAGE plpgsql;

-- ===== STEP 9: Create Views for Easy Querying =====

-- View for current season data
CREATE OR REPLACE VIEW current_season_data AS
SELECT s.* FROM seasons s WHERE s.is_active = true;

-- View for active league participations
CREATE OR REPLACE VIEW active_league_participations AS
SELECT lp.*, l.name as league_name, l.invite_code as league_invite_code, u.display_name as user_display_name, s.year as season_year
FROM league_participations lp
JOIN leagues l ON lp.league_id = l.id
JOIN users u ON lp.user_id = u.id
JOIN seasons s ON lp.season_id = s.id
WHERE lp.is_active = true;

-- View for historical league standings
CREATE OR REPLACE VIEW historical_league_standings AS
SELECT 
    lp.*,
    l.name as league_name,
    l.invite_code as league_invite_code,
    u.display_name as user_display_name,
    s.year as season_year,
    s.is_active as is_current_season
FROM league_participations lp
JOIN leagues l ON lp.league_id = l.id
JOIN users u ON lp.user_id = u.id
JOIN seasons s ON lp.season_id = s.id
WHERE lp.final_position IS NOT NULL
ORDER BY s.end_date DESC, lp.final_position ASC;

-- ===== STEP 10: Clean Up Old Table =====
-- WARNING: This will drop the old league_members table
-- Only run this after confirming the migration was successful
-- DROP TABLE IF EXISTS league_members;

-- ===== STEP 11: Add Helpful Comments =====
COMMENT ON TABLE seasons IS 'Global seasons for the entire application (e.g., 2024-25, 2025-26)';
COMMENT ON TABLE league_participations IS 'User participation in leagues per season with roles and final standings';
COMMENT ON COLUMN league_participations.final_position IS 'Final position in league for completed seasons (NULL for active season)';
COMMENT ON FUNCTION update_league_standings(UUID, UUID) IS 'Updates league standings for a specific season (defaults to active season)';
COMMENT ON FUNCTION finalize_season(UUID) IS 'Finalizes a season by setting final positions and marking it inactive';
COMMENT ON FUNCTION start_new_season(VARCHAR, DATE, DATE) IS 'Starts a new season and migrates active participants';