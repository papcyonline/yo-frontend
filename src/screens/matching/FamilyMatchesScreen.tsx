import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, FlatList, RefreshControl, Image, Alert, ActivityIndicator, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { matchingAPI, Match, MatchAnalytics } from '../../services/matchingAPI';
import { useFocusEffect } from '@react-navigation/native';
import { getSystemFont } from '../../config/constants';
import { useAuthStore } from '../../store/authStore';
import { chatService } from '../../services/ChatService';
import { getBestAvatarUrl } from '../../utils/imageHelpers';

interface FamilyMatchesScreenProps {
  navigation: any;
}

const FamilyMatchesScreen: React.FC<FamilyMatchesScreenProps> = ({ navigation }) => {
  const authStore = useAuthStore();
  const user = authStore.user;
  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [analytics, setAnalytics] = useState<MatchAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<any>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState({
    minScore: 0,
    maxScore: 100,
    location: '',
    relation: 'all'
  });

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // Setup real-time match updates
  useEffect(() => {
    const handleMatchesUpdated = (data: { matchCount: number; matches: any[]; timestamp: string }) => {
      console.log('🔄 Real-time: Matches updated in FamilyMatchesScreen');
      loadMatches(); // Refresh matches
    };

    const handleHighMatchesFound = (data: { matches: any[]; timestamp: string }) => {
      console.log('🌟 Real-time: High confidence matches found in FamilyMatchesScreen');
      loadMatches(); // Refresh matches
      
      // Family match notifications are now handled by the notification system
      // The backend should create proper notifications that appear in the bell
      console.log(`📱 High confidence matches: ${data.matches.length} matches found - notifications sent to bell`);
    };

    // Listen for match update events
    chatService.on('matches_updated', handleMatchesUpdated);
    chatService.on('high_matches_found', handleHighMatchesFound);

    return () => {
      chatService.off('matches_updated', handleMatchesUpdated);
      chatService.off('high_matches_found', handleHighMatchesFound);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadMatches(),
        loadAnalytics(),
        loadProcessingStatus()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMatches = async () => {
    try {
      // Pass the current user's ID to get their specific matches
      const response = await matchingAPI.getMatches('family', 1, 50, user?.id);
      setMatches(response.matches);
      setFilteredMatches(response.matches);
    } catch (error) {
      console.error('Error loading family matches:', error);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    filterMatches(query, searchFilters);
  };

  const filterMatches = (query: string, filters: any) => {
    let filtered = matches;

    // Text search
    if (query.trim()) {
      filtered = filtered.filter(match => 
        getDisplayName(match.matched_user).toLowerCase().includes(query.toLowerCase()) ||
        (match.matched_user.location || '').toLowerCase().includes(query.toLowerCase()) ||
        (match.relation || '').toLowerCase().includes(query.toLowerCase())
      );
    }

    // Score filter
    filtered = filtered.filter(match => 
      match.match_score >= filters.minScore && 
      match.match_score <= filters.maxScore
    );

    // Location filter
    if (filters.location.trim()) {
      filtered = filtered.filter(match => 
        (match.matched_user.location || '').toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Relation filter
    if (filters.relation !== 'all') {
      filtered = filtered.filter(match => 
        match.relation === filters.relation
      );
    }

    setFilteredMatches(filtered);
  };

  const loadAnalytics = async () => {
    try {
      const analyticsData = await matchingAPI.getMatchAnalytics();
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const loadProcessingStatus = async () => {
    try {
      const status = await matchingAPI.getProcessingStatus();
      setProcessingStatus(status);
    } catch (error) {
      console.error('Error loading processing status:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleMatchPress = (match: Match) => {
    navigation.navigate('MatchDetail', {
      matchId: match.id,
      matchType: 'family',
      matchData: match
    });
  };

  const handleProcessProfile = async () => {
    try {
      Alert.alert(
        'Process Profile',
        'This will analyze your profile and find new matches using AI. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Process',
            onPress: async () => {
              try {
                await matchingAPI.triggerProcessing(false, 'profile_update');
                Alert.alert('Success', 'Your profile has been queued for AI processing. New matches will appear shortly.');
                loadProcessingStatus();
              } catch (error) {
                Alert.alert('Error', 'Failed to trigger processing');
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to process profile');
    }
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
                onError={() => console.log('❌ Family match avatar failed to load:', avatarUrl)}
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
        colors={['transparent', '#0091ad', 'transparent']}
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
          <Text style={styles.headerTitle}>Family Matches</Text>
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={() => {}}
          >
            <Ionicons name="search" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0091ad" />
          <Text style={styles.loadingText}>Loading family matches...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Family Matches</Text>
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={() => setShowSearch(true)}
        >
          <Ionicons name="search" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#0091ad"
          />
        }
      >
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{analytics?.family_matches || 0}</Text>
            <Text style={styles.statLabel}>Family Matches</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{Math.round(analytics?.avg_match_score || 0)}%</Text>
            <Text style={styles.statLabel}>Avg Match Score</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{matches.filter(m => m.status === 'connected').length}</Text>
            <Text style={styles.statLabel}>Connected</Text>
          </View>
        </View>

        {/* Processing Status */}
        {processingStatus?.is_processing && (
          <View style={styles.processingCard}>
            <View style={styles.processingContent}>
              <ActivityIndicator size="small" color="#0091ad" />
              <Text style={styles.processingText}>AI is analyzing your profile for new matches...</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={styles.processButton}
            onPress={handleProcessProfile}
            disabled={processingStatus?.is_processing}
          >
            <LinearGradient
              colors={['#0091ad', '#04a7c7']}
              style={styles.processButtonGradient}
            >
              <Ionicons name="refresh" size={20} color="#ffffff" />
              <Text style={styles.processButtonText}>
                {processingStatus?.is_processing ? 'Processing...' : 'Find New Matches'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {matches.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people" size={80} color="#374151" />
            <Text style={styles.emptyTitle}>No Family Matches Yet</Text>
            <Text style={styles.emptyDescription}>
              Complete your profile to help us find your family connections using AI matching.
            </Text>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('ProgressiveProfile')}
            >
              <Text style={styles.actionButtonText}>Complete Profile</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.matchesContainer}>
            <View style={styles.matchesHeader}>
              <Text style={styles.sectionTitle}>Your Family Matches</Text>
              {searchQuery && (
                <Text style={styles.searchResults}>
                  {filteredMatches.length} of {matches.length} matches
                </Text>
              )}
            </View>
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

      {/* Search Modal */}
      <Modal
        visible={showSearch}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSearch(false)}
      >
        <View style={styles.searchModal}>
          <View style={styles.searchHeader}>
            <Text style={styles.searchTitle}>Search Family Matches</Text>
            <TouchableOpacity
              style={styles.searchCloseButton}
              onPress={() => setShowSearch(false)}
            >
              <Ionicons name="close" size={24} color="#fcd3aa" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContent}>
            {/* Search Input */}
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#9ca3af" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name, location, or relation..."
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={handleSearch}
                autoFocus={true}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => handleSearch('')}>
                  <Ionicons name="close-circle" size={20} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Section */}
            <Text style={styles.filterSectionTitle}>Filters</Text>
            
            {/* Match Score Range */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Match Score</Text>
              <View style={styles.scoreFilterContainer}>
                <Text style={styles.scoreLabel}>{searchFilters.minScore}%</Text>
                <View style={styles.scoreSeparator} />
                <Text style={styles.scoreLabel}>{searchFilters.maxScore}%</Text>
              </View>
            </View>

            {/* Location Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Location</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="Filter by location..."
                placeholderTextColor="#9ca3af"
                value={searchFilters.location}
                onChangeText={(text) => {
                  const newFilters = { ...searchFilters, location: text };
                  setSearchFilters(newFilters);
                  filterMatches(searchQuery, newFilters);
                }}
              />
            </View>

            {/* Relation Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Relation Type</Text>
              <View style={styles.relationFilters}>
                {['all', 'cousin', 'uncle', 'aunt', 'nephew', 'niece', 'distant'].map((relation) => (
                  <TouchableOpacity
                    key={relation}
                    style={[
                      styles.relationFilter,
                      searchFilters.relation === relation && styles.activeRelationFilter
                    ]}
                    onPress={() => {
                      const newFilters = { ...searchFilters, relation };
                      setSearchFilters(newFilters);
                      filterMatches(searchQuery, newFilters);
                    }}
                  >
                    <Text style={[
                      styles.relationFilterText,
                      searchFilters.relation === relation && styles.activeRelationFilterText
                    ]}>
                      {relation === 'all' ? 'All Relations' : relation.charAt(0).toUpperCase() + relation.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Results Count */}
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsText}>
                Showing {filteredMatches.length} of {matches.length} matches
              </Text>
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={() => {
                  setSearchQuery('');
                  setSearchFilters({ minScore: 0, maxScore: 100, location: '', relation: 'all' });
                  setFilteredMatches(matches);
                }}
              >
                <Text style={styles.clearFiltersText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1f2937',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontFamily: getSystemFont('bold'),
    color: '#0091ad',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: getSystemFont('regular'),
    color: '#9ca3af',
    textAlign: 'center',
  },
  processingCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#0091ad',
  },
  processingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  processingText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    marginLeft: 12,
    flex: 1,
  },
  actionContainer: {
    marginBottom: 20,
  },
  processButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  processButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  processButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginBottom: 16,
  },
  matchesContainer: {
    marginBottom: 20,
  },
  matchesList: {
    paddingBottom: 20,
    gap: 8,
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
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 1,
    borderColor: 'rgba(0, 145, 173, 0.2)',
  },
  avatarPlaceholder: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(0, 145, 173, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontFamily: getSystemFont('semiBold'),
    color: '#0091ad',
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
    color: '#0091ad',
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
  matchesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchResults: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: '#fcd3aa',
  },
  // Search Modal Styles
  searchModal: {
    flex: 1,
    backgroundColor: '#000000',
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(252,211,170,0.1)',
  },
  searchTitle: {
    fontSize: 20,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
  },
  searchCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(252,211,170,0.08)',
  },
  searchContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(252,211,170,0.2)',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: '#ffffff',
    marginHorizontal: 12,
  },
  filterSectionTitle: {
    fontSize: 18,
    fontFamily: getSystemFont('bold'),
    color: '#fcd3aa',
    marginBottom: 16,
  },
  filterGroup: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
    marginBottom: 8,
  },
  filterInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  scoreFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  scoreLabel: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
    color: '#0091ad',
  },
  scoreSeparator: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(0,145,173,0.3)',
    marginHorizontal: 16,
    borderRadius: 1,
  },
  relationFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relationFilter: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  activeRelationFilter: {
    backgroundColor: 'rgba(0,145,173,0.2)',
    borderColor: '#0091ad',
  },
  relationFilterText: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: 'rgba(255,255,255,0.7)',
  },
  activeRelationFilterText: {
    color: '#0091ad',
    fontFamily: getSystemFont('semiBold'),
  },
  resultsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  resultsText: {
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
    color: '#ffffff',
  },
  clearFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  clearFiltersText: {
    fontSize: 12,
    fontFamily: getSystemFont('semiBold'),
    color: '#ef4444',
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
    backgroundColor: '#0091ad',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
  },
});

export default FamilyMatchesScreen;