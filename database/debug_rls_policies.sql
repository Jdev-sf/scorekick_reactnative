-- Debug RLS policies - Step by step fix
-- Execute this in Supabase SQL Editor

-- First, let's disable RLS temporarily to test the query
ALTER TABLE league_members DISABLE ROW LEVEL SECURITY;

-- Test if the basic query works without RLS
-- You can test this manually in Supabase SQL editor:
-- SELECT * FROM league_members LIMIT 5;

-- Now let's completely recreate the league_members policies from scratch
-- Drop ALL existing policies on league_members
DROP POLICY IF EXISTS "Users can view league members of their leagues" ON league_members;
DROP POLICY IF EXISTS "Users can view league members" ON league_members;
DROP POLICY IF EXISTS "Users can join leagues" ON league_members;
DROP POLICY IF EXISTS "Users can manage league members as creators/admins" ON league_members;
DROP POLICY IF EXISTS "League creators and admins can manage members" ON league_members;
DROP POLICY IF EXISTS "League creators can remove members" ON league_members;

-- Re-enable RLS
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;

-- Create the simplest possible policies first

-- 1. Allow users to see their own memberships
CREATE POLICY "Users can see own memberships" ON league_members FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Allow users to insert their own memberships (for joining leagues)
CREATE POLICY "Users can join leagues" ON league_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Allow users to update their own memberships (for leaving)
CREATE POLICY "Users can update own memberships" ON league_members FOR UPDATE
  USING (auth.uid() = user_id);

-- Test these basic policies first before adding more complex ones