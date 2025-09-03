// src/services/MongoUserService.ts - MongoDB-based user service
import { API_BASE_URL } from '../config/constants';
import { useAuthStore } from '../store/authStore';
import { User } from '../types';

export class MongoUserService {
  private static getAuthHeaders() {
    const { token } = useAuthStore.getState();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Get current user profile
  static async getCurrentUser(): Promise<User | null> {
    try {
      console.log('📤 MongoUserService: Getting current user...');
      
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Get user error:', response.status, errorText);
        throw new Error(`Failed to get user: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Current user retrieved:', result.data);
      
      return result.data?.user || null;
    } catch (error) {
      console.error('❌ Error getting current user:', error);
      return null;
    }
  }

  // Update user profile
  static async updateUserProfile(updates: Partial<User>): Promise<User | null> {
    try {
      console.log('📤 MongoUserService: Updating user profile...');
      
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Update user error:', response.status, errorText);
        throw new Error(`Failed to update user: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ User profile updated:', result.data);
      
      return result.data?.user || null;
    } catch (error) {
      console.error('❌ Error updating user profile:', error);
      return null;
    }
  }

  // Update online status
  static async updateOnlineStatus(isOnline: boolean): Promise<boolean> {
    try {
      console.log('📤 MongoUserService: Updating online status:', isOnline);
      
      const response = await fetch(`${API_BASE_URL}/users/online-status`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ isOnline }),
      });

      if (!response.ok) {
        console.error('❌ Update online status error:', response.status);
        return false;
      }

      console.log('✅ Online status updated');
      return true;
    } catch (error) {
      console.error('❌ Error updating online status:', error);
      return false;
    }
  }

  // Get user matches
  static async getUserMatches(type: 'family' | 'friend' = 'family', page: number = 1, limit: number = 10): Promise<User[]> {
    try {
      console.log(`📤 MongoUserService: Getting ${type} matches...`);
      
      const response = await fetch(`${API_BASE_URL}/matching/matches?type=${type}&page=${page}&limit=${limit}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Get matches error:', response.status, errorText);
        return [];
      }

      const result = await response.json();
      console.log(`✅ ${type} matches retrieved:`, result.data?.matches?.length || 0);
      
      return result.data?.matches || [];
    } catch (error) {
      console.error('❌ Error getting user matches:', error);
      return [];
    }
  }

  // Get user by ID
  static async getUserById(userId: string): Promise<User | null> {
    try {
      console.log('📤 MongoUserService: Getting user by ID:', userId);
      
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Get user by ID error:', response.status, errorText);
        return null;
      }

      const result = await response.json();
      console.log('✅ User retrieved by ID:', result.data);
      
      return result.data?.user || null;
    } catch (error) {
      console.error('❌ Error getting user by ID:', error);
      return null;
    }
  }

  // Search users
  static async searchUsers(query: string, type?: 'family' | 'friend'): Promise<User[]> {
    try {
      console.log('📤 MongoUserService: Searching users:', query);
      
      const params = new URLSearchParams({ q: query });
      if (type) params.append('type', type);
      
      const response = await fetch(`${API_BASE_URL}/users/search?${params.toString()}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Search users error:', response.status, errorText);
        return [];
      }

      const result = await response.json();
      console.log('✅ Users searched:', result.data?.users?.length || 0);
      
      return result.data?.users || [];
    } catch (error) {
      console.error('❌ Error searching users:', error);
      return [];
    }
  }

  // Delete user account
  static async deleteAccount(): Promise<boolean> {
    try {
      console.log('📤 MongoUserService: Deleting user account...');
      
      const response = await fetch(`${API_BASE_URL}/users/account`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        console.error('❌ Delete account error:', response.status);
        return false;
      }

      console.log('✅ User account deleted');
      return true;
    } catch (error) {
      console.error('❌ Error deleting account:', error);
      return false;
    }
  }
}