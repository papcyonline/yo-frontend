// Active Sessions Management Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getSystemFont } from '../../config/constants';
import { API_CONFIG } from '../../constants/api';
import { useAuthStore } from '../../store/authStore';
import logger from '../../services/LoggingService';
import { securityService, ActiveSession } from '../../services/securityService';

// Using ActiveSession from securityService instead

interface ActiveSessionsScreenProps {
  navigation: any;
}

const ActiveSessionsScreen: React.FC<ActiveSessionsScreenProps> = ({ navigation }) => {
  const { token } = useAuthStore();
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [terminatingSession, setTerminatingSession] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      logger.debug('Loading active sessions');

      if (!token) {
        logger.warn('No auth token available');
        return;
      }

      const activeSessions = await securityService.getActiveSessions(token);
      setSessions(activeSessions);
      logger.info(`Loaded ${activeSessions.length} active sessions`);
    } catch (error) {
      logger.error('Error loading sessions', error);
      // For demo purposes, show mock data if API fails
      setSessions([
        {
          id: '1',
          device_name: 'iPhone 15 Pro',
          device_type: 'mobile',
          location: 'New York, NY',
          ip_address: '192.168.1.100',
          login_at: new Date().toISOString(),
          last_activity: new Date().toISOString(),
          last_activity_ago: 'Just now',
          is_current: true,
          is_suspicious: false
        },
        {
          id: '2',
          device_name: 'MacBook Pro',
          device_type: 'desktop',
          location: 'San Francisco, CA',
          ip_address: '192.168.1.101',
          login_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          last_activity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          last_activity_ago: '2 hours ago',
          is_current: false,
          is_suspicious: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  };

  const terminateSession = async (sessionId: string) => {
    Alert.alert(
      'Terminate Session',
      'Are you sure you want to terminate this session? This will log out the device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Terminate',
          style: 'destructive',
          onPress: async () => {
            try {
              setTerminatingSession(sessionId);
              logger.debug(`Terminating session: ${sessionId}`);

              await securityService.terminateSession(token, sessionId);
              setSessions(prev => prev.filter(session => session.id !== sessionId));
              logger.info(`Session ${sessionId} terminated successfully`);
              Alert.alert('Success', 'Session terminated successfully.');
            } catch (error) {
              logger.error('Error terminating session', error);
              Alert.alert('Error', 'Failed to terminate session. Please try again.');
            } finally {
              setTerminatingSession(null);
            }
          }
        }
      ]
    );
  };

  const terminateAllOtherSessions = async () => {
    const otherSessions = sessions.filter(session => !session.is_current);
    if (otherSessions.length === 0) {
      Alert.alert('No Other Sessions', 'There are no other sessions to terminate.');
      return;
    }

    Alert.alert(
      'Terminate All Other Sessions',
      `This will log out ${otherSessions.length} other device${otherSessions.length > 1 ? 's' : ''}. Are you sure?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Terminate All',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              logger.debug('Terminating all other sessions');

              const terminatedCount = await securityService.terminateOtherSessions(token);
              if (terminatedCount > 0) {
                setSessions(prev => prev.filter(session => session.is_current));
                logger.info('All other sessions terminated successfully');
                Alert.alert('Success', 'All other sessions have been terminated.');
              } else {
                throw new Error('Failed to terminate other sessions');
              }
            } catch (error) {
              logger.error('Error terminating other sessions', error);
              Alert.alert('Error', 'Failed to terminate other sessions. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
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

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Active now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderSession = ({ item }: { item: ActiveSession }) => (
    <View style={styles.sessionCard}>
      <LinearGradient
        colors={item.is_current 
          ? ['rgba(0,145,173,0.1)', 'rgba(4,167,199,0.05)']
          : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']
        }
        style={styles.sessionGradient}
      >
        <View style={styles.sessionContent}>
          <View style={styles.sessionHeader}>
            <View style={styles.deviceInfo}>
              <View style={[styles.deviceIcon, item.is_current && styles.currentDeviceIcon]}>
                <Ionicons
                  name={getDeviceIcon(item.device_type) as any}
                  size={24}
                  color={item.is_current ? '#0091ad' : '#ffffff'} 
                />
              </View>
              <View style={styles.deviceDetails}>
                <View style={styles.deviceNameContainer}>
                  <Text style={styles.deviceName}>{item.device_name}</Text>
                  {item.is_current && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>Current</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.deviceLocation}>{item.location}</Text>
                <Text style={styles.lastActive}>{item.last_activity_ago || formatLastActive(item.last_activity)}</Text>
              </View>
            </View>
            
            {!item.is_current && (
              <TouchableOpacity
                style={styles.terminateButton}
                onPress={() => terminateSession(item.id)}
                disabled={terminatingSession === item.id}
              >
                {terminatingSession === item.id ? (
                  <ActivityIndicator size="small" color="#ef4444" />
                ) : (
                  <Ionicons name="close-circle" size={24} color="#ef4444" />
                )}
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.sessionMeta}>
            <Text style={styles.ipAddress}>IP: {item.ip_address}</Text>
            <View style={styles.statusDot} />
            <Text style={styles.sessionStatus} numberOfLines={1}>
              {(item.device_name + ' ' + item.device_type).substring(0, 50)}...
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
        <Text style={styles.headerTitle}>Active Sessions</Text>
        <TouchableOpacity 
          style={styles.terminateAllButton}
          onPress={terminateAllOtherSessions}
          disabled={loading || sessions.filter(s => !s.isCurrent).length === 0}
        >
          <Ionicons name="log-out" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <LinearGradient
          colors={['rgba(0,145,173,0.1)', 'rgba(4,167,199,0.05)']}
          style={styles.infoGradient}
        >
          <Ionicons name="information-circle" size={24} color="#0091ad" />
          <Text style={styles.infoText}>
            Manage devices that are currently signed in to your account. Terminate sessions for security.
          </Text>
        </LinearGradient>
      </View>

      {loading && sessions.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0091ad" />
          <Text style={styles.loadingText}>Loading sessions...</Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderSession}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.sessionsList}
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
              <Ionicons name="phone-portrait-outline" size={64} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyTitle}>No Active Sessions</Text>
              <Text style={styles.emptyText}>
                No active sessions found. Try refreshing or check your connection.
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
  terminateAllButton: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
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
  sessionsList: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  sessionCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sessionGradient: {
    padding: 16,
  },
  sessionContent: {
    flex: 1,
  },
  sessionHeader: {
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  currentDeviceIcon: {
    backgroundColor: 'rgba(0,145,173,0.2)',
    borderWidth: 2,
    borderColor: '#0091ad',
  },
  deviceDetails: {
    flex: 1,
  },
  deviceNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  deviceName: {
    fontSize: 16,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginRight: 8,
  },
  currentBadge: {
    backgroundColor: '#0091ad',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  currentBadgeText: {
    fontSize: 12,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
  },
  deviceLocation: {
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 2,
  },
  lastActive: {
    fontSize: 12,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.6)',
  },
  terminateButton: {
    padding: 8,
    borderRadius: 8,
  },
  sessionMeta: {
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
  sessionStatus: {
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

export default ActiveSessionsScreen;