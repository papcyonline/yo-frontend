import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';
import { getSystemFont, API_BASE_URL } from '../../config/constants';

interface FriendRequestsScreenProps {
  navigation: any;
}

interface FriendRequest {
  id: string;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    profilePhotoUrl?: string;
    location?: string;
    profession?: string;
    bio?: string;
  };
  recipient?: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    profilePhotoUrl?: string;
    location?: string;
    profession?: string;
    bio?: string;
  };
  message?: string;
  matchContext?: {
    match_type?: string;
    match_score?: number;
    predicted_relationship?: string;
    match_reason?: string;
  };
  sentAt: string;
  status: string;
}

const FriendRequestsScreen: React.FC<FriendRequestsScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const authStore = useAuthStore();
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const token = authStore.token;
      
      // Load both received and sent requests in parallel
      const [receivedRes, sentRes] = await Promise.all([
        fetch(`${API_BASE_URL}/friends/requests/received`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/friends/requests/sent`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const receivedData = await receivedRes.json();
      const sentData = await sentRes.json();

      if (receivedData.success) {
        setReceivedRequests(receivedData.data.requests);
      }

      if (sentData.success) {
        setSentRequests(sentData.data.requests);
      }
    } catch (error) {
      console.error('Error loading friend requests:', error);
      Alert.alert('Error', 'Failed to load friend requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const token = authStore.token;
      const response = await fetch(`${API_BASE_URL}/friends/request/${requestId}/accept`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert(
          'Friend Request Accepted!',
          result.message,
          [{ text: 'OK' }]
        );
        loadRequests(); // Refresh the list
      } else {
        Alert.alert('Error', result.message || 'Failed to accept friend request');
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert('Error', 'Failed to accept friend request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    Alert.alert(
      'Reject Friend Request',
      'Are you sure you want to reject this friend request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = authStore.token;
              const response = await fetch(`${API_BASE_URL}/friends/request/${requestId}/reject`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
              });

              const result = await response.json();

              if (result.success) {
                loadRequests(); // Refresh the list
              } else {
                Alert.alert('Error', result.message || 'Failed to reject friend request');
              }
            } catch (error) {
              console.error('Error rejecting request:', error);
              Alert.alert('Error', 'Failed to reject friend request');
            }
          }
        }
      ]
    );
  };

  const handleCancelRequest = async (requestId: string) => {
    Alert.alert(
      'Cancel Friend Request',
      'Are you sure you want to cancel this friend request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Cancel Request',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = authStore.token;
              const response = await fetch(`${API_BASE_URL}/friends/request/${requestId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });

              const result = await response.json();

              if (result.success) {
                loadRequests(); // Refresh the list
              } else {
                Alert.alert('Error', result.message || 'Failed to cancel friend request');
              }
            } catch (error) {
              console.error('Error cancelling request:', error);
              Alert.alert('Error', 'Failed to cancel friend request');
            }
          }
        }
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const renderRequestCard = (request: FriendRequest, type: 'received' | 'sent') => {
    const user = type === 'received' ? request.sender : request.recipient;
    if (!user) return null;

    return (
      <View key={request.id} style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              {user.profilePhotoUrl ? (
                <Image source={{ uri: user.profilePhotoUrl }} style={styles.profileImage} />
              ) : (
                <LinearGradient
                  colors={['#0091ad', '#04a7c7']}
                  style={styles.avatarGradient}
                >
                  <Text style={styles.avatarText}>
                    {user.firstName[0]}{user.lastName[0]}
                  </Text>
                </LinearGradient>
              )}
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user.fullName}</Text>
              {user.profession && (
                <Text style={styles.userProfession}>{user.profession}</Text>
              )}
              {user.location && (
                <View style={styles.locationContainer}>
                  <Ionicons name="location-outline" size={12} color={theme.textSecondary} />
                  <Text style={styles.userLocation}>{user.location}</Text>
                </View>
              )}
            </View>
          </View>
          <Text style={styles.dateText}>{formatDate(request.sentAt)}</Text>
        </View>

        {request.matchContext && (
          <View style={styles.matchContext}>
            <View style={styles.matchInfo}>
              <Ionicons name="sparkles" size={14} color="#0091ad" />
              <Text style={styles.matchText}>
                {request.matchContext.match_score}% match • {request.matchContext.predicted_relationship}
              </Text>
            </View>
          </View>
        )}

        {request.message && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>"{request.message}"</Text>
          </View>
        )}

        <View style={styles.actionButtons}>
          {type === 'received' ? (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => handleAcceptRequest(request.id)}
              >
                <Ionicons name="checkmark" size={16} color="#ffffff" />
                <Text style={styles.acceptButtonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleRejectRequest(request.id)}
              >
                <Ionicons name="close" size={16} color="#ff6b6b" />
                <Text style={styles.rejectButtonText}>Decline</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleCancelRequest(request.id)}
            >
              <Ionicons name="close" size={16} color="#ff6b6b" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      flex: 1,
      backgroundColor: theme.background,
    }
  });

  if (loading) {
    return (
      <SafeAreaView style={dynamicStyles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Friend Requests</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0091ad" />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading requests...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentRequests = activeTab === 'received' ? receivedRequests : sentRequests;

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Friend Requests</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'received' && styles.activeTab
          ]}
          onPress={() => setActiveTab('received')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'received' ? '#ffffff' : theme.textSecondary }
          ]}>
            Received ({receivedRequests.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'sent' && styles.activeTab
          ]}
          onPress={() => setActiveTab('sent')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'sent' ? '#ffffff' : theme.textSecondary }
          ]}>
            Sent ({sentRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={dynamicStyles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {currentRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name={activeTab === 'received' ? 'people-outline' : 'paper-plane-outline'}
              size={64}
              color={theme.textSecondary}
            />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No {activeTab} requests
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              {activeTab === 'received'
                ? 'When someone sends you a friend request, it will appear here'
                : 'Friend requests you send will appear here'}
            </Text>
          </View>
        ) : (
          currentRequests.map((request) => renderRequestCard(request, activeTab))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: getSystemFont('bold'),
  },
  
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#0091ad',
  },
  tabText: {
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
  },
  
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  
  requestCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: getSystemFont('bold'),
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginBottom: 2,
  },
  userProfession: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 2,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userLocation: {
    fontSize: 12,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255, 255, 255, 0.6)',
  },
  dateText: {
    fontSize: 12,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255, 255, 255, 0.5)',
  },
  
  matchContext: {
    backgroundColor: 'rgba(0, 145, 173, 0.2)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  matchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matchText: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: '#0091ad',
  },
  
  messageContainer: {
    backgroundColor: 'rgba(252, 211, 170, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#fcd3aa',
  },
  messageText: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: '#ffffff',
    fontStyle: 'italic',
  },
  
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
    flex: 1,
  },
  acceptButton: {
    backgroundColor: '#0091ad',
  },
  acceptButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
  },
  rejectButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  rejectButtonText: {
    color: '#ff6b6b',
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  cancelButtonText: {
    color: '#ff6b6b',
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
  },
  
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: getSystemFont('bold'),
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});

export default FriendRequestsScreen;