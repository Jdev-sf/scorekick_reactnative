import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  interpolate,
  runOnJS,
  useDerivedValue,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import { TYPOGRAPHY } from '../../constants/theme';

interface AnimatedScoreProps {
  score: number;
  previousScore?: number;
  maxScore?: number;
  animated?: boolean;
  size?: 'small' | 'medium' | 'large';
  showDifference?: boolean;
  onAnimationComplete?: () => void;
  color?: string;
  suffix?: string;
  prefix?: string;
}

export const AnimatedScore: React.FC<AnimatedScoreProps> = ({
  score,
  previousScore = 0,
  maxScore = 100,
  animated = true,
  size = 'medium',
  showDifference = true,
  onAnimationComplete,
  color,
  suffix = '',
  prefix = '',
}) => {
  const { colors } = useTheme();
  
  const animatedValue = useSharedValue(previousScore);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const differenceOpacity = useSharedValue(0);
  const differenceTranslateY = useSharedValue(20);

  const difference = score - previousScore;

  useEffect(() => {
    if (animated && score !== previousScore) {
      // Animate the score counting up/down
      animatedValue.value = withTiming(score, { 
        duration: 1000 
      }, (finished) => {
        if (finished && onAnimationComplete) {
          runOnJS(onAnimationComplete)();
        }
      });

      // Scale animation for emphasis
      scale.value = withSequence(
        withSpring(1.2, { damping: 8 }),
        withSpring(1, { damping: 12 })
      );

      // Show difference animation
      if (showDifference && difference !== 0) {
        differenceOpacity.value = withSequence(
          withDelay(200, withTiming(1, { duration: 300 })),
          withDelay(1500, withTiming(0, { duration: 300 }))
        );
        
        differenceTranslateY.value = withSequence(
          withDelay(200, withTiming(0, { duration: 300 })),
          withDelay(1500, withTiming(-20, { duration: 300 }))
        );
      }
    } else {
      animatedValue.value = score;
    }
  }, [score, previousScore, animated, difference, showDifference, onAnimationComplete]);

  // Animated text value
  const animatedText = useDerivedValue(() => {
    return Math.round(animatedValue.value);
  }, []);

  const scoreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }), []);

  const differenceStyle = useAnimatedStyle(() => ({
    opacity: differenceOpacity.value,
    transform: [{ translateY: differenceTranslateY.value }],
  }), []);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${interpolate(animatedValue.value, [0, maxScore || 100], [0, 100])}%`,
  }), [maxScore]);

  const sizeConfig = {
    small: {
      fontSize: TYPOGRAPHY.fontSizes.lg,
      progressHeight: 4,
    },
    medium: {
      fontSize: TYPOGRAPHY.fontSizes['2xl'],
      progressHeight: 6,
    },
    large: {
      fontSize: TYPOGRAPHY.fontSizes['4xl'],
      progressHeight: 8,
    },
  };

  const config = sizeConfig[size];
  const scoreColor = color || colors.primary;

  return (
    <View style={{ alignItems: 'center' }}>
      {/* Main Score */}
      <View style={{ position: 'relative', alignItems: 'center' }}>
        <Animated.View style={scoreStyle}>
          <Animated.Text
            style={{
              fontSize: config.fontSize,
              fontWeight: '700',
              color: scoreColor,
            }}
          >
            {prefix}
            {animatedText.value}
            {suffix}
          </Animated.Text>
        </Animated.View>

        {/* Difference Indicator */}
        {showDifference && difference !== 0 && (
          <Animated.View 
            style={[
              differenceStyle,
              {
                position: 'absolute',
                top: -25,
                right: -30,
              }
            ]}
          >
            <View 
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 20,
                backgroundColor: difference > 0 ? '#10b981' : '#ef4444'
              }}
            >
              <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                {difference > 0 ? '+' : ''}{difference}
              </Text>
            </View>
          </Animated.View>
        )}
      </View>

      {/* Progress Bar */}
      {maxScore && maxScore > 0 && (
        <View style={{ width: '100%', marginTop: 8 }}>
          <View 
            style={{ 
              backgroundColor: '#e5e7eb', 
              borderRadius: config.progressHeight / 2, 
              overflow: 'hidden',
              height: config.progressHeight 
            }}
          >
            <Animated.View
              style={[
                progressStyle,
                {
                  height: '100%',
                  backgroundColor: scoreColor,
                  borderRadius: config.progressHeight / 2,
                }
              ]}
            />
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
            <Text 
              style={{ 
                fontSize: 12,
                color: colors.textSecondary 
              }}
            >
              0
            </Text>
            <Text 
              style={{ 
                fontSize: 12,
                color: colors.textSecondary 
              }}
            >
              {maxScore}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};