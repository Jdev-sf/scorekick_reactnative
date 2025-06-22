import { useEffect, useState } from 'react';
import { OfflineSyncService, SyncStatus } from '../services/offlineSyncService';

export interface NetworkStatus {
  isOnline: boolean;
  isConnected: boolean;
  lastSyncTime: Date | null;
  pendingActions: number;
  isSyncing: boolean;
  syncError: string | null;
}

/**
 * Hook for monitoring network status and offline sync state
 */
export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: false,
    isConnected: false,
    lastSyncTime: null,
    pendingActions: 0,
    isSyncing: false,
    syncError: null,
  });

  useEffect(() => {
    // Get initial status
    const initialStatus = OfflineSyncService.getSyncStatus();
    setStatus(initialStatus);

    // Subscribe to status changes
    const unsubscribe = OfflineSyncService.addStatusListener((newStatus: SyncStatus) => {
      setStatus(newStatus);
    });

    return unsubscribe;
  }, []);

  const forceSync = async () => {
    return await OfflineSyncService.forceSyncManual();
  };

  const clearPendingActions = async () => {
    await OfflineSyncService.clearPendingActions();
  };

  return {
    ...status,
    forceSync,
    clearPendingActions,
  };
}

/**
 * Hook for offline action management
 */
export function useOfflineActions() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeOfflineSync = async () => {
      await OfflineSyncService.initialize();
      setIsInitialized(true);
    };

    initializeOfflineSync();
  }, []);

  const queueAction = async (
    type: 'prediction_create' | 'prediction_update' | 'prediction_delete' | 'league_join',
    data: any,
    userId: string
  ) => {
    return await OfflineSyncService.queueOfflineAction({
      type,
      data,
      userId,
    });
  };

  return {
    isInitialized,
    queueAction,
  };
}