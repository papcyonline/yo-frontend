// src/components/communities/CommunityDetailScreen.tsx - Modern Design
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Modal,
  ActionSheetIOS,
  ScrollView,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';
import * as Clipboard from 'expo-clipboard';
import Svg, { Defs, Pattern, Rect, Circle } from 'react-native-svg';
import { getSystemFont } from '../../config/constants';
import { API_CONFIG } from '../../constants/api';
import { useAuthStore } from '../../store/authStore';
import logger from '../../services/LoggingService';

const { width, height } = Dimensions.get('window');

interface CommunityDetailScreenProps {
  navigation: any;
  route: any;
}

interface GroupPost {
  id: string;
  author: {
    name: string;
    initials: string;
    avatar?: string;
    isVerified?: boolean;
  };
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  type?: 'text' | 'image' | 'video' | 'announcement';
  images?: string[];
  video?: {
    uri: string;
    duration: number;
    thumbnail?: string;
  };
  reactions?: {
    emoji: string;
    count: number;
    users: string[];
  }[];
  isEdited?: boolean;
  replyTo?: {
    messageId: string;
    content: string;
    author: string;
    type?: 'text' | 'image' | 'video';
  };
}

interface CommunityMember {
  id: string;
  name: string;
  initials: string;
  role: 'admin' | 'moderator' | 'member';
  joinedDate: string;
}

const CommunityDetailScreen: React.FC<CommunityDetailScreenProps> = ({ navigation, route }) => {
  const { token } = useAuthStore();
  const { match, community, user } = route.params;
  
  const communityData = match || {
    id: community?.id,
    name: community?.name,
    relation: `${community?.memberCount?.toLocaleString() || 0} members`,
    bio: community?.description,
    location: community?.category,
    type: 'community'
  };

  const [newMessage, setNewMessage] = useState('');
  const [isJoined, setIsJoined] = useState(community?.isJoined || true);
  const [refreshing, setRefreshing] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<GroupPost[]>([]);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [showMessageActions, setShowMessageActions] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<GroupPost | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingMessage, setEditingMessage] = useState<GroupPost | null>(null);
  const [editText, setEditText] = useState('');
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [customAlertConfig, setCustomAlertConfig] = useState({
    title: '',
    message: '',
    buttons: [] as Array<{text: string, onPress: () => void, style?: 'default' | 'destructive'}>
  });
  const [replyingTo, setReplyingTo] = useState<GroupPost | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const flatListRef = useRef<FlatList>(null);

  const [communityInfo] = useState({
    id: communityData.id,
    name: communityData.name,
    description: communityData.bio,
    memberCount: parseInt(communityData.relation.split(' ')[0].replace(',', '')) || 0,
    category: communityData.location,
    createdDate: '2024-01-15',
    rules: [
      'Be respectful to all members',
      'No spam or promotional content',
      'Share relevant content only',
      'Help create a positive environment'
    ],
    admins: []
  });

  // Posts - start with empty array
  const [posts, setPosts] = useState<GroupPost[]>([]);

  // Media attachment functions
  const handleImagePicker = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showCustomAlertDialog(
          'Permission Required',
          'Please grant camera roll permissions to attach images.',
          [{ text: 'OK', onPress: () => setShowCustomAlert(false) }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 5,
        quality: 0.8,
        aspect: [4, 3],
        allowsEditing: false,
      });

      if (!result.canceled && result.assets) {
        const images = result.assets.map(asset => asset.uri);
        sendMediaMessage(images, 'image');
      }
    } catch (error) {
      console.error('Error picking images:', error);
      showCustomAlertDialog(
        'Error',
        'Failed to pick images. Please try again.',
        [{ text: 'OK', onPress: () => setShowCustomAlert(false) }]
      );
    }
  };

  const handleVideoPicker = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showCustomAlertDialog(
          'Permission Required',
          'Please grant camera roll permissions to attach videos.',
          [{ text: 'OK', onPress: () => setShowCustomAlert(false) }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: 60, // 1 minute max
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        if (asset.duration && asset.duration > 60000) { // 60 seconds in milliseconds
          showCustomAlertDialog(
            'Video Too Long',
            'Please select a video that is 1 minute or shorter.',
            [{ text: 'OK', onPress: () => setShowCustomAlert(false) }]
          );
          return;
        }
        sendMediaMessage([asset.uri], 'video', {
          duration: asset.duration || 0,
          thumbnail: asset.uri // You might want to generate a proper thumbnail
        });
      }
    } catch (error) {
      console.error('Error picking video:', error);
      showCustomAlertDialog(
        'Error',
        'Failed to pick video. Please try again.',
        [{ text: 'OK', onPress: () => setShowCustomAlert(false) }]
      );
    }
  };

  const handleCameraPicker = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        showCustomAlertDialog(
          'Permission Required',
          'Please grant camera permissions to take photos.',
          [{ text: 'OK', onPress: () => setShowCustomAlert(false) }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        sendMediaMessage([result.assets[0].uri], 'image');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      showCustomAlertDialog(
        'Error',
        'Failed to take photo. Please try again.',
        [{ text: 'OK', onPress: () => setShowCustomAlert(false) }]
      );
    }
  };

  const sendMediaMessage = (mediaUris: string[], type: 'image' | 'video', videoData?: { duration: number; thumbnail?: string }) => {
    const newPost: GroupPost = {
      id: Date.now().toString(),
      author: {
        name: 'You',
        initials: 'YU',
        avatar: undefined
      },
      content: type === 'image' ? `Sent ${mediaUris.length} image${mediaUris.length > 1 ? 's' : ''}` : 'Sent a video',
      timestamp: 'now',
      likes: 0,
      comments: 0,
      isLiked: false,
      type: type,
      ...(type === 'image' ? { images: mediaUris } : {}),
      ...(type === 'video' ? { video: { uri: mediaUris[0], ...videoData } } : {})
    };
    
    setPosts(prev => [...prev, newPost]);
    setShowAttachmentModal(false);
    
    // Scroll to bottom after sending
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const showAttachmentOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Camera', 'Photo Library', 'Video Library'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleCameraPicker();
          } else if (buttonIndex === 2) {
            handleImagePicker();
          } else if (buttonIndex === 3) {
            handleVideoPicker();
          }
        }
      );
    } else {
      setShowAttachmentModal(true);
    }
  };

  // Custom Alert Function
  const showCustomAlertDialog = (title: string, message: string, buttons: Array<{text: string, onPress: () => void, style?: 'default' | 'destructive'}>) => {
    setCustomAlertConfig({ title, message, buttons });
    setShowCustomAlert(true);
  };

  // Message Interaction Handlers
  const handleMessageLongPress = (message: GroupPost) => {
    const isCurrentUser = message.author.name === (user?.name || 'You');
    setSelectedMessage(message);
    
    const actions: Array<{text: string, onPress: () => void, style?: 'default' | 'destructive'}> = [
      {
        text: '↩️ Reply',
        onPress: () => {
          setShowCustomAlert(false);
          handleReplyToMessage(message);
        }
      },
      {
        text: '👍 React',
        onPress: () => {
          setShowCustomAlert(false);
          setShowEmojiPicker(true);
        }
      },
      {
        text: '📋 Copy Text',
        onPress: () => {
          setShowCustomAlert(false);
          handleCopyMessage(message.content);
        }
      },
      {
        text: '➡️ Forward',
        onPress: () => {
          setShowCustomAlert(false);
          handleForwardMessage(message);
        }
      }
    ];

    if (isCurrentUser) {
      actions.push(
        {
          text: '✏️ Edit',
          onPress: () => {
            setShowCustomAlert(false);
            handleEditMessage(message);
          }
        },
        {
          text: '🗑️ Delete',
          onPress: () => {
            setShowCustomAlert(false);
            showCustomAlertDialog(
              'Delete Message',
              'Are you sure you want to delete this message?',
              [
                { text: 'Cancel', onPress: () => setShowCustomAlert(false) },
                { text: 'Delete', onPress: () => handleDeleteMessage(message.id), style: 'destructive' }
              ]
            );
          },
          style: 'destructive' as const
        }
      );
    }

    if (community?.userRole === 'creator' || community?.userRole === 'admin') {
      actions.push({
        text: '📌 Pin Message',
        onPress: () => {
          setShowCustomAlert(false);
          handlePinMessage(message);
        }
      });
    }

    actions.push({
      text: 'Cancel',
      onPress: () => setShowCustomAlert(false)
    });

    showCustomAlertDialog('Message Actions', 'Choose an action for this message', actions);
  };

  const handleReaction = (emoji: string) => {
    if (!selectedMessage) return;
    
    setPosts(prev => prev.map(post => {
      if (post.id === selectedMessage.id) {
        const reactions = post.reactions || [];
        const existingReaction = reactions.find(r => r.emoji === emoji);
        const currentUser = user?.name || 'You';
        
        if (existingReaction) {
          if (existingReaction.users.includes(currentUser)) {
            // Remove user's reaction
            existingReaction.users = existingReaction.users.filter(u => u !== currentUser);
            existingReaction.count = existingReaction.users.length;
            return {
              ...post,
              reactions: reactions.filter(r => r.count > 0)
            };
          } else {
            // Add user's reaction
            existingReaction.users.push(currentUser);
            existingReaction.count = existingReaction.users.length;
            return { ...post, reactions };
          }
        } else {
          // New reaction
          reactions.push({
            emoji,
            count: 1,
            users: [currentUser]
          });
          return { ...post, reactions };
        }
      }
      return post;
    }));
    
    setShowEmojiPicker(false);
    setSelectedMessage(null);
  };

  const handleEditMessage = (message: GroupPost) => {
    setEditingMessage(message);
    setEditText(message.content);
  };

  const handleSaveEdit = () => {
    if (!editingMessage || !editText.trim()) return;
    
    setPosts(prev => prev.map(post => 
      post.id === editingMessage.id 
        ? { ...post, content: editText.trim(), isEdited: true }
        : post
    ));
    
    setEditingMessage(null);
    setEditText('');
  };

  const handleDeleteMessage = (messageId: string) => {
    setPosts(prev => prev.filter(post => post.id !== messageId));
    setShowCustomAlert(false);
  };

  const handleReplyToMessage = (message: GroupPost) => {
    setReplyingTo(message);
    // Focus on input (you might need a ref for TextInput)
  };

  const handleCopyMessage = async (content: string) => {
    try {
      await Clipboard.setStringAsync(content);
      showCustomAlertDialog(
        'Copied!',
        'Message copied to clipboard.',
        [{ text: 'OK', onPress: () => setShowCustomAlert(false) }]
      );
    } catch (error) {
      showCustomAlertDialog(
        'Error',
        'Failed to copy message.',
        [{ text: 'OK', onPress: () => setShowCustomAlert(false) }]
      );
    }
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const jumpToMessage = (messageId: string) => {
    const index = posts.findIndex(post => post.id === messageId);
    if (index !== -1) {
      flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
      // Highlight message briefly
    }
  };

  const handleForwardMessage = (message: GroupPost) => {
    // For now, we'll just copy the message content to share
    // In a full implementation, you'd navigate to a contact/community selector
    showCustomAlertDialog(
      'Forward Message',
      'Message copied to clipboard. You can now paste it in another chat.',
      [
        {
          text: 'Copy & Close',
          onPress: async () => {
            await Clipboard.setStringAsync(message.content);
            setShowCustomAlert(false);
          }
        },
        { text: 'Cancel', onPress: () => setShowCustomAlert(false) }
      ]
    );
  };

  // Simple typing simulation
  const simulateTyping = () => {
    if (newMessage.length > 0 && !typingUsers.includes('You')) {
      setTypingUsers(prev => [...prev, 'You']);
      setTimeout(() => {
        setTypingUsers(prev => prev.filter(user => user !== 'You'));
      }, 2000);
    }
  };

  // Enhanced timestamp formatting
  const formatTimestamp = (timestamp: string | Date) => {
    if (timestamp === 'Just now' || timestamp === 'now') return 'Just now';
    
    const date = typeof timestamp === 'string' ? new Date() : timestamp;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const formatFullTimestamp = (timestamp: string | Date) => {
    if (timestamp === 'Just now' || timestamp === 'now') {
      return new Date().toLocaleString();
    }
    const date = typeof timestamp === 'string' ? new Date() : timestamp;
    return date.toLocaleString();
  };

  // Members - start with empty array
  const [members] = useState<CommunityMember[]>([]);

  useEffect(() => {
    if (community?.isJoined !== undefined) {
      setIsJoined(community.isJoined);
    } else {
      setIsJoined(true);
    }
  }, [community]);

  const handleOptionsPress = () => {
    const isCreator = community?.userRole === 'creator' || community?.isCreatedByUser;
    
    const options: Array<{text: string, onPress: () => void, style?: 'default' | 'destructive'}> = [
      {
        text: '📋 Community Info',
        onPress: () => {
          setShowCustomAlert(false);
          handleOptionSelect(1);
        }
      },
      {
        text: '🔕 Mute Notifications',
        onPress: () => {
          setShowCustomAlert(false);
          handleOptionSelect(2);
        }
      }
    ];

    if (isCreator) {
      options.push({
        text: '🗑️ Delete Community',
        onPress: () => {
          setShowCustomAlert(false);
          handleOptionSelect(3, true);
        },
        style: 'destructive'
      });
    } else {
      options.push({
        text: '🚪 Leave Community',
        onPress: () => {
          setShowCustomAlert(false);
          handleOptionSelect(3, false);
        },
        style: 'destructive'
      });
    }

    options.push({
      text: 'Cancel',
      onPress: () => setShowCustomAlert(false)
    });

    showCustomAlertDialog('Community Options', 'Choose an action for this community', options);
  };

  const handleOptionSelect = (optionIndex: number, isCreator: boolean = false) => {
    switch (optionIndex) {
      case 1:
        // Navigate to community info screen
        navigation.navigate('CommunityInfo', { 
          community: {
            ...communityInfo,
            isJoined,
            userRole: community?.userRole || 'member'
          }
        });
        break;
      case 2:
        // Mute Notifications
        showCustomAlertDialog(
          'Notifications Muted',
          `Notifications have been muted for "${communityInfo.name}". You can unmute them anytime from community settings.`,
          [
            { text: 'OK', onPress: () => setShowCustomAlert(false) }
          ]
        );
        break;
      case 3:
        if (isCreator) {
          handleDeleteCommunity();
        } else {
          handleLeaveCommunity();
        }
        break;
    }
    setShowOptionsModal(false);
  };

  const handleJoinCommunity = () => {
    showCustomAlertDialog(
      'Join Community',
      `Would you like to join ${communityInfo.name}?`,
      [
        { text: 'Cancel', onPress: () => setShowCustomAlert(false) },
        { 
          text: 'Join', 
          onPress: () => {
            setIsJoined(true);
            setShowCustomAlert(false);
            setTimeout(() => {
              showCustomAlertDialog(
                'Welcome! 🎉',
                `You've successfully joined ${communityInfo.name}.`,
                [{ text: 'OK', onPress: () => setShowCustomAlert(false) }]
              );
            }, 300);
          }
        }
      ]
    );
  };

  const handleLeaveCommunity = () => {
    showCustomAlertDialog(
      'Leave Community',
      `Are you sure you want to leave ${communityInfo.name}?`,
      [
        { text: 'Cancel', onPress: () => setShowCustomAlert(false) },
        { 
          text: 'Leave', 
          style: 'destructive',
          onPress: () => {
            setIsJoined(false);
            setShowCustomAlert(false);
            setTimeout(() => {
              showCustomAlertDialog(
                'Left Community',
                'You have left the community.',
                [{ 
                  text: 'OK', 
                  onPress: () => {
                    setShowCustomAlert(false);
                    navigation.goBack();
                  }
                }]
              );
            }, 300);
          }
        }
      ]
    );
  };

  const handleDeleteCommunity = () => {
    showCustomAlertDialog(
      'Delete Community',
      `Are you sure you want to delete "${communityInfo.name}"? This action cannot be undone and will remove all posts and members.`,
      [
        { text: 'Cancel', onPress: () => setShowCustomAlert(false) },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setShowCustomAlert(false);
            if (!token) {
              showCustomAlertDialog(
                'Error',
                'You must be logged in to delete a community',
                [{ text: 'OK', onPress: () => setShowCustomAlert(false) }]
              );
              return;
            }

            if (!communityData.id) {
              showCustomAlertDialog(
                'Error',
                'Community ID not found',
                [{ text: 'OK', onPress: () => setShowCustomAlert(false) }]
              );
              return;
            }

            try {
              logger.debug('Deleting community:', communityData.id);
              
              const response = await fetch(`${API_CONFIG.BASE_URL}/communities/${communityData.id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete community');
              }

              const result = await response.json();
              if (result.success) {
                logger.info('Community deleted successfully');
                showCustomAlertDialog(
                  'Community Deleted',
                  `"${communityInfo.name}" has been permanently deleted.`,
                  [{ 
                    text: 'OK', 
                    onPress: () => {
                      setShowCustomAlert(false);
                      navigation.goBack();
                    }
                  }]
                );
              } else {
                throw new Error(result.error || 'Failed to delete community');
              }
            } catch (error: any) {
              logger.error('Error deleting community:', error);
              showCustomAlertDialog(
                'Error',
                error.message || 'Failed to delete community. Please try again.',
                [{ text: 'OK', onPress: () => setShowCustomAlert(false) }]
              );
            }
          }
        }
      ]
    );
  };

  const handleSendMessage = () => {
    if (!isJoined) {
      showCustomAlertDialog(
        'Join Required',
        'You need to join this community to post messages',
        [{ text: 'OK', onPress: () => setShowCustomAlert(false) }]
      );
      return;
    }

    if (newMessage.trim()) {
      const newPost: GroupPost = {
        id: Date.now().toString(),
        author: {
          name: user?.name || 'You',
          initials: user?.name?.split(' ').map((n: string) => n[0]).join('') || 'U',
          isVerified: false
        },
        content: newMessage.trim(),
        timestamp: 'Just now',
        likes: 0,
        comments: 0,
        isLiked: false,
        type: 'text',
        ...(replyingTo && {
          replyTo: {
            messageId: replyingTo.id,
            content: replyingTo.content.slice(0, 100) + (replyingTo.content.length > 100 ? '...' : ''),
            author: replyingTo.author.name,
            type: replyingTo.type || 'text'
          }
        })
      };
      setPosts(prev => [newPost, ...prev]);
      setNewMessage('');
      setReplyingTo(null);
      
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    }
  };

  const handleLikePost = (postId: string) => {
    if (!isJoined) {
      showCustomAlertDialog(
        'Join Required',
        'You need to join this community to interact with posts',
        [{ text: 'OK', onPress: () => setShowCustomAlert(false) }]
      );
      return;
    }

    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1
          }
        : post
    ));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    const action = isMuted ? 'unmuted' : 'muted';
    const message = isMuted 
      ? `Notifications have been unmuted for "${communityInfo.name}". You will now receive notifications for new messages.`
      : `Notifications have been muted for "${communityInfo.name}". You can unmute them anytime by tapping the notification icon.`;
    
    showCustomAlertDialog(
      `Notifications ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      message,
      [{ text: 'OK', onPress: () => setShowCustomAlert(false) }]
    );
  };

  const renderPost = ({ item: post, index }: { item: GroupPost; index: number }) => {
    const isCurrentUser = post.author.name === (user?.name || 'You');
    
    return (
      <TouchableOpacity 
        style={styles.messageContainer}
        onLongPress={() => handleMessageLongPress(post)}
        activeOpacity={0.95}
      >
        {post.type === 'announcement' && (
          <View style={styles.announcementIndicator}>
            <Ionicons name="megaphone" size={12} color="#fcd3aa" />
            <Text style={styles.announcementLabel}>Announcement</Text>
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          isCurrentUser ? styles.myMessage : styles.otherMessage,
          post.type === 'announcement' && styles.announcementMessage
        ]}>
          {/* Reply Reference */}
          {post.replyTo && (
            <TouchableOpacity 
              style={styles.replyReference}
              onPress={() => jumpToMessage(post.replyTo!.messageId)}
            >
              <View style={styles.replyLine} />
              <View style={styles.replyContent}>
                <Text style={styles.replyAuthor}>{post.replyTo.author}</Text>
                <Text style={styles.replyText} numberOfLines={2}>
                  {post.replyTo.type === 'image' ? '📷 Photo' : 
                   post.replyTo.type === 'video' ? '🎥 Video' : 
                   post.replyTo.content}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          {!isCurrentUser && (
            <TouchableOpacity 
              style={styles.messageHeader}
              onPress={() => navigateToUserChat(post.author.name)}
            >
              <Text style={styles.messageSenderName}>{post.author.name}</Text>
              {post.author.isVerified && (
                <Ionicons name="checkmark-circle" size={12} color="#0091ad" />
              )}
            </TouchableOpacity>
          )}
          
          <Text style={[
            styles.messageText,
            isCurrentUser && styles.myMessageText
          ]}>
            {post.content}
          </Text>
          
          {/* Render Images */}
          {post.type === 'image' && post.images && (
            <View style={styles.imageContainer}>
              {post.images.map((imageUri, index) => (
                <TouchableOpacity key={index} style={styles.imageWrapper}>
                  <Image source={{ uri: imageUri }} style={styles.chatImage} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {/* Render Video */}
          {post.type === 'video' && post.video && (
            <TouchableOpacity style={styles.videoContainer}>
              <Video
                source={{ uri: post.video.uri }}
                style={styles.chatVideo}
                resizeMode="contain"
                shouldPlay={false}
                isLooping={false}
                useNativeControls
              />
              <View style={styles.videoDuration}>
                <Text style={styles.videoDurationText}>
                  {Math.floor((post.video.duration || 0) / 1000)}s
                </Text>
              </View>
            </TouchableOpacity>
          )}
          
          <View style={styles.messageFooter}>
            <TouchableOpacity 
              onPress={() => {
                showCustomAlertDialog(
                  'Message Info',
                  `Sent: ${formatFullTimestamp(post.timestamp)}${
                    post.isEdited ? '\nLast edited: ' + formatFullTimestamp(post.timestamp) : ''
                  }`,
                  [{ text: 'OK', onPress: () => setShowCustomAlert(false) }]
                );
              }}
            >
              <Text style={[
                styles.messageTime,
                isCurrentUser && styles.myMessageTime
              ]}>
                {formatTimestamp(post.timestamp)}{post.isEdited ? ' (edited)' : ''}
              </Text>
            </TouchableOpacity>
            {isCurrentUser && (
              <Ionicons name="checkmark-done" size={14} color="#04a7c7" style={styles.readIndicator} />
            )}
          </View>
          
          {/* Message Reactions */}
          {post.reactions && post.reactions.length > 0 && (
            <View style={styles.messageReactionsContainer}>
              {post.reactions.map((reaction, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.reactionBubble,
                    reaction.users.includes(user?.name || 'You') && styles.reactionBubbleActive
                  ]}
                  onPress={() => {
                    setSelectedMessage(post);
                    handleReaction(reaction.emoji);
                  }}
                >
                  <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                  <Text style={[
                    styles.reactionCount,
                    reaction.users.includes(user?.name || 'You') && styles.reactionCountActive
                  ]}>
                    {reaction.count}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        
        {!isCurrentUser && (
          <View style={styles.messageReactions}>
            <TouchableOpacity
              style={[
                styles.reactionButton,
                post.isLiked && styles.reactionButtonActive
              ]}
              onPress={() => handleLikePost(post.id)}
            >
              <Ionicons
                name={post.isLiked ? "heart" : "heart-outline"}
                size={14}
                color={post.isLiked ? "#ff6b6b" : "rgba(255,255,255,0.5)"}
              />
              {post.likes > 0 && (
                <Text style={styles.reactionCount}>{post.likes}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // UNUSED FUNCTION REMOVED

  // UNUSED FUNCTION REMOVED

  const scrollToPinnedMessage = (messageId: string) => {
    const index = posts.findIndex(post => post.id === messageId);
    if (index !== -1) {
      flatListRef.current?.scrollToIndex({ index, animated: true });
    }
  };

  const handlePinMessage = (post: GroupPost) => {
    setPinnedMessages([post]);
    showCustomAlertDialog(
      'Message Pinned',
      'This message has been pinned to the top',
      [{ text: 'OK', onPress: () => setShowCustomAlert(false) }]
    );
  };

  const navigateToUserChat = (userName: string) => {
    // Navigate to existing chat page with the user
    navigation.navigate('ChatScreen', { 
      match: {
        id: userName,
        name: userName,
        type: 'personal'
      }
    });
  };

  // Modern Background Pattern
  const renderBackground = () => (
    <View style={styles.backgroundPattern}>
      <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
        <Defs>
          <Pattern
            id="communityBg"
            patternUnits="userSpaceOnUse"
            width="25"
            height="25"
          >
            <Circle
              cx="12.5"
              cy="12.5"
              r="1"
              fill="rgba(252, 211, 170, 0.03)"
            />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#communityBg)" />
      </Svg>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {renderBackground()}
      
      {/* Modern Header */}
      <View style={styles.modernHeader}>
        <TouchableOpacity
          style={styles.modernBackButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fcd3aa" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.modernHeaderInfo}
          onPress={() => {
            // Navigate to community info screen
            navigation.navigate('CommunityInfo', { 
              community: {
                ...communityInfo,
                isJoined,
                userRole: community?.userRole || 'member'
              }
            });
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.modernHeaderTitle} numberOfLines={1}>{communityInfo.name}</Text>
          <Text style={styles.modernHeaderSubtitle}>
            {communityInfo.memberCount.toLocaleString()} members • {communityInfo.category}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.modernHeaderButton}
          onPress={handleMuteToggle}
        >
          <Ionicons 
            name={isMuted ? "notifications-off" : "notifications-outline"} 
            size={24} 
            color={isMuted ? "#ff6b6b" : "#fcd3aa"} 
          />
        </TouchableOpacity>
      </View>
      
      {/* Join Bar - Only show if not joined */}
      {!isJoined && (
        <View style={styles.joinBar}>
          <Text style={styles.joinBarText}>Join this community to participate</Text>
          <TouchableOpacity 
            style={styles.joinBarButton}
            onPress={handleJoinCommunity}
          >
            <Text style={styles.joinBarButtonText}>Join</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Pinned Messages Section */}
      {pinnedMessages.length > 0 && (
        <View style={styles.pinnedSection}>
          <View style={styles.pinnedHeader}>
            <Ionicons name="pin" size={14} color="#fcd3aa" />
            <Text style={styles.pinnedTitle}>Pinned Message</Text>
          </View>
          <TouchableOpacity 
            style={styles.pinnedMessage}
            onPress={() => scrollToPinnedMessage(pinnedMessages[0].id)}
          >
            <Text style={styles.pinnedAuthor}>{pinnedMessages[0].author.name}</Text>
            <Text style={styles.pinnedContent} numberOfLines={1}>
              {pinnedMessages[0].content}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Messages List */}
      <View style={styles.content}>
        {isJoined ? (
          <FlatList
            ref={flatListRef}
            data={posts}
            renderItem={renderPost}
            keyExtractor={(item) => item.id}
            style={styles.contentList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.postsContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#0091ad']}
                tintColor="#0091ad"
                progressBackgroundColor="#000000"
              />
            }
          />
        ) : (
          <View style={styles.lockedContent}>
            <LinearGradient
              colors={['#0091ad30', '#04a7c730']}
              style={styles.lockedIcon}
            >
              <Ionicons name="lock-closed" size={48} color="#fcd3aa" />
            </LinearGradient>
            <Text style={styles.lockedTitle}>Community Chat</Text>
            <Text style={styles.lockedText}>
              Join this community to view and participate in discussions
            </Text>
          </View>
        )}
      </View>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <View style={styles.typingIndicator}>
          <View style={styles.typingDots}>
            <View style={[styles.typingDot, styles.typingDot1]} />
            <View style={[styles.typingDot, styles.typingDot2]} />
            <View style={[styles.typingDot, styles.typingDot3]} />
          </View>
          <Text style={styles.typingText}>
            {typingUsers.length === 1 
              ? `${typingUsers[0]} is typing...` 
              : `${typingUsers.length} people are typing...`}
          </Text>
        </View>
      )}

      {/* Reply Bar */}
      {replyingTo && (
        <View style={styles.replyBar}>
          <View style={styles.replyIndicator} />
          <View style={styles.replyBarContent}>
            <Text style={styles.replyBarTitle}>Replying to {replyingTo.author.name}</Text>
            <Text style={styles.replyBarText} numberOfLines={1}>
              {replyingTo.type === 'image' ? '📷 Photo' : 
               replyingTo.type === 'video' ? '🎥 Video' : 
               replyingTo.content}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.replyBarClose}
            onPress={handleCancelReply}
          >
            <Ionicons name="close" size={20} color="#cccccc" />
          </TouchableOpacity>
        </View>
      )}

      {/* Message Input */}
      {isJoined && (
        <View style={styles.messageInputContainer}>
          <View style={styles.inputRow}>
            <TouchableOpacity
              style={styles.attachmentButton}
              onPress={showAttachmentOptions}
            >
              <Ionicons name="add" size={24} color="#04a7c7" />
            </TouchableOpacity>
            
            <TextInput
              style={styles.messageInput}
              placeholder="Share with the community..."
              placeholderTextColor="#666666"
              value={newMessage}
              onChangeText={(text) => {
                setNewMessage(text);
                simulateTyping();
              }}
              multiline
              maxLength={500}
            />
            
            <TouchableOpacity
              style={[
                styles.sendButton,
                { opacity: newMessage.trim() ? 1 : 0.5 }
              ]}
              onPress={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              <LinearGradient
                colors={['#0091ad', '#04a7c7']}
                style={styles.sendButtonGradient}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color="#ffffff"
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Options Modal */}
      <Modal
        visible={showOptionsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => setShowOptionsModal(false)}
        >
          <View style={styles.optionsModal}>
            <TouchableOpacity 
              style={styles.optionItem}
              onPress={() => handleOptionSelect(1)}
            >
              <Ionicons name="information-circle-outline" size={24} color="#0091ad" />
              <Text style={styles.optionText}>Community Info</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.optionItem}
              onPress={() => handleOptionSelect(2)}
            >
              <Ionicons name="notifications-off-outline" size={24} color="#cccccc" />
              <Text style={styles.optionText}>Mute Notifications</Text>
            </TouchableOpacity>
            
            {(() => {
              const isCreator = community?.userRole === 'creator' || community?.isCreatedByUser;
              return (
                <TouchableOpacity 
                  style={[styles.optionItem, styles.destructiveOption]}
                  onPress={() => handleOptionSelect(3, isCreator)}
                >
                  <Ionicons 
                    name={isCreator ? "trash-outline" : "exit-outline"} 
                    size={24} 
                    color="#ff6b6b" 
                  />
                  <Text style={[styles.optionText, styles.destructiveText]}>
                    {isCreator ? "Delete Community" : "Leave Community"}
                  </Text>
                </TouchableOpacity>
              );
            })()}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Custom Alert Modal */}
      <Modal
        visible={showCustomAlert}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCustomAlert(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.customAlert}>
            <Text style={styles.alertTitle}>{customAlertConfig.title}</Text>
            {customAlertConfig.message ? (
              <Text style={styles.alertMessage}>{customAlertConfig.message}</Text>
            ) : null}
            
            <View style={styles.alertButtons}>
              {customAlertConfig.buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.alertButton,
                    button.style === 'destructive' && styles.alertButtonDestructive,
                    index === customAlertConfig.buttons.length - 1 && styles.alertButtonLast
                  ]}
                  onPress={button.onPress}
                >
                  <Text style={[
                    styles.alertButtonText,
                    button.style === 'destructive' && styles.alertButtonTextDestructive
                  ]}>
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Emoji Picker Modal */}
      <Modal
        visible={showEmojiPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEmojiPicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => setShowEmojiPicker(false)}
        >
          <View style={styles.emojiPicker}>
            <Text style={styles.emojiPickerTitle}>Choose Reaction</Text>
            <View style={styles.emojiGrid}>
              {['👍', '❤️', '😂', '😢', '😠', '😲', '🔥', '🎉'].map((emoji, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.emojiOption}
                  onPress={() => handleReaction(emoji)}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Message Modal */}
      <Modal
        visible={!!editingMessage}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setEditingMessage(null);
          setEditText('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModal}>
            <Text style={styles.editModalTitle}>Edit Message</Text>
            <TextInput
              style={styles.editInput}
              value={editText}
              onChangeText={setEditText}
              multiline
              placeholder="Type your message..."
              placeholderTextColor="#666666"
              maxLength={500}
              autoFocus
            />
            <View style={styles.editModalButtons}>
              <TouchableOpacity
                style={[styles.editButton, styles.editButtonCancel]}
                onPress={() => {
                  setEditingMessage(null);
                  setEditText('');
                }}
              >
                <Text style={styles.editButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.editButton,
                  styles.editButtonSave,
                  { opacity: editText.trim() ? 1 : 0.5 }
                ]}
                onPress={handleSaveEdit}
                disabled={!editText.trim()}
              >
                <Text style={styles.editButtonTextSave}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Attachment Modal for Android */}
      <Modal
        visible={showAttachmentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAttachmentModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => setShowAttachmentModal(false)}
        >
          <View style={styles.attachmentModal}>
            <Text style={styles.modalTitle}>Add Attachment</Text>
            
            <TouchableOpacity 
              style={styles.attachmentOption}
              onPress={handleCameraPicker}
            >
              <Ionicons name="camera-outline" size={24} color="#04a7c7" />
              <Text style={styles.attachmentOptionText}>Camera</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.attachmentOption}
              onPress={handleImagePicker}
            >
              <Ionicons name="images-outline" size={24} color="#04a7c7" />
              <Text style={styles.attachmentOptionText}>Photo Library</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.attachmentOption}
              onPress={handleVideoPicker}
            >
              <Ionicons name="videocam-outline" size={24} color="#04a7c7" />
              <Text style={styles.attachmentOptionText}>Video Library</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelOption}
              onPress={() => setShowAttachmentModal(false)}
            >
              <Text style={styles.cancelOptionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  
  // Background Pattern
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  
  // Modern Header
  modernHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  
  modernBackButton: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(252, 211, 170, 0.08)',
  },
  
  modernHeaderInfo: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  
  modernHeaderTitle: {
    fontSize: 20,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 2,
  },
  
  modernHeaderSubtitle: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: 'rgba(252, 211, 170, 0.7)',
    textAlign: 'center',
  },
  
  modernHeaderButton: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(252, 211, 170, 0.08)',
  },
  
  // Join Bar
  joinBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 145, 173, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 145, 173, 0.2)',
  },
  
  joinBarText: {
    fontSize: 13,
    fontFamily: getSystemFont('medium'),
    color: 'rgba(255, 255, 255, 0.8)',
  },
  
  joinBarButton: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#0091ad',
  },
  
  joinBarButtonText: {
    fontSize: 12,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
  },
  
  // Pinned Messages
  pinnedSection: {
    backgroundColor: 'rgba(252, 211, 170, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(252, 211, 170, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  
  pinnedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  
  pinnedTitle: {
    fontSize: 11,
    fontFamily: getSystemFont('semiBold'),
    color: '#fcd3aa',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  
  pinnedMessage: {
    paddingVertical: 4,
  },
  
  pinnedAuthor: {
    fontSize: 11,
    fontFamily: getSystemFont('semiBold'),
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  
  pinnedContent: {
    fontSize: 12,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255, 255, 255, 0.6)',
  },
  
  // Modern Tabs
  modernTabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(252, 211, 170, 0.08)',
    marginBottom: 16,
  },
  
  modernTab: {
    flex: 1,
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  
  modernActiveTab: {
    backgroundColor: 'rgba(252, 211, 170, 0.08)',
  },
  
  modernTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 6,
  },
  
  modernTabText: {
    fontSize: 13,
    fontFamily: getSystemFont('medium'),
    color: 'rgba(255, 255, 255, 0.6)',
  },
  
  modernActiveTabText: {
    color: '#fcd3aa',
    fontFamily: getSystemFont('semiBold'),
  },
  
  modernTabBadge: {
    backgroundColor: 'rgba(0, 145, 173, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  
  modernTabBadgeText: {
    fontSize: 10,
    fontFamily: getSystemFont('semiBold'),
    color: '#0091ad',
  },
  
  modernTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 2,
    backgroundColor: '#fcd3aa',
    borderRadius: 1,
  },
  content: {
    flex: 1,
  },
  contentList: {
    flex: 1,
  },
  lockedContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  lockedIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  lockedTitle: {
    fontSize: 20,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  lockedText: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 24,
  },
  postsContent: {
    padding: 16,
    paddingBottom: 120,
  },
  // Chat Message Styles
  messageContainer: {
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 2,
  },
  
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#0091ad',
    borderBottomRightRadius: 4,
  },
  
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomLeftRadius: 4,
  },
  
  announcementMessage: {
    backgroundColor: 'rgba(252, 211, 170, 0.12)',
    borderColor: 'rgba(252, 211, 170, 0.3)',
    borderWidth: 1,
    maxWidth: '90%',
  },
  
  announcementIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: 'rgba(252, 211, 170, 0.1)',
    borderRadius: 10,
  },
  
  announcementLabel: {
    fontSize: 10,
    fontFamily: getSystemFont('semiBold'),
    color: '#fcd3aa',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  
  messageSenderName: {
    fontSize: 12,
    fontFamily: getSystemFont('semiBold'),
    color: '#fcd3aa',
    marginRight: 4,
  },
  
  messageText: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: '#ffffff',
    lineHeight: 20,
  },
  
  myMessageText: {
    color: '#ffffff',
  },
  
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  
  messageTime: {
    fontSize: 10,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255, 255, 255, 0.4)',
  },
  
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  
  readIndicator: {
    marginLeft: 2,
  },
  
  messageReactions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginLeft: 12,
  },
  
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    gap: 3,
  },
  
  reactionButtonActive: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
  },
  
  reactionCount: {
    fontSize: 11,
    fontFamily: getSystemFont('medium'),
    color: 'rgba(255, 255, 255, 0.6)',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  authorInitials: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
  },
  postInfo: {
    flex: 1,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  postTimestamp: {
    fontSize: 12,
    fontFamily: getSystemFont('regular'),
    color: '#999999',
    marginTop: 2,
  },
  postMenuButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postContent: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: '#cccccc',
    lineHeight: 20,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
  },
  actionText: {
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
    color: '#cccccc',
    marginLeft: 4,
  },
  likedText: {
    color: '#ff6b6b',
  },
  membersContent: {
    padding: 16,
    paddingBottom: 120,
  },
  membersHeader: {
    marginBottom: 16,
  },
  membersCount: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#fcd3aa',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberInitials: {
    fontSize: 18,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
    marginBottom: 4,
  },
  memberRole: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  roleIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  roleText: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: '#cccccc',
    textTransform: 'capitalize',
  },
  joinedDate: {
    fontSize: 11,
    fontFamily: getSystemFont('regular'),
    color: '#999999',
  },
  memberActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  memberActionGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aboutContainer: {
    padding: 16,
    paddingBottom: 120,
  },
  aboutSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  aboutTitle: {
    fontSize: 18,
    fontFamily: getSystemFont('bold'),
    color: '#fcd3aa',
    marginBottom: 12,
  },
  aboutDescription: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: '#cccccc',
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: getSystemFont('bold'),
    color: '#0091ad',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: '#cccccc',
    textAlign: 'center',
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  ruleNumber: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
    color: '#0091ad',
    marginRight: 8,
    minWidth: 20,
  },
  ruleText: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: '#cccccc',
    flex: 1,
    lineHeight: 20,
  },
  messageInputContainer: {
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333333',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    maxHeight: 100,
    marginRight: 12,
    backgroundColor: '#000000',
    color: '#ffffff',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsModal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 8,
    margin: 20,
    minWidth: 250,
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  destructiveOption: {
    backgroundColor: '#ff6b6b20',
  },
  optionText: {
    fontSize: 16,
    fontFamily: getSystemFont('medium'),
    color: '#ffffff',
    marginLeft: 12,
  },
  destructiveText: {
    color: '#ff6b6b',
  },
  attachmentButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  attachmentModal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    minWidth: 280,
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: getSystemFont('semibold'),
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  attachmentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  attachmentOptionText: {
    fontSize: 16,
    fontFamily: getSystemFont('medium'),
    color: '#ffffff',
    marginLeft: 12,
  },
  cancelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
    backgroundColor: '#ff6b6b20',
  },
  cancelOptionText: {
    fontSize: 16,
    fontFamily: getSystemFont('medium'),
    color: '#ff6b6b',
  },
  imageContainer: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  imageWrapper: {
    borderRadius: 8,
    overflow: 'hidden',
    flex: 1,
    minWidth: '48%',
    maxWidth: '100%',
  },
  chatImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  videoContainer: {
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  chatVideo: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  videoDuration: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoDurationText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
  },
  // Message Reactions
  messageReactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  reactionBubbleActive: {
    backgroundColor: 'rgba(4, 167, 199, 0.2)',
    borderColor: '#04a7c7',
  },
  reactionEmoji: {
    fontSize: 12,
  },
  reactionCount: {
    fontSize: 11,
    fontFamily: getSystemFont('medium'),
    color: '#cccccc',
    marginLeft: 2,
  },
  reactionCountActive: {
    color: '#04a7c7',
  },
  // Custom Alert Styles
  customAlert: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    minWidth: 280,
    maxWidth: 350,
    borderWidth: 2,
    borderColor: '#04a7c7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  alertTitle: {
    fontSize: 20,
    fontFamily: getSystemFont('bold'),
    color: '#fcd3aa',
    textAlign: 'center',
    marginBottom: 8,
  },
  alertMessage: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  alertButtons: {
    gap: 8,
  },
  alertButton: {
    backgroundColor: 'rgba(4, 167, 199, 0.15)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#04a7c7',
  },
  alertButtonDestructive: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderColor: '#ff6b6b',
  },
  alertButtonLast: {
    marginTop: 4,
    backgroundColor: 'transparent',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  alertButtonText: {
    fontSize: 16,
    fontFamily: getSystemFont('semibold'),
    color: '#04a7c7',
    textAlign: 'center',
  },
  alertButtonTextDestructive: {
    color: '#ff6b6b',
  },
  // Emoji Picker Styles
  emojiPicker: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    borderWidth: 2,
    borderColor: '#fcd3aa',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  emojiPickerTitle: {
    fontSize: 18,
    fontFamily: getSystemFont('bold'),
    color: '#fcd3aa',
    textAlign: 'center',
    marginBottom: 20,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  emojiOption: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(4, 167, 199, 0.1)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#04a7c7',
  },
  emojiText: {
    fontSize: 24,
  },
  // Edit Modal Styles
  editModal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    borderWidth: 2,
    borderColor: '#0091ad',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  editModalTitle: {
    fontSize: 18,
    fontFamily: getSystemFont('bold'),
    color: '#fcd3aa',
    textAlign: 'center',
    marginBottom: 16,
  },
  editInput: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: '#ffffff',
    maxHeight: 120,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  editModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  editButtonCancel: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  editButtonSave: {
    backgroundColor: 'rgba(4, 167, 199, 0.2)',
    borderColor: '#04a7c7',
  },
  editButtonTextCancel: {
    fontSize: 16,
    fontFamily: getSystemFont('medium'),
    color: '#cccccc',
    textAlign: 'center',
  },
  editButtonTextSave: {
    fontSize: 16,
    fontFamily: getSystemFont('semibold'),
    color: '#04a7c7',
    textAlign: 'center',
  },
  // Reply Styles
  replyReference: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 8,
    opacity: 0.8,
  },
  replyLine: {
    width: 3,
    backgroundColor: '#04a7c7',
    borderRadius: 2,
    marginRight: 8,
  },
  replyContent: {
    flex: 1,
    paddingVertical: 2,
  },
  replyAuthor: {
    fontSize: 12,
    fontFamily: getSystemFont('semibold'),
    color: '#04a7c7',
    marginBottom: 2,
  },
  replyText: {
    fontSize: 13,
    fontFamily: getSystemFont('regular'),
    color: '#999999',
    fontStyle: 'italic',
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(4, 167, 199, 0.1)',
    borderTopWidth: 1,
    borderTopColor: '#04a7c7',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  replyIndicator: {
    width: 3,
    height: 40,
    backgroundColor: '#04a7c7',
    borderRadius: 2,
    marginRight: 12,
  },
  replyBarContent: {
    flex: 1,
  },
  replyBarTitle: {
    fontSize: 13,
    fontFamily: getSystemFont('semibold'),
    color: '#04a7c7',
    marginBottom: 2,
  },
  replyBarText: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: '#cccccc',
  },
  replyBarClose: {
    padding: 4,
  },
  // Typing Indicator Styles
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(4, 167, 199, 0.05)',
  },
  typingDots: {
    flexDirection: 'row',
    marginRight: 8,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#04a7c7',
    marginHorizontal: 1,
  },
  typingDot1: {
    animationDelay: '0s',
  },
  typingDot2: {
    animationDelay: '0.2s',
  },
  typingDot3: {
    animationDelay: '0.4s',
  },
  typingText: {
    fontSize: 13,
    fontFamily: getSystemFont('regular'),
    color: '#04a7c7',
    fontStyle: 'italic',
  },
});

export default CommunityDetailScreen;