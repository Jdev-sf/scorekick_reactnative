-- Fix Season Format Migration
-- Convert "2024-2025" format to "2024-25" format for consistency

-- Update serie_a_standings table
UPDATE serie_a_standings 
SET season = '2024-25' 
WHERE season = '2024-2025';

-- Update seasons table if it exists
UPDATE seasons 
SET year = '2024-25' 
WHERE year = '2024-2025';

-- Verify changes
SELECT DISTINCT season FROM serie_a_standings ORDER BY season;
SELECT DISTINCT year FROM seasons ORDER BY year;