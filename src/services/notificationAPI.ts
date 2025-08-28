// src/services/notificationAPI.ts - Notification API Service

import { API_BASE_URL } from '../config/constants';

export interface Notification {
  id: string;
  notification_type: 'match' | 'message' | 'system' | 'welcome' | 'achievement' | 'reminder';
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  action_url?: string;
  read_at?: string;
  created_at: string;
}

export interface NotificationPreferences {
  matches: boolean;
  messages: boolean;
  system: boolean;
  email: boolean;
  push: boolean;
}

export interface GetNotificationsResponse {
  notifications: Notification[];
  unread_count: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class NotificationAPI {
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const token = await this.getAuthToken();
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }
    
    return data;
  }

  private async getAuthToken(): Promise<string> {
    // Get token from auth store (zustand persist uses AsyncStorage internally)
    const { useAuthStore } = require('../store/authStore');
    const token = useAuthStore.getState().token;
    return token || '';
  }

  // Get notifications with pagination and filters
  async getNotifications(page = 1, limit = 20, type?: string, unreadOnly = false): Promise<GetNotificationsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (type) params.append('type', type);
    if (unreadOnly) params.append('unread_only', 'true');

    const response = await this.makeRequest(`/notifications?${params}`);
    return response.data;
  }

  // Get unread notification count
  async getUnreadCount(): Promise<number> {
    const response = await this.makeRequest('/notifications/unread-count');
    return response.data.unread_count;
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    await this.makeRequest(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    await this.makeRequest('/notifications/mark-all-read', {
      method: 'PUT',
    });
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    await this.makeRequest(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  }

  // Get system messages
  async getSystemMessages(): Promise<any[]> {
    const response = await this.makeRequest('/notifications/system-messages');
    return response.data.messages;
  }

  // Get notification preferences
  async getPreferences(): Promise<NotificationPreferences> {
    const response = await this.makeRequest('/notifications/preferences');
    return response.data.preferences;
  }

  // Update notification preferences
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const response = await this.makeRequest('/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify({ preferences }),
    });
    return response.data.preferences;
  }

  // Create test notification (development only)
  async createTestNotification(type = 'system', title?: string, message?: string): Promise<void> {
    await this.makeRequest('/notifications/test', {
      method: 'POST',
      body: JSON.stringify({ type, title, message }),
    });
  }
}

export const notificationAPI = new NotificationAPI();