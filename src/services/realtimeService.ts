import { supabase } from '../lib/supabase/client';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimeSubscriptionConfig {
  table: string;
  event?: RealtimeEventType | '*';
  schema?: string;
  filter?: string;
}

export interface RealtimeCallbacks<T extends { [key: string]: any } = { [key: string]: any }> {
  onInsert?: (payload: RealtimePostgresChangesPayload<T>) => void;
  onUpdate?: (payload: RealtimePostgresChangesPayload<T>) => void;
  onDelete?: (payload: RealtimePostgresChangesPayload<T>) => void;
  onError?: (error: any) => void;
}

export class RealtimeService {
  private static channels = new Map<string, RealtimeChannel>();
  private static isConnected = false;

  /**
   * Initialize realtime connection
   */
  static async initialize(): Promise<void> {
    try {
      // Enable realtime on the client
      console.log('[Realtime] Initializing connection...');
      this.isConnected = true;
    } catch (error) {
      console.error('[Realtime] Failed to initialize:', error);
      this.isConnected = false;
    }
  }

  /**
   * Subscribe to table changes with specific filters
   */
  static subscribe<T extends { [key: string]: any } = { [key: string]: any }>(
    channelName: string,
    config: RealtimeSubscriptionConfig,
    callbacks: RealtimeCallbacks<T>
  ): RealtimeChannel | null {
    try {
      // Remove existing channel if it exists
      this.unsubscribe(channelName);

      console.log(`[Realtime] Subscribing to ${config.table} with channel: ${channelName}`);

      // Create new channel
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes' as any,
          {
            event: config.event || '*',
            schema: config.schema || 'public',
            table: config.table,
            filter: config.filter,
          },
          (payload: RealtimePostgresChangesPayload<T>) => {
            console.log(`[Realtime] ${config.table} change:`, payload.eventType, payload.new);
            
            switch (payload.eventType) {
              case 'INSERT':
                callbacks.onInsert?.(payload);
                break;
              case 'UPDATE':
                callbacks.onUpdate?.(payload);
                break;
              case 'DELETE':
                callbacks.onDelete?.(payload);
                break;
            }
          }
        )
        .subscribe((status) => {
          console.log(`[Realtime] Channel ${channelName} status:`, status);
          
          if (status === 'SUBSCRIBED') {
            console.log(`[Realtime] Successfully subscribed to ${config.table}`);
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`[Realtime] Error subscribing to ${config.table}`);
            callbacks.onError?.(`Failed to subscribe to ${config.table}`);
          }
        });

      // Store channel reference
      this.channels.set(channelName, channel);
      return channel;
    } catch (error) {
      console.error(`[Realtime] Failed to subscribe to ${config.table}:`, error);
      callbacks.onError?.(error);
      return null;
    }
  }

  /**
   * Unsubscribe from a specific channel
   */
  static unsubscribe(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      console.log(`[Realtime] Unsubscribing from channel: ${channelName}`);
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  static unsubscribeAll(): void {
    console.log('[Realtime] Unsubscribing from all channels');
    this.channels.forEach((channel, channelName) => {
      this.unsubscribe(channelName);
    });
  }

  /**
   * Get connection status
   */
  static getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Subscribe to match updates
   */
  static subscribeToMatchUpdates(callbacks: RealtimeCallbacks): RealtimeChannel | null {
    return this.subscribe('match-updates', {
      table: 'matches',
      event: 'UPDATE',
    }, callbacks);
  }

  /**
   * Subscribe to prediction updates for a specific league
   */
  static subscribeToPredictionUpdates<T extends { [key: string]: any } = { [key: string]: any }>(
    leagueId: string, 
    callbacks: RealtimeCallbacks<T>
  ): RealtimeChannel | null {
    return this.subscribe(`predictions-${leagueId}`, {
      table: 'predictions',
      filter: `league_id=eq.${leagueId}`,
    }, callbacks);
  }

  /**
   * Subscribe to league member changes
   */
  static subscribeToLeagueMemberUpdates(
    leagueId: string,
    callbacks: RealtimeCallbacks
  ): RealtimeChannel | null {
    return this.subscribe(`league-members-${leagueId}`, {
      table: 'league_members',
      filter: `league_id=eq.${leagueId}`,
    }, callbacks);
  }

  /**
   * Subscribe to achievement updates for a user
   */
  static subscribeToUserAchievements(
    userId: string,
    callbacks: RealtimeCallbacks
  ): RealtimeChannel | null {
    return this.subscribe(`achievements-${userId}`, {
      table: 'user_achievements',
      filter: `user_id=eq.${userId}`,
      event: 'INSERT',
    }, callbacks);
  }

  /**
   * Subscribe to league standings updates
   */
  static subscribeToStandingsUpdates(callbacks: RealtimeCallbacks): RealtimeChannel | null {
    return this.subscribe('standings-updates', {
      table: 'serie_a_standings',
      event: 'UPDATE',
    }, callbacks);
  }

  /**
   * Reconnect all subscriptions (useful after network recovery)
   */
  static async reconnectAll(): Promise<void> {
    console.log('[Realtime] Reconnecting all subscriptions...');
    
    // Store current subscriptions
    const currentSubscriptions = Array.from(this.channels.entries());
    
    // Clear all channels
    this.unsubscribeAll();
    
    // Wait a bit before reconnecting
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Note: This is a simplified reconnection
    // In a real implementation, you'd need to store the original config and callbacks
    console.log('[Realtime] Reconnection would require storing original subscription configs');
  }

  /**
   * Check if a specific channel is active
   */
  static isChannelActive(channelName: string): boolean {
    const channel = this.channels.get(channelName);
    return channel?.state === 'joined';
  }

  /**
   * Get all active channels
   */
  static getActiveChannels(): string[] {
    return Array.from(this.channels.keys());
  }
}