import { API_BASE_URL } from '../config/constants';

export interface UserPreferences {
  id?: string;
  user_id?: string;
  dark_mode: boolean;
  notifications_enabled: boolean;
  location_enabled: boolean;
  language: string;
  privacy_level: 'public' | 'friends' | 'private';
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  match_notifications: boolean;
  community_notifications: boolean;
  message_notifications: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LegalContent {
  content: string;
  version: string;
  updated_at: string;
}

export interface AcceptanceStatus {
  terms_accepted: boolean;
  terms_accepted_at?: string;
  terms_version?: string;
  needs_terms_update: boolean;
  current_terms_version: string;
  privacy_policy_accepted: boolean;
  privacy_policy_accepted_at?: string;
  privacy_policy_version?: string;
  needs_privacy_update: boolean;
  current_privacy_version: string;
  requires_action: boolean;
}

class SettingsService {
  private baseURL = `${API_BASE_URL}/settings`;

  async getPreferences(token: string): Promise<UserPreferences> {
    try {
      console.log('🌐 Making request to:', `${this.baseURL}/preferences`);
      console.log('🔑 Using token:', token ? 'Token exists' : 'No token');
      
      const response = await fetch(`${this.baseURL}/preferences`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);

      if (!response.ok) {
        console.log('❌ Response not ok:', response.status, response.statusText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📄 Settings API Response:', data);

      if (!data.success) {
        console.log('API returned success=false:', data.message);
        throw new Error(data.message || 'Failed to get preferences');
      }

      if (!data.data || !data.data.preferences) {
        console.log('Missing preferences in response:', data);
        throw new Error('Invalid response format');
      }

      console.log('✅ Settings loaded successfully:', data.data.preferences);
      return data.data.preferences;
    } catch (error) {
      console.error('❌ Get preferences error details:', error);
      console.error('❌ Error type:', error.constructor.name);
      console.error('❌ Error message:', error.message);
      throw error;
    }
  }

  async updatePreferences(token: string, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    try {
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

      return data.data.preferences;
    } catch (error) {
      console.error('Update preferences error:', error);
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

  async getTermsOfService(): Promise<LegalContent> {
    try {
      const response = await fetch(`${this.baseURL}/terms-of-service`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to get terms of service');
      }

      return data.data;
    } catch (error) {
      console.error('Get terms of service error:', error);
      throw error;
    }
  }

  async getPrivacyPolicy(): Promise<LegalContent> {
    try {
      const response = await fetch(`${this.baseURL}/privacy-policy`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to get privacy policy');
      }

      return data.data;
    } catch (error) {
      console.error('Get privacy policy error:', error);
      throw error;
    }
  }

  async getAboutInfo(): Promise<LegalContent> {
    try {
      const response = await fetch(`${this.baseURL}/about`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to get about information');
      }

      return data.data;
    } catch (error) {
      console.error('Get about info error:', error);
      throw error;
    }
  }

  // Terms & Privacy Acceptance Methods

  async getAcceptanceStatus(token: string): Promise<AcceptanceStatus> {
    try {
      const response = await fetch(`${this.baseURL}/acceptance-status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to get acceptance status');
      }

      return data.data;
    } catch (error) {
      console.error('Get acceptance status error:', error);
      throw error;
    }
  }

  async acceptTermsOfService(token: string): Promise<{ terms_accepted: boolean; terms_accepted_at: string; terms_version: string }> {
    try {
      const response = await fetch(`${this.baseURL}/accept-terms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to accept terms of service');
      }

      return data.data;
    } catch (error) {
      console.error('Accept terms error:', error);
      throw error;
    }
  }

  async acceptPrivacyPolicy(token: string): Promise<{ privacy_policy_accepted: boolean; privacy_policy_accepted_at: string; privacy_policy_version: string }> {
    try {
      const response = await fetch(`${this.baseURL}/accept-privacy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to accept privacy policy');
      }

      return data.data;
    } catch (error) {
      console.error('Accept privacy policy error:', error);
      throw error;
    }
  }
}

export const settingsService = new SettingsService();