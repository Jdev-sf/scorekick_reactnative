import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LeagueService } from '../services/leagueService';
import type { CreateLeagueData, JoinLeagueData, League, LeagueMember } from '../types';

// Query keys
export const leagueKeys = {
  all: ['leagues'] as const,
  lists: () => [...leagueKeys.all, 'list'] as const,
  list: (filters: string) => [...leagueKeys.lists(), filters] as const,
  details: () => [...leagueKeys.all, 'detail'] as const,
  detail: (id: string) => [...leagueKeys.details(), id] as const,
  standings: () => [...leagueKeys.all, 'standings'] as const,
  standing: (id: string) => [...leagueKeys.standings(), id] as const,
};

/**
 * Hook to get user's leagues
 */
export function useUserLeagues() {
  return useQuery({
    queryKey: leagueKeys.lists(),
    queryFn: LeagueService.getUserLeagues,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to get league details
 */
export function useLeagueDetails(leagueId: string) {
  return useQuery({
    queryKey: leagueKeys.detail(leagueId),
    queryFn: () => LeagueService.getLeagueDetails(leagueId),
    enabled: !!leagueId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to create a new league
 */
export function useCreateLeague() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLeagueData) => LeagueService.createLeague(data),
    onSuccess: (newLeague: League) => {
      // Invalidate and refetch user leagues
      queryClient.invalidateQueries({ queryKey: leagueKeys.lists() });
      
      // Add the new league to the cache
      queryClient.setQueryData(leagueKeys.detail(newLeague.id), newLeague);
    },
    onError: (error) => {
      console.error('Failed to create league:', error);
    },
  });
}

/**
 * Hook to join a league
 */
export function useJoinLeague() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: JoinLeagueData) => LeagueService.joinLeague(data),
    onSuccess: (member: LeagueMember) => {
      // Invalidate user leagues to show the new league
      queryClient.invalidateQueries({ queryKey: leagueKeys.lists() });
      
      // Invalidate league details if cached
      if (member.league_id) {
        queryClient.invalidateQueries({ 
          queryKey: leagueKeys.detail(member.league_id) 
        });
      }
    },
    onError: (error) => {
      console.error('Failed to join league:', error);
    },
  });
}

/**
 * Hook to leave a league
 */
export function useLeaveLeague() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (leagueId: string) => LeagueService.leaveLeague(leagueId),
    onSuccess: (_, leagueId) => {
      // Remove from user leagues list
      queryClient.invalidateQueries({ queryKey: leagueKeys.lists() });
      
      // Remove league details from cache
      queryClient.removeQueries({ queryKey: leagueKeys.detail(leagueId) });
    },
    onError: (error) => {
      console.error('Failed to leave league:', error);
    },
  });
}

/**
 * Hook to delete a league
 */
export function useDeleteLeague() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (leagueId: string) => LeagueService.deleteLeague(leagueId),
    onSuccess: (_, leagueId) => {
      // Remove from user leagues list
      queryClient.invalidateQueries({ queryKey: leagueKeys.lists() });
      
      // Remove league details from cache
      queryClient.removeQueries({ queryKey: leagueKeys.detail(leagueId) });
      
      // Remove any related standings
      queryClient.removeQueries({ queryKey: leagueKeys.standing(leagueId) });
    },
    onError: (error) => {
      console.error('Failed to delete league:', error);
    },
  });
}

/**
 * Hook to change member role
 */
export function useChangeMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leagueId, userId, newRole }: { leagueId: string; userId: string; newRole: 'admin' | 'member' }) =>
      LeagueService.changeMemberRole(leagueId, userId, newRole),
    onSuccess: (_, { leagueId }) => {
      // Invalidate league details to refresh member list
      queryClient.invalidateQueries({ queryKey: leagueKeys.detail(leagueId) });
    },
    onError: (error) => {
      console.error('Failed to change member role:', error);
    },
  });
}

/**
 * Hook to remove member from league
 */
export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leagueId, userId }: { leagueId: string; userId: string }) =>
      LeagueService.removeMember(leagueId, userId),
    onSuccess: (_, { leagueId }) => {
      // Invalidate league details to refresh member list
      queryClient.invalidateQueries({ queryKey: leagueKeys.detail(leagueId) });
      
      // Invalidate standings
      queryClient.invalidateQueries({ queryKey: leagueKeys.standing(leagueId) });
    },
    onError: (error) => {
      console.error('Failed to remove member:', error);
    },
  });
}

/**
 * Hook to transfer league ownership
 */
export function useTransferOwnership() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leagueId, newOwnerId }: { leagueId: string; newOwnerId: string }) =>
      LeagueService.transferOwnership(leagueId, newOwnerId),
    onSuccess: (_, { leagueId }) => {
      // Invalidate all league-related data
      queryClient.invalidateQueries({ queryKey: leagueKeys.detail(leagueId) });
      queryClient.invalidateQueries({ queryKey: leagueKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to transfer ownership:', error);
    },
  });
}

/**
 * Hook to get league statistics
 */
export function useLeagueStats(leagueId: string) {
  return useQuery({
    queryKey: [...leagueKeys.detail(leagueId), 'stats'],
    queryFn: () => LeagueService.getLeagueStats(leagueId),
    enabled: !!leagueId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}