// src/hooks/useChat.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Message, 
  ChatUser, 
  createTextMessage, 
  createVoiceMessage, 
  createMediaMessage, 
  createAIMessage,
  updateMessageStatus,
  simulateMessageDelivery 
} from '../utils/chatHelpers';

interface UseChatProps {
  initialMessages?: Message[];
  currentUser?: ChatUser;
  targetUser?: ChatUser;
  onMessageSent?: (message: Message) => void;
  onMessageReceived?: (message: Message) => void;
}

export const useChat = ({
  initialMessages = [],
  currentUser,
  targetUser,
  onMessageSent,
  onMessageReceived
}: UseChatProps = {}) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const flatListRef = useRef<any>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback((animated: boolean = true) => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated });
    }, 100);
  }, []);

  // Send a text message
  const sendTextMessage = useCallback((text: string) => {
    if (!text.trim()) return;

    const message = createTextMessage(text, true);
    setMessages(prev => [...prev, message]);
    
    onMessageSent?.(message);
    scrollToBottom();
    
    // Simulate message delivery
    simulateMessageDelivery(message.id, (messageId, status) => {
      setMessages(prev => updateMessageStatus(prev, messageId, status));
    });
  }, [onMessageSent, scrollToBottom]);

  // Send a voice message
  const sendVoiceMessage = useCallback((uri: string, duration: number) => {
    const message = createVoiceMessage(uri, duration, true);
    setMessages(prev => [...prev, message]);
    
    onMessageSent?.(message);
    scrollToBottom();
    
    // Simulate message delivery
    simulateMessageDelivery(message.id, (messageId, status) => {
      setMessages(prev => updateMessageStatus(prev, messageId, status));
    });
  }, [onMessageSent, scrollToBottom]);

  // Send a media message (image/video)
  const sendMediaMessage = useCallback((
    uri: string, 
    type: 'image' | 'video', 
    size?: number, 
    duration?: number
  ) => {
    const message = createMediaMessage(uri, type, size, duration, true);
    setMessages(prev => [...prev, message]);
    
    onMessageSent?.(message);
    scrollToBottom();
    
    // Simulate message delivery
    simulateMessageDelivery(message.id, (messageId, status) => {
      setMessages(prev => updateMessageStatus(prev, messageId, status));
    });
  }, [onMessageSent, scrollToBottom]);

  // Receive a message (for AI responses, incoming messages)
  const receiveMessage = useCallback((text: string, type: Message['type'] = 'text') => {
    let message: Message;
    
    if (type === 'ai') {
      message = createAIMessage(text);
    } else {
      message = createTextMessage(text, false);
      message.type = type;
    }
    
    setMessages(prev => [...prev, message]);
    onMessageReceived?.(message);
    scrollToBottom();
  }, [onMessageReceived, scrollToBottom]);

  // Handle typing indicators
  const handleTyping = useCallback(() => {
    setIsTyping(true);
    
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    const timeout = setTimeout(() => {
      setIsTyping(false);
    }, 3000);
    
    setTypingTimeout(timeout);
  }, [typingTimeout]);

  // Stop typing
  const stopTyping = useCallback(() => {
    setIsTyping(false);
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
  }, [typingTimeout]);

  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Delete a specific message
  const deleteMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  // Update message status
  const updateStatus = useCallback((messageId: string, status: Message['status']) => {
    setMessages(prev => updateMessageStatus(prev, messageId, status));
  }, []);

  // Get last message
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

  // Get unread count
  const unreadCount = messages.filter(msg => 
    !msg.isFromCurrentUser && msg.status !== 'read'
  ).length;

  // Mark all messages as read
  const markAllAsRead = useCallback(() => {
    setMessages(prev => prev.map(msg => ({ ...msg, status: 'read' as const })));
  }, []);

  // Load more messages (for pagination)
  const loadMoreMessages = useCallback((olderMessages: Message[]) => {
    setMessages(prev => [...olderMessages, ...prev]);
  }, []);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [typingTimeout]);

  return {
    // State
    messages,
    isTyping,
    lastMessage,
    unreadCount,
    flatListRef,
    
    // Actions
    sendTextMessage,
    sendVoiceMessage,
    sendMediaMessage,
    receiveMessage,
    handleTyping,
    stopTyping,
    clearMessages,
    deleteMessage,
    updateStatus,
    markAllAsRead,
    loadMoreMessages,
    scrollToBottom,
    
    // Utils
    currentUser,
    targetUser,
  };
};