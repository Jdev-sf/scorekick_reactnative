import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { NotificationService, NotificationData } from '../services/notificationService';
import { useAuth } from '../features/auth/hooks/useAuth';

/**
 * Hook for managing notification permissions and initialization
 */
export function useNotificationSetup() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const initializeNotifications = async () => {
      try {
        const success = await NotificationService.initialize();
        setIsInitialized(true);
        setHasPermission(NotificationService.isEnabled());
        setPushToken(NotificationService.getPushToken());
        
        console.log('[useNotifications] Initialized:', { success, hasPermission: NotificationService.isEnabled() });
      } catch (error) {
        console.error('[useNotifications] Initialization failed:', error);
        setIsInitialized(true);
        setHasPermission(false);
      }
    };

    initializeNotifications();
  }, [user]);

  return {
    isInitialized,
    hasPermission,
    pushToken,
    requestPermission: NotificationService.requestPermissions,
  };
}

/**
 * Hook for handling notification interactions
 */
export function useNotificationHandler() {
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription | undefined>();
  const responseListener = useRef<Notifications.Subscription | undefined>();

  useEffect(() => {
    // Listen for notifications while app is running
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('[useNotifications] Notification received:', notification);
      setNotification(notification);
    });

    // Listen for user interactions with notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('[useNotifications] Notification response:', response);
      
      const notificationData = response.notification.request.content.data;
      handleNotificationAction(notificationData);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const handleNotificationAction = (data: any) => {
    if (!data?.type) return;

    switch (data.type) {
      case 'prediction_deadline':
        // Navigate to match prediction screen
        console.log('[useNotifications] Navigating to prediction:', data.matchId);
        // TODO: Implement navigation
        break;
        
      case 'match_result':
        // Navigate to match details or leaderboard
        console.log('[useNotifications] Navigating to match result:', data);
        // TODO: Implement navigation
        break;
        
      case 'achievement':
        // Show achievement details
        console.log('[useNotifications] Show achievement:', data.achievementName);
        // TODO: Implement achievement display
        break;
        
      case 'league_invite':
        // Navigate to join league screen
        console.log('[useNotifications] Join league:', data.inviteCode);
        // TODO: Implement league join navigation
        break;
        
      case 'leaderboard_update':
        // Navigate to leaderboard
        console.log('[useNotifications] Show leaderboard:', data.leagueName);
        // TODO: Implement leaderboard navigation
        break;
        
      default:
        console.log('[useNotifications] Unknown notification type:', data.type);
    }
  };

  return {
    lastNotification: notification,
    handleNotificationAction,
  };
}

/**
 * Hook for scheduling prediction deadline reminders
 */
export function usePredictionDeadlineReminders() {
  const scheduledReminders = useRef<Map<string, string>>(new Map());

  const scheduleReminder = async (
    matchId: string,
    homeTeam: string,
    awayTeam: string,
    matchDate: Date,
    leagueNames: string[]
  ) => {
    try {
      // Cancel existing reminder for this match
      const existingId = scheduledReminders.current.get(matchId);
      if (existingId) {
        await NotificationService.cancelNotification(existingId);
      }

      // Schedule new reminder
      const notificationId = await NotificationService.schedulePredictionDeadlineReminder(
        matchId,
        homeTeam,
        awayTeam,
        matchDate,
        leagueNames
      );

      if (notificationId) {
        scheduledReminders.current.set(matchId, notificationId);
        console.log('[usePredictionDeadlineReminders] Scheduled reminder for match:', matchId);
      }
    } catch (error) {
      console.error('[usePredictionDeadlineReminders] Failed to schedule reminder:', error);
    }
  };

  const cancelReminder = async (matchId: string) => {
    try {
      const notificationId = scheduledReminders.current.get(matchId);
      if (notificationId) {
        await NotificationService.cancelNotification(notificationId);
        scheduledReminders.current.delete(matchId);
        console.log('[usePredictionDeadlineReminders] Cancelled reminder for match:', matchId);
      }
    } catch (error) {
      console.error('[usePredictionDeadlineReminders] Failed to cancel reminder:', error);
    }
  };

  const cancelAllReminders = async () => {
    try {
      for (const [matchId, notificationId] of scheduledReminders.current) {
        await NotificationService.cancelNotification(notificationId);
      }
      scheduledReminders.current.clear();
      console.log('[usePredictionDeadlineReminders] Cancelled all reminders');
    } catch (error) {
      console.error('[usePredictionDeadlineReminders] Failed to cancel all reminders:', error);
    }
  };

  return {
    scheduleReminder,
    cancelReminder,
    cancelAllReminders,
  };
}

/**
 * Hook for achievement notifications
 */
export function useAchievementNotifications() {
  const showAchievementNotification = async (
    achievementName: string,
    achievementDescription: string,
    achievementIcon: string
  ) => {
    try {
      await NotificationService.sendAchievementNotification(
        achievementName,
        achievementDescription,
        achievementIcon
      );
      console.log('[useAchievementNotifications] Achievement notification sent:', achievementName);
    } catch (error) {
      console.error('[useAchievementNotifications] Failed to send achievement notification:', error);
    }
  };

  return {
    showAchievementNotification,
  };
}

/**
 * Hook for match result notifications
 */
export function useMatchResultNotifications() {
  const sendMatchResultNotification = async (
    homeTeam: string,
    awayTeam: string,
    homeScore: number,
    awayScore: number,
    userPoints: number
  ) => {
    try {
      await NotificationService.sendMatchResultNotification(
        homeTeam,
        awayTeam,
        homeScore,
        awayScore,
        userPoints
      );
      console.log('[useMatchResultNotifications] Match result notification sent');
    } catch (error) {
      console.error('[useMatchResultNotifications] Failed to send match result notification:', error);
    }
  };

  return {
    sendMatchResultNotification,
  };
}

/**
 * Hook for comprehensive notification management
 */
export function useNotificationManager() {
  const setup = useNotificationSetup();
  const handler = useNotificationHandler();
  const deadlineReminders = usePredictionDeadlineReminders();
  const achievements = useAchievementNotifications();
  const matchResults = useMatchResultNotifications();

  const scheduleNotification = async (notification: NotificationData) => {
    try {
      return await NotificationService.scheduleNotification(notification);
    } catch (error) {
      console.error('[useNotificationManager] Failed to schedule notification:', error);
      return null;
    }
  };

  const getScheduledNotifications = async () => {
    try {
      return await NotificationService.getScheduledNotifications();
    } catch (error) {
      console.error('[useNotificationManager] Failed to get scheduled notifications:', error);
      return [];
    }
  };

  return {
    // Setup
    ...setup,
    
    // Handler
    ...handler,
    
    // Specific notification types
    ...deadlineReminders,
    ...achievements,
    ...matchResults,
    
    // General utilities
    scheduleNotification,
    getScheduledNotifications,
    cancelAllNotifications: NotificationService.cancelAllNotifications,
  };
}