// src/services/notifications/PushNotifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { API_BASE_URL } from '../../config/constants';
import { useAuthStore } from '../../store/authStore';

// Configure how notifications should behave
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class PushNotificationService {
  private notificationListener: any = null;
  private responseListener: any = null;
  private pushToken: string | null = null;

  /**
   * Initialize push notifications
   */
  async initialize() {
    try {
      // Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('L Push notification permission denied');
        return false;
      }

      // Get push token
      const token = await this.registerForPushNotifications();
      if (token) {
        this.pushToken = token;
        console.log(' Push token obtained:', token);
        
        // Send token to backend
        await this.sendTokenToBackend(token);
        
        // Set up listeners
        this.setupListeners();
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return false;
    }
  }

  /**
   * Request notification permissions
   */
  private async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('� Push notifications only work on physical devices');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('L Failed to get push notification permissions');
      return false;
    }

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('messages', {
        name: 'Messages',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#fcd3aa',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
      });

      await Notifications.setNotificationChannelAsync('friendRequests', {
        name: 'Friend Requests',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250],
        lightColor: '#0091ad',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
      });

      await Notifications.setNotificationChannelAsync('matches', {
        name: 'New Matches',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 500],
        lightColor: '#ff6b6b',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
      });
    }

    return true;
  }

  /**
   * Register for push notifications and get token
   */
  private async registerForPushNotifications(): Promise<string | null> {
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
      
      if (!projectId) {
        console.log('� No EAS project ID found for push notifications');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: projectId
      });

      return token.data;
    } catch (error: any) {
      // Silently handle in development - EAS project ID is required for push tokens
      if (__DEV__ || error?.message?.includes('Project ID')) {
        // Expected in development, don't log
        return null;
      }
      console.error('Error getting push token:', error);
      return null;
    }
  }

  /**
   * Send push token to backend
   */
  private async sendTokenToBackend(token: string) {
    try {
      const authToken = useAuthStore.getState().token;
      if (!authToken) {
        console.log('� No auth token available to send push token');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/users/push-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ 
          pushToken: token,
          platform: Platform.OS,
          deviceType: Device.deviceType,
        }),
      });

      if (response.ok) {
        console.log(' Push token sent to backend');
      } else {
        console.error('Failed to send push token to backend');
      }
    } catch (error) {
      console.error('Error sending push token to backend:', error);
    }
  }

  /**
   * Set up notification listeners
   */
  private setupListeners() {
    // Listener for notifications received while app is in foreground
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('=� Notification received in foreground:', notification);
      
      const { title, body, data } = notification.request.content;
      
      // Handle different notification types
      if (data?.type === 'new_message') {
        this.handleNewMessageNotification(data);
      } else if (data?.type === 'friend_request') {
        this.handleFriendRequestNotification(data);
      } else if (data?.type === 'new_match') {
        this.handleNewMatchNotification(data);
      }
    });

    // Listener for when user interacts with notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('=F User tapped notification:', response);
      
      const { data } = response.notification.request.content;
      
      // Navigate based on notification type
      if (data?.type === 'new_message' && data.chatId) {
        this.navigateToChat(data.chatId, data.userId);
      } else if (data?.type === 'friend_request') {
        this.navigateToFriendRequests();
      } else if (data?.type === 'new_match' && data.matchId) {
        this.navigateToMatch(data.matchId);
      }
    });
  }

  /**
   * Handle new message notification
   */
  private handleNewMessageNotification(data: any) {
    // You can update UI elements, badges, etc.
    console.log('=� New message from:', data.senderName);
  }

  /**
   * Handle friend request notification
   */
  private handleFriendRequestNotification(data: any) {
    // Update friend request badge/counter
    console.log('=e New friend request from:', data.requesterName);
  }

  /**
   * Handle new match notification
   */
  private handleNewMatchNotification(data: any) {
    // Update matches UI
    console.log('<� New match with:', data.matchName);
  }

  /**
   * Navigation helpers (these would need access to navigation prop)
   */
  private navigateToChat(chatId: string, userId: string) {
    // This would need to be implemented with your navigation system
    console.log('Navigate to chat:', chatId);
  }

  private navigateToFriendRequests() {
    console.log('Navigate to friend requests');
  }

  private navigateToMatch(matchId: string) {
    console.log('Navigate to match:', matchId);
  }

  /**
   * Schedule a local notification (for testing or local reminders)
   */
  async scheduleLocalNotification(title: string, body: string, data?: any, seconds: number = 1) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
        badge: 1,
      },
      trigger: {
        seconds,
      },
    });
  }

  /**
   * Send instant notification for new message
   */
  async sendMessageNotification(senderName: string, message: string, chatId: string, senderId: string) {
    await this.scheduleLocalNotification(
      'Yo! =�',
      `${senderName}: ${message}`,
      {
        type: 'new_message',
        chatId,
        userId: senderId,
        senderName,
      },
      0
    );
  }

  /**
   * Send friend request notification
   */
  async sendFriendRequestNotification(requesterName: string, requesterId: string) {
    await this.scheduleLocalNotification(
      'New Friend Request! =e',
      `${requesterName} wants to connect with you`,
      {
        type: 'friend_request',
        requesterId,
        requesterName,
      },
      0
    );
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications() {
    await Notifications.dismissAllNotificationsAsync();
  }

  /**
   * Clear specific notification
   */
  async clearNotification(identifier: string) {
    await Notifications.dismissNotificationAsync(identifier);
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number) {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Clean up listeners
   */
  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  /**
   * Get push token
   */
  getPushToken(): string | null {
    return this.pushToken;
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;