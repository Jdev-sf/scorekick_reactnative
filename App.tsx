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

export default function App() {
  useEffect(() => {
    // Register background sync when app starts (only works in dev builds)
    BackgroundSyncService.registerBackgroundSync();

    // Set up manual sync for Expo Go when app becomes active
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // Perform manual sync when app becomes active (useful for Expo Go)
        BackgroundSyncService.manualSync();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Initial sync when app starts
    BackgroundSyncService.manualSync();

    return () => {
      subscription?.remove();
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
