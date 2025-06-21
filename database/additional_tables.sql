-- Additional tables for ScoreKick
-- Execute this after the main schema.sql

-- League standings table (classifica delle leghe private)
CREATE TABLE league_standings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  position INTEGER NOT NULL,
  points INTEGER DEFAULT 0,
  exact_results INTEGER DEFAULT 0,
  correct_results INTEGER DEFAULT 0,
  predictions_made INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(league_id, user_id),
  UNIQUE(league_id, position)
);

-- Serie A standings table (classifica ufficiale Serie A)
CREATE TABLE serie_a_standings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_name VARCHAR(50) NOT NULL,
  position INTEGER NOT NULL UNIQUE,
  played INTEGER DEFAULT 0,
  won INTEGER DEFAULT 0,
  drawn INTEGER DEFAULT 0,
  lost INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  goal_difference INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  season VARCHAR(9) NOT NULL, -- e.g., "2024-2025"
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_name, season)
);

-- Indexes for performance
CREATE INDEX idx_league_standings_league_id ON league_standings(league_id);
CREATE INDEX idx_league_standings_user_id ON league_standings(user_id);
CREATE INDEX idx_league_standings_position ON league_standings(league_id, position);
CREATE INDEX idx_serie_a_standings_position ON serie_a_standings(position);
CREATE INDEX idx_serie_a_standings_season ON serie_a_standings(season);

-- Triggers for updated_at
CREATE TRIGGER update_league_standings_updated_at BEFORE UPDATE ON league_standings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_serie_a_standings_updated_at BEFORE UPDATE ON serie_a_standings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add last_updated column and trigger to league_standings
ALTER TABLE league_standings 
  RENAME COLUMN last_updated TO updated_at;

ALTER TABLE serie_a_standings 
  RENAME COLUMN last_updated TO updated_at;

-- Row Level Security (RLS) Policies
ALTER TABLE league_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE serie_a_standings ENABLE ROW LEVEL SECURITY;

-- League standings policies
CREATE POLICY "Users can view standings of their leagues" ON league_standings FOR SELECT
  USING (league_id IN (SELECT league_id FROM league_members WHERE user_id = auth.uid()));

CREATE POLICY "System can manage league standings" ON league_standings FOR ALL
  USING (true); -- This will be restricted to service role in practice

-- Serie A standings policies (read-only for all authenticated users)
CREATE POLICY "Users can view Serie A standings" ON serie_a_standings FOR SELECT 
  TO authenticated USING (true);

CREATE POLICY "System can manage Serie A standings" ON serie_a_standings FOR ALL
  USING (true); -- This will be restricted to service role in practice

-- Function to update league standings
CREATE OR REPLACE FUNCTION update_league_standings(p_league_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Delete existing standings for this league
  DELETE FROM league_standings WHERE league_id = p_league_id;
  
  -- Calculate and insert new standings
  WITH user_stats AS (
    SELECT 
      lm.user_id,
      COALESCE(SUM(p.points_earned), 0) as total_points,
      COUNT(CASE WHEN p.points_earned = 3 THEN 1 END) as exact_results,
      COUNT(CASE WHEN p.points_earned > 0 THEN 1 END) as correct_results,
      COUNT(p.id) as predictions_made
    FROM league_members lm
    LEFT JOIN predictions p ON lm.user_id = p.user_id AND lm.league_id = p.league_id
    WHERE lm.league_id = p_league_id AND lm.is_active = true
    GROUP BY lm.user_id
  ),
  ranked_users AS (
    SELECT 
      user_id,
      total_points,
      exact_results,
      correct_results,
      predictions_made,
      ROW_NUMBER() OVER (ORDER BY total_points DESC, exact_results DESC, correct_results DESC) as position
    FROM user_stats
  )
  INSERT INTO league_standings 
    (league_id, user_id, position, points, exact_results, correct_results, predictions_made)
  SELECT 
    p_league_id,
    user_id,
    position,
    total_points,
    exact_results,
    correct_results,
    predictions_made
  FROM ranked_users;
END;
$$ LANGUAGE plpgsql;

-- Insert default Serie A teams for 2024-2025 season
INSERT INTO serie_a_standings (team_name, position, season) VALUES
('Napoli', 1, '2024-2025'),
('Inter', 2, '2024-2025'),
('Atalanta', 3, '2024-2025'),
('Fiorentina', 4, '2024-2025'),
('Lazio', 5, '2024-2025'),
('Juventus', 6, '2024-2025'),
('AC Milan', 7, '2024-2025'),
('Bologna', 8, '2024-2025'),
('Udinese', 9, '2024-2025'),
('Empoli', 10, '2024-2025'),
('Roma', 11, '2024-2025'),
('Torino', 12, '2024-2025'),
('Parma', 13, '2024-2025'),
('Genoa', 14, '2024-2025'),
('Cagliari', 15, '2024-2025'),
('Lecce', 16, '2024-2025'),
('Como', 17, '2024-2025'),
('Hellas Verona', 18, '2024-2025'),
('Monza', 19, '2024-2025'),
('Venezia', 20, '2024-2025');