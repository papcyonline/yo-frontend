// src/utils/chatHelpers.ts

export interface Message {
  id: string;
  text?: string;
  timestamp: Date;
  isFromCurrentUser: boolean;
  status: 'sent' | 'delivered' | 'read';
  type: 'text' | 'voice' | 'image' | 'video' | 'ai';
  duration?: number;
  uri?: string;
  size?: number;
}

export interface ChatUser {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: string;
  email?: string;
  phone?: string;
}

// Time formatting utilities
export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

export const formatDate = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  }
};

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Message utilities
export const generateMessageId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

export const createTextMessage = (
  text: string, 
  isFromCurrentUser: boolean = true
): Message => ({
  id: generateMessageId(),
  text: text.trim(),
  timestamp: new Date(),
  isFromCurrentUser,
  status: 'sent',
  type: 'text'
});

export const createVoiceMessage = (
  uri: string, 
  duration: number, 
  isFromCurrentUser: boolean = true
): Message => ({
  id: generateMessageId(),
  text: `Voice message (${formatDuration(duration)})`,
  timestamp: new Date(),
  isFromCurrentUser,
  status: 'sent',
  type: 'voice',
  duration,
  uri
});

export const createMediaMessage = (
  uri: string, 
  type: 'image' | 'video', 
  size?: number,
  duration?: number,
  isFromCurrentUser: boolean = true
): Message => ({
  id: generateMessageId(),
  text: type === 'image' ? 'Photo' : `Video${duration ? ` (${formatDuration(duration)})` : ''}`,
  timestamp: new Date(),
  isFromCurrentUser,
  status: 'sent',
  type,
  uri,
  size,
  duration
});

export const createAIMessage = (text: string): Message => ({
  id: generateMessageId(),
  text,
  timestamp: new Date(),
  isFromCurrentUser: false,
  status: 'read',
  type: 'ai'
});

// Message status management
export const updateMessageStatus = (
  messages: Message[], 
  messageId: string, 
  status: Message['status']
): Message[] => {
  return messages.map(msg => 
    msg.id === messageId ? { ...msg, status } : msg
  );
};

export const markAllMessagesAsRead = (messages: Message[]): Message[] => {
  return messages.map(msg => ({ ...msg, status: 'read' }));
};

// Chat validation
export const validateMessage = (text: string, maxLength: number = 1000): boolean => {
  return text.trim().length > 0 && text.length <= maxLength;
};

export const validateMediaFile = (
  fileSize?: number, 
  duration?: number,
  maxSize: number = 10 * 1024 * 1024, // 10MB
  maxDuration: number = 60 // 60 seconds
): { isValid: boolean; error?: string } => {
  if (fileSize && fileSize > maxSize) {
    return {
      isValid: false,
      error: `File size exceeds ${Math.round(maxSize / (1024 * 1024))}MB limit`
    };
  }
  
  if (duration && duration > maxDuration) {
    return {
      isValid: false,
      error: `Duration exceeds ${maxDuration} seconds limit`
    };
  }
  
  return { isValid: true };
};

// Conversation utilities
export const getLastMessage = (messages: Message[]): Message | null => {
  return messages.length > 0 ? messages[messages.length - 1] : null;
};

export const getMessagePreview = (message: Message): string => {
  switch (message.type) {
    case 'text':
    case 'ai':
      return message.text || '';
    case 'voice':
      return '🎵 Voice message';
    case 'image':
      return '📷 Photo';
    case 'video':
      return '🎥 Video';
    default:
      return 'Message';
  }
};

export const getUnreadCount = (messages: Message[]): number => {
  return messages.filter(msg => 
    !msg.isFromCurrentUser && msg.status !== 'read'
  ).length;
};

// Search utilities
export const searchMessages = (messages: Message[], query: string): Message[] => {
  const searchTerm = query.toLowerCase().trim();
  if (!searchTerm) return messages;
  
  return messages.filter(msg => 
    msg.text?.toLowerCase().includes(searchTerm)
  );
};

// Group messages by date
export const groupMessagesByDate = (messages: Message[]): { [key: string]: Message[] } => {
  return messages.reduce((groups, message) => {
    const dateKey = formatDate(message.timestamp);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
    return groups;
  }, {} as { [key: string]: Message[] });
};

// Chat typing indicators
export const shouldShowTypingIndicator = (
  lastActivity: Date, 
  timeoutMs: number = 3000
): boolean => {
  return Date.now() - lastActivity.getTime() < timeoutMs;
};

// Message sending simulation
export const simulateMessageDelivery = (
  messageId: string,
  onStatusUpdate: (messageId: string, status: Message['status']) => void
) => {
  // Simulate delivery after 1 second
  setTimeout(() => {
    onStatusUpdate(messageId, 'delivered');
  }, 1000);
  
  // Simulate read after 3 seconds
  setTimeout(() => {
    onStatusUpdate(messageId, 'read');
  }, 3000);
};