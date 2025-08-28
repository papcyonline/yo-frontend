// src/hooks/useUnreadChats.ts - Hook for getting unread chats count with real-time updates
import { useState, useEffect } from 'react';
import { chatService } from '../services/ChatService';

export const useUnreadChats = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = async () => {
    try {
      setLoading(true);
      console.log('📊 Fetching unread chats count...');
      
      const response = await chatService.getChats();
      const chats = response.chats;
      
      // Calculate total unread count from all chats
      let count = 0;
      chats.forEach(chat => {
        count += chat.unreadCount || 0;
      });
      
      console.log('✅ Unread chats count:', count);
      setUnreadCount(count);
    } catch (error) {
      console.error('❌ Error fetching unread count:', error);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchUnreadCount();
    
    // Set up real-time listeners for immediate updates
    const handleNewMessage = (data: { message: any; chat: any }) => {
      console.log('📨 New message received, updating unread count');
      // Refresh count when new messages arrive
      fetchUnreadCount();
    };

    const handleChatUpdated = (data: { chatId: string; updatedAt: Date; unreadCounts: Array<{ userId: string; unreadCount: number }> }) => {
      console.log('💬 Chat updated, refreshing unread count');
      // Refresh count when chat is updated (messages read, etc.)
      fetchUnreadCount();
    };

    const handleMessageRead = (data: { messageId: string; chatId: string; readBy: string; readAt: Date }) => {
      console.log('👀 Message read, updating unread count');
      // Refresh count when messages are marked as read
      fetchUnreadCount();
    };

    const handleUnreadCountUpdate = (data: { chatId: string; unreadCount: number; totalUnreadCount: number }) => {
      console.log('📊 Unread count update received:', data);
      // If we have a total unread count, use it directly for immediate update
      if (data.totalUnreadCount !== undefined) {
        // Get current total by fetching all chats' unread counts
        fetchUnreadCount();
      }
    };

    // Listen to real-time events
    chatService.on('new_message', handleNewMessage);
    chatService.on('chat_updated', handleChatUpdated);
    chatService.on('message_read', handleMessageRead);
    chatService.on('unread_count_update', handleUnreadCountUpdate);
    
    // Cleanup listeners on unmount
    return () => {
      chatService.off('new_message', handleNewMessage);
      chatService.off('chat_updated', handleChatUpdated);
      chatService.off('message_read', handleMessageRead);
      chatService.off('unread_count_update', handleUnreadCountUpdate);
    };
  }, []);

  return { unreadCount, loading, refetch: fetchUnreadCount };
};