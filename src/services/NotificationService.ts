// src/services/NotificationService.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../constants/api';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = API_CONFIG.BASE_URL;

// Helper function to get auth headers
const getAuthHeaders = () => {
  const { token } = useAuthStore.getState();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushNotificationToken {
  token: string;
  deviceId: string;
  platform: string;
  appVersion: string;
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: { [key: string]: any };
  sound?: boolean;
  badge?: number;
  channelId?: string;
}

export interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  trigger: {
    type: 'date' | 'timeInterval' | 'daily' | 'weekly';
    date?: Date;
    seconds?: number;
    hour?: number;
    minute?: number;
    weekday?: number;
  };
  data?: { [key: string]: any };
}

export class NotificationService {
  private static readonly STORAGE_KEY = 'push_notification_token';
  private static readonly SETTINGS_KEY = 'notification_settings';

  /**
   * Initialize push notifications
   */
  static async initialize(): Promise<string | null> {
    try {
      console.log('📱 Initializing push notifications...');

      // Check if device supports push notifications
      if (!Device.isDevice) {
        console.warn('⚠️ Push notifications only work on physical devices');
        return null;
      }

      // Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('⚠️ Push notification permission denied');
        return null;
      }

      // Get push token
      const token = await this.getPushToken();
      if (!token) {
        // Don't show error in development - push tokens require EAS configuration
        if (__DEV__) {
          console.log('📱 Push notifications not available in development');
        } else {
          console.warn('⚠️ Failed to get push token');
        }
        return null;
      }

      // Register token with backend
      await this.registerTokenWithBackend(token);

      // Set up notification listeners
      this.setupNotificationListeners();

      console.log('✅ Push notifications initialized successfully');
      return token;

    } catch (error) {
      // Silently fail in development since push notifications require EAS setup
      if (!__DEV__) {
        console.error('❌ Failed to initialize push notifications:', error);
      }
      return null;
    }
  }

  /**
   * Request notification permissions
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return false;
      }

      // For Android, set up notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#0091ad',
        });

        // Create specific channels for different notification types
        await Notifications.setNotificationChannelAsync('messages', {
          name: 'Messages',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#04a7c7',
        });

        await Notifications.setNotificationChannelAsync('matches', {
          name: 'New Matches',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250],
          lightColor: '#fcd3aa',
        });

        await Notifications.setNotificationChannelAsync('friend_requests', {
          name: 'Friend Requests',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#22c55e',
        });
      }

      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Get push notification token
   */
  static async getPushToken(): Promise<string | null> {
    try {
      // Check if we have a cached token
      const cachedToken = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (cachedToken) {
        const tokenData = JSON.parse(cachedToken);
        
        // Verify token is still valid (you might want to refresh periodically)
        const currentTime = Date.now();
        const tokenAge = currentTime - tokenData.timestamp;
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (tokenAge < maxAge) {
          return tokenData.token;
        }
      }

      // Get new token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      
      if (!projectId) {
        throw new Error('Project ID not found. Please configure your app.json/app.config.js');
      }

      const { data: token } = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      // Cache the token
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        token: token,
        timestamp: Date.now(),
        platform: Platform.OS,
        deviceId: Constants.deviceId || 'unknown'
      }));

      return token;
    } catch (error: any) {
      // Silently handle push token errors in development
      // Push tokens require EAS project configuration which isn't available in dev
      if (__DEV__) {
        // Don't log anything - this is expected in development
        return null;
      }
      
      // Only log errors in production if it's not about missing project ID
      if (!error?.message?.includes('Project ID')) {
        console.error('Error getting push token:', error);
      }
      return null;
    }
  }

  /**
   * Register token with backend
   */
  static async registerTokenWithBackend(token: string): Promise<void> {
    try {
      const deviceInfo: PushNotificationToken = {
        token: token,
        deviceId: Constants.deviceId || 'unknown',
        platform: Platform.OS,
        appVersion: Constants.expoConfig?.version || '1.0.0'
      };

      const response = await fetch(`${API_BASE_URL}/api/notifications/register-token`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(deviceInfo),
      });

      if (!response.ok) {
        throw new Error(`Failed to register token: ${response.status}`);
      }

      console.log('✅ Push token registered with backend');
    } catch (error) {
      console.error('❌ Failed to register token with backend:', error);
      // Don't throw - allow app to continue even if token registration fails
    }
  }

  /**
   * Set up notification listeners
   */
  static setupNotificationListeners(): void {
    // Handle notifications received while app is foregrounded
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('📱 Notification received:', notification);
      // You can customize behavior when notification is received
      // For example, update badge count or show in-app notification
    });

    // Handle notification interactions (tap/press)
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('📱 Notification response:', response);
      
      const { notification } = response;
      const data = notification.request.content.data;
      
      // Handle different notification types
      if (data?.type) {
        this.handleNotificationAction(data.type, data);
      }
    });
  }

  /**
   * Handle notification actions
   */
  static handleNotificationAction(type: string, data: any): void {
    // This would typically navigate to specific screens
    // You'll need to implement navigation logic based on your app structure
    console.log(`🔔 Handling notification action: ${type}`, data);
    
    switch (type) {
      case 'message':
        // Navigate to chat screen
        console.log('Navigate to chat:', data.chatId);
        break;
      case 'friend_request':
        // Navigate to friend requests
        console.log('Navigate to friend requests');
        break;
      case 'match':
        // Navigate to new match
        console.log('Navigate to match:', data.matchId);
        break;
      case 'family_connection':
        // Navigate to family tree
        console.log('Navigate to family connection:', data.connectionId);
        break;
      default:
        console.log('Unknown notification type:', type);
    }
  }

  /**
   * Send local notification
   */
  static async sendLocalNotification(payload: NotificationPayload): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: payload.title,
          body: payload.body,
          data: payload.data || {},
          sound: payload.sound !== false,
          badge: payload.badge,
        },
        trigger: null, // Send immediately
      });

      return notificationId;
    } catch (error) {
      console.error('Error sending local notification:', error);
      throw error;
    }
  }

  /**
   * Schedule a notification
   */
  static async scheduleNotification(notification: ScheduledNotification): Promise<string> {
    try {
      let trigger: any = null;

      switch (notification.trigger.type) {
        case 'date':
          if (!notification.trigger.date) {
            throw new Error('Date trigger requires a date');
          }
          trigger = { date: notification.trigger.date };
          break;
          
        case 'timeInterval':
          if (!notification.trigger.seconds) {
            throw new Error('Time interval trigger requires seconds');
          }
          trigger = { seconds: notification.trigger.seconds };
          break;
          
        case 'daily':
          if (notification.trigger.hour === undefined || notification.trigger.minute === undefined) {
            throw new Error('Daily trigger requires hour and minute');
          }
          trigger = {
            hour: notification.trigger.hour,
            minute: notification.trigger.minute,
            repeats: true,
          };
          break;
          
        case 'weekly':
          if (notification.trigger.weekday === undefined || 
              notification.trigger.hour === undefined || 
              notification.trigger.minute === undefined) {
            throw new Error('Weekly trigger requires weekday, hour and minute');
          }
          trigger = {
            weekday: notification.trigger.weekday,
            hour: notification.trigger.hour,
            minute: notification.trigger.minute,
            repeats: true,
          };
          break;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
        },
        trigger,
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  static async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error cancelling notification:', error);
      throw error;
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
      throw error;
    }
  }

  /**
   * Get scheduled notifications
   */
  static async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Get notification settings
   */
  static async getNotificationSettings(): Promise<{
    enabled: boolean;
    messages: boolean;
    matches: boolean;
    friendRequests: boolean;
    familyConnections: boolean;
    quietHours: { enabled: boolean; start: string; end: string };
  }> {
    try {
      const settings = await AsyncStorage.getItem(this.SETTINGS_KEY);
      if (settings) {
        return JSON.parse(settings);
      }

      // Default settings
      return {
        enabled: true,
        messages: true,
        matches: true,
        friendRequests: true,
        familyConnections: true,
        quietHours: { enabled: false, start: '22:00', end: '08:00' }
      };
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return {
        enabled: true,
        messages: true,
        matches: true,
        friendRequests: true,
        familyConnections: true,
        quietHours: { enabled: false, start: '22:00', end: '08:00' }
      };
    }
  }

  /**
   * Update notification settings
   */
  static async updateNotificationSettings(settings: {
    enabled?: boolean;
    messages?: boolean;
    matches?: boolean;
    friendRequests?: boolean;
    familyConnections?: boolean;
    quietHours?: { enabled: boolean; start: string; end: string };
  }): Promise<void> {
    try {
      const currentSettings = await this.getNotificationSettings();
      const updatedSettings = { ...currentSettings, ...settings };
      
      await AsyncStorage.setItem(this.SETTINGS_KEY, JSON.stringify(updatedSettings));
      
      // Sync with backend
      try {
        await this.syncSettingsWithBackend(updatedSettings);
      } catch (error) {
        console.warn('Failed to sync notification settings with backend:', error);
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  }

  /**
   * Sync settings with backend
   */
  private static async syncSettingsWithBackend(settings: any): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/notifications/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync settings: ${response.status}`);
    }
  }

  /**
   * Set badge count
   */
  static async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  /**
   * Clear badge count
   */
  static async clearBadgeCount(): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('Error clearing badge count:', error);
    }
  }

  /**
   * Check if quiet hours are active
   */
  static async isQuietHoursActive(): Promise<boolean> {
    try {
      const settings = await this.getNotificationSettings();
      
      if (!settings.quietHours.enabled) {
        return false;
      }

      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      
      const [startHour, startMinute] = settings.quietHours.start.split(':').map(Number);
      const [endHour, endMinute] = settings.quietHours.end.split(':').map(Number);
      
      const startTime = startHour * 60 + startMinute;
      const endTime = endHour * 60 + endMinute;
      
      if (startTime <= endTime) {
        // Same day
        return currentTime >= startTime && currentTime <= endTime;
      } else {
        // Crosses midnight
        return currentTime >= startTime || currentTime <= endTime;
      }
    } catch (error) {
      console.error('Error checking quiet hours:', error);
      return false;
    }
  }

  /**
   * Clean up - remove token and listeners
   */
  static async cleanup(): Promise<void> {
    try {
      // Remove cached token
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      
      // Cancel all scheduled notifications
      await this.cancelAllNotifications();
      
      // Unregister token from backend
      try {
        await fetch(`${API_BASE_URL}/api/notifications/unregister-token`, {
          method: 'POST',
          headers: getAuthHeaders(),
        });
      } catch (error) {
        console.warn('Failed to unregister token from backend:', error);
      }
      
      console.log('✅ Notification service cleaned up');
    } catch (error) {
      console.error('Error during notification cleanup:', error);
    }
  }
}