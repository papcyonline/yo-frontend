// src/components/dashboard/DashboardHeader.tsx - Advanced Premium Design
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Modal, FlatList, Alert, Dimensions, Animated, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Stop, Circle, Path } from 'react-native-svg';
import { NotificationBell } from '../notifications/NotificationBell';
import { useTheme } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { getSystemFont } from '../../config/constants';
import { useFriendRequests } from '../../hooks/useFriendRequests';
import { getBestAvatarUrl } from '../../utils/imageHelpers';

const { width } = Dimensions.get('window');

interface Notification {
  id: string;
  type: 'family' | 'friend' | 'community' | 'system';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionType?: 'navigate' | 'confirm' | 'none';
  actionData?: any;
}

interface DashboardHeaderProps {
  navigation?: any;
  onProfilePress: () => void;
  onNotificationsPress?: () => void;
  onGenealogyPress: () => void;
  onFriendRequestsPress?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  navigation,
  onProfilePress,
  onNotificationsPress,
  onGenealogyPress,
  onFriendRequestsPress
}) => {
  const { theme, isDark } = useTheme();
  const { user, syncProfileFromBackend, profileSyncInProgress } = useAuthStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const { pendingCount: friendRequestCount } = useFriendRequests();

  // Auto-sync profile data on mount
  useEffect(() => {
    if (user && !profileSyncInProgress) {
      syncProfileFromBackend();
    }
  }, []);
  
  // Create dynamic styles based on theme
  const dynamicStyles = StyleSheet.create({
    cleanHeader: {
      paddingTop: StatusBar.currentHeight || 44,
      paddingBottom: 20,
      backgroundColor: theme.background,
      position: 'relative',
      minHeight: 120,
    },
    solidBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.background,
    },
    headerText: {
      color: theme.text,
    },
    userNameText: {
      fontSize: 24,
      fontFamily: getSystemFont('bold'),
      color: theme.text,
      letterSpacing: 0.5,
    },
    greetingText: {
      fontSize: 14,
      fontFamily: getSystemFont('regular'),
      color: theme.textSecondary,
      marginTop: 2,
    },
  });
  
  // Advanced Animations
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const floatAnimation = useRef(new Animated.Value(0)).current;
  const glowAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Continuous pulsing animation for avatar
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Floating animation for action buttons
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnimation, {
          toValue: -3,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnimation, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Glow animation for notifications
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnimation, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const getFirstName = () => {
    // Prioritize username from registration form
    if (user?.username && user.username !== '') {
      return user.username;
    }
    if (user?.fullName && user.fullName !== 'User') {
      return user.fullName.split(' ')[0];
    }
    if (user?.display_name && user.display_name !== 'User') {
      return user.display_name.split(' ')[0];
    }
    if (user?.firstName) {
      return user.firstName;
    }
    if (user?.first_name) {
      return user.first_name;
    }
    return 'User';
  };

  const getUserAvatar = () => {
    return getBestAvatarUrl(user);
  };

  const [notifications, setNotifications] = useState<Notification[]>([]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationsPress = () => {
    if (onNotificationsPress) {
      onNotificationsPress();
    } else {
      setShowNotifications(true);
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
    );

    setShowNotifications(false);

    // Handle action
    if (notification.actionType === 'navigate' && navigation) {
      // Add small delay to allow modal to close first
      setTimeout(() => {
        navigation.navigate(notification.actionData.screen, notification.actionData.params);
      }, 100);
    } else if (notification.actionType === 'confirm') {
      Alert.alert(notification.title, notification.message);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'family': return 'people';
      case 'friend': return 'person-add';
      case 'community': return 'chatbubbles';
      case 'system': return 'settings';
      default: return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'family': return '#0091ad';
      case 'friend': return '#04a7c7';
      case 'community': return '#fcd3aa';
      case 'system': return '#cccccc';
      default: return '#0091ad';
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.isRead && styles.unreadNotification]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.8}
    >
      <View style={[styles.notificationIcon, { backgroundColor: `${getNotificationColor(item.type)}30` }]}>
        <Ionicons 
          name={getNotificationIcon(item.type) as any} 
          size={20} 
          color={getNotificationColor(item.type)} 
        />
      </View>
      <View style={styles.notificationContent}>
        <Text style={[styles.notificationTitle, !item.isRead && styles.unreadTitle]}>
          {item.title}
        </Text>
        <Text style={styles.notificationMessage} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.notificationTime}>{item.timestamp}</Text>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  // Background mesh component
  const BackgroundMesh = () => (
    <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
      <Defs>
        <RadialGradient id="meshGradient1" cx="20%" cy="30%">
          <Stop offset="0%" stopColor="rgba(0,145,173,0.15)" />
          <Stop offset="100%" stopColor="transparent" />
        </RadialGradient>
        <RadialGradient id="meshGradient2" cx="80%" cy="20%">
          <Stop offset="0%" stopColor="rgba(252,211,170,0.1)" />
          <Stop offset="100%" stopColor="transparent" />
        </RadialGradient>
        <RadialGradient id="meshGradient3" cx="60%" cy="80%">
          <Stop offset="0%" stopColor="rgba(4,167,199,0.12)" />
          <Stop offset="100%" stopColor="transparent" />
        </RadialGradient>
      </Defs>
      <Circle cx="20%" cy="30%" r="120" fill="url(#meshGradient1)" opacity="0.8" />
      <Circle cx="80%" cy="20%" r="100" fill="url(#meshGradient2)" opacity="0.6" />
      <Circle cx="60%" cy="80%" r="80" fill="url(#meshGradient3)" opacity="0.7" />
    </Svg>
  );

  return (
    <>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.background} />
      
      {/* Clean Modern Header Design */}
      <View style={dynamicStyles.cleanHeader}>
        {/* Simple Background */}
        <View style={dynamicStyles.solidBackground} />
        
        {/* Compact Content */}
        <View style={styles.compactContent}>
          
          {/* Compact Profile Section */}
          <TouchableOpacity 
            style={styles.compactProfile}
            onPress={onProfilePress} 
            activeOpacity={0.9}
          >
            {/* Smaller Avatar with Simple Animation */}
            <Animated.View 
              style={[
                styles.compactAvatarContainer,
                { transform: [{ scale: pulseAnimation }] }
              ]}
            >
              <View style={styles.compactAvatar}>
                {getUserAvatar() ? (
                  <Image 
                    source={{ uri: getUserAvatar() || undefined }} 
                    style={styles.compactAvatarImage}
                  />
                ) : (
                  <Text style={styles.compactAvatarText}>
                    {getFirstName()[0]?.toUpperCase()}
                  </Text>
                )}
              </View>
              
              {/* Simple Status Dot */}
              <View style={styles.compactStatusDot} />
            </Animated.View>
            
            {/* Compact User Info */}
            <View style={styles.compactUserInfo}>
              <Text style={[styles.compactGreeting, dynamicStyles.greetingText]}>Yo!</Text>
              <Text style={[styles.compactUserName, dynamicStyles.userNameText]}>{getFirstName()}</Text>
            </View>
          </TouchableOpacity>

          {/* Compact Action Buttons */}
          <View style={styles.compactActions}>
            
            {/* Friend Requests Button */}
            {onFriendRequestsPress && (
              <Animated.View 
                style={[
                  styles.compactActionButton,
                  { transform: [{ translateY: floatAnimation }] }
                ]}
              >
                <TouchableOpacity 
                  style={styles.compactButton}
                  onPress={onFriendRequestsPress}
                  activeOpacity={0.8}
                >
                  <View style={styles.buttonBackground}>
                    <Ionicons name="person-add-outline" size={18} color="#04a7c7" />
                    {friendRequestCount > 0 && (
                      <View style={styles.friendRequestBadge}>
                        <Text style={styles.friendRequestBadgeText}>
                          {friendRequestCount > 99 ? '99+' : friendRequestCount.toString()}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            )}
            
            {/* Genealogy Button */}
            <Animated.View 
              style={[
                styles.compactActionButton,
                { transform: [{ translateY: floatAnimation }] }
              ]}
            >
              <TouchableOpacity 
                style={styles.compactButton}
                onPress={onGenealogyPress}
                activeOpacity={0.8}
              >
                <View style={styles.buttonBackground}>
                  <Ionicons name="git-network-outline" size={18} color="#0091ad" />
                </View>
              </TouchableOpacity>
            </Animated.View>
            
            {/* Notifications Button */}
            <Animated.View 
              style={[
                styles.compactActionButton,
                { transform: [{ translateY: floatAnimation }] }
              ]}
            >
              <View style={styles.compactButton}>
                <View style={styles.buttonBackground}>
                  <NotificationBell navigation={navigation} />
                </View>
              </View>
            </Animated.View>
            
          </View>
        </View>
      </View>

      {/* Notifications Modal */}
      <Modal
        visible={showNotifications}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.notificationsModal}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <LinearGradient
                colors={['#0091ad', '#04a7c7']}
                style={styles.modalHeaderGradient}
              >
                <Text style={styles.modalTitle}>Notifications</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowNotifications(false)}
                >
                  <Ionicons name="close" size={24} color="#ffffff" />
                </TouchableOpacity>
              </LinearGradient>
            </View>

            {/* Notifications List */}
            <FlatList
              data={notifications}
              renderItem={renderNotification}
              keyExtractor={(item) => item.id}
              style={styles.notificationsList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={() => (
                <View style={styles.emptyNotifications}>
                  <Ionicons name="notifications-off-outline" size={48} color="#666666" />
                  <Text style={styles.emptyTitle}>No notifications</Text>
                  <Text style={styles.emptyText}>You're all caught up!</Text>
                </View>
              )}
            />

            {/* Clear All Button */}
            {notifications.length > 0 && (
              <TouchableOpacity 
                style={styles.clearAllButton}
                onPress={() => {
                  setNotifications([]);
                  setShowNotifications(false);
                }}
              >
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // Clean Modern Header Styles - moved to dynamicStyles for theming
  // cleanHeader and solidBackground now use theme colors
  
  // Non-themed header styles
  
  // Compact Content Layout
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    flex: 1,
  },
  
  // Compact Profile Section
  compactProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  // Smaller Avatar
  compactAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  
  compactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0091ad',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(252, 211, 170, 0.2)',
    elevation: 4,
    shadowColor: '#0091ad',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  
  compactAvatarText: {
    fontSize: 20,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
  },

  compactAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  
  // Simple Status Dot
  compactStatusDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#fcd3aa',
    borderWidth: 2,
    borderColor: '#000000',
  },
  
  // Compact User Info
  compactUserInfo: {
    flex: 1,
  },
  
  compactGreeting: {
    fontSize: 15,
    fontFamily: getSystemFont('semiBold'),
    color: '#fcd3aa',
    marginBottom: 3,
  },
  
  compactUserName: {
    fontSize: 20,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  
  // Compact Action Buttons
  compactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  
  compactActionButton: {
    position: 'relative',
  },
  
  compactButton: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  buttonBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 2,
    shadowColor: '#000000',
    position: 'relative',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  
  friendRequestBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ff4757',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
    elevation: 8,
    shadowColor: '#ff4757',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  
  friendRequestBadgeText: {
    fontSize: 9,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    lineHeight: 12,
  },
  
  // Simple Notification Badge
  compactBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#fcd3aa',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  
  compactBadgeText: {
    fontSize: 10,
    fontFamily: getSystemFont('bold'),
    color: '#000000',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  notificationsModal: {
    backgroundColor: '#000000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#333333',
  },
  modalHeader: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  modalHeaderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationsList: {
    flex: 1,
    backgroundColor: '#000000',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    backgroundColor: '#000000',
  },
  unreadNotification: {
    backgroundColor: '#0091ad08',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#cccccc',
    marginBottom: 4,
  },
  unreadTitle: {
    color: '#ffffff',
  },
  notificationMessage: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: '#999999',
    marginBottom: 4,
    lineHeight: 18,
  },
  notificationTime: {
    fontSize: 12,
    fontFamily: getSystemFont('regular'),
    color: '#666666',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0091ad',
    marginLeft: 8,
  },
  emptyNotifications: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: '#cccccc',
    textAlign: 'center',
  },
  clearAllButton: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  clearAllText: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#ff6b6b',
  },
});

export default DashboardHeader;