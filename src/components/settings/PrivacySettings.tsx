// src/screens/settings/PrivacySettings.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { privacyService, PrivacySettings as PrivacySettingsType } from '../../services/privacyService';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';
import { getSystemFont } from '../../config/constants';

interface PrivacySettingsProps {
  navigation: any;
  route: any;
}

const PrivacySettings: React.FC<PrivacySettingsProps> = ({ navigation, route }) => {
  const { user } = route.params || {};
  const { token } = useAuthStore();
  const { theme, isDark } = useTheme();

  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState<PrivacySettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Load privacy settings on mount
  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    if (!token) {
      console.log('❌ No token available for privacy settings');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('📡 Loading privacy settings...');
      const settings = await privacyService.getPrivacySettings(token);
      console.log('✅ Privacy settings loaded:', settings);
      setPrivacySettings(settings);
    } catch (error) {
      console.error('❌ Failed to load privacy settings:', error);
      Alert.alert('Error', 'Failed to load privacy settings. Using defaults.');
      // Set default settings if API fails
      setPrivacySettings({
        profile_visibility: 'friends',
        show_online_status: true,
        allow_friend_requests: true,
        show_last_seen: true,
        allow_message_requests: true,
        share_location: false,
        show_phone_number: false,
        show_email: true,
        allow_tagging: true,
        data_analytics: true,
        ad_personalization: false
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePrivacySetting = async (key: keyof PrivacySettingsType, value: any) => {
    if (!privacySettings) return;
    
    // Update local state immediately for responsive UI
    const updatedSettings = {
      ...privacySettings,
      [key]: value
    };
    setPrivacySettings(updatedSettings);
    
    // All privacy fields are now fully supported by the backend
    const supportedFields = [
      'profile_visibility', 'share_location', 'show_online_status',
      'allow_friend_requests', 'show_last_seen', 'allow_message_requests',
      'show_phone_number', 'show_email', 'allow_tagging', 
      'data_analytics', 'ad_personalization'
    ];
    
    if (supportedFields.includes(key)) {
      if (!token) {
        console.log('❌ No token available for backend update');
        return;
      }
      
      try {
        setUpdating(true);
        console.log(`🔄 Updating backend ${key} to:`, value);
        const backendUpdatedSettings = await privacyService.updatePrivacySettings(token, {
          [key]: value
        });
        console.log('✅ Backend privacy setting updated:', backendUpdatedSettings);
        
        // Only update the specific field that was changed to avoid overriding UI state
        setPrivacySettings(prev => ({
          ...prev,
          [key]: backendUpdatedSettings[key] !== undefined ? backendUpdatedSettings[key] : value
        }));
      } catch (error) {
        console.error('❌ Failed to update backend privacy setting:', error);
        Alert.alert('Error', 'Failed to save privacy setting to server');
        
        // Revert local state on backend failure
        setPrivacySettings(prevSettings => ({
          ...prevSettings,
          [key]: !value // Revert the change
        }));
      } finally {
        setUpdating(false);
      }
    } else {
      console.log(`📝 ${key} updated locally only (not yet supported by backend)`);
    }
  };

  const PrivacyItem = ({
    title,
    subtitle,
    value,
    onValueChange,
    type = 'switch',
    options = [],
    onPress,
    iconName = 'shield-checkmark',
    iconColor = '#0091ad',
    disabled = false,
  }: {
    title: string;
    subtitle: string;
    value: boolean | string;
    onValueChange?: (value: any) => void;
    type?: 'switch' | 'select';
    options?: string[];
    onPress?: () => void;
    iconName?: string;
    iconColor?: string;
    disabled?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.privacyItem}
      onPress={type === 'select' ? onPress : undefined}
      disabled={type === 'switch'}
    >
      <View style={[styles.privacyIcon, { backgroundColor: `${iconColor}30` }]}>
        <Ionicons name={iconName as any} size={20} color={iconColor} />
      </View>
      <View style={styles.privacyContent}>
        <Text style={dynamicStyles.privacyTitle}>
          {title}
        </Text>
        <Text style={dynamicStyles.privacySubtitle}>
          {subtitle}
        </Text>
      </View>
      {type === 'switch' && (
        <Switch
          value={value as boolean}
          onValueChange={onValueChange}
          trackColor={{ false: '#333333', true: '#0091ad' }}
          thumbColor={value ? '#fcd3aa' : '#666666'}
          disabled={disabled}
        />
      )}
      {type === 'select' && (
        <View style={styles.selectContainer}>
          <Text style={styles.selectValue}>
            {(value as string).charAt(0).toUpperCase() + (value as string).slice(1)}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={20}
            color="#fcd3aa"
          />
        </View>
      )}
    </TouchableOpacity>
  );

  const showProfileVisibilityOptions = () => {
    Alert.alert(
      'Profile Visibility',
      'Who can see your profile information?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Public', onPress: () => updatePrivacySetting('profile_visibility', 'public') },
        { text: 'Friends Only', onPress: () => updatePrivacySetting('profile_visibility', 'friends') },
        { text: 'Private', onPress: () => updatePrivacySetting('profile_visibility', 'private') },
      ]
    );
  };

  const handleDataDownload = async () => {
    if (!token) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    Alert.alert(
      'Download Your Data',
      'We will prepare your data and send you a download link via email within 48 hours.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Request Download', 
          onPress: async () => {
            try {
              await privacyService.requestDataDownload(token);
              Alert.alert('Success', 'Data download request submitted! You will receive an email within 48 hours.');
            } catch (error) {
              console.error('Data download request failed:', error);
              Alert.alert('Error', 'Failed to submit data download request');
            }
          }
        },
      ]
    );
  };

  const handleAccountDeactivation = () => {
    Alert.alert(
      'Deactivate Account',
      'Your account will be hidden from others but your data will be preserved. You can reactivate anytime.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Deactivate', 
          style: 'destructive',
          onPress: () => navigation.navigate('DeactivateAccount', { user, darkMode })
        },
      ]
    );
  };

  // Create dynamic styles based on theme
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    loadingText: {
      fontSize: 16,
      fontFamily: getSystemFont('medium'),
      color: theme.text,
      marginTop: 16,
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
    privacyTitle: {
      fontSize: 16,
      fontFamily: getSystemFont('semiBold'),
      color: theme.text,
      marginBottom: 2,
    },
    privacySubtitle: {
      fontSize: 14,
      fontFamily: getSystemFont('regular'),
      color: theme.textSecondary,
    },
    sectionTitle: {
      fontSize: 16,
      fontFamily: getSystemFont('bold'),
      color: isDark ? '#fcd3aa' : theme.primary,
      flex: 1,
    },
    actionTitle: {
      fontSize: 16,
      fontFamily: getSystemFont('semiBold'),
      color: theme.text,
      marginBottom: 2,
    },
    actionSubtitle: {
      fontSize: 14,
      fontFamily: getSystemFont('regular'),
      color: theme.textSecondary,
    },
    selectValue: {
      fontSize: 16,
      fontFamily: getSystemFont('medium'),
      color: theme.accent,
      marginRight: 8,
    },
  });

  if (loading) {
    return (
      <View style={[dynamicStyles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={dynamicStyles.loadingText}>Loading Privacy Settings...</Text>
      </View>
    );
  }

  return (
    <View style={dynamicStyles.container}>
      {/* Background Pattern */}
      <View style={styles.backgroundPattern}>
        <LinearGradient
          colors={['#0091ad15', '#04a7c715']}
          style={styles.bgGradient1}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <LinearGradient
          colors={['#fcd3aa10', '#0091ad10']}
          style={styles.bgGradient2}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </View>

      {/* Header */}
      <LinearGradient
        colors={['#0091ad', '#04a7c7']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Settings</Text>
        <View style={styles.headerPlaceholder} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Privacy */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: '#0091ad30' }]}>
              <Ionicons name="person-outline" size={24} color="#0091ad" />
            </View>
            <Text style={dynamicStyles.sectionTitle}>Profile Privacy</Text>
          </View>
          <View style={dynamicStyles.sectionContent}>
            <PrivacyItem
              title="Profile Visibility"
              subtitle="Control who can see your profile"
              value={privacySettings?.profile_visibility || 'friends'}
              type="select"
              onPress={showProfileVisibilityOptions}
              iconName="eye"
              iconColor="#0091ad"
              disabled={updating}
            />
            <PrivacyItem
              title="Show Online Status"
              subtitle="Let others see when you're online"
              value={privacySettings?.show_online_status || false}
              onValueChange={(value) => updatePrivacySetting('show_online_status', value)}
              iconName="radio-button-on"
              iconColor="#04a7c7"
              disabled={updating}
            />
            <PrivacyItem
              title="Show Last Seen"
              subtitle="Display when you were last active"
              value={privacySettings?.show_last_seen || false}
              onValueChange={(value) => updatePrivacySetting('show_last_seen', value)}
              iconName="time"
              iconColor="#0091ad"
              disabled={updating}
            />
            <PrivacyItem
              title="Show Phone Number"
              subtitle="Display your phone number on profile"
              value={privacySettings?.show_phone_number || false}
              onValueChange={(value) => updatePrivacySetting('show_phone_number', value)}
              iconName="call"
              iconColor="#04a7c7"
              disabled={updating}
            />
            <PrivacyItem
              title="Show Email Address"
              subtitle="Display your email on profile"
              value={privacySettings?.show_email || false}
              onValueChange={(value) => updatePrivacySetting('show_email', value)}
              iconName="mail"
              iconColor="#0091ad"
              disabled={updating}
            />
          </View>
        </View>

        {/* Communication Privacy */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: '#04a7c730' }]}>
              <Ionicons name="chatbubbles-outline" size={24} color="#04a7c7" />
            </View>
            <Text style={dynamicStyles.sectionTitle}>Communication</Text>
          </View>
          <View style={dynamicStyles.sectionContent}>
            <PrivacyItem
              title="Friend Requests"
              subtitle="Allow others to send you friend requests"
              value={privacySettings?.allow_friend_requests || false}
              onValueChange={(value) => updatePrivacySetting('allow_friend_requests', value)}
              iconName="person-add"
              iconColor="#04a7c7"
              disabled={updating}
            />
            <PrivacyItem
              title="Message Requests"
              subtitle="Allow messages from people you don't know"
              value={privacySettings?.allow_message_requests || false}
              onValueChange={(value) => updatePrivacySetting('allow_message_requests', value)}
              iconName="chatbubble"
              iconColor="#0091ad"
              disabled={updating}
            />
            <PrivacyItem
              title="Allow Tagging"
              subtitle="Let others tag you in posts and photos"
              value={privacySettings?.allow_tagging || false}
              onValueChange={(value) => updatePrivacySetting('allow_tagging', value)}
              iconName="pricetag"
              iconColor="#04a7c7"
              disabled={updating}
            />
          </View>
        </View>

        {/* Location Privacy */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: '#fcd3aa30' }]}>
              <Ionicons name="location-outline" size={24} color="#fcd3aa" />
            </View>
            <Text style={dynamicStyles.sectionTitle}>Location</Text>
          </View>
          <View style={dynamicStyles.sectionContent}>
            <PrivacyItem
              title="Share Location"
              subtitle="Allow location sharing with friends and family"
              value={privacySettings?.share_location || false}
              onValueChange={(value) => updatePrivacySetting('share_location', value)}
              iconName="navigate"
              iconColor="#fcd3aa"
              disabled={updating}
            />
          </View>
        </View>

        {/* Data & Analytics */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: '#0091ad30' }]}>
              <Ionicons name="analytics-outline" size={24} color="#0091ad" />
            </View>
            <Text style={dynamicStyles.sectionTitle}>Data & Analytics</Text>
          </View>
          <View style={dynamicStyles.sectionContent}>
            <PrivacyItem
              title="Usage Analytics"
              subtitle="Help improve the app by sharing usage data"
              value={privacySettings?.data_analytics || false}
              onValueChange={(value) => updatePrivacySetting('data_analytics', value)}
              iconName="stats-chart"
              iconColor="#0091ad"
              disabled={updating}
            />
            <PrivacyItem
              title="Ad Personalization"
              subtitle="Show personalized ads based on your activity"
              value={privacySettings?.ad_personalization || false}
              onValueChange={(value) => updatePrivacySetting('ad_personalization', value)}
              iconName="megaphone"
              iconColor="#04a7c7"
              disabled={updating}
            />
          </View>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: '#04a7c730' }]}>
              <Ionicons name="folder-outline" size={24} color="#04a7c7" />
            </View>
            <Text style={dynamicStyles.sectionTitle}>Data Management</Text>
          </View>
          <View style={dynamicStyles.sectionContent}>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={handleDataDownload}
            >
              <View style={[styles.privacyIcon, { backgroundColor: '#0091ad30' }]}>
                <Ionicons name="download" size={20} color="#0091ad" />
              </View>
              <View style={styles.actionContent}>
                <Text style={dynamicStyles.actionTitle}>
                  Download Your Data
                </Text>
                <Text style={dynamicStyles.actionSubtitle}>
                  Get a copy of all your data
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color="#fcd3aa"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={handleAccountDeactivation}
            >
              <View style={[styles.privacyIcon, { backgroundColor: '#ff6b6b30' }]}>
                <Ionicons name="pause-circle" size={20} color="#ff6b6b" />
              </View>
              <View style={styles.actionContent}>
                <Text style={dynamicStyles.actionTitle}>
                  Deactivate Account
                </Text>
                <Text style={dynamicStyles.actionSubtitle}>
                  Temporarily disable your account
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color="#fcd3aa"
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  bgGradient1: {
    position: 'absolute',
    top: 150,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  bgGradient2: {
    position: 'absolute',
    bottom: 200,
    left: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerPlaceholder: {
    width: 40,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: getSystemFont('bold'),
    color: '#fcd3aa',
    flex: 1,
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
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  privacyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  privacyContent: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
    marginBottom: 2,
  },
  privacySubtitle: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: '#cccccc',
  },
  selectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectValue: {
    fontSize: 16,
    fontFamily: getSystemFont('medium'),
    color: '#fcd3aa',
    marginRight: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: '#cccccc',
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

export default PrivacySettings;