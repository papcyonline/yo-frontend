// PrivacySettingsScreen.tsx - Privacy and security settings
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getSystemFont } from '../../config/constants';
import { API_CONFIG } from '../../constants/api';
import { useAuthStore } from '../../store/authStore';
import logger from '../../services/LoggingService';

interface PrivacySettingsScreenProps {
  navigation: any;
}

interface PrivacySetting {
  id: string;
  title: string;
  description: string;
  icon: string;
  value: boolean | string;
  type: 'boolean' | 'selection';
  options?: string[];
}

const PrivacySettingsScreen: React.FC<PrivacySettingsScreenProps> = ({ navigation }) => {
  const { token, user } = useAuthStore();

  const [privacySettings, setPrivacySettings] = useState<PrivacySetting[]>([
    {
      id: 'profile_visibility',
      title: 'Profile Visibility',
      description: 'Who can see your profile',
      icon: 'person-circle',
      value: 'Friends Only',
      type: 'selection',
      options: ['Public', 'Friends Only', 'Private']
    },
    {
      id: 'family_tree_visibility',
      title: 'Family Tree Visibility',
      description: 'Who can view your family tree',
      icon: 'git-network',
      value: 'Family Members',
      type: 'selection',
      options: ['Public', 'Family Members', 'Private']
    },
    {
      id: 'location_sharing',
      title: 'Location Sharing',
      description: 'Share your location with family members',
      icon: 'location',
      value: true,
      type: 'boolean'
    },
    {
      id: 'activity_status',
      title: 'Activity Status',
      description: 'Show when you\'re active',
      icon: 'pulse',
      value: true,
      type: 'boolean'
    },
    {
      id: 'friend_requests',
      title: 'Friend Requests',
      description: 'Who can send you friend requests',
      icon: 'person-add',
      value: 'Everyone',
      type: 'selection',
      options: ['Everyone', 'Friends of Friends', 'No One']
    },
    {
      id: 'search_visibility',
      title: 'Search Visibility',
      description: 'Allow others to find you by search',
      icon: 'search',
      value: true,
      type: 'boolean'
    },
    {
      id: 'data_sharing',
      title: 'Data Sharing',
      description: 'Share anonymized data for family research',
      icon: 'analytics',
      value: false,
      type: 'boolean'
    },
    {
      id: 'marketing_emails',
      title: 'Marketing Emails',
      description: 'Receive promotional emails',
      icon: 'mail',
      value: false,
      type: 'boolean'
    }
  ]);

  const handleBooleanToggle = async (settingId: string, newValue: boolean) => {
    try {
      logger.debug('Updating privacy setting', { settingId, newValue });

      setPrivacySettings(prev => 
        prev.map(setting => 
          setting.id === settingId 
            ? { ...setting, value: newValue }
            : setting
        )
      );

      // In a real implementation, this would save to the server
      if (token) {
        // await API call to save setting
      }

    } catch (error) {
      logger.error('Error updating privacy setting', error);
      Alert.alert('Error', 'Failed to update setting. Please try again.');
      
      // Revert on error
      setPrivacySettings(prev => 
        prev.map(setting => 
          setting.id === settingId 
            ? { ...setting, value: !newValue }
            : setting
        )
      );
    }
  };

  const handleSelectionSetting = (settingId: string, options: string[], currentValue: string) => {
    const showActionSheet = () => {
      const actionSheetOptions = [...options, 'Cancel'];
      const cancelButtonIndex = options.length;

      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: actionSheetOptions,
            cancelButtonIndex,
            title: 'Select Option',
          },
          (buttonIndex) => {
            if (buttonIndex !== cancelButtonIndex && buttonIndex < options.length) {
              updateSelectionSetting(settingId, options[buttonIndex]);
            }
          }
        );
      } else {
        // For Android, show a simple alert
        Alert.alert(
          'Select Option',
          'Choose your preference',
          [
            ...options.map(option => ({
              text: option,
              onPress: () => updateSelectionSetting(settingId, option)
            })),
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      }
    };

    showActionSheet();
  };

  const updateSelectionSetting = async (settingId: string, newValue: string) => {
    try {
      logger.debug('Updating selection setting', { settingId, newValue });

      setPrivacySettings(prev => 
        prev.map(setting => 
          setting.id === settingId 
            ? { ...setting, value: newValue }
            : setting
        )
      );

      // In a real implementation, this would save to the server
      if (token) {
        // await API call to save setting
      }

    } catch (error) {
      logger.error('Error updating selection setting', error);
      Alert.alert('Error', 'Failed to update setting. Please try again.');
    }
  };

  const handleDataExport = () => {
    Alert.alert(
      'Export Data',
      'Request a copy of all your data. You\'ll receive an email when it\'s ready.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Request Export',
          onPress: () => {
            Alert.alert('Export Requested', 'You\'ll receive an email when your data export is ready.');
          }
        }
      ]
    );
  };

  const handleAccountDeletion = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            navigation.navigate('DeleteAccount');
          }
        }
      ]
    );
  };

  const renderPrivacySetting = (setting: PrivacySetting) => (
    <View key={setting.id} style={styles.settingCard}>
      <View style={styles.settingHeader}>
        <View style={styles.settingIcon}>
          <Ionicons name={setting.icon as any} size={24} color="#0091ad" />
        </View>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>{setting.title}</Text>
          <Text style={styles.settingDescription}>{setting.description}</Text>
          {setting.type === 'selection' && (
            <Text style={styles.settingValue}>Current: {setting.value as string}</Text>
          )}
        </View>
        <View style={styles.settingControl}>
          {setting.type === 'boolean' ? (
            <Switch
              value={setting.value as boolean}
              onValueChange={(newValue) => handleBooleanToggle(setting.id, newValue)}
              trackColor={{ false: '#374151', true: '#0091ad50' }}
              thumbColor={setting.value ? '#0091ad' : '#6b7280'}
              ios_backgroundColor="#374151"
            />
          ) : (
            <TouchableOpacity
              style={styles.selectionButton}
              onPress={() => handleSelectionSetting(
                setting.id, 
                setting.options || [], 
                setting.value as string
              )}
            >
              <Text style={styles.selectionButtonText}>Change</Text>
              <Ionicons name="chevron-forward" size={16} color="#0091ad" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fcd3aa" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Introduction */}
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>Control Your Privacy</Text>
          <Text style={styles.introText}>
            Manage how your information is shared and who can see your profile and family tree.
          </Text>
        </View>

        {/* Privacy Settings */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Privacy Controls</Text>
          {privacySettings.map(renderPrivacySetting)}
        </View>

        {/* Data Management */}
        <View style={styles.dataSection}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <TouchableOpacity style={styles.actionCard} onPress={handleDataExport}>
            <View style={styles.actionHeader}>
              <View style={[styles.actionIcon, { backgroundColor: '#0091ad20' }]}>
                <Ionicons name="download" size={24} color="#0091ad" />
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Export My Data</Text>
                <Text style={styles.actionDescription}>
                  Download a copy of all your data
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#fcd3aa" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={handleAccountDeletion}>
            <View style={styles.actionHeader}>
              <View style={[styles.actionIcon, { backgroundColor: '#ef444420' }]}>
                <Ionicons name="trash" size={24} color="#ef4444" />
              </View>
              <View style={styles.actionInfo}>
                <Text style={[styles.actionTitle, { color: '#ef4444' }]}>Delete Account</Text>
                <Text style={styles.actionDescription}>
                  Permanently delete your account
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ef4444" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Privacy Notice */}
        <View style={styles.noticeSection}>
          <View style={styles.noticeCard}>
            <Ionicons name="shield-checkmark" size={24} color="#22c55e" />
            <Text style={styles.noticeTitle}>Your Privacy Matters</Text>
            <Text style={styles.noticeText}>
              We are committed to protecting your privacy. Your personal information 
              is encrypted and never shared without your explicit consent.
            </Text>
            <TouchableOpacity style={styles.policyLink}>
              <Text style={styles.policyLinkText}>Read Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
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
  },
  headerSpacer: {
    width: 48,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  introSection: {
    marginTop: 24,
    marginBottom: 32,
  },
  introTitle: {
    fontSize: 24,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginBottom: 12,
  },
  introText: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 24,
  },
  settingsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: getSystemFont('bold'),
    color: '#fcd3aa',
    marginBottom: 16,
  },
  settingCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,145,173,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.6)',
  },
  settingValue: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: '#0091ad',
    marginTop: 4,
  },
  settingControl: {
    alignItems: 'center',
  },
  selectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,145,173,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  selectionButtonText: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: '#0091ad',
  },
  dataSection: {
    marginBottom: 32,
  },
  actionCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.6)',
  },
  noticeSection: {
    marginBottom: 32,
  },
  noticeCard: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.2)',
  },
  noticeTitle: {
    fontSize: 18,
    fontFamily: getSystemFont('bold'),
    color: '#22c55e',
    marginTop: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
  noticeText: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  policyLink: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  policyLinkText: {
    fontSize: 14,
    fontFamily: getSystemFont('bold'),
    color: '#22c55e',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});

export default PrivacySettingsScreen;