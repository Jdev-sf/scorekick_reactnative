import React from 'react';
import { useLeaguePermissions, useHasPermission, useUserRole } from '../hooks/useLeaguePermissions';
import type { LeaguePermissions, LeagueRole } from '../utils/permissions';

interface PermissionGateProps {
  leagueId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface PermissionCheckProps extends PermissionGateProps {
  permission: keyof LeaguePermissions;
}

interface RoleCheckProps extends PermissionGateProps {
  roles: LeagueRole[];
  requireAll?: boolean;
}

/**
 * Component that renders children only if user has specific permission
 */
export function PermissionGate({ leagueId, permission, children, fallback = null }: PermissionCheckProps) {
  const hasPermission = useHasPermission(leagueId, permission);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Component that renders children only if user has one of the specified roles
 */
export function RoleGate({ leagueId, roles, requireAll = false, children, fallback = null }: RoleCheckProps) {
  const userRole = useUserRole(leagueId);

  if (!userRole) {
    return <>{fallback}</>;
  }

  const hasRole = requireAll 
    ? roles.every(role => role === userRole)
    : roles.includes(userRole);

  if (!hasRole) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Component that renders children only for creators
 */
export function CreatorOnly({ leagueId, children, fallback = null }: PermissionGateProps) {
  return (
    <RoleGate leagueId={leagueId} roles={['creator']} fallback={fallback}>
      {children}
    </RoleGate>
  );
}

/**
 * Component that renders children only for admins (including creators)
 */
export function AdminOnly({ leagueId, children, fallback = null }: PermissionGateProps) {
  return (
    <RoleGate leagueId={leagueId} roles={['creator', 'admin']} fallback={fallback}>
      {children}
    </RoleGate>
  );
}

/**
 * Component that renders children only for members (not admins/creators)
 */
export function MemberOnly({ leagueId, children, fallback = null }: PermissionGateProps) {
  return (
    <RoleGate leagueId={leagueId} roles={['member']} fallback={fallback}>
      {children}
    </RoleGate>
  );
}