import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { AppState, View } from 'react-native';
import 'react-native-gesture-handler';
import { queryClient } from './src/lib/react-query/client';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthProvider } from './src/features/auth/AuthProvider';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { SelectedLeagueProvider } from './src/contexts/SelectedLeagueContext';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';
import { BackgroundSyncService } from './src/services/backgroundSync';
import { RealtimeService } from './src/services/realtimeService';
import { OfflineSyncService } from './src/services/offlineSyncService';
import { useNotificationHandler } from './src/hooks/useNotifications';

// Component interno che usa il tema
function AppContent() {
  const { colors, isDark } = useTheme();
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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} backgroundColor={colors.background} />
      <RootNavigator />
    </View>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ThemeProvider>
              <SelectedLeagueProvider>
                <AppContent />
              </SelectedLeagueProvider>
            </ThemeProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
