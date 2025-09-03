// src/screens/main/NotificationsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getSystemFont } from '../../config/constants';
import { useAuthStore } from '../../store/authStore';

interface NotificationsScreenProps {
  navigation: any;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  data?: any;
  is_read: boolean;
  created_at: string;
}

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const { user, token } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('http://localhost:9002/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        let notificationList = result.data.notifications || [];
        
        // Remove duplicate notifications based on content and type
        const uniqueNotifications = notificationList.filter((notification: Notification, index: number) => {
          // Check if there's a duplicate notification with same content and type
          const duplicateIndex = notificationList.findIndex((n: Notification, i: number) => 
            i < index && 
            n.type === notification.type &&
            n.title === notification.title &&
            n.content === notification.content &&
            // Only consider as duplicate if they're created within 10 minutes of each other
            Math.abs(new Date(n.created_at).getTime() - new Date(notification.created_at).getTime()) < 10 * 60 * 1000
          );
          return duplicateIndex === -1;
        });

        setNotifications(uniqueNotifications);
        setUnreadCount(result.data.unreadCount || 0);
      } else {
        throw new Error(result.message || 'Failed to load notifications');
      }

    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`http://localhost:9002/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId ? { ...notif, is_read: true } : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('http://localhost:9002/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`http://localhost:9002/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        setUnreadCount(prev => {
          const deletedNotification = notifications.find(n => n.id === notificationId);
          return deletedNotification && !deletedNotification.is_read ? Math.max(0, prev - 1) : prev;
        });
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAllNotifications = async () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to delete all notifications? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              const deletePromises = notifications.map(notif => deleteNotification(notif.id));
              await Promise.all(deletePromises);
            } catch (error) {
              console.error('Error clearing all notifications:', error);
            }
          }
        }
      ]
    );
  };

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read if unread
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'match':
        navigation.navigate('Matches');
        break;
      case 'friend_request':
        navigation.navigate('FriendRequests');
        break;
      case 'message':
      case 'new_message':
        console.log('🔔 Message notification clicked:', notification);
        // Check if we have chat data to navigate to specific chat
        if (notification.data?.chatId && notification.data?.senderId) {
          navigation.navigate('ChatScreen', {
            targetUser: {
              id: notification.data.senderId,
              name: notification.data.senderName || 'User',
              initials: notification.data.senderName ? notification.data.senderName.split(' ').map(n => n[0]).join('') : 'U',
              isOnline: true
            },
            currentUser: user,
            chatId: notification.data.chatId
          });
        } else {
          // Fallback to ChatsPage if no specific chat data
          navigation.navigate('ChatsPage', { user });
        }
        break;
      case 'new_chat':
        console.log('🔔 New chat notification clicked:', notification);
        if (notification.data?.chatId && notification.data?.initiatorId) {
          navigation.navigate('ChatScreen', {
            targetUser: {
              id: notification.data.initiatorId,
              name: notification.data.initiatorName || 'User',
              initials: notification.data.initiatorName ? notification.data.initiatorName.split(' ').map(n => n[0]).join('') : 'U',
              isOnline: true
            },
            currentUser: user,
            chatId: notification.data.chatId
          });
        } else {
          navigation.navigate('ChatsPage', { user });
        }
        break;
      default:
        break;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'match':
        return 'heart';
      case 'friend_request':
        return 'person-add';
      case 'message':
        return 'chatbubble';
      case 'family_connection':
        return 'people';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'match':
        return ['#ff6b9d', '#c44569'];
      case 'friend_request':
        return ['#22c55e', '#16a34a'];
      case 'message':
        return ['#0091ad', '#04a7c7'];
      case 'family_connection':
        return ['#fcd3aa', '#f4a261'];
      default:
        return ['#6b7280', '#4b5563'];
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderNotification = (notification: Notification) => (
    <TouchableOpacity
      key={notification.id}
      style={[styles.notificationCard, !notification.is_read && styles.unreadCard]}
      onPress={() => handleNotificationPress(notification)}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={!notification.is_read 
          ? ['rgba(0,145,173,0.1)', 'rgba(4,167,199,0.05)']
          : ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']
        }
        style={styles.notificationGradient}
      >
        <View style={styles.notificationContent}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={getNotificationColor(notification.type)}
              style={styles.iconGradient}
            >
              <Ionicons 
                name={getNotificationIcon(notification.type) as any} 
                size={20} 
                color="#ffffff" 
              />
            </LinearGradient>
            {!notification.is_read && <View style={styles.unreadDot} />}
          </View>

          {/* Content */}
          <View style={styles.textContent}>
            <Text style={[styles.notificationTitle, !notification.is_read && styles.unreadTitle]}>
              {notification.title}
            </Text>
            <Text style={styles.notificationText} numberOfLines={2}>
              {notification.content}
            </Text>
            <Text style={styles.notificationTime}>
              {formatTimeAgo(notification.created_at)}
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={(e) => {
                e.stopPropagation();
                deleteNotification(notification.id);
              }}
            >
              <Ionicons name="trash-outline" size={16} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="notifications-outline" size={48} color="rgba(252,211,170,0.3)" />
      </View>
      <Text style={styles.emptyTitle}>No Notifications</Text>
      <Text style={styles.emptyText}>
        When you have new matches, messages, or friend requests, they'll appear here
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fcd3aa" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0091ad" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fcd3aa" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
              <Text style={styles.markAllText}>Mark All Read</Text>
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity style={styles.clearAllButton} onPress={clearAllNotifications}>
              <Ionicons name="trash-outline" size={16} color="rgba(239,68,68,0.8)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Unread Count */}
      {unreadCount > 0 && (
        <View style={styles.countContainer}>
          <LinearGradient
            colors={['rgba(0,145,173,0.2)', 'rgba(4,167,199,0.1)']}
            style={styles.countGradient}
          >
            <Ionicons name="notifications" size={16} color="#0091ad" />
            <Text style={styles.countText}>
              {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
            </Text>
          </LinearGradient>
        </View>
      )}

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#0091ad"
            colors={['#0091ad']}
          />
        }
      >
        <View style={styles.notificationsList}>
          {notifications.length > 0 ? (
            notifications.map(renderNotification)
          ) : (
            renderEmptyState()
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(252,211,170,0.1)',
  },
  
  backButton: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(252,211,170,0.08)',
  },
  
  headerTitle: {
    fontSize: 20,
    fontFamily: getSystemFont('bold'),
    color: '#fcd3aa',
    flex: 1,
    textAlign: 'center',
  },
  
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  
  markAllText: {
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
    color: '#0091ad',
  },
  
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  clearAllButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },

  headerSpacer: {
    width: 48,
  },
  
  // Count Container
  countContainer: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  
  countGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  
  countText: {
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
    color: '#0091ad',
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  loadingText: {
    fontSize: 16,
    fontFamily: getSystemFont('medium'),
    color: '#ffffff',
    marginTop: 16,
  },
  
  // Content
  content: {
    flex: 1,
  },
  
  notificationsList: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  
  // Notification Card
  notificationCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  
  unreadCard: {
    borderWidth: 1,
    borderColor: 'rgba(0,145,173,0.3)',
  },
  
  notificationGradient: {
    padding: 16,
  },
  
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  
  // Icon
  iconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  
  iconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#000000',
  },
  
  // Text Content
  textContent: {
    flex: 1,
    paddingRight: 12,
  },
  
  notificationTitle: {
    fontSize: 16,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginBottom: 4,
  },
  
  unreadTitle: {
    color: '#fcd3aa',
  },
  
  notificationText: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 18,
    marginBottom: 6,
  },
  
  notificationTime: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: 'rgba(255,255,255,0.5)',
  },
  
  // Action
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(252,211,170,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  emptyTitle: {
    fontSize: 20,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  
  emptyText: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default NotificationsScreen;