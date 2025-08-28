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
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Pattern, Rect, Circle } from 'react-native-svg';
import { getSystemFont } from '../../config/constants';

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
  type?: 'text' | 'image' | 'announcement';
  images?: string[];
}

interface CommunityMember {
  id: string;
  name: string;
  initials: string;
  role: 'admin' | 'moderator' | 'member';
  joinedDate: string;
}

const CommunityDetailScreen: React.FC<CommunityDetailScreenProps> = ({ navigation, route }) => {
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
  const [activeTab, setActiveTab] = useState<'posts' | 'members' | 'about'>('posts');
  const [showOptionsModal, setShowOptionsModal] = useState(false);
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
    admins: ['Sarah Ahmed', 'Mohammed Khan']
  });

  // Simplified posts - only 2 examples
  const [posts, setPosts] = useState<GroupPost[]>([
    {
      id: '1',
      author: { 
        name: 'Ahmed Al-Mansouri', 
        initials: 'AM',
        isVerified: true 
      },
      content: 'Welcome to our community! 🎉 Feel free to share your experiences and connect with fellow members.',
      timestamp: '2 hours ago',
      likes: 24,
      comments: 8,
      isLiked: false,
      type: 'announcement'
    },
    {
      id: '2',
      author: { 
        name: 'Sarah Khan', 
        initials: 'SK',
        isVerified: false 
      },
      content: 'Just organized a meetup for next weekend at Dubai Marina! 🌊 Who\'s interested in joining us?',
      timestamp: '4 hours ago',
      likes: 18,
      comments: 12,
      isLiked: true,
      type: 'text'
    }
  ]);

  // Simplified members - only 2 examples
  const [members] = useState<CommunityMember[]>([
    {
      id: '1',
      name: 'Sarah Ahmed',
      initials: 'SA',
      role: 'admin',
      joinedDate: '2024-01-15'
    },
    {
      id: '2',
      name: 'Mohammed Khan',
      initials: 'MK',
      role: 'member',
      joinedDate: '2024-01-20'
    }
  ]);

  useEffect(() => {
    if (community?.isJoined !== undefined) {
      setIsJoined(community.isJoined);
    } else {
      setIsJoined(true);
    }
  }, [community]);

  const handleOptionsPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Community Info', 'Mute Notifications', 'Leave Community'],
          destructiveButtonIndex: 3,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          handleOptionSelect(buttonIndex);
        }
      );
    } else {
      setShowOptionsModal(true);
    }
  };

  const handleOptionSelect = (optionIndex: number) => {
    switch (optionIndex) {
      case 1:
        setActiveTab('about');
        break;
      case 2:
        Alert.alert('Notifications', 'Notifications muted for this community');
        break;
      case 3:
        handleLeaveCommunity();
        break;
    }
    setShowOptionsModal(false);
  };

  const handleJoinCommunity = () => {
    Alert.alert(
      'Join Community',
      `Would you like to join ${communityInfo.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Join', 
          onPress: () => {
            setIsJoined(true);
            Alert.alert('Welcome! 🎉', `You've successfully joined ${communityInfo.name}.`);
          }
        }
      ]
    );
  };

  const handleLeaveCommunity = () => {
    Alert.alert(
      'Leave Community',
      `Are you sure you want to leave ${communityInfo.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave', 
          style: 'destructive',
          onPress: () => {
            setIsJoined(false);
            Alert.alert('Left Community', 'You have left the community.');
            navigation.goBack();
          }
        }
      ]
    );
  };

  const handleSendMessage = () => {
    if (!isJoined) {
      Alert.alert('Join Required', 'You need to join this community to post messages');
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
        type: 'text'
      };
      setPosts(prev => [newPost, ...prev]);
      setNewMessage('');
      
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    }
  };

  const handleLikePost = (postId: string) => {
    if (!isJoined) {
      Alert.alert('Join Required', 'You need to join this community to interact with posts');
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

  const renderPost = ({ item: post, index }: { item: GroupPost; index: number }) => (
    <View style={[
      styles.postCard,
      post.type === 'announcement' && styles.announcementCard
    ]}>
      {post.type === 'announcement' && (
        <View style={styles.announcementBadge}>
          <LinearGradient
            colors={['#fcd3aa', '#0091ad']}
            style={styles.announcementBadgeGradient}
          >
            <Ionicons name="megaphone" size={14} color="#ffffff" />
            <Text style={styles.announcementText}>Announcement</Text>
          </LinearGradient>
        </View>
      )}
      
      <View style={styles.postHeader}>
        <LinearGradient
          colors={index % 2 === 0 ? ['#0091ad', '#04a7c7'] : ['#04a7c7', '#fcd3aa']}
          style={styles.authorAvatar}
        >
          <Text style={styles.authorInitials}>{post.author.initials}</Text>
        </LinearGradient>
        <View style={styles.postInfo}>
          <View style={styles.authorRow}>
            <Text style={styles.authorName}>{post.author.name}</Text>
            {post.author.isVerified && (
              <Ionicons name="checkmark-circle" size={16} color="#0091ad" style={styles.verifiedIcon} />
            )}
          </View>
          <Text style={styles.postTimestamp}>{post.timestamp}</Text>
        </View>
        
        <TouchableOpacity style={styles.postMenuButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#fcd3aa" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.postContent}>{post.content}</Text>
      
      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLikePost(post.id)}
        >
          <Ionicons
            name={post.isLiked ? "heart" : "heart-outline"}
            size={20}
            color={post.isLiked ? "#ff6b6b" : "#cccccc"}
          />
          <Text style={[styles.actionText, post.isLiked && styles.likedText]}>
            {post.likes}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={20} color="#cccccc" />
          <Text style={styles.actionText}>{post.comments}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={20} color="#cccccc" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMember = ({ item: member, index }: { item: CommunityMember; index: number }) => (
    <View style={styles.memberCard}>
      <LinearGradient
        colors={index % 2 === 0 ? ['#0091ad', '#04a7c7'] : ['#04a7c7', '#fcd3aa']}
        style={styles.memberAvatar}
      >
        <Text style={styles.memberInitials}>{member.initials}</Text>
      </LinearGradient>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{member.name}</Text>
        <View style={styles.memberRole}>
          <View style={[
            styles.roleIndicator,
            { backgroundColor: member.role === 'admin' ? '#0091ad' : '#04a7c7' }
          ]} />
          <Text style={styles.roleText}>{member.role.charAt(0).toUpperCase() + member.role.slice(1)}</Text>
        </View>
        <Text style={styles.joinedDate}>Joined {member.joinedDate}</Text>
      </View>
      <TouchableOpacity style={styles.memberActionButton}>
        <LinearGradient
          colors={['#0091ad30', '#04a7c730']}
          style={styles.memberActionGradient}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#0091ad" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderAboutSection = () => (
    <View style={styles.aboutContainer}>
      <View style={styles.aboutSection}>
        <Text style={styles.aboutTitle}>About</Text>
        <Text style={styles.aboutDescription}>{communityInfo.description}</Text>
      </View>

      <View style={styles.aboutSection}>
        <Text style={styles.aboutTitle}>Community Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{communityInfo.memberCount.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{posts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{communityInfo.category}</Text>
            <Text style={styles.statLabel}>Category</Text>
          </View>
        </View>
      </View>

      <View style={styles.aboutSection}>
        <Text style={styles.aboutTitle}>Community Rules</Text>
        {communityInfo.rules.map((rule, index) => (
          <View key={index} style={styles.ruleItem}>
            <Text style={styles.ruleNumber}>{index + 1}.</Text>
            <Text style={styles.ruleText}>{rule}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'posts':
        return isJoined ? (
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
            <Text style={styles.lockedTitle}>Community Posts</Text>
            <Text style={styles.lockedText}>
              Join this community to view and participate in discussions
            </Text>
          </View>
        );
      
      case 'members':
        return (
          <FlatList
            data={members}
            renderItem={renderMember}
            keyExtractor={(item) => item.id}
            style={styles.contentList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.membersContent}
            ListHeaderComponent={() => (
              <View style={styles.membersHeader}>
                <Text style={styles.membersCount}>{members.length} members</Text>
              </View>
            )}
          />
        );
      
      case 'about':
        return renderAboutSection();
      
      default:
        return null;
    }
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
        
        <View style={styles.modernHeaderInfo}>
          <Text style={styles.modernHeaderTitle} numberOfLines={1}>{communityInfo.name}</Text>
          <Text style={styles.modernHeaderSubtitle}>
            {communityInfo.memberCount.toLocaleString()} members • {communityInfo.category}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.modernHeaderButton}
          onPress={handleOptionsPress}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color="#fcd3aa" />
        </TouchableOpacity>
      </View>
      
      {/* Community Hero Card */}
      <View style={styles.modernHeroCard}>
        <LinearGradient
          colors={['rgba(0, 145, 173, 0.08)', 'rgba(4, 167, 199, 0.04)', 'transparent']}
          style={styles.heroCardGradient}
        >
          <View style={styles.modernHeroContent}>
            <View style={styles.modernCommunityIcon}>
              <LinearGradient
                colors={['#0091ad', '#04a7c7', '#fcd3aa']}
                style={styles.communityIconGradient}
              >
                <Ionicons name="people" size={32} color="#ffffff" />
              </LinearGradient>
            </View>
            
            <View style={styles.heroTextSection}>
              <Text style={styles.heroTitle}>{communityInfo.name}</Text>
              <Text style={styles.heroDescription} numberOfLines={2}>
                {communityInfo.description}
              </Text>
              
              <View style={styles.heroStats}>
                <View style={styles.heroStatItem}>
                  <Ionicons name="people" size={16} color="#0091ad" />
                  <Text style={styles.heroStatText}>{communityInfo.memberCount.toLocaleString()}</Text>
                </View>
                <View style={styles.heroStatItem}>
                  <Ionicons name="chatbubbles" size={16} color="#04a7c7" />
                  <Text style={styles.heroStatText}>{posts.length} posts</Text>
                </View>
                <View style={styles.heroStatItem}>
                  <Ionicons name="calendar" size={16} color="#fcd3aa" />
                  <Text style={styles.heroStatText}>Since 2024</Text>
                </View>
              </View>
            </View>
            
            {!isJoined && (
              <TouchableOpacity 
                style={styles.modernJoinButton}
                onPress={handleJoinCommunity}
              >
                <LinearGradient
                  colors={['#0091ad', '#04a7c7']}
                  style={styles.joinButtonGradient}
                >
                  <Ionicons name="add" size={18} color="#ffffff" />
                  <Text style={styles.modernJoinText}>Join</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </View>

      {/* Modern Tabs */}
      <View style={styles.modernTabsContainer}>
        {[
          { key: 'posts', label: 'Posts', icon: 'chatbubbles', count: posts.length },
          { key: 'members', label: 'Members', icon: 'people', count: members.length },
          { key: 'about', label: 'About', icon: 'information-circle' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.modernTab,
              activeTab === tab.key && styles.modernActiveTab
            ]}
            onPress={() => setActiveTab(tab.key as 'posts' | 'members' | 'about')}
          >
            <View style={styles.modernTabContent}>
              <Ionicons 
                name={tab.icon as any} 
                size={18} 
                color={activeTab === tab.key ? '#0091ad' : 'rgba(255, 255, 255, 0.6)'}
              />
              <Text style={[
                styles.modernTabText,
                activeTab === tab.key && styles.modernActiveTabText
              ]}>
                {tab.label}
              </Text>
              {tab.count !== undefined && (
                <View style={styles.modernTabBadge}>
                  <Text style={styles.modernTabBadgeText}>{tab.count}</Text>
                </View>
              )}
            </View>
            {activeTab === tab.key && <View style={styles.modernTabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>

      {/* Message Input */}
      {isJoined && activeTab === 'posts' && (
        <View style={styles.messageInputContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.messageInput}
              placeholder="Share with the community..."
              placeholderTextColor="#666666"
              value={newMessage}
              onChangeText={setNewMessage}
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
            
            <TouchableOpacity 
              style={[styles.optionItem, styles.destructiveOption]}
              onPress={() => handleOptionSelect(3)}
            >
              <Ionicons name="exit-outline" size={24} color="#ff6b6b" />
              <Text style={[styles.optionText, styles.destructiveText]}>Leave Community</Text>
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
  
  // Modern Hero Card
  modernHeroCard: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(252, 211, 170, 0.08)',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  
  heroCardGradient: {
    padding: 20,
  },
  
  modernHeroContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  modernCommunityIcon: {
    marginRight: 16,
  },
  
  communityIconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#0091ad',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  
  heroTextSection: {
    flex: 1,
    marginRight: 12,
  },
  
  heroTitle: {
    fontSize: 18,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginBottom: 4,
  },
  
  heroDescription: {
    fontSize: 13,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
    marginBottom: 12,
  },
  
  heroStats: {
    flexDirection: 'row',
    gap: 16,
  },
  
  heroStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  
  heroStatText: {
    fontSize: 11,
    fontFamily: getSystemFont('medium'),
    color: 'rgba(255, 255, 255, 0.8)',
  },
  
  modernJoinButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#0091ad',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  
  joinButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 6,
  },
  
  modernJoinText: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
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
  postCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  announcementCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#fcd3aa',
  },
  announcementBadge: {
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  announcementBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  announcementText: {
    fontSize: 12,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
    marginLeft: 4,
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
});

export default CommunityDetailScreen;