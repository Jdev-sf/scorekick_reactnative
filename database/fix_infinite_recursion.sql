-- Fix infinite recursion in RLS policies
-- Execute this in Supabase SQL Editor

-- First, disable RLS temporarily to clean up
ALTER TABLE league_members DISABLE ROW LEVEL SECURITY;

-- Drop ALL policies for league_members to start clean
DROP POLICY IF EXISTS "Users can view league members" ON league_members;
DROP POLICY IF EXISTS "Users can view league members of their leagues" ON league_members;
DROP POLICY IF EXISTS "Users can join leagues" ON league_members;
DROP POLICY IF EXISTS "Users and admins can update memberships" ON league_members;
DROP POLICY IF EXISTS "Creators and admins can remove members" ON league_members;
DROP POLICY IF EXISTS "League creators can remove members" ON league_members;
DROP POLICY IF EXISTS "Users can manage league members as creators/admins" ON league_members;

-- Re-enable RLS
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;

-- Create SIMPLE, non-recursive policies

-- 1. SELECT: Users can view members of leagues they created OR their own membership
CREATE POLICY "league_members_select" ON league_members FOR SELECT
  USING (
    -- User can see their own membership record
    user_id = auth.uid()
    OR
    -- User can see members of leagues they created (simple direct check)
    league_id IN (
      SELECT id FROM leagues WHERE creator_id = auth.uid()
    )
  );

-- 2. INSERT: Users can join leagues (create membership for themselves)
CREATE POLICY "league_members_insert" ON league_members FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND user_id = auth.uid()
  );

-- 3. UPDATE: Users can update their own membership, creators can update any membership
CREATE POLICY "league_members_update" ON league_members FOR UPDATE
  USING (
    -- User updating their own membership
    user_id = auth.uid()
    OR
    -- League creator can update any membership in their league
    league_id IN (
      SELECT id FROM leagues WHERE creator_id = auth.uid()
    )
  );

-- 4. DELETE: Only league creators can remove members
CREATE POLICY "league_members_delete" ON league_members FOR DELETE
  USING (
    league_id IN (
      SELECT id FROM leagues WHERE creator_id = auth.uid()
    )
  );

-- Also fix the leagues SELECT policy to avoid recursion
DROP POLICY IF EXISTS "Users can view accessible leagues" ON leagues;

CREATE POLICY "leagues_select" ON leagues FOR SELECT
  USING (
    -- User created the league
    creator_id = auth.uid()
    OR
    -- User is explicitly a member (using a simpler subquery)
    EXISTS (
      SELECT 1 FROM league_members lm 
      WHERE lm.league_id = leagues.id 
      AND lm.user_id = auth.uid() 
      AND lm.is_active = true
    )
  );

-- Fix predictions policy to avoid recursion issues
DROP POLICY IF EXISTS "Users can view league predictions" ON predictions;

CREATE POLICY "predictions_select" ON predictions FOR SELECT
  USING (
    -- User owns the prediction
    user_id = auth.uid()
    OR
    -- User is member of the league (simple check)
    EXISTS (
      SELECT 1 FROM league_members lm 
      WHERE lm.league_id = predictions.league_id 
      AND lm.user_id = auth.uid() 
      AND lm.is_active = true
    )
  );

-- Update predictions INSERT policy
DROP POLICY IF EXISTS "Users can create predictions" ON predictions;

CREATE POLICY "predictions_insert" ON predictions FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM league_members lm 
      WHERE lm.league_id = predictions.league_id 
      AND lm.user_id = auth.uid() 
      AND lm.is_active = true
    )
  );

-- Create a helper view for user leagues to avoid recursion
CREATE OR REPLACE VIEW user_leagues AS
SELECT 
  lm.user_id,
  lm.league_id,
  l.name as league_name,
  l.creator_id,
  lm.role,
  lm.is_active
FROM league_members lm
JOIN leagues l ON l.id = lm.league_id
WHERE lm.is_active = true;

-- Grant access to the view
GRANT SELECT ON user_leagues TO authenticated;

-- Create a simple function to check league membership without recursion
CREATE OR REPLACE FUNCTION check_league_membership(league_uuid uuid, user_uuid uuid)
RETURNS boolean AS $$
DECLARE
  is_member boolean := false;
BEGIN
  -- Simple direct query without RLS
  SELECT EXISTS (
    SELECT 1 FROM league_members
    WHERE league_id = league_uuid
    AND user_id = user_uuid
    AND is_active = true
  ) INTO is_member;
  
  RETURN is_member;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_league_membership(uuid, uuid) TO authenticated;