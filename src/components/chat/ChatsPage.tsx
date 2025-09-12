// src/screens/ChatsPage.tsx
import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  FlatList,
  Image
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Pattern, Rect, Circle } from 'react-native-svg';
import { BottomNavigation } from '../../components/dashboard/BottomNavigation';
import { getSystemFont } from '../../config/constants';
import { chatService, Chat, useChat } from '../../services/ChatService';
import { useUnreadChats } from '../../hooks/useUnreadChats';
import { getBestAvatarUrl } from '../../utils/imageHelpers';
import { formatChatListTime } from '../../utils/formatting';

// Utility function to format chat list time
const formatTime = (date: Date): string => {
  return formatChatListTime(date);
};

interface ChatsPageProps {
  navigation: any;
  route: any;
}

interface ChatItem {
  id: string;
  user: {
    id: string;
    name: string;
    initials: string;
    isOnline: boolean;
    profileImage?: string;
  };
  lastMessage: {
    text: string;
    timestamp: Date;
    isFromCurrentUser: boolean;
    type: 'text' | 'voice' | 'image';
  };
  unreadCount: number;
  isArchived?: boolean;
}

// Modern Sleek Chat Card Component
const ChatItemCard: React.FC<{
  chat: ChatItem;
  onPress: () => void;
  onLongPress?: () => void;
  index: number;
}> = ({ chat, onPress, onLongPress, index }) => {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const getLastMessagePreview = () => {
    switch (chat.lastMessage.type) {
      case 'voice':
        return 'Voice message';
      case 'image':
        return 'Photo';
      default:
        return chat.lastMessage.text;
    }
  };

  const getAvatarGradient = (index: number): readonly [string, string, ...string[]] => {
    const gradients: readonly [string, string, ...string[]][] = [
      ['#0091ad', '#04a7c7'],
      ['#04a7c7', '#fcd3aa'],
      ['#fcd3aa', '#0091ad'],
      ['#0091ad', '#fcd3aa']
    ];
    return gradients[index % gradients.length];
  };

  return (
    <TouchableOpacity 
      style={styles.modernChatCard}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.92}
    >
      {/* Enhanced Avatar with Gradient */}
      <View style={styles.modernAvatarContainer}>
        <LinearGradient
          colors={getAvatarGradient(index)}
          style={styles.modernAvatarGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {(() => {
            const avatarUrl = getBestAvatarUrl(chat.user);
            return avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.modernAvatarImage}
                onError={() => console.log('❌ Chat avatar failed to load:', avatarUrl)}
              />
            ) : (
              <Text style={styles.modernAvatarText}>{chat.user.initials}</Text>
            );
          })()}
        </LinearGradient>
        
        {/* Elegant Online Status */}
        {chat.user.isOnline && (
          <View style={styles.modernOnlineRing}>
            <View style={styles.modernOnlineDot} />
          </View>
        )}
        
        {/* Unread Count on Avatar */}
        {chat.unreadCount > 0 && (
          <View style={styles.modernUnreadBadge}>
            <Text style={styles.modernUnreadText}>
              {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
            </Text>
          </View>
        )}
      </View>
      
      {/* Content Section */}
      <View style={styles.modernContentSection}>
        {/* Top Row - Name and Time */}
        <View style={styles.modernTopRow}>
          <Text style={styles.modernUserName} numberOfLines={1}>
            {chat.user.name}
          </Text>
          <View style={styles.modernTimeContainer}>
            <Text style={styles.modernTime}>{formatTime(chat.lastMessage.timestamp)}</Text>
            {chat.lastMessage.isFromCurrentUser && (
              <Ionicons 
                name={chat.unreadCount > 0 ? "checkmark-done" : "checkmark-done"} 
                size={14} 
                color={chat.unreadCount > 0 ? "#999999" : "#4ade80"} 
                style={styles.modernReadIcon} 
              />
            )}
          </View>
        </View>
        
        {/* Message Row with Type Icon */}
        <View style={styles.modernMessageRow}>
          <View style={styles.modernMessageContent}>
            {chat.lastMessage.type !== 'text' && (
              <View style={styles.modernMessageTypeIcon}>
                <Ionicons 
                  name={chat.lastMessage.type === 'voice' ? 'mic' : 'image'} 
                  size={14} 
                  color="#04a7c7" 
                />
              </View>
            )}
            <Text 
              style={[
                styles.modernMessageText,
                chat.unreadCount > 0 && styles.modernUnreadMessageText
              ]} 
              numberOfLines={1}
            >
              {chat.lastMessage.isFromCurrentUser && 'You: '}
              {getLastMessagePreview()}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Right Arrow */}
      <View style={styles.modernArrowContainer}>
        <Ionicons 
          name="chevron-forward" 
          size={18} 
          color={chat.unreadCount > 0 ? '#fcd3aa' : 'rgba(255, 255, 255, 0.3)'} 
        />
      </View>
    </TouchableOpacity>
  );
};

// Empty State Component
const EmptyChatsState: React.FC = () => (
  <View style={styles.emptyState}>
    <View style={styles.emptyIconContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color="rgba(252, 211, 170, 0.3)" />
    </View>
    <Text style={styles.emptyTitle}>No Chats Yet</Text>
    <Text style={styles.emptyDescription}>
      Start connecting with family members and friends to begin conversations
    </Text>
  </View>
);

// Main Component
const ChatsPage: React.FC<ChatsPageProps> = ({ navigation, route }) => {
  const { user } = route.params || {};
  const { connect } = useChat();
  const [refreshing, setRefreshing] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState('chats');
  const { unreadCount } = useUnreadChats();

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecentChats();
    setRefreshing(false);
  };

  const handleChatPress = (chat: ChatItem) => {
    navigation.navigate('ChatScreen', {
      targetUser: chat.user,
      currentUser: user,
      chatId: chat.id
    });
  };

  const handleChatLongPress = (chat: ChatItem) => {
    // Handle long press actions (delete, archive, etc.)
    console.log('Long pressed chat:', chat.id);
  };

  const handleBottomTabPress = (tabId: string) => {
    setActiveBottomTab(tabId);
    switch (tabId) {
      case 'family': navigation.navigate('Dashboard', { user }); break;
      case 'friends': navigation.navigate('FriendsPage', { user }); break;
      case 'community': navigation.navigate('CommunityPage', { user }); break;
      case 'chats': break; // Stay on current page
      case 'settings': navigation.navigate('SettingsPage', { user }); break;
      default: navigation.navigate('Dashboard', { user }); break;
    }
  };

  // Recent chats data from API
  const [recentChats, setRecentChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load recent chats from API
  React.useEffect(() => {
    const initializeChats = async () => {
      try {
        connect();
        await loadRecentChats();
      } catch (error) {
        console.error('❌ Error initializing chats:', error);
      }
    };

    initializeChats();

    // Set up real-time listeners for chat updates
    const handleNewMessage = (data: { message: any; chat: any }) => {
      console.log('📨 New message received in ChatsPage, refreshing...');
      loadRecentChats();
    };

    const handleChatUpdated = (data: { chatId: string; updatedAt: Date; unreadCounts: Array<{ userId: string; unreadCount: number }> }) => {
      console.log('💬 Chat updated in ChatsPage, refreshing...');
      loadRecentChats();
    };

    const handleMessageRead = (data: { messageId: string; chatId: string; readBy: string; readAt: Date }) => {
      console.log('👀 Message read in ChatsPage, refreshing...');
      loadRecentChats();
    };

    // Listen to real-time events
    chatService.on('new_message', handleNewMessage);
    chatService.on('chat_updated', handleChatUpdated);
    chatService.on('message_read', handleMessageRead);
    
    // Cleanup listeners on unmount
    return () => {
      chatService.off('new_message', handleNewMessage);
      chatService.off('chat_updated', handleChatUpdated);
      chatService.off('message_read', handleMessageRead);
    };
  }, []); // Remove dependencies to prevent reconnection loop

  // Refresh chats when screen comes into focus (when returning from chat)
  const loadRecentChats = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📋 ChatsPage: Loading recent chats...');
      
      const chatsData = await chatService.getChats();
      console.log('✅ Loaded chats:', chatsData.chats.length);
      
      // Transform chats data to match component interface
      const transformedChats = chatsData.chats.map((chat: Chat) => {
        const otherParticipant = chat.otherParticipant;
        const lastMessage = chat.lastMessage;
        
        return {
          id: chat._id,
          user: {
            id: otherParticipant?._id || 'unknown',
            name: otherParticipant?.name || 'Unknown User',
            initials: otherParticipant?.name.split(' ').map(n => n[0]).join('') || 'UU',
            isOnline: otherParticipant?.isOnline || false,
            profileImage: (otherParticipant as any)?.profile_photo_url || (otherParticipant as any)?.profile_picture_url || (otherParticipant as any)?.profilePhotoUrl || (otherParticipant as any)?.avatarUrl
          },
          lastMessage: lastMessage ? {
            text: lastMessage.text || 'New chat',
            timestamp: new Date(lastMessage.timestamp),
            isFromCurrentUser: lastMessage.senderId === user?.id,
            type: lastMessage.messageType as 'text' | 'voice' | 'image' || 'text'
          } : {
            text: 'Start a conversation...',
            timestamp: new Date(chat.createdAt),
            isFromCurrentUser: false,
            type: 'text' as const
          },
          unreadCount: chat.unreadCount || 0
        };
      });
      
      setRecentChats(transformedChats);
    } catch (error) {
      console.error('❌ Error loading recent chats:', error);
      setRecentChats([]);
    } finally {
      setLoading(false);
    }
  }, []); // Wrap in useCallback to prevent loops

  // Refresh chats when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('📋 ChatsPage focused, refreshing chats...');
      loadRecentChats();
    }, [loadRecentChats])
  );

  const renderBackground = () => (
    <View style={styles.dottedBackground}>
      <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
        <Defs>
          <Pattern
            id="chatsDots"
            patternUnits="userSpaceOnUse"
            width="20"
            height="20"
          >
            <Circle
              cx="10"
              cy="10"
              r="1"
              fill="rgba(252, 211, 170, 0.05)"
            />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#chatsDots)" />
      </Svg>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderBackground()}
      
      {/* Modern Header */}
      <View style={styles.modernHeader}>
        <TouchableOpacity style={styles.modernBackButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fcd3aa" />
        </TouchableOpacity>
        <View style={styles.modernHeaderContent}>
          <Text style={styles.modernHeaderTitle}>Messages</Text>
          <Text style={styles.modernHeaderSubtitle}>
            {recentChats.filter(chat => chat.unreadCount > 0).length} unread
          </Text>
        </View>
        <TouchableOpacity style={styles.modernSearchButton}>
          <Ionicons name="search" size={24} color="#fcd3aa" />
        </TouchableOpacity>
      </View>

      {/* Compact Stats Row */}
      <View style={styles.compactStatsRow}>
        <View style={styles.compactStatChip}>
          <Text style={styles.compactStatText}>{recentChats.length} Total</Text>
        </View>
        <View style={styles.compactStatChip}>
          <Text style={styles.compactStatText}>
            {recentChats.reduce((sum, chat) => sum + chat.unreadCount, 0)} Unread
          </Text>
        </View>
        <View style={styles.compactStatChip}>
          <Text style={styles.compactStatText}>
            {recentChats.filter(chat => chat.user.isOnline).length} Online
          </Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0091ad']}
            tintColor="#0091ad"
            progressBackgroundColor="#000000"
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.chatsContainer}>
          {recentChats.length === 0 ? (
            <EmptyChatsState />
          ) : (
            recentChats.map((item, index) => (
              <View key={item.id} style={styles.cleanChatItemContainer}>
                <ChatItemCard
                  chat={item}
                  onPress={() => handleChatPress(item)}
                  onLongPress={() => handleChatLongPress(item)}
                  index={index}
                />
                {/* Divider */}
                {index < recentChats.length - 1 && (
                  <View style={styles.chatDivider}>
                    <LinearGradient
                      colors={['transparent', 'rgba(252, 211, 170, 0.25)', 'rgba(0, 145, 173, 0.15)', 'transparent']}
                      style={styles.chatDividerGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    />
                  </View>
                )}
              </View>
            ))
          )}
        </View>
        <View style={styles.bottomSpacing} />
      </ScrollView>

      <BottomNavigation
        activeTab="chats"
        navigation={navigation}
        chatCount={unreadCount}
        communityNotifications={0}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  
  // Dotted Background
  dottedBackground: {
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
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(252, 211, 170, 0.08)',
  },
  
  modernBackButton: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(252, 211, 170, 0.08)',
  },
  
  modernHeaderContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  
  modernHeaderTitle: {
    fontSize: 26,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    textAlign: 'center',
  },
  
  modernHeaderSubtitle: {
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
    color: 'rgba(252, 211, 170, 0.7)',
    textAlign: 'center',
    marginTop: 2,
  },
  
  modernSearchButton: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(252, 211, 170, 0.08)',
  },
  
  // Compact Stats Row
  compactStatsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 6,
    justifyContent: 'space-between',
    gap: 8,
  },
  
  compactStatChip: {
    flex: 1,
    backgroundColor: 'rgba(252, 211, 170, 0.08)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  
  compactStatText: {
    fontSize: 12,
    fontFamily: getSystemFont('semiBold'),
    color: '#fcd3aa',
  },
  
  // Content
  content: {
    flex: 1,
    zIndex: 1,
  },
  
  scrollContent: {
    paddingBottom: 20,
  },
  
  chatsContainer: {
    paddingVertical: 12,
  },
  
  // ===== MODERN SLEEK CHAT STYLES =====
  
  cleanChatItemContainer: {
    backgroundColor: 'transparent',
  },
  
  modernChatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(252, 211, 170, 0.06)',
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  
  // Modern Avatar with Gradient
  modernAvatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  
  modernAvatarGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#0091ad',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  
  modernAvatarText: {
    fontSize: 18,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  modernAvatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  
  modernOnlineRing: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modernOnlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4ade80',
  },
  
  modernUnreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#fcd3aa',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
    elevation: 4,
  },
  
  modernUnreadText: {
    fontSize: 10,
    fontFamily: getSystemFont('bold'),
    color: '#000000',
  },
  
  // Content Section
  modernContentSection: {
    flex: 1,
    paddingRight: 8,
  },
  
  modernTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  
  modernUserName: {
    fontSize: 17,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    flex: 1,
    marginRight: 12,
  },
  
  modernTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  
  modernTime: {
    fontSize: 13,
    fontFamily: getSystemFont('medium'),
    color: 'rgba(252, 211, 170, 0.7)',
  },
  
  modernReadIcon: {
    marginLeft: 2,
  },
  
  modernMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  modernMessageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  modernMessageTypeIcon: {
    marginRight: 6,
    width: 16,
    alignItems: 'center',
  },
  
  modernMessageText: {
    fontSize: 15,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255, 255, 255, 0.75)',
    flex: 1,
    lineHeight: 20,
  },
  
  modernUnreadMessageText: {
    fontFamily: getSystemFont('semiBold'),
    color: '#fcd3aa',
  },
  
  modernArrowContainer: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Chat Dividers (simplified)
  chatDivider: {
    height: 1,
    marginHorizontal: 32,
    marginVertical: 0,
  },
  
  chatDividerGradient: {
    flex: 1,
    height: '100%',
    borderRadius: 0.5,
  },
  
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(252, 211, 170, 0.05)', // Updated to cream tint
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: getSystemFont('bold'),
    color: '#fcd3aa', // Updated to cream color
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(252, 211, 170, 0.6)', // Updated to cream with opacity
    textAlign: 'center',
    lineHeight: 24,
  },
  
  bottomSpacing: {
    height: 100,
  },
});

export default ChatsPage;