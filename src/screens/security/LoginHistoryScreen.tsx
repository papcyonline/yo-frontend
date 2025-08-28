// Login History Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getSystemFont } from '../../config/constants';
import { API_CONFIG } from '../../constants/api';
import { useAuthStore } from '../../store/authStore';
import logger from '../../services/LoggingService';

interface LoginRecord {
  id: string;
  timestamp: string;
  deviceName: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  location: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  method: 'password' | 'social' | '2fa';
}

interface LoginHistoryScreenProps {
  navigation: any;
}

const LoginHistoryScreen: React.FC<LoginHistoryScreenProps> = ({ navigation }) => {
  const { token } = useAuthStore();
  const [loginHistory, setLoginHistory] = useState<LoginRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLoginHistory();
  }, []);

  const loadLoginHistory = async () => {
    try {
      setLoading(true);
      logger.debug('Loading login history');

      if (!token) {
        logger.warn('No auth token available');
        return;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/login-history`, {
        method: 'GET',
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
        setLoginHistory(result.data.history || []);
        logger.info(`Loaded ${result.data.history?.length || 0} login records`);
      } else {
        throw new Error(result.message || 'Failed to load login history');
      }
    } catch (error) {
      logger.error('Error loading login history', error);
      // Mock data for demonstration
      setLoginHistory([
        {
          id: '1',
          timestamp: new Date().toISOString(),
          deviceName: 'iPhone 15 Pro',
          deviceType: 'mobile',
          location: 'New York, NY',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
          success: true,
          method: 'password'
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          deviceName: 'Chrome Browser',
          deviceType: 'desktop',
          location: 'San Francisco, CA',
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          success: true,
          method: '2fa'
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          deviceName: 'Unknown Device',
          deviceType: 'mobile',
          location: 'Los Angeles, CA',
          ipAddress: '10.0.0.1',
          userAgent: 'Unknown',
          success: false,
          method: 'password'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLoginHistory();
    setRefreshing(false);
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return 'phone-portrait';
      case 'tablet':
        return 'tablet-portrait';
      case 'desktop':
      default:
        return 'desktop';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case '2fa':
        return 'shield-checkmark';
      case 'social':
        return 'logo-google';
      case 'password':
      default:
        return 'key';
    }
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  const renderLoginRecord = ({ item }: { item: LoginRecord }) => (
    <View style={[styles.recordCard, !item.success && styles.failedRecord]}>
      <LinearGradient
        colors={item.success 
          ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']
          : ['rgba(239,68,68,0.1)', 'rgba(239,68,68,0.05)']
        }
        style={styles.recordGradient}
      >
        <View style={styles.recordContent}>
          <View style={styles.recordHeader}>
            <View style={styles.deviceInfo}>
              <View style={[styles.deviceIcon, !item.success && styles.failedDeviceIcon]}>
                <Ionicons 
                  name={getDeviceIcon(item.deviceType) as any} 
                  size={20} 
                  color={item.success ? '#ffffff' : '#ef4444'} 
                />
              </View>
              <View style={styles.deviceDetails}>
                <Text style={[styles.deviceName, !item.success && styles.failedText]}>
                  {item.deviceName}
                </Text>
                <Text style={styles.timestamp}>
                  {formatTimestamp(item.timestamp)}
                </Text>
                <Text style={styles.location}>{item.location}</Text>
              </View>
            </View>
            
            <View style={styles.statusContainer}>
              <View style={styles.methodInfo}>
                <Ionicons 
                  name={getMethodIcon(item.method) as any} 
                  size={16} 
                  color={item.success ? '#0091ad' : '#ef4444'} 
                />
                <Text style={[styles.methodText, !item.success && styles.failedText]}>
                  {item.method.toUpperCase()}
                </Text>
              </View>
              
              <View style={[styles.statusBadge, item.success ? styles.successBadge : styles.failedBadge]}>
                <Ionicons 
                  name={item.success ? 'checkmark-circle' : 'close-circle'} 
                  size={16} 
                  color={item.success ? '#22c55e' : '#ef4444'} 
                />
                <Text style={[styles.statusText, item.success ? styles.successText : styles.failedStatusText]}>
                  {item.success ? 'Success' : 'Failed'}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.recordMeta}>
            <Text style={styles.ipAddress}>IP: {item.ipAddress}</Text>
            <View style={styles.statusDot} />
            <Text style={styles.userAgent} numberOfLines={1}>
              {item.userAgent.substring(0, 40)}...
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fcd3aa" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Login History</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.infoContainer}>
        <LinearGradient
          colors={['rgba(0,145,173,0.1)', 'rgba(4,167,199,0.05)']}
          style={styles.infoGradient}
        >
          <Ionicons name="information-circle" size={24} color="#0091ad" />
          <Text style={styles.infoText}>
            Review your account's login activity. Look for any suspicious activity or unauthorized access attempts.
          </Text>
        </LinearGradient>
      </View>

      {loading && loginHistory.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0091ad" />
          <Text style={styles.loadingText}>Loading login history...</Text>
        </View>
      ) : (
        <FlatList
          data={loginHistory}
          renderItem={renderLoginRecord}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.recordsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#0091ad"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="time-outline" size={64} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyTitle}>No Login History</Text>
              <Text style={styles.emptyText}>
                No login history found. This could mean you're a new user or history data is not available.
              </Text>
            </View>
          }
        />
      )}
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
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 48,
  },
  infoContainer: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  infoGradient: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: '#0091ad',
    lineHeight: 20,
  },
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
  recordsList: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  recordCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  failedRecord: {
    borderColor: 'rgba(239,68,68,0.3)',
  },
  recordGradient: {
    padding: 16,
  },
  recordContent: {
    flex: 1,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  deviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  failedDeviceIcon: {
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  deviceDetails: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginBottom: 2,
  },
  failedText: {
    color: '#ef4444',
  },
  timestamp: {
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 2,
  },
  location: {
    fontSize: 12,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.6)',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  methodText: {
    fontSize: 12,
    fontFamily: getSystemFont('bold'),
    color: '#0091ad',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  successBadge: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.3)',
  },
  failedBadge: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  statusText: {
    fontSize: 12,
    fontFamily: getSystemFont('bold'),
  },
  successText: {
    color: '#22c55e',
  },
  failedStatusText: {
    color: '#ef4444',
  },
  recordMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  ipAddress: {
    fontSize: 12,
    fontFamily: getSystemFont('mono'),
    color: 'rgba(255,255,255,0.5)',
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 8,
  },
  userAgent: {
    flex: 1,
    fontSize: 12,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.4)',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 40,
  },
});

export default LoginHistoryScreen;