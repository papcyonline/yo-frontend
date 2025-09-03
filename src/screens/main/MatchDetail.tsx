// src/screens/main/MatchDetail.tsx - Advanced Modern Profile Design
import React, { useState, useRef, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar,
  Alert,
  Dimensions,
  Animated,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomNavigation } from '../../components/dashboard/BottomNavigation';
import { ConnectionService } from '../../services/connectionService';
import Svg, { Defs, RadialGradient, Stop, Circle, Path, Ellipse } from 'react-native-svg';
import { getBestAvatarUrl } from '../../utils/imageHelpers';

const { width, height } = Dimensions.get('window');

interface MatchDetailProps {
  navigation: any;
  route: any;
}

const MatchDetail: React.FC<MatchDetailProps> = ({ navigation, route }) => {
  const { match, matchType, user } = route.params || {};
  const [activeBottomTab, setActiveBottomTab] = useState('family');
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [activeSection, setActiveSection] = useState<'profile' | 'details' | 'connection'>('profile');

  // Advanced animations
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const profileScale = useRef(new Animated.Value(1)).current;
  const fadeAnims = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Staggered entrance animations
    fadeAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: index * 100,
        useNativeDriver: true,
      }).start();
    });

    // Load connection status
    if (match?.id) {
      loadConnectionStatus();
    }
  }, [match?.id]);

  // Refresh connection status when screen comes back into focus
  useFocusEffect(
    React.useCallback(() => {
      if (match?.id) {
        loadConnectionStatus();
      }
    }, [match?.id])
  );

  const loadConnectionStatus = async () => {
    if (!match?.id) return;
    
    try {
      setConnectionLoading(true);
      const status = await ConnectionService.getConnectionStatus(match.id);
      setFriendshipStatus(status.status);
    } catch (error) {
      console.error('Error loading connection status:', error);
    } finally {
      setConnectionLoading(false);
    }
  };

  // Real friendship status
  const [friendshipStatus, setFriendshipStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'friends' | 'blocked'>('none');
  const [connectionLoading, setConnectionLoading] = useState(true);
  
  // Mock user privacy settings
  const publicInfo = {
    basicInfo: { age: true, gender: false, maritalStatus: false, children: false },
    familyHeritage: { origin: true, tribe: false, languages: true, religion: true },
    professional: { occupation: true, company: false, education: true, industry: true },
    contact: { phone: false, email: false, location: true },
    interests: true
  };

  const handleBack = () => navigation.goBack();

  const handleSendFriendRequest = async () => {
    if (friendshipStatus !== 'none' || !match?.id) return;
    
    try {
      // Show loading state
      setConnectionLoading(true);
      
      const result = await ConnectionService.sendFriendRequest(
        match.id,
        `Hi ${match.name}! I'd love to connect with you based on our ${matchType === 'family' ? 'family' : 'friend'} match.`
      );
      
      // Update status immediately for real-time feedback
      setFriendshipStatus('pending_sent');
      setFriendRequestSent(true);
      
      Alert.alert(
        'Friend Request Sent!',
        `Your friend request has been sent to ${match?.name}. You'll be notified when they respond.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error sending friend request:', error);
      
      // Show specific error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to send friend request';
      Alert.alert('Request Failed', errorMessage, [{ text: 'Try Again' }]);
    } finally {
      setConnectionLoading(false);
    }
  };

  const handleAcceptFriendRequest = async () => {
    if (friendshipStatus !== 'pending_received' || !match?.id) return;
    
    try {
      setConnectionLoading(true);
      
      // We need to find the friend request ID first
      const receivedRequests = await ConnectionService.getReceivedFriendRequests();
      const request = receivedRequests.find(req => req.senderId === match.id && req.status === 'pending');
      
      if (request) {
        await ConnectionService.acceptFriendRequest(request.id);
        setFriendshipStatus('friends');
        
        Alert.alert(
          'Friend Request Accepted!',
          `You are now connected with ${match.name}`,
          [{ text: 'Great!' }]
        );
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      Alert.alert('Error', 'Failed to accept friend request');
    } finally {
      setConnectionLoading(false);
    }
  };

  const handleRejectFriendRequest = async () => {
    if (friendshipStatus !== 'pending_received' || !match?.id) return;
    
    Alert.alert(
      'Reject Friend Request',
      `Are you sure you want to reject the friend request from ${match.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setConnectionLoading(true);
              
              const receivedRequests = await ConnectionService.getReceivedFriendRequests();
              const request = receivedRequests.find(req => req.senderId === match.id && req.status === 'pending');
              
              if (request) {
                await ConnectionService.declineFriendRequest(request.id);
                setFriendshipStatus('none');
              }
            } catch (error) {
              console.error('Error rejecting friend request:', error);
              Alert.alert('Error', 'Failed to reject friend request');
            } finally {
              setConnectionLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleCancelFriendRequest = async () => {
    if (friendshipStatus !== 'pending_sent' || !match?.id) return;
    
    Alert.alert(
      'Cancel Friend Request',
      `Cancel your friend request to ${match.name}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Cancel Request',
          style: 'destructive',
          onPress: async () => {
            try {
              setConnectionLoading(true);
              
              const sentRequests = await ConnectionService.getSentFriendRequests();
              const request = sentRequests.find(req => req.receiverId === match.id && req.status === 'pending');
              
              if (request) {
                await ConnectionService.cancelFriendRequest(request.id);
                setFriendshipStatus('none');
              }
            } catch (error) {
              console.error('Error cancelling friend request:', error);
              Alert.alert('Error', 'Failed to cancel friend request');
            } finally {
              setConnectionLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleChat = () => {
    if (friendshipStatus !== 'friends') {
      Alert.alert(
        'Chat Unavailable',
        'You can only chat with confirmed friends. Send a friend request first.',
        [{ text: 'OK' }]
      );
      return;
    }
    navigation.navigate('Chat', {
      targetUser: { id: match.id, name: match.name },
      currentUser: user
    });
  };

  const renderFriendshipActionButton = () => {
    if (connectionLoading) {
      return (
        <TouchableOpacity 
          style={[styles.actionButton, styles.primaryAction]}
          disabled={true}
        >
          <LinearGradient
            colors={['rgba(107,114,128,0.8)', 'rgba(75,85,99,0.8)']}
            style={styles.actionGradient}
          >
            <Ionicons name="hourglass" size={18} color="#ffffff" />
            <Text style={styles.actionText}>Loading...</Text>
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    switch (friendshipStatus) {
      case 'friends':
        return (
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryAction]}
            disabled={true}
          >
            <LinearGradient
              colors={['rgba(34,197,94,0.9)', 'rgba(22,163,74,0.9)']}
              style={styles.actionGradient}
            >
              <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
              <Text style={styles.actionText}>Friends</Text>
            </LinearGradient>
          </TouchableOpacity>
        );

      case 'pending_sent':
        return (
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryAction]}
            onPress={handleCancelFriendRequest}
          >
            <LinearGradient
              colors={['rgba(249,115,22,0.8)', 'rgba(234,88,12,0.8)']}
              style={styles.actionGradient}
            >
              <Ionicons name="time" size={18} color="#ffffff" />
              <Text style={styles.actionText}>Pending</Text>
            </LinearGradient>
          </TouchableOpacity>
        );

      case 'pending_received':
        return (
          <>
            <TouchableOpacity 
              style={[styles.actionButton, styles.acceptAction]}
              onPress={handleAcceptFriendRequest}
            >
              <LinearGradient
                colors={['rgba(34,197,94,0.9)', 'rgba(22,163,74,0.9)']}
                style={styles.actionGradient}
              >
                <Ionicons name="checkmark" size={18} color="#ffffff" />
                <Text style={styles.actionText}>Accept</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.rejectAction]}
              onPress={handleRejectFriendRequest}
            >
              <LinearGradient
                colors={['rgba(239,68,68,0.9)', 'rgba(220,38,38,0.9)']}
                style={styles.actionGradient}
              >
                <Ionicons name="close" size={18} color="#ffffff" />
                <Text style={styles.actionText}>Decline</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        );

      case 'none':
      default:
        return (
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryAction]}
            onPress={handleSendFriendRequest}
          >
            <LinearGradient
              colors={['rgba(0,145,173,0.9)', 'rgba(4,167,199,0.9)']}
              style={styles.actionGradient}
            >
              <Ionicons name="person-add" size={18} color="#ffffff" />
              <Text style={styles.actionText}>Connect</Text>
            </LinearGradient>
          </TouchableOpacity>
        );
    }
  };

  const isDataVisible = (section: keyof typeof publicInfo, field?: string) => {
    if (friendshipStatus === 'friends') return true;
    if (field) {
      return publicInfo[section][field as keyof typeof publicInfo[typeof section]];
    }
    return publicInfo[section as keyof typeof publicInfo];
  };

  // Advanced scroll handler
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const opacity = Math.min(offsetY / 200, 1);
        headerOpacity.setValue(opacity);
        
        const scale = Math.max(1 - offsetY / 1000, 0.8);
        profileScale.setValue(scale);
      },
    }
  );

  // Advanced Hero Section with Parallax
  const renderHeroSection = () => (
    <Animated.View style={[
      styles.heroContainer,
      {
        transform: [
          {
            translateY: scrollY.interpolate({
              inputRange: [0, 300],
              outputRange: [0, -50],
              extrapolate: 'clamp',
            }),
          },
        ],
      },
    ]}>
      {/* Dynamic Background */}
      <View style={styles.dynamicBackground}>
        <Svg width={width} height={400} style={StyleSheet.absoluteFillObject}>
          {/* Floating Elements */}
          <Circle cx={width * 0.15} cy={120} r={2.5} fill="rgba(252,211,170,0.4)" opacity="0.7">
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; 5,10; 0,0"
              dur="4s"
              repeatCount="indefinite"
            />
          </Circle>
          <Circle cx={width * 0.85} cy={140} r={1.8} fill="rgba(0,145,173,0.5)" opacity="0.8">
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; -3,8; 0,0"
              dur="5s"
              repeatCount="indefinite"
            />
          </Circle>
          <Circle cx={width * 0.25} cy={280} r={1.2} fill="rgba(4,167,199,0.6)" opacity="0.6">
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; 8,-5; 0,0"
              dur="6s"
              repeatCount="indefinite"
            />
          </Circle>
          <Circle cx={width * 0.75} cy={90} r={2} fill="rgba(252,211,170,0.5)" opacity="0.5">
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; -6,12; 0,0"
              dur="7s"
              repeatCount="indefinite"
            />
          </Circle>
        </Svg>
      </View>

      {/* Profile Card with Glass Effect */}
      <Animated.View 
        style={[
          styles.profileCard,
          {
            opacity: fadeAnims[0],
            transform: [
              { scale: profileScale },
              {
                translateY: fadeAnims[0].interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
          style={styles.glassEffect}
        >
          {/* Avatar with Rings */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarRings}>
              <View style={[styles.ring, styles.outerRing]} />
              <View style={[styles.ring, styles.middleRing]} />
              {(() => {
                const avatarUrl = getBestAvatarUrl(match);
                return avatarUrl ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    style={styles.avatarImage}
                    onError={() => console.log('❌ Match detail avatar failed to load:', avatarUrl)}
                  />
                ) : (
                  <LinearGradient
                    colors={['#0091ad', '#04a7c7', '#fcd3aa']}
                    style={styles.avatar}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.avatarText}>
                      {match?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                    </Text>
                  </LinearGradient>
                );
              })()}
              
              {/* Status Indicators */}
              <View style={styles.statusContainer}>
                <View style={styles.onlineStatus}>
                  <View style={styles.onlinePulse} />
                  <View style={styles.onlineDot} />
                </View>
                <View style={styles.verifiedBadge}>
                  <LinearGradient
                    colors={['#4ade80', '#22c55e']}
                    style={styles.verifiedGradient}
                  >
                    <Ionicons name="checkmark" size={12} color="#ffffff" />
                  </LinearGradient>
                </View>
              </View>
            </View>
          </View>

          {/* Profile Info */}
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{match?.name}</Text>
            
            <View style={styles.profileMeta}>
              <View style={styles.locationContainer}>
                <Ionicons name="location" size={14} color="#0091ad" />
                <Text style={styles.locationText}>
                  {isDataVisible('contact', 'location') ? (match?.location || 'Dubai, UAE') : 'Private'}
                </Text>
              </View>
              
              <View style={styles.connectionType}>
                <LinearGradient
                  colors={['rgba(252,211,170,0.2)', 'rgba(0,145,173,0.2)']}
                  style={styles.connectionBadge}
                >
                  <Text style={styles.connectionText}>
                    {matchType === 'family' ? match?.relation : 'Friend Match'}
                  </Text>
                  {matchType === 'family' && match?.percentage && (
                    <View style={styles.matchIndicator}>
                      <Text style={styles.matchPercentage}>{match.percentage}%</Text>
                    </View>
                  )}
                </LinearGradient>
              </View>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );

  // Floating Action Bar
  const renderActionBar = () => (
    <Animated.View 
      style={[
        styles.actionBar,
        {
          opacity: fadeAnims[1],
          transform: [
            {
              translateY: fadeAnims[1].interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              }),
            },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
        style={styles.actionBarGradient}
      >
        {renderFriendshipActionButton()}
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.secondaryAction]}
          onPress={handleChat}
        >
          <View style={styles.secondaryActionContent}>
            <Ionicons name="chatbubble-ellipses" size={18} color="#0091ad" />
            <Text style={styles.secondaryActionText}>Message</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.actionButton, styles.iconAction]}>
          <View style={styles.iconActionContent}>
            <Ionicons name="call" size={18} color="#04a7c7" />
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.actionButton, styles.iconAction]}>
          <View style={styles.iconActionContent}>
            <Ionicons name="ellipsis-horizontal" size={18} color="#fcd3aa" />
          </View>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );

  // Section Navigator
  const renderSectionNav = () => (
    <Animated.View 
      style={[
        styles.sectionNav,
        {
          opacity: fadeAnims[2],
          transform: [
            {
              translateX: fadeAnims[2].interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0],
              }),
            },
          ],
        },
      ]}
    >
      {[
        { key: 'profile', label: 'About', icon: 'person' },
        { key: 'details', label: 'Details', icon: 'information-circle' },
        { key: 'connection', label: 'Connection', icon: 'git-network' }
      ].map((section) => (
        <TouchableOpacity
          key={section.key}
          style={[
            styles.sectionTab,
            activeSection === section.key && styles.activeSectionTab
          ]}
          onPress={() => setActiveSection(section.key as any)}
        >
          <View style={styles.sectionTabContent}>
            <Ionicons 
              name={section.icon as any} 
              size={16} 
              color={activeSection === section.key ? '#0091ad' : 'rgba(255,255,255,0.6)'} 
            />
            <Text style={[
              styles.sectionTabText,
              activeSection === section.key && styles.activeSectionTabText
            ]}>
              {section.label}
            </Text>
          </View>
          {activeSection === section.key && (
            <LinearGradient
              colors={['transparent', '#0091ad', 'transparent']}
              style={styles.sectionIndicator}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          )}
        </TouchableOpacity>
      ))}
    </Animated.View>
  );

  // Dynamic Content Sections
  const renderContent = () => {
    const baseStyle = {
      opacity: fadeAnims[3],
      transform: [
        {
          translateY: fadeAnims[3].interpolate({
            inputRange: [0, 1],
            outputRange: [30, 0],
          }),
        },
      ],
    };

    switch (activeSection) {
      case 'profile':
        return (
          <Animated.View style={[styles.contentSection, baseStyle]}>
            <View style={styles.aboutCard}>
              <LinearGradient
                colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
                style={styles.cardGradient}
              >
                <View style={styles.cardHeader}>
                  <Ionicons name="heart" size={20} color="#fcd3aa" />
                  <Text style={styles.cardTitle}>About {match?.name?.split(' ')[0]}</Text>
                </View>
                <Text style={styles.aboutText}>
                  {match?.bio || 'A community member passionate about connecting with family and building meaningful relationships. Interested in genealogy, cultural heritage, and sharing stories.'}
                </Text>
                
                {/* Interest Pills */}
                {isDataVisible('interests') && (
                  <View style={styles.interestsSection}>
                    <Text style={styles.interestsTitle}>Interests</Text>
                    <View style={styles.interestPills}>
                      {['Genealogy', 'Photography', 'Travel', 'Culture', 'Family History'].map((interest, index) => (
                        <View key={index} style={styles.interestPill}>
                          <LinearGradient
                            colors={['rgba(0,145,173,0.2)', 'rgba(4,167,199,0.1)']}
                            style={styles.pillGradient}
                          >
                            <Text style={styles.pillText}>{interest}</Text>
                          </LinearGradient>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </LinearGradient>
            </View>
          </Animated.View>
        );

      case 'details':
        return (
          <Animated.View style={[styles.contentSection, baseStyle]}>
            {renderDetailCards()}
          </Animated.View>
        );

      case 'connection':
        return (
          <Animated.View style={[styles.contentSection, baseStyle]}>
            {renderConnectionDetails()}
          </Animated.View>
        );

      default:
        return null;
    }
  };

  // Advanced Detail Cards
  const renderDetailCards = () => (
    <View style={styles.detailCards}>
      {[
        {
          title: 'Personal',
          icon: 'person',
          items: [
            { label: 'Age', value: '32 years', visible: isDataVisible('basicInfo', 'age') },
            { label: 'Location', value: 'Dubai, UAE', visible: isDataVisible('contact', 'location') },
            { label: 'Languages', value: 'Arabic, English', visible: isDataVisible('familyHeritage', 'languages') }
          ]
        },
        {
          title: 'Heritage',
          icon: 'flag',
          items: [
            { label: 'Origin', value: 'Palestinian', visible: isDataVisible('familyHeritage', 'origin') },
            { label: 'Religion', value: 'Islam', visible: isDataVisible('familyHeritage', 'religion') },
            { label: 'Tribe', value: 'Al-Husseini', visible: isDataVisible('familyHeritage', 'tribe') }
          ]
        },
        {
          title: 'Professional',
          icon: 'briefcase',
          items: [
            { label: 'Occupation', value: 'Software Engineer', visible: isDataVisible('professional', 'occupation') },
            { label: 'Education', value: 'Master\'s in CS', visible: isDataVisible('professional', 'education') },
            { label: 'Industry', value: 'Technology', visible: isDataVisible('professional', 'industry') }
          ]
        }
      ].map((card, cardIndex) => (
        <View key={cardIndex} style={styles.detailCard}>
          <LinearGradient
            colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
            style={styles.cardGradient}
          >
            <View style={styles.cardHeader}>
              <Ionicons name={card.icon as any} size={20} color="#fcd3aa" />
              <Text style={styles.cardTitle}>{card.title}</Text>
            </View>
            
            <View style={styles.detailItems}>
              {card.items.map((item, itemIndex) => (
                <View key={itemIndex} style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{item.label}</Text>
                  {item.visible ? (
                    <Text style={styles.detailValue}>{item.value}</Text>
                  ) : (
                    <View style={styles.privateIndicator}>
                      <Ionicons name="lock-closed" size={12} color="rgba(255,255,255,0.4)" />
                      <Text style={styles.privateText}>Private</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </LinearGradient>
        </View>
      ))}
    </View>
  );

  // Connection Details
  const renderConnectionDetails = () => (
    <View style={styles.connectionSection}>
      {matchType === 'family' && (
        <View style={styles.connectionCard}>
          <LinearGradient
            colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
            style={styles.cardGradient}
          >
            <View style={styles.connectionHeader}>
              <View style={styles.matchScore}>
                <Text style={styles.matchPercentageLarge}>{match?.percentage || '85'}%</Text>
                <Text style={styles.matchLabel}>Match</Text>
              </View>
              <View style={styles.connectionInfo}>
                <Text style={styles.relationType}>{match?.relation}</Text>
                <Text style={styles.connectionDesc}>
                  Based on shared family names, locations, and heritage data
                </Text>
              </View>
            </View>
            
            <TouchableOpacity style={styles.verifyConnection}>
              <LinearGradient
                colors={['rgba(0,145,173,0.8)', 'rgba(4,167,199,0.8)']}
                style={styles.verifyGradient}
              >
                <Ionicons name="shield-checkmark" size={16} color="#ffffff" />
                <Text style={styles.verifyText}>Verify Family Connection</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}
      
      {/* Privacy Notice */}
      {friendshipStatus !== 'friends' && (
        <View style={styles.privacyCard}>
          <LinearGradient
            colors={['rgba(252,211,170,0.1)', 'rgba(252,211,170,0.05)']}
            style={styles.cardGradient}
          >
            <View style={styles.privacyHeader}>
              <Ionicons name="shield-checkmark" size={24} color="#fcd3aa" />
              <Text style={styles.privacyTitle}>Privacy Protected</Text>
            </View>
            <Text style={styles.privacyText}>
              Some information is private and will be visible after connecting as friends. This helps maintain privacy while allowing meaningful connections.
            </Text>
          </LinearGradient>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Dynamic Header */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <LinearGradient
          colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.4)']}
          style={styles.headerGradient}
        >
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{match?.name}</Text>
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#ffffff" />
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
      
      <Animated.ScrollView 
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        {renderHeroSection()}
        {renderActionBar()}
        {renderSectionNav()}
        {renderContent()}
        
        <View style={styles.bottomSpacing} />
      </Animated.ScrollView>

      <BottomNavigation
        activeTab={activeBottomTab}
        navigation={navigation}
        chatCount={0}
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
  
  // Dynamic Header
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: 50,
  },
  
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  
  menuButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  
  scrollContent: {
    paddingBottom: 120,
  },
  
  // Hero Section with Parallax
  heroContainer: {
    height: 400,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  
  dynamicBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  // Glass Profile Card
  profileCard: {
    width: width - 40,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  
  glassEffect: {
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  
  // Avatar with Rings
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  
  avatarRings: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
  },
  
  outerRing: {
    width: 110,
    height: 110,
    borderColor: 'rgba(252,211,170,0.3)',
  },
  
  middleRing: {
    width: 95,
    height: 95,
    borderColor: 'rgba(0,145,173,0.4)',
  },
  
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#0091ad',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 2,
  },

  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  
  // Status Indicators
  statusContainer: {
    position: 'absolute',
    width: 110,
    height: 110,
  },
  
  onlineStatus: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  onlinePulse: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(74,222,128,0.3)',
  },
  
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4ade80',
    borderWidth: 2,
    borderColor: '#000000',
  },
  
  verifiedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  
  verifiedGradient: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Profile Info
  profileInfo: {
    alignItems: 'center',
  },
  
  profileName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  
  profileMeta: {
    alignItems: 'center',
    gap: 12,
  },
  
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  
  locationText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
  },
  
  connectionType: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  
  connectionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fcd3aa',
  },
  
  matchIndicator: {
    backgroundColor: 'rgba(0,145,173,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  
  matchPercentage: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0091ad',
  },
  
  // Floating Action Bar
  actionBar: {
    marginHorizontal: 20,
    marginTop: -30,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    zIndex: 100,
  },
  
  actionBarGradient: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  
  primaryAction: {
    flex: 2,
  },
  
  acceptAction: {
    flex: 1,
  },

  rejectAction: {
    flex: 1,
  },
  
  secondaryAction: {
    flex: 1.5,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  
  iconAction: {
    width: 48,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  
  secondaryActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
  },
  
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0091ad',
  },
  
  iconActionContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  
  // Section Navigator
  sectionNav: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  
  sectionTab: {
    flex: 1,
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  
  activeSectionTab: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  
  sectionTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 6,
  },
  
  sectionTabText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
  },
  
  activeSectionTabText: {
    color: '#0091ad',
    fontWeight: '600',
  },
  
  sectionIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 2,
    borderRadius: 1,
  },
  
  // Content Sections
  contentSection: {
    paddingHorizontal: 20,
  },
  
  // About Card
  aboutCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  
  cardGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  
  aboutText: {
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 24,
    marginBottom: 20,
  },
  
  // Interest Pills
  interestsSection: {
    marginTop: 8,
  },
  
  interestsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fcd3aa',
    marginBottom: 12,
  },
  
  interestPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  
  interestPill: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  
  pillGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,145,173,0.3)',
  },
  
  pillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0091ad',
  },
  
  // Detail Cards
  detailCards: {
    gap: 16,
  },
  
  detailCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  
  detailItems: {
    gap: 12,
  },
  
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  
  detailLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
  },
  
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  
  privateIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  
  privateText: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.4)',
    fontStyle: 'italic',
  },
  
  // Connection Section
  connectionSection: {
    gap: 16,
  },
  
  connectionCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  
  connectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  
  matchScore: {
    alignItems: 'center',
  },
  
  matchPercentageLarge: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0091ad',
  },
  
  matchLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
  },
  
  connectionInfo: {
    flex: 1,
  },
  
  relationType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fcd3aa',
    marginBottom: 4,
  },
  
  connectionDesc: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
  },
  
  verifyConnection: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
  },
  
  verifyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  
  verifyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  
  // Privacy Card
  privacyCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fcd3aa',
  },
  
  privacyText: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
  },
  
  bottomSpacing: {
    height: 60,
  },
});

export default MatchDetail;