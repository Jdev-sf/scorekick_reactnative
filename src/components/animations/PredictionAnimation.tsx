import React, { useEffect, useState } from 'react';
import { View, Text, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  interpolate,
  runOnJS,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import { useAccessibility } from '../../hooks/useAccessibility';
import { TYPOGRAPHY } from '../../constants/theme';

interface PredictionAnimationProps {
  prediction: {
    homeScore: number;
    awayScore: number;
  };
  actualResult?: {
    homeScore: number;
    awayScore: number;
  };
  points?: number;
  isCorrect?: boolean;
  onAnimationComplete?: () => void;
  showResult?: boolean;
}

export const PredictionAnimation: React.FC<PredictionAnimationProps> = ({
  prediction,
  actualResult,
  points = 0,
  isCorrect = false,
  onAnimationComplete,
  showResult = false,
}) => {
  const { colors } = useTheme();
  const { shouldReduceMotion, announceForAccessibility } = useAccessibility();
  const [animationPhase, setAnimationPhase] = useState<'prediction' | 'result' | 'points'>('prediction');

  // Animation values
  const predictionOpacity = useSharedValue(1);
  const predictionScale = useSharedValue(1);
  const resultOpacity = useSharedValue(0);
  const resultScale = useSharedValue(0.8);
  const resultTranslateY = useSharedValue(20);
  const pointsOpacity = useSharedValue(0);
  const pointsScale = useSharedValue(0.5);
  const pointsRotation = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (!showResult) return;

    const duration = shouldReduceMotion() ? 200 : 600;

    // Phase 1: Hide prediction with scale down
    predictionScale.value = withTiming(0.8, { duration: duration / 3 });
    predictionOpacity.value = withTiming(0.3, { duration: duration / 3 });

    // Phase 2: Show actual result
    setTimeout(() => {
      setAnimationPhase('result');
      
      resultOpacity.value = withSpring(1, { damping: 15 });
      resultScale.value = withSpring(1, { damping: 12 });
      resultTranslateY.value = withSpring(0, { damping: 15 });

      // Announce result for accessibility
      if (actualResult) {
        runOnJS(announceForAccessibility)(
          `Actual result: ${actualResult.homeScore} - ${actualResult.awayScore}. ${
            isCorrect ? `Correct! You earned ${points} points.` : 'Incorrect prediction.'
          }`
        );
      }
    }, duration / 2);

    // Phase 3: Show points with celebration
    setTimeout(() => {
      setAnimationPhase('points');
      
      if (isCorrect && points > 0) {
        // Celebration animation
        pointsOpacity.value = withSpring(1, { damping: 12 });
        pointsScale.value = withSequence(
          withSpring(1.3, { damping: 8 }),
          withSpring(1, { damping: 12 })
        );
        
        pointsRotation.value = withSequence(
          withSpring(10, { damping: 8 }),
          withSpring(0, { damping: 12 })
        );

        // Glow effect
        glowOpacity.value = withSequence(
          withSpring(1, { damping: 8 }),
          withSpring(0, { damping: 15 })
        );

        // Pulse effect
        if (!shouldReduceMotion()) {
          pulseScale.value = withRepeat(
            withSequence(
              withTiming(1.1, { duration: 500 }),
              withTiming(1, { duration: 500 })
            ),
            3,
            false
          );
        }
      } else {
        // Simple fade in for incorrect predictions
        pointsOpacity.value = withSpring(1, { damping: 15 });
        pointsScale.value = withSpring(1, { damping: 15 });
      }

      // Complete animation
      setTimeout(() => {
        if (onAnimationComplete) {
          runOnJS(onAnimationComplete)();
        }
      }, shouldReduceMotion() ? 500 : 2000);
    }, duration);
  }, [showResult, isCorrect, points, shouldReduceMotion]);

  const predictionStyle = useAnimatedStyle(() => ({
    opacity: predictionOpacity.value,
    transform: [{ scale: predictionScale.value }],
  }), []);

  const resultStyle = useAnimatedStyle(() => ({
    opacity: resultOpacity.value,
    transform: [
      { scale: resultScale.value },
      { translateY: resultTranslateY.value }
    ],
  }), []);

  const pointsStyle = useAnimatedStyle(() => ({
    opacity: pointsOpacity.value,
    transform: [
      { scale: pointsScale.value * pulseScale.value },
      { rotateZ: `${pointsRotation.value}deg` }
    ],
  }), []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }), []);

  return (
    <View style={{ alignItems: 'center', paddingVertical: 24 }}>
      {/* Prediction Display */}
      <Animated.View style={[predictionStyle, { marginBottom: 16 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text 
            style={{ 
              fontWeight: 'bold',
              textAlign: 'center',
              color: colors.textPrimary,
              fontSize: TYPOGRAPHY.fontSizes.xl
            }}
          >
            Your Prediction
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
          <View 
            style={{ 
              paddingHorizontal: 16, 
              paddingVertical: 8, 
              borderRadius: 12,
              backgroundColor: colors.surface 
            }}
          >
            <Text 
              style={{ 
                fontWeight: 'bold',
                textAlign: 'center',
                color: colors.primary,
                fontSize: TYPOGRAPHY.fontSizes['2xl']
              }}
            >
              {prediction.homeScore} - {prediction.awayScore}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Actual Result */}
      {showResult && actualResult && (
        <Animated.View style={[resultStyle, { marginBottom: 16 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text 
              style={{ 
                fontWeight: 'bold',
                textAlign: 'center',
                color: colors.textPrimary,
                fontSize: TYPOGRAPHY.fontSizes.xl
              }}
            >
              Actual Result
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
            <View 
              style={{ 
                paddingHorizontal: 16, 
                paddingVertical: 8, 
                borderRadius: 12, 
                borderWidth: 2,
                backgroundColor: isCorrect ? colors.success + '20' : colors.error + '20',
                borderColor: isCorrect ? colors.success : colors.error
              }}
            >
              <Text 
                style={{ 
                  fontWeight: 'bold',
                  textAlign: 'center',
                  color: isCorrect ? colors.success : colors.error,
                  fontSize: TYPOGRAPHY.fontSizes['2xl']
                }}
              >
                {actualResult.homeScore} - {actualResult.awayScore}
              </Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Points Display */}
      {showResult && (
        <Animated.View style={[pointsStyle, { position: 'relative' }]}>
          {/* Glow effect */}
          <Animated.View 
            style={[
              glowStyle,
              {
                position: 'absolute',
                inset: -10,
                borderRadius: 20,
                backgroundColor: isCorrect ? colors.success + '30' : colors.error + '30',
              }
            ]}
          />
          
          <View 
            style={{ 
              paddingHorizontal: 24, 
              paddingVertical: 12, 
              borderRadius: 16, 
              alignItems: 'center',
              backgroundColor: isCorrect ? colors.success : colors.error
            }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', marginBottom: 4 }}>
              {isCorrect ? '🎉 Correct!' : '❌ Incorrect'}
            </Text>
            <Text 
              style={{ 
                color: 'white', 
                fontWeight: 'bold',
                fontSize: TYPOGRAPHY.fontSizes.lg 
              }}
            >
              {isCorrect ? `+${points} points` : '0 points'}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Confetti Effect for Correct Predictions */}
      {showResult && isCorrect && !shouldReduceMotion() && (
        <ConfettiAnimation visible={animationPhase === 'points'} />
      )}
    </View>
  );
};

// Confetti component
const ConfettiAnimation: React.FC<{ visible: boolean }> = ({ visible }) => {
  const confettiPieces = Array.from({ length: 20 }, (_, i) => i);
  
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
      {confettiPieces.map((_, index) => (
        <ConfettiPiece key={index} delay={index * 50} visible={visible} />
      ))}
    </View>
  );
};

const ConfettiPiece: React.FC<{ delay: number; visible: boolean }> = ({ delay, visible }) => {
  const { width, height } = Dimensions.get('window');
  const translateX = useSharedValue(Math.random() * width);
  const translateY = useSharedValue(-50);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withSpring(1, { damping: 15 });
      translateY.value = withDelay(
        delay,
        withTiming(height + 100, { 
          duration: 2000,
          easing: Easing.out(Easing.quad)
        })
      );
      rotation.value = withDelay(
        delay,
        withRepeat(
          withTiming(360, { duration: 1000 }),
          -1,
          false
        )
      );
      
      setTimeout(() => {
        opacity.value = withTiming(0, { duration: 500 });
      }, 1500);
    }
  }, [visible, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotateZ: `${rotation.value}deg` }
    ],
    opacity: opacity.value,
  }), []);

  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
  const color = colors[Math.floor(Math.random() * colors.length)];

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          position: 'absolute',
          width: 8,
          height: 8,
          backgroundColor: color,
          borderRadius: 4,
        }
      ]}
    />
  );
};