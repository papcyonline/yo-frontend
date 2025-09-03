// src/components/notifications/NotificationBell.tsx - Redesigned notification bell component

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Modal, 
  FlatList, 
  RefreshControl,
  Alert,
  Dimensions,
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getSystemFont } from '../../config/constants';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config/constants';

const { width, height } = Dimensions.get('window');

// Notification interface matching backend model
interface Notification {
  _id: string;
  user_id: string;
  type: 'new_match' | 'profile_update' | 'system_message' | 'welcome' | 'questionnaire_complete';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  action_url?: string;
  expires_at: string;
  created_at: string;
}

interface NotificationBellProps {
  navigation?: any;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ navigation }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { token } = useAuthStore();

  // Animations
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (token) {
      loadUnreadCount();
      // Start pulsing animation if there are unread notifications
      if (unreadCount > 0) {
        startPulseAnimation();
      }
    }
  }, [token, unreadCount]);

  useEffect(() => {
    // Auto-refresh unread count every 30 seconds
    const interval = setInterval(() => {
      if (token) {
        loadUnreadCount();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const makeAuthRequest = async (endpoint: string, options: RequestInit = {}) => {
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }
    
    return data;
  };

  const loadUnreadCount = async () => {
    try {
      const response = await makeAuthRequest('/notifications/unread-count');
      setUnreadCount(response.data?.unread_count || 0);
    } catch (error) {
      // Silently fail - notifications may not be set up yet
      console.log('Notifications not available yet');
    }
  };

  const loadNotifications = async (refresh = false) => {
    if (loading && !refresh) return;
    if (!hasMore && !refresh) return;
    
    try {
      if (refresh) {
        setRefreshing(true);
        setPage(1);
        setHasMore(true);
      } else {
        setLoading(true);
      }

      const currentPage = refresh ? 1 : page;
      const response = await makeAuthRequest(
        `/notifications?page=${currentPage}&limit=20`
      );

      const newNotifications = response.data?.notifications || [];
      
      if (refresh) {
        setNotifications(newNotifications);
      } else {
        // Filter out duplicates before adding
        setNotifications(prev => {
          const existingIds = new Set(prev.map(n => n._id));
          const uniqueNewNotifications = newNotifications.filter(n => !existingIds.has(n._id));
          return [...prev, ...uniqueNewNotifications];
        });
      }

      setUnreadCount(response.data?.unread_count || 0);
      setHasMore(newNotifications.length >= 20);
      
      if (!refresh) {
        setPage(currentPage + 1);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      if (!refresh) {
        Alert.alert('Error', 'Failed to load notifications');
      }
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handlePress = () => {
    // Bounce animation
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(bounceAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Load notifications and show modal
    setShowModal(true);
    setNotifications([]); // Clear old notifications
    setPage(1);
    setHasMore(true);
    loadNotifications(true);
  };

  const handleNotificationPress = async (notification: Notification) => {
    try {
      // Mark as read if not already read
      if (!notification.read) {
        await makeAuthRequest(`/notifications/${notification._id}/read`, {
          method: 'PUT',
        });
        
        // Update local state
        setNotifications(prev => 
          prev.map(n => 
            n._id === notification._id 
              ? { ...n, read: true }
              : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      // Handle navigation based on notification type and data
      setShowModal(false);
      
      if (notification.type === 'new_match' && notification.data?.match_id) {
        navigation?.navigate('MatchDetail', { 
          matchId: notification.data.match_id,
          matchType: notification.data.match_type 
        });
      } else if (notification.action_url === '/matches') {
        navigation?.navigate('Matches');
      } else if (notification.type === 'profile_update') {
        navigation?.navigate('Profile');
      }
    } catch (error) {
      console.error('Error handling notification press:', error);
      Alert.alert('Error', 'Failed to mark notification as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await makeAuthRequest('/notifications/mark-all-read', {
        method: 'PUT',
      });
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
      Alert.alert('Success', 'All notifications marked as read');
    } catch (error) {
      Alert.alert('Error', 'Failed to mark all as read');
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await makeAuthRequest(`/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      loadUnreadCount(); // Refresh count
    } catch (error) {
      Alert.alert('Error', 'Failed to delete notification');
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return `${Math.floor(diffInMinutes / 10080)}w ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_match': return 'heart';
      case 'profile_update': return 'person';
      case 'system_message': return 'information-circle';
      case 'welcome': return 'hand-left';
      case 'questionnaire_complete': return 'checkmark-circle';
      default: return 'notifications';
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'urgent') return '#ff4757';
    if (priority === 'high') return '#ff6b6b';
    
    switch (type) {
      case 'new_match': return '#ff6b6b';
      case 'profile_update': return '#4ecdc4';
      case 'questionnaire_complete': return '#ffd93d';
      case 'welcome': return '#6c5ce7';
      case 'system_message': return '#0091ad';
      default: return '#74b9ff';
    }
  };

  const renderNotification = useCallback(({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={styles.notificationWrapper}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.8}
    >
      <View style={[styles.notificationItem, !item.read && styles.unreadNotification]}>
        <View style={styles.notificationContent}>
          <View style={[
            styles.iconContainer, 
            { backgroundColor: `${getNotificationColor(item.type, item.priority)}20` }
          ]}>
            <Ionicons 
              name={getNotificationIcon(item.type) as any} 
              size={22} 
              color={getNotificationColor(item.type, item.priority)} 
            />
          </View>
          
          <View style={styles.textContainer}>
            <View style={styles.headerRow}>
              <Text style={[styles.notificationTitle, !item.read && styles.unreadText]}>
                {item.title}
              </Text>
              {item.priority === 'urgent' && (
                <View style={styles.urgentBadge}>
                  <Text style={styles.urgentText}>URGENT</Text>
                </View>
              )}
            </View>
            <Text style={styles.notificationMessage} numberOfLines={2}>
              {item.message}
            </Text>
            <Text style={styles.notificationTime}>
              {formatTimeAgo(item.created_at)}
            </Text>
          </View>

          {!item.read && <View style={styles.unreadDot} />}
        </View>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={(e) => {
            e.stopPropagation();
            handleDeleteNotification(item._id);
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={18} color="#ff6b6b" />
        </TouchableOpacity>
      </View>
      
      {/* Divider */}
      <View style={styles.divider} />
    </TouchableOpacity>
  ), []);

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#0091ad" />
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-off-outline" size={64} color="#666" />
      <Text style={styles.emptyStateText}>No notifications yet</Text>
      <Text style={styles.emptyStateSubtext}>
        When you get matches or updates, they'll appear here
      </Text>
    </View>
  );

  return (
    <>
      <TouchableOpacity
        style={styles.bellContainer}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ scale: bounceAnim }] }}>
          <View style={styles.bellIconContainer}>
            <Ionicons name="notifications-outline" size={24} color="#ffffff" />
            {unreadCount > 0 && (
              <Animated.View style={[styles.badge, { transform: [{ scale: pulseAnim }] }]}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount.toString()}
                </Text>
              </Animated.View>
            )}
          </View>
        </Animated.View>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#1a1a1a', '#000000']}
            style={styles.modalHeader}
          >
            <View style={styles.modalHeaderContent}>
              <View>
                <Text style={styles.modalTitle}>Notifications</Text>
                {unreadCount > 0 && (
                  <Text style={styles.unreadCountText}>{unreadCount} unread</Text>
                )}
              </View>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllButton}>
                  <Ionicons name="checkmark-done" size={20} color="#0091ad" />
                  <Text style={styles.markAllText}>Mark all read</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowModal(false)}
            >
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </LinearGradient>

          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={(item, index) => `notification-${item._id}-${index}`}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadNotifications(true)}
                tintColor="#0091ad"
                colors={['#0091ad']}
              />
            }
            ListEmptyComponent={!loading ? renderEmpty : null}
            ListFooterComponent={renderFooter}
            onEndReached={() => {
              if (!loading && hasMore) {
                loadNotifications(false);
              }
            }}
            onEndReachedThreshold={0.5}
            contentContainerStyle={[
              styles.notificationsList,
              notifications.length === 0 && styles.emptyListContainer
            ]}
            removeClippedSubviews={true}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={10}
          />
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  bellContainer: {
    position: 'relative',
  },
  bellIconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ff4757',
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: getSystemFont('bold'),
    lineHeight: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalHeader: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontFamily: getSystemFont('bold'),
    marginBottom: 4,
  },
  unreadCountText: {
    color: '#0091ad',
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 145, 173, 0.15)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 145, 173, 0.3)',
  },
  markAllText: {
    color: '#0091ad',
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
    marginLeft: 6,
  },
  closeButton: {
    marginLeft: 16,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  notificationsList: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  emptyListContainer: {
    flex: 1,
  },
  notificationWrapper: {
    backgroundColor: '#000000',
  },
  notificationItem: {
    backgroundColor: '#111111',
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unreadNotification: {
    backgroundColor: '#1a1a1a',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    flex: 1,
  },
  unreadText: {
    color: '#0091ad',
    fontFamily: getSystemFont('bold'),
  },
  urgentBadge: {
    backgroundColor: '#ff4757',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  urgentText: {
    color: '#ffffff',
    fontSize: 10,
    fontFamily: getSystemFont('bold'),
  },
  notificationMessage: {
    color: '#999999',
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    lineHeight: 20,
    marginBottom: 6,
  },
  notificationTime: {
    color: '#666666',
    fontSize: 12,
    fontFamily: getSystemFont('regular'),
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0091ad',
    marginRight: 12,
    marginTop: 6,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 20,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginLeft: 78,
    marginRight: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyStateText: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: getSystemFont('bold'),
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    color: '#666666',
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    textAlign: 'center',
    lineHeight: 24,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default NotificationBell;