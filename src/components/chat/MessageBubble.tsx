// src/components/chat/MessageBubble.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSystemFont } from '../../config/constants';

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  text?: string;
  timestamp: Date;
  isFromCurrentUser: boolean;
  status: 'sent' | 'delivered' | 'read';
  type: 'text' | 'voice' | 'image' | 'video' | 'ai';
  duration?: number;
  uri?: string;
  size?: number;
  mediaUrl?: string;
  mediaFilename?: string;
  content?: {
    text?: string;
    mediaUrl?: string;
    mediaFilename?: string;
    mediaSize?: number;
    thumbnail?: string;
  };
}

interface MessageBubbleProps {
  message: Message;
  onMediaPress?: (uri: string, type: string) => void;
  onVoicePlay?: (uri: string, duration: number) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  onMediaPress, 
  onVoicePlay 
}) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Ionicons name="checkmark" size={12} color="#9ca3af" />;
      case 'delivered':
        return (
          <View style={styles.doubleCheck}>
            <Ionicons name="checkmark" size={12} color="#9ca3af" />
            <Ionicons name="checkmark" size={12} color="#9ca3af" style={{ marginLeft: -8 }} />
          </View>
        );
      case 'read':
        return (
          <View style={styles.doubleCheck}>
            <Ionicons name="checkmark" size={12} color="#22c55e" />
            <Ionicons name="checkmark" size={12} color="#22c55e" style={{ marginLeft: -8 }} />
          </View>
        );
      default:
        return null;
    }
  };

  const getBubbleStyle = () => {
    const baseStyles = [styles.messageBubble];
    
    if (message.type === 'ai') {
      baseStyles.push(styles.aiBubble);
    } else if (message.isFromCurrentUser) {
      baseStyles.push(styles.sentBubble);
    } else {
      baseStyles.push(styles.receivedBubble);
    }
    
    return baseStyles;
  };

  const getTextStyle = () => {
    if (message.type === 'ai') {
      return styles.aiText;
    } else if (message.isFromCurrentUser) {
      return styles.sentText;
    } else {
      return styles.receivedText;
    }
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'text':
      case 'ai':
        return (
          <Text style={[styles.messageText, getTextStyle()]}>
            {message.text}
          </Text>
        );

      case 'voice':
        return (
          <TouchableOpacity 
            style={styles.voiceMessage}
            onPress={() => onVoicePlay?.(message.uri || '', message.duration || 0)}
          >
            <View style={styles.playButton}>
              <Ionicons 
                name="play" 
                size={16} 
                color={message.isFromCurrentUser ? '#ffffff' : '#015b01'} 
              />
            </View>
            <View style={styles.voiceWave}>
              <Text style={[styles.voiceDuration, getTextStyle()]}>
                {formatDuration(message.duration || 0)}
              </Text>
            </View>
          </TouchableOpacity>
        );

      case 'image':
      case 'video':
        const mediaUrl = message.content?.mediaUrl || message.mediaUrl || message.uri;
        const filename = message.content?.mediaFilename || message.mediaFilename || message.text;
        
        return (
          <TouchableOpacity 
            style={styles.mediaMessage}
            onPress={() => onMediaPress?.(mediaUrl || '', message.type)}
          >
            {mediaUrl ? (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: mediaUrl }}
                  style={styles.messageImage}
                  resizeMode="cover"
                />
                {message.type === 'video' && (
                  <View style={styles.videoOverlay}>
                    <Ionicons name="play-circle" size={48} color="rgba(255,255,255,0.9)" />
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.mediaPlaceholder}>
                <Ionicons 
                  name={message.type === 'image' ? 'image' : 'videocam'} 
                  size={32} 
                  color={message.isFromCurrentUser ? '#ffffff' : '#015b01'} 
                />
              </View>
            )}
            {filename && (
              <Text style={[styles.mediaText, getTextStyle()]}>
                {filename}
              </Text>
            )}
          </TouchableOpacity>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[
      styles.messageContainer,
      message.isFromCurrentUser ? styles.sentMessage : styles.receivedMessage
    ]}>
      <View style={getBubbleStyle()}>
        {/* AI Assistant Label */}
        {message.type === 'ai' && (
          <View style={styles.aiLabel}>
            <Ionicons name="sparkles" size={12} color="#8b5cf6" />
            <Text style={styles.aiLabelText}>AI Assistant</Text>
          </View>
        )}

        {renderMessageContent()}

        <View style={styles.messageFooter}>
          <Text style={[
            styles.messageTime,
            message.isFromCurrentUser ? styles.sentTime : styles.receivedTime
          ]}>
            {formatTime(message.timestamp)}
          </Text>
          {message.isFromCurrentUser && message.type !== 'ai' && (
            <View style={styles.messageStatus}>
              {getStatusIcon(message.status)}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    marginVertical: 2,
  },
  sentMessage: {
    alignItems: 'flex-end',
  },
  receivedMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: width * 0.8,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sentBubble: {
    backgroundColor: '#015b01',
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#f3f4f6',
    borderLeftWidth: 3,
    borderLeftColor: '#8b5cf6',
    borderBottomLeftRadius: 4,
  },
  aiLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  aiLabelText: {
    fontSize: 10,
    fontFamily: getSystemFont('semiBold'),
    color: '#8b5cf6',
    textTransform: 'uppercase',
  },
  messageText: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    lineHeight: 20,
    marginBottom: 4,
  },
  sentText: {
    color: '#fff',
  },
  receivedText: {
    color: '#111827',
  },
  aiText: {
    color: '#374151',
  },
  voiceMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 120,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  voiceWave: {
    flex: 1,
  },
  voiceDuration: {
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
  },
  mediaMessage: {
    alignItems: 'center',
    minWidth: 120,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  mediaPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  mediaText: {
    fontSize: 12,
    fontFamily: getSystemFont('regular'),
    textAlign: 'center',
    marginTop: 4,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 12,
    fontFamily: getSystemFont('regular'),
  },
  sentTime: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  receivedTime: {
    color: '#6b7280',
  },
  messageStatus: {
    marginLeft: 4,
  },
  doubleCheck: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});