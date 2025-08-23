import React, { useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import ViewShot from 'react-native-view-shot';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence 
} from 'react-native-reanimated';
import { AchievementSharingService } from '../services/achievementSharingService';
import { COLORS, SPACING, TYPOGRAPHY } from '../../../constants/theme';
import type { Achievement } from '../../leaderboards/types';

interface AchievementShareModalProps {
  visible: boolean;
  achievement: Achievement | null;
  userStats?: any;
  onClose: () => void;
}

export const AchievementShareModal: React.FC<AchievementShareModalProps> = ({
  visible,
  achievement,
  userStats,
  onClose,
}) => {
  const viewShotRef = useRef<ViewShot>(null);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 15 });
      opacity.value = withSpring(1, { damping: 15 });
    } else {
      scale.value = withSpring(0, { damping: 15 });
      opacity.value = withSpring(0, { damping: 15 });
    }
  }, [visible]);

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
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

  const handleShareText = async () => {
    if (achievement) {
      await AchievementSharingService.shareAchievementText(achievement, userStats);
    }
  };

  const handleShareImage = async () => {
    if (achievement && viewShotRef.current) {
      await AchievementSharingService.shareAchievementImage(
        viewShotRef.current,
        achievement,
        userStats
      );
    }
  };

  const handleSaveToGallery = async () => {
    if (achievement && viewShotRef.current) {
      await AchievementSharingService.saveAchievementToGallery(
        viewShotRef.current,
        achievement
      );
    }
  };

  const handleSocialShare = async (platform: 'twitter' | 'facebook' | 'whatsapp') => {
    if (achievement) {
      await AchievementSharingService.shareToSocialPlatform(
        platform,
        achievement,
        userStats
      );
    }
  };

  if (!achievement) return null;

  const motivationalMessage = AchievementSharingService.getMotivationalMessage(achievement);
  const hashtags = AchievementSharingService.generateHashtags(achievement);
  const statsCard = userStats ? AchievementSharingService.createStatsCard(userStats) : null;

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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingHorizontal: 16
      }}>
        <Animated.View style={[modalStyle, { width: '100%', maxWidth: 400 }]}>
          <ScrollView style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
            maxHeight: '80%'
          }}>
            {/* Shareable Achievement Card */}
            <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }}>
              <View style={{
                backgroundColor: '#3B82F6',
                padding: 24,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24
              }}>
                <View style={{ alignItems: 'center' }}>
                  {/* Header */}
                  <Text style={{
                    color: '#FFFFFF',
                    fontWeight: 'bold',
                    fontSize: 20,
                    marginBottom: 8
                  }}>
                    🏆 Achievement Unlocked! 🏆
                  </Text>
                  
                  {/* Achievement Icon */}
                  <View style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)'
                  }}>
                    <Text style={{ fontSize: 32 }}>{achievement.icon}</Text>
                  </View>
                  
                  {/* Achievement Details */}
                  <Text style={{
                    color: '#FFFFFF',
                    fontWeight: 'bold',
                    fontSize: 24,
                    textAlign: 'center',
                    marginBottom: 8
                  }}>
                    {achievement.name}
                  </Text>
                  
                  <Text style={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    textAlign: 'center',
                    marginBottom: 16
                  }}>
                    {achievement.description}
                  </Text>
                  
                  {/* Motivational Message */}
                  <View style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    marginBottom: 16
                  }}>
                    <Text style={{
                      color: '#FFFFFF',
                      fontWeight: '500',
                      textAlign: 'center'
                    }}>
                      {motivationalMessage}
                    </Text>
                  </View>
                  
                  {/* Stats Card */}
                  {statsCard && (
                    <View style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: 12,
                      padding: 16,
                      width: '100%'
                    }}>
                      <Text style={{
                        color: '#FFFFFF',
                        fontWeight: '600',
                        textAlign: 'center',
                        marginBottom: 12
                      }}>
                        📊 My Stats
                      </Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <View style={{ alignItems: 'center', flex: 1 }}>
                          <Text style={{
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: 12
                          }}>Points</Text>
                          <Text style={{
                            color: '#FFFFFF',
                            fontWeight: 'bold'
                          }}>
                            {statsCard.totalPoints}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'center', flex: 1 }}>
                          <Text style={{
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: 12
                          }}>Accuracy</Text>
                          <Text style={{
                            color: '#FFFFFF',
                            fontWeight: 'bold'
                          }}>
                            {statsCard.accuracy}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'center', flex: 1 }}>
                          <Text style={{
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: 12
                          }}>Streak</Text>
                          <Text style={{
                            color: '#FFFFFF',
                            fontWeight: 'bold'
                          }}>
                            {statsCard.bestStreak}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                  
                  {/* App Branding */}
                  <View style={{ marginTop: 16 }}>
                    <Text style={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      textAlign: 'center',
                      fontSize: 14
                    }}>
                      ⚽ ScoreKick - Football Predictions
                    </Text>
                  </View>
                </View>
              </View>
            </ViewShot>

            {/* Share Options */}
            <View style={{ padding: 24 }}>
              <Text 
                style={{
                  fontWeight: 'bold',
                  color: '#111827',
                  textAlign: 'center',
                  marginBottom: 16,
                  fontSize: TYPOGRAPHY.fontSizes.lg
                }}
              >
                Share Your Achievement
              </Text>

              {/* Primary Share Actions */}
              <View style={{ marginBottom: 24 }}>
                <TouchableOpacity
                  onPress={handleShareText}
                  style={{
                    backgroundColor: '#3B82F6',
                    paddingVertical: 16,
                    borderRadius: 16,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    marginBottom: 12
                  }}
                >
                  <Text style={{ fontSize: 18, marginRight: 8 }}>📱</Text>
                  <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Share Text</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleShareImage}
                  style={{
                    backgroundColor: '#8B5CF6',
                    paddingVertical: 16,
                    borderRadius: 16,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    marginBottom: 12
                  }}
                >
                  <Text style={{ fontSize: 18, marginRight: 8 }}>📸</Text>
                  <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Share Image</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSaveToGallery}
                  style={{
                    backgroundColor: '#10B981',
                    paddingVertical: 16,
                    borderRadius: 16,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center'
                  }}
                >
                  <Text style={{ fontSize: 18, marginRight: 8 }}>💾</Text>
                  <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Save to Gallery</Text>
                </TouchableOpacity>
              </View>

              {/* Social Platform Quick Share */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: 12,
                  textAlign: 'center'
                }}>
                  Quick Share To:
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                  <TouchableOpacity
                    onPress={() => handleSocialShare('twitter')}
                    style={{ alignItems: 'center', padding: 12 }}
                  >
                    <View style={{
                      width: 48,
                      height: 48,
                      backgroundColor: '#60A5FA',
                      borderRadius: 24,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 8
                    }}>
                      <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>𝕏</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: '#6B7280' }}>Twitter</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleSocialShare('facebook')}
                    style={{ alignItems: 'center', padding: 12 }}
                  >
                    <View style={{
                      width: 48,
                      height: 48,
                      backgroundColor: '#2563EB',
                      borderRadius: 24,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 8
                    }}>
                      <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>f</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: '#6B7280' }}>Facebook</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleSocialShare('whatsapp')}
                    style={{ alignItems: 'center', padding: 12 }}
                  >
                    <View style={{
                      width: 48,
                      height: 48,
                      backgroundColor: '#10B981',
                      borderRadius: 24,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 8
                    }}>
                      <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>📱</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: '#6B7280' }}>WhatsApp</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Hashtags */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: 8
                }}>
                  Suggested hashtags:
                </Text>
                <Text style={{
                  color: '#3B82F6',
                  fontSize: 14
                }}>
                  {hashtags.join(' ')}
                </Text>
              </View>

              {/* Close Button */}
              <TouchableOpacity
                onPress={onClose}
                style={{
                  backgroundColor: '#F3F4F6',
                  paddingVertical: 16,
                  borderRadius: 16,
                  alignItems: 'center'
                }}
              >
                <Text style={{ fontWeight: '600', color: '#374151' }}>Close</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};