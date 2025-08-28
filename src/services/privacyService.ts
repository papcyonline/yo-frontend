import { API_BASE_URL } from '../config/constants';

export interface PrivacySettings {
  id?: string;
  user_id?: string;
  profile_visibility: 'public' | 'friends' | 'private';
  show_online_status: boolean;
  allow_friend_requests: boolean;
  show_last_seen: boolean;
  allow_message_requests: boolean;
  share_location: boolean;
  show_phone_number: boolean;
  show_email: boolean;
  allow_tagging: boolean;
  data_analytics: boolean;
  ad_personalization: boolean;
  created_at?: string;
  updated_at?: string;
}

class PrivacyService {
  private baseURL = `${API_BASE_URL}/settings`;

  async getPrivacySettings(token: string): Promise<PrivacySettings> {
    try {
      console.log('🔒 Making request to:', `${this.baseURL}/privacy`);
      
      const response = await fetch(`${this.baseURL}/privacy`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📡 Privacy settings response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📄 Privacy settings API Response:', data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to get privacy settings');
      }

      return data.data.privacySettings;
    } catch (error) {
      console.error('❌ Get privacy settings error:', error);
      throw error;
    }
  }

  async updatePrivacySettings(token: string, settings: Partial<PrivacySettings>): Promise<PrivacySettings> {
    try {
      const response = await fetch(`${this.baseURL}/privacy`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to update privacy settings');
      }

      return data.data.privacySettings;
    } catch (error) {
      console.error('Update privacy settings error:', error);
      throw error;
    }
  }

  async requestDataDownload(token: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/data-download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to request data download');
      }

      return data.data.downloadRequest;
    } catch (error) {
      console.error('Request data download error:', error);
      throw error;
    }
  }

  async deactivateAccount(token: string, reason: string, customReason?: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/deactivate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reason, customReason }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to deactivate account');
      }
    } catch (error) {
      console.error('Deactivate account error:', error);
      throw error;
    }
  }
}

export const privacyService = new PrivacyService();