-- ScoreKick Database Schema for Supabase
-- Execute this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  photo_url TEXT,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leagues table
CREATE TABLE leagues (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  invite_code VARCHAR(6) UNIQUE NOT NULL,
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- League members table
CREATE TABLE league_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(10) CHECK (role IN ('creator', 'admin', 'member')) DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_points INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(league_id, user_id)
);

-- Matches table
CREATE TABLE matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  home_team VARCHAR(50) NOT NULL,
  away_team VARCHAR(50) NOT NULL,
  home_score INTEGER,
  away_score INTEGER,
  match_date TIMESTAMP WITH TIME ZONE NOT NULL,
  round INTEGER CHECK (round >= 1 AND round <= 38) NOT NULL,
  status VARCHAR(10) CHECK (status IN ('scheduled', 'live', 'completed')) DEFAULT 'scheduled',
  external_api_id VARCHAR(50)
);

-- Predictions table
CREATE TABLE predictions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE NOT NULL,
  home_score_predicted INTEGER NOT NULL CHECK (home_score_predicted >= 0),
  away_score_predicted INTEGER NOT NULL CHECK (away_score_predicted >= 0),
  points_earned INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, match_id, league_id)
);

-- Achievements table
CREATE TABLE achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(10) NOT NULL,
  points_threshold INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL
);

-- User achievements table
CREATE TABLE user_achievements (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

-- Constraints
ALTER TABLE league_members ADD CONSTRAINT unique_creator_per_league 
  EXCLUDE (league_id WITH =) WHERE (role = 'creator');

-- Indexes for performance
CREATE INDEX idx_league_members_league_id ON league_members(league_id);
CREATE INDEX idx_league_members_user_id ON league_members(user_id);
CREATE INDEX idx_predictions_match_id ON predictions(match_id);
CREATE INDEX idx_predictions_league_id ON predictions(league_id);
CREATE INDEX idx_predictions_user_id ON predictions(user_id);
CREATE INDEX idx_matches_round ON matches(round);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_date ON matches(match_date);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_predictions_updated_at BEFORE UPDATE ON predictions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Leagues policies
CREATE POLICY "Users can view leagues they're members of" ON leagues FOR SELECT 
  USING (id IN (SELECT league_id FROM league_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can create leagues" ON leagues FOR INSERT 
  WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "League creators can update their leagues" ON leagues FOR UPDATE 
  USING (auth.uid() = creator_id);

-- League members policies
CREATE POLICY "Users can view league members of their leagues" ON league_members FOR SELECT
  USING (league_id IN (SELECT league_id FROM league_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can join leagues" ON league_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "League creators and admins can manage members" ON league_members FOR UPDATE
  USING (league_id IN (
    SELECT league_id FROM league_members 
    WHERE user_id = auth.uid() AND role IN ('creator', 'admin')
  ));

-- Matches policies (read-only for users)
CREATE POLICY "Users can view all matches" ON matches FOR SELECT TO authenticated USING (true);

-- Predictions policies
CREATE POLICY "Users can view predictions in their leagues" ON predictions FOR SELECT
  USING (league_id IN (SELECT league_id FROM league_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can create their own predictions" ON predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id AND league_id IN (
    SELECT league_id FROM league_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "Users can update their own predictions" ON predictions FOR UPDATE
  USING (auth.uid() = user_id);

-- Achievements policies
CREATE POLICY "Users can view all achievements" ON achievements FOR SELECT TO authenticated USING (true);

-- User achievements policies  
CREATE POLICY "Users can view their own achievements" ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

-- Insert default achievements
INSERT INTO achievements (name, description, icon, points_threshold, type) VALUES
('First Goal', 'Score your first points', '⚽', 1, 'total_points'),
('Century', 'Reach 100 total points', '💯', 100, 'total_points'),
('Sharp Shooter', 'Get 10 exact results', '🎯', 10, 'exact_results'),
('Perfect Round', 'Get all predictions correct in a round', '🏆', 1, 'perfect_round');

-- Function to generate invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS VARCHAR(6) AS $$
DECLARE
  chars VARCHAR(36) := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result VARCHAR(6) := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;