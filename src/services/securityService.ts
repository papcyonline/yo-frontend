import { API_BASE_URL } from '../config/constants';

export interface SecuritySettings {
  id?: string;
  user_id?: string;
  two_factor_enabled: boolean;
  biometric_enabled: boolean;
  login_alerts: boolean;
  session_timeout: number;
  password_changed_at?: string;
  active_sessions_count?: number;
  account_locked?: boolean;
  failed_login_attempts?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ActiveSession {
  id: string;
  device_type: string;
  device_name: string;
  ip_address: string;
  location: string;
  login_at: string;
  last_activity: string;
  last_activity_ago: string;
  is_current: boolean;
  is_suspicious: boolean;
}

export interface LoginHistory {
  id: string;
  ip_address: string;
  location: string;
  device_info: string;
  login_at: string;
  logout_at?: string;
  login_method: string;
  is_suspicious: boolean;
  duration?: number;
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

  async getActiveSessions(token: string): Promise<ActiveSession[]> {
    try {
      console.log('📱 Getting active sessions');
      const response = await fetch(`${this.baseURL}/security/active-sessions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to get active sessions');
      }

      return data.data.sessions || [];
    } catch (error) {
      console.error('Get active sessions error:', error);
      throw error;
    }
  }

  async terminateSession(token: string, sessionId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/security/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to terminate session');
      }
    } catch (error) {
      console.error('Terminate session error:', error);
      throw error;
    }
  }

  async terminateOtherSessions(token: string): Promise<number> {
    try {
      const response = await fetch(`${this.baseURL}/security/sessions/terminate-others`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to terminate other sessions');
      }

      return data.data.terminatedSessions || 0;
    } catch (error) {
      console.error('Terminate other sessions error:', error);
      throw error;
    }
  }

  async getLoginHistory(token: string, limit: number = 50): Promise<LoginHistory[]> {
    try {
      console.log('📊 Getting login history');
      const response = await fetch(`${this.baseURL}/security/login-history?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to get login history');
      }

      return data.data.loginHistory || [];
    } catch (error) {
      console.error('Get login history error:', error);
      throw error;
    }
  }

  async getSecurityAnalysis(token: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/security/analysis`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to get security analysis');
      }

      return data.data.analysis;
    } catch (error) {
      console.error('Get security analysis error:', error);
      throw error;
    }
  }

  async getSecurityRecommendations(token: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/security/recommendations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to get security recommendations');
      }

      return data.data;
    } catch (error) {
      console.error('Get security recommendations error:', error);
      throw error;
    }
  }
}

export const securityService = new SecurityService();