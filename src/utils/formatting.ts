// Utility functions for formatting data

/**
 * Formats a timestamp to show relative time (e.g., "Today", "Yesterday", "Last week")
 */
export const formatChatTimestamp = (date: Date | string): string => {
  const messageDate = new Date(date);
  const now = new Date();
  const diffInHours = Math.abs(now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
  const diffInDays = Math.floor(diffInHours / 24);

  // Same day
  if (diffInHours < 24 && now.getDate() === messageDate.getDate()) {
    return messageDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  // Yesterday
  if (diffInDays === 1) {
    return 'Yesterday';
  }

  // This week (within 7 days)
  if (diffInDays < 7) {
    return messageDate.toLocaleDateString('en-US', { weekday: 'long' });
  }

  // This year
  if (messageDate.getFullYear() === now.getFullYear()) {
    return messageDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }

  // Different year
  return messageDate.toLocaleDateString('en-US', { 
    year: 'numeric',
    month: 'short', 
    day: 'numeric' 
  });
};

/**
 * Formats timestamp for chat list (last message time)
 */
export const formatChatListTime = (date: Date | string): string => {
  const messageDate = new Date(date);
  const now = new Date();
  const diffInMinutes = Math.abs(now.getTime() - messageDate.getTime()) / (1000 * 60);
  const diffInHours = diffInMinutes / 60;
  const diffInDays = Math.floor(diffInHours / 24);

  // Less than 1 minute
  if (diffInMinutes < 1) {
    return 'now';
  }

  // Less than 1 hour
  if (diffInMinutes < 60) {
    return `${Math.floor(diffInMinutes)}m`;
  }

  // Same day
  if (diffInHours < 24 && now.getDate() === messageDate.getDate()) {
    return messageDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  // Yesterday
  if (diffInDays === 1) {
    return 'Yesterday';
  }

  // This week (within 7 days)
  if (diffInDays < 7) {
    return messageDate.toLocaleDateString('en-US', { weekday: 'short' });
  }

  // This year
  if (messageDate.getFullYear() === now.getFullYear()) {
    return messageDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }

  // Different year
  return messageDate.toLocaleDateString('en-US', { 
    year: '2-digit',
    month: 'short', 
    day: 'numeric' 
  });
};

/**
 * Formats full timestamp for message details
 */
export const formatMessageTimestamp = (date: Date | string): string => {
  const messageDate = new Date(date);
  return messageDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};