-- Complete RLS Policies Fix for ScoreKick
-- Execute this in Supabase SQL Editor

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE serie_a_standings ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

DROP POLICY IF EXISTS "Users can view leagues they belong to" ON leagues;
DROP POLICY IF EXISTS "Users can create leagues" ON leagues;
DROP POLICY IF EXISTS "League creators can update their leagues" ON leagues;
DROP POLICY IF EXISTS "League creators can delete their leagues" ON leagues;

DROP POLICY IF EXISTS "Users can view league members" ON league_members;
DROP POLICY IF EXISTS "Users can view league members of their leagues" ON league_members;
DROP POLICY IF EXISTS "Users can join leagues" ON league_members;
DROP POLICY IF EXISTS "Users can manage league members as creators/admins" ON league_members;
DROP POLICY IF EXISTS "League creators can remove members" ON league_members;

DROP POLICY IF EXISTS "Everyone can view matches" ON matches;
DROP POLICY IF EXISTS "Service role can manage matches" ON matches;

DROP POLICY IF EXISTS "Users can view predictions in their leagues" ON predictions;
DROP POLICY IF EXISTS "Users can manage their own predictions" ON predictions;
DROP POLICY IF EXISTS "Users can create predictions" ON predictions;
DROP POLICY IF EXISTS "Users can update their own predictions" ON predictions;
DROP POLICY IF EXISTS "Users can delete their own predictions" ON predictions;

DROP POLICY IF EXISTS "Everyone can view achievements" ON achievements;
DROP POLICY IF EXISTS "Users can view their achievements" ON user_achievements;
DROP POLICY IF EXISTS "System can award achievements" ON user_achievements;

DROP POLICY IF EXISTS "Everyone can view standings" ON serie_a_standings;

-- ===========================================
-- USERS TABLE POLICIES
-- ===========================================

-- Users can view and manage their own profile
CREATE POLICY "Users can view their own profile" ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ===========================================
-- LEAGUES TABLE POLICIES
-- ===========================================

-- Users can view leagues they belong to or created
CREATE POLICY "Users can view accessible leagues" ON leagues FOR SELECT
  USING (
    creator_id = auth.uid()
    OR 
    id IN (
      SELECT league_id FROM league_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Authenticated users can create leagues
CREATE POLICY "Authenticated users can create leagues" ON leagues FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND creator_id = auth.uid());

-- League creators can update their leagues
CREATE POLICY "League creators can update their leagues" ON leagues FOR UPDATE
  USING (creator_id = auth.uid());

-- League creators can delete their leagues
CREATE POLICY "League creators can delete their leagues" ON leagues FOR DELETE
  USING (creator_id = auth.uid());

-- ===========================================
-- LEAGUE_MEMBERS TABLE POLICIES
-- ===========================================

-- Users can view members of leagues they belong to
CREATE POLICY "Users can view league members" ON league_members FOR SELECT
  USING (
    -- User can see members of leagues they created
    league_id IN (SELECT id FROM leagues WHERE creator_id = auth.uid())
    OR
    -- User can see their own membership
    user_id = auth.uid()
    OR
    -- User can see members of leagues they belong to
    league_id IN (
      SELECT league_id FROM league_members lm 
      WHERE lm.user_id = auth.uid() AND lm.is_active = true
    )
  );

-- Users can join leagues (insert membership)
CREATE POLICY "Users can join leagues" ON league_members FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND user_id = auth.uid()
  );

-- Users can update their own membership status, creators/admins can update others
CREATE POLICY "Users and admins can update memberships" ON league_members FOR UPDATE
  USING (
    user_id = auth.uid() -- User updating their own membership
    OR
    league_id IN (SELECT id FROM leagues WHERE creator_id = auth.uid()) -- League creator
    OR
    EXISTS (
      SELECT 1 FROM league_members lm
      WHERE lm.league_id = league_members.league_id
      AND lm.user_id = auth.uid()
      AND lm.role IN ('creator', 'admin')
      AND lm.is_active = true
    ) -- League admin
  );

-- Only creators and admins can remove members
CREATE POLICY "Creators and admins can remove members" ON league_members FOR DELETE
  USING (
    league_id IN (SELECT id FROM leagues WHERE creator_id = auth.uid()) -- League creator
    OR
    EXISTS (
      SELECT 1 FROM league_members lm
      WHERE lm.league_id = league_members.league_id
      AND lm.user_id = auth.uid()
      AND lm.role IN ('creator', 'admin')
      AND lm.is_active = true
    ) -- League admin
  );

-- ===========================================
-- MATCHES TABLE POLICIES
-- ===========================================

-- Everyone can view matches (they are public data)
CREATE POLICY "Everyone can view matches" ON matches FOR SELECT
  USING (true);

-- Only service role can manage matches (for API sync)
CREATE POLICY "Service role can manage matches" ON matches FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ===========================================
-- PREDICTIONS TABLE POLICIES
-- ===========================================

-- Users can view predictions in leagues they belong to
CREATE POLICY "Users can view league predictions" ON predictions FOR SELECT
  USING (
    league_id IN (
      SELECT league_id FROM league_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Users can create predictions for their leagues
CREATE POLICY "Users can create predictions" ON predictions FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND league_id IN (
      SELECT league_id FROM league_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Users can update their own predictions
CREATE POLICY "Users can update their predictions" ON predictions FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own predictions
CREATE POLICY "Users can delete their predictions" ON predictions FOR DELETE
  USING (user_id = auth.uid());

-- ===========================================
-- ACHIEVEMENTS TABLE POLICIES
-- ===========================================

-- Everyone can view achievements (they are public)
CREATE POLICY "Everyone can view achievements" ON achievements FOR SELECT
  USING (true);

-- Only service role can manage achievements
CREATE POLICY "Service role can manage achievements" ON achievements FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ===========================================
-- USER_ACHIEVEMENTS TABLE POLICIES
-- ===========================================

-- Users can view their own achievements
CREATE POLICY "Users can view their achievements" ON user_achievements FOR SELECT
  USING (user_id = auth.uid());

-- System can award achievements (service role or authenticated users for self)
CREATE POLICY "System can award achievements" ON user_achievements FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
    OR 
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
  );

-- ===========================================
-- SERIE_A_STANDINGS TABLE POLICIES
-- ===========================================

-- Everyone can view standings (they are public data)
CREATE POLICY "Everyone can view standings" ON serie_a_standings FOR SELECT
  USING (true);

-- Only service role can manage standings
CREATE POLICY "Service role can manage standings" ON serie_a_standings FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ===========================================
-- ADDITIONAL FUNCTIONS FOR RLS
-- ===========================================

-- Function to check if user is league admin
CREATE OR REPLACE FUNCTION is_league_admin(league_uuid uuid, user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM league_members
    WHERE league_id = league_uuid
    AND user_id = user_uuid
    AND role IN ('creator', 'admin')
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is league member
CREATE OR REPLACE FUNCTION is_league_member(league_uuid uuid, user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM league_members
    WHERE league_id = league_uuid
    AND user_id = user_uuid
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;