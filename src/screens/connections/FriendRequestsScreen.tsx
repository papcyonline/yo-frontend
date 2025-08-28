// src/screens/connections/FriendRequestsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getSystemFont } from '../../config/constants';
import { ConnectionService, FriendRequest } from '../../services/connectionService';

interface FriendRequestsScreenProps {
  navigation: any;
}

const FriendRequestsScreen: React.FC<FriendRequestsScreenProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFriendRequests();
  }, []);

  const loadFriendRequests = async () => {
    try {
      setLoading(true);
      const [received, sent] = await Promise.all([
        ConnectionService.getReceivedFriendRequests(),
        ConnectionService.getSentFriendRequests()
      ]);

      setReceivedRequests(received.filter(req => req.status === 'pending'));
      setSentRequests(sent.filter(req => req.status === 'pending'));
    } catch (error) {
      console.error('Error loading friend requests:', error);
      Alert.alert('Error', 'Failed to load friend requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFriendRequests();
    setRefreshing(false);
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      setProcessingRequests(prev => new Set([...prev, requestId]));
      
      await ConnectionService.acceptFriendRequest(requestId);
      
      // Remove from received requests
      setReceivedRequests(prev => prev.filter(req => req.id !== requestId));
      
      Alert.alert('Success', 'Friend request accepted!');
    } catch (error) {
      console.error('Error accepting friend request:', error);
      Alert.alert('Error', 'Failed to accept friend request');
    } finally {
      setProcessingRequests(prev => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      setProcessingRequests(prev => new Set([...prev, requestId]));
      
      await ConnectionService.declineFriendRequest(requestId);
      
      // Remove from received requests
      setReceivedRequests(prev => prev.filter(req => req.id !== requestId));
      
      Alert.alert('Success', 'Friend request declined');
    } catch (error) {
      console.error('Error declining friend request:', error);
      Alert.alert('Error', 'Failed to decline friend request');
    } finally {
      setProcessingRequests(prev => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this friend request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              setProcessingRequests(prev => new Set([...prev, requestId]));
              
              await ConnectionService.cancelFriendRequest(requestId);
              
              // Remove from sent requests
              setSentRequests(prev => prev.filter(req => req.id !== requestId));
              
              Alert.alert('Success', 'Friend request cancelled');
            } catch (error) {
              console.error('Error cancelling friend request:', error);
              Alert.alert('Error', 'Failed to cancel friend request');
            } finally {
              setProcessingRequests(prev => {
                const next = new Set(prev);
                next.delete(requestId);
                return next;
              });
            }
          }
        }
      ]
    );
  };

  const getDisplayName = (user: any) => {
    if (user.fullName) return user.fullName;
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
    if (user.first_name) return user.first_name;
    if (user.name) return user.name;
    return 'Unknown User';
  };

  const formatTimeAgo = (date: Date) => {
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

  const renderReceivedRequest = (request: FriendRequest) => (
    <View key={request.id} style={styles.requestCard}>
      <LinearGradient
        colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
        style={styles.requestGradient}
      >
        <View style={styles.requestContent}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {request.sender?.profile_photo_url ? (
              <Image 
                source={{ uri: request.sender.profile_photo_url }} 
                style={styles.avatar}
              />
            ) : (
              <LinearGradient
                colors={['#0091ad', '#04a7c7', '#fcd3aa']}
                style={styles.avatar}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.avatarText}>
                  {getDisplayName(request.sender)[0]?.toUpperCase()}
                </Text>
              </LinearGradient>
            )}
          </View>

          {/* Info */}
          <View style={styles.requestInfo}>
            <Text style={styles.requestName} numberOfLines={1}>
              {getDisplayName(request.sender)}
            </Text>
            <Text style={styles.requestTime}>
              {formatTimeAgo(request.createdAt)}
            </Text>
            {request.message && (
              <Text style={styles.requestMessage} numberOfLines={2}>
                "{request.message}"
              </Text>
            )}
          </View>

          {/* Actions */}
          <View style={styles.requestActions}>
            {processingRequests.has(request.id) ? (
              <ActivityIndicator size="small" color="#0091ad" />
            ) : (
              <>
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => handleAcceptRequest(request.id)}
                >
                  <LinearGradient
                    colors={['#22c55e', '#16a34a']}
                    style={styles.actionButtonGradient}
                  >
                    <Ionicons name="checkmark" size={16} color="#ffffff" />
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.declineButton}
                  onPress={() => handleDeclineRequest(request.id)}
                >
                  <View style={styles.declineButtonContent}>
                    <Ionicons name="close" size={16} color="#ef4444" />
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderSentRequest = (request: FriendRequest) => (
    <View key={request.id} style={styles.requestCard}>
      <LinearGradient
        colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
        style={styles.requestGradient}
      >
        <View style={styles.requestContent}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {request.receiver?.profile_photo_url ? (
              <Image 
                source={{ uri: request.receiver.profile_photo_url }} 
                style={styles.avatar}
              />
            ) : (
              <LinearGradient
                colors={['#0091ad', '#04a7c7', '#fcd3aa']}
                style={styles.avatar}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.avatarText}>
                  {getDisplayName(request.receiver)[0]?.toUpperCase()}
                </Text>
              </LinearGradient>
            )}
          </View>

          {/* Info */}
          <View style={styles.requestInfo}>
            <Text style={styles.requestName} numberOfLines={1}>
              {getDisplayName(request.receiver)}
            </Text>
            <Text style={styles.requestTime}>
              Sent {formatTimeAgo(request.createdAt)}
            </Text>
            <View style={styles.statusContainer}>
              <Ionicons name="time" size={12} color="#fcd3aa" />
              <Text style={styles.statusText}>Pending</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.requestActions}>
            {processingRequests.has(request.id) ? (
              <ActivityIndicator size="small" color="#0091ad" />
            ) : (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => handleCancelRequest(request.id)}
              >
                <View style={styles.cancelButtonContent}>
                  <Ionicons name="close" size={16} color="#9ca3af" />
                  <Text style={styles.cancelText}>Cancel</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderEmptyState = (type: 'received' | 'sent') => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons 
          name={type === 'received' ? 'person-add' : 'person-outline'} 
          size={48} 
          color="rgba(252,211,170,0.3)" 
        />
      </View>
      <Text style={styles.emptyTitle}>
        No {type === 'received' ? 'Received' : 'Sent'} Requests
      </Text>
      <Text style={styles.emptyText}>
        {type === 'received' 
          ? 'When someone sends you a friend request, it will appear here'
          : 'Friend requests you send will appear here while pending'
        }
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
          <Text style={styles.headerTitle}>Friend Requests</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0091ad" />
          <Text style={styles.loadingText}>Loading friend requests...</Text>
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
        <Text style={styles.headerTitle}>Friend Requests</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tab Navigator */}
      <View style={styles.tabContainer}>
        {[
          { key: 'received', label: 'Received', count: receivedRequests.length },
          { key: 'sent', label: 'Sent', count: sentRequests.length }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
              {tab.count > 0 && (
                <Text style={styles.tabCount}> ({tab.count})</Text>
              )}
            </Text>
            {activeTab === tab.key && (
              <LinearGradient
                colors={['transparent', '#0091ad', 'transparent']}
                style={styles.tabIndicator}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>

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
        <View style={styles.requestsList}>
          {activeTab === 'received' ? (
            receivedRequests.length > 0 ? (
              receivedRequests.map(renderReceivedRequest)
            ) : (
              renderEmptyState('received')
            )
          ) : (
            sentRequests.length > 0 ? (
              sentRequests.map(renderSentRequest)
            ) : (
              renderEmptyState('sent')
            )
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
  
  headerSpacer: {
    width: 48,
  },
  
  // Tab Container
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 4,
  },
  
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    position: 'relative',
  },
  
  activeTab: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  
  tabText: {
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  
  activeTabText: {
    color: '#0091ad',
    fontFamily: getSystemFont('bold'),
  },
  
  tabCount: {
    color: '#fcd3aa',
    fontSize: 12,
  },
  
  tabIndicator: {
    position: 'absolute',
    bottom: 2,
    left: '25%',
    right: '25%',
    height: 2,
    borderRadius: 1,
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
  
  requestsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  
  // Request Card
  requestCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  
  requestGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  
  requestContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // Avatar
  avatarContainer: {
    marginRight: 12,
  },
  
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  avatarText: {
    fontSize: 18,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
  },
  
  // Request Info
  requestInfo: {
    flex: 1,
    paddingRight: 12,
  },
  
  requestName: {
    fontSize: 16,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginBottom: 4,
  },
  
  requestTime: {
    fontSize: 12,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  
  requestMessage: {
    fontSize: 13,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(252,211,170,0.8)',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  
  statusText: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: '#fcd3aa',
  },
  
  // Request Actions
  requestActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  
  acceptButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  
  actionButtonGradient: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  declineButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  
  declineButtonContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  
  cancelButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  
  cancelText: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: '#9ca3af',
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

export default FriendRequestsScreen;