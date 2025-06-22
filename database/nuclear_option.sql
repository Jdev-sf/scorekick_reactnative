-- Nuclear option: completely reset all RLS policies
-- Use only if the previous script doesn't work
-- Execute this in Supabase SQL Editor

-- Disable RLS temporarily
ALTER TABLE league_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE leagues DISABLE ROW LEVEL SECURITY;
ALTER TABLE predictions DISABLE ROW LEVEL SECURITY;

-- Drop ALL policies on ALL tables
DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    -- Drop all policies on all tables
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) 
    LOOP 
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
    END LOOP; 
END $$;

-- Re-enable RLS
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Create ONLY the most basic policies needed for functionality

-- LEAGUES: Basic CRUD for creators only
CREATE POLICY "leagues_basic" ON leagues FOR ALL
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- LEAGUE_MEMBERS: Basic CRUD for own records only
CREATE POLICY "league_members_basic" ON league_members FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- PREDICTIONS: Basic CRUD for own records only
CREATE POLICY "predictions_basic" ON predictions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- USERS: Basic CRUD for own profile
CREATE POLICY "users_basic" ON users FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Make matches and standings public (they should be)
CREATE POLICY "matches_public" ON matches FOR SELECT USING (true);
CREATE POLICY "standings_public" ON serie_a_standings FOR SELECT USING (true);
CREATE POLICY "achievements_public" ON achievements FOR SELECT USING (true);

-- Service role can manage everything
CREATE POLICY "service_role_all" ON matches FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "service_role_standings" ON serie_a_standings FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "service_role_achievements" ON achievements FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- User achievements
CREATE POLICY "user_achievements_basic" ON user_achievements FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());