import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  RefreshControl,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StatusCard from '../../components/status/StatusCard';
import CreateStatusModal from '../../components/status/CreateStatusModal';

interface Status {
  _id: string;
  user_id: {
    _id: string;
    first_name: string;
    last_name: string;
    profile_photo_url?: string;
  };
  content: {
    text?: string;
    type: 'text' | 'image' | 'text_with_image';
  };
  media?: {
    image_url?: string;
    thumbnail_url?: string;
    image_width?: number;
    image_height?: number;
  };
  engagement: {
    likes: Array<{ user_id: string; created_at: string }>;
    comments: Array<{
      user_id: { 
        _id: string; 
        first_name: string; 
        last_name: string; 
        profile_photo_url?: string; 
      };
      comment: string;
      created_at: string;
    }>;
    views: number;
    shares: number;
  };
  visibility: string;
  location?: {
    name?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  created_at: string;
  updated_at: string;
}

const StatusFeedScreen: React.FC = () => {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [offset, setOffset] = useState(0);

  const LIMIT = 20;
  const currentUserId = 'current_user_id'; // TODO: Get from auth store

  // Fetch status feed
  const fetchStatusFeed = useCallback(async (isRefresh = false, currentOffset = 0) => {
    try {
      const response = await fetch(
        `http://localhost:9002/api/status/feed?limit=${LIMIT}&offset=${currentOffset}`,
        {
          headers: {
            'Authorization': 'Bearer YOUR_TOKEN', // TODO: Get from auth store
          }
        }
      );

      const result = await response.json();

      if (result.success) {
        if (isRefresh || currentOffset === 0) {
          setStatuses(result.statuses);
          setOffset(LIMIT);
        } else {
          setStatuses(prev => [...prev, ...result.statuses]);
          setOffset(currentOffset + LIMIT);
        }
        
        setHasMoreData(result.hasMore);
      } else {
        Alert.alert('Error', result.message || 'Failed to load status feed');
      }
    } catch (error) {
      console.error('Error fetching status feed:', error);
      Alert.alert('Error', 'Failed to load status feed');
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      await fetchStatusFeed(true, 0);
      setIsLoading(false);
    };

    loadInitialData();
  }, [fetchStatusFeed]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchStatusFeed(true, 0);
    setIsRefreshing(false);
  }, [fetchStatusFeed]);

  // Handle load more
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMoreData) return;

    setIsLoadingMore(true);
    await fetchStatusFeed(false, offset);
    setIsLoadingMore(false);
  }, [fetchStatusFeed, offset, hasMoreData, isLoadingMore]);

  // Handle like status
  const handleLike = useCallback(async (statusId: string) => {
    try {
      const response = await fetch(
        `http://localhost:9002/api/status/${statusId}/like`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer YOUR_TOKEN', // TODO: Get from auth store
          }
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to like status');
      }

      // Update local state
      setStatuses(prev =>
        prev.map(status => {
          if (status._id === statusId) {
            const isCurrentlyLiked = status.engagement.likes.some(
              like => like.user_id === currentUserId
            );
            
            return {
              ...status,
              engagement: {
                ...status.engagement,
                likes: isCurrentlyLiked
                  ? status.engagement.likes.filter(like => like.user_id !== currentUserId)
                  : [...status.engagement.likes, { user_id: currentUserId, created_at: new Date().toISOString() }]
              }
            };
          }
          return status;
        })
      );
    } catch (error) {
      console.error('Error liking status:', error);
      throw error;
    }
  }, [currentUserId]);

  // Handle comment
  const handleComment = useCallback((statusId: string) => {
    // TODO: Navigate to comment screen or show comment modal
    Alert.alert('Comments', 'Comment functionality will be implemented');
  }, []);

  // Handle share
  const handleShare = useCallback((status: Status) => {
    // Already handled in StatusCard component
    console.log('Status shared:', status._id);
  }, []);

  // Handle user press
  const handleUserPress = useCallback((userId: string) => {
    // TODO: Navigate to user profile
    console.log('User pressed:', userId);
  }, []);

  // Handle status created
  const handleStatusCreated = useCallback((newStatus: Status) => {
    setStatuses(prev => [newStatus, ...prev]);
    setShowCreateModal(false);
  }, []);

  // Render status item
  const renderStatusItem = useCallback(({ item }: { item: Status }) => (
    <StatusCard
      status={item}
      currentUserId={currentUserId}
      onLike={handleLike}
      onComment={handleComment}
      onShare={handleShare}
      onUserPress={handleUserPress}
    />
  ), [currentUserId, handleLike, handleComment, handleShare, handleUserPress]);

  // Render empty state
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color="#CCC" />
      <Text style={styles.emptyTitle}>No Status Updates</Text>
      <Text style={styles.emptySubtitle}>
        Be the first to share what's on your mind!
      </Text>
      <TouchableOpacity 
        style={styles.createFirstButton}
        onPress={() => setShowCreateModal(true)}
      >
        <Text style={styles.createFirstButtonText}>Create Status</Text>
      </TouchableOpacity>
    </View>
  );

  // Render footer for loading more
  const renderFooter = () => {
    if (!isLoadingMore) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <Text style={styles.loadingText}>Loading more...</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Status Updates</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Status Feed */}
      <FlatList
        data={statuses}
        renderItem={renderStatusItem}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#007AFF"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={!isLoading ? renderEmptyComponent : null}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={statuses.length === 0 ? styles.emptyListContainer : undefined}
      />

      {/* Create Status Modal */}
      <CreateStatusModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onStatusCreated={handleStatusCreated}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  createButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  createFirstButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 24,
  },
  createFirstButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingFooter: {
    padding: 16,
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
  },
});

export default StatusFeedScreen;