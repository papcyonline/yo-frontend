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
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import StatusCard from '../../components/status/StatusCard';
import StatusViewModal from '../../components/status/StatusViewModal';
import { StatusAPI } from '../../services/api/status';

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

const UpdatesScreen: React.FC = () => {
  const navigation = useNavigation();
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<Status | null>(null);
  const [userStatuses, setUserStatuses] = useState<Status[]>([]);
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);
  const [offset, setOffset] = useState(0);

  const LIMIT = 20;
  
  // Get current user from auth store
  const { user } = useAuthStore();
  const currentUserId = user?._id || user?.id || '';

  // Fetch status feed (only others' statuses)
  const fetchStatusFeed = useCallback(async (isRefresh = false, currentOffset = 0) => {
    try {
      const feedResult = await StatusAPI.getStatusFeed(LIMIT, currentOffset);

      if (feedResult.success) {
        const newStatuses = feedResult.data?.statuses || feedResult.statuses || [];
        // Filter out current user's statuses - only show others' statuses
        const othersStatuses = newStatuses.filter(status => status.user_id._id !== currentUserId);
        
        if (isRefresh || currentOffset === 0) {
          setStatuses(othersStatuses);
          setOffset(LIMIT);
        } else {
          setStatuses(prev => {
            const existingIds = new Set(prev.map(s => s._id));
            const uniqueNewStatuses = othersStatuses.filter(s => !existingIds.has(s._id));
            return [...prev, ...uniqueNewStatuses];
          });
          setOffset(currentOffset + LIMIT);
        }
        
        setHasMoreData(feedResult.data?.hasMore ?? feedResult.hasMore ?? false);
      }
    } catch (error) {
      console.error('Error fetching status feed:', error);
      Alert.alert('Error', 'Failed to load updates');
    }
  }, [currentUserId]);


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

  // Fetch all statuses from the same user
  const fetchUserStatuses = async (userId: string): Promise<Status[]> => {
    try {
      // Filter from existing statuses
      const userStatuses = statuses.filter(status => status.user_id._id === userId);
      return userStatuses;
    } catch (error) {
      console.error('Error fetching user statuses:', error);
      return [];
    }
  };

  // Handle status press for viewing
  const handleStatusPress = async (status: Status) => {
    setSelectedStatus(status);
    
    // Fetch all statuses from the same user
    const statusesFromUser = await fetchUserStatuses(status.user_id._id);
    setUserStatuses(statusesFromUser);
    
    // Find the index of the selected status
    const statusIndex = statusesFromUser.findIndex(s => s._id === status._id);
    setCurrentStatusIndex(Math.max(0, statusIndex));
    
    setShowViewModal(true);
    
    // Record view if not own status
    if (status.user_id._id !== currentUserId) {
      StatusAPI.recordView(status._id).catch(console.error);
    }
  };

  const handleStatusChange = (newIndex: number) => {
    if (newIndex >= 0 && newIndex < userStatuses.length) {
      setCurrentStatusIndex(newIndex);
      setSelectedStatus(userStatuses[newIndex]);
    }
  };

  // Handle like status
  const handleLike = useCallback(async (statusId: string) => {
    try {
      const result = await StatusAPI.likeStatus(statusId);

      if (!result.success) {
        throw new Error(result.message || result.error || 'Failed to like status');
      }

      // Update local state
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
    Alert.alert('Comments', 'Comment functionality will be implemented');
  }, []);

  // Handle share
  const handleShare = useCallback((status: Status) => {
    console.log('Status shared:', status._id);
  }, []);

  // Handle user press
  const handleUserPress = useCallback((userId: string) => {
    console.log('User pressed:', userId);
  }, []);

  // Handle delete status
  const handleDelete = useCallback(async (statusId: string) => {
    try {
      const result = await StatusAPI.deleteStatus(statusId);

      if (result.success) {
        setStatuses(prev => prev.filter(status => status._id !== statusId));
      } else {
        throw new Error(result.message || result.error || 'Failed to delete status');
      }
    } catch (error) {
      console.error('Error deleting status:', error);
      Alert.alert('Error', 'Failed to delete status');
    }
  }, []);

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };


  // Render status card
  const renderStatusCard = ({ item }: { item: Status }) => (
    <StatusCard
      status={item}
      currentUserId={currentUserId}
      onLike={handleLike}
      onComment={handleComment}
      onShare={handleShare}
      onUserPress={handleUserPress}
      onDelete={handleDelete}
      onStatusPress={handleStatusPress}
    />
  );

  // Render empty state
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color="#666" />
      <Text style={styles.emptyTitle}>No Updates Available</Text>
      <Text style={styles.emptySubtitle}>
        No recent updates from friends and family
      </Text>
    </View>
  );

  // Render footer
  const renderFooter = () => {
    if (!isLoadingMore) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#0091ad" />
      </View>
    );
  };


  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Updates</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0091ad" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Updates</Text>
        <View style={{ width: 36 }} />
      </View>


      {/* Status Feed */}
      <FlatList
        data={statuses}
        renderItem={renderStatusCard}
        keyExtractor={(item, index) => item._id || `status-${index}`}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#0091ad"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={!isLoading ? renderEmptyComponent : null}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={statuses.length === 0 ? styles.emptyListContainer : undefined}
      />


      {/* View Status Modal */}
      {showViewModal && selectedStatus && (
        <StatusViewModal
          visible={showViewModal}
          status={selectedStatus}
          userStatuses={userStatuses}
          currentStatusIndex={currentStatusIndex}
          onClose={() => {
            setShowViewModal(false);
            setSelectedStatus(null);
            setUserStatuses([]);
            setCurrentStatusIndex(0);
          }}
          currentUserId={currentUserId}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
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
    color: '#FFFFFF',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  loadingFooter: {
    padding: 16,
    alignItems: 'center',
  },
});

export default UpdatesScreen;