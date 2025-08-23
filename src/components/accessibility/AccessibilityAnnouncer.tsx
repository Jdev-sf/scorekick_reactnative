import React, { useEffect, useRef } from 'react';
import { View, Text } from 'react-native';
import { useAccessibility } from '../../hooks/useAccessibility';

interface AccessibilityAnnouncerProps {
  message?: string;
  priority?: 'low' | 'high';
  delay?: number;
  children?: React.ReactNode;
}

export const AccessibilityAnnouncer: React.FC<AccessibilityAnnouncerProps> = ({
  message,
  priority = 'low',
  delay = 0,
  children,
}) => {
  const { announceForAccessibility, isAccessibilityServiceEnabled } = useAccessibility();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (message && isAccessibilityServiceEnabled()) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        announceForAccessibility(message);
      }, delay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [message, delay, announceForAccessibility, isAccessibilityServiceEnabled]);

  // For screen readers, render hidden text that will be read
  if (isAccessibilityServiceEnabled() && message) {
    return (
      <View>
        {children}
        <Text 
          style={{ 
            position: 'absolute',
            left: -10000,
            width: 1,
            height: 1,
            overflow: 'hidden'
          }}
          accessible={true}
          accessibilityLiveRegion={priority === 'high' ? 'assertive' : 'polite'}
        >
          {message}
        </Text>
      </View>
    );
  }

  return <>{children}</>;
};

// Hook for programmatic announcements
export const useAnnouncement = () => {
  const { announceForAccessibility, isAccessibilityServiceEnabled } = useAccessibility();

  const announce = (message: string, priority: 'low' | 'high' = 'low', delay = 0) => {
    if (!isAccessibilityServiceEnabled()) return;

    setTimeout(() => {
      announceForAccessibility(message);
    }, delay);
  };

  const announceAchievement = (achievementName: string) => {
    announce(`Achievement unlocked: ${achievementName}!`, 'high', 100);
  };

  const announcePredictionResult = (result: 'correct' | 'incorrect', points?: number) => {
    const message = result === 'correct' 
      ? `Correct prediction! ${points ? `You earned ${points} points.` : ''}`
      : 'Prediction was incorrect.';
    announce(message, 'high', 100);
  };

  const announceLeagueUpdate = (type: 'joined' | 'left' | 'created', leagueName: string) => {
    const messages = {
      joined: `Joined league: ${leagueName}`,
      left: `Left league: ${leagueName}`,
      created: `Created league: ${leagueName}`,
    };
    announce(messages[type], 'low', 200);
  };

  const announceNavigationChange = (screenName: string) => {
    announce(`Navigated to ${screenName}`, 'low', 100);
  };

  const announceError = (error: string) => {
    announce(`Error: ${error}`, 'high', 0);
  };

  const announceSuccess = (message: string) => {
    announce(`Success: ${message}`, 'high', 100);
  };

  return {
    announce,
    announceAchievement,
    announcePredictionResult,
    announceLeagueUpdate,
    announceNavigationChange,
    announceError,
    announceSuccess,
  };
};