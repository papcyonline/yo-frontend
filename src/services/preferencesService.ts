import { API_BASE_URL } from '../config/constants';

export interface UserPreferences {
  id?: string;
  user_id?: string;
  dark_mode?: boolean;
  notifications_enabled?: boolean;
  location_enabled?: boolean;
  language?: string;
  privacy_level?: 'public' | 'friends' | 'private';
  email_notifications?: boolean;
  push_notifications?: boolean;
  sms_notifications?: boolean;
  match_notifications?: boolean;
  community_notifications?: boolean;
  message_notifications?: boolean;
  created_at?: string;
  updated_at?: string;
}

class PreferencesService {
  private baseURL = `${API_BASE_URL}/settings`;

  async getPreferences(token: string): Promise<UserPreferences> {
    try {
      console.log('🔧 Making request to:', `${this.baseURL}/preferences`);
      
      const response = await fetch(`${this.baseURL}/preferences`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📡 Preferences response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📄 Preferences API Response:', data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to get preferences');
      }

      return data.data.preferences;
    } catch (error) {
      console.error('❌ Get preferences error:', error);
      throw error;
    }
  }

  async updatePreferences(token: string, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    try {
      console.log('🔧 Updating preferences:', preferences);
      
      const response = await fetch(`${this.baseURL}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(preferences),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to update preferences');
      }

      console.log('✅ Preferences updated:', data.data.preferences);
      return data.data.preferences;
    } catch (error) {
      console.error('❌ Update preferences error:', error);
      throw error;
    }
  }

  async resetPreferences(token: string): Promise<UserPreferences> {
    try {
      const response = await fetch(`${this.baseURL}/preferences/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to reset preferences');
      }

      return data.data.preferences;
    } catch (error) {
      console.error('Reset preferences error:', error);
      throw error;
    }
  }
}

export const preferencesService = new PreferencesService();