-- Fix Season Management - ScoreKick
-- Questo script risolve il problema delle stagioni in modo robusto

-- ===== STEP 1: Pulire stato corrente =====
-- Disattivare tutte le stagioni esistenti
UPDATE seasons SET is_active = false;

-- ===== STEP 2: Strategia testing-friendly =====
-- Per testare, iniziamo con stagione 2024-25 (dati completi)
-- Poi passeremo a 2025-26 quando tutto funziona

-- Inserire stagione 2024-25 se non esiste
INSERT INTO seasons (year, start_date, end_date, is_active) 
SELECT '2024-25', '2024-08-01', '2025-05-31', false
WHERE NOT EXISTS (SELECT 1 FROM seasons WHERE year = '2024-25');

-- Inserire stagione 2025-26 se non esiste  
INSERT INTO seasons (year, start_date, end_date, is_active) 
SELECT '2025-26', '2025-08-01', '2026-05-31', false
WHERE NOT EXISTS (SELECT 1 FROM seasons WHERE year = '2025-26');

-- ===== STEP 3: Attivare stagione per testing =====
-- STRATEGIA: Iniziare con 2024-25 per avere dati sicuri
UPDATE seasons SET is_active = true WHERE year = '2024-25';

-- ===== STEP 4: Pulizia dati per sync pulita =====
-- Rimuovere dati standings vecchi che potrebbero confliggere
DELETE FROM serie_a_standings WHERE season NOT IN ('2024-25', '2025-26');

-- Pulire matches senza season_id (saranno risinronizzati)
DELETE FROM matches WHERE season_id IS NULL;

-- ===== STEP 5: Verifica setup =====
-- Mostrare stato finale
SELECT 
    year as stagione,
    is_active as attiva,
    start_date as inizio,
    end_date as fine
FROM seasons 
ORDER BY year;

-- Contare dati esistenti
SELECT 
    'serie_a_standings' as tabella,
    season,
    COUNT(*) as records
FROM serie_a_standings 
GROUP BY season
UNION ALL
SELECT 
    'matches' as tabella,
    s.year as season,
    COUNT(m.*) as records
FROM seasons s
LEFT JOIN matches m ON m.season_id = s.id
GROUP BY s.year
ORDER BY tabella, season;

-- Mostrare UUID della stagione attiva (servirà per Edge Function)
SELECT 
    id as season_uuid,
    year as season_year,
    'ATTIVA' as status
FROM seasons 
WHERE is_active = true;