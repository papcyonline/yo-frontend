// src/screens/FriendsPage.tsx - Updated with black background and custom colors
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Pattern, Rect, Circle } from 'react-native-svg';
import { BottomNavigation } from '../../components/dashboard/BottomNavigation';
import { ConnectionService } from '../../services/connectionService';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config/constants';
import { matchingAPI } from '../../services/matchingAPI';
import { useUnreadChats } from '../../hooks/useUnreadChats';
import { getBestAvatarUrl } from '../../utils/imageHelpers';

interface FriendsPageProps {
  navigation: any;
  route: any;
}

// Clean Elegant Friend Card Component
const FriendCard: React.FC<{
  friend: any;
  onPress: () => void;
  onChatPress: () => void;
  onAddPress?: () => void;
  showAddButton?: boolean;
  index: number;
}> = ({ friend, onPress, onChatPress, onAddPress, showAddButton = false, index }) => (
  <TouchableOpacity 
    style={styles.cleanFriendCard}
    onPress={onPress}
    activeOpacity={0.95}
  >
    {/* Left Side - Clean Avatar */}
    <View style={styles.avatarSection}>
      <View style={[styles.cleanAvatar, { backgroundColor: index % 2 === 0 ? '#0091ad' : '#04a7c7' }]}>
        {(() => {
          const avatarUrl = getBestAvatarUrl(friend);
          return avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={styles.cleanAvatarImage}
              onError={() => {/* Avatar load error */}}
            />
          ) : (
            <Text style={styles.cleanAvatarText}>{friend.initials}</Text>
          );
        })()}
        
        {/* Online Status */}
        {!showAddButton && (
          <View style={styles.onlineStatus} />
        )}
      </View>
    </View>
    
    {/* Center - Clean Information Layout */}
    <View style={styles.infoSection}>
      <View style={styles.nameAndMutualSection}>
        <Text style={styles.cleanFriendName}>{friend.name}</Text>
        <Text style={styles.cleanMutualText}>
          {showAddButton && friend.matchScore 
            ? `${friend.matchScore}% match` 
            : `${friend.mutualFriends} mutual`}
        </Text>
      </View>
      
      <Text style={styles.cleanBio} numberOfLines={1}>
        {friend.bio}
      </Text>
      
      <View style={styles.metaInfo}>
        <View style={styles.locationInfo}>
          <Ionicons name="location" size={11} color="#0091ad" />
          <Text style={styles.locationText}>{friend.location}</Text>
        </View>
        {showAddButton ? (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        ) : (
          <View style={styles.friendTag}>
            <Text style={styles.friendTagText}>FRIEND</Text>
          </View>
        )}
      </View>
    </View>
    
    {/* Right Side - Clean Actions */}
    <View style={styles.actionSection}>
      {showAddButton ? (
        <TouchableOpacity style={styles.addAction} activeOpacity={0.8} onPress={onAddPress}>
          <Ionicons name="person-add" size={20} color="#0091ad" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          style={styles.chatAction} 
          onPress={() => {
            console.log('🎯 FRIEND CHAT ICON CLICKED - This should go to ChatScreen');
            onChatPress();
          }} 
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubble-ellipses" size={18} color="#fcd3aa" />
        </TouchableOpacity>
      )}
    </View>
  </TouchableOpacity>
);

// My Friends Tab with Dividers
const MyFriends: React.FC<{
  friends: any[];
  onFriendPress: (friend: any) => void;
  onChatPress: (friend: any) => void;
}> = ({ friends, onFriendPress, onChatPress }) => {
  if (friends.length === 0) {
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="people-outline" size={48} color="rgba(252, 211, 170, 0.3)" />
        </View>
        <Text style={styles.emptyTitle}>No Friends Yet</Text>
        <Text style={styles.emptyDescription}>
          You haven't added any friends yet. Discover people you might know!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.modernTabContent}>
      {friends.map((friend, index) => (
        <View key={friend.id} style={styles.modernFriendItem}>
          <FriendCard
            friend={friend}
            onPress={() => onFriendPress(friend)}
            onChatPress={() => onChatPress(friend)}
            showAddButton={false}
            index={index}
          />
          {/* Enhanced Visible Divider */}
          {index < friends.length - 1 && (
            <View style={styles.friendDivider}>
              <LinearGradient
                colors={['transparent', 'rgba(252, 211, 170, 0.25)', 'rgba(0, 145, 173, 0.15)', 'transparent']}
                style={styles.dividerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
          )}
        </View>
      ))}
    </View>
  );
};

// AI Matched Friends Tab with Dividers
const AIMatchedFriends: React.FC<{
  suggestions: any[];
  onFriendPress: (friend: any) => void;
  onChatPress: (friend: any) => void;
  onAddPress: (friend: any) => void;
}> = ({ suggestions, onFriendPress, onChatPress, onAddPress }) => {
  // Component rendering with suggestions

  if (!suggestions || suggestions.length === 0) {
    // No suggestions to display
    return (
      <View style={styles.modernTabContent}>
        <View style={styles.aiMatchHeader}>
          <View style={styles.aiIconContainer}>
            <Ionicons name="sparkles" size={20} color="#fcd3aa" />
          </View>
          <Text style={styles.aiMatchText}>AI Potential Friend Suggestions</Text>
        </View>
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="search-outline" size={48} color="rgba(252, 211, 170, 0.3)" />
          </View>
          <Text style={styles.emptyTitle}>No AI Matches Found</Text>
          <Text style={styles.emptyDescription}>
            We're still analyzing profiles to find your perfect matches. Check back soon!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.modernTabContent}>
      <View style={styles.aiMatchHeader}>
        <View style={styles.aiIconContainer}>
          <Ionicons name="sparkles" size={20} color="#fcd3aa" />
        </View>
        <Text style={styles.aiMatchText}>AI Potential Friend Suggestions ({suggestions.length})</Text>
      </View>
      {suggestions.map((friend, index) => {
        // Rendering friend card
        return (
          <View key={friend.id || `friend-${index}`} style={styles.modernFriendItem}>
            <FriendCard
              friend={friend}
              onPress={() => onFriendPress(friend)}
              onChatPress={() => onChatPress(friend)}
              onAddPress={() => onAddPress(friend)}
              showAddButton={true}
              index={index}
            />
            {/* Enhanced Visible Divider */}
            {index < suggestions.length - 1 && (
              <View style={styles.friendDivider}>
                <LinearGradient
                  colors={['transparent', 'rgba(252, 211, 170, 0.25)', 'rgba(0, 145, 173, 0.15)', 'transparent']}
                  style={styles.dividerGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};

// Main Component
const FriendsPage: React.FC<FriendsPageProps> = ({ navigation, route }) => {
  const authStore = useAuthStore();
  const user = authStore.user; // Use auth store user like Dashboard
  const { token } = authStore;
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [activeBottomTab, setActiveBottomTab] = useState('friends');

  const tabs = ['My Friends', 'AI Potential Match'];

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFriendsData();
    setRefreshing(false);
  };

  const handleFriendRequestsPress = () => {
    navigation.navigate('FriendRequests', { user });
  };

  const handleFriendPress = (friend: any) => {
    navigation.navigate('MatchDetail', { 
      match: {
        id: friend.id,
        name: friend.name,
        initials: friend.initials,
        relation: `${friend.mutualFriends} mutual connections`,
        bio: friend.bio,
        location: friend.location,
        type: 'friend'
      },
      user 
    });
  };

  const handleChatPress = (friend: any) => {
    try {
      navigation.navigate('ChatScreen', {
        targetUser: {
          id: friend.id,
          name: friend.name,
          initials: friend.initials,
          isOnline: true,
          profileImage: friend.profileImage
        },
        currentUser: user,
        chatId: `chat_${user.id}_${friend.id}`
      });
    } catch (error) {
      console.error('Chat navigation error:', error);
    }
  };

  const handleAddFriend = async (friend: any) => {
    try {
      await ConnectionService.sendFriendRequest(
        friend.id,
        `Hi ${friend.name}! I'd love to connect with you based on our ${friend.matchScore}% match. ${friend.relation || 'Friend match'}`
      );
      
      // Show success message
      Alert.alert(
        'Friend Request Sent!',
        `Your friend request has been sent to ${friend.name}. You'll be notified when they respond.`,
        [{ text: 'OK' }]
      );

      // Refresh the data to update any UI changes
      await loadFriendsData();
    } catch (error) {
      console.error('Error sending friend request:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send friend request';
      Alert.alert('Request Failed', errorMessage, [{ text: 'Try Again' }]);
    }
  };

  const handleBottomTabPress = (tabId: string) => {
    setActiveBottomTab(tabId);
    switch (tabId) {
      case 'family': navigation.navigate('MainApp', { user }); break; // Navigate to Dashboard (MainApp)
      case 'friends': break; // Stay on current Friends screen
      case 'community': navigation.navigate('Communities', { user, fromBottomNav: true }); break;
      case 'chats': navigation.navigate('ChatsPage', { user }); break;
      case 'settings': navigation.navigate('Settings', { user }); break;
      default: navigation.navigate('MainApp', { user }); break; // Navigate to Dashboard (MainApp)
    }
  };

  // Friends data from API
  const [allFriends, setAllFriends] = useState<any[]>([]);
  const [friendSuggestions, setFriendSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { unreadCount } = useUnreadChats();

  // Load friends and suggestions from API
  React.useEffect(() => {
    loadFriendsData();
  }, []);

  // Refresh friends list when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadFriendsData();
    }, [])
  );

  const loadFriendsData = async () => {
    try {
      setLoading(true);
      // Loading friends data
      
      // Load confirmed friends from friends API
      const friendsResponse = await fetch(`${API_BASE_URL}/friends`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Friends API response received

      if (friendsResponse.ok) {
        const friendsResult = await friendsResponse.json();
        // Processing friends response
        
        if (friendsResult.success && friendsResult.data.friends) {
          // Transform friends data to match component interface
          const transformedFriends = friendsResult.data.friends.map((friend: any) => ({
            id: friend.id,
            name: friend.fullName,
            initials: `${friend.firstName[0]}${friend.lastName[0]}`,
            bio: friend.bio || 'YoFam member',
            location: friend.location || 'Unknown location',
            mutualFriends: 0, // We'll calculate this later if needed
            isFriend: true
          }));
          setAllFriends(transformedFriends);
        } else {
          setAllFriends([]);
        }
      } else {
        console.error('❌ Failed to fetch friends:', friendsResponse.status);
        setAllFriends([]);
      }

      // Load AI friend match suggestions using the same API as Dashboard
      try {
        // Loading AI friend suggestions
        
        if (!user?.id) {
          setFriendSuggestions([]);
          return;
        }
        
        const friendResponse = await matchingAPI.getMatches('friend', 1, 20, user.id);
        // Processing friend matches response

        if (friendResponse && friendResponse.matches && Array.isArray(friendResponse.matches)) {
          // Found friend matches to process

          // Filter out matches with incomplete data and transform valid ones
          const validMatches = friendResponse.matches.filter((match: any) => {
            const hasValidData = match.id && (match.name || match.matched_user?.name || match.matched_user?.fullName);
            if (!hasValidData) {
              console.warn('⚠️ Skipping invalid match:', match);
            }
            return hasValidData;
          });

          // Filtered valid matches

          const transformedFriendMatches = validMatches.map((match: any, index: number) => {
            // Extract user data from match or matched_user
            const user = match.matched_user || match;
            const userName = user.name || user.fullName || user.first_name + ' ' + user.last_name || `User ${match.id.slice(-4)}`;
            
            // Determine friendship type based on AI reasoning and match factors
            let relationDisplay = 'Possible friend';
            
            if (match.reasoning) {
              const reasoning = match.reasoning.toLowerCase();
              const factors = match.factors || {};
              const predictedRelationship = match.predictedRelationship || '';

              // Check for school connections
              if (reasoning.includes('school') || reasoning.includes('education') || 
                  predictedRelationship.includes('classmate') || factors.education_similarity > 0.3) {
                if (reasoning.includes('primary') || reasoning.includes('elementary')) {
                  relationDisplay = 'Possible primary school classmate';
                } else if (reasoning.includes('secondary') || reasoning.includes('high school')) {
                  relationDisplay = 'Possible high school classmate';
                } else if (reasoning.includes('university') || reasoning.includes('college')) {
                  relationDisplay = 'Possible university classmate';
                } else {
                  relationDisplay = 'Possible old classmate';
                }
              }
              // Check for childhood connections
              else if (reasoning.includes('childhood') || reasoning.includes('young') || 
                       predictedRelationship.includes('childhood')) {
                relationDisplay = 'Possible childhood friend';
              }
              // Check for work connections  
              else if (reasoning.includes('work') || reasoning.includes('colleague') || 
                       reasoning.includes('professional') || factors.profession_similarity > 0.4) {
                relationDisplay = 'Possible work colleague';
              }
              // Check for community connections
              else if (reasoning.includes('community') || reasoning.includes('neighbor') || 
                       factors.location_similarity > 0.8) {
                relationDisplay = 'Community friend';
              }
              // Check for interest-based connections
              else if (factors.interests_similarity > 0.6) {
                relationDisplay = 'Shared interests friend';
              }
              // Age-based friendship
              else if (factors.age_similarity > 0.8) {
                relationDisplay = 'Possible peer friend';
              }
              // High confidence general matches
              else if ((match.score || match.match_score) > 0.7) {
                relationDisplay = 'Highly likely friend';
              } else {
                relationDisplay = 'Possible friend connection';
              }
            }

            const score = match.score || match.match_score || 0;
            const transformed = {
              id: match.id || user.id,
              name: userName,
              initials: userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
              bio: user.bio || match.reasoning || 'Friend match based on profile similarity',
              location: user.location || 'Location not shared',
              mutualFriends: Math.floor(score * 10),
              isFriend: false,
              matchScore: Math.round(score * 100),
              relation: relationDisplay,
              matchType: 'friend',
              matchPercentage: Math.round(score * 100)
            };

            return transformed;
          });

          setFriendSuggestions(transformedFriendMatches);
        } else {
          console.warn('No valid friend matches found');
          setFriendSuggestions([]);
        }
      } catch (suggestionError) {
        console.error('Error loading friend suggestions:', suggestionError);
        setFriendSuggestions([]);
      }
      
    } catch (error) {
      console.error('Error loading friends data:', error);
      setAllFriends([]);
      setFriendSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const myFriends = allFriends.filter(f => f.isFriend);
  
  // State tracking for debugging
  React.useEffect(() => {
    if (__DEV__) {
      console.log('FriendsScreen state:', { allFriends: allFriends.length, friendSuggestions: friendSuggestions.length, myFriends: myFriends.length, activeTab, loading });
    }
  }, [allFriends, friendSuggestions, myFriends, activeTab, loading]);

  const renderBackground = () => (
    <View style={styles.backgroundPattern}>
      <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
        <Defs>
          <Pattern
            id="friendsDots"
            patternUnits="userSpaceOnUse"
            width="25"
            height="25"
          >
            <Circle
              cx="12.5"
              cy="12.5"
              r="1"
              fill="rgba(252, 211, 170, 0.05)"
            />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#friendsDots)" />
      </Svg>
    </View>
  );

  const renderTabContent = () => {
    console.log('🎯 renderTabContent called with activeTab:', activeTab);
    console.log('🎯 Available data: myFriends =', myFriends.length, ', friendSuggestions =', friendSuggestions.length);
    
    switch (activeTab) {
      case 0:
        console.log('🎯 Rendering MyFriends tab with', myFriends.length, 'friends');
        return <MyFriends friends={myFriends} onFriendPress={handleFriendPress} onChatPress={handleChatPress} />;
      case 1:
        console.log('🎯 Rendering AIMatchedFriends tab with', friendSuggestions.length, 'suggestions');
        return <AIMatchedFriends suggestions={friendSuggestions} onFriendPress={handleFriendPress} onChatPress={handleChatPress} onAddPress={handleAddFriend} />;
      default:
        console.log('🎯 No matching tab, returning null');
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderBackground()}
      
      {/* Clean Header */}
      <View style={styles.cleanHeader}>
        <TouchableOpacity style={styles.cleanBackButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fcd3aa" />
        </TouchableOpacity>
        <Text style={styles.cleanHeaderTitle}>Friends</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.cleanFilterButton} onPress={handleFriendRequestsPress}>
            <Ionicons name="person-add" size={24} color="#04a7c7" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.cleanFilterButton, { marginLeft: 8 }]}>
            <Ionicons name="search" size={24} color="#fcd3aa" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Compact Tab Pills with inline stats */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.compactTabsContainer}
        contentContainerStyle={styles.compactTabsContent}
      >
        <TouchableOpacity
          style={[styles.compactTab, activeTab === 0 && styles.activeCompactTab]}
          onPress={() => setActiveTab(0)}
        >
          <Text style={[styles.compactTabText, activeTab === 0 && styles.activeCompactTabText]}>
            My Friends
          </Text>
          <Text style={[styles.compactTabCount, activeTab === 0 && styles.activeCompactTabCount]}>
            {myFriends.length}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.compactTab, activeTab === 1 && styles.activeCompactTab]}
          onPress={() => setActiveTab(1)}
        >
          <Text style={[styles.compactTabText, activeTab === 1 && styles.activeCompactTabText]}>
            AI Match
          </Text>
          <Text style={[styles.compactTabCount, activeTab === 1 && styles.activeCompactTabCount]}>
            {friendSuggestions.length}
          </Text>
        </TouchableOpacity>

        <View style={styles.compactTab}>
          <Text style={styles.compactTabText}>Suggestions</Text>
          <Text style={styles.compactTabCount}>{friendSuggestions.length}</Text>
        </View>

        <View style={styles.compactTab}>
          <Text style={styles.compactTabText}>Mutual</Text>
          <Text style={styles.compactTabCount}>25</Text>
        </View>
      </ScrollView>

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
      >
        {renderTabContent()}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      <BottomNavigation
        activeTab="friends"
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
  
  // Clean Background Pattern
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  
  // Clean Header - More compact
  cleanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 45,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(252, 211, 170, 0.1)',
  },
  cleanBackButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(252, 211, 170, 0.1)',
  },
  cleanHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fcd3aa',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  cleanFilterButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(252, 211, 170, 0.1)',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // Compact Tabs with inline stats
  compactTabsContainer: {
    marginTop: 8,
    marginBottom: 8,
    maxHeight: 44,
  },
  compactTabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  compactTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(252, 211, 170, 0.1)',
    marginRight: 8,
  },
  activeCompactTab: {
    backgroundColor: 'rgba(252, 211, 170, 0.15)',
    borderColor: '#fcd3aa',
  },
  compactTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 6,
  },
  activeCompactTabText: {
    color: '#fcd3aa',
  },
  compactTabCount: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activeCompactTabCount: {
    color: '#fcd3aa',
    backgroundColor: 'rgba(252, 211, 170, 0.2)',
  },
  
  // Content
  content: {
    flex: 1,
    zIndex: 1,
  },
  tabContent: {
    padding: 16,
  },
  
  // Modern Tab Content with Dividers - More compact
  modernTabContent: {
    paddingHorizontal: 0,
    paddingVertical: 8,
  },
  
  modernFriendItem: {
    backgroundColor: 'transparent',
  },
  
  // Friend Dividers (matching match grid style)
  friendDivider: {
    height: 1,
    marginHorizontal: 12,
    marginLeft: 62, // Align with content (16 + 38 + 12)
    marginVertical: 0,
  },
  
  dividerGradient: {
    flex: 1,
    height: '100%',
    borderRadius: 1,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(252, 211, 170, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // AI Match Header
  aiMatchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  aiIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(252, 211, 170, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  aiMatchText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fcd3aa',
  },
  
  // Friend Cards
  friendCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#fcd3aa',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 2,
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  friendInfo: {
    flex: 1,
    marginRight: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  connectionBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  mutualContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  mutualFriends: {
    fontSize: 14,
    fontWeight: '500',
    color: '#04a7c7',
    marginLeft: 4,
  },
  friendBio: {
    fontSize: 13,
    fontWeight: '400',
    color: '#cccccc',
    marginBottom: 8,
    lineHeight: 18,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendLocation: {
    fontSize: 12,
    fontWeight: '400',
    color: '#999999',
    marginLeft: 4,
  },
  friendActions: {
    alignItems: 'center',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 8,
  },
  chatButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 8,
  },
  actionButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevron: {
    marginTop: 4,
  },
  bottomSpacing: {
    height: 100,
  },
  
  // ===== CLEAN ELEGANT FRIEND CARD STYLES =====
  
  // Clean Friend Card Container - More compact for 6-7 on screen
  cleanFriendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  
  // Avatar Section
  avatarSection: {
    marginRight: 12,
  },
  
  cleanAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    elevation: 2,
    shadowColor: '#0091ad',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },

  cleanAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },

  cleanAvatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  
  onlineStatus: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4ade80',
    borderWidth: 2,
    borderColor: '#000000',
  },
  
  // Information Section
  infoSection: {
    flex: 1,
    paddingRight: 10,
  },
  
  // Name and Mutual on same line
  nameAndMutualSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  
  cleanFriendName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  
  newBadge: {
    backgroundColor: '#0091ad',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  
  newBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.8,
  },
  
  cleanMutualText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0091ad',
  },
  
  cleanBio: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 16,
    marginBottom: 4,
  },
  
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  locationText: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
    marginLeft: 4,
  },
  
  friendTag: {
    backgroundColor: 'rgba(252, 211, 170, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  
  friendTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fcd3aa',
    letterSpacing: 0.5,
  },
  
  // Action Section - Compact
  actionSection: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
  },

  addAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 145, 173, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 145, 173, 0.2)',
  },

  chatAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(252, 211, 170, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(252, 211, 170, 0.2)',
  },
});

export default FriendsPage;