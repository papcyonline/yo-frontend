import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, FlatList, RefreshControl, Image, ActivityIndicator, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { matchingAPI, Match, MatchAnalytics } from '../../services/matchingAPI';
import { useFocusEffect } from '@react-navigation/native';
import { getSystemFont } from '../../config/constants';
import { useAuthStore } from '../../store/authStore';
import { getBestAvatarUrl } from '../../utils/imageHelpers';

interface FriendMatchesScreenProps {
  navigation: any;
}

const FriendMatchesScreen: React.FC<FriendMatchesScreenProps> = ({ navigation }) => {
  const authStore = useAuthStore();
  const user = authStore.user;
  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [analytics, setAnalytics] = useState<MatchAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadMatches(),
        loadAnalytics()
      ]);
    } catch (error) {
      console.error('Error loading friend matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMatches = async () => {
    try {
      // Pass the current user's ID to get their specific matches
      const response = await matchingAPI.getMatches('friend', 1, 50, user?.id);
      setMatches(response.matches);
      setFilteredMatches(response.matches);
    } catch (error) {
      console.error('Error loading friend matches:', error);
      setMatches([]);
      setFilteredMatches([]);
    }
  };

  const loadAnalytics = async () => {
    try {
      const analyticsData = await matchingAPI.getMatchAnalytics();
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setAnalytics(null);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredMatches(matches);
    } else {
      const filtered = matches.filter(match => {
        const name = match.name || match.matched_user?.name || match.matched_user?.fullName || '';
        const location = match.location || match.matched_user?.location || '';
        const interests = match.interests || match.matched_user?.interests || [];
        
        const searchTerm = query.toLowerCase();
        return (
          name.toLowerCase().includes(searchTerm) ||
          location.toLowerCase().includes(searchTerm) ||
          interests.some((interest: string) => interest.toLowerCase().includes(searchTerm))
        );
      });
      setFilteredMatches(filtered);
    }
  };

  const toggleSearch = () => {
    setSearchVisible(!searchVisible);
    if (searchVisible) {
      setSearchQuery('');
      setFilteredMatches(matches);
    }
  };

  const handleMatchPress = (match: Match) => {
    navigation.navigate('MatchDetail', {
      matchId: match.id,
      matchType: 'friend',
      matchData: match
    });
  };

  const getDisplayName = (user: any) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user.first_name) {
      return user.first_name;
    }
    if (user.last_name) {
      return user.last_name;
    }
    return user.username || 'Unknown';
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return '#00C851';
      case 'medium': return '#ffbb33';
      case 'low': return '#ff4444';
      default: return '#999';
    }
  };

  const renderMatch = ({ item, index }: { item: Match; index: number }) => (
    <TouchableOpacity
      style={styles.matchCard}
      onPress={() => handleMatchPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.matchRow}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {(() => {
            const avatarUrl = getBestAvatarUrl(item.matched_user);
            return avatarUrl ? (
              <Image 
                source={{ uri: avatarUrl }} 
                style={styles.avatar}
                onError={() => console.log('❌ Friend match avatar failed to load:', avatarUrl)}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {getDisplayName(item.matched_user)[0]?.toUpperCase()}
                </Text>
              </View>
            );
          })()}
          <View style={[styles.statusDot, { backgroundColor: getConfidenceColor(item.confidence_level) }]} />
        </View>

        {/* Info */}
        <View style={styles.matchInfo}>
          <Text style={styles.matchName} numberOfLines={1}>
            {getDisplayName(item.matched_user)}
          </Text>
          <View style={styles.subInfo}>
            <Ionicons name="location" size={10} color="#6b7280" />
            <Text style={styles.matchLocation} numberOfLines={1}>
              {item.matched_user.location || 'Unknown'}
            </Text>
          </View>
        </View>

        {/* Score */}
        <View style={styles.scoreSection}>
          <Text style={styles.scorePercentage}>{Math.round(item.match_score)}%</Text>
          <Text style={styles.scoreLabel}>match</Text>
        </View>
      </View>
      
      {/* Gradient Separator */}
      <LinearGradient
        colors={['transparent', '#15803d', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.separator}
      />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Friend Matches</Text>
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={() => {}}
          >
            <Ionicons name="search" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#15803d" />
          <Text style={styles.loadingText}>Loading friend matches...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Friend Matches</Text>
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={toggleSearch}
        >
          <Ionicons name={searchVisible ? "close" : "search"} size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      {searchVisible && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="rgba(255,255,255,0.6)" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, location, or interests..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={searchQuery}
              onChangeText={handleSearch}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#15803d"
          />
        }
      >
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{analytics?.friend_matches || matches.length}</Text>
            <Text style={styles.statLabel}>Friend Matches</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{matches.filter(m => m.status === 'connected').length}</Text>
            <Text style={styles.statLabel}>Friends Connected</Text>
          </View>
        </View>

        {filteredMatches.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="person-add" size={80} color="#374151" />
            <Text style={styles.emptyTitle}>No Friend Matches Yet</Text>
            <Text style={styles.emptyDescription}>
              Add more details about your interests, hobbies, and background to find friends with similar interests.
            </Text>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('PersonalDetails', { fromDashboard: true })}
            >
              <Text style={styles.actionButtonText}>Add More Details</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.matchesContainer}>
            <Text style={styles.sectionTitle}>Your Friend Matches</Text>
            <FlatList
              data={filteredMatches}
              renderItem={renderMatch}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
              contentContainerStyle={styles.matchesList}
            />
          </View>
        )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    marginTop: 16,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.2)',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1f2937',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontFamily: getSystemFont('bold'),
    color: '#15803d',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: '#9ca3af',
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  actionButton: {
    backgroundColor: '#15803d',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
  },
  matchesContainer: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginBottom: 16,
  },
  matchesList: {
    paddingBottom: 20,
  },
  matchCard: {
    width: '100%',
    marginBottom: 0,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontFamily: getSystemFont('semiBold'),
    color: '#15803d',
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#000000',
  },
  matchInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  matchName: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
    marginBottom: 2,
  },
  subInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchLocation: {
    fontSize: 11,
    fontFamily: getSystemFont('regular'),
    color: '#9ca3af',
    marginLeft: 4,
  },
  scoreSection: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  scorePercentage: {
    fontSize: 18,
    fontFamily: getSystemFont('bold'),
    color: '#15803d',
  },
  scoreLabel: {
    fontSize: 10,
    fontFamily: getSystemFont('regular'),
    color: '#6b7280',
  },
  separator: {
    height: 1,
    marginTop: 0,
    opacity: 0.3,
  },
});

export default FriendMatchesScreen;