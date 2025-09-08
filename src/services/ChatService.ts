import io, { Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { API_BASE_URL } from '../config/constants';
import { apiService } from './api/index';
import ratingService from './RatingService';

export interface ChatMessage {
  _id: string;
  chatId: string;
  senderId: string | {
    _id: string;
    first_name: string;
    last_name: string;
    profile_photo_url?: string;
  };
  senderName: string;
  messageType: 'text' | 'image' | 'voice' | 'video' | 'document' | 'location';
  content: {
    text?: string;
    mediaUrl?: string;
    mediaFilename?: string;
    mediaSize?: number;
    mediaType?: string;
    thumbnailUrl?: string;
    duration?: number;
    location?: {
      latitude: number;
      longitude: number;
      address: string;
    };
  };
  status: 'sending' | 'sent' | 'delivered' | 'read';
  deliveredAt?: Date;
  readAt?: Date;
  isEdited: boolean;
  editedAt?: Date;
  replyTo?: ChatMessage;
  reactions: Array<{
    userId: string;
    emoji: string;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Chat {
  _id: string;
  chatType: 'direct' | 'group';
  otherParticipant?: {
    _id: string;
    name: string;
    email: string;
    isOnline: boolean;
  };
  lastMessage?: {
    messageId: string;
    text: string;
    senderId: string;
    messageType: string;
    timestamp: Date;
  };
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  lastSeenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TypingUser {
  chatId: string;
  typingUsers: string[];
}

class ChatService {
  public socket: Socket | null = null;
  private token: string | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private isConnecting: boolean = false;
  private isConnected: boolean = false;

  // Initialize socket connection
  connect(token: string) {
    // Prevent multiple simultaneous connections
    if (this.isConnecting || (this.isConnected && this.socket && this.token === token)) {
      console.log('💬 Already connected or connecting to chat service');
      return;
    }

    this.isConnecting = true;
    this.token = token;
    
    if (this.socket) {
      console.log('💬 Disconnecting existing socket...');
      this.socket.disconnect();
      this.isConnected = false;
    }

    console.log('💬 Connecting to chat service...');

    this.socket = io(API_BASE_URL.replace('/api', ''), {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      autoConnect: true
    });

    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Connected to chat service');
      this.isConnecting = false;
      this.isConnected = true;
      this.emit('connection_status', { connected: true });
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from chat service');
      this.isConnecting = false;
      this.isConnected = false;
      this.emit('connection_status', { connected: false });
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Chat connection error:', error);
      this.isConnecting = false;
      this.isConnected = false;
      this.emit('connection_error', error);
      
      // Retry connection after 5 seconds
      setTimeout(() => {
        if (!this.isConnected && this.token) {
          console.log('🔄 Retrying chat connection...');
          this.connect(this.token);
        }
      }, 5000);
    });

    // Chat events
    this.socket.on('new_message', (data: { message: ChatMessage; chat: any }) => {
      console.log('📥 New message received:', data.message);
      this.emit('new_message', data);
    });

    this.socket.on('message_delivered', (data: { messageId: string; chatId: string; deliveredAt: Date }) => {
      console.log('✅ Message delivered:', data.messageId);
      this.emit('message_delivered', data);
    });

    this.socket.on('message_read', (data: { messageId: string; chatId: string; readBy: string; readAt: Date }) => {
      console.log('👀 Message read:', data.messageId);
      this.emit('message_read', data);
    });

    this.socket.on('message_edited', (data: { messageId: string; chatId: string; newText: string; editedAt: Date }) => {
      console.log('✏️ Message edited:', data.messageId);
      this.emit('message_edited', data);
    });

    this.socket.on('message_deleted', (data: { messageId: string; chatId: string; deleteForEveryone: boolean; deletedBy: string; deletedAt: Date }) => {
      console.log('🗑️ Message deleted:', data.messageId);
      this.emit('message_deleted', data);
    });

    this.socket.on('typing_update', (data: TypingUser) => {
      this.emit('typing_update', data);
    });

    this.socket.on('user_status_update', (data: { userId: string; status: 'online' | 'offline'; lastSeen?: Date }) => {
      this.emit('user_status_update', data);
    });

    this.socket.on('chat_updated', (data: { chatId: string; updatedAt: Date; unreadCounts: Array<{ userId: string; unreadCount: number }> }) => {
      this.emit('chat_updated', data);
    });

    // Voice call events
    this.socket.on('voice_call_offer', (data) => {
      this.emit('voice_call_offer', data);
    });

    this.socket.on('voice_call_answer', (data) => {
      this.emit('voice_call_answer', data);
    });

    this.socket.on('voice_call_end', (data) => {
      this.emit('voice_call_end', data);
    });

    this.socket.on('ice_candidate', (data) => {
      this.emit('ice_candidate', data);
    });

    // Match update events for real-time updates
    this.socket.on('matches_updated', (data: { type: string; userId: string; matchCount: number; matches: any[]; timestamp: string }) => {
      console.log('🔄 Matches updated:', data.matchCount, 'matches');
      this.emit('matches_updated', data);
    });

    this.socket.on('high_matches_found', (data: { type: string; userId: string; matches: any[]; timestamp: string }) => {
      console.log('🌟 High confidence matches found:', data.matches.length);
      this.emit('high_matches_found', data);
    });
  }

  // Event listener management
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  off(event: string, callback?: Function) {
    if (!callback) {
      this.listeners.delete(event);
      return;
    }
    
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  // Chat operations
  async getChats(page: number = 1, limit: number = 20): Promise<{ chats: Chat[]; pagination: any }> {
    try {
      const api = await import('./api/index');
      const response = await api.apiService.get(`/chats?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error getting chats:', error);
      throw error;
    }
  }

  async createOrGetDirectChat(targetUserId: string): Promise<Chat> {
    try {
      const api = await import('./api/index');
      const response = await api.apiService.post('/chats/direct', { targetUserId });
      const result = response;

      // Join the chat room via socket
      if (this.socket) {
        this.socket.emit('join_chat', result.data.chat._id);
      }

      return result.data.chat;
    } catch (error) {
      console.error('❌ Error creating/getting chat:', error);
      throw error;
    }
  }

  async getChatMessages(chatId: string, page: number = 1, limit: number = 50): Promise<{ messages: ChatMessage[]; pagination: any }> {
    try {
      const response = await apiService.get(`/chats/${chatId}/messages?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error getting chat messages:', error);
      throw error;
    }
  }

  async sendTextMessage(chatId: string, text: string, replyTo?: string): Promise<ChatMessage> {
    try {
      const response = await apiService.post(`/chats/${chatId}/messages`, { text, replyTo });
      
      // Record significant event for rating system
      try {
        await ratingService.recordSignificantEvent('message_sent');
      } catch (ratingError) {
        console.log('Rating service error (non-critical):', ratingError);
      }
      
      return response.data.message;
    } catch (error) {
      console.error('❌ Error sending text message:', error);
      throw error;
    }
  }

  async sendMediaMessage(chatId: string, mediaFile: any, messageType: string, replyTo?: string, duration?: number): Promise<ChatMessage> {
    try {
      console.log('🎤 DEBUG: Sending media message:', { chatId, messageType, mediaFile });
      
      // Ensure we have a fresh token
      if (!this.token) {
        console.error('❌ No token available for media upload');
        throw new Error('Authentication required for media upload');
      }
      
      const formData = new FormData();
      
      // Ensure proper MIME type for React Native
      const audioType = mediaFile.type || 'audio/mp4'; // Use audio/mp4 for m4a files
      const fileName = mediaFile.name || 'voice.m4a';
      
      console.log('🎤 DEBUG: Appending file with type:', audioType, 'name:', fileName);
      
      formData.append('media', {
        uri: mediaFile.uri,
        type: audioType,
        name: fileName
      } as any);
      formData.append('messageType', messageType);
      if (replyTo) formData.append('replyTo', replyTo);
      if (duration) formData.append('duration', duration.toString());

      console.log('🎤 DEBUG: FormData created, making API call with token:', this.token?.substring(0, 10) + '...');

      // Use direct fetch for FormData uploads (apiService might not handle FormData well)
      const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages/media`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          // Don't set Content-Type for FormData - let the browser set it with boundary
        },
        body: formData
      });

      console.log('🎤 DEBUG: API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🎤 DEBUG: API error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('🎤 DEBUG: API response data:', result);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to send media message');
      }

      // Record significant event for rating system
      try {
        await ratingService.recordSignificantEvent('media_message_sent');
      } catch (ratingError) {
        console.log('Rating service error (non-critical):', ratingError);
      }

      return result.data.message;
    } catch (error) {
      console.error('❌ Error sending media message:', error);
      throw error;
    }
  }

  async markMessagesAsRead(chatId: string, messageIds?: string[]): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messageIds })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message);
      }

      // Also emit via socket for real-time updates
      this.markReadViaSocket(chatId, messageIds);
      
      console.log('✅ Messages marked as read via API and socket');
    } catch (error) {
      console.error('❌ Error marking messages as read:', error);
      throw error;
    }
  }

  async editMessage(messageId: string, newText: string): Promise<ChatMessage> {
    try {
      const api = await import('./api/index');
      const response = await api.apiService.put(`/chats/messages/${messageId}`, { text: newText });
      return response.data.message;
    } catch (error) {
      console.error('❌ Error editing message:', error);
      throw error;
    }
  }

  async deleteMessage(messageId: string, deleteForEveryone: boolean = false): Promise<void> {
    try {
      const api = await import('./api/index');
      await api.apiService.delete(`/chats/messages/${messageId}`, { deleteForEveryone });
    } catch (error) {
      console.error('❌ Error deleting message:', error);
      throw error;
    }
  }

  // Real-time features
  joinChat(chatId: string) {
    if (this.socket) {
      this.socket.emit('join_chat', chatId);
    }
  }

  sendTyping(chatId: string, isTyping: boolean) {
    if (this.socket) {
      this.socket.emit('typing', { chatId, isTyping });
    }
  }

  markReadViaSocket(chatId: string, messageIds?: string[]) {
    if (this.socket) {
      this.socket.emit('mark_read', { chatId, messageIds });
    }
  }

  // Voice call functions
  startVoiceCall(chatId: string, offer: any) {
    if (this.socket) {
      this.socket.emit('voice_call_offer', { chatId, offer });
    }
  }

  answerVoiceCall(chatId: string, answer: any) {
    if (this.socket) {
      this.socket.emit('voice_call_answer', { chatId, answer });
    }
  }

  endVoiceCall(chatId: string) {
    if (this.socket) {
      this.socket.emit('voice_call_end', { chatId });
    }
  }

  sendICECandidate(chatId: string, candidate: any) {
    if (this.socket) {
      this.socket.emit('ice_candidate', { chatId, candidate });
    }
  }

  // Utility functions
  formatMessageTime(date: Date | string): string {
    const messageDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays < 7) return messageDate.toLocaleDateString([], { weekday: 'short' });
    return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  disconnect() {
    if (this.socket) {
      console.log('💬 Disconnecting from chat service...');
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.isConnected = false;
    this.listeners.clear();
  }

  // Get connection status for debugging
  isSocketConnected(): boolean {
    const connected = this.socket?.connected || false;
    console.log('🔌 Socket connection status:', connected);
    return connected;
  }

  // Get detailed connection info for debugging
  getConnectionInfo() {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      socketConnected: this.socket?.connected || false,
      hasToken: !!this.token,
      socketId: this.socket?.id || null
    };
  }
}

// Create a singleton instance
export const chatService = new ChatService();

// Hook for easy integration with React components
export const useChat = () => {
  const { token } = useAuthStore();

  const connect = () => {
    if (token) {
      chatService.connect(token);
    }
  };

  const disconnect = () => {
    chatService.disconnect();
  };

  return {
    chatService,
    connect,
    disconnect
  };
};