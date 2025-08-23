import React from 'react';
import { View, Text, Modal, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence,
  withDelay,
  runOnJS,
  interpolate
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { COLORS, SPACING, TYPOGRAPHY } from '../../../constants/theme';
import type { Achievement } from '../../leaderboards/types';

interface AchievementUnlockModalProps {
  visible: boolean;
  achievement: Achievement | null;
  onClose: () => void;
  onShare?: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const AchievementUnlockModal: React.FC<AchievementUnlockModalProps> = ({
  visible,
  achievement,
  onClose,
  onShare,
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const iconScale = useSharedValue(0);
  const confettiScale = useSharedValue(0);
  const slideY = useSharedValue(50);

  React.useEffect(() => {
    if (visible && achievement) {
      // Reset values
      scale.value = 0;
      opacity.value = 0;
      iconScale.value = 0;
      confettiScale.value = 0;
      slideY.value = 50;

      // Start animation sequence
      opacity.value = withSpring(1, { damping: 15 });
      
      scale.value = withSequence(
        withDelay(200, withSpring(1.1, { damping: 8 })),
        withSpring(1, { damping: 12 })
      );
      
      slideY.value = withDelay(300, withSpring(0, { damping: 15 }));
      
      iconScale.value = withSequence(
        withDelay(500, withSpring(1.3, { damping: 8 })),
        withSpring(1, { damping: 12 })
      );
      
      confettiScale.value = withSequence(
        withDelay(600, withSpring(1, { damping: 8 })),
        withDelay(2000, withSpring(0, { damping: 15 }))
      );
    } else {
      scale.value = withSpring(0, { damping: 15 });
      opacity.value = withSpring(0, { damping: 15 });
    }
  }, [visible, achievement]);

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const confettiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: confettiScale.value }],
    opacity: interpolate(confettiScale.value, [0, 1], [0, 1]),
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

  if (!achievement) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }}>
        {/* Confetti Effect */}
        <Animated.View 
          style={[
            confettiStyle,
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none'
            }
          ]}
        >
          {[...Array(20)].map((_, i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                width: 8,
                height: 8,
                backgroundColor: '#FACC15',
                left: Math.random() * screenWidth,
                top: Math.random() * screenHeight,
                transform: [
                  { rotate: `${Math.random() * 360}deg` },
                  { rotateZ: '45deg' }
                ],
              }}
            />
          ))}
        </Animated.View>

        <Animated.View style={[
          modalStyle,
          {
            marginHorizontal: 32,
            maxWidth: 400,
            width: '100%'
          }
        ]}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 24,
            padding: 32,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
            alignItems: 'center'
          }}>
            {/* Success Header */}
            <Animated.View style={[contentStyle]}>
              <Text 
                style={{
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: '#111827',
                  marginBottom: 8,
                  fontSize: TYPOGRAPHY.fontSizes['2xl']
                }}
              >
                🎉 Achievement Unlocked! 🎉
              </Text>
            </Animated.View>

            {/* Achievement Icon */}
            <Animated.View style={[iconStyle, { marginVertical: 24 }]}>
              <View 
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: `${getCategoryColor(achievement.category)}20`,
                  borderWidth: 3,
                  borderColor: getCategoryColor(achievement.category),
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 4
                }}
              >
                <Text style={{ fontSize: 48 }}>{achievement.icon}</Text>
              </View>
            </Animated.View>

            {/* Achievement Details */}
            <Animated.View style={[
              contentStyle,
              { alignItems: 'center', marginBottom: 24 }
            ]}>
              <Text 
                style={{
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: '#111827',
                  marginBottom: 8,
                  fontSize: TYPOGRAPHY.fontSizes.xl
                }}
              >
                {achievement.name}
              </Text>
              
              <Text 
                style={{
                  textAlign: 'center',
                  color: '#6B7280',
                  marginBottom: 16,
                  fontSize: TYPOGRAPHY.fontSizes.base
                }}
              >
                {achievement.description}
              </Text>

              {/* Category Badge */}
              <View 
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 9999,
                  backgroundColor: `${getCategoryColor(achievement.category)}20`
                }}
              >
                <Text 
                  style={{
                    fontWeight: '600',
                    textTransform: 'capitalize',
                    color: getCategoryColor(achievement.category),
                    fontSize: TYPOGRAPHY.fontSizes.sm
                  }}
                >
                  {achievement.category} Achievement
                </Text>
              </View>
            </Animated.View>

            {/* Action Buttons */}
            <Animated.View style={[
              contentStyle,
              { width: '100%' }
            ]}>
              {onShare && (
                <TouchableOpacity
                  onPress={onShare}
                  style={{
                    width: '100%',
                    paddingVertical: 16,
                    borderRadius: 16,
                    alignItems: 'center',
                    backgroundColor: getCategoryColor(achievement.category),
                    marginBottom: 12
                  }}
                >
                  <Text 
                    style={{
                      fontWeight: '600',
                      color: '#FFFFFF',
                      fontSize: TYPOGRAPHY.fontSizes.base
                    }}
                  >
                    Share Achievement 🚀
                  </Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                onPress={onClose}
                style={{
                  width: '100%',
                  paddingVertical: 16,
                  borderRadius: 16,
                  alignItems: 'center',
                  backgroundColor: '#F3F4F6'
                }}
              >
                <Text 
                  style={{
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: TYPOGRAPHY.fontSizes.base
                  }}
                >
                  Continue
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};