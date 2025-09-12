import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import CreateStatusModal from './CreateStatusModal';
import StatusViewModal from './StatusViewModal';
import { StatusAPI } from '../../services/api/status';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../store/authStore';

interface Update {
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
  };
  engagement: {
    likes: Array<{ user_id: string }>;
    comments: Array<any>;
    views: number;
  };
  created_at: string;
}

interface UpdatesSectionProps {
  navigation?: any;
}

const UpdatesSection: React.FC<UpdatesSectionProps> = ({ navigation }) => {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [myUpdates, setMyUpdates] = useState<Update[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<Update | null>(null);
  const [userStatuses, setUserStatuses] = useState<Update[]>([]);
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);
  
  // Get current user from auth store
  const { user } = useAuthStore();
  const currentUserId = user?._id || user?.id || '';

  useEffect(() => {
    console.log('📱 UpdatesSection mounted');
    console.log('📱 Current user ID:', currentUserId);
    loadUpdates();
  }, []);

  const loadUpdates = async () => {
    try {
      // Load feed updates
      const feedResponse = await StatusAPI.getStatusFeed(10, 0);
      if (feedResponse.success && feedResponse.data) {
        setUpdates(feedResponse.data.statuses || []);
      }

      // Load my updates
      const myResponse = await StatusAPI.getMyStatuses(5, 0);
      if (myResponse.success && myResponse.data) {
        setMyUpdates(myResponse.data.statuses || []);
      }
    } catch (error) {
      console.error('Error loading updates:', error);
      // Don't fail completely - show empty state
      setUpdates([]);
      setMyUpdates([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadUpdates();
  };

  const handleStatusCreated = (newStatus: Update) => {
    // Prevent duplicates in myUpdates
    setMyUpdates(prev => {
      const existingIndex = prev.findIndex(s => s._id === newStatus._id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newStatus;
        return updated;
      }
      return [newStatus, ...prev];
    });
    
    // Prevent duplicates in general updates
    setUpdates(prev => {
      const existingIndex = prev.findIndex(s => s._id === newStatus._id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newStatus;
        return updated;
      }
      return [newStatus, ...prev];
    });
    
    setShowCreateModal(false);
  };

  const fetchUserStatuses = async (userId: string): Promise<Update[]> => {
    try {
      // If it's the current user, return myUpdates
      if (userId === currentUserId) {
        return myUpdates;
      }
      
      // For other users, fetch their statuses from the API
      // Note: This would need a new API endpoint to get statuses by user ID
      // For now, filter from existing updates
      const userUpdates = updates.filter(update => update.user_id._id === userId);
      return userUpdates;
    } catch (error) {
      console.error('Error fetching user statuses:', error);
      return []; // Fallback to empty array
    }
  };

  const handleStatusPress = async (status: Update) => {
    setSelectedStatus(status);
    
    // Fetch all statuses from the same user
    const statusesFromUser = await fetchUserStatuses(status.user_id._id);
    setUserStatuses(statusesFromUser);
    
    // Find the index of the selected status
    const statusIndex = statusesFromUser.findIndex(s => s._id === status._id);
    setCurrentStatusIndex(Math.max(0, statusIndex));
    
    setShowViewModal(true);
  };

  const handleStatusChange = (newIndex: number) => {
    if (newIndex >= 0 && newIndex < userStatuses.length) {
      setCurrentStatusIndex(newIndex);
      setSelectedStatus(userStatuses[newIndex]);
    }
  };

  const handleDeleteUpdate = async (updateId: string) => {
    Alert.alert(
      'Delete Update',
      'Are you sure you want to delete this update?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await StatusAPI.deleteStatus(updateId);
              if (response.success) {
                setMyUpdates(prev => prev.filter(u => u._id !== updateId));
                setUpdates(prev => prev.filter(u => u._id !== updateId));
                Alert.alert('Success', 'Update deleted successfully');
              }
            } catch (error) {
              console.error('Error deleting update:', error);
              Alert.alert('Error', 'Failed to delete update');
            }
          }
        }
      ]
    );
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const renderStatusItem = ({ item, index }: { item: Update | 'add'; index: number }) => {
    if (item === 'add') {
      return (
        <TouchableOpacity 
          style={styles.addStatusContainer}
          onPress={() => setShowCreateModal(true)}
        >
          <View style={styles.addStatusCircle}>
            <View style={styles.glassMorphism}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.statusLabel}>Add Status</Text>
        </TouchableOpacity>
      );
    }

    const update = item as Update;
    const isOwn = update.user_id._id === currentUserId;
    const hasViewed = false; // You can track this in state later

    return (
      <TouchableOpacity 
        style={styles.statusItem}
        onPress={() => handleStatusPress(update)}
      >
        <View style={[
          styles.statusCircle,
          hasViewed && styles.viewedCircle
        ]}>
          {update.media?.thumbnail_url ? (
            <Image 
              source={{ uri: update.media.thumbnail_url }} 
              style={styles.statusImage}
            />
          ) : update.content?.text ? (
            <View style={styles.textStatusContainer}>
              <Text style={styles.textStatusPreview} numberOfLines={3}>
                {update.content.text}
              </Text>
            </View>
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {update.user_id.first_name?.[0]}{update.user_id.last_name?.[0]}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.statusLabel} numberOfLines={1}>
          {isOwn ? 'My Status' : update.user_id.first_name}
        </Text>
        <Text style={styles.statusTime}>{formatTimeAgo(update.created_at)}</Text>
      </TouchableOpacity>
    );
  };

  // Combine add button with status updates
  const statusData: (Update | 'add')[] = ['add', ...myUpdates, ...updates.filter(u => u.user_id._id !== currentUserId)];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#04a7c7" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={statusData}
        keyExtractor={(item, index) => item === 'add' ? 'add' : `updates-${item._id}-${index}`}
        renderItem={renderStatusItem}
        contentContainerStyle={styles.statusList}
      />

      {/* Create Status Modal */}
      <CreateStatusModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onStatusCreated={handleStatusCreated}
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
          onDelete={handleDeleteUpdate}
          onStatusChange={handleStatusChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
    height: 80,
  },
  loadingContainer: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  addStatusContainer: {
    alignItems: 'center',
    width: 60,
  },
  addStatusCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 2,
  },
  glassMorphism: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 2,
    borderColor: '#04a7c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusItem: {
    alignItems: 'center',
    width: 60,
  },
  statusCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#04a7c7',
    padding: 2,
    marginBottom: 2,
  },
  viewedCircle: {
    borderColor: '#666',
  },
  statusImage: {
    width: '100%',
    height: '100%',
    borderRadius: 23,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 23,
    backgroundColor: '#0091ad',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  textStatusContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 23,
    backgroundColor: '#0091ad',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  textStatusPreview: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 10,
  },
  statusLabel: {
    fontSize: 11,
    color: '#E5E5E5',
    marginTop: 2,
  },
  statusTime: {
    fontSize: 9,
    color: '#888',
    marginTop: 1,
  },
});

export default UpdatesSection;