import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { EdgeFunctionService } from '../features/matches/services/edgeFunctionService';

const BACKGROUND_SYNC_TASK = 'background-sync-task';

// Check if we're running in a development build (not Expo Go)
const isDevBuild = Platform.OS !== 'web' && !__DEV__;

// Define the background task (only works in development builds)
if (isDevBuild) {
  TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
    try {
      console.log('[BackgroundSync] Starting background match sync...');
      
      // Sync matches and standings via Edge Function
      const result = await EdgeFunctionService.syncAllData();
      
      console.log('[BackgroundSync] Sync completed:', {
        matchesUpdated: result.matchesUpdated,
        standingsUpdated: result.standingsUpdated,
        errorsCount: result.errors.length
      });
      
      // Return success status (using generic success/failure)
      return result.errors.length === 0 ? 'success' : 'failed';
    } catch (error) {
      console.error('[BackgroundSync] Background sync failed:', error);
      return 'failed';
    }
  });
}

export class BackgroundSyncService {
  /**
   * Register background sync task
   * This should be called when the app starts
   * Note: Only works in development builds, not in Expo Go
   */
  static async registerBackgroundSync(): Promise<void> {
    if (!isDevBuild) {
      console.log('[BackgroundSync] Background sync not available in Expo Go - skipping registration');
      return;
    }

    try {
      // Dynamic import to avoid loading expo-background-fetch in Expo Go
      const BackgroundFetch = await import('expo-background-fetch');
      
      // Check if task is already registered
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
      
      if (!isRegistered) {
        // Register the background fetch task
        await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
          minimumInterval: 15 * 60, // 15 minutes minimum interval
          stopOnTerminate: false, // Continue running when app is terminated
          startOnBoot: true, // Start when device boots
        });
        
        console.log('[BackgroundSync] Background sync registered successfully');
      } else {
        console.log('[BackgroundSync] Background sync already registered');
      }
    } catch (error) {
      console.error('[BackgroundSync] Failed to register background sync:', error);
    }
  }

  /**
   * Unregister background sync task
   */
  static async unregisterBackgroundSync(): Promise<void> {
    if (!isDevBuild) {
      console.log('[BackgroundSync] Background sync not available in Expo Go - skipping unregistration');
      return;
    }

    try {
      const BackgroundFetch = await import('expo-background-fetch');
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
      console.log('[BackgroundSync] Background sync unregistered');
    } catch (error) {
      console.error('[BackgroundSync] Failed to unregister background sync:', error);
    }
  }

  /**
   * Check background fetch status
   */
  static async getBackgroundFetchStatus(): Promise<string> {
    if (!isDevBuild) {
      return 'unavailable_expo_go';
    }

    try {
      const BackgroundFetch = await import('expo-background-fetch');
      const status = await BackgroundFetch.getStatusAsync();
      return status || 'denied';
    } catch (error) {
      return 'error';
    }
  }

  /**
   * Check if background sync is available and enabled
   */
  static async isBackgroundSyncEnabled(): Promise<boolean> {
    if (!isDevBuild) {
      return false;
    }

    try {
      const BackgroundFetch = await import('expo-background-fetch');
      const status = await BackgroundFetch.getStatusAsync();
      return status === BackgroundFetch.BackgroundFetchStatus.Available;
    } catch (error) {
      return false;
    }
  }

  /**
   * Manual sync function for when background sync is not available
   * This can be called when the app becomes active
   */
  static async manualSync(): Promise<void> {
    try {
      console.log('[BackgroundSync] Starting manual sync...');
      
      const result = await EdgeFunctionService.syncAllData();
      
      console.log('[BackgroundSync] Manual sync completed:', {
        matchesUpdated: result.matchesUpdated,
        standingsUpdated: result.standingsUpdated,
        errorsCount: result.errors.length
      });
    } catch (error) {
      console.error('[BackgroundSync] Manual sync failed:', error);
    }
  }
}