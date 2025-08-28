import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { apiService } from '../../services/api';
import logger from '../../services/LoggingService';

interface ContentFiltersScreenProps {
  navigation: any;
  route: {
    params: {
      user: any;
    };
  };
}

interface ContentFilterSettings {
  profanityFilterEnabled: boolean;
  spamFilterEnabled: boolean;
  harassmentFilterEnabled: boolean;
  hateSpeechFilterEnabled: boolean;
  strictMode: boolean;
  autoReport: boolean;
}

interface ModerationStats {
  enabled: boolean;
  profanityWordsCount: number;
  spamIndicatorsCount: number;
  harassmentPatternsCount: number;
  personalInfoPatternsCount: number;
}

interface UserModerationStats {
  userId: string;
  flaggedForReview: boolean;
  flaggedAt?: string;
  flagReason?: string;
  totalReports: number;
  automaticReports: number;
  manualReports: number;
  contentViolations: any[];
  suspended: boolean;
  suspendReason?: string;
}

const ContentFiltersScreen: React.FC<ContentFiltersScreenProps> = ({ navigation, route }) => {
  const { theme, isDark } = useTheme();
  const { user } = route.params;
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [settings, setSettings] = useState<ContentFilterSettings>({
    profanityFilterEnabled: true,
    spamFilterEnabled: true,
    harassmentFilterEnabled: true,
    hateSpeechFilterEnabled: true,
    strictMode: false,
    autoReport: true,
  });
  const [systemStats, setSystemStats] = useState<ModerationStats | null>(null);
  const [userStats, setUserStats] = useState<UserModerationStats | null>(null);

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text,
      marginLeft: 16,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    section: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      marginBottom: 16,
      overflow: 'hidden',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    filterItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    filterInfo: {
      flex: 1,
      marginRight: 16,
    },
    filterTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.text,
      marginBottom: 4,
    },
    filterSubtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      lineHeight: 20,
    },
    statsContainer: {
      padding: 16,
    },
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    statLabel: {
      fontSize: 14,
      color: theme.textSecondary,
      flex: 1,
    },
    statValue: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
    },
    warningContainer: {
      backgroundColor: theme.error + '20',
      borderRadius: 8,
      padding: 12,
      marginTop: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    warningText: {
      fontSize: 14,
      color: theme.error,
      marginLeft: 8,
      flex: 1,
    },
    testButton: {
      backgroundColor: theme.primary,
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
      marginTop: 16,
    },
    testButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      color: theme.textSecondary,
      marginTop: 16,
      fontSize: 16,
    },
  });

  useEffect(() => {
    loadModerationStats();
  }, []);

  const loadModerationStats = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/safety/moderation/stats');
      
      if (response.success) {
        setSystemStats(response.data.systemStats);
        setUserStats(response.data.userStats);
        logger.info('Content moderation stats loaded');
      }
    } catch (error) {
      logger.error('Failed to load moderation stats:', error);
      Alert.alert('Error', 'Failed to load content filter settings');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadModerationStats();
    setRefreshing(false);
  };

  const toggleFilter = async (filterKey: keyof ContentFilterSettings) => {
    try {
      setUpdating(true);
      const newValue = !settings[filterKey];
      
      // Update local state immediately for better UX
      setSettings(prev => ({ ...prev, [filterKey]: newValue }));
      
      // TODO: Implement API call to save filter preferences
      logger.info(`Filter ${filterKey} toggled to:`, newValue);
      
    } catch (error) {
      logger.error('Failed to update filter setting:', error);
      // Revert local state on error
      setSettings(prev => ({ ...prev, [filterKey]: !settings[filterKey] }));
      Alert.alert('Error', 'Failed to update filter setting');
    } finally {
      setUpdating(false);
    }
  };

  const testContentModeration = () => {
    // Note: React Native doesn't have Alert.prompt, would need a custom modal
    // For now, just show an alert that this feature needs a text input modal
    Alert.alert(
      'Test Content Filter',
      'This feature requires a text input modal. Coming soon!',
      [
        { text: 'OK' }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={dynamicStyles.container}>
        <View style={dynamicStyles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={dynamicStyles.headerTitle}>Content Filters</Text>
        </View>
        
        <View style={dynamicStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={dynamicStyles.loadingText}>Loading filter settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={dynamicStyles.headerTitle}>Content Filters</Text>
      </View>

      <ScrollView 
        style={dynamicStyles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Filter Settings Section */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Filter Settings</Text>
          
          <View style={dynamicStyles.filterItem}>
            <View style={dynamicStyles.filterInfo}>
              <Text style={dynamicStyles.filterTitle}>Profanity Filter</Text>
              <Text style={dynamicStyles.filterSubtitle}>
                Automatically filter inappropriate language in messages and posts
              </Text>
            </View>
            <Switch
              value={settings.profanityFilterEnabled}
              onValueChange={() => toggleFilter('profanityFilterEnabled')}
              trackColor={{ false: theme.border, true: theme.primary + '40' }}
              thumbColor={settings.profanityFilterEnabled ? theme.primary : theme.textSecondary}
              disabled={updating}
            />
          </View>

          <View style={dynamicStyles.filterItem}>
            <View style={dynamicStyles.filterInfo}>
              <Text style={dynamicStyles.filterTitle}>Spam Filter</Text>
              <Text style={dynamicStyles.filterSubtitle}>
                Block repetitive content, excessive links, and promotional spam
              </Text>
            </View>
            <Switch
              value={settings.spamFilterEnabled}
              onValueChange={() => toggleFilter('spamFilterEnabled')}
              trackColor={{ false: theme.border, true: theme.primary + '40' }}
              thumbColor={settings.spamFilterEnabled ? theme.primary : theme.textSecondary}
              disabled={updating}
            />
          </View>

          <View style={dynamicStyles.filterItem}>
            <View style={dynamicStyles.filterInfo}>
              <Text style={dynamicStyles.filterTitle}>Harassment Filter</Text>
              <Text style={dynamicStyles.filterSubtitle}>
                Detect and block bullying, threats, and personal attacks
              </Text>
            </View>
            <Switch
              value={settings.harassmentFilterEnabled}
              onValueChange={() => toggleFilter('harassmentFilterEnabled')}
              trackColor={{ false: theme.border, true: theme.primary + '40' }}
              thumbColor={settings.harassmentFilterEnabled ? theme.primary : theme.textSecondary}
              disabled={updating}
            />
          </View>

          <View style={dynamicStyles.filterItem}>
            <View style={dynamicStyles.filterInfo}>
              <Text style={dynamicStyles.filterTitle}>Hate Speech Filter</Text>
              <Text style={dynamicStyles.filterSubtitle}>
                Block content containing hate speech and discriminatory language
              </Text>
            </View>
            <Switch
              value={settings.hateSpeechFilterEnabled}
              onValueChange={() => toggleFilter('hateSpeechFilterEnabled')}
              trackColor={{ false: theme.border, true: theme.primary + '40' }}
              thumbColor={settings.hateSpeechFilterEnabled ? theme.primary : theme.textSecondary}
              disabled={updating}
            />
          </View>

          <View style={[dynamicStyles.filterItem, { borderBottomWidth: 0 }]}>
            <View style={dynamicStyles.filterInfo}>
              <Text style={dynamicStyles.filterTitle}>Strict Mode</Text>
              <Text style={dynamicStyles.filterSubtitle}>
                Enable enhanced filtering with lower tolerance for questionable content
              </Text>
            </View>
            <Switch
              value={settings.strictMode}
              onValueChange={() => toggleFilter('strictMode')}
              trackColor={{ false: theme.border, true: theme.primary + '40' }}
              thumbColor={settings.strictMode ? theme.primary : theme.textSecondary}
              disabled={updating}
            />
          </View>
        </View>

        {/* System Statistics Section */}
        {systemStats && (
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>System Statistics</Text>
            <View style={dynamicStyles.statsContainer}>
              <View style={dynamicStyles.statRow}>
                <Text style={dynamicStyles.statLabel}>Content Moderation</Text>
                <Text style={dynamicStyles.statValue}>
                  {systemStats.enabled ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
              <View style={dynamicStyles.statRow}>
                <Text style={dynamicStyles.statLabel}>Profanity Words</Text>
                <Text style={dynamicStyles.statValue}>{systemStats.profanityWordsCount}</Text>
              </View>
              <View style={dynamicStyles.statRow}>
                <Text style={dynamicStyles.statLabel}>Spam Indicators</Text>
                <Text style={dynamicStyles.statValue}>{systemStats.spamIndicatorsCount}</Text>
              </View>
              <View style={dynamicStyles.statRow}>
                <Text style={dynamicStyles.statLabel}>Harassment Patterns</Text>
                <Text style={dynamicStyles.statValue}>{systemStats.harassmentPatternsCount}</Text>
              </View>
              <View style={dynamicStyles.statRow}>
                <Text style={dynamicStyles.statLabel}>Privacy Patterns</Text>
                <Text style={dynamicStyles.statValue}>{systemStats.personalInfoPatternsCount}</Text>
              </View>
            </View>
          </View>
        )}

        {/* User Statistics Section */}
        {userStats && (
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>Your Safety Status</Text>
            <View style={dynamicStyles.statsContainer}>
              <View style={dynamicStyles.statRow}>
                <Text style={dynamicStyles.statLabel}>Account Status</Text>
                <Text style={[
                  dynamicStyles.statValue,
                  { color: userStats.suspended ? theme.error : theme.success || '#10b981' }
                ]}>
                  {userStats.suspended ? 'Suspended' : 'Good Standing'}
                </Text>
              </View>
              <View style={dynamicStyles.statRow}>
                <Text style={dynamicStyles.statLabel}>Total Reports</Text>
                <Text style={dynamicStyles.statValue}>{userStats.totalReports}</Text>
              </View>
              <View style={dynamicStyles.statRow}>
                <Text style={dynamicStyles.statLabel}>Automatic Reports</Text>
                <Text style={dynamicStyles.statValue}>{userStats.automaticReports}</Text>
              </View>
              <View style={dynamicStyles.statRow}>
                <Text style={dynamicStyles.statLabel}>Manual Reports</Text>
                <Text style={dynamicStyles.statValue}>{userStats.manualReports}</Text>
              </View>
              <View style={dynamicStyles.statRow}>
                <Text style={dynamicStyles.statLabel}>Content Violations</Text>
                <Text style={dynamicStyles.statValue}>{userStats.contentViolations.length}</Text>
              </View>
              
              {userStats.flaggedForReview && (
                <View style={dynamicStyles.warningContainer}>
                  <Ionicons name="warning" size={20} color={theme.error} />
                  <Text style={dynamicStyles.warningText}>
                    Your account has been flagged for review. {userStats.flagReason}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Test Content Moderation */}
        <TouchableOpacity 
          style={dynamicStyles.testButton} 
          onPress={testContentModeration}
          disabled={updating}
        >
          <Text style={dynamicStyles.testButtonText}>
            {updating ? 'Testing...' : 'Test Content Filter'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ContentFiltersScreen;