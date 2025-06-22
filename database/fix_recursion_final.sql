-- Complete fix for infinite recursion in RLS policies
-- This creates completely isolated policies without cross-table references
-- Execute this in Supabase SQL Editor

-- ===========================================
-- STEP 1: Clean ALL policies completely
-- ===========================================

-- Drop ALL policies on league_members
DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename = 'league_members') 
    LOOP 
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
    END LOOP; 
END $$;

-- Drop ALL policies on leagues that might reference league_members
DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename = 'leagues') 
    LOOP 
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
    END LOOP; 
END $$;

-- Drop ALL policies on predictions that might reference league_members
DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename = 'predictions') 
    LOOP 
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
    END LOOP; 
END $$;

-- ===========================================
-- STEP 2: Create completely isolated policies
-- ===========================================

-- LEAGUES TABLE - Simple policies, no references to league_members
CREATE POLICY "leagues_select_simple" ON leagues FOR SELECT
  USING (
    -- Only league creators can see their own leagues initially
    creator_id = auth.uid()
  );

CREATE POLICY "leagues_insert_simple" ON leagues FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND creator_id = auth.uid()
  );

CREATE POLICY "leagues_update_simple" ON leagues FOR UPDATE
  USING (creator_id = auth.uid());

CREATE POLICY "leagues_delete_simple" ON leagues FOR DELETE
  USING (creator_id = auth.uid());

-- LEAGUE_MEMBERS TABLE - Simple policies, minimal cross-references
CREATE POLICY "league_members_select_simple" ON league_members FOR SELECT
  USING (
    -- Users can always see their own membership records
    user_id = auth.uid()
  );

CREATE POLICY "league_members_insert_simple" ON league_members FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND user_id = auth.uid()
  );

CREATE POLICY "league_members_update_simple" ON league_members FOR UPDATE
  USING (
    -- Users can update their own membership
    user_id = auth.uid()
  );

CREATE POLICY "league_members_delete_simple" ON league_members FOR DELETE
  USING (
    -- Users can leave leagues (delete their own membership)
    user_id = auth.uid()
  );

-- PREDICTIONS TABLE - Simple policies
CREATE POLICY "predictions_select_simple" ON predictions FOR SELECT
  USING (
    -- Users can only see their own predictions initially
    user_id = auth.uid()
  );

CREATE POLICY "predictions_insert_simple" ON predictions FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND user_id = auth.uid()
  );

CREATE POLICY "predictions_update_simple" ON predictions FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "predictions_delete_simple" ON predictions FOR DELETE
  USING (user_id = auth.uid());

-- ===========================================
-- STEP 3: Create helper functions to handle complex logic
-- ===========================================

-- Function to get user's leagues (no RLS involved)
CREATE OR REPLACE FUNCTION get_user_leagues(user_uuid uuid)
RETURNS TABLE(league_id uuid, league_name text, role text, is_creator boolean) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lm.league_id,
    l.name,
    lm.role,
    (l.creator_id = user_uuid) as is_creator
  FROM league_members lm
  JOIN leagues l ON l.id = lm.league_id
  WHERE lm.user_id = user_uuid 
  AND lm.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can access league data
CREATE OR REPLACE FUNCTION can_access_league(league_uuid uuid, user_uuid uuid)
RETURNS boolean AS $$
DECLARE
  result boolean := false;
BEGIN
  -- Check if user is creator
  SELECT EXISTS (
    SELECT 1 FROM leagues 
    WHERE id = league_uuid AND creator_id = user_uuid
  ) INTO result;
  
  IF result THEN
    RETURN true;
  END IF;
  
  -- Check if user is member
  SELECT EXISTS (
    SELECT 1 FROM league_members 
    WHERE league_id = league_uuid 
    AND user_id = user_uuid 
    AND is_active = true
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_leagues(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_league(uuid, uuid) TO authenticated;

-- ===========================================
-- STEP 4: Create views for complex queries (no RLS)
-- ===========================================

-- View for league details with member count
CREATE OR REPLACE VIEW league_details AS
SELECT 
  l.id,
  l.name,
  l.invite_code,
  l.creator_id,
  l.created_at,
  COUNT(lm.user_id) as member_count
FROM leagues l
LEFT JOIN league_members lm ON l.id = lm.league_id AND lm.is_active = true
GROUP BY l.id, l.name, l.invite_code, l.creator_id, l.created_at;

-- View for user league memberships
CREATE OR REPLACE VIEW user_league_memberships AS
SELECT 
  lm.user_id,
  lm.league_id,
  l.name as league_name,
  l.invite_code,
  l.creator_id,
  lm.role,
  lm.joined_at,
  lm.total_points,
  lm.is_active,
  (l.creator_id = lm.user_id) as is_creator
FROM league_members lm
JOIN leagues l ON l.id = lm.league_id;

-- Grant access to views
GRANT SELECT ON league_details TO authenticated;
GRANT SELECT ON user_league_memberships TO authenticated;

-- ===========================================
-- STEP 5: Update application queries to use functions/views
-- ===========================================

-- Note: The application should now use:
-- 1. get_user_leagues(auth.uid()) to get user's leagues
-- 2. can_access_league(league_id, auth.uid()) to check access
-- 3. Views for complex data without RLS complications