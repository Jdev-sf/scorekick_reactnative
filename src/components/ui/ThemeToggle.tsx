import React, { useLayoutEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolate,
  useAnimatedGestureHandler,
  runOnJS
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';

interface ThemeToggleProps {
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'switch' | 'button' | 'icon';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  showLabel = true,
  size = 'medium',
  variant = 'switch'
}) => {
  const { theme, isDark, toggleTheme, colors } = useTheme();
  const translateX = useSharedValue(0);

  useLayoutEffect(() => {
    translateX.value = isDark ? 1 : 0;
  }, []);

  useLayoutEffect(() => {
    translateX.value = withSpring(isDark ? 1 : 0, { damping: 15 });
  }, [isDark, translateX]);

  const sizes = {
    small: { width: 40, height: 20, knob: 16 },
    medium: { width: 50, height: 24, knob: 20 },
    large: { width: 60, height: 28, knob: 24 }
  };

  const currentSize = sizes[size];

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {},
    onActive: (event) => {
      const progress = Math.max(0, Math.min(1, event.translationX / (currentSize.width - currentSize.knob)));
      translateX.value = progress;
    },
    onEnd: () => {
      const shouldToggle = translateX.value > 0.5;
      translateX.value = withSpring(shouldToggle ? 1 : 0, { damping: 15 });
      if ((shouldToggle && !isDark) || (!shouldToggle && isDark)) {
        runOnJS(toggleTheme)();
      }
    }
  });

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolate(
      translateX.value,
      [0, 1],
      [colors.border, colors.primary],
      'RGB'
    ),
  }));

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{
      translateX: interpolate(
        translateX.value,
        [0, 1],
        [2, currentSize.width - currentSize.knob - 2]
      )
    }],
    backgroundColor: colors.background,
  }));

  const getThemeIcon = (currentTheme: string) => {
    switch (currentTheme) {
      case 'light': return '☀️';
      case 'dark': return '🌙';
      case 'system': return '⚙️';
      default: return '☀️';
    }
  };

  const getThemeLabel = (currentTheme: string) => {
    switch (currentTheme) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'System';
      default: return 'Light';
    }
  };

  if (variant === 'button') {
    return (
      <TouchableOpacity
        onPress={toggleTheme}
        style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, backgroundColor: colors.surface }}
      >
        <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: colors.primary + '20' }}>
          <Text style={{ fontSize: 18 }}>{getThemeIcon(theme)}</Text>
        </View>
        {showLabel && (
          <View style={{ flex: 1 }}>
            <Text 
              style={{ fontWeight: '600', color: colors.textPrimary }}
            >
              Theme
            </Text>
            <Text 
              style={{ fontSize: 14, color: colors.textSecondary }}
            >
              {getThemeLabel(theme)}
            </Text>
          </View>
        )}
        <View style={{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.border }}>
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>
            {theme === 'light' ? '>' : theme === 'dark' ? '⊕' : '?'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  if (variant === 'icon') {
    return (
      <TouchableOpacity
        onPress={toggleTheme}
        style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }}
      >
        <Text style={{ fontSize: 20 }}>{getThemeIcon(theme)}</Text>
      </TouchableOpacity>
    );
  }

  // Default switch variant
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {showLabel && (
        <Text 
          style={{ marginRight: 12, fontWeight: '500', color: colors.textPrimary }}
        >
          {getThemeLabel(theme)}
        </Text>
      )}
      
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View>
          <TouchableOpacity onPress={toggleTheme}>
            <Animated.View
              style={[
                trackStyle,
                {
                  width: currentSize.width,
                  height: currentSize.height,
                  borderRadius: currentSize.height / 2,
                  justifyContent: 'center',
                }
              ]}
            >
              <Animated.View
                style={[
                  knobStyle,
                  {
                    width: currentSize.knob,
                    height: currentSize.knob,
                    borderRadius: currentSize.knob / 2,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    elevation: 5,
                  }
                ]}
              />
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};