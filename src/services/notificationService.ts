import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase/client';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  type: 'prediction_deadline' | 'match_result' | 'achievement' | 'league_invite' | 'leaderboard_update';
  title: string;
  body: string;
  data?: Record<string, any>;
  scheduleTime?: Date;
}

export interface PushToken {
  token: string;
  platform: 'ios' | 'android' | 'web';
}

export class NotificationService {
  private static expoPushToken: string | null = null;
  private static permissionGranted: boolean = false;

  /**
   * Initialize notification service and request permissions
   */
  static async initialize(): Promise<boolean> {
    console.log('[Notifications] Initializing...');

    try {
      // Request permissions
      const granted = await this.requestPermissions();
      if (!granted) {
        console.log('[Notifications] Permission denied');
        return false;
      }

      // Get push token
      const token = await this.registerForPushNotifications();
      if (token) {
        this.expoPushToken = token;
        // Save token to user profile
        await this.savePushTokenToProfile(token);
        console.log('[Notifications] Initialized successfully with token:', token.substring(0, 20) + '...');
        return true;
      }

      return false;
    } catch (error) {
      console.error('[Notifications] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Request notification permissions
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      if (!Device.isDevice) {
        console.log('[Notifications] Not a physical device, skipping permissions');
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[Notifications] Permission not granted');
        return false;
      }

      this.permissionGranted = true;
      return true;
    } catch (error) {
      console.error('[Notifications] Permission request failed:', error);
      return false;
    }
  }

  /**
   * Register for push notifications and get token
   */
  static async registerForPushNotifications(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.log('[Notifications] Not a physical device');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id', // You'll need to set this
      });

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return token.data;
    } catch (error) {
      console.error('[Notifications] Failed to get push token:', error);
      return null;
    }
  }

  /**
   * Save push token to user profile in database
   */
  private static async savePushTokenToProfile(token: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('users')
        .update({ 
          push_token: token,
          push_token_updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('[Notifications] Failed to save push token:', error);
      } else {
        console.log('[Notifications] Push token saved to profile');
      }
    } catch (error) {
      console.error('[Notifications] Error saving push token:', error);
    }
  }

  /**
   * Schedule a local notification
   */
  static async scheduleNotification(notification: NotificationData): Promise<string | null> {
    try {
      if (!this.permissionGranted) {
        console.log('[Notifications] No permission for notifications');
        return null;
      }

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: true,
        },
        trigger: notification.scheduleTime 
          ? { type: 'date' as const, date: notification.scheduleTime }
          : null,
      });

      console.log('[Notifications] Scheduled notification:', identifier);
      return identifier;
    } catch (error) {
      console.error('[Notifications] Failed to schedule notification:', error);
      return null;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  static async cancelNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
      console.log('[Notifications] Cancelled notification:', identifier);
    } catch (error) {
      console.error('[Notifications] Failed to cancel notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('[Notifications] Cancelled all notifications');
    } catch (error) {
      console.error('[Notifications] Failed to cancel all notifications:', error);
    }
  }

  /**
   * Schedule prediction deadline reminder
   */
  static async schedulePredictionDeadlineReminder(
    matchId: string,
    homeTeam: string,
    awayTeam: string,
    matchDate: Date,
    leagueNames: string[]
  ): Promise<string | null> {
    // Schedule 30 minutes before deadline (which is 15 minutes before match)
    const reminderTime = new Date(matchDate.getTime() - (45 * 60 * 1000));
    const now = new Date();

    if (reminderTime <= now) {
      console.log('[Notifications] Deadline reminder time has passed');
      return null;
    }

    const leagueText = leagueNames.length > 1 
      ? `${leagueNames.length} leagues`
      : leagueNames[0] || 'your league';

    return this.scheduleNotification({
      type: 'prediction_deadline',
      title: '⏰ Prediction Deadline Soon!',
      body: `15 minutes left to predict ${homeTeam} vs ${awayTeam} in ${leagueText}`,
      data: {
        matchId,
        homeTeam,
        awayTeam,
        leagueNames,
      },
      scheduleTime: reminderTime,
    });
  }

  /**
   * Send match result notification
   */
  static async sendMatchResultNotification(
    homeTeam: string,
    awayTeam: string,
    homeScore: number,
    awayScore: number,
    userPoints: number
  ): Promise<string | null> {
    const resultText = homeScore > awayScore 
      ? `${homeTeam} won ${homeScore}-${awayScore}`
      : homeScore < awayScore 
        ? `${awayTeam} won ${awayScore}-${homeScore}`
        : `Draw ${homeScore}-${awayScore}`;

    const pointsText = userPoints === 3 
      ? '🎯 Exact score! +3 points'
      : userPoints === 1 
        ? '✅ Correct result! +1 point'
        : '❌ 0 points';

    return this.scheduleNotification({
      type: 'match_result',
      title: `⚽ ${resultText}`,
      body: `Your prediction: ${pointsText}`,
      data: {
        homeTeam,
        awayTeam,
        homeScore,
        awayScore,
        userPoints,
      },
    });
  }

  /**
   * Send achievement notification
   */
  static async sendAchievementNotification(
    achievementName: string,
    achievementDescription: string,
    achievementIcon: string
  ): Promise<string | null> {
    return this.scheduleNotification({
      type: 'achievement',
      title: `🏆 Achievement Unlocked!`,
      body: `${achievementIcon} ${achievementName}: ${achievementDescription}`,
      data: {
        achievementName,
        achievementDescription,
        achievementIcon,
      },
    });
  }

  /**
   * Send league invitation notification
   */
  static async sendLeagueInviteNotification(
    leagueName: string,
    inviterName: string,
    inviteCode: string
  ): Promise<string | null> {
    return this.scheduleNotification({
      type: 'league_invite',
      title: '🎮 League Invitation',
      body: `${inviterName} invited you to join "${leagueName}". Code: ${inviteCode}`,
      data: {
        leagueName,
        inviterName,
        inviteCode,
      },
    });
  }

  /**
   * Send leaderboard update notification
   */
  static async sendLeaderboardUpdateNotification(
    leagueName: string,
    newPosition: number,
    previousPosition: number,
    totalMembers: number
  ): Promise<string | null> {
    const change = previousPosition - newPosition;
    const direction = change > 0 ? 'up' : 'down';
    const emoji = change > 0 ? '📈' : '📉';
    
    const message = change === 0 
      ? `You're holding steady at #${newPosition}`
      : `You moved ${direction} ${Math.abs(change)} position${Math.abs(change) > 1 ? 's' : ''} to #${newPosition}`;

    return this.scheduleNotification({
      type: 'leaderboard_update',
      title: `${emoji} ${leagueName} Leaderboard`,
      body: `${message} out of ${totalMembers} members`,
      data: {
        leagueName,
        newPosition,
        previousPosition,
        totalMembers,
        change,
      },
    });
  }

  /**
   * Get push token
   */
  static getPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Check if notifications are enabled
   */
  static isEnabled(): boolean {
    return this.permissionGranted;
  }

  /**
   * Get all scheduled notifications
   */
  static async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('[Notifications] Failed to get scheduled notifications:', error);
      return [];
    }
  }
}