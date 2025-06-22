import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { formatDistanceToNow, format } from 'date-fns';

export function SyncStatusScreen() {
  const {
    isOnline,
    isConnected,
    lastSyncTime,
    pendingActions,
    isSyncing,
    syncError,
    forceSync,
    clearPendingActions,
  } = useNetworkStatus();

  const handleForceSync = async () => {
    try {
      const success = await forceSync();
      if (success) {
        Alert.alert('Success', 'Sync completed successfully');
      } else {
        Alert.alert('Error', 'Sync failed. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to sync. Please check your connection.');
    }
  };

  const handleClearPending = () => {
    Alert.alert(
      'Clear Pending Actions',
      'This will permanently remove all pending offline actions. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: clearPendingActions,
        },
      ]
    );
  };

  const getConnectionStatus = () => {
    if (!isOnline) return { text: 'Offline', color: 'text-red-600', bg: 'bg-red-100' };
    if (!isConnected) return { text: 'Limited', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { text: 'Connected', color: 'text-green-600', bg: 'bg-green-100' };
  };

  const connectionStatus = getConnectionStatus();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        <View className="bg-white m-4 rounded-lg shadow-sm">
          <View className="p-4 border-b border-gray-200">
            <Text className="text-lg font-semibold text-gray-900">
              Sync Status
            </Text>
          </View>

          {/* Connection Status */}
          <View className="p-4 border-b border-gray-200">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-gray-700 font-medium">Connection Status</Text>
              <View className={`px-3 py-1 rounded-full ${connectionStatus.bg}`}>
                <Text className={`text-sm font-medium ${connectionStatus.color}`}>
                  {connectionStatus.text}
                </Text>
              </View>
            </View>
            
            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-gray-500">Internet Connection</Text>
                <Text className={isOnline ? 'text-green-600' : 'text-red-600'}>
                  {isOnline ? 'Available' : 'Unavailable'}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-500">Server Reachable</Text>
                <Text className={isConnected ? 'text-green-600' : 'text-red-600'}>
                  {isConnected ? 'Yes' : 'No'}
                </Text>
              </View>
            </View>
          </View>

          {/* Sync Information */}
          <View className="p-4 border-b border-gray-200">
            <Text className="text-gray-700 font-medium mb-3">Sync Information</Text>
            
            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-gray-500">Last Sync</Text>
                <Text className="text-gray-900">
                  {lastSyncTime 
                    ? formatDistanceToNow(lastSyncTime, { addSuffix: true })
                    : 'Never'
                  }
                </Text>
              </View>
              
              {lastSyncTime && (
                <View className="flex-row justify-between">
                  <Text className="text-gray-500">Exact Time</Text>
                  <Text className="text-gray-600 text-sm">
                    {format(lastSyncTime, 'MMM d, yyyy h:mm a')}
                  </Text>
                </View>
              )}
              
              <View className="flex-row justify-between">
                <Text className="text-gray-500">Sync Status</Text>
                <Text className={isSyncing ? 'text-blue-600' : 'text-gray-900'}>
                  {isSyncing ? 'Syncing...' : 'Idle'}
                </Text>
              </View>
              
              <View className="flex-row justify-between">
                <Text className="text-gray-500">Pending Actions</Text>
                <Text className={pendingActions > 0 ? 'text-orange-600' : 'text-gray-900'}>
                  {pendingActions}
                </Text>
              </View>
            </View>
          </View>

          {/* Error Information */}
          {syncError && (
            <View className="p-4 border-b border-gray-200">
              <Text className="text-gray-700 font-medium mb-2">Sync Error</Text>
              <View className="bg-red-50 p-3 rounded-md">
                <Text className="text-red-800 text-sm">{syncError}</Text>
              </View>
            </View>
          )}

          {/* Actions */}
          <View className="p-4 space-y-3">
            <TouchableOpacity
              onPress={handleForceSync}
              disabled={isSyncing || (!isOnline && pendingActions === 0)}
              className={`p-3 rounded-md ${
                isSyncing || (!isOnline && pendingActions === 0)
                  ? 'bg-gray-100'
                  : 'bg-blue-600'
              }`}
            >
              <Text className={`text-center font-medium ${
                isSyncing || (!isOnline && pendingActions === 0)
                  ? 'text-gray-400'
                  : 'text-white'
              }`}>
                {isSyncing ? 'Syncing...' : 'Force Sync Now'}
              </Text>
            </TouchableOpacity>

            {pendingActions > 0 && (
              <TouchableOpacity
                onPress={handleClearPending}
                className="p-3 rounded-md border border-red-300 bg-red-50"
              >
                <Text className="text-center font-medium text-red-600">
                  Clear Pending Actions ({pendingActions})
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Help Information */}
        <View className="bg-white m-4 mt-0 rounded-lg shadow-sm">
          <View className="p-4">
            <Text className="text-gray-700 font-medium mb-3">About Sync</Text>
            <Text className="text-gray-600 text-sm leading-5">
              ScoreKick automatically syncs your predictions, league data, and scores when you're online. 
              When offline, your actions are stored locally and will sync when connection is restored.
            </Text>
            
            <View className="mt-4 space-y-2">
              <View className="flex-row">
                <View className="w-3 h-3 bg-green-500 rounded-full mt-1 mr-3" />
                <Text className="text-sm text-gray-600 flex-1">
                  Connected - Real-time sync active
                </Text>
              </View>
              <View className="flex-row">
                <View className="w-3 h-3 bg-orange-500 rounded-full mt-1 mr-3" />
                <Text className="text-sm text-gray-600 flex-1">
                  Limited - Some sync delays possible
                </Text>
              </View>
              <View className="flex-row">
                <View className="w-3 h-3 bg-red-500 rounded-full mt-1 mr-3" />
                <Text className="text-sm text-gray-600 flex-1">
                  Offline - Actions stored for later sync
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}