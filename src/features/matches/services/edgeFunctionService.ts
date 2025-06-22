import { supabase } from '../../../lib/supabase/client';
import type { SyncResult } from '../types';

export class EdgeFunctionService {
  /**
   * Call the Edge Function to sync matches and standings
   * This runs server-side with proper permissions
   */
  static async syncAllData(): Promise<SyncResult> {
    try {
      console.log('[EdgeFunction] Calling sync-matches function...');
      
      const { data, error } = await supabase.functions.invoke('sync-matches', {
        body: {},
      });

      if (error) {
        console.error('[EdgeFunction] Error:', error);
        throw new Error(`Edge Function error: ${error.message}`);
      }

      console.log('[EdgeFunction] Sync completed:', data);
      return data as SyncResult;
    } catch (error) {
      console.error('[EdgeFunction] Failed to call sync function:', error);
      throw error;
    }
  }
}