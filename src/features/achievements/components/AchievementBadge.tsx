import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence,
  runOnJS
} from 'react-native-reanimated';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../../../constants/theme';
import type { Achievement, UserAchievement } from '../../leaderboards/types';

interface AchievementBadgeProps {
  achievement: Achievement;
  earned?: boolean;
  progress?: number;
  currentValue?: number;
  onPress?: () => void;
  showUnlockAnimation?: boolean;
  onAnimationComplete?: () => void;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  earned = false,
  progress = 0,
  currentValue = 0,
  onPress,
  showUnlockAnimation = false,
  onAnimationComplete,
}) => {
  const scale = useSharedValue(1);
  const rotateZ = useSharedValue(0);
  const opacity = useSharedValue(earned ? 1 : 0.6);
  const glowOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (showUnlockAnimation) {
      // Unlock animation sequence
      scale.value = withSequence(
        withSpring(1.3, { damping: 8 }),
        withSpring(1.1, { damping: 12 }),
        withSpring(1, { damping: 15 })
      );
      
      rotateZ.value = withSequence(
        withSpring(10, { damping: 8 }),
        withSpring(-5, { damping: 12 }),
        withSpring(0, { damping: 15 })
      );
      
      opacity.value = withSpring(1, { damping: 15 });
      
      glowOpacity.value = withSequence(
        withSpring(1, { damping: 8 }),
        withSpring(0, { damping: 15 }, (finished) => {
          if (finished && onAnimationComplete) {
            runOnJS(onAnimationComplete)();
          }
        })
      );
    }
  }, [showUnlockAnimation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotateZ: `${rotateZ.value}deg` }
    ],
    opacity: opacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'milestone': return COLORS.primary;
      case 'accuracy': return COLORS.success;
      case 'streak': return COLORS.warning;
      case 'participation': return COLORS.secondary;
      case 'special': return '#9C27B0';
      default: return COLORS.gray500;
    }
  };

  const getProgressText = () => {
    if (earned) return 'Unlocked!';
    if (achievement.condition_type === 'accuracy') {
      return `${currentValue.toFixed(1)}% / ${achievement.condition_value}%`;
    }
    return `${currentValue} / ${achievement.condition_value}`;
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View style={{ position: 'relative' }}>
        {/* Glow effect for unlock animation */}
        <Animated.View 
          style={[
            glowStyle,
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 16,
              backgroundColor: '#FACC15',
              opacity: 0.3,
              transform: [{ scale: 1.1 }]
            }
          ]}
        />
        
        <Animated.View 
          style={[
            animatedStyle,
            {
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 4,
              borderWidth: 2,
              borderColor: earned ? '#FACC15' : '#E5E7EB'
            }
          ]}
        >
          {/* Achievement Icon */}
          <View style={{ alignItems: 'center', marginBottom: 12 }}>
            <View 
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
                backgroundColor: earned ? `${getCategoryColor(achievement.category)}20` : '#F3F4F6'
              }}
            >
              <Text style={{ fontSize: 24 }}>{achievement.icon}</Text>
            </View>
            
            {/* Badge indicator */}
            {earned && (
              <View style={{
                position: 'absolute',
                top: -4,
                right: -4,
                width: 24,
                height: 24,
                backgroundColor: '#EAB308',
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' }}>✓</Text>
              </View>
            )}
          </View>

          {/* Achievement Name */}
          <Text 
            style={{
              textAlign: 'center',
              fontWeight: '600',
              marginBottom: 4,
              color: earned ? '#111827' : '#6B7280',
              fontSize: TYPOGRAPHY.fontSizes.sm
            }}
          >
            {achievement.name}
          </Text>

          {/* Achievement Description */}
          <Text 
            style={{
              textAlign: 'center',
              color: '#6B7280',
              marginBottom: 12,
              fontSize: TYPOGRAPHY.fontSizes.xs,
              lineHeight: 16
            }}
          >
            {achievement.description}
          </Text>

          {/* Progress Section */}
          {!earned && (
            <View style={{ marginBottom: 8 }}>
              {/* Progress Bar */}
              <View style={{
                backgroundColor: '#E5E7EB',
                borderRadius: 9999,
                height: 8,
                overflow: 'hidden',
                marginBottom: 8
              }}>
                <View 
                  style={{
                    height: '100%',
                    borderRadius: 9999,
                    width: `${Math.min(progress, 100)}%`,
                    backgroundColor: getCategoryColor(achievement.category)
                  }}
                />
              </View>
              
              {/* Progress Text */}
              <Text 
                style={{
                  textAlign: 'center',
                  color: '#6B7280',
                  fontSize: TYPOGRAPHY.fontSizes.xs
                }}
              >
                {getProgressText()}
              </Text>
            </View>
          )}

          {/* Earned Status */}
          {earned && (
            <View 
              style={{
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 9999,
                alignItems: 'center',
                backgroundColor: `${getCategoryColor(achievement.category)}20`
              }}
            >
              <Text 
                style={{
                  fontWeight: '500',
                  color: getCategoryColor(achievement.category),
                  fontSize: TYPOGRAPHY.fontSizes.xs
                }}
              >
                Unlocked!
              </Text>
            </View>
          )}

          {/* Category Badge */}
          <View style={{ position: 'absolute', top: 8, right: 8 }}>
            <View 
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 9999,
                backgroundColor: `${getCategoryColor(achievement.category)}20`
              }}
            >
              <Text 
                style={{
                  fontSize: 12,
                  fontWeight: '500',
                  textTransform: 'capitalize',
                  color: getCategoryColor(achievement.category)
                }}
              >
                {achievement.category}
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
};