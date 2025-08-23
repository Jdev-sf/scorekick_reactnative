import { useState, useEffect } from 'react';
import { AccessibilityInfo, Dimensions } from 'react-native';

export interface AccessibilitySettings {
  isScreenReaderEnabled: boolean;
  isReduceMotionEnabled: boolean;
  isReduceTransparencyEnabled: boolean;
  isBoldTextEnabled: boolean;
  isGrayscaleEnabled: boolean;
  isInvertColorsEnabled: boolean;
  prefersCrossFadeTransitions: boolean;
  fontScale: number;
  windowDimensions: { width: number; height: number };
}

export const useAccessibility = () => {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    isScreenReaderEnabled: false,
    isReduceMotionEnabled: false,
    isReduceTransparencyEnabled: false,
    isBoldTextEnabled: false,
    isGrayscaleEnabled: false,
    isInvertColorsEnabled: false,
    prefersCrossFadeTransitions: false,
    fontScale: 1,
    windowDimensions: Dimensions.get('window'),
  });

  useEffect(() => {
    // Check initial accessibility settings
    const checkSettings = async () => {
      try {
        const [
          screenReader,
          reduceMotion,
          reduceTransparency,
          boldText,
          grayscale,
          invertColors,
          crossFade,
        ] = await Promise.all([
          AccessibilityInfo.isScreenReaderEnabled(),
          AccessibilityInfo.isReduceMotionEnabled(),
          AccessibilityInfo.isReduceTransparencyEnabled(),
          AccessibilityInfo.isBoldTextEnabled(),
          AccessibilityInfo.isGrayscaleEnabled(),
          AccessibilityInfo.isInvertColorsEnabled(),
          AccessibilityInfo.prefersCrossFadeTransitions(),
        ]);

        setSettings(prev => ({
          ...prev,
          isScreenReaderEnabled: screenReader,
          isReduceMotionEnabled: reduceMotion,
          isReduceTransparencyEnabled: reduceTransparency,
          isBoldTextEnabled: boldText,
          isGrayscaleEnabled: grayscale,
          isInvertColorsEnabled: invertColors,
          prefersCrossFadeTransitions: crossFade,
        }));
      } catch (error) {
        console.warn('Failed to check accessibility settings:', error);
      }
    };

    checkSettings();

    // Listen for changes
    const subscriptions = [
      AccessibilityInfo.addEventListener('screenReaderChanged', (enabled) => {
        setSettings(prev => ({ ...prev, isScreenReaderEnabled: enabled }));
      }),
      AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
        setSettings(prev => ({ ...prev, isReduceMotionEnabled: enabled }));
      }),
      AccessibilityInfo.addEventListener('reduceTransparencyChanged', (enabled) => {
        setSettings(prev => ({ ...prev, isReduceTransparencyEnabled: enabled }));
      }),
      AccessibilityInfo.addEventListener('boldTextChanged', (enabled) => {
        setSettings(prev => ({ ...prev, isBoldTextEnabled: enabled }));
      }),
      AccessibilityInfo.addEventListener('grayscaleChanged', (enabled) => {
        setSettings(prev => ({ ...prev, isGrayscaleEnabled: enabled }));
      }),
      AccessibilityInfo.addEventListener('invertColorsChanged', (enabled) => {
        setSettings(prev => ({ ...prev, isInvertColorsEnabled: enabled }));
      }),
    ];

    // Listen for dimension changes
    const dimensionSubscription = Dimensions.addEventListener('change', ({ window }) => {
      setSettings(prev => ({ ...prev, windowDimensions: window }));
    });

    return () => {
      subscriptions.forEach(sub => sub?.remove());
      dimensionSubscription?.remove();
    };
  }, []);

  // Utility functions
  const announceForAccessibility = (message: string) => {
    AccessibilityInfo.announceForAccessibility(message);
  };

  const setAccessibilityFocus = (reactTag: number) => {
    AccessibilityInfo.setAccessibilityFocus(reactTag);
  };

  const isAccessibilityServiceEnabled = () => {
    return settings.isScreenReaderEnabled;
  };

  const shouldReduceMotion = () => {
    return settings.isReduceMotionEnabled;
  };

  const shouldUseHighContrast = () => {
    return settings.isInvertColorsEnabled || settings.isGrayscaleEnabled;
  };

  const getAccessibleFontSize = (baseFontSize: number) => {
    return baseFontSize * Math.max(1, settings.fontScale);
  };

  const getAccessibleSpacing = (baseSpacing: number) => {
    return baseSpacing * Math.max(1, settings.fontScale * 0.5);
  };

  const getAccessibleTouchTarget = (baseSize: number) => {
    // Ensure minimum 44pt touch target as per accessibility guidelines
    const minSize = 44;
    return Math.max(minSize, baseSize * settings.fontScale);
  };

  const getSemanticDescription = (
    type: 'achievement' | 'prediction' | 'match' | 'league',
    data: any
  ) => {
    switch (type) {
      case 'achievement':
        return `Achievement: ${data.name}. ${data.description}. ${
          data.earned ? 'Unlocked' : 'Not yet unlocked'
        }.`;
      
      case 'prediction':
        return `Prediction for ${data.matchName}. Your prediction: ${data.prediction}. ${
          data.points ? `Earned ${data.points} points` : 'Result pending'
        }.`;
      
      case 'match':
        return `Match: ${data.homeTeam} versus ${data.awayTeam}. ${
          data.score ? `Final score: ${data.score}` : `Kick off: ${data.kickoff}`
        }.`;
      
      case 'league':
        return `League: ${data.name}. ${data.memberCount} members. ${
          data.isAdmin ? 'You are an admin' : 'You are a member'
        }.`;
      
      default:
        return '';
    }
  };

  return {
    settings,
    
    // Actions
    announceForAccessibility,
    setAccessibilityFocus,
    
    // Utilities
    isAccessibilityServiceEnabled,
    shouldReduceMotion,
    shouldUseHighContrast,
    getAccessibleFontSize,
    getAccessibleSpacing,
    getAccessibleTouchTarget,
    getSemanticDescription,
    
    // Computed values
    isLargeText: settings.fontScale > 1.2,
    isExtraLargeText: settings.fontScale > 1.5,
    shouldShowVisualIndicators: !settings.isScreenReaderEnabled,
    shouldUseSimpleAnimations: settings.isReduceMotionEnabled || settings.prefersCrossFadeTransitions,
  };
};