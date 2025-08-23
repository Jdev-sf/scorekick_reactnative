import { supabase } from '../../../lib/supabase/client';
import { storage } from '../../../lib/storage/asyncStorage';
import type { 
  ChatMessage, 
  ChatRoom, 
  ChatReaction, 
  ChatParticipant,
  MessageDraft,
  ChatSettings
} from '../types';

export class ChatService {
  private static readonly DRAFT_KEY_PREFIX = 'chat_draft_';
  private static readonly RATE_LIMIT_KEY = 'chat_rate_limit_';

  /**
   * Get chat rooms for a league
   */
  static async getLeagueRooms(leagueId: string): Promise<ChatRoom[]> {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          last_message:chat_messages(
            id,
            content,
            type,
            created_at,
            user:user_profiles(username, display_name)
          )
        `)
        .eq('league_id', leagueId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get league rooms: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get league rooms:', error);
      return [];
    }
  }

  /**
   * Get messages for a chat room
   */
  static async getRoomMessages(
    roomId: string, 
    limit = 50, 
    before?: string
  ): Promise<ChatMessage[]> {
    try {
      let query = supabase
        .from('chat_messages')
        .select(`
          *,
          user:user_profiles(id, username, display_name, avatar_url),
          reply_to_message:chat_messages(
            id,
            content,
            user:user_profiles(username, display_name)
          ),
          reactions:chat_reactions(
            id,
            emoji,
            user:user_profiles(id, username, display_name)
          )
        `)
        .eq('room_id', roomId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (before) {
        query = query.lt('created_at', before);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get room messages: ${error.message}`);
      }

      // Process reactions count
      const processedMessages = (data || []).map(message => ({
        ...message,
        reactions_count: this.processReactionsCount(message.reactions || []),
      }));

      return processedMessages.reverse(); // Return in chronological order
    } catch (error) {
      console.error('Failed to get room messages:', error);
      return [];
    }
  }

  /**
   * Send a message to a chat room
   */
  static async sendMessage(
    roomId: string,
    userId: string,
    content: string,
    type: ChatMessage['type'] = 'text',
    metadata?: ChatMessage['metadata']
  ): Promise<ChatMessage | null> {
    try {
      // Check rate limiting
      if (!this.checkRateLimit(userId)) {
        throw new Error('Rate limit exceeded. Please wait before sending another message.');
      }

      // Validate content
      if (!content.trim()) {
        throw new Error('Message content cannot be empty');
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          user_id: userId,
          content: content.trim(),
          type,
          metadata,
          created_at: new Date().toISOString(),
        })
        .select(`
          *,
          user:user_profiles(id, username, display_name, avatar_url)
        `)
        .single();

      if (error) {
        throw new Error(`Failed to send message: ${error.message}`);
      }

      // Update rate limiting
      this.updateRateLimit(userId);

      // Clear draft
      this.clearDraft(roomId);

      return data;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Edit a message
   */
  static async editMessage(
    messageId: string,
    userId: string,
    newContent: string
  ): Promise<ChatMessage | null> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .update({
          content: newContent.trim(),
          is_edited: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .eq('user_id', userId) // Ensure user can only edit their own messages
        .select(`
          *,
          user:user_profiles(id, username, display_name, avatar_url)
        `)
        .single();

      if (error) {
        throw new Error(`Failed to edit message: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Failed to edit message:', error);
      throw error;
    }
  }

  /**
   * Delete a message
   */
  static async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({
          is_deleted: true,
          content: '[Message deleted]',
          updated_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to delete message: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to delete message:', error);
      return false;
    }
  }

  /**
   * Add reaction to a message
   */
  static async addReaction(
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<ChatReaction | null> {
    try {
      // Check if user already reacted with this emoji
      const { data: existing } = await supabase
        .from('chat_reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', userId)
        .eq('emoji', emoji)
        .single();

      if (existing) {
        // Remove existing reaction
        const { error: deleteError } = await supabase
          .from('chat_reactions')
          .delete()
          .eq('id', existing.id);

        if (deleteError) {
          throw new Error(`Failed to remove reaction: ${deleteError.message}`);
        }

        return null; // Reaction removed
      }

      // Add new reaction
      const { data, error } = await supabase
        .from('chat_reactions')
        .insert({
          message_id: messageId,
          user_id: userId,
          emoji,
          created_at: new Date().toISOString(),
        })
        .select(`
          *,
          user:user_profiles(id, username, display_name)
        `)
        .single();

      if (error) {
        throw new Error(`Failed to add reaction: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Failed to add reaction:', error);
      throw error;
    }
  }

  /**
   * Get chat participants for a room
   */
  static async getRoomParticipants(roomId: string): Promise<ChatParticipant[]> {
    try {
      const { data, error } = await supabase
        .from('chat_participants')
        .select(`
          *,
          user:user_profiles(
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('room_id', roomId)
        .eq('is_banned', false)
        .order('joined_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get room participants: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get room participants:', error);
      return [];
    }
  }

  /**
   * Subscribe to room messages
   */
  static subscribeToRoomMessages(
    roomId: string,
    onMessage: (message: ChatMessage) => void,
    onReaction: (reaction: ChatReaction) => void
  ) {
    const messageSubscription = supabase
      .channel(`room-${roomId}-messages`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          // Fetch the complete message with user data
          const { data } = await supabase
            .from('chat_messages')
            .select(`
              *,
              user:user_profiles(id, username, display_name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            onMessage(data);
          }
        }
      )
      .subscribe();

    const reactionSubscription = supabase
      .channel(`room-${roomId}-reactions`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_reactions',
        },
        (payload) => {
          if (payload.new) {
            onReaction(payload.new as ChatReaction);
          }
        }
      )
      .subscribe();

    return () => {
      messageSubscription.unsubscribe();
      reactionSubscription.unsubscribe();
    };
  }

  /**
   * Mark messages as read
   */
  static async markAsRead(roomId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_participants')
        .update({
          last_read_at: new Date().toISOString(),
        })
        .eq('room_id', roomId)
        .eq('user_id', userId);

      if (error) {
        console.error('Failed to mark as read:', error);
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }

  /**
   * Save message draft
   */
  static saveDraft(roomId: string, content: string, replyTo?: string): void {
    const draft: MessageDraft = {
      room_id: roomId,
      content,
      reply_to: replyTo,
      timestamp: Date.now(),
    };

    storage.set(`${this.DRAFT_KEY_PREFIX}${roomId}`, JSON.stringify(draft));
  }

  /**
   * Get message draft
   */
  static getDraft(roomId: string): MessageDraft | null {
    try {
      const draftJson = storage.getString(`${this.DRAFT_KEY_PREFIX}${roomId}`);
      if (draftJson) {
        const draft = JSON.parse(draftJson) as MessageDraft;
        
        // Clear old drafts (older than 24 hours)
        if (Date.now() - draft.timestamp > 24 * 60 * 60 * 1000) {
          this.clearDraft(roomId);
          return null;
        }
        
        return draft;
      }
    } catch (error) {
      console.error('Failed to get draft:', error);
    }
    
    return null;
  }

  /**
   * Clear message draft
   */
  static clearDraft(roomId: string): void {
    storage.delete(`${this.DRAFT_KEY_PREFIX}${roomId}`);
  }

  /**
   * Check rate limiting
   */
  private static checkRateLimit(userId: string): boolean {
    try {
      const rateLimitKey = `${this.RATE_LIMIT_KEY}${userId}`;
      const rateLimitData = storage.getString(rateLimitKey);
      
      if (!rateLimitData) return true;
      
      const { count, timestamp } = JSON.parse(rateLimitData);
      const now = Date.now();
      
      // Reset counter if more than 1 minute has passed
      if (now - timestamp > 60000) {
        return true;
      }
      
      // Allow up to 10 messages per minute
      return count < 10;
    } catch (error) {
      return true; // Allow on error
    }
  }

  /**
   * Update rate limiting
   */
  private static updateRateLimit(userId: string): void {
    try {
      const rateLimitKey = `${this.RATE_LIMIT_KEY}${userId}`;
      const rateLimitData = storage.getString(rateLimitKey);
      const now = Date.now();
      
      let count = 1;
      let timestamp = now;
      
      if (rateLimitData) {
        const existing = JSON.parse(rateLimitData);
        if (now - existing.timestamp < 60000) {
          count = existing.count + 1;
          timestamp = existing.timestamp;
        }
      }
      
      storage.set(rateLimitKey, JSON.stringify({ count, timestamp }));
    } catch (error) {
      console.error('Failed to update rate limit:', error);
    }
  }

  /**
   * Process reactions count
   */
  private static processReactionsCount(reactions: ChatReaction[]): Record<string, number> {
    const counts: Record<string, number> = {};
    
    reactions.forEach(reaction => {
      counts[reaction.emoji] = (counts[reaction.emoji] || 0) + 1;
    });
    
    return counts;
  }

  /**
   * Get unread message count for a room
   */
  static async getUnreadCount(roomId: string, userId: string): Promise<number> {
    try {
      // Get user's last read timestamp
      const { data: participant } = await supabase
        .from('chat_participants')
        .select('last_read_at')
        .eq('room_id', roomId)
        .eq('user_id', userId)
        .single();

      if (!participant?.last_read_at) {
        // If no last read time, count all messages
        const { count } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('room_id', roomId)
          .eq('is_deleted', false);

        return count || 0;
      }

      // Count messages after last read time
      const { count } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', roomId)
        .eq('is_deleted', false)
        .gt('created_at', participant.last_read_at);

      return count || 0;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }
}