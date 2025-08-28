// src/components/chat/MessageInput.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Animated 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSystemFont } from '../../config/constants';
import { chatService } from '../../services/ChatService';

interface MessageInputProps {
  onSendText: (text: string) => void;
  onStartVoiceRecording: () => void;
  onStopVoiceRecording: () => void;
  onShowMediaPicker: () => void;
  isRecording?: boolean;
  recordingDuration?: number;
  recordingAnim?: Animated.Value;
  placeholder?: string;
  maxLength?: number;
  hideAttachment?: boolean;
  chatId?: string; // Add chatId for typing indicators
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendText,
  onStartVoiceRecording,
  onStopVoiceRecording,
  onShowMediaPicker,
  isRecording = false,
  recordingDuration = 0,
  recordingAnim,
  placeholder = "Type a message...",
  maxLength = 1000,
  hideAttachment = false,
  chatId
}) => {
  const [message, setMessage] = useState('');
  const textInputRef = useRef<TextInput>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle typing indicators
  const handleTypingStart = useCallback(() => {
    if (chatId) {
      console.log('🎯 FRONTEND: Starting typing indicator for chat:', chatId);
      chatService.sendTyping(chatId, true);
    }
  }, [chatId]);

  const handleTypingStop = useCallback(() => {
    if (chatId) {
      console.log('🎯 FRONTEND: Stopping typing indicator for chat:', chatId);
      chatService.sendTyping(chatId, false);
    }
  }, [chatId]);

  const handleTextChange = useCallback((text: string) => {
    setMessage(text);

    if (!chatId) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (text.length > 0) {
      // Start typing
      handleTypingStart();

      // Set timeout to stop typing after 1 second of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        handleTypingStop();
      }, 1000);
    } else {
      // Empty text, stop typing immediately
      handleTypingStop();
    }
  }, [chatId, handleTypingStart, handleTypingStop]);

  const handleSend = () => {
    if (message.trim().length === 0) return;
    
    // Stop typing before sending
    handleTypingStop();
    
    onSendText(message.trim());
    setMessage('');
    textInputRef.current?.blur();
  };

  const handleInputBlur = useCallback(() => {
    // Stop typing when input loses focus
    handleTypingStop();
  }, [handleTypingStop]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      handleTypingStop();
    };
  }, [handleTypingStop]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isRecording) {
    return (
      <View style={styles.recordingContainer}>
        <View style={styles.recordingInfo}>
          <Animated.View style={[
            styles.recordingIcon,
            recordingAnim && { transform: [{ scale: recordingAnim }] }
          ]}>
            <Ionicons name="mic" size={24} color="#ef4444" />
          </Animated.View>
          
          <View style={styles.recordingText}>
            <Text style={styles.recordingLabel}>Recording...</Text>
            <Text style={styles.recordingDuration}>
              {formatDuration(recordingDuration)}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.stopRecordingButton}
          onPress={onStopVoiceRecording}
        >
          <Ionicons name="stop" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.inputArea}>
      <View style={styles.inputContainer}>
        {!hideAttachment && (
          <TouchableOpacity 
            style={styles.attachmentButton}
            onPress={onShowMediaPicker}
          >
            <Ionicons name="add" size={24} color="#6b7280" />
          </TouchableOpacity>
        )}
        
        <TextInput
          ref={textInputRef}
          style={[styles.textInput, hideAttachment && styles.textInputNoAttachment]}
          value={message}
          onChangeText={handleTextChange}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          multiline
          maxLength={maxLength}
          textAlignVertical="center"
        />
        
        {message.trim().length > 0 ? (
          <TouchableOpacity 
            style={styles.sendButton}
            onPress={handleSend}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.voiceButton}
            onPressIn={onStartVoiceRecording}
            onPressOut={onStopVoiceRecording}
          >
            <Ionicons name="mic" size={24} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>
      
      {message.length > maxLength * 0.8 && (
        <Text style={styles.characterCount}>
          {message.length}/{maxLength}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  inputArea: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f3f4f6',
    borderRadius: 25,
    paddingHorizontal: 4,
    paddingVertical: 4,
    minHeight: 50,
  },
  attachmentButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: '#111827',
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#015b01',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  voiceButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  characterCount: {
    fontSize: 12,
    fontFamily: getSystemFont('regular'),
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 4,
  },
  recordingContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recordingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recordingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  recordingText: {
    flex: 1,
  },
  recordingLabel: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#ef4444',
    marginBottom: 2,
  },
  recordingDuration: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: '#6b7280',
  },
  stopRecordingButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInputNoAttachment: {
    marginLeft: 12,
  },
});