// src/screens/SettingsPage.tsx - Updated with backend integration
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Switch,
  ActivityIndicator,
  Image,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomNavigation } from '../dashboard/BottomNavigation';
import { settingsService, UserPreferences } from '../../services/settingsService';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';
import { getSystemFont } from '../../config/constants';
import { useUnreadChats } from '../../hooks/useUnreadChats';
import logger from '../../services/LoggingService';
import * as StoreReview from 'expo-store-review';
import ratingService from '../../services/RatingService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsPageProps {
  navigation: any;
  route: any;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ navigation, route }) => {
  const { user: routeUser } = route.params || {};
  const { user: authUser, token } = useAuthStore();
  const { theme, isDark } = useTheme();
  
  // Debug: Log component render
  logger.debug('Settings page component rendered');
  logger.debug('Settings page route user ID', routeUser?.id || routeUser?._id);
  logger.debug('Settings page auth user ID', authUser?.id || authUser?._id);
  
  // Helper function to get user avatar URL
  const getUserAvatar = () => {
    const user = routeUser || authUser;
    
    // Debug logging
    logger.debug('Getting avatar for user', user?.id || user?._id);
    logger.debug('Available image fields', {
      profile_photo_url: user?.profile_photo_url,
      profile_picture_url: user?.profile_picture_url,
      profilePhotoUrl: user?.profilePhotoUrl,
      profilePictureUrl: user?.profilePictureUrl,
      avatarUrl: user?.avatarUrl,
      avatar_url: user?.avatar_url
    });
    
    // Check all possible image URL fields from backend
    if (user?.profile_photo_url) return user.profile_photo_url;
    if (user?.profile_picture_url) return user.profile_picture_url;
    if (user?.profilePhotoUrl) return user.profilePhotoUrl;
    if (user?.profilePictureUrl) return user.profilePictureUrl;
    if (user?.avatarUrl) return user.avatarUrl;
    if (user?.avatar_url) return user.avatar_url;
    if (user?.profileImage) return user.profileImage;
    return null;
  };
  
  // Create dynamic styles based on theme
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 50,
      paddingBottom: 16,
      paddingHorizontal: 16,
      backgroundColor: theme.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitle: {
      fontSize: 24,
      fontFamily: getSystemFont('bold'),
      color: theme.text,
      flex: 1,
      textAlign: 'center',
      marginHorizontal: 16,
    },
    profileCard: {
      margin: 16,
      borderRadius: 16,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      elevation: 2,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.shadowOpacity,
      shadowRadius: 4,
    },
    profileName: {
      fontSize: 20,
      fontFamily: getSystemFont('bold'),
      color: theme.text,
      marginBottom: 4,
    },
    profileEmail: {
      fontSize: 14,
      fontFamily: getSystemFont('regular'),
      color: theme.textSecondary,
      marginBottom: 6,
    },
    profileEditText: {
      fontSize: 12,
      fontFamily: getSystemFont('medium'),
      color: theme.accent,
    },
    sectionTitle: {
      fontSize: 16,
      fontFamily: getSystemFont('bold'),
      color: theme.accent,
      marginBottom: 12,
      marginLeft: 4,
    },
    sectionContent: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      overflow: 'hidden',
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: theme.shadowOpacity,
      shadowRadius: 3,
      elevation: 2,
      borderWidth: 1,
      borderColor: theme.border,
    },
    settingTitle: {
      fontSize: 16,
      fontFamily: getSystemFont('semiBold'),
      color: theme.text,
      marginBottom: 2,
    },
    settingSubtitle: {
      fontSize: 14,
      fontFamily: getSystemFont('regular'),
      color: theme.textSecondary,
    },
    versionText: {
      fontSize: 14,
      fontFamily: getSystemFont('medium'),
      color: theme.accent,
      marginBottom: 4,
    },
    buildText: {
      fontSize: 12,
      fontFamily: getSystemFont('regular'),
      color: theme.textSecondary,
    },
    loadingText: {
      fontSize: 16,
      fontFamily: getSystemFont('medium'),
      color: theme.text,
      marginTop: 16,
    },
  });
  
  // Use auth store user data if available, fallback to route params
  const user = authUser || routeUser;
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState('settings');
  const { unreadCount } = useUnreadChats();

  // Load user preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    logger.debug('🔧 Loading preferences. Token exists:', !!token);
    if (!token) {
      logger.debug('❌ No token available for settings - using default preferences');
      setPreferences({
        dark_mode: false,
        notifications_enabled: true,
        location_enabled: true,
        language: 'en',
        privacy_level: 'friends',
        email_notifications: true,
        push_notifications: true,
        sms_notifications: false,
        match_notifications: true,
        community_notifications: true,
        message_notifications: true,
      });
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      logger.debug('📡 Calling settings API...');
      const userPreferences = await settingsService.getPreferences(token);
      logger.debug('✅ Settings loaded:', userPreferences);
      setPreferences(userPreferences);
    } catch (error) {
      console.error('❌ Failed to load preferences:', error);
      logger.debug('Using default preferences as fallback');
      setPreferences({
        dark_mode: false,
        notifications_enabled: true,
        location_enabled: true,
        language: 'en',
        privacy_level: 'friends',
        email_notifications: true,
        push_notifications: true,
        sms_notifications: false,
        match_notifications: true,
        community_notifications: true,
        message_notifications: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: keyof UserPreferences, value: any) => {
    if (!preferences) return;
    
    // Update local state immediately for better UX
    setPreferences(prev => prev ? { ...prev, [key]: value } : null);
    
    if (!token) {
      logger.debug('⚠️ No token available - changes saved locally only');
      return;
    }
    
    try {
      setUpdating(true);
      const updatedPreferences = await settingsService.updatePreferences(token, {
        [key]: value
      });
      setPreferences(updatedPreferences);
    } catch (error) {
      console.error('Failed to update preference:', error);
      // Revert the local change on error
      setPreferences(prev => prev ? { ...prev, [key]: !value } : null);
      Alert.alert('Error', 'Failed to update setting - changes reverted');
    } finally {
      setUpdating(false);
    }
  };

  const handleProfileEdit = () => {
    navigation.navigate('UserProfile', { 
      user, 
      isOwnProfile: true 
    });
  };

  const handlePrivacySettings = () => {
    navigation.navigate('PrivacySettings', { user, darkMode: isDark });
  };

  const handleSecurity = () => {
    navigation.navigate('SecuritySettings', { user, darkMode: isDark });
  };

  const handleFriendRequests = () => {
    navigation.navigate('FriendRequests', { user });
  };

  const handleBlockedUsers = () => {
    navigation.navigate('BlockedUsers', { user });
  };

  const handleContentFilters = () => {
    navigation.navigate('ContentFilters', { user });
  };

  const handleSupport = () => {
    navigation.navigate('HelpSupport', { user, darkMode: isDark });
  };

  const handleFeedback = () => {
    navigation.navigate('SendFeedback', { user, darkMode: isDark });
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Account', 
          style: 'destructive', 
          onPress: () => {
            navigation.navigate('DeleteAccount', { user, darkMode: isDark });
          }
        }
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive', 
          onPress: async () => {
            try {
              // Clear auth store (token, user data)
              const authStore = useAuthStore.getState();
              await authStore.logout();
              
              // Clear any cached data
              logger.info('User logged out successfully');
              
              // Navigate to login screen
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              logger.error('Logout error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleRateApp = async () => {
    try {
      // Try to show native rating prompt first
      await ratingService.showRatingPrompt();
      
      // Record this as a significant event
      await ratingService.recordSignificantEvent('manual_rating_request');
    } catch (error) {
      // If native rating isn't available, show manual prompt
      // First, record that we're showing a manual prompt
      try {
        const data = await ratingService.getRatingData();
        data.ratingPromptCount += 1;
        data.lastPromptDate = new Date().toISOString();
        await AsyncStorage.setItem('app_rating_data', JSON.stringify(data));
      } catch (trackingError) {
        console.log('Failed to update prompt count:', trackingError);
      }
      
      Alert.alert(
        'Rate YoFam',
        'We\'d love to hear your feedback! Your rating helps us improve the app for everyone.',
        [
          { 
            text: 'Not Now', 
            style: 'cancel',
            onPress: () => {
              logger.debug('User declined rating prompt');
            }
          },
          { 
            text: 'Rate 5 Stars ⭐', 
            onPress: async () => {
              try {
                await ratingService.openAppStore();
                Alert.alert('Thank You!', 'Thank you for taking the time to rate YoFam!');
              } catch (storeError) {
                console.error('Failed to open app store:', storeError);
                Alert.alert('Error', 'Unable to open the App Store. Please try again later.');
              }
            }
          },
          {
            text: 'Send Feedback',
            onPress: () => {
              // Navigate to feedback screen instead
              handleFeedback();
            }
          }
        ],
        { cancelable: true }
      );
    }
  };

  const handleAbout = async () => {
    try {
      const aboutInfo = await settingsService.getAboutInfo();
      Alert.alert('About', aboutInfo.content);
    } catch (error) {
      console.error('Failed to load about info:', error);
      Alert.alert('About', 'YoFam v1.0.0\\n\\n© 2025 YoFam Team');
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data including images, temporary files, and app cache. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear Cache', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear AsyncStorage cache
              const AsyncStorage = await import('@react-native-async-storage/async-storage');
              const keys = await AsyncStorage.default.getAllKeys();
              const cacheKeys = keys.filter(key => 
                key.startsWith('cache_') || 
                key.startsWith('temp_') ||
                key.includes('image_cache') ||
                key.includes('media_cache')
              );
              
              if (cacheKeys.length > 0) {
                await AsyncStorage.default.multiRemove(cacheKeys);
              }

              // Clear file system cache
              const FileSystem = await import('expo-file-system');
              const cacheDir = FileSystem.cacheDirectory;
              if (cacheDir) {
                try {
                  const cacheFiles = await FileSystem.readDirectoryAsync(cacheDir);
                  for (const file of cacheFiles) {
                    try {
                      await FileSystem.deleteAsync(`${cacheDir}${file}`, { idempotent: true });
                    } catch (err) {
                      // Continue if file deletion fails
                      console.log('Failed to delete cache file:', file);
                    }
                  }
                } catch (dirError) {
                  console.log('Cache directory not accessible:', dirError);
                }
              }

              Alert.alert('Cache Cleared', 'App cache has been cleared successfully.');
            } catch (error) {
              console.error('Clear cache error:', error);
              Alert.alert('Error', 'Failed to clear cache. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'This feature will export your profile data, messages, and app settings to a file.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Export', 
          onPress: () => {
            // TODO: Implement data export functionality
            Alert.alert('Coming Soon', 'Data export feature will be available in a future update.');
          }
        }
      ]
    );
  };

  // Handle bottom navigation
  const handleBottomTabPress = (tabId: string) => {
    setActiveBottomTab(tabId);
    
    switch (tabId) {
      case 'family':
        navigation.navigate('MainApp', { user });
        break;
      case 'friends':
        navigation.navigate('Friends', { user });
        break;
      case 'community':
        navigation.navigate('Communities', { user });
        break;
      case 'chats':
        navigation.navigate('ChatsPage', { user });
        break;
      case 'settings':
        // Already on settings page
        break;
      default:
        navigation.navigate('Dashboard', { user });
        break;
    }
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    showArrow = true, 
    rightComponent = null,
    color = '#0091ad',
    isDangerous = false
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showArrow?: boolean;
    rightComponent?: React.ReactNode;
    color?: string;
    isDangerous?: boolean;
  }) => (
    <TouchableOpacity 
      style={[
        styles.settingItem,
        isDangerous && styles.settingItemDanger
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.settingIcon, { backgroundColor: `${color}30` }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[
          dynamicStyles.settingTitle,
          isDangerous && styles.settingTitleDanger
        ]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={dynamicStyles.settingSubtitle}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightComponent}
      {showArrow && !rightComponent && (
        <Ionicons 
          name={Platform.OS === 'android' ? 'arrow-forward' : 'chevron-forward'} 
          size={20} 
          color={theme.accent} 
        />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={dynamicStyles.loadingText}>Loading Settings...</Text>
      </View>
    );
  }

  return (
    <View style={dynamicStyles.container}>
      {/* Modern Header */}
      <View style={dynamicStyles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.accent} />
        </TouchableOpacity>
        <Text style={dynamicStyles.headerTitle}>Settings</Text>
        <View style={styles.headerActions}>
          {/* Empty space for balanced layout */}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <TouchableOpacity style={dynamicStyles.profileCard} onPress={handleProfileEdit}>
          <View style={styles.profileContent}>
            {(() => {
              const user = routeUser || authUser;
              const avatarUrl = user?.profile_photo_url || user?.profile_picture_url || user?.profilePhotoUrl || user?.profilePictureUrl || user?.avatarUrl || user?.avatar_url;
              
              return avatarUrl ? (
                <Image
                  source={{ 
                    uri: `${avatarUrl}${avatarUrl.includes('?') ? '&' : '?'}t=${Date.now()}`
                  }}
                  style={styles.profileAvatar}
                  onError={(error) => logger.debug('⚙️ SETTINGS - Image load error:', error)}
                  onLoad={() => logger.debug('⚙️ SETTINGS - Image loaded successfully:', avatarUrl)}
                />
              ) : (
                <LinearGradient
                  colors={['#0091ad', '#04a7c7', '#fcd3aa']}
                  style={styles.profileAvatar}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.profileAvatarText}>
                    {user?.fullName ? user.fullName.split(' ').map((n: string) => n[0]).join('') : 
                     user?.first_name ? user.first_name[0].toUpperCase() + (user?.last_name ? user.last_name[0].toUpperCase() : '') :
                     user?.username ? user.username[0].toUpperCase() : 'U'}
                  </Text>
                </LinearGradient>
              );
            })()}
            <View style={styles.profileInfo}>
              <Text style={dynamicStyles.profileName}>{user?.username || user?.fullName || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'User Name'}</Text>
              <Text style={dynamicStyles.profileEmail}>{user?.email || user?.phone || 'Contact Info'}</Text>
              <Text style={dynamicStyles.profileEditText}>Tap to edit profile</Text>
            </View>
            <Ionicons 
              name={Platform.OS === 'android' ? 'arrow-forward' : 'chevron-forward'} 
              size={24} 
              color={theme.accent} 
            />
          </View>
        </TouchableOpacity>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={dynamicStyles.sectionTitle}>Account</Text>
          <View style={dynamicStyles.sectionContent}>
            <SettingItem
              icon="person"
              title="Profile Settings"
              subtitle="Edit your personal information"
              onPress={handleProfileEdit}
              color="#0091ad"
            />
            <SettingItem
              icon="shield-checkmark"
              title="Privacy Settings"
              subtitle="Control who can see your information"
              onPress={handlePrivacySettings}
              color="#04a7c7"
            />
            <SettingItem
              icon="lock-closed"
              title="Security"
              subtitle="Password, 2FA, and login settings"
              onPress={handleSecurity}
              color="#0091ad"
            />
            <SettingItem
              icon="people"
              title="Friend Requests"
              subtitle="Manage your connection requests"
              onPress={handleFriendRequests}
              color="#04a7c7"
            />
            <SettingItem
              icon="ban"
              title="Blocked Users"
              subtitle="Manage blocked users and safety settings"
              onPress={handleBlockedUsers}
              color="#ff6b6b"
            />
            <SettingItem
              icon="shield-checkmark"
              title="Content Filters"
              subtitle="Manage content moderation and safety filters"
              onPress={handleContentFilters}
              color="#8b5cf6"
            />
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={dynamicStyles.sectionTitle}>Preferences</Text>
          <View style={dynamicStyles.sectionContent}>
            <SettingItem
              icon="notifications"
              title="Notifications"
              subtitle="Manage notification preferences"
              showArrow={false}
              rightComponent={
                <Switch
                  value={preferences?.notifications_enabled || false}
                  onValueChange={(value) => updatePreference('notifications_enabled', value)}
                  trackColor={{ false: '#333333', true: '#0091ad' }}
                  thumbColor={preferences?.notifications_enabled ? '#fcd3aa' : '#666666'}
                  disabled={updating}
                />
              }
              color="#04a7c7"
            />
            <SettingItem
              icon="location"
              title="Location Services"
              subtitle="Allow location-based features"
              showArrow={false}
              rightComponent={
                <Switch
                  value={preferences?.location_enabled || false}
                  onValueChange={(value) => updatePreference('location_enabled', value)}
                  trackColor={{ false: '#333333', true: '#0091ad' }}
                  thumbColor={preferences?.location_enabled ? '#fcd3aa' : '#666666'}
                  disabled={updating}
                />
              }
              color="#0091ad"
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={dynamicStyles.sectionTitle}>Support</Text>
          <View style={dynamicStyles.sectionContent}>
            <SettingItem
              icon="help-circle"
              title="Help & Support"
              subtitle="Get help and contact support"
              onPress={handleSupport}
              color="#0091ad"
            />
            <SettingItem
              icon="chatbubble-ellipses"
              title="Send Feedback"
              subtitle="Help us improve the app"
              onPress={handleFeedback}
              color="#04a7c7"
            />
            <SettingItem
              icon="star"
              title="Rate App"
              subtitle="Rate us on the App Store"
              onPress={handleRateApp}
              color="#0091ad"
            />
            <SettingItem
              icon="information-circle"
              title="About"
              subtitle="App version and legal information"
              onPress={handleAbout}
              color="#04a7c7"
            />
          </View>
        </View>

        {/* App Maintenance Section */}
        <View style={styles.section}>
          <Text style={dynamicStyles.sectionTitle}>App Maintenance</Text>
          <View style={dynamicStyles.sectionContent}>
            <SettingItem
              icon="refresh"
              title="Clear Cache"
              subtitle="Clear app cache and temporary files"
              onPress={handleClearCache}
              color="#0091ad"
            />
            <SettingItem
              icon="download"
              title="Export Data"
              subtitle="Export your data for backup"
              onPress={handleExportData}
              color="#04a7c7"
            />
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={dynamicStyles.sectionTitle}>Account Actions</Text>
          <View style={dynamicStyles.sectionContent}>
            <SettingItem
              icon="trash"
              title="Delete Account"
              subtitle="Permanently delete your account and data"
              onPress={handleDeleteAccount}
              color="#ff6b6b"
              isDangerous={true}
            />
            <SettingItem
              icon="log-out"
              title="Sign Out"
              subtitle="Sign out of your account"
              onPress={handleLogout}
              color="#ff6b6b"
            />
          </View>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={dynamicStyles.versionText}>YoFam v{require('../../../package.json').version}</Text>
          <Text style={dynamicStyles.buildText}>Build {new Date().getFullYear()}.{String(new Date().getMonth() + 1).padStart(2, '0')}.001</Text>
          <Text style={dynamicStyles.buildText}>Environment: {__DEV__ ? 'Development' : 'Production'}</Text>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <BottomNavigation
        activeTab="settings"
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
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
    fontSize: 24,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  profileCard: {
    margin: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(252,211,170,0.1)',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    elevation: 3,
    shadowColor: '#0091ad',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  profileAvatarText: {
    fontSize: 22,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 6,
  },
  profileEditText: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: 'rgba(252,211,170,0.8)',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: getSystemFont('bold'),
    color: '#fcd3aa',
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#fcd3aa',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#333333',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  settingItemDanger: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
    marginBottom: 2,
  },
  settingTitleDanger: {
    color: '#ff6b6b',
  },
  settingSubtitle: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: '#cccccc',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
    color: '#fcd3aa',
    marginBottom: 4,
  },
  buildText: {
    fontSize: 12,
    fontFamily: getSystemFont('regular'),
    color: '#999999',
  },
  bottomSpacing: {
    height: 100,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: getSystemFont('medium'),
    color: '#ffffff',
    marginTop: 16,
  },
});

export default SettingsPage;