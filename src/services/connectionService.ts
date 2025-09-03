// src/services/connectionService.ts
import { API_BASE_URL } from '../config/constants';
import { useAuthStore } from '../store/authStore';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const { token } = useAuthStore.getState();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  message?: string;
  createdAt: Date;
  updatedAt: Date;
  sender?: {
    id: string;
    name: string;
    fullName?: string;
    first_name?: string;
    last_name?: string;
    profile_photo_url?: string;
    location?: string;
  };
  receiver?: {
    id: string;
    name: string;
    fullName?: string;
    first_name?: string;
    last_name?: string;
    profile_photo_url?: string;
    location?: string;
  };
}

export interface Connection {
  id: string;
  user1Id: string;
  user2Id: string;
  connectionType: 'family' | 'friend';
  status: 'active' | 'blocked' | 'deleted';
  createdAt: Date;
  matchPercentage?: number;
  relationshipType?: string;
}

export class ConnectionService {
  /**
   * Send a friend request to another user
   */
  static async sendFriendRequest(
    targetUserId: string, 
    message?: string
  ): Promise<FriendRequest> {
    try {
      const response = await fetch(`${API_BASE_URL}/friends/request`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          recipientId: targetUserId,
          message: message || 'I would like to connect with you!'
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to send friend request');
      }

      return {
        id: result.data.requestId,
        senderId: result.data.recipient.id, // Reverse mapping as this is from sender's perspective
        receiverId: targetUserId,
        status: 'pending' as const,
        message: message || 'I would like to connect with you!',
        createdAt: new Date(),
        updatedAt: new Date(),
        receiver: {
          id: result.data.recipient.id,
          name: result.data.recipient.name,
          fullName: result.data.recipient.name
        }
      };
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  }

  /**
   * Accept a friend request
   */
  static async acceptFriendRequest(requestId: string): Promise<Connection> {
    try {
      const response = await fetch(`${API_BASE_URL}/friends/request/${requestId}/accept`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to accept friend request');
      }

      return {
        ...result.data,
        createdAt: new Date(result.data.createdAt)
      };
    } catch (error) {
      console.error('Error accepting friend request:', error);
      throw error;
    }
  }

  /**
   * Decline a friend request
   */
  static async declineFriendRequest(requestId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/friends/request/${requestId}/reject`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to decline friend request');
      }
    } catch (error) {
      console.error('Error declining friend request:', error);
      throw error;
    }
  }

  /**
   * Cancel a sent friend request
   */
  static async cancelFriendRequest(requestId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/friends/request/${requestId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to cancel friend request');
      }
    } catch (error) {
      console.error('Error cancelling friend request:', error);
      throw error;
    }
  }

  /**
   * Get all received friend requests
   */
  static async getReceivedFriendRequests(): Promise<FriendRequest[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/friends/requests/received`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to get friend requests');
      }

      return result.data.requests.map((request: any) => ({
        id: request.id,
        senderId: request.sender?.id,
        receiverId: request.recipient?.id,
        status: request.status,
        message: request.message,
        createdAt: new Date(request.sentAt),
        updatedAt: new Date(request.sentAt),
        sender: request.sender ? {
          id: request.sender.id,
          name: request.sender.fullName,
          fullName: request.sender.fullName,
          first_name: request.sender.firstName,
          last_name: request.sender.lastName,
          profile_photo_url: request.sender.profilePhotoUrl,
          location: request.sender.location
        } : undefined,
        receiver: request.recipient ? {
          id: request.recipient.id,
          name: request.recipient.fullName,
          fullName: request.recipient.fullName,
          first_name: request.recipient.firstName,
          last_name: request.recipient.lastName,
          profile_photo_url: request.recipient.profilePhotoUrl,
          location: request.recipient.location
        } : undefined
      }));
    } catch (error) {
      console.error('Error getting received friend requests:', error);
      throw error;
    }
  }

  /**
   * Get all sent friend requests
   */
  static async getSentFriendRequests(): Promise<FriendRequest[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/friends/requests/sent`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to get sent friend requests');
      }

      return result.data.requests.map((request: any) => ({
        id: request.id,
        senderId: request.sender?.id,
        receiverId: request.recipient?.id,
        status: request.status,
        message: request.message,
        createdAt: new Date(request.sentAt),
        updatedAt: new Date(request.sentAt),
        sender: request.sender ? {
          id: request.sender.id,
          name: request.sender.fullName,
          fullName: request.sender.fullName,
          first_name: request.sender.firstName,
          last_name: request.sender.lastName,
          profile_photo_url: request.sender.profilePhotoUrl,
          location: request.sender.location
        } : undefined,
        receiver: request.recipient ? {
          id: request.recipient.id,
          name: request.recipient.fullName,
          fullName: request.recipient.fullName,
          first_name: request.recipient.firstName,
          last_name: request.recipient.lastName,
          profile_photo_url: request.recipient.profilePhotoUrl,
          location: request.recipient.location
        } : undefined
      }));
    } catch (error) {
      console.error('Error getting sent friend requests:', error);
      throw error;
    }
  }

  /**
   * Get connection status with a specific user
   */
  static async getConnectionStatus(userId: string): Promise<{
    status: 'none' | 'pending_sent' | 'pending_received' | 'friends' | 'blocked';
    connection?: Connection;
    friendRequest?: FriendRequest;
  }> {
    try {
      // For now, we'll check sent and received requests to determine status
      // This is a simplified implementation until we have a dedicated status endpoint
      const [sentRequests, receivedRequests] = await Promise.all([
        this.getSentFriendRequests(),
        this.getReceivedFriendRequests()
      ]);

      // Check if there's a pending sent request to this user
      const sentRequest = sentRequests.find(req => req.receiverId === userId && req.status === 'pending');
      if (sentRequest) {
        return {
          status: 'pending_sent',
          friendRequest: sentRequest
        };
      }

      // Check if there's a pending received request from this user
      const receivedRequest = receivedRequests.find(req => req.senderId === userId && req.status === 'pending');
      if (receivedRequest) {
        return {
          status: 'pending_received',
          friendRequest: receivedRequest
        };
      }

      // For now, assume no connection if no pending requests
      // In a full implementation, we'd also check the friends list
      return {
        status: 'none'
      };
    } catch (error) {
      console.error('Error getting connection status:', error);
      // Return 'none' as fallback to allow the UI to show the connect button
      return {
        status: 'none'
      };
    }
  }

  /**
   * Get all user's connections (friends and family)
   */
  static async getConnections(type?: 'family' | 'friend'): Promise<Connection[]> {
    try {
      const url = type 
        ? `${API_BASE_URL}/api/connections?type=${type}`
        : `${API_BASE_URL}/api/connections`;

      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to get connections');
      }

      return result.data.map((connection: any) => ({
        ...connection,
        createdAt: new Date(connection.createdAt)
      }));
    } catch (error) {
      console.error('Error getting connections:', error);
      throw error;
    }
  }

  /**
   * Block a user
   */
  static async blockUser(userId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/connections/block/${userId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to block user');
      }
    } catch (error) {
      console.error('Error blocking user:', error);
      throw error;
    }
  }

  /**
   * Unblock a user
   */
  static async unblockUser(userId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/connections/unblock/${userId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to unblock user');
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
      throw error;
    }
  }

  /**
   * Remove a connection (unfriend)
   */
  static async removeConnection(connectionId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/connections/${connectionId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to remove connection');
      }
    } catch (error) {
      console.error('Error removing connection:', error);
      throw error;
    }
  }

  /**
   * Report a user
   */
  static async reportUser(
    userId: string, 
    reason: string, 
    description?: string
  ): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/connections/report`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          reportedUserId: userId,
          reason,
          description
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to report user');
      }
    } catch (error) {
      console.error('Error reporting user:', error);
      throw error;
    }
  }

  /**
   * Get mutual connections with another user
   */
  static async getMutualConnections(userId: string): Promise<Connection[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/connections/mutual/${userId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to get mutual connections');
      }

      return result.data.map((connection: any) => ({
        ...connection,
        createdAt: new Date(connection.createdAt)
      }));
    } catch (error) {
      console.error('Error getting mutual connections:', error);
      throw error;
    }
  }
}