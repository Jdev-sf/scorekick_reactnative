import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

interface OfflineNoticeProps {
  message?: string;
  showRetry?: boolean;
  onRetry?: () => void;
}

export function OfflineNotice({ 
  message = "You're currently offline. Some features may be limited.",
  showRetry = true,
  onRetry
}: OfflineNoticeProps) {
  const { isOnline, isConnected, forceSync, pendingActions } = useNetworkStatus();

  // Don't show if online
  if (isOnline && isConnected) {
    return null;
  }

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else if (pendingActions > 0) {
      forceSync();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            📶 Limited Connectivity
          </Text>
          <Text style={styles.message}>
            {message}
          </Text>
          {pendingActions > 0 && (
            <Text style={styles.pendingText}>
              {pendingActions} action{pendingActions > 1 ? 's' : ''} will sync when connection is restored
            </Text>
          )}
        </View>
        
        {showRetry && (
          <TouchableOpacity
            onPress={handleRetry}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>
              Retry
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

/**
 * Simple inline offline indicator
 */
export function InlineOfflineIndicator() {
  const { isOnline, isConnected } = useNetworkStatus();

  if (isOnline && isConnected) {
    return null;
  }

  return (
    <View style={styles.inlineContainer}>
      <View style={styles.inlineIndicator} />
      <Text style={styles.inlineText}>
        Offline
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEF3E2',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 8,
    padding: 16,
    margin: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#9A3412',
    fontWeight: '500',
    fontSize: 16,
    marginBottom: 4,
  },
  message: {
    color: '#C2410C',
    fontSize: 14,
    lineHeight: 20,
  },
  pendingText: {
    color: '#EA580C',
    fontSize: 12,
    marginTop: 8,
  },
  retryButton: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 12,
  },
  retryText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3E2',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  inlineIndicator: {
    width: 8,
    height: 8,
    backgroundColor: '#F97316',
    borderRadius: 4,
    marginRight: 8,
  },
  inlineText: {
    color: '#C2410C',
    fontSize: 12,
    fontWeight: '500',
  },
});