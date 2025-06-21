import { useMemo } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useLeagueDetails } from './useLeagues';
import { getLeaguePermissions, canManageMember, type LeagueRole, type LeaguePermissions } from '../utils/permissions';

/**
 * Hook to get current user's permissions in a specific league
 */
export function useLeaguePermissions(leagueId: string) {
  const { user } = useAuth();
  const { data: league } = useLeagueDetails(leagueId);

  const userMembership = useMemo(() => {
    if (!user || !league?.members) return null;
    return league.members.find(member => member.user_id === user.id);
  }, [user, league?.members]);

  const userRole: LeagueRole | null = useMemo(() => {
    return userMembership?.role as LeagueRole || null;
  }, [userMembership]);

  const permissions: LeaguePermissions | null = useMemo(() => {
    if (!userRole) return null;
    return getLeaguePermissions(userRole);
  }, [userRole]);

  const canManage = useMemo(() => {
    return (targetUserId: string, targetRole: LeagueRole, action: 'remove' | 'promote' | 'demote') => {
      if (!userRole || !user || targetUserId === user.id) return false;
      return canManageMember(userRole, targetRole, action);
    };
  }, [userRole, user]);

  return {
    userRole,
    permissions,
    canManage,
    isCreator: userRole === 'creator',
    isAdmin: userRole === 'admin' || userRole === 'creator',
    isMember: userRole === 'member',
    userMembership,
  };
}

/**
 * Hook to check specific permission
 */
export function useHasPermission(leagueId: string, permission: keyof LeaguePermissions): boolean {
  const { permissions } = useLeaguePermissions(leagueId);
  return permissions?.[permission] ?? false;
}

/**
 * Hook to get user role in league
 */
export function useUserRole(leagueId: string): LeagueRole | null {
  const { userRole } = useLeaguePermissions(leagueId);
  return userRole;
}