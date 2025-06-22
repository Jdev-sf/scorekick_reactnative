-- Fix Serie A standings constraints
-- Remove the unique constraint on position alone, keep only team_name+season

-- Drop the unique constraint on position
ALTER TABLE serie_a_standings DROP CONSTRAINT IF EXISTS serie_a_standings_position_key;

-- The constraint UNIQUE(team_name, season) is kept as it makes sense
-- Position can have duplicates during updates, final positions will be correct after all teams are processed

-- Add a new index for performance on position (without unique constraint)
CREATE INDEX IF NOT EXISTS idx_serie_a_standings_position_season ON serie_a_standings(position, season);