import { supabase } from '../../../lib/supabase/client';
import { OfflineSyncService } from '../../../services/offlineSyncService';
import type { League, LeagueMember, CreateLeagueData, JoinLeagueData } from '../types';

export class LeagueService {
  /**
   * Create a new league with invite code generation
   */
  static async createLeague(data: CreateLeagueData): Promise<League> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Generate unique invite code
    const inviteCode = await this.generateUniqueInviteCode();

    // Create league
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .insert({
        name: data.name,
        invite_code: inviteCode,
        creator_id: user.id,
      })
      .select()
      .single();

    if (leagueError) throw leagueError;

    // Add creator as member with creator role
    const { error: memberError } = await supabase
      .from('league_members')
      .insert({
        league_id: league.id,
        user_id: user.id,
        role: 'creator',
      });

    if (memberError) throw memberError;

    // Initialize league standings
    await this.updateLeagueStandings(league.id);

    return league;
  }

  /**
   * Join a league by invite code
   */
  static async joinLeague(data: JoinLeagueData): Promise<LeagueMember> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    try {
      // Find league by invite code
      const { data: league, error: leagueError } = await supabase
        .from('leagues')
        .select('id')
        .eq('invite_code', data.inviteCode.toUpperCase())
        .single();

      if (leagueError || !league) {
        throw new Error('Invalid invite code');
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('league_members')
        .select('id')
        .eq('league_id', league.id)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        throw new Error('You are already a member of this league');
      }

      // Add user as member
      const { data: member, error: memberError } = await supabase
        .from('league_members')
        .insert({
          league_id: league.id,
          user_id: user.id,
          role: 'member',
        })
        .select(`
          *,
          league:leagues(name, invite_code),
          user:users(display_name, email)
        `)
        .single();

      if (memberError) throw memberError;

      // Update league standings
      await this.updateLeagueStandings(league.id);

      return member;
    } catch (error) {
      // If we're offline, queue for later sync
      await OfflineSyncService.queueOfflineAction({
        type: 'league_join',
        data: {
          invite_code: data.inviteCode.toUpperCase(),
        },
        userId: user.id,
      });
      
      // Return a temporary member object for optimistic UI
      const tempMember: LeagueMember = {
        id: `temp_${Date.now()}`,
        league_id: 'temp_league',
        user_id: user.id,
        role: 'member',
        is_active: true,
        points: 0,
        rank: 0,
        correct_predictions: 0,
        exact_predictions: 0,
        total_predictions: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        league: {
          name: 'Joining...',
          invite_code: data.inviteCode.toUpperCase(),
        },
        user: {
          display_name: 'You',
          email: user.email || '',
        },
      };
      
      return tempMember;
    }
  }

  /**
   * Get user's leagues using the helper function to avoid RLS recursion
   */
  static async getUserLeagues(): Promise<League[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    try {
      // Use the helper function that bypasses RLS
      const { data: userLeagues, error } = await supabase
        .rpc('get_user_leagues', { user_uuid: user.id });

      if (error) {
        console.error('Error calling get_user_leagues:', error);
        throw error;
      }
      
      if (!userLeagues || userLeagues.length === 0) return [];

      // Get additional league details using the view
      const leagueIds = userLeagues.map((ul: any) => ul.league_id);
      const { data: leagueDetails, error: detailsError } = await supabase
        .from('league_details')
        .select('*')
        .in('id', leagueIds);

      if (detailsError) {
        console.error('Error getting league details:', detailsError);
        // Continue without details if this fails
      }

      // Combine the data
      const result = userLeagues.map((userLeague: any) => {
        const details = leagueDetails?.find((ld: any) => ld.id === userLeague.league_id);
        return {
          id: userLeague.league_id,
          name: userLeague.league_name || 'Unknown League',
          invite_code: details?.invite_code || '',
          creator_id: details?.creator_id || '',
          created_at: details?.created_at || new Date().toISOString(),
          member_count: details?.member_count || 0,
          user_role: userLeague.role || 'member',
          is_creator: userLeague.is_creator || false,
        };
      }) || [];

      return result;
    } catch (error) {
      console.error('Error getting user leagues:', error);
      
      // Fallback to direct query if function fails
      try {
        console.log('Attempting fallback query...');
        const { data: memberships, error: fallbackError } = await supabase
          .from('user_league_memberships')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (fallbackError) throw fallbackError;

        return memberships?.map((membership: any) => ({
          id: membership.league_id,
          name: membership.league_name || 'Unknown League',
          invite_code: membership.invite_code || '',
          creator_id: membership.creator_id || '',
          created_at: membership.joined_at || new Date().toISOString(),
          member_count: 0,
          user_role: membership.role || 'member',
          is_creator: membership.is_creator || false,
        })) || [];
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        throw new Error('Failed to load leagues');
      }
    }
  }

  /**
   * Get league details with members
   */
  static async getLeagueDetails(leagueId: string): Promise<League & { members: LeagueMember[] }> {
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .select(`
        *,
        creator:users(display_name, email)
      `)
      .eq('id', leagueId)
      .single();

    if (leagueError) throw leagueError;

    const { data: members, error: membersError } = await supabase
      .from('league_members')
      .select(`
        *,
        user:users(display_name, email, photo_url)
      `)
      .eq('league_id', leagueId)
      .eq('is_active', true)
      .order('total_points', { ascending: false });

    if (membersError) throw membersError;

    return {
      ...league,
      members: members || [],
    };
  }

  /**
   * Leave a league
   */
  static async leaveLeague(leagueId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check if user is the creator
    const { data: member } = await supabase
      .from('league_members')
      .select('role')
      .eq('league_id', leagueId)
      .eq('user_id', user.id)
      .single();

    if (member?.role === 'creator') {
      throw new Error('Creators cannot leave their own league. Transfer ownership or delete the league.');
    }

    // Mark member as inactive instead of deleting
    const { error } = await supabase
      .from('league_members')
      .update({ is_active: false })
      .eq('league_id', leagueId)
      .eq('user_id', user.id);

    if (error) throw error;

    // Update league standings
    await this.updateLeagueStandings(leagueId);
  }

  /**
   * Delete a league (creator only)
   */
  static async deleteLeague(leagueId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Verify user is the creator
    const { data: league } = await supabase
      .from('leagues')
      .select('creator_id')
      .eq('id', leagueId)
      .single();

    if (!league || league.creator_id !== user.id) {
      throw new Error('Only the league creator can delete the league');
    }

    // Delete league (cascade will handle members, predictions, etc.)
    const { error } = await supabase
      .from('leagues')
      .delete()
      .eq('id', leagueId);

    if (error) throw error;
  }

  /**
   * Generate a unique 6-character invite code
   */
  private static async generateUniqueInviteCode(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code: string;
    let isUnique = false;

    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Check if code already exists
      const { data } = await supabase
        .from('leagues')
        .select('id')
        .eq('invite_code', code)
        .single();

      isUnique = !data;
    } while (!isUnique);

    return code;
  }

  /**
   * Change member role (admin/creator only)
   */
  static async changeMemberRole(leagueId: string, userId: string, newRole: 'admin' | 'member'): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Verify current user has permission to change roles
    const { data: currentUserMember } = await supabase
      .from('league_members')
      .select('role')
      .eq('league_id', leagueId)
      .eq('user_id', user.id)
      .single();

    if (!currentUserMember || !['creator', 'admin'].includes(currentUserMember.role)) {
      throw new Error('You do not have permission to change member roles');
    }

    // Creators can change anyone's role, admins can only change members to admin
    if (currentUserMember.role === 'admin' && newRole === 'admin') {
      throw new Error('Admins cannot promote members to admin role');
    }

    // Don't allow changing creator role
    const { data: targetMember } = await supabase
      .from('league_members')
      .select('role')
      .eq('league_id', leagueId)
      .eq('user_id', userId)
      .single();

    if (targetMember?.role === 'creator') {
      throw new Error('Cannot change creator role');
    }

    // Update the role
    const { error } = await supabase
      .from('league_members')
      .update({ role: newRole })
      .eq('league_id', leagueId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Remove member from league (admin/creator only)
   */
  static async removeMember(leagueId: string, userId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Verify current user has permission
    const { data: currentUserMember } = await supabase
      .from('league_members')
      .select('role')
      .eq('league_id', leagueId)
      .eq('user_id', user.id)
      .single();

    if (!currentUserMember || !['creator', 'admin'].includes(currentUserMember.role)) {
      throw new Error('You do not have permission to remove members');
    }

    // Don't allow removing creator
    const { data: targetMember } = await supabase
      .from('league_members')
      .select('role')
      .eq('league_id', leagueId)
      .eq('user_id', userId)
      .single();

    if (targetMember?.role === 'creator') {
      throw new Error('Cannot remove league creator');
    }

    // Don't allow self-removal (use leave league instead)
    if (userId === user.id) {
      throw new Error('Use leave league function to remove yourself');
    }

    // Mark member as inactive
    const { error } = await supabase
      .from('league_members')
      .update({ is_active: false })
      .eq('league_id', leagueId)
      .eq('user_id', userId);

    if (error) throw error;

    // Update league standings
    await this.updateLeagueStandings(leagueId);
  }

  /**
   * Transfer league ownership (creator only)
   */
  static async transferOwnership(leagueId: string, newOwnerId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Verify current user is creator
    const { data: league } = await supabase
      .from('leagues')
      .select('creator_id')
      .eq('id', leagueId)
      .single();

    if (!league || league.creator_id !== user.id) {
      throw new Error('Only the league creator can transfer ownership');
    }

    // Verify new owner is a member
    const { data: newOwnerMember } = await supabase
      .from('league_members')
      .select('role, is_active')
      .eq('league_id', leagueId)
      .eq('user_id', newOwnerId)
      .single();

    if (!newOwnerMember || !newOwnerMember.is_active) {
      throw new Error('New owner must be an active member of the league');
    }

    // Start transaction: update league creator and member roles
    const { error: leagueError } = await supabase
      .from('leagues')
      .update({ creator_id: newOwnerId })
      .eq('id', leagueId);

    if (leagueError) throw leagueError;

    // Update new owner to creator role
    const { error: newOwnerError } = await supabase
      .from('league_members')
      .update({ role: 'creator' })
      .eq('league_id', leagueId)
      .eq('user_id', newOwnerId);

    if (newOwnerError) throw newOwnerError;

    // Update old owner to admin role
    const { error: oldOwnerError } = await supabase
      .from('league_members')
      .update({ role: 'admin' })
      .eq('league_id', leagueId)
      .eq('user_id', user.id);

    if (oldOwnerError) throw oldOwnerError;
  }

  /**
   * Get league member statistics
   */
  static async getLeagueStats(leagueId: string) {
    const { data: members, error: membersError } = await supabase
      .from('league_members')
      .select(`
        user_id,
        total_points,
        user:users(display_name)
      `)
      .eq('league_id', leagueId)
      .eq('is_active', true);

    if (membersError) throw membersError;

    const totalMembers = members?.length || 0;
    const averagePoints = totalMembers > 0 
      ? (members?.reduce((sum, m) => sum + (m.total_points || 0), 0) || 0) / totalMembers
      : 0;

    let topScorer = null;
    if (members && members.length > 0) {
      topScorer = members.reduce((top, current) => {
        const currentPoints = current.total_points || 0;
        const topPoints = top?.total_points || 0;
        return currentPoints > topPoints ? current : top;
      });
    }

    return {
      totalMembers,
      averagePoints: Math.round(averagePoints * 100) / 100,
      topScorer: topScorer ? {
        user_id: topScorer.user_id,
        display_name: Array.isArray(topScorer.user) ? topScorer.user[0]?.display_name || 'Unknown' : 'Unknown',
        points: topScorer.total_points || 0,
      } : null,
    };
  }

  /**
   * Update league standings
   */
  private static async updateLeagueStandings(leagueId: string): Promise<void> {
    const { error } = await supabase.rpc('update_league_standings', {
      p_league_id: leagueId
    });

    if (error) {
      console.error('Failed to update league standings:', error);
      // Don't throw error as this is not critical for the main operation
    }
  }
}