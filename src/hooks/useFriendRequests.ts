// src/hooks/useFriendRequests.ts - Hook for tracking friend requests
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/constants';
import { useAuthStore } from '../store/authStore';
import { chatService } from '../services/ChatService';

export const useFriendRequests = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { token } = useAuthStore();

  const fetchFriendRequestsCount = async () => {
    try {
      setLoading(true);
      console.log('📊 Fetching friend requests count...');
      
      if (!token) {
        console.log('⚠️ No auth token available');
        setPendingCount(0);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/friends/requests/received`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch friend requests');
      }

      const data = await response.json();
      const requests = data.data?.requests || [];
      
      console.log('✅ Friend requests count:', requests.length);
      setPendingCount(requests.length);
    } catch (error) {
      console.error('❌ Error fetching friend requests count:', error);
      setPendingCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchFriendRequestsCount();
      
      // Set up real-time listeners for friend request updates
      const handleFriendRequestReceived = (data: any) => {
        console.log('👥 New friend request received');
        setPendingCount(prev => prev + 1);
      };

      const handleFriendRequestAccepted = (data: any) => {
        console.log('✅ Friend request accepted');
        setPendingCount(prev => Math.max(0, prev - 1));
      };

      const handleFriendRequestRejected = (data: any) => {
        console.log('❌ Friend request rejected');
        setPendingCount(prev => Math.max(0, prev - 1));
      };

      // Listen to socket events
      chatService.on('friend_request_received', handleFriendRequestReceived);
      chatService.on('friend_request_accepted', handleFriendRequestAccepted);
      chatService.on('friend_request_rejected', handleFriendRequestRejected);
      
      // Cleanup listeners
      return () => {
        chatService.off('friend_request_received', handleFriendRequestReceived);
        chatService.off('friend_request_accepted', handleFriendRequestAccepted);
        chatService.off('friend_request_rejected', handleFriendRequestRejected);
      };
    }
  }, [token]);

  return { pendingCount, loading, refetch: fetchFriendRequestsCount };
};