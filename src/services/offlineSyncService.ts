import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase/client';

export interface OfflineAction {
  id: string;
  type: 'prediction_create' | 'prediction_update' | 'prediction_delete' | 'league_join';
  data: any;
  timestamp: number;
  retryCount: number;
  userId: string;
}

export interface SyncStatus {
  isOnline: boolean;
  isConnected: boolean;
  lastSyncTime: Date | null;
  pendingActions: number;
  isSyncing: boolean;
  syncError: string | null;
}

export class OfflineSyncService {
  private static readonly OFFLINE_ACTIONS_KEY = '@scorekick/offline_actions';
  private static readonly LAST_SYNC_KEY = '@scorekick/last_sync';
  private static readonly MAX_RETRY_COUNT = 3;
  
  private static listeners: ((status: SyncStatus) => void)[] = [];
  private static currentStatus: SyncStatus = {
    isOnline: false,
    isConnected: false,
    lastSyncTime: null,
    pendingActions: 0,
    isSyncing: false,
    syncError: null,
  };

  /**
   * Initialize offline sync service
   */
  static async initialize(): Promise<void> {
    console.log('[OfflineSync] Initializing...');
    
    // Load last sync time
    try {
      const lastSyncStr = await AsyncStorage.getItem(this.LAST_SYNC_KEY);
      if (lastSyncStr) {
        this.currentStatus.lastSyncTime = new Date(lastSyncStr);
      }
    } catch (error) {
      console.error('[OfflineSync] Failed to load last sync time:', error);
    }

    // Load pending actions count
    await this.updatePendingActionsCount();

    // Listen to network status
    NetInfo.addEventListener(state => {
      const wasOnline = this.currentStatus.isOnline;
      this.currentStatus.isOnline = state.isConnected === true;
      this.currentStatus.isConnected = state.isInternetReachable === true;
      
      console.log('[OfflineSync] Network status changed:', {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });

      // If we just came back online, trigger sync
      if (!wasOnline && this.currentStatus.isOnline) {
        console.log('[OfflineSync] Came back online, triggering sync...');
        this.syncPendingActions();
      }

      this.notifyListeners();
    });

    // Get initial network status
    const netInfo = await NetInfo.fetch();
    this.currentStatus.isOnline = netInfo.isConnected === true;
    this.currentStatus.isConnected = netInfo.isInternetReachable === true;
    
    console.log('[OfflineSync] Initialized with status:', this.currentStatus);
    this.notifyListeners();
  }

  /**
   * Add a status change listener
   */
  static addStatusListener(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get current sync status
   */
  static getSyncStatus(): SyncStatus {
    return { ...this.currentStatus };
  }

  /**
   * Queue an action for offline execution
   */
  static async queueOfflineAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    try {
      const offlineAction: OfflineAction = {
        ...action,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        retryCount: 0,
      };

      // Get existing actions
      const existingActions = await this.getPendingActions();
      existingActions.push(offlineAction);

      // Save to storage
      await AsyncStorage.setItem(this.OFFLINE_ACTIONS_KEY, JSON.stringify(existingActions));
      
      console.log('[OfflineSync] Queued offline action:', offlineAction.type);
      
      // Update status
      await this.updatePendingActionsCount();
      this.notifyListeners();

      // Try to sync immediately if online
      if (this.currentStatus.isOnline && !this.currentStatus.isSyncing) {
        this.syncPendingActions();
      }
    } catch (error) {
      console.error('[OfflineSync] Failed to queue offline action:', error);
    }
  }

  /**
   * Sync all pending actions
   */
  static async syncPendingActions(): Promise<boolean> {
    if (this.currentStatus.isSyncing) {
      console.log('[OfflineSync] Sync already in progress');
      return false;
    }

    if (!this.currentStatus.isOnline) {
      console.log('[OfflineSync] Cannot sync - offline');
      return false;
    }

    this.currentStatus.isSyncing = true;
    this.currentStatus.syncError = null;
    this.notifyListeners();

    console.log('[OfflineSync] Starting sync...');

    try {
      const pendingActions = await this.getPendingActions();
      console.log(`[OfflineSync] Found ${pendingActions.length} pending actions`);

      if (pendingActions.length === 0) {
        this.currentStatus.isSyncing = false;
        this.notifyListeners();
        return true;
      }

      const successfulActions: string[] = [];
      const failedActions: OfflineAction[] = [];

      for (const action of pendingActions) {
        try {
          console.log(`[OfflineSync] Syncing action: ${action.type}`);
          const success = await this.executeAction(action);
          
          if (success) {
            successfulActions.push(action.id);
            console.log(`[OfflineSync] Successfully synced: ${action.type}`);
          } else {
            // Increment retry count
            action.retryCount++;
            if (action.retryCount < this.MAX_RETRY_COUNT) {
              failedActions.push(action);
              console.log(`[OfflineSync] Failed to sync (will retry): ${action.type}`);
            } else {
              console.log(`[OfflineSync] Max retries reached, discarding: ${action.type}`);
            }
          }
        } catch (error) {
          console.error(`[OfflineSync] Error syncing action ${action.type}:`, error);
          action.retryCount++;
          if (action.retryCount < this.MAX_RETRY_COUNT) {
            failedActions.push(action);
          }
        }
      }

      // Update pending actions (remove successful ones, keep failed ones for retry)
      await AsyncStorage.setItem(this.OFFLINE_ACTIONS_KEY, JSON.stringify(failedActions));
      
      // Update last sync time
      this.currentStatus.lastSyncTime = new Date();
      await AsyncStorage.setItem(this.LAST_SYNC_KEY, this.currentStatus.lastSyncTime.toISOString());

      console.log(`[OfflineSync] Sync completed: ${successfulActions.length} success, ${failedActions.length} failed`);

      this.currentStatus.isSyncing = false;
      await this.updatePendingActionsCount();
      this.notifyListeners();

      return failedActions.length === 0;
    } catch (error) {
      console.error('[OfflineSync] Sync failed:', error);
      this.currentStatus.isSyncing = false;
      this.currentStatus.syncError = error instanceof Error ? error.message : 'Sync failed';
      this.notifyListeners();
      return false;
    }
  }

  /**
   * Execute a specific offline action
   */
  private static async executeAction(action: OfflineAction): Promise<boolean> {
    try {
      switch (action.type) {
        case 'prediction_create':
          return await this.executePredictionCreate(action.data);
        case 'prediction_update':
          return await this.executePredictionUpdate(action.data);
        case 'prediction_delete':
          return await this.executePredictionDelete(action.data);
        case 'league_join':
          return await this.executeLeagueJoin(action.data);
        default:
          console.warn('[OfflineSync] Unknown action type:', action.type);
          return false;
      }
    } catch (error) {
      console.error(`[OfflineSync] Failed to execute ${action.type}:`, error);
      return false;
    }
  }

  /**
   * Execute prediction creation
   */
  private static async executePredictionCreate(data: any): Promise<boolean> {
    const { error } = await supabase
      .from('predictions')
      .insert(data);
    
    return !error;
  }

  /**
   * Execute prediction update
   */
  private static async executePredictionUpdate(data: any): Promise<boolean> {
    const { predictionId, ...updateData } = data;
    
    const { error } = await supabase
      .from('predictions')
      .update(updateData)
      .eq('id', predictionId);
    
    return !error;
  }

  /**
   * Execute prediction deletion
   */
  private static async executePredictionDelete(data: any): Promise<boolean> {
    const { error } = await supabase
      .from('predictions')
      .delete()
      .eq('id', data.predictionId);
    
    return !error;
  }

  /**
   * Execute league join
   */
  private static async executeLeagueJoin(data: any): Promise<boolean> {
    const { error } = await supabase
      .from('league_members')
      .insert(data);
    
    return !error;
  }

  /**
   * Get pending actions from storage
   */
  private static async getPendingActions(): Promise<OfflineAction[]> {
    try {
      const actionsStr = await AsyncStorage.getItem(this.OFFLINE_ACTIONS_KEY);
      return actionsStr ? JSON.parse(actionsStr) : [];
    } catch (error) {
      console.error('[OfflineSync] Failed to get pending actions:', error);
      return [];
    }
  }

  /**
   * Update pending actions count in status
   */
  private static async updatePendingActionsCount(): Promise<void> {
    try {
      const actions = await this.getPendingActions();
      this.currentStatus.pendingActions = actions.length;
    } catch (error) {
      console.error('[OfflineSync] Failed to update pending actions count:', error);
    }
  }

  /**
   * Clear all pending actions
   */
  static async clearPendingActions(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.OFFLINE_ACTIONS_KEY);
      this.currentStatus.pendingActions = 0;
      this.notifyListeners();
      console.log('[OfflineSync] Cleared all pending actions');
    } catch (error) {
      console.error('[OfflineSync] Failed to clear pending actions:', error);
    }
  }

  /**
   * Notify all status listeners
   */
  private static notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getSyncStatus());
      } catch (error) {
        console.error('[OfflineSync] Error in status listener:', error);
      }
    });
  }

  /**
   * Force sync (manual trigger)
   */
  static async forceSyncManual(): Promise<boolean> {
    console.log('[OfflineSync] Manual sync triggered');
    return await this.syncPendingActions();
  }
}