import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './api';
import logger from './LoggingService';

export interface BlockedUser {
  id: string;
  userId: string;
  blockedUserId: string;
  blockedUserName: string;
  blockedUserPhoto?: string;
  blockedAt: string;
  reason?: string;
}

export interface ReportData {
  reportedUserId: string;
  reason: 'spam' | 'harassment' | 'inappropriate_content' | 'fake_profile' | 'other';
  description: string;
  evidence?: {
    messageId?: string;
    screenshot?: string;
  };
}

class BlockingService {
  private readonly BLOCKED_USERS_KEY = 'blocked_users';
  private blockedUsers: Set<string> = new Set();

  async initialize(): Promise<void> {
    try {
      await this.loadBlockedUsers();
      logger.info('Blocking service initialized');
    } catch (error) {
      logger.error('Failed to initialize blocking service:', error);
    }
  }

  private async loadBlockedUsers(): Promise<void> {
    try {
      // Load from local cache first
      const cachedBlocked = await AsyncStorage.getItem(this.BLOCKED_USERS_KEY);
      if (cachedBlocked) {
        const blocked: string[] = JSON.parse(cachedBlocked);
        this.blockedUsers = new Set(blocked);
      }

      // Sync with server
      const response = await apiService.get('/safety/blocked');
      if (response.success && response.data.blockedUsers) {
        const serverBlocked = response.data.blockedUsers.map((b: BlockedUser) => b.blockedUserId);
        this.blockedUsers = new Set(serverBlocked);
        
        // Update local cache
        await AsyncStorage.setItem(this.BLOCKED_USERS_KEY, JSON.stringify(serverBlocked));
      }
    } catch (error) {
      logger.error('Failed to load blocked users:', error);
    }
  }

  async blockUser(userId: string, userName: string, reason?: string): Promise<boolean> {
    try {
      const response = await apiService.post('/safety/block', {
        userId,
        reason
      });

      if (response.success) {
        // Update local cache
        this.blockedUsers.add(userId);
        const blocked = Array.from(this.blockedUsers);
        await AsyncStorage.setItem(this.BLOCKED_USERS_KEY, JSON.stringify(blocked));
        
        logger.info('User blocked successfully', { userId, userName });
        return true;
      } else {
        throw new Error(response.message || 'Failed to block user');
      }
    } catch (error) {
      logger.error('Failed to block user:', error);
      throw error;
    }
  }

  async unblockUser(userId: string): Promise<boolean> {
    try {
      const response = await apiService.delete(`/safety/block/${userId}`);

      if (response.success) {
        // Update local cache
        this.blockedUsers.delete(userId);
        const blocked = Array.from(this.blockedUsers);
        await AsyncStorage.setItem(this.BLOCKED_USERS_KEY, JSON.stringify(blocked));
        
        logger.info('User unblocked successfully', { userId });
        return true;
      } else {
        throw new Error(response.message || 'Failed to unblock user');
      }
    } catch (error) {
      logger.error('Failed to unblock user:', error);
      throw error;
    }
  }

  async reportUser(reportData: ReportData): Promise<boolean> {
    try {
      const response = await apiService.post('/safety/report', reportData);

      if (response.success) {
        logger.info('User reported successfully', { 
          reportedUserId: reportData.reportedUserId,
          reason: reportData.reason 
        });
        return true;
      } else {
        throw new Error(response.message || 'Failed to report user');
      }
    } catch (error) {
      logger.error('Failed to report user:', error);
      throw error;
    }
  }

  async getBlockedUsers(): Promise<BlockedUser[]> {
    try {
      const response = await apiService.get('/safety/blocked');
      if (response.success) {
        return response.data.blockedUsers || [];
      } else {
        throw new Error(response.message || 'Failed to get blocked users');
      }
    } catch (error) {
      logger.error('Failed to get blocked users:', error);
      return [];
    }
  }

  isUserBlocked(userId: string): boolean {
    return this.blockedUsers.has(userId);
  }

  // Filter out blocked users from lists
  filterBlockedUsers<T extends { _id?: string; id?: string; userId?: string }>(users: T[]): T[] {
    return users.filter(user => {
      const id = user._id || user.id || user.userId;
      return id && !this.isUserBlocked(id);
    });
  }

  // Get blocked user count
  getBlockedUserCount(): number {
    return this.blockedUsers.size;
  }

  // Clear all local data (for logout)
  async clearLocalData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.BLOCKED_USERS_KEY);
      this.blockedUsers.clear();
      logger.info('Blocking service local data cleared');
    } catch (error) {
      logger.error('Failed to clear blocking service data:', error);
    }
  }
}

export const blockingService = new BlockingService();
export default blockingService;