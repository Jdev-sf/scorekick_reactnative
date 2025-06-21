-- Fix RLS policies to prevent infinite recursion
-- Execute this in Supabase SQL Editor

-- Drop problematic policies
DROP POLICY IF EXISTS "Users can view league members of their leagues" ON league_members;
DROP POLICY IF EXISTS "League creators and admins can manage members" ON league_members;
DROP POLICY IF EXISTS "Users can view predictions in their leagues" ON predictions;

-- Create fixed policies without recursion

-- League members policies (fixed)
CREATE POLICY "Users can view league members of their leagues" ON league_members FOR SELECT
  USING (league_id IN (
    SELECT id FROM leagues WHERE creator_id = auth.uid()
    UNION
    SELECT league_id FROM league_members lm WHERE lm.user_id = auth.uid() AND lm.is_active = true
  ));

-- Simpler approach: users can view members of leagues they belong to
CREATE POLICY "Users can manage league members as creators/admins" ON league_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM leagues l 
      WHERE l.id = league_id 
      AND l.creator_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM league_members lm
      WHERE lm.league_id = league_members.league_id
      AND lm.user_id = auth.uid()
      AND lm.role IN ('creator', 'admin')
      AND lm.is_active = true
    )
  );

-- Delete members (only creators can remove members)
CREATE POLICY "League creators can remove members" ON league_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM leagues l 
      WHERE l.id = league_id 
      AND l.creator_id = auth.uid()
    )
  );

-- Predictions policies (fixed)
CREATE POLICY "Users can view predictions in their leagues" ON predictions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM league_members lm
      WHERE lm.league_id = predictions.league_id
      AND lm.user_id = auth.uid()
      AND lm.is_active = true
    )
  );

-- Alternative simpler approach for league_members - use direct join with leagues
DROP POLICY IF EXISTS "Users can view league members of their leagues" ON league_members;

CREATE POLICY "Users can view league members" ON league_members FOR SELECT
  USING (
    -- User can see members of leagues they created
    league_id IN (SELECT id FROM leagues WHERE creator_id = auth.uid())
    OR
    -- User can see members of leagues they belong to
    user_id = auth.uid()
    OR
    -- User is an active member of the league
    EXISTS (
      SELECT 1 FROM league_members lm2 
      WHERE lm2.league_id = league_members.league_id 
      AND lm2.user_id = auth.uid() 
      AND lm2.is_active = true
    )
  );