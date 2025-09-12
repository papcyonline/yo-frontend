import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Alert,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import genealogyService from '../../services/genealogyService';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../config/constants';
import { getSystemFont } from '../../config/constants';

const { width, height } = Dimensions.get('window');

interface CollaborativeGenealogyScreenProps {
  navigation: any;
  route: any;
}

interface FamilyMatch {
  _id: string;
  name: string;
  photo?: string;
  familyTree: {
    name: string;
    familySurname?: string;
  };
  canClaim: {
    canClaim: boolean;
    reason?: string;
  };
  userPermissions: {
    canView: boolean;
    canEdit: boolean;
    role: string;
  };
  claimedBy: Array<{
    userId: string;
    relationship: string;
    verificationStatus: string;
  }>;
}

const CollaborativeGenealogyScreen: React.FC<CollaborativeGenealogyScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const { user } = useAuthStore();
  const [matches, setMatches] = useState<FamilyMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'matches' | 'my_trees' | 'claimed'>('matches');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const matchesData = await genealogyService.getMyMatches();
      setMatches(matchesData);
    } catch (error) {
      console.error('Error loading matches:', error);
      Alert.alert('Error', 'Failed to load family matches. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
  };

  const handleClaimMember = async (memberId: string, relationship: string) => {
    try {
      await genealogyService.claimFamilyMember(memberId, relationship);
      Alert.alert(
        'Success!', 
        `You have successfully claimed this family member as your ${relationship}.`,
        [
          {
            text: 'View Family Tree',
            onPress: () => {
              // Navigate to the family tree
              navigation.navigate('FamilyTreeView', { memberId });
            }
          },
          { text: 'OK' }
        ]
      );
      await loadMatches(); // Refresh data
    } catch (error) {
      console.error('Error claiming family member:', error);
      Alert.alert('Error', 'Failed to claim family member. Please try again.');
    }
  };

  const showClaimOptions = (match: FamilyMatch) => {
    if (!match.canClaim.canClaim) {
      Alert.alert('Cannot Claim', `This family member cannot be claimed: ${match.canClaim.reason}`);
      return;
    }

    const relationships = [
      { label: 'This is me', value: 'self' },
      { label: 'My parent', value: 'parent' },
      { label: 'My child', value: 'child' },
      { label: 'My sibling', value: 'sibling' },
      { label: 'My spouse', value: 'spouse' },
      { label: 'My relative', value: 'relative' },
    ];

    Alert.alert(
      'Claim Family Member',
      `How is ${match.name} related to you?`,
      [
        { text: 'Cancel', style: 'cancel' },
        ...relationships.map(rel => ({
          text: rel.label,
          onPress: () => handleClaimMember(match._id, rel.value)
        }))
      ]
    );
  };

  const renderMatch = ({ item: match }: { item: FamilyMatch }) => (
    <View style={styles.matchCard}>
      <View style={styles.matchHeader}>
        <View style={styles.matchInfo}>
          {match.photo ? (
            <Image source={{ uri: match.photo }} style={styles.matchAvatar} />
          ) : (
            <View style={styles.matchAvatarPlaceholder}>
              <Ionicons name="person" size={24} color={COLORS.textSecondary} />
            </View>
          )}
          <View style={styles.matchDetails}>
            <Text style={styles.matchName}>{match.name}</Text>
            <Text style={styles.matchFamily}>
              {match.familyTree.name}
              {match.familyTree.familySurname && ` • ${match.familyTree.familySurname} family`}
            </Text>
          </View>
        </View>
        
        <View style={styles.matchActions}>
          {match.canClaim.canClaim ? (
            <TouchableOpacity
              style={styles.claimButton}
              onPress={() => showClaimOptions(match)}
            >
              <Ionicons name="link" size={16} color={COLORS.text} />
              <Text style={styles.claimButtonText}>Claim</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.claimedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={styles.claimedText}>
                {match.claimedBy.length > 0 ? 'Claimed' : 'Connected'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {match.claimedBy.length > 0 && (
        <View style={styles.claimersSection}>
          <Text style={styles.claimersTitle}>Claimed by:</Text>
          {match.claimedBy.map((claim, index) => (
            <View key={index} style={styles.claimerInfo}>
              <Ionicons 
                name="person-circle" 
                size={16} 
                color={claim.verificationStatus === 'verified' ? COLORS.success : COLORS.warning} 
              />
              <Text style={styles.claimerText}>
                {claim.relationship} 
                {claim.verificationStatus === 'verified' && ' (verified)'}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.matchFooter}>
        <TouchableOpacity
          style={styles.viewTreeButton}
          onPress={() => navigation.navigate('FamilyTreeView', { memberId: match._id })}
        >
          <Text style={styles.viewTreeText}>View Family Tree</Text>
          <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={80} color={COLORS.textSecondary} />
      <Text style={styles.emptyTitle}>No Family Matches Found</Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'matches' 
          ? 'Complete your profile to discover potential family connections'
          : 'Start building your family tree to connect with relatives'
        }
      </Text>
      <TouchableOpacity 
        style={styles.emptyAction}
        onPress={() => navigation.navigate('Profile')}
      >
        <Text style={styles.emptyActionText}>Complete Profile</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, '#04a7c7']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Family Discovery</Text>
            <Text style={styles.headerSubtitle}>Find and connect with your family</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={refreshing}
          >
            <Ionicons 
              name={refreshing ? "hourglass" : "refresh"} 
              size={20} 
              color="#ffffff" 
            />
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'matches' && styles.activeTab]}
            onPress={() => setActiveTab('matches')}
          >
            <Ionicons 
              name="search" 
              size={18} 
              color={activeTab === 'matches' ? COLORS.primary : 'rgba(255,255,255,0.8)'} 
            />
            <Text style={[styles.tabText, activeTab === 'matches' && styles.activeTabText]}>
              Matches
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'my_trees' && styles.activeTab]}
            onPress={() => setActiveTab('my_trees')}
          >
            <Ionicons 
              name="git-network" 
              size={18} 
              color={activeTab === 'my_trees' ? COLORS.primary : 'rgba(255,255,255,0.8)'} 
            />
            <Text style={[styles.tabText, activeTab === 'my_trees' && styles.activeTabText]}>
              My Trees
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'claimed' && styles.activeTab]}
            onPress={() => setActiveTab('claimed')}
          >
            <Ionicons 
              name="link" 
              size={18} 
              color={activeTab === 'claimed' ? COLORS.primary : 'rgba(255,255,255,0.8)'} 
            />
            <Text style={[styles.tabText, activeTab === 'claimed' && styles.activeTabText]}>
              Connected
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Discovering family matches...</Text>
          </View>
        ) : matches.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={matches}
            renderItem={renderMatch}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.matchesList}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        )}
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateFamilyTree')}
      >
        <Ionicons name="add" size={24} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: StatusBar.currentHeight || 40,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#ffffff',
  },
  tabText: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: 'rgba(255, 255, 255, 0.8)',
  },
  activeTabText: {
    color: COLORS.primary,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: getSystemFont('medium'),
    color: COLORS.textSecondary,
  },
  matchesList: {
    padding: 20,
  },
  matchCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  matchInfo: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 12,
  },
  matchAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  matchAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  matchDetails: {
    flex: 1,
  },
  matchName: {
    fontSize: 18,
    fontFamily: getSystemFont('semiBold'),
    color: COLORS.text,
    marginBottom: 4,
  },
  matchFamily: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: COLORS.textSecondary,
  },
  matchActions: {
    alignItems: 'flex-end',
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  claimButtonText: {
    fontSize: 12,
    fontFamily: getSystemFont('semiBold'),
    color: COLORS.text,
  },
  claimedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  claimedText: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: COLORS.success,
  },
  claimersSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  claimersTitle: {
    fontSize: 12,
    fontFamily: getSystemFont('semiBold'),
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  claimerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  claimerText: {
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
    color: COLORS.text,
  },
  matchFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 12,
  },
  viewTreeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  viewTreeText: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
    color: COLORS.primary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: getSystemFont('bold'),
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  emptyAction: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyActionText: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: COLORS.text,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
});

export default CollaborativeGenealogyScreen;