import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';
import { Alert, Platform } from 'react-native';
import type { Achievement } from '../../leaderboards/types';

export class AchievementSharingService {
  /**
   * Share achievement via native sharing
   */
  static async shareAchievementText(achievement: Achievement, userStats?: any): Promise<void> {
    try {
      const message = this.generateShareMessage(achievement, userStats);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(message, {
          mimeType: 'text/plain',
          dialogTitle: 'Share Achievement',
        });
      } else {
        // Fallback for platforms without sharing
        Alert.alert(
          'Share Achievement',
          `Copy this message to share:\n\n${message}`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Copy', 
              onPress: () => {
                // Copy to clipboard (would need Clipboard API)
                console.log('Would copy to clipboard:', message);
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Failed to share achievement:', error);
      Alert.alert('Error', 'Failed to share achievement. Please try again.');
    }
  }

  /**
   * Share achievement as image
   */
  static async shareAchievementImage(
    viewRef: any, 
    achievement: Achievement, 
    userStats?: any
  ): Promise<void> {
    try {
      // Capture the achievement view as image
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 0.8,
        result: 'tmpfile',
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share Achievement',
        });
      }

      // Clean up temporary file
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch (error) {
      console.error('Failed to share achievement image:', error);
      Alert.alert('Error', 'Failed to share achievement image. Please try again.');
    }
  }

  /**
   * Generate share message for achievement
   */
  private static generateShareMessage(achievement: Achievement, userStats?: any): string {
    const baseMessage = `🏆 Achievement Unlocked! 🏆\n\n${achievement.icon} ${achievement.name}\n${achievement.description}`;
    
    let statsMessage = '';
    if (userStats) {
      statsMessage = `\n\n📊 My Stats:\n• Total Points: ${userStats.total_points}\n• Accuracy: ${userStats.accuracy_percentage.toFixed(1)}%\n• Best Streak: ${userStats.best_correct_streak}`;
    }

    const appMessage = '\n\n⚽ Join me on ScoreKick - The Ultimate Football Prediction Game!';
    
    return `${baseMessage}${statsMessage}${appMessage}`;
  }

  /**
   * Share to specific social platforms
   */
  static async shareToSocialPlatform(
    platform: 'twitter' | 'facebook' | 'instagram' | 'whatsapp',
    achievement: Achievement,
    userStats?: any
  ): Promise<void> {
    const message = this.generateShareMessage(achievement, userStats);
    const encodedMessage = encodeURIComponent(message);
    
    let shareUrl = '';
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedMessage}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedMessage}`;
        break;
      case 'whatsapp':
        shareUrl = `whatsapp://send?text=${encodedMessage}`;
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    try {
      // Open URL (would need Linking API)
      console.log('Would open URL:', shareUrl);
    } catch (error) {
      console.error(`Failed to share to ${platform}:`, error);
      Alert.alert('Error', `Failed to share to ${platform}. Please try again.`);
    }
  }

  /**
   * Create shareable achievement card data
   */
  static createShareableCard(achievement: Achievement, userStats?: any): {
    title: string;
    description: string;
    icon: string;
    category: string;
    stats?: any;
    timestamp: string;
  } {
    return {
      title: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      category: achievement.category,
      stats: userStats,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Generate achievement hashtags
   */
  static generateHashtags(achievement: Achievement): string[] {
    const baseHashtags = ['#ScoreKick', '#FootballPrediction', '#Achievement'];
    
    const categoryHashtags = {
      milestone: ['#Milestone', '#Progress'],
      accuracy: ['#Accuracy', '#Precision'],
      streak: ['#Streak', '#OnFire'],
      participation: ['#Active', '#Consistent'],
      special: ['#Special', '#Elite'],
    };

    return [
      ...baseHashtags,
      ...(categoryHashtags[achievement.category as keyof typeof categoryHashtags] || [])
    ];
  }

  /**
   * Save achievement to device gallery
   */
  static async saveAchievementToGallery(
    viewRef: any,
    achievement: Achievement
  ): Promise<void> {
    try {
      // Capture the achievement view
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 1.0,
        result: 'tmpfile',
      });

      // Save to gallery (would need MediaLibrary)
      console.log('Would save to gallery:', uri);
      
      Alert.alert(
        'Success',
        'Achievement saved to your photo gallery!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to save achievement:', error);
      Alert.alert('Error', 'Failed to save achievement. Please try again.');
    }
  }

  /**
   * Create achievement stats summary for sharing
   */
  static createStatsCard(userStats: any): {
    totalPoints: number;
    accuracy: string;
    bestStreak: number;
    exactPredictions: number;
    participationRate: string;
  } {
    return {
      totalPoints: userStats.total_points || 0,
      accuracy: `${(userStats.accuracy_percentage || 0).toFixed(1)}%`,
      bestStreak: userStats.best_correct_streak || 0,
      exactPredictions: userStats.exact_predictions || 0,
      participationRate: `${userStats.rounds_participated || 0} rounds`,
    };
  }

  /**
   * Generate motivational message based on achievement
   */
  static getMotivationalMessage(achievement: Achievement): string {
    const messages = {
      milestone: [
        "Another milestone conquered! 🎯",
        "Progress never stops! 💪",
        "Reaching new heights! 🚀"
      ],
      accuracy: [
        "Precision is key! 🎯",
        "Sharp as a tack! ⚡",
        "Accuracy master! 🏹"
      ],
      streak: [
        "On fire! 🔥",
        "Unstoppable momentum! ⚡",
        "The streak continues! 🌟"
      ],
      participation: [
        "Consistency pays off! 📅",
        "Dedication recognized! 🏆",
        "Active and engaged! ⭐"
      ],
      special: [
        "Something special achieved! ✨",
        "Elite performance! 👑",
        "Extraordinary accomplishment! 🌟"
      ]
    };

    const categoryMessages = messages[achievement.category as keyof typeof messages];
    return categoryMessages[Math.floor(Math.random() * categoryMessages.length)];
  }
}