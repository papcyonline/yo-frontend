import { API_BASE_URL } from '../config/constants';

export interface SecuritySettings {
  id?: string;
  user_id?: string;
  two_factor_enabled: boolean;
  biometric_enabled: boolean;
  login_alerts: boolean;
  session_timeout: number;
  created_at?: string;
  updated_at?: string;
}

class SecurityService {
  private baseURL = `${API_BASE_URL}/settings`;

  async getSecuritySettings(token: string): Promise<SecuritySettings> {
    try {
      console.log('🔐 Making request to:', `${this.baseURL}/security`);
      
      const response = await fetch(`${this.baseURL}/security`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📡 Security settings response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📄 Security settings API Response:', data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to get security settings');
      }

      return data.data.securitySettings;
    } catch (error) {
      console.error('❌ Get security settings error:', error);
      throw error;
    }
  }

  async updateSecuritySettings(token: string, settings: Partial<SecuritySettings>): Promise<SecuritySettings> {
    try {
      const response = await fetch(`${this.baseURL}/security`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to update security settings');
      }

      return data.data.securitySettings;
    } catch (error) {
      console.error('Update security settings error:', error);
      throw error;
    }
  }

  async changePassword(token: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/security/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }
}

export const securityService = new SecurityService();