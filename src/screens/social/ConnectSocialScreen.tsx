// ConnectSocialScreen.tsx - Social media connection management
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getSystemFont } from '../../config/constants';
import { API_CONFIG } from '../../constants/api';
import { useAuthStore } from '../../store/authStore';
import logger from '../../services/LoggingService';

interface ConnectSocialScreenProps {
  navigation: any;
}

interface SocialAccount {
  platform: string;
  name: string;
  icon: string;
  color: string;
  isConnected: boolean;
  username?: string;
  description: string;
}

const ConnectSocialScreen: React.FC<ConnectSocialScreenProps> = ({ navigation }) => {
  const { token, user } = useAuthStore();
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [autoSync, setAutoSync] = useState(true);

  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([
    {
      platform: 'facebook',
      name: 'Facebook',
      icon: 'logo-facebook',
      color: '#1877F2',
      isConnected: false,
      description: 'Connect with family and friends'
    },
    {
      platform: 'instagram',
      name: 'Instagram',
      icon: 'logo-instagram',
      color: '#E4405F',
      isConnected: false,
      description: 'Share your family moments'
    },
    {
      platform: 'twitter',
      name: 'X (Twitter)',
      icon: 'logo-twitter',
      color: '#000000',
      isConnected: false,
      description: 'Connect and share updates'
    },
    {
      platform: 'linkedin',
      name: 'LinkedIn',
      icon: 'logo-linkedin',
      color: '#0A66C2',
      isConnected: false,
      description: 'Professional family network'
    }
  ]);

  const handleConnectAccount = async (platform: string) => {
    try {
      setLoading(prev => ({ ...prev, [platform]: true }));
      logger.debug('Connecting social account', { platform });

      // Simulate OAuth flow
      Alert.alert(
        `Connect ${platform}`,
        `This would redirect to ${platform} OAuth flow in a real implementation.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Connect',
            onPress: () => {
              setSocialAccounts(prev => 
                prev.map(account => 
                  account.platform === platform
                    ? { ...account, isConnected: true, username: `${user?.name || 'user'}123` }
                    : account
                )
              );
              Alert.alert('Success', `${platform} account connected successfully!`);
            }
          }
        ]
      );
    } catch (error) {
      logger.error('Error connecting social account', error);
      Alert.alert('Connection Failed', 'Unable to connect account. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, [platform]: false }));
    }
  };

  const handleDisconnectAccount = async (platform: string) => {
    Alert.alert(
      'Disconnect Account',
      `Are you sure you want to disconnect your ${platform} account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => {
            setSocialAccounts(prev => 
              prev.map(account => 
                account.platform === platform
                  ? { ...account, isConnected: false, username: undefined }
                  : account
              )
            );
            Alert.alert('Disconnected', `${platform} account has been disconnected.`);
          }
        }
      ]
    );
  };

  const renderSocialAccount = (account: SocialAccount) => (
    <View key={account.platform} style={styles.accountCard}>
      <View style={styles.accountHeader}>
        <View style={[styles.accountIcon, { backgroundColor: account.color }]}>
          <Ionicons name={account.icon as any} size={24} color="#ffffff" />
        </View>
        <View style={styles.accountInfo}>
          <Text style={styles.accountName}>{account.name}</Text>
          <Text style={styles.accountDescription}>{account.description}</Text>
          {account.isConnected && account.username && (
            <Text style={styles.accountUsername}>@{account.username}</Text>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.connectButton,
            account.isConnected && styles.connectedButton
          ]}
          onPress={() => account.isConnected 
            ? handleDisconnectAccount(account.platform)
            : handleConnectAccount(account.platform)
          }
          disabled={loading[account.platform]}
        >
          {loading[account.platform] ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <LinearGradient
              colors={account.isConnected 
                ? ['#ef4444', '#dc2626']
                : [account.color, account.color + '80']
              }
              style={styles.connectButtonGradient}
            >
              <Text style={styles.connectButtonText}>
                {account.isConnected ? 'Disconnect' : 'Connect'}
              </Text>
            </LinearGradient>
          )}
        </TouchableOpacity>
      </View>
      
      {account.isConnected && (
        <View style={styles.connectedFeatures}>
          <Text style={styles.featuresTitle}>Connected Features:</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
              <Text style={styles.featureText}>Profile sync enabled</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
              <Text style={styles.featureText}>Friend discovery</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
              <Text style={styles.featureText}>Family tree integration</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fcd3aa" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Social Connections</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Introduction */}
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>Connect Your Social Accounts</Text>
          <Text style={styles.introText}>
            Link your social media accounts to discover family members, sync profiles, 
            and enhance your genealogy research with social connections.
          </Text>
        </View>

        {/* Auto Sync Setting */}
        <View style={styles.settingSection}>
          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <Ionicons name="sync" size={24} color="#0091ad" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Auto Sync</Text>
                <Text style={styles.settingDescription}>
                  Automatically sync profile updates and connections
                </Text>
              </View>
              <Switch
                value={autoSync}
                onValueChange={setAutoSync}
                trackColor={{ false: '#374151', true: '#0091ad50' }}
                thumbColor={autoSync ? '#0091ad' : '#6b7280'}
                ios_backgroundColor="#374151"
              />
            </View>
          </View>
        </View>

        {/* Social Accounts */}
        <View style={styles.accountsSection}>
          <Text style={styles.sectionTitle}>Available Platforms</Text>
          {socialAccounts.map(renderSocialAccount)}
        </View>

        {/* Privacy Notice */}
        <View style={styles.privacySection}>
          <View style={styles.privacyCard}>
            <Ionicons name="shield-checkmark" size={24} color="#22c55e" />
            <Text style={styles.privacyTitle}>Your Privacy is Protected</Text>
            <Text style={styles.privacyText}>
              We only access publicly available information and data you explicitly 
              choose to share. Your social media passwords are never stored or accessed.
            </Text>
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
  settingSection: {
    marginBottom: 32,
  },
  settingCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginLeft: 12,
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
  accountsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: getSystemFont('bold'),
    color: '#fcd3aa',
    marginBottom: 16,
  },
  accountCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 18,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginBottom: 4,
  },
  accountDescription: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.6)',
  },
  accountUsername: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: '#0091ad',
    marginTop: 4,
  },
  connectButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  connectedButton: {
    opacity: 0.8,
  },
  connectButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  connectButtonText: {
    fontSize: 14,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
  },
  connectedFeatures: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  featuresTitle: {
    fontSize: 14,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginBottom: 8,
  },
  featuresList: {
    gap: 6,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.7)',
  },
  privacySection: {
    marginBottom: 32,
  },
  privacyCard: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.2)',
  },
  privacyTitle: {
    fontSize: 16,
    fontFamily: getSystemFont('bold'),
    color: '#22c55e',
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
  },
  privacyText: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ConnectSocialScreen;