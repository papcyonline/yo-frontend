import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { StatusAPI } from '../../services/api/status';
import CreateStatusModal from '../status/CreateStatusModal';
import { useTheme } from '../../context/ThemeContext';

interface SocialPost {
  id: string;
  userId: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    username: string;
    profile_picture_url?: string;
  };
  text?: string;
  imageUrl?: string;
  createdAt: string;
  engagement: {
    viewCount: number;
    likeCount: number;
    commentCount: number;
    liked?: boolean;
  };
}

interface SocialsFeedProps {
  user: any;
}

const SocialsFeed: React.FC<SocialsFeedProps> = ({ user }) => {
  const { theme, isDark } = useTheme();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const styles = getStyles(theme, isDark);

  useEffect(() => {
    loadSocialFeed();
  }, []);

  const loadSocialFeed = async () => {
    try {
      setIsLoading(true);
      // Get status feed from the API
      const response = await StatusAPI.getStatusFeed(20, 0);
      
      if (response.success) {
        // Transform status data to social post format
        const socialPosts: SocialPost[] = response.data?.statuses?.map((status: any) => ({
          id: status._id,
          userId: status.user_id._id,
          user: {
            id: status.user_id._id,
            first_name: status.user_id.first_name,
            last_name: status.user_id.last_name,
            username: status.user_id.username || `${status.user_id.first_name}${status.user_id.last_name}`.toLowerCase(),
            profile_picture_url: status.user_id.profile_photo_url,
          },
          text: status.content?.text,
          imageUrl: status.media?.image_url,
          createdAt: status.created_at,
          engagement: {
            viewCount: status.engagement?.views || 0,
            likeCount: status.engagement?.likes?.length || 0,
            commentCount: status.engagement?.comments?.length || 0,
            liked: false, // TODO: Check if current user liked this post
          }
        })) || [];
        
        setPosts(socialPosts);
      }
    } catch (error) {
      console.error('Error loading social feed:', error);
      Alert.alert('Error', 'Failed to load social feed');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSocialFeed();
    setRefreshing(false);
  };

  const handleStatusCreated = (newStatus: any) => {
    // Add the new status to the top of the feed
    const newPost: SocialPost = {
      id: newStatus._id || newStatus.id,
      userId: user.id,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        profile_picture_url: user.profile_picture_url,
      },
      text: newStatus.text,
      imageUrl: newStatus.imageUrl,
      createdAt: newStatus.createdAt || new Date().toISOString(),
      engagement: {
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        liked: false,
      }
    };
    
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  const handleLike = async (postId: string) => {
    try {
      // Update UI optimistically
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? {
                ...post,
                engagement: {
                  ...post.engagement,
                  liked: !post.engagement.liked,
                  likeCount: post.engagement.liked 
                    ? post.engagement.likeCount - 1 
                    : post.engagement.likeCount + 1
                }
              }
            : post
        )
      );

      // Call the like API
      await StatusAPI.likeStatus(postId);
    } catch (error) {
      console.error('Error liking post:', error);
      // Revert optimistic update on error
      loadSocialFeed();
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const renderPost = ({ item }: { item: SocialPost }) => (
    <View style={styles.postContainer}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          {item.user.profile_picture_url ? (
            <Image 
              source={{ uri: item.user.profile_picture_url }} 
              style={styles.profilePicture}
            />
          ) : (
            <View style={styles.profilePicturePlaceholder}>
              <Ionicons name="person" size={20} color="#666" />
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {item.user.first_name} {item.user.last_name}
            </Text>
            <Text style={styles.postTime}>{formatTimeAgo(item.createdAt)}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Post Content */}
      {item.text && (
        <Text style={styles.postText}>{item.text}</Text>
      )}
      
      {item.imageUrl && (
        <Image 
          source={{ uri: item.imageUrl }} 
          style={styles.postImage}
          resizeMode="cover"
        />
      )}

      {/* Post Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity 
          style={[styles.actionButton, item.engagement.liked && styles.likedButton]}
          onPress={() => handleLike(item.id)}
        >
          <Ionicons 
            name={item.engagement.liked ? "heart" : "heart-outline"} 
            size={20} 
            color={item.engagement.liked ? "#ff6b6b" : "#666"} 
          />
          <Text style={[styles.actionText, item.engagement.liked && styles.likedText]}>
            {item.engagement.likeCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={20} color="#666" />
          <Text style={styles.actionText}>{item.engagement.commentCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="eye-outline" size={20} color="#666" />
          <Text style={styles.actionText}>{item.engagement.viewCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Social Feed</Text>
      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0091ad" />
        <Text style={styles.loadingText}>Loading social feed...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="camera-outline" size={48} color="#666" />
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptySubtitle}>Be the first to share something!</Text>
            <TouchableOpacity 
              style={styles.createFirstPostButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={styles.createFirstPostText}>Create First Post</Text>
            </TouchableOpacity>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0091ad']}
            tintColor="#0091ad"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={posts.length === 0 ? styles.emptyListContainer : undefined}
      />

      <CreateStatusModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onStatusCreated={handleStatusCreated}
      />
    </View>
  );
};

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
  },
  loadingText: {
    marginTop: 12,
    color: theme.text,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
  },
  createButton: {
    backgroundColor: '#0091ad',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postContainer: {
    backgroundColor: theme.surface,
    marginVertical: 4,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  profilePicturePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  postTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  moreButton: {
    padding: 4,
  },
  postText: {
    fontSize: 16,
    color: theme.text,
    paddingHorizontal: 16,
    marginBottom: 12,
    lineHeight: 22,
  },
  postImage: {
    width: '100%',
    height: 300,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  likedButton: {
    // Optional: Add styling for liked state
  },
  actionText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  likedText: {
    color: '#ff6b6b',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  createFirstPostButton: {
    backgroundColor: '#0091ad',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  createFirstPostText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SocialsFeed;