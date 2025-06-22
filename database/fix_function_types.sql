-- Fix function return types to match database schema
-- Execute this in Supabase SQL Editor

-- Drop the existing function
DROP FUNCTION IF EXISTS get_user_leagues(uuid);

-- Recreate with correct types matching the database schema
CREATE OR REPLACE FUNCTION get_user_leagues(user_uuid uuid)
RETURNS TABLE(
  league_id uuid, 
  league_name character varying(100),  -- Match the exact type from leagues table
  role character varying(10),          -- Match the exact type from league_members table
  is_creator boolean
) AS $$
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_leagues(uuid) TO authenticated;

-- Also fix the can_access_league function for consistency
DROP FUNCTION IF EXISTS can_access_league(uuid, uuid);

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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION can_access_league(uuid, uuid) TO authenticated;

-- Test the function to make sure it works
-- You can uncomment this to test (replace with a real user ID)
-- SELECT * FROM get_user_leagues('your-user-id-here');