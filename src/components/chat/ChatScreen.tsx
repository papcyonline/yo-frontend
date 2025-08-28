// src/screens/ChatScreen.tsx - Advanced Modern Chat Design
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Animated,
  Easing,
  Image,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Pattern, Rect, Circle, RadialGradient, Stop, Path } from 'react-native-svg';
import { getSystemFont } from '../../config/constants';
import { useFocusEffect } from '@react-navigation/native';
import { chatService, ChatMessage, useChat } from '../../services/ChatService';
import { useAuthStore } from '../../store/authStore';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import * as Clipboard from 'expo-clipboard';
import * as MediaLibrary from 'expo-media-library';
import { formatChatTimestamp, formatMessageTimestamp } from '../../utils/formatting';
import { pushNotificationService } from '../../services/notifications/PushNotifications';
import * as FileSystem from 'expo-file-system';
import { useWebRTC } from '../../hooks/useWebRTC';
import { MockCallUI } from '../calls/MockCallUI';
import Constants from 'expo-constants';
// PagerView causes web compatibility issues, use ScrollView instead
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';

// Utility function to format message time
const formatTime = (date: Date): string => {
  return formatChatTimestamp(date);
};
import { MediaPicker } from './mediaPicker';
import { MongoMediaService } from '../../services/MongoMediaService';
import logger from '../../services/LoggingService';

// Helper function for duration formatting
const formatDuration = (duration: number) => {
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  text?: string;
  timestamp: Date;
  isFromCurrentUser: boolean;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  type: 'text' | 'voice' | 'image' | 'video' | 'document';
  duration?: number;
  uri?: string;
  mediaUrl?: string;
  mediaFilename?: string;
  isEdited?: boolean;
  editedAt?: Date;
  sender?: {
    id: string;
    name: string;
    profilePhotoUrl?: string;
  };
  formattedTime?: string;
  fullTimestamp?: string;
}

interface ChatProps {
  navigation: any;
  route: any;
}

// Advanced Message Component with Glass Effect
const MessageBubble: React.FC<{
  message: Message;
  onPress?: () => void;
  onLongPress?: () => void;
  onPlayVoice?: (messageId: string, audioUrl?: string) => void;
  onImagePress?: (imageUrl: string) => void;
  onSwipeEdit?: (message: Message) => void;
  onSwipeDelete?: (message: Message) => void;
  isPlaying?: boolean;
  isEditing?: boolean;
  editingText?: string;
  onEditTextChange?: (text: string) => void;
  onEditSave?: (messageId: string, newText: string) => void;
  onEditCancel?: (messageId: string) => void;
  index: number;
}> = ({ 
  message, 
  onPress, 
  onLongPress, 
  onPlayVoice, 
  onImagePress, 
  onSwipeEdit, 
  onSwipeDelete, 
  isPlaying = false, 
  isEditing = false,
  editingText = '',
  onEditTextChange,
  onEditSave,
  onEditCancel,
  index 
}) => {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [opacityAnim] = useState(new Animated.Value(0));
  const editInputRef = useRef<TextInput>(null);
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      setTimeout(() => {
        editInputRef.current?.focus();
      }, 100);
    }
  }, [isEditing]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Render right actions for swipe
  const renderRightActions = () => {
    // Only show actions for user's own messages
    if (!message.isFromCurrentUser) return null;

    // Check if message can be edited (text messages that haven't been read and within 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const canEdit = message.type === 'text' && 
                   message.status !== 'read' && 
                   message.timestamp >= fifteenMinutesAgo;

    return (
      <View style={styles.swipeActions}>
        {canEdit && (
          <TouchableOpacity
            style={[styles.swipeActionButton, styles.editButton]}
            onPress={() => onSwipeEdit?.(message)}
          >
            <Ionicons name="pencil" size={20} color="#ffffff" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.swipeActionButton, styles.deleteButton]}
          onPress={() => onSwipeDelete?.(message)}
        >
          <Ionicons name="trash" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sending':
        return <Ionicons name="time" size={12} color="rgba(255,255,255,0.5)" />;
      case 'sent':
        return <Ionicons name="checkmark" size={12} color="rgba(255,255,255,0.7)" />;
      case 'delivered':
        return (
          <View style={styles.modernDoubleCheck}>
            <Ionicons name="checkmark" size={12} color="rgba(255,255,255,0.8)" />
            <Ionicons name="checkmark" size={12} color="rgba(255,255,255,0.8)" style={{ marginLeft: -8 }} />
          </View>
        );
      case 'read':
        return (
          <View style={styles.modernDoubleCheck}>
            <Ionicons name="checkmark" size={12} color="#4ade80" />
            <Ionicons name="checkmark" size={12} color="#4ade80" style={{ marginLeft: -8 }} />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      enabled={message.isFromCurrentUser}
    >
      <Animated.View 
        style={[
          styles.modernMessageContainer,
          message.isFromCurrentUser ? styles.modernSentMessage : styles.modernReceivedMessage,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
      {/* Avatar for received messages */}
      {!message.isFromCurrentUser && (
        <View style={styles.messageAvatar}>
          {message.sender?.profilePhotoUrl ? (
            <Image 
              source={{ uri: message.sender.profilePhotoUrl }} 
              style={styles.messageAvatarImage as any}
            />
          ) : (
            <LinearGradient
              colors={['#04a7c7', '#fcd3aa']}
              style={styles.messageAvatarGradient}
            >
              <Text style={styles.messageAvatarText}>
                {message.sender?.name ? message.sender.name.charAt(0).toUpperCase() : String.fromCharCode(65 + (index % 26))}
              </Text>
            </LinearGradient>
          )}
        </View>
      )}

      <TouchableOpacity 
        style={[
          styles.modernMessageBubble,
          message.isFromCurrentUser ? styles.modernSentBubble : styles.modernReceivedBubble
        ]}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.85}
      >
        {/* Glass Effect Background */}
        <LinearGradient
          colors={
            message.isFromCurrentUser 
              ? ['rgba(0,145,173,0.9)', 'rgba(4,167,199,0.8)']
              : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
          }
          style={styles.modernBubbleGradient}
        >
          {/* Message Content */}
          <View style={styles.modernMessageContent}>
            {message.type === 'text' && (
              <>
                {isEditing ? (
                  <View style={styles.modernEditingContainer}>
                    <TextInput
                      ref={editInputRef}
                      value={editingText}
                      onChangeText={onEditTextChange}
                      style={[
                        styles.modernEditingInput,
                        message.isFromCurrentUser ? styles.modernSentTextInput : styles.modernReceivedTextInput
                      ]}
                      multiline
                      autoFocus
                      onBlur={() => onEditCancel?.(message.id)}
                      onSubmitEditing={() => onEditSave?.(message.id, editingText)}
                      returnKeyType="done"
                      placeholder="Edit your message..."
                      placeholderTextColor="rgba(255,255,255,0.5)"
                    />
                    <View style={styles.modernEditingActions}>
                      <TouchableOpacity 
                        onPress={() => onEditCancel?.(message.id)}
                        style={[styles.modernEditingAction, styles.modernEditingCancel]}
                      >
                        <Ionicons name="close" size={16} color="#ff6b6b" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => onEditSave?.(message.id, editingText)}
                        style={[styles.modernEditingAction, styles.modernEditingSave]}
                      >
                        <Ionicons name="checkmark" size={16} color="#4ade80" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <Text style={[
                    styles.modernMessageText,
                    message.isFromCurrentUser ? styles.modernSentText : styles.modernReceivedText
                  ]}>
                    {message.text}
                  </Text>
                )}
              </>
            )}

            {message.type === 'voice' && (
              <View style={styles.modernVoiceMessage}>
                <TouchableOpacity 
                  style={[
                    styles.modernPlayButton,
                    { backgroundColor: message.isFromCurrentUser ? 'rgba(255,255,255,0.2)' : 'rgba(0,145,173,0.1)' }
                  ]}
                  onPress={() => onPlayVoice?.(message.id, message.mediaUrl)}
                >
                  <Ionicons 
                    name={isPlaying ? "pause" : "play"} 
                    size={16} 
                    color={message.isFromCurrentUser ? '#ffffff' : '#0091ad'} 
                  />
                </TouchableOpacity>
                
                {/* Voice Wave Animation */}
                <View style={styles.voiceWaveContainer}>
                  {[1, 2, 3, 4, 5].map((bar) => (
                    <View
                      key={bar}
                      style={[
                        styles.voiceWaveBar,
                        { 
                          backgroundColor: message.isFromCurrentUser ? 'rgba(255,255,255,0.7)' : '#0091ad',
                          height: Math.random() * 20 + 8
                        }
                      ]}
                    />
                  ))}
                </View>
                
                <Text style={[
                  styles.modernVoiceDuration, 
                  message.isFromCurrentUser ? styles.modernSentText : styles.modernReceivedText
                ]}>
                  {formatDuration(message.duration || 0)}
                </Text>
              </View>
            )}

            {message.type === 'image' && (
              <View style={styles.modernImageMessage}>
                {message.mediaUrl ? (
                  <TouchableOpacity onPress={() => onImagePress?.(message.mediaUrl!)}>
                    <View style={styles.modernImageContainer}>
                      <Image
                        source={{ uri: message.mediaUrl }}
                        style={styles.modernChatImage}
                        resizeMode="cover"
                      />
                      <View style={styles.modernImageOverlay}>
                        <Ionicons name="eye" size={16} color="rgba(255,255,255,0.8)" />
                      </View>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <View style={[
                    styles.modernImagePlaceholder,
                    { backgroundColor: message.isFromCurrentUser ? 'rgba(255,255,255,0.2)' : 'rgba(0,145,173,0.1)' }
                  ]}>
                    <Ionicons name="image" size={28} color={message.isFromCurrentUser ? '#ffffff' : '#0091ad'} />
                  </View>
                )}
                {message.text && (
                  <Text style={[
                    styles.modernMediaText, 
                    message.isFromCurrentUser ? styles.modernSentText : styles.modernReceivedText
                  ]}>
                    {message.text}
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Modern Message Footer */}
          <View style={styles.modernMessageFooter}>
            <Text style={[
              styles.modernMessageTime,
              message.isFromCurrentUser ? styles.modernSentTime : styles.modernReceivedTime
            ]}>
              {formatTime(message.timestamp)}
              {message.isEdited && (
                <Text style={[
                  styles.modernEditedText,
                  message.isFromCurrentUser ? styles.modernSentTime : styles.modernReceivedTime
                ]}>
                  {' • edited'}
                </Text>
              )}
            </Text>
            {message.isFromCurrentUser && (
              <View style={styles.modernMessageStatus}>
                {getStatusIcon(message.status)}
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Message Tail */}
        <View style={[
          styles.modernMessageTail,
          message.isFromCurrentUser ? styles.modernSentTail : styles.modernReceivedTail
        ]} />
      </TouchableOpacity>
    </Animated.View>
    </Swipeable>
  );
};

// Advanced Modern Chat Header with Glass Effect
const ChatHeader: React.FC<{
  targetUser: any;
  onBack: () => void;
  onCall: () => void;
  onVideoCall: () => void;
  onMenu: () => void;
  typingUsers?: string[];
}> = ({ targetUser, onBack, onCall, onVideoCall, onMenu, typingUsers = [] }) => {
  const [headerAnim] = useState(new Animated.Value(0));
  
  // Debug logging for typing users
  useEffect(() => {
    logger.debug('HEADER: Received typingUsers', { typingUsers });
    logger.debug('HEADER: Should show typing?', { shouldShow: typingUsers.length > 0 });
  }, [typingUsers]);
  
  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.bezier(0.25, 0.46, 0.45, 0.94)),
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View 
      style={[
        styles.modernHeader,
        {
          opacity: headerAnim,
          transform: [{
            translateY: headerAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [-50, 0],
            }),
          }],
        }
      ]}
    >
      {/* Blurred Background */}
      <View style={styles.modernHeaderBlur}>
        <LinearGradient
          colors={['rgba(0,0,0,0.95)', 'rgba(0,0,0,0.9)', 'rgba(0,0,0,0.85)']}
          style={styles.modernHeaderGradient}
        />
      </View>
      
      {/* Content */}
      <View style={styles.modernHeaderContent}>
        <TouchableOpacity style={styles.modernBackButton} onPress={onBack}>
          <View style={styles.modernButtonGlass}>
            <Ionicons 
              name={Platform.OS === 'android' ? 'arrow-back' : 'chevron-back'} 
              size={24} 
              color="#fcd3aa" 
            />
          </View>
        </TouchableOpacity>
        
        <View style={styles.modernUserInfo}>
          {/* Advanced Avatar with Rings */}
          <View style={styles.modernAvatarContainer}>
            <View style={styles.modernAvatarRing} />
            <LinearGradient
              colors={['#0091ad', '#04a7c7', '#fcd3aa']}
              style={styles.modernHeaderAvatar}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.modernHeaderAvatarText}>
                {targetUser?.initials || targetUser?.name?.[0] || 'U'}
              </Text>
            </LinearGradient>
            
            {/* Enhanced Online Status */}
            {targetUser?.isOnline && (
              <View style={styles.modernOnlineContainer}>
                <View style={styles.modernOnlinePulse} />
                <View style={styles.modernOnlineDot} />
              </View>
            )}
          </View>
          
          <View style={styles.modernHeaderUserDetails}>
            <Text style={styles.modernHeaderUserName} numberOfLines={1}>
              {targetUser?.name || 'User'}
            </Text>
            <View style={styles.modernStatusContainer}>
              <View style={[
                styles.modernStatusDot,
                { backgroundColor: typingUsers.length > 0 ? '#fcd3aa' : (targetUser?.isOnline ? '#4ade80' : 'rgba(255,255,255,0.5)') }
              ]} />
              <Text style={styles.modernHeaderUserStatus} numberOfLines={1}>
                {typingUsers.length > 0 ? 'Typing...' : (targetUser?.isOnline ? 'Online now' : 'Last seen recently')}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.modernHeaderActions}>
          <TouchableOpacity style={styles.modernHeaderActionBtn} onPress={onVideoCall}>
            <View style={styles.modernButtonGlass}>
              <Ionicons name="videocam" size={20} color="#fcd3aa" />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.modernHeaderActionBtn} onPress={onCall}>
            <View style={styles.modernButtonGlass}>
              <Ionicons name="call" size={18} color="#fcd3aa" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Subtle Bottom Border */}
      <LinearGradient
        colors={['transparent', 'rgba(252,211,170,0.2)', 'transparent']}
        style={styles.modernHeaderBorder}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />
    </Animated.View>
  );
};

// Simple Background Pattern 
const BackgroundPattern: React.FC = () => (
  <View style={styles.modernBackground}>
    <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
      <Defs>
        <Pattern
          id="simpleChatDots"
          patternUnits="userSpaceOnUse"
          width="40"
          height="40"
        >
          <Circle cx="20" cy="20" r="0.5" fill="rgba(252,211,170,0.04)" opacity="0.6" />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#simpleChatDots)" />
    </Svg>
  </View>
);

// Advanced Chat Input with Glass Effect
const ChatInput: React.FC<{
  message: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onVoiceRecord: () => void;
  onAttachment: () => void;
  isRecording: boolean;
  chatId?: string;
}> = ({ message, onChangeText, onSend, onVoiceRecord, onAttachment, isRecording, chatId }) => {
  const [inputAnim] = useState(new Animated.Value(0));
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Handle typing indicators
  const handleTypingStart = () => {
    if (chatId) {
      logger.debug('FRONTEND: Starting typing indicator', { chatId });
      chatService.sendTyping(chatId, true);
    }
  };

  const handleTypingStop = () => {
    if (chatId) {
      logger.debug('FRONTEND: Stopping typing indicator', { chatId });
      chatService.sendTyping(chatId, false);
    }
  };

  const handleTextChange = (text: string) => {
    onChangeText(text);

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
  };

  const handleSendWithTyping = () => {
    // Stop typing before sending
    handleTypingStop();
    onSend();
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      handleTypingStop();
    };
  }, []);
  
  useEffect(() => {
    Animated.timing(inputAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.bezier(0.25, 0.46, 0.45, 0.94)),
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View 
      style={[
        styles.modernInputArea,
        {
          opacity: inputAnim,
          transform: [{
            translateY: inputAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [100, 0],
            }),
          }],
        }
      ]}
    >
      {/* Glass Background */}
      <View style={styles.modernInputBlur}>
        <LinearGradient
          colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.95)']}
          style={styles.modernInputGradient}
        />
      </View>

      <View style={styles.modernInputContainer}>
        {/* Single Input Container with Icons Inside */}
        <View style={styles.modernTextInputContainer}>
          <LinearGradient
            colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
            style={styles.modernTextInputGlass}
          >
            {/* Attachment Button Inside */}
            <TouchableOpacity style={styles.inlineAttachmentButton} onPress={onAttachment}>
              <View style={styles.inlineIconBackground}>
                <Ionicons name="add" size={20} color="#fcd3aa" />
              </View>
            </TouchableOpacity>
            
            <TextInput
              style={styles.modernTextInput}
              value={message}
              onChangeText={handleTextChange}
              onBlur={handleTypingStop}
              placeholder="Type a message..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              multiline
              maxLength={1000}
              selectionColor="#fcd3aa"
            />
            
            {/* Send/Voice Button Inside */}
            {message.trim().length > 0 ? (
              <TouchableOpacity style={styles.inlineSendButton} onPress={handleSendWithTyping}>
                <LinearGradient
                  colors={['#0091ad', '#04a7c7']}
                  style={styles.inlineSendGradient}
                >
                  <Ionicons name="send" size={18} color="#ffffff" />
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[
                  styles.inlineVoiceButton,
                  isRecording && styles.inlineRecordingButton
                ]} 
                onPress={onVoiceRecord}
              >
                <View style={[
                  styles.inlineIconBackground,
                  isRecording && styles.inlineRecordingBackground
                ]}>
                  <Ionicons 
                    name={isRecording ? "stop" : "mic"} 
                    size={20} 
                    color={isRecording ? "#ff6b6b" : "#fcd3aa"} 
                  />
                </View>
                {isRecording && (
                  <View style={styles.inlineRecordingPulse} />
                )}
              </TouchableOpacity>
            )}
          </LinearGradient>
        </View>
      </View>

      {/* Top Border */}
      <LinearGradient
        colors={['transparent', 'rgba(252,211,170,0.2)', 'transparent']}
        style={styles.modernInputBorder}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />
    </Animated.View>
  );
};

// Main Component
const ChatScreen: React.FC<ChatProps> = ({ navigation, route }) => {
  const { targetUser, chatId } = route.params || {};
  const { connect } = useChat();
  const { isAuthenticated, token, user: currentUser } = useAuthStore();
  const { startVoiceCall, startVideoCall } = useWebRTC();
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [playingAudio, setPlayingAudio] = useState<Audio.Sound | null>(null);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Custom notification system
  const [notification, setNotification] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message: string;
    icon?: string;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });
  
  const flatListRef = useRef<FlatList>(null);

  // Custom notification functions
  const showNotification = (
    type: 'success' | 'error' | 'info' | 'warning',
    title: string,
    message: string,
    icon?: string,
    duration: number = 3000
  ) => {
    setNotification({
      visible: true,
      type,
      title,
      message,
      icon
    });

    // Auto-hide after duration
    setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }));
    }, duration);
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, visible: false }));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'error': return 'close-circle';
      case 'warning': return 'warning';
      case 'info': 
      default: return 'information-circle';
    }
  };

  // Swipe action handlers
  const handleSwipeEdit = (message: Message) => {
    if (message.type === 'text') {
      // Check if user is the sender
      if (!message.isFromCurrentUser) {
        showNotification('warning', 'Cannot Edit', 'You can only edit your own messages', 'warning');
        return;
      }

      // Check if message has been read by recipient
      if (message.status === 'read') {
        showNotification('warning', 'Cannot Edit', 'Cannot edit messages that have been read', 'eye');
        return;
      }

      // Check 15-minute time limit
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      if (message.timestamp < fifteenMinutesAgo) {
        showNotification('warning', 'Cannot Edit', 'Messages can only be edited within 15 minutes', 'time');
        return;
      }

      setEditingMessageId(message.id);
      setEditingText(message.text || '');
      showNotification('info', 'Edit Mode', 'Tap checkmark to save or X to cancel', 'create');
    }
  };

  const handleEditSave = async (messageId: string, newText: string) => {
    if (newText.trim() === '') {
      showNotification('warning', 'Empty Message', 'Message cannot be empty', 'warning');
      return;
    }

    const originalMessage = messages.find(m => m.id === messageId);
    if (!originalMessage || newText.trim() === originalMessage.text) {
      // No changes made
      setEditingMessageId(null);
      setEditingText('');
      return;
    }

    try {
      logger.debug('Saving edited message', { messageId, newText: newText.trim() });
      await chatService.editMessage(messageId, newText.trim());
      
      // Update local state immediately for better UX
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === messageId 
            ? { ...msg, text: newText.trim(), isEdited: true, editedAt: new Date() }
            : msg
        )
      );
      
      // Clear editing state
      setEditingMessageId(null);
      setEditingText('');
      
      showNotification('success', 'Message Updated', 'Your message has been edited', 'checkmark-circle');
    } catch (error) {
      console.error('❌ Error editing message:', error);
      showNotification('error', 'Edit Failed', 'Failed to edit message', 'close-circle');
    }
  };

  const handleEditCancel = (messageId: string) => {
    setEditingMessageId(null);
    setEditingText('');
    showNotification('info', 'Edit Cancelled', 'No changes were made', 'information-circle');
  };

  const handleSwipeDelete = (message: Message) => {
    showNotification('warning', 'Delete Message', 'Are you sure you want to delete this message?', 'warning');
    
    // Show confirmation after a brief delay
    setTimeout(() => {
      Alert.alert(
        'Delete Message',
        'Are you sure you want to delete this message?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                console.log('🗑️ Deleting message:', message.id);
                await chatService.deleteMessage(message.id, false);
                
                // Remove message from local state immediately for better UX
                setMessages(prevMessages => prevMessages.filter(msg => msg.id !== message.id));
                
                showNotification('success', 'Message Deleted', 'Message has been removed', 'trash');
              } catch (error) {
                console.error('❌ Error deleting message:', error);
                showNotification('error', 'Delete Failed', 'Failed to delete message', 'close-circle');
              }
            }
          }
        ]
      );
    }, 1500);
  };

  // Messages from API - fetch by chatId
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [actualChatId, setActualChatId] = useState<string | null>(null);
  
  // Editing state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  
  // Check if we're in Expo Go
  const isExpoGo = Constants.executionEnvironment === 'storeClient';
  
  // Mock call state for Expo Go only
  const [showMockCall, setShowMockCall] = useState(false);
  const [mockCallType, setMockCallType] = useState<'voice' | 'video'>('voice');
  const [mockCallDuration, setMockCallDuration] = useState(0);
  
  // Timer for mock call duration (only in Expo Go)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (showMockCall && isExpoGo) {
      interval = setInterval(() => {
        setMockCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showMockCall, isExpoGo]);

  // Load chat and messages from API - Fixed to prevent infinite loops
  React.useEffect(() => {
    let mounted = true;

    const initializeChat = async () => {
      try {
        if (!mounted) return;
        
        console.log('🚀 ChatScreen: Starting initialization...');
        console.log('🔐 Auth check - isAuthenticated:', isAuthenticated, 'token:', !!token);
        
        if (!isAuthenticated || !token || !targetUser?.id) {
          console.error('❌ Missing auth or target user');
          if (mounted) setLoading(false);
          return;
        }
        
        if (mounted) setLoading(true);
        console.log('🚀 ChatScreen: Initializing chat with user:', targetUser.id);

        let chat;
        console.log('🔍 DEBUG: Chat initialization - chatId:', chatId, 'targetUser:', targetUser.id);
        
        if (chatId) {
          // Get existing chat
          console.log('🔍 DEBUG: Getting existing chat...');
          const chatsData = await chatService.getChats();
          console.log('🔍 DEBUG: Got chats data:', chatsData);
          chat = chatsData.chats.find(c => c._id === chatId);
          console.log('🔍 DEBUG: Found chat:', chat);
        } else {
          // Create or get direct chat
          console.log('🔍 DEBUG: Creating or getting direct chat...');
          chat = await chatService.createOrGetDirectChat(targetUser.id);
          console.log('🔍 DEBUG: Created/got chat:', chat);
        }

        if (!mounted) return;

        if (chat) {
          console.log('✅ DEBUG: Setting actualChatId to:', chat._id);
          setActualChatId(chat._id);
          
          // Connect and join chat room for real-time updates
          connect();
          chatService.joinChat(chat._id);
          
          // Load existing messages with performance optimization
          console.log('📱 Loading messages with lazy loading...');
          const startTime = Date.now();
          
          // Load only recent messages first (last 20 for instant display)
          const messagesData = await chatService.getChatMessages(chat._id, 1, 20);
          if (!mounted) return;
          
          const transformedMessages = messagesData.messages.map((msg: ChatMessage) => ({
            id: msg._id,
            text: msg.content.text,
            timestamp: new Date(msg.createdAt),
            isFromCurrentUser: msg.senderId === currentUser?.id,
            status: msg.status,
            type: msg.messageType as 'text' | 'voice' | 'image' | 'video' | 'document',
            duration: msg.content.duration,
            mediaUrl: msg.content.mediaUrl,
            mediaFilename: msg.content.mediaFilename,
            sender: {
              id: typeof msg.senderId === 'string' ? msg.senderId : msg.senderId._id,
              name: typeof msg.senderId === 'string' ? 'Unknown' : `${msg.senderId.first_name} ${msg.senderId.last_name}`,
              profilePhotoUrl: typeof msg.senderId === 'string' ? undefined : msg.senderId.profile_photo_url
            },
            // Add formatted timestamps for better UX
            formattedTime: formatChatTimestamp(msg.createdAt),
            fullTimestamp: formatMessageTimestamp(msg.createdAt)
          }));
          
          const loadTime = Date.now() - startTime;
          console.log(`✅ Loaded ${transformedMessages.length} messages in ${loadTime}ms`);
          setMessages(transformedMessages);
          
          // Mark messages as read
          await chatService.markMessagesAsRead(chat._id);
        } else {
          console.error('❌ DEBUG: No chat found or created - attempting fallback');
          // Force create chat as fallback
          if (targetUser.id) {
            const fallbackChat = await chatService.createOrGetDirectChat(targetUser.id);
            if (fallbackChat && mounted) {
              console.log('✅ DEBUG: Fallback chat created:', fallbackChat._id);
              setActualChatId(fallbackChat._id);
              connect();
              chatService.joinChat(fallbackChat._id);
            }
          }
        }
        
      } catch (error) {
        if (!mounted) return;
        
        console.error('❌ Error initializing chat:', error);
        console.error('❌ Error details:', error instanceof Error ? error.message : String(error));
        setMessages([]);
        
        // Last resort: try to create chat directly
        try {
          if (targetUser?.id && !actualChatId) {
            console.log('🆘 Last resort: Force creating chat...');
            const emergencyChat = await chatService.createOrGetDirectChat(targetUser.id);
            if (emergencyChat && mounted) {
              setActualChatId(emergencyChat._id);
              connect();
              chatService.joinChat(emergencyChat._id);
              console.log('✅ Emergency chat created:', emergencyChat._id);
            }
          }
        } catch (emergencyError) {
          console.error('❌ Emergency chat creation failed:', emergencyError);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeChat();

    return () => {
      mounted = false;
    };
  }, [targetUser?.id, chatId, isAuthenticated, token]);

  // Set up real-time listeners - Fixed to prevent duplicate events
  React.useEffect(() => {
    if (!actualChatId || !currentUser?.id) {
      return;
    }

    const handleNewMessage = (data: { message: ChatMessage; chat: any }) => {
      if (data.message.chatId === actualChatId) {
        console.log('📨 New message received:', data.message._id, 'from:', data.message.senderId);
        console.log('📨 Current user ID:', currentUser?.id);
        
        // Check for duplicates before adding
        setMessages(prev => {
          const exists = prev.some(msg => msg.id === data.message._id);
          if (exists) {
            console.log('⚠️ Duplicate message ignored:', data.message._id);
            return prev;
          }
          
          // Handle different senderId formats (string or object)
          const senderId = typeof data.message.senderId === 'string' 
            ? data.message.senderId 
            : data.message.senderId._id || data.message.senderId;
            
          const newMessage: Message = {
            id: data.message._id,
            text: data.message.content.text,
            timestamp: new Date(data.message.createdAt),
            isFromCurrentUser: senderId === currentUser.id || senderId === currentUser._id,
            status: data.message.status,
            type: data.message.messageType as 'text' | 'voice' | 'image' | 'video' | 'document',
            duration: data.message.content.duration,
            mediaUrl: data.message.content.mediaUrl,
            mediaFilename: data.message.content.mediaFilename,
            sender: {
              id: typeof senderId === 'string' ? senderId : senderId._id,
              name: data.message.senderName || 'Unknown',
              profilePhotoUrl: typeof data.message.senderId === 'object' ? data.message.senderId.profile_photo_url : undefined
            }
          };
          
          console.log('📨 Adding new message to chat, isFromCurrentUser:', newMessage.isFromCurrentUser);
          return [...prev, newMessage];
        });
        
        // Handle push notifications and mark as read for messages from other users
        const senderId = typeof data.message.senderId === 'string' 
          ? data.message.senderId 
          : data.message.senderId._id || data.message.senderId;
          
        if (senderId !== currentUser.id && senderId !== currentUser._id) {
          // Show push notification for incoming message
          const senderName = data.message.senderName || 'Someone';
          const messageText = data.message.content.text || 'Sent a message';
          
          pushNotificationService.sendMessageNotification(
            senderName,
            messageText,
            actualChatId || '',
            typeof senderId === 'string' ? senderId : senderId._id
          );
          
          // Mark as read via socket
          chatService.markReadViaSocket(actualChatId, [data.message._id]);
        }
        
        // Auto-scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    };

    const handleMessageDelivered = (data: { messageId: string; chatId: string; deliveredAt: Date }) => {
      if (data.chatId === actualChatId) {
        setMessages(prev => prev.map(msg => 
          msg.id === data.messageId ? { ...msg, status: 'delivered' as const } : msg
        ));
      }
    };

    const handleMessageRead = (data: { messageId: string; chatId: string; readBy: string; readAt: Date }) => {
      if (data.chatId === actualChatId) {
        setMessages(prev => prev.map(msg => 
          msg.id === data.messageId ? { ...msg, status: 'read' as const } : msg
        ));
      }
    };

    // Handle typing indicators
    const handleTypingUpdate = (data: { chatId: string; typingUsers: string[] }) => {
      if (data.chatId === actualChatId) {
        console.log('👀 FRONTEND: Typing update received:', data);
        console.log('🎯 FRONTEND: Setting typingUsers to:', data.typingUsers || []);
        setTypingUsers(data.typingUsers || []);
      }
    };

    const handleUserTyping = (data: { chatId: string; userId: string; isTyping: boolean }) => {
      if (data.chatId === actualChatId && data.userId !== currentUser.id) {
        console.log('⌨️ FRONTEND: User typing event:', data);
        
        if (data.isTyping) {
          console.log('🟢 FRONTEND: Adding user to typing list:', data.userId);
          setTypingUsers(prev => {
            const newList = [...prev.filter(id => id !== data.userId), data.userId];
            console.log('📝 FRONTEND: New typing users list:', newList);
            return newList;
          });
        } else {
          console.log('🔴 FRONTEND: Removing user from typing list:', data.userId);
          setTypingUsers(prev => {
            const newList = prev.filter(id => id !== data.userId);
            console.log('📝 FRONTEND: New typing users list:', newList);
            return newList;
          });
        }
      }
    };

    // Handle message editing
    const handleMessageEdited = (data: { messageId: string; chatId: string; newText: string; editedAt: Date }) => {
      if (data.chatId === actualChatId) {
        console.log('✏️ Message edited received:', data.messageId);
        setMessages(prev => prev.map(msg => 
          msg.id === data.messageId 
            ? { ...msg, text: data.newText, isEdited: true, editedAt: new Date(data.editedAt) }
            : msg
        ));
      }
    };

    // Handle message deletion
    const handleMessageDeleted = (data: { messageId: string; chatId: string; deleteForEveryone: boolean; deletedBy: string; deletedAt: Date }) => {
      if (data.chatId === actualChatId) {
        console.log('🗑️ Message deleted received:', data.messageId);
        if (data.deleteForEveryone) {
          // Remove message completely for everyone
          setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
        } else {
          // Just hide for current user (this case handled differently in backend)
          setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
        }
      }
    };

    // Add event listeners
    chatService.on('new_message', handleNewMessage);
    chatService.on('message_delivered', handleMessageDelivered);
    chatService.on('message_read', handleMessageRead);
    chatService.on('message_edited', handleMessageEdited);
    chatService.on('message_deleted', handleMessageDeleted);
    chatService.on('typing_update', handleTypingUpdate);
    chatService.on('user_typing', handleUserTyping);

    console.log('✅ Event listeners attached for chat:', actualChatId);

    return () => {
      console.log('🧹 Cleaning up event listeners for chat:', actualChatId);
      chatService.off('new_message', handleNewMessage);
      chatService.off('message_delivered', handleMessageDelivered);
      chatService.off('message_read', handleMessageRead);
      chatService.off('message_edited', handleMessageEdited);
      chatService.off('message_deleted', handleMessageDeleted);
      chatService.off('typing_update', handleTypingUpdate);
      chatService.off('user_typing', handleUserTyping);
    };
  }, [actualChatId, currentUser?.id]);

  // Mark messages as read when screen gets focus
  useFocusEffect(
    React.useCallback(() => {
      const markAsRead = async () => {
        if (actualChatId && messages.length > 0) {
          try {
            console.log('👀 Screen focused, marking messages as read for chat:', actualChatId);
            await chatService.markMessagesAsRead(actualChatId);
          } catch (error) {
            console.error('❌ Error marking messages as read on focus:', error);
          }
        }
      };

      markAsRead();
    }, [actualChatId, messages.length])
  );

  const refreshMessages = async () => {
    try {
      if (!actualChatId) return;
      
      console.log('🔄 Refreshing messages for chat:', actualChatId);
      const messagesData = await chatService.getChatMessages(actualChatId);
      const transformedMessages = messagesData.messages.map((msg: ChatMessage) => ({
        id: msg._id,
        text: msg.content.text,
        timestamp: new Date(msg.createdAt),
        isFromCurrentUser: msg.senderId === currentUser?.id,
        status: msg.status,
        type: msg.messageType as 'text' | 'voice' | 'image' | 'video' | 'document',
        duration: msg.content.duration,
        mediaUrl: msg.content.mediaUrl,
        mediaFilename: msg.content.mediaFilename
      }));
      
      
      setMessages(transformedMessages);
    } catch (error) {
      console.error('❌ Error refreshing messages:', error);
    }
  };

  const handleSend = async () => {
    console.log('🔍 DEBUG: handleSend called');
    console.log('🔍 DEBUG: message length:', message.trim().length);
    console.log('🔍 DEBUG: actualChatId:', actualChatId);
    
    if (message.trim().length === 0 || !actualChatId) {
      console.log('❌ DEBUG: Early return - empty message or no chatId');
      return;
    }

    const messageText = message.trim();
    console.log('💬 Sending message:', messageText);

    // Create optimistic message for instant feedback
    const optimisticMessage: Message = {
      id: 'temp_' + Date.now(), // Temporary ID
      text: messageText,
      timestamp: new Date(),
      isFromCurrentUser: true,
      status: 'sending',
      type: 'text',
      sender: {
        id: currentUser?.id || '',
        name: currentUser ? (currentUser.first_name + ' ' + currentUser.last_name) : 'Unknown',
        profilePhotoUrl: currentUser?.profile_photo_url || ''
      }
    };

    // Add optimistic message immediately
    setMessages(prev => [...prev, optimisticMessage]);

    // Clear input immediately for better UX
    setMessage('');

    // Scroll to bottom immediately
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);

    try {
      // Send to backend
      console.log('📤 Sending message to backend...');
      const sentMessage = await chatService.sendTextMessage(actualChatId, messageText);
      console.log('✅ Message sent successfully:', sentMessage._id);
      
      // Replace optimistic message with real message
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id ? {
          ...optimisticMessage,
          id: sentMessage._id,
          status: 'sent'
        } : msg
      ));

    } catch (error) {
      console.error('❌ Error sending message:', error);
      
      // Remove failed optimistic message
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      
      // Restore input on error
      setMessage(messageText);
      
      showNotification('error', 'Send Failed', 'Could not send message. Please try again.', 'close-circle');
    }
  };

  const handleVoiceCall = () => {
    Alert.alert(
      'Voice Call',
      `Call ${targetUser?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => Alert.alert('Calling...', `Voice call with ${targetUser?.name}`) }
      ]
    );
  };

  const handleMenu = () => {
    Alert.alert(
      'Chat Options',
      'Choose an action:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'View Profile', onPress: () => navigation.navigate('MatchDetail', { match: targetUser, user: currentUser }) },
        { text: 'Block User', style: 'destructive' },
        { text: 'Report', onPress: () => Alert.alert('User reported') }
      ]
    );
  };

  const handleVoiceRecord = async () => {
    if (isRecording && recording) {
      // Stop recording and stop typing
      setIsRecording(false);
      if (actualChatId) {
        chatService.sendTyping(actualChatId, false);
      }
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (uri && actualChatId) {
        console.log('🎤 Sending voice message...');
        try {
          const voiceMessage = await chatService.sendMediaMessage(
            actualChatId,
            {
              uri,
              type: 'audio/m4a',
              name: 'voice.m4a'
            },
            'voice',
            undefined,
            5000 // 5 seconds duration example
          );
          
          console.log('✅ Voice message sent successfully:', voiceMessage._id);
          
          // Message will be added via real-time listener
          // No need to manually add it here to prevent duplicates
          
          // Scroll to bottom
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        } catch (error) {
          console.error('❌ Error sending voice message:', error);
          showNotification('error', 'Voice Message Failed', 'Could not send voice message', 'mic-off');
        }
      }
      
      setRecording(null);
    } else {
      // Start recording
      try {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setRecording(recording);
        setIsRecording(true);
        
        // Start typing indicator for voice recording
        if (actualChatId) {
          chatService.sendTyping(actualChatId, true);
        }
      } catch (error) {
        console.error('❌ Failed to start recording:', error);
        showNotification('error', 'Recording Failed', 'Could not start voice recording', 'mic-off');
      }
    }
  };

  const handleAttachment = async () => {
    if (!actualChatId) return;
    
    Alert.alert(
      'Send Media',
      'Choose media type:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: () => takePhoto() },
        { text: 'Photo Library', onPress: () => pickImage() },
        { text: 'Document', onPress: () => pickDocument() }
      ]
    );
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0] && actualChatId) {
        const asset = result.assets[0];
        const imageMessage = await chatService.sendMediaMessage(actualChatId, {
          uri: asset.uri,
          type: 'image/jpeg',
          name: 'photo.jpg'
        }, 'image');
        
        // Message will be added via real-time listener
      }
    } catch (error) {
      console.error('❌ Error taking photo:', error);
      showNotification('error', 'Camera Error', 'Failed to take photo', 'camera-off');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0] && actualChatId) {
        const asset = result.assets[0];
        const imageMessage = await chatService.sendMediaMessage(actualChatId, {
          uri: asset.uri,
          type: 'image/jpeg',
          name: 'image.jpg'
        }, 'image');
        
        // Message will be added via real-time listener
      }
    } catch (error) {
      console.error('❌ Error picking image:', error);
      showNotification('error', 'Image Error', 'Failed to pick image', 'image-off');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && actualChatId && result.assets && result.assets[0]) {
        const documentMessage = await chatService.sendMediaMessage(actualChatId, {
          uri: result.assets[0].uri,
          type: result.assets[0].mimeType || 'application/octet-stream',
          name: result.assets[0].name || 'document'
        }, 'document');
        
        // Message will be added via real-time listener
      }
    } catch (error) {
      console.error('❌ Error picking document:', error);
      showNotification('error', 'Document Error', 'Failed to pick document', 'document-text-off');
    }
  };

  const pickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        // videoQuality is deprecated, use quality instead
        videoMaxDuration: 60, // 1 minute max
        quality: 0.8
      });

      if (!result.canceled && result.assets[0] && actualChatId) {
        const asset = result.assets[0];
        const videoMessage = await chatService.sendMediaMessage(actualChatId, {
          uri: asset.uri,
          type: 'video/mp4',
          name: 'video.mp4'
        }, 'video');
        
        // Message will be added via real-time listener
      }
    } catch (error) {
      console.error('❌ Error picking video:', error);
      showNotification('error', 'Video Error', 'Failed to pick video', 'videocam-off');
    }
  };

  const recordVideo = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        // videoQuality is deprecated, use quality instead
        videoMaxDuration: 60, // 1 minute max
        quality: 0.8
      });

      if (!result.canceled && result.assets[0] && actualChatId) {
        const asset = result.assets[0];
        const videoMessage = await chatService.sendMediaMessage(actualChatId, {
          uri: asset.uri,
          type: 'video/mp4',
          name: 'recorded_video.mp4'
        }, 'video');
        
        // Message will be added via real-time listener
      }
    } catch (error) {
      console.error('❌ Error recording video:', error);
      showNotification('error', 'Video Recording Error', 'Failed to record video', 'videocam-off');
    }
  };

  const handleVideoCall = () => {
    console.log('🎯 ChatScreen: handleVideoCall button pressed');
    console.log('🎯 ChatScreen: targetUser:', targetUser);
    console.log('🎯 ChatScreen: useWebRTC functions:', { startVoiceCall: typeof startVoiceCall, startVideoCall: typeof startVideoCall });
    
    Alert.alert(
      'Video Call',
      `Video call ${targetUser?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: async () => {
          // Start WebRTC video call
          try {
            console.log('📹 ChatScreen: Starting video call with user:', targetUser?.id, targetUser?.name);
            console.log('📹 ChatScreen: About to call startVideoCall...');
            const success = await startVideoCall(targetUser?.id || '');
            console.log('📹 ChatScreen: Video call result:', success);
            if (success) {
              console.log('📹 Video call started with', targetUser?.name);
              // Show mock call UI only for Expo Go
              if (isExpoGo) {
                setMockCallType('video');
                setShowMockCall(true);
                setMockCallDuration(0);
              }
            } else {
              console.error('📹 Video call failed');
              Alert.alert('Call Failed', 'Unable to start video call. Please check your permissions and try again.');
            }
          } catch (error) {
            console.error('📹 Video call error:', error);
            console.error('📹 Video call error stack:', error instanceof Error ? error.stack : String(error));
            Alert.alert('Call Failed', 'An error occurred while starting the video call.');
          }
        }}
      ]
    );
  };

  const handleCall = () => {
    console.log('🎯 ChatScreen: handleCall button pressed');
    console.log('🎯 ChatScreen: targetUser:', targetUser);
    console.log('🎯 ChatScreen: useWebRTC functions:', { startVoiceCall: typeof startVoiceCall, startVideoCall: typeof startVideoCall });
    
    Alert.alert(
      'Voice Call',
      `Call ${targetUser?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: async () => {
          // Start WebRTC voice call
          try {
            console.log('📞 ChatScreen: Starting voice call with user:', targetUser?.id, targetUser?.name);
            console.log('📞 ChatScreen: About to call startVoiceCall...');
            const success = await startVoiceCall(targetUser?.id || '');
            console.log('📞 ChatScreen: Voice call result:', success);
            if (success) {
              console.log('📞 Voice call started with', targetUser?.name);
              // Show mock call UI only for Expo Go
              if (isExpoGo) {
                setMockCallType('voice');
                setShowMockCall(true);
                setMockCallDuration(0);
              }
            } else {
              console.error('📞 Voice call failed');
              Alert.alert('Call Failed', 'Unable to start voice call. Please check your microphone permissions and try again.');
            }
          } catch (error) {
            console.error('📞 Voice call error:', error);
            console.error('📞 Voice call error stack:', error instanceof Error ? error.stack : String(error));
            Alert.alert('Call Failed', 'An error occurred while starting the voice call.');
          }
        }}
      ]
    );
  };

  // Image viewer functionality  
  const handleImagePress = (imageUrl: string) => {
    // Get all image messages from current chat
    const imageMessages = messages
      .filter(msg => msg.type === 'image' && msg.mediaUrl)
      .map(msg => msg.mediaUrl!)
      .reverse(); // Reverse to show newest first
    
    const currentIndex = imageMessages.indexOf(imageUrl);
    setSelectedImages(imageMessages);
    setCurrentImageIndex(currentIndex >= 0 ? currentIndex : 0);
    setImageViewerVisible(true);
  };

  const closeImageViewer = () => {
    setImageViewerVisible(false);
    setSelectedImages([]);
    setCurrentImageIndex(0);
  };

  const downloadImage = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        showNotification('warning', 'Permission Required', 'Permission to access media library is required to download images.', 'warning');
        return;
      }

      const currentImageUrl = selectedImages[currentImageIndex];
      if (!currentImageUrl) return;

      // Show loading notification
      showNotification('info', 'Downloading...', 'Saving image to your photo library', 'download', 1000);

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `YoFam_image_${timestamp}.jpg`;
      const fileUri = FileSystem.documentDirectory + fileName;

      // Download the image
      const { uri } = await FileSystem.downloadAsync(currentImageUrl, fileUri);
      
      // Save to media library
      await MediaLibrary.saveToLibraryAsync(uri);
      
      showNotification('success', 'Success!', 'Image saved to your photo library', 'checkmark-circle');
    } catch (error) {
      console.error('Error downloading image:', error);
      showNotification('error', 'Download Failed', 'Failed to download image. Please try again.', 'close-circle');
    }
  };

  // Voice message playback functionality
  const handlePlayVoiceMessage = async (messageId: string, audioUrl?: string) => {
    try {
      console.log('🎵 Playing voice message:', messageId, audioUrl);

      // If the same message is playing, stop it
      if (playingMessageId === messageId && playingAudio) {
        await playingAudio.stopAsync();
        await playingAudio.unloadAsync();
        setPlayingAudio(null);
        setPlayingMessageId(null);
        return;
      }

      // Stop any currently playing audio
      if (playingAudio) {
        await playingAudio.stopAsync();
        await playingAudio.unloadAsync();
      }

      if (!audioUrl) {
        showNotification('error', 'Audio Error', 'Audio URL not available', 'volume-off');
        return;
      }

      // Set audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      console.log('🎵 Loading audio from URL:', audioUrl);
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );

      setPlayingAudio(sound);
      setPlayingMessageId(messageId);

      // Set up playback status callback
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish) {
          console.log('🎵 Audio playback finished');
          setPlayingAudio(null);
          setPlayingMessageId(null);
          sound.unloadAsync();
        }
      });

    } catch (error) {
      console.error('❌ Error playing voice message:', error);
      showNotification('error', 'Playback Error', 'Could not play voice message', 'volume-off');
      setPlayingAudio(null);
      setPlayingMessageId(null);
    }
  };

  // Cleanup audio on unmount
  React.useEffect(() => {
    return () => {
      if (playingAudio) {
        playingAudio.unloadAsync();
      }
    };
  }, []);

  // Handle message long press for edit/delete options
  const handleMessageLongPress = (message: Message) => {
    const options = [];
    
    // Only allow editing/deleting own messages
    if (message.isFromCurrentUser) {
      // Only allow editing text messages that haven't been read and within 15 minutes
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      if (message.type === 'text' && 
          message.status !== 'read' && 
          message.timestamp >= fifteenMinutesAgo) {
        options.push({
          text: 'Edit Message',
          onPress: () => handleEditMessage(message)
        });
      }
      
      options.push({
        text: 'Delete Message',
        style: 'destructive' as const,
        onPress: () => handleDeleteMessage(message)
      });
    }
    
    // Always allow copying text messages
    if (message.type === 'text' && message.text) {
      options.push({
        text: 'Copy Text',
        onPress: async () => {
          try {
            await Clipboard.setStringAsync(message.text || '');
            showNotification('success', 'Copied!', 'Message text copied to clipboard', 'copy');
          } catch (error) {
            console.error('❌ Error copying to clipboard:', error);
            showNotification('error', 'Copy Failed', 'Failed to copy text', 'copy-off');
          }
        }
      });
    }
    
    options.push({ text: 'Cancel', style: 'cancel' as const });
    
    Alert.alert('Message Options', 'Choose an action:', options);
  };

  // Handle message editing
  const handleEditMessage = (message: Message) => {
    Alert.prompt(
      'Edit Message',
      'Enter new message text:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Save', 
          onPress: async (newText) => {
            if (newText && newText.trim() !== message.text) {
              try {
                console.log('✏️ Editing message:', message.id, 'new text:', newText);
                await chatService.editMessage(message.id, newText.trim());
                showNotification('success', 'Message Updated', 'Your message has been edited', 'checkmark-circle');
              } catch (error) {
                console.error('❌ Error editing message:', error);
                showNotification('error', 'Edit Failed', 'Failed to edit message', 'close-circle');
              }
            }
          }
        }
      ],
      'plain-text',
      message.text || ''
    );
  };

  // Handle message deletion
  const handleDeleteMessage = (message: Message) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Deleting message:', message.id);
              await chatService.deleteMessage(message.id);
              showNotification('success', 'Message Deleted', 'Message has been removed', 'trash');
            } catch (error) {
              console.error('❌ Error deleting message:', error);
              showNotification('error', 'Delete Failed', 'Failed to delete message', 'close-circle');
            }
          }
        }
      ]
    );
  };



  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      <BackgroundPattern />
      
      <ChatHeader
        targetUser={targetUser}
        onBack={() => navigation.goBack()}
        onCall={handleCall}
        onVideoCall={handleVideoCall}
        onMenu={handleMenu}
        typingUsers={typingUsers}
      />

      <View style={styles.chatContent}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={({ item, index }) => (
            <MessageBubble 
              message={item} 
              index={index}
              onPlayVoice={handlePlayVoiceMessage}
              isPlaying={playingMessageId === item.id}
              onLongPress={() => handleMessageLongPress(item)}
              onImagePress={handleImagePress}
              onSwipeEdit={handleSwipeEdit}
              onSwipeDelete={handleSwipeDelete}
              isEditing={editingMessageId === item.id}
              editingText={editingMessageId === item.id ? editingText : ''}
              onEditTextChange={setEditingText}
              onEditSave={handleEditSave}
              onEditCancel={handleEditCancel}
            />
          )}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          style={styles.modernMessagesList}
          contentContainerStyle={styles.modernMessagesContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          inverted={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={20}
          windowSize={10}
        />
        
        {/* Typing Indicators */}
        {typingUsers.length > 0 && (
          <View style={styles.typingIndicatorContainer}>
            <View style={styles.typingIndicatorBubble}>
              <Text style={styles.typingIndicatorText}>
                {typingUsers.length === 1 
                  ? 'Someone is typing...' 
                  : `${typingUsers.length} people are typing...`
                }
              </Text>
              <View style={styles.typingDots}>
                <View style={[styles.typingDot, styles.dot1]} />
                <View style={[styles.typingDot, styles.dot2]} />
                <View style={[styles.typingDot, styles.dot3]} />
              </View>
            </View>
          </View>
        )}
      </View>

      <ChatInput
        message={message}
        onChangeText={setMessage}
        onSend={handleSend}
        onVoiceRecord={handleVoiceRecord}
        onAttachment={handleAttachment}
        isRecording={isRecording}
        chatId={actualChatId || undefined}
      />

      {/* Enhanced Media Picker */}
      <MediaPicker
        visible={showMediaOptions}
        onClose={() => setShowMediaOptions(false)}
        onTakePhoto={() => { setShowMediaOptions(false); takePhoto(); }}
        onPickImage={() => { setShowMediaOptions(false); pickImage(); }}
        onPickVideo={() => { setShowMediaOptions(false); pickVideo(); }}
        onRecordVideo={() => { setShowMediaOptions(false); recordVideo(); }}
        loading={false}
      />

      {/* Enhanced Full Size Image Viewer Modal */}
      <Modal
        visible={imageViewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageViewer}
      >
        <View style={styles.imageViewerModal}>
          <View style={styles.imageViewerHeader}>
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>
                {selectedImages.length > 1 ? `${currentImageIndex + 1} of ${selectedImages.length}` : ''}
              </Text>
            </View>
            <View style={styles.imageViewerHeaderButtons}>
              <TouchableOpacity
                style={styles.imageViewerActionButton}
                onPress={downloadImage}
              >
                <Ionicons name="download" size={24} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.imageViewerCloseButton}
                onPress={closeImageViewer}
              >
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          {selectedImages.length === 1 ? (
            <TouchableOpacity
              style={styles.imageViewerBackground}
              activeOpacity={1}
              onPress={closeImageViewer}
            >
              <View style={styles.imageViewerContent}>
                <Image
                  source={{ uri: selectedImages[0] }}
                  style={styles.fullSizeImage}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
          ) : (
            <ScrollView
              horizontal
              pagingEnabled
              style={styles.imageViewerPager}
              showsHorizontalScrollIndicator={false}
            >
              {selectedImages.map((imageUrl, index) => (
                <View key={index} style={[styles.imageViewerPage, { width }]}>
                  <TouchableOpacity
                    style={styles.imageViewerBackground}
                    activeOpacity={1}
                    onPress={closeImageViewer}
                  >
                    <View style={styles.imageViewerContent}>
                      <Image
                        source={{ uri: imageUrl }}
                        style={styles.fullSizeImage}
                        resizeMode="contain"
                      />
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Custom Notification */}
      {notification.visible && (
        <View style={[
          styles.customNotification,
          (styles as any)[`notification${notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}`]
        ]}>
          <View style={styles.notificationContent}>
            <View style={styles.notificationIconContainer}>
              <Ionicons 
                name={notification.icon as any || getNotificationIcon(notification.type)} 
                size={24} 
                color="#ffffff" 
              />
            </View>
            <View style={styles.notificationText}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
            </View>
            <TouchableOpacity
              style={styles.notificationClose}
              onPress={hideNotification}
            >
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>
        </View>
      )}
      </KeyboardAvoidingView>
      
      {/* Mock Call UI for Expo Go only */}
      {isExpoGo && (
        <MockCallUI
          visible={showMockCall}
          isVideo={mockCallType === 'video'}
          caller={{
            name: targetUser?.name || 'Unknown',
            profileImage: targetUser?.profilePhotoUrl
          }}
          onEndCall={() => {
            setShowMockCall(false);
            setMockCallDuration(0);
            // endCall function would be implemented here
          }}
          callDuration={mockCallDuration}
        />
      )}
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  
  // ===== MODERN BACKGROUND =====
  modernBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  
  // ===== MODERN HEADER STYLES =====
  modernHeader: {
    paddingTop: StatusBar.currentHeight || 50,
    paddingBottom: 16,
    position: 'relative',
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(252,211,170,0.1)',
  },
  
  modernHeaderBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  
  modernHeaderGradient: {
    flex: 1,
  },
  
  modernHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  
  modernBackButton: {
    marginRight: 16,
  },
  
  modernButtonGlass: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(252,211,170,0.15)',
  },
  
  modernUserInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  modernAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  
  modernAvatarRing: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: 'rgba(252,211,170,0.3)',
    top: -2,
    left: -2,
  },
  
  modernHeaderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#0091ad',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  
  modernHeaderAvatarText: {
    fontSize: 18,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  
  modernOnlineContainer: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modernOnlinePulse: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4ade80',
    opacity: 0.6,
  },
  
  modernOnlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4ade80',
  },
  
  modernHeaderUserDetails: {
    flex: 1,
  },
  
  modernHeaderUserName: {
    fontSize: 18,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginBottom: 2,
  },
  
  modernStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  modernStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  
  modernHeaderUserStatus: {
    fontSize: 13,
    fontFamily: getSystemFont('medium'),
    color: 'rgba(252,211,170,0.8)',
  },
  
  modernHeaderActions: {
    flexDirection: 'row',
    gap: 6,
  },
  
  modernHeaderActionBtn: {
    marginLeft: 4,
  },
  
  modernHeaderBorder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  
  // ===== MODERN MESSAGE STYLES =====
  modernMessageContainer: {
    marginVertical: 4,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  
  modernSentMessage: {
    justifyContent: 'flex-end',
  },
  
  modernReceivedMessage: {
    justifyContent: 'flex-start',
  },
  
  // Message Avatar Styles
  messageAvatar: {
    marginRight: 8,
    marginBottom: 4,
  },
  
  messageAvatarGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  messageAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  
  messageAvatarText: {
    fontSize: 14,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
  },
  
  modernMessageBubble: {
    maxWidth: '80%',
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  
  modernSentBubble: {
    borderBottomRightRadius: 6,
  },
  
  modernReceivedBubble: {
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(252,211,170,0.1)',
  },
  
  modernBubbleGradient: {
    padding: 16,
    paddingBottom: 10,
  },
  
  modernMessageContent: {
    marginBottom: 8,
  },
  
  modernMessageText: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    lineHeight: 22,
  },
  
  modernSentText: {
    color: '#ffffff',
  },
  
  modernReceivedText: {
    color: '#ffffff',
  },
  
  modernMessageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  
  modernMessageTime: {
    fontSize: 11,
    fontFamily: getSystemFont('medium'),
  },
  
  modernSentTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  
  modernReceivedTime: {
    color: 'rgba(255,255,255,0.6)',
  },
  
  modernEditedText: {
    fontSize: 10,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  
  modernMessageStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  modernDoubleCheck: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  modernMessageTail: {
    position: 'absolute',
    bottom: 0,
    width: 12,
    height: 12,
  },
  
  modernSentTail: {
    right: -6,
    backgroundColor: 'rgba(4,167,199,0.8)',
    borderBottomLeftRadius: 12,
  },
  
  modernReceivedTail: {
    left: -6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderBottomRightRadius: 12,
  },
  
  // ===== MODERN VOICE MESSAGE STYLES =====
  modernVoiceMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  
  modernPlayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  
  voiceWaveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  
  voiceWaveBar: {
    width: 3,
    borderRadius: 1.5,
  },
  
  modernVoiceDuration: {
    fontSize: 13,
    fontFamily: getSystemFont('medium'),
  },
  
  // ===== MODERN IMAGE MESSAGE STYLES =====
  modernImageMessage: {
    alignItems: 'center',
    gap: 8,
  },
  
  modernImageContainer: {
    position: 'relative',
  },
  modernChatImage: {
    width: 180,
    height: 120,
    borderRadius: 12,
  } as any,
  
  modernImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  
  modernImageOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    padding: 4,
  },
  
  modernMediaText: {
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
  },
  
  // ===== CHAT CONTENT =====
  chatContent: {
    flex: 1,
    zIndex: 1,
  },
  
  modernMessagesList: {
    flex: 1,
  },
  
  modernMessagesContainer: {
    paddingVertical: 20,
    paddingBottom: 100,
  },
  
  // ===== TYPING INDICATOR STYLES =====
  typingIndicatorContainer: {
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  typingIndicatorBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '80%',
  },
  typingIndicatorText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    marginRight: 8,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    marginHorizontal: 2,
  },
  dot1: {
    // Animation handled via Animated API
  },
  dot2: {
    // Animation handled via Animated API
  },
  dot3: {
    // Animation handled via Animated API
  },
  
  // ===== MODERN INPUT STYLES =====
  modernInputArea: {
    position: 'relative',
    zIndex: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(252,211,170,0.1)',
  },
  
  modernInputBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  
  modernInputGradient: {
    flex: 1,
  },
  
  modernInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  
  modernTextInputContainer: {
    flex: 1,
    borderRadius: 32,
    overflow: 'hidden',
  },
  
  modernTextInputGlass: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingLeft: 16,
    paddingRight: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(252,211,170,0.15)',
    borderRadius: 32,
    minHeight: 52,
  },
  
  inlineAttachmentButton: {
    marginRight: 8,
    marginBottom: 2,
  },
  
  inlineIconBackground: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(252,211,170,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modernTextInput: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: '#ffffff',
    flex: 1,
    maxHeight: 100,
    minHeight: 20,
    paddingVertical: 0,
  },
  
  inlineSendButton: {
    marginLeft: 8,
    marginBottom: 2,
    borderRadius: 18,
    overflow: 'hidden',
  },
  
  inlineSendGradient: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  inlineVoiceButton: {
    marginLeft: 8,
    marginBottom: 2,
    position: 'relative',
  },
  
  inlineRecordingButton: {
    transform: [{ scale: 1.05 }],
  },
  
  inlineRecordingBackground: {
    backgroundColor: 'rgba(255,107,107,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.3)',
  },
  
  inlineRecordingPulse: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,107,107,0.2)',
    top: -6,
    left: -6,
    zIndex: -1,
  },
  
  
  modernInputBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  
  // ===== MODAL STYLES =====
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  mediaOptionsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 20,
    gap: 20,
    borderWidth: 1,
    borderColor: 'rgba(252,211,170,0.2)',
  },
  
  mediaOption: {
    alignItems: 'center',
    gap: 12,
  },
  
  mediaOptionGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  
  mediaOptionText: {
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
    color: '#ffffff',
    textAlign: 'center',
  },
  
  // Enhanced Image Viewer Styles
  imageViewerModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  imageViewerHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  imageCounter: {
    flex: 1,
  },
  imageCounterText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  imageViewerHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageViewerActionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 10,
    marginRight: 10,
  },
  imageViewerCloseButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 10,
  },
  imageViewerBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerPager: {
    flex: 1,
  },
  imageViewerPage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullSizeImage: {
    width: '95%',
    height: '80%',
    maxWidth: width - 20,
  },

  // Custom Notification Styles
  customNotification: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 9999,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  notificationSuccess: {
    backgroundColor: 'rgba(76, 175, 80, 0.95)',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  notificationError: {
    backgroundColor: 'rgba(244, 67, 54, 0.95)',
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  notificationWarning: {
    backgroundColor: 'rgba(255, 152, 0, 0.95)',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  notificationInfo: {
    backgroundColor: 'rgba(33, 150, 243, 0.95)',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
  },
  notificationClose: {
    padding: 4,
    marginLeft: 8,
  },

  // Swipe Action Styles
  swipeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingLeft: 10,
  },
  swipeActionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  editButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },

  // Inline Editing Styles
  modernEditingContainer: {
    position: 'relative',
  },
  modernEditingInput: {
    fontSize: 16,
    lineHeight: 22,
    paddingVertical: 8,
    paddingHorizontal: 4,
    paddingRight: 80, // Space for action buttons
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.3)',
    textAlignVertical: 'top',
    minHeight: 44,
    maxHeight: 120,
  },
  modernSentTextInput: {
    color: '#ffffff',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  modernReceivedTextInput: {
    color: '#0091ad',
    backgroundColor: 'rgba(0,145,173,0.1)',
    borderColor: 'rgba(0,145,173,0.3)',
  },
  modernEditingActions: {
    position: 'absolute',
    right: 8,
    top: '50%',
    transform: [{ translateY: -16 }],
    flexDirection: 'row',
    alignItems: 'center',
  },
  modernEditingAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  modernEditingCancel: {
    backgroundColor: 'rgba(255,107,107,0.2)',
  },
  modernEditingSave: {
    backgroundColor: 'rgba(74,222,128,0.2)',
  },
});

export default ChatScreen;
