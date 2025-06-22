import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { formatDistanceToNow } from 'date-fns';

interface NetworkStatusIndicatorProps {
  position?: 'top' | 'bottom';
  compact?: boolean;
}

export function NetworkStatusIndicator({ 
  position = 'top',
  compact = false 
}: NetworkStatusIndicatorProps) {
  const { 
    isOnline, 
    isConnected, 
    lastSyncTime, 
    pendingActions, 
    isSyncing, 
    syncError,
    forceSync 
  } = useNetworkStatus();

  // Don't show if everything is normal and no pending actions
  if (isOnline && isConnected && !isSyncing && pendingActions === 0 && !syncError) {
    return null;
  }

  const getStatusColor = () => {
    if (syncError) return 'bg-red-500';
    if (!isOnline || !isConnected) return 'bg-orange-500';
    if (isSyncing) return 'bg-blue-500';
    if (pendingActions > 0) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (syncError) return `Sync error: ${syncError}`;
    if (!isOnline) return 'No internet connection';
    if (!isConnected) return 'Limited connectivity';
    if (isSyncing) return 'Syncing...';
    if (pendingActions > 0) return `${pendingActions} pending action${pendingActions > 1 ? 's' : ''}`;
    return 'Connected';
  };

  const getLastSyncText = () => {
    if (!lastSyncTime) return 'Never synced';
    return `Last sync: ${formatDistanceToNow(lastSyncTime, { addSuffix: true })}`;
  };

  const handlePress = () => {
    if (pendingActions > 0 && !isSyncing) {
      forceSync();
    }
  };

  const getStatusBackgroundColor = () => {
    if (syncError) return '#EF4444';
    if (!isOnline || !isConnected) return '#F59E0B';
    if (isSyncing) return '#3B82F6';
    if (pendingActions > 0) return '#EAB308';
    return '#10B981';
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: getStatusBackgroundColor(),
          borderRadius: position === 'top' ? 8 : 8,
          paddingHorizontal: compact ? 12 : 16,
          paddingVertical: compact ? 4 : 8,
          margin: 16,
          marginTop: position === 'top' ? 0 : 8,
          marginBottom: position === 'bottom' ? 0 : 8,
          opacity: 0.9,
        }
      ]}
      onPress={handlePress}
      disabled={isSyncing || pendingActions === 0}
    >
      <View style={styles.row}>
        <View style={styles.leftSection}>
          {isSyncing ? (
            <ActivityIndicator size="small" color="white" style={styles.marginRight} />
          ) : (
            <View style={[
              styles.indicator, 
              { opacity: !isOnline ? 0.5 : 1 }
            ]} />
          )}
          
          <View style={styles.textSection}>
            <Text style={[
              styles.primaryText,
              { fontSize: compact ? 14 : 16 }
            ]}>
              {getStatusText()}
            </Text>
            {!compact && (
              <Text style={styles.secondaryText}>
                {getLastSyncText()}
              </Text>
            )}
          </View>
        </View>

        {pendingActions > 0 && !isSyncing && (
          <Text style={styles.actionText}>
            Tap to sync
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

/**
 * Compact version for use in headers or minimal spaces
 */
export function CompactNetworkStatus() {
  const { isOnline, isConnected, isSyncing, pendingActions } = useNetworkStatus();

  const getIndicatorColor = () => {
    if (!isOnline || !isConnected) return '#EF4444';
    if (isSyncing) return '#3B82F6';
    if (pendingActions > 0) return '#EAB308';
    return '#10B981';
  };

  return (
    <View style={styles.compactContainer}>
      <View style={[
        styles.compactIndicator,
        { backgroundColor: getIndicatorColor() }
      ]} />
      {isSyncing && (
        <ActivityIndicator size="small" color="#666" style={styles.compactMargin} />
      )}
      {pendingActions > 0 && !isSyncing && (
        <Text style={styles.compactText}>
          {pendingActions}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  marginRight: {
    marginRight: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
    marginRight: 8,
  },
  textSection: {
    flex: 1,
  },
  primaryText: {
    color: 'white',
    fontWeight: '500',
  },
  secondaryText: {
    color: 'white',
    fontSize: 12,
    opacity: 0.8,
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.9,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  compactMargin: {
    marginLeft: 8,
  },
  compactText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
});