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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <ScrollView style={{ flex: 1 }}>
        <View style={{ backgroundColor: 'white', margin: 16, borderRadius: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 }}>
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>
              Sync Status
            </Text>
          </View>

          {/* Connection Status */}
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ color: '#374151', fontWeight: '500' }}>Connection Status</Text>
              <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 50, backgroundColor: connectionStatus.bg === 'bg-green-100' ? '#dcfce7' : connectionStatus.bg === 'bg-orange-100' ? '#fed7aa' : '#fee2e2' }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: connectionStatus.color === 'text-green-600' ? '#059669' : connectionStatus.color === 'text-orange-600' ? '#ea580c' : '#dc2626' }}>
                  {connectionStatus.text}
                </Text>
              </View>
            </View>
            
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#6b7280' }}>Internet Connection</Text>
                <Text style={{ color: isOnline ? '#059669' : '#dc2626' }}>
                  {isOnline ? 'Available' : 'Unavailable'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#6b7280' }}>Server Reachable</Text>
                <Text style={{ color: isConnected ? '#059669' : '#dc2626' }}>
                  {isConnected ? 'Yes' : 'No'}
                </Text>
              </View>
            </View>
          </View>

          {/* Sync Information */}
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
            <Text style={{ color: '#374151', fontWeight: '500', marginBottom: 12 }}>Sync Information</Text>
            
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#6b7280' }}>Last Sync</Text>
                <Text style={{ color: '#111827' }}>
                  {lastSyncTime 
                    ? formatDistanceToNow(lastSyncTime, { addSuffix: true })
                    : 'Never'
                  }
                </Text>
              </View>
              
              {lastSyncTime && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#6b7280' }}>Exact Time</Text>
                  <Text style={{ color: '#4b5563', fontSize: 14 }}>
                    {format(lastSyncTime, 'MMM d, yyyy h:mm a')}
                  </Text>
                </View>
              )}
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#6b7280' }}>Sync Status</Text>
                <Text style={{ color: isSyncing ? '#2563eb' : '#111827' }}>
                  {isSyncing ? 'Syncing...' : 'Idle'}
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#6b7280' }}>Pending Actions</Text>
                <Text style={{ color: pendingActions > 0 ? '#ea580c' : '#111827' }}>
                  {pendingActions}
                </Text>
              </View>
            </View>
          </View>

          {/* Error Information */}
          {syncError && (
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
              <Text style={{ color: '#374151', fontWeight: '500', marginBottom: 8 }}>Sync Error</Text>
              <View style={{ backgroundColor: '#fef2f2', padding: 12, borderRadius: 6 }}>
                <Text style={{ color: '#991b1b', fontSize: 14 }}>{syncError}</Text>
              </View>
            </View>
          )}

          {/* Actions */}
          <View style={{ padding: 16, gap: 12 }}>
            <TouchableOpacity
              onPress={handleForceSync}
              disabled={isSyncing || (!isOnline && pendingActions === 0)}
              style={{
                padding: 12,
                borderRadius: 6,
                backgroundColor: isSyncing || (!isOnline && pendingActions === 0) ? '#f3f4f6' : '#2563eb'
              }}
            >
              <Text style={{
                textAlign: 'center',
                fontWeight: '500',
                color: isSyncing || (!isOnline && pendingActions === 0) ? '#9ca3af' : 'white'
              }}>
                {isSyncing ? 'Syncing...' : 'Force Sync Now'}
              </Text>
            </TouchableOpacity>

            {pendingActions > 0 && (
              <TouchableOpacity
                onPress={handleClearPending}
                style={{ padding: 12, borderRadius: 6, borderWidth: 1, borderColor: '#fca5a5', backgroundColor: '#fef2f2' }}
              >
                <Text style={{ textAlign: 'center', fontWeight: '500', color: '#dc2626' }}>
                  Clear Pending Actions ({pendingActions})
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Help Information */}
        <View style={{ backgroundColor: 'white', margin: 16, marginTop: 0, borderRadius: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 }}>
          <View style={{ padding: 16 }}>
            <Text style={{ color: '#374151', fontWeight: '500', marginBottom: 12 }}>About Sync</Text>
            <Text style={{ color: '#4b5563', fontSize: 14, lineHeight: 20 }}>
              ScoreKick automatically syncs your predictions, league data, and scores when you're online. 
              When offline, your actions are stored locally and will sync when connection is restored.
            </Text>
            
            <View style={{ marginTop: 16, gap: 8 }}>
              <View style={{ flexDirection: 'row' }}>
                <View style={{ width: 12, height: 12, backgroundColor: '#10b981', borderRadius: 6, marginTop: 4, marginRight: 12 }} />
                <Text style={{ fontSize: 14, color: '#4b5563', flex: 1 }}>
                  Connected - Real-time sync active
                </Text>
              </View>
              <View style={{ flexDirection: 'row' }}>
                <View style={{ width: 12, height: 12, backgroundColor: '#f97316', borderRadius: 6, marginTop: 4, marginRight: 12 }} />
                <Text style={{ fontSize: 14, color: '#4b5563', flex: 1 }}>
                  Limited - Some sync delays possible
                </Text>
              </View>
              <View style={{ flexDirection: 'row' }}>
                <View style={{ width: 12, height: 12, backgroundColor: '#ef4444', borderRadius: 6, marginTop: 4, marginRight: 12 }} />
                <Text style={{ fontSize: 14, color: '#4b5563', flex: 1 }}>
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