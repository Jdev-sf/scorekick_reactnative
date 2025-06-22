-- Add Current Season 2025-26
-- Insert the actual current season and migrate data

-- Step 1: Deactivate ALL existing seasons first (to avoid exclusion constraint)
UPDATE seasons SET is_active = false;

-- Step 2: Insert current season 2025-26 (only if it doesn't exist)
INSERT INTO seasons (year, start_date, end_date, is_active) 
SELECT '2025-26', '2025-08-01', '2026-05-31', false
WHERE NOT EXISTS (SELECT 1 FROM seasons WHERE year = '2025-26');

-- Step 3: Now activate the current season (only one active at a time)
UPDATE seasons SET is_active = true WHERE year = '2025-26';

-- Clear old standings data (will be repopulated by sync)
DELETE FROM serie_a_standings WHERE season = '2024-25';

-- Clear old matches if any
DELETE FROM matches WHERE season_id IS NULL OR season_id NOT IN (
    SELECT id FROM seasons WHERE year = '2025-26'
);

-- Verify
SELECT * FROM seasons ORDER BY year;
SELECT COUNT(*) as standings_count FROM serie_a_standings WHERE season = '2025-26';