import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { AppState } from 'react-native';
import 'react-native-gesture-handler';
import { queryClient } from './src/lib/react-query/client';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthProvider } from './src/features/auth/AuthProvider';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';
import { BackgroundSyncService } from './src/services/backgroundSync';
import { RealtimeService } from './src/services/realtimeService';
import { OfflineSyncService } from './src/services/offlineSyncService';
import { useNotificationHandler } from './src/hooks/useNotifications';

export default function App() {
  // Initialize notification handler
  useNotificationHandler();

  useEffect(() => {
    // Initialize services when app starts
    const initializeApp = async () => {
      // Initialize offline sync service
      await OfflineSyncService.initialize();
      
      // Register background sync (only works in dev builds)
      BackgroundSyncService.registerBackgroundSync();
      
      // Initialize realtime connections
      await RealtimeService.initialize();
      
      // Initial sync when app starts
      BackgroundSyncService.manualSync();
    };

    initializeApp();

    // Set up manual sync for Expo Go when app becomes active
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // Perform manual sync when app becomes active (useful for Expo Go)
        BackgroundSyncService.manualSync();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
      // Cleanup realtime connections
      RealtimeService.unsubscribeAll();
    };
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <StatusBar style="auto" />
            <RootNavigator />
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
