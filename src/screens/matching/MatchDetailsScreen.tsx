// MatchDetailsScreen.tsx - Detailed view of a match with family/friend information
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getSystemFont } from '../../config/constants';
import { API_CONFIG } from '../../constants/api';
import { useAuthStore } from '../../store/authStore';
import { getBestAvatarUrl } from '../../utils/imageHelpers';
import logger from '../../services/LoggingService';

const { width } = Dimensions.get('window');

interface Match {
  id: string;
  name: string;
  initials?: string;
  relation?: string;
  bio?: string;
  location?: string;
  percentage?: number;
  type?: 'family' | 'friend';
  profileImage?: string;
  age?: number;
  interests?: string[];
  commonConnections?: number;
  distance?: string;
  lastActive?: string;
  verified?: boolean;
  mutualFriends?: string[];
  photos?: string[];
}

interface MatchDetailsScreenProps {
  navigation: any;
  route: {
    params: {
      match?: Match;
      matchId?: string;
      user?: any;
    };
  };
}

const MatchDetailsScreen: React.FC<MatchDetailsScreenProps> = ({ navigation, route }) => {
  const { match: initialMatch, matchId, user } = route.params || {};
  const { token } = useAuthStore();
  const [match, setMatch] = useState<Match | null>(initialMatch || null);
  const [loading, setLoading] = useState(!initialMatch && !!matchId);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (matchId && !initialMatch) {
      loadMatchDetails(matchId);
    }
  }, [matchId]);

  const loadMatchDetails = async (id: string) => {
    try {
      setLoading(true);
      logger.debug(`Loading match details for ID: ${id}`);

      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/matching/${id}`, {
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
      if (result.success && result.data.match) {
        setMatch(result.data.match);
        logger.info(`Loaded details for match: ${result.data.match.name}`);
      } else {
        throw new Error(result.message || 'Failed to load match details');
      }
    } catch (error) {
      logger.error('Error loading match details', error);
      Alert.alert('Error', 'Failed to load match details. Please try again.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSendConnectionRequest = async () => {
    if (!match) return;

    Alert.alert(
      'Send Connection Request',
      `Send a ${match.type === 'family' ? 'family' : 'friend'} connection request to ${match.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Request',
          onPress: async () => {
            try {
              setRequesting(true);
              logger.debug(`Sending connection request to: ${match.name}`);

              const response = await fetch(`${API_CONFIG.BASE_URL}/matching/${match.id}/connect`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  type: match.type || 'friend',
                  message: `Hi ${match.name}! I'd like to connect with you through YoFam.`
                }),
              });

              if (response.ok) {
                logger.info(`Connection request sent to: ${match.name}`);
                Alert.alert(
                  'Request Sent!',
                  `Your ${match.type === 'family' ? 'family' : 'friend'} connection request has been sent to ${match.name}.`,
                  [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
              } else {
                throw new Error('Failed to send connection request');
              }
            } catch (error) {
              logger.error('Error sending connection request', error);
              Alert.alert('Error', 'Failed to send connection request. Please try again.');
            } finally {
              setRequesting(false);
            }
          }
        }
      ]
    );
  };

  const handleStartChat = () => {
    if (!match) return;
    
    navigation.navigate('ChatScreen', {
      targetUser: {
        id: match.id,
        name: match.name,
        initials: match.initials || match.name.split(' ').map(n => n[0]).join(''),
        isOnline: true
      },
      currentUser: user
    });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#fcd3aa" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>
        {match?.type === 'family' ? 'Family Match' : 'Friend Match'}
      </Text>
      <TouchableOpacity style={styles.moreButton} onPress={() => {}}>
        <Ionicons name="ellipsis-horizontal" size={24} color="#fcd3aa" />
      </TouchableOpacity>
    </View>
  );

  const renderProfileSection = () => (
    <View style={styles.profileSection}>
      <LinearGradient
        colors={['rgba(0,145,173,0.1)', 'rgba(4,167,199,0.05)']}
        style={styles.profileGradient}
      >
        {/* Profile Image */}
        <View style={styles.profileImageContainer}>
          {match?.profileImage || getBestAvatarUrl(match) ? (
            <Image 
              source={{ uri: match.profileImage || getBestAvatarUrl(match)! }} 
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Text style={styles.initialsText}>
                {match?.initials || match?.name?.split(' ').map(n => n[0]).join('') || 'U'}
              </Text>
            </View>
          )}
          {match?.verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
            </View>
          )}
        </View>

        {/* Basic Info */}
        <View style={styles.basicInfo}>
          <Text style={styles.matchName}>{match?.name || 'Unknown User'}</Text>
          {match?.relation && (
            <Text style={styles.relation}>{match.relation}</Text>
          )}
          {match?.age && (
            <Text style={styles.ageLocation}>
              Age {match.age}{match?.location ? ` " ${match.location}` : ''}
            </Text>
          )}
          {match?.distance && (
            <Text style={styles.distance}>=Í {match.distance} away</Text>
          )}
        </View>

        {/* Match Percentage */}
        {match?.percentage && (
          <View style={styles.percentageContainer}>
            <LinearGradient
              colors={['#22c55e', '#16a34a']}
              style={styles.percentageGradient}
            >
              <Text style={styles.percentageText}>{match.percentage}%</Text>
            </LinearGradient>
            <Text style={styles.percentageLabel}>Match</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );

  const renderDetailsSection = () => (
    <View style={styles.detailsSection}>
      {/* Bio */}
      {match?.bio && (
        <View style={styles.detailCard}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bioText}>{match.bio}</Text>
        </View>
      )}

      {/* Interests */}
      {match?.interests && match.interests.length > 0 && (
        <View style={styles.detailCard}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <View style={styles.interestsContainer}>
            {match.interests.map((interest, index) => (
              <View key={index} style={styles.interestTag}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Connection Info */}
      <View style={styles.detailCard}>
        <Text style={styles.sectionTitle}>Connection Info</Text>
        <View style={styles.connectionInfo}>
          {match?.commonConnections !== undefined && (
            <View style={styles.connectionItem}>
              <Ionicons name="people" size={16} color="#0091ad" />
              <Text style={styles.connectionText}>
                {match.commonConnections} mutual connections
              </Text>
            </View>
          )}
          {match?.lastActive && (
            <View style={styles.connectionItem}>
              <Ionicons name="time" size={16} color="#0091ad" />
              <Text style={styles.connectionText}>
                Active {match.lastActive}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  const renderActionButtons = () => (
    <View style={styles.actionButtons}>
      <TouchableOpacity 
        style={styles.primaryButton} 
        onPress={handleSendConnectionRequest}
        disabled={requesting}
      >
        <LinearGradient
          colors={['#0091ad', '#04a7c7']}
          style={styles.buttonGradient}
        >
          {requesting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <Ionicons name="person-add" size={20} color="#ffffff" />
              <Text style={styles.buttonText}>
                Send {match?.type === 'family' ? 'Family' : 'Friend'} Request
              </Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={handleStartChat}>
        <View style={styles.secondaryButtonContent}>
          <Ionicons name="chatbubble" size={20} color="#0091ad" />
          <Text style={styles.secondaryButtonText}>Start Chat</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0091ad" />
          <Text style={styles.loadingText}>Loading match details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!match) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#ef4444" />
          <Text style={styles.errorTitle}>Match Not Found</Text>
          <Text style={styles.errorText}>
            This match could not be loaded. It may have been removed or doesn't exist.
          </Text>
          <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {renderProfileSection()}
        {renderDetailsSection()}
        {renderActionButtons()}
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
  moreButton: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(252,211,170,0.08)',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    margin: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  profileGradient: {
    padding: 24,
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#0091ad',
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0,145,173,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#0091ad',
  },
  initialsText: {
    fontSize: 36,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 2,
  },
  basicInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  matchName: {
    fontSize: 24,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
  },
  relation: {
    fontSize: 16,
    fontFamily: getSystemFont('medium'),
    color: '#0091ad',
    textAlign: 'center',
    marginBottom: 8,
  },
  ageLocation: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  distance: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 4,
  },
  percentageContainer: {
    alignItems: 'center',
  },
  percentageGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 4,
  },
  percentageText: {
    fontSize: 18,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
  },
  percentageLabel: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: 'rgba(255,255,255,0.6)',
  },
  detailsSection: {
    paddingHorizontal: 20,
  },
  detailCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 22,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    backgroundColor: 'rgba(0,145,173,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,145,173,0.3)',
  },
  interestText: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: '#0091ad',
  },
  connectionInfo: {
    gap: 8,
  },
  connectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectionText: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.8)',
  },
  actionButtons: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 12,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,145,173,0.3)',
    backgroundColor: 'rgba(0,145,173,0.1)',
  },
  secondaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: getSystemFont('bold'),
    color: '#0091ad',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: '#0091ad',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    fontSize: 16,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
  },
});

export default MatchDetailsScreen;