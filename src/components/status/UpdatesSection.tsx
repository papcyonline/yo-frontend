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
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    console.log('📱 UpdatesSection mounted');
    loadUserId();
    loadUpdates();
  }, []);

  const loadUserId = async () => {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      if (userData) {
        const user = JSON.parse(userData);
        setCurrentUserId(user._id || user.id);
      }
    } catch (error) {
      console.error('Error loading user ID:', error);
    }
  };

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
    setMyUpdates(prev => [newStatus, ...prev]);
    setUpdates(prev => [newStatus, ...prev]);
    setShowCreateModal(false);
  };

  const handleStatusPress = (status: Update) => {
    setSelectedStatus(status);
    setShowViewModal(true);
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
          ) : update.user_id.profile_photo_url ? (
            <Image 
              source={{ uri: update.user_id.profile_photo_url }} 
              style={styles.statusImage}
            />
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
        keyExtractor={(item, index) => item === 'add' ? 'add' : item._id}
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
          onClose={() => {
            setShowViewModal(false);
            setSelectedStatus(null);
          }}
          currentUserId={currentUserId}
          onDelete={handleDeleteUpdate}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    height: 100,
  },
  loadingContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  addStatusContainer: {
    alignItems: 'center',
    width: 65,
  },
  addStatusCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 4,
  },
  glassMorphism: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 2,
    borderColor: '#04a7c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusItem: {
    alignItems: 'center',
    width: 65,
  },
  statusCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#04a7c7',
    padding: 2,
    marginBottom: 4,
  },
  viewedCircle: {
    borderColor: '#666',
  },
  statusImage: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
    backgroundColor: '#0091ad',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
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