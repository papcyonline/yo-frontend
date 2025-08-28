import { API_BASE_URL } from '../config/constants';

export interface AccountDeletionData {
  password: string;
  reason: string;
  customReason?: string;
  downloadData?: boolean;
}

class AccountService {
  private baseURL = `${API_BASE_URL}/settings`;

  async deleteAccount(token: string, deletionData: AccountDeletionData): Promise<void> {
    try {
      console.log('🗑️ Making request to:', `${this.baseURL}/delete-account`);
      
      const response = await fetch(`${this.baseURL}/delete-account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(deletionData),
      });

      console.log('📡 Delete account response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📄 Delete account API Response:', data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to delete account');
      }
    } catch (error) {
      console.error('❌ Delete account error:', error);
      throw error;
    }
  }

  async requestDataDownload(token: string): Promise<any> {
    try {
      console.log('📥 Making request to:', `${this.baseURL}/data-download`);
      
      const response = await fetch(`${this.baseURL}/data-download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📡 Data download response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📄 Data download API Response:', data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to request data download');
      }

      return data.data.downloadRequest;
    } catch (error) {
      console.error('❌ Request data download error:', error);
      throw error;
    }
  }

  async deactivateAccount(token: string, reason: string, customReason?: string): Promise<void> {
    try {
      console.log('⏸️ Making request to:', `${this.baseURL}/deactivate`);
      
      const response = await fetch(`${this.baseURL}/deactivate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reason, customReason }),
      });

      console.log('📡 Deactivate account response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📄 Deactivate account API Response:', data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to deactivate account');
      }
    } catch (error) {
      console.error('❌ Deactivate account error:', error);
      throw error;
    }
  }
}

export const accountService = new AccountService();