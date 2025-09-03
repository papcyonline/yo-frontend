// src/screens/FamilyPage.tsx - Updated with black background and custom colors
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Pattern, Rect, Circle } from 'react-native-svg';
import { BottomNavigation } from '../../components/dashboard/BottomNavigation';
import { useUnreadChats } from '../../hooks/useUnreadChats';
import { API_CONFIG } from '../../constants/api';
import { useAuthStore } from '../../store/authStore';
import logger from '../../services/LoggingService';

interface FamilyPageProps {
  navigation: any;
  route: any;
}

const FamilyPage: React.FC<FamilyPageProps> = ({ navigation, route }) => {
  const { user } = route.params || {};
  const { token } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState('family');
  const { unreadCount } = useUnreadChats();
  const [loading, setLoading] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFamilyMatches();
    setRefreshing(false);
  };

  const handleMatchPress = (match: any) => {
    navigation.navigate('MatchDetail', { 
      match: {
        id: match.id,
        name: match.name,
        initials: match.initials,
        relation: match.relation,
        bio: match.bio,
        location: match.location,
        percentage: match.percentage,
        type: 'family'
      },
      user 
    });
  };

  // Handle bottom navigation
  const handleBottomTabPress = (tabId: string) => {
    setActiveBottomTab(tabId);
    
    switch (tabId) {
      case 'family':
        // Already on family page
        break;
      case 'friends':
        navigation.navigate('FriendsPage', { user });
        break;
      case 'community':
        navigation.navigate('CommunityPage', { user });
        break;
      case 'chats':
        navigation.navigate('ChatsPage', { user });
        break;
      case 'settings':
        navigation.navigate('SettingsPage', { user });
        break;
      default:
        navigation.navigate('Dashboard', { user });
        break;
    }
  };

  // Updated color function with new color scheme
  const getPercentageColor = (percentage: number) => {
    if (percentage >= 80 && percentage <= 90) return '#0091ad'; // 80-90: primary blue
    if (percentage >= 60 && percentage < 80) return '#04a7c7';   // 60-80: secondary blue
    if (percentage >= 50 && percentage < 60) return '#fcd3aa';   // 50-60: warm accent
    return '#ff6b6b'; // 1-50: red
  };

  // Updated relation color function to match percentage colors
  const getRelationColor = (percentage: number) => {
    return getPercentageColor(percentage);
  };

  // Family matches data from API
  const [familyMatches, setFamilyMatches] = useState<any[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      initials: 'SJ',
      relation: 'Possible sister',
      bio: 'Lives in Chicago, works in healthcare. Share same birth year and location.',
      location: 'Chicago, IL',
      percentage: 85
    },
    {
      id: '2', 
      name: 'Michael Chen',
      initials: 'MC',
      relation: 'Possible cousin',
      bio: 'Software engineer in San Francisco. Common family surnames in records.',
      location: 'San Francisco, CA',
      percentage: 72
    },
    {
      id: '3',
      name: 'Emma Rodriguez',
      initials: 'ER',
      relation: 'Possible aunt',
      bio: 'Teacher from Texas. Matches family tree connections and age range.',
      location: 'Austin, TX', 
      percentage: 68
    },
    {
      id: '4',
      name: 'David Thompson',
      initials: 'DT',
      relation: 'Possible uncle',
      bio: 'Business owner in Portland. Strong genealogical match indicators.',
      location: 'Portland, OR',
      percentage: 78
    },
    {
      id: '5',
      name: 'Lisa Wang',
      initials: 'LW',
      relation: 'Possible half-sister',
      bio: 'Marketing professional in Seattle. DNA markers suggest close relation.',
      location: 'Seattle, WA',
      percentage: 81
    }
  ]);
  
  // Load family matches from API
  React.useEffect(() => {
    loadFamilyMatches();
  }, []);

  const loadFamilyMatches = async () => {
    try {
      setLoading(true);
      logger.debug('Loading family matches');

      if (!token) {
        logger.warn('No auth token available for family matches');
        return;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/matching/family`, {
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
        const matches = result.data.matches || [];
        setFamilyMatches(matches.map((match: any) => ({
          id: match.id,
          name: match.name || match.matched_user?.name || 'Unknown',
          initials: (match.name || match.matched_user?.name || 'U').split(' ').map((n: string) => n[0]).join(''),
          relation: match.relation || 'Possible relative',
          bio: match.bio || match.matched_user?.bio || 'No bio available',
          location: match.location || match.matched_user?.location || 'Location unknown',
          percentage: Math.round((match.confidence || match.match_score || 75) * 100) / 100
        })));
        logger.info(`Loaded ${matches.length} family matches`);
      } else {
        throw new Error(result.message || 'Failed to load family matches');
      }
    } catch (error) {
      logger.error('Error loading family matches', error);
      // Keep existing mock data if API fails
      logger.info('Using mock data for family matches');
    } finally {
      setLoading(false);
    }
  };

  const renderBackground = () => (
    <View style={styles.backgroundPattern}>
      <LinearGradient
        colors={['#0091ad10', '#04a7c710', '#fcd3aa10']}
        style={styles.bgGradient1}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <LinearGradient
        colors={['#fcd3aa08', '#0091ad08']}
        style={styles.bgGradient2}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
        <Defs>
          <Pattern
            id="familyDots"
            patternUnits="userSpaceOnUse"
            width="30"
            height="30"
          >
            <Circle
              cx="15"
              cy="15"
              r="1"
              fill="rgba(252, 211, 170, 0.1)"
            />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#familyDots)" />
      </Svg>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Background Pattern */}
      {renderBackground()}
      
      {/* Header */}
      <LinearGradient
        colors={['#0091ad', '#04a7c7', '#fcd3aa']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Family Connections</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.searchButton}>
            <Ionicons name="search" size={24} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0091ad']}
            tintColor="#0091ad"
            progressBackgroundColor="#000000"
          />
        }
      >
        {/* Stats Card */}
        <View style={styles.statsCard}>
          <LinearGradient
            colors={['#0091ad', '#04a7c7', '#fcd3aa']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statsGradient}
          >
            <View style={styles.statsContent}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>24</Text>
                <Text style={styles.statLabel}>AI Potential Matches</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>7</Text>
                <Text style={styles.statLabel}>Strong Connections</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>3</Text>
                <Text style={styles.statLabel}>Confirmed Family</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Family Matches */}
        <View style={styles.matchesContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={[styles.sectionIcon, { backgroundColor: '#0091ad30' }]}>
                <Ionicons name="people" size={24} color="#0091ad" />
              </View>
              <Text style={styles.sectionTitle}>AI Potential Family Match</Text>
            </View>
            <View style={styles.matchCountBadge}>
              <LinearGradient
                colors={['#0091ad', '#04a7c7']}
                style={styles.badgeGradient}
              >
                <Text style={styles.matchCountText}>{familyMatches.length}</Text>
              </LinearGradient>
            </View>
          </View>
          
          {familyMatches.map((match, index) => (
            <View key={match.id} style={styles.modernMatchItem}>
              <TouchableOpacity 
                style={styles.cleanMatchCard}
                onPress={() => handleMatchPress(match)}
                activeOpacity={0.95}
              >
                {/* Left Side - Clean Avatar */}
                <View style={styles.avatarSection}>
                  <View style={[styles.cleanAvatar, { backgroundColor: index % 2 === 0 ? '#0091ad' : '#04a7c7' }]}>
                    <Text style={styles.cleanAvatarText}>{match.initials}</Text>
                    
                    {/* Match Quality Indicator */}
                    <View style={[styles.matchIndicator, { backgroundColor: getPercentageColor(match.percentage) }]} />
                  </View>
                </View>
                
                {/* Center - Clean Information Layout */}
                <View style={styles.infoSection}>
                  <View style={styles.nameAndPercentageSection}>
                    <Text style={styles.cleanMatchName}>{match.name}</Text>
                    <View style={styles.percentageBadge}>
                      <Text style={styles.percentageBadgeText}>{match.percentage}%</Text>
                    </View>
                  </View>
                  
                  <Text style={[styles.cleanRelationText, { color: getRelationColor(match.percentage) }]}>
                    {match.relation}
                  </Text>
                  
                  <Text style={styles.cleanBio} numberOfLines={1}>
                    {match.bio}
                  </Text>
                  
                  <View style={styles.metaInfo}>
                    <View style={styles.locationInfo}>
                      <Ionicons name="location" size={11} color="#0091ad" />
                      <Text style={styles.locationText}>{match.location}</Text>
                    </View>
                    <View style={styles.familyTag}>
                      <Text style={styles.familyTagText}>FAMILY</Text>
                    </View>
                  </View>
                </View>
                
                {/* Right Side - Clean Actions */}
                <View style={styles.actionSection}>
                  <TouchableOpacity style={styles.connectAction} activeOpacity={0.8}>
                    <Ionicons name="person-add" size={18} color="#fcd3aa" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
              
              {/* Enhanced Visible Divider */}
              {index < familyMatches.length - 1 && (
                <View style={styles.matchDivider}>
                  <LinearGradient
                    colors={['transparent', 'rgba(252, 211, 170, 0.25)', 'rgba(0, 145, 173, 0.15)', 'transparent']}
                    style={styles.dividerGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <BottomNavigation
        activeTab={activeBottomTab}
        onTabPress={handleBottomTabPress}
        chatCount={unreadCount}
        communityNotifications={0}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
  },
  
  // Background Pattern
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
    top: 200,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  bgGradient2: {
    position: 'absolute',
    bottom: 150,
    left: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
  },
  
  // Header
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
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  filterButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  
  // Content
  content: {
    flex: 1,
    zIndex: 1,
  },
  
  // Stats Card
  statsCard: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#0091ad',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    zIndex: 2,
  },
  statsGradient: {
    flex: 1,
  },
  statsContent: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 16,
  },
  
  // Matches Container
  matchesContainer: {
    paddingHorizontal: 16,
    zIndex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fcd3aa',
  },
  matchCountBadge: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  badgeGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  matchCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  
  // Modern Match Cards
  modernMatchItem: {
    backgroundColor: 'transparent',
  },
  
  cleanMatchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  
  // Avatar Section
  avatarSection: {
    marginRight: 16,
  },
  
  cleanAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    elevation: 2,
    shadowColor: '#0091ad',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  
  cleanAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  
  matchIndicator: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#000000',
  },
  
  // Information Section
  infoSection: {
    flex: 1,
    paddingRight: 10,
  },
  
  // Name and Percentage on same line
  nameAndPercentageSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  
  cleanMatchName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  
  percentageBadge: {
    backgroundColor: 'rgba(0, 145, 173, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 145, 173, 0.3)',
  },
  
  percentageBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0091ad',
  },
  
  cleanRelationText: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  
  cleanBio: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 17,
    marginBottom: 6,
  },
  
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  locationText: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
    marginLeft: 4,
  },
  
  familyTag: {
    backgroundColor: 'rgba(252, 211, 170, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  
  familyTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fcd3aa',
    letterSpacing: 0.5,
  },
  
  // Action Section - Compact
  actionSection: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
  },
  
  connectAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(252, 211, 170, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(252, 211, 170, 0.2)',
  },
  
  // Match Dividers (matching friends style)
  matchDivider: {
    height: 2,
    marginHorizontal: 12,
    marginLeft: 68, // Align with content (16 + 44 + 8)
    marginVertical: 2,
  },
  
  dividerGradient: {
    flex: 1,
    height: '100%',
    borderRadius: 1,
  },
  
  bottomSpacing: {
    height: 100,
  },
});

export default FamilyPage;