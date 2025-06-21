import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import 'react-native-gesture-handler';
import { queryClient } from './src/lib/react-query/client';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthProvider } from './src/features/auth/AuthProvider';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';

export default function App() {
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
