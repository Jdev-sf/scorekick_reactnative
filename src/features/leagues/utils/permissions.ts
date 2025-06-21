import type { LeagueMember } from '../types';

export type LeagueRole = 'creator' | 'admin' | 'member';

export interface LeaguePermissions {
  // League management
  canEditLeague: boolean;
  canDeleteLeague: boolean;
  canTransferOwnership: boolean;
  
  // Member management
  canInviteMembers: boolean;
  canRemoveMembers: boolean;
  canPromoteMembers: boolean;
  canDemoteMembers: boolean;
  
  // Content management
  canManageSettings: boolean;
  canViewMemberDetails: boolean;
  
  // Actions
  canLeaveLeague: boolean;
}

/**
 * Get permissions for a user based on their role in a league
 */
export function getLeaguePermissions(userRole: LeagueRole): LeaguePermissions {
  const basePermissions: LeaguePermissions = {
    canEditLeague: false,
    canDeleteLeague: false,
    canTransferOwnership: false,
    canInviteMembers: false,
    canRemoveMembers: false,
    canPromoteMembers: false,
    canDemoteMembers: false,
    canManageSettings: false,
    canViewMemberDetails: false,
    canLeaveLeague: true,
  };

  switch (userRole) {
    case 'creator':
      return {
        ...basePermissions,
        canEditLeague: true,
        canDeleteLeague: true,
        canTransferOwnership: true,
        canInviteMembers: true,
        canRemoveMembers: true,
        canPromoteMembers: true,
        canDemoteMembers: true,
        canManageSettings: true,
        canViewMemberDetails: true,
        canLeaveLeague: false, // Creators must transfer ownership first
      };

    case 'admin':
      return {
        ...basePermissions,
        canEditLeague: true,
        canInviteMembers: true,
        canRemoveMembers: true,
        canPromoteMembers: false, // Admins can't promote to admin
        canDemoteMembers: false, // Admins can't demote other admins
        canManageSettings: true,
        canViewMemberDetails: true,
        canLeaveLeague: true,
      };

    case 'member':
    default:
      return {
        ...basePermissions,
        canViewMemberDetails: true,
        canLeaveLeague: true,
      };
  }
}

/**
 * Check if user can perform action on target member
 */
export function canManageMember(
  userRole: LeagueRole,
  targetRole: LeagueRole,
  action: 'remove' | 'promote' | 'demote'
): boolean {
  const permissions = getLeaguePermissions(userRole);

  // Creator can do everything except on themselves
  if (userRole === 'creator' && targetRole !== 'creator') {
    return true;
  }

  // Admin restrictions
  if (userRole === 'admin') {
    switch (action) {
      case 'remove':
        return permissions.canRemoveMembers && targetRole === 'member';
      case 'promote':
        return permissions.canPromoteMembers && targetRole === 'member';
      case 'demote':
        return permissions.canDemoteMembers && targetRole === 'member';
      default:
        return false;
    }
  }

  // Members can't manage anyone
  return false;
}

/**
 * Get available role options for promotion/demotion
 */
export function getAvailableRoles(
  userRole: LeagueRole,
  targetRole: LeagueRole
): LeagueRole[] {
  if (userRole === 'creator') {
    if (targetRole === 'member') return ['admin'];
    if (targetRole === 'admin') return ['member'];
  }

  if (userRole === 'admin' && targetRole === 'member') {
    return []; // Admins can't promote members to admin
  }

  return [];
}

/**
 * Get role display information
 */
export function getRoleInfo(role: LeagueRole) {
  switch (role) {
    case 'creator':
      return {
        label: 'Creator',
        description: 'Full control of the league',
        color: '#DC2626', // red
        icon: '👑',
      };
    case 'admin':
      return {
        label: 'Admin',
        description: 'Can manage members and settings',
        color: '#2563EB', // blue
        icon: '⚡',
      };
    case 'member':
    default:
      return {
        label: 'Member',
        description: 'Can make predictions and view league',
        color: '#059669', // green
        icon: '👤',
      };
  }
}