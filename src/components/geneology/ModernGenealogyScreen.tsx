import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Alert,
  ActivityIndicator,
  Image,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import genealogyService from '../../services/genealogyService';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../config/constants';
import { getSystemFont } from '../../config/constants';

const { width, height } = Dimensions.get('window');

interface ModernGenealogyScreenProps {
  navigation: any;
  route: any;
}

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  onPress: () => void;
}

interface RecentActivity {
  id: string;
  type: 'match_found' | 'member_added' | 'tree_shared' | 'claim_verified';
  title: string;
  subtitle: string;
  time: string;
  icon: string;
}

const ModernGenealogyScreen: React.FC<ModernGenealogyScreenProps> = ({ navigation, route }) => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<any[]>([]);
  const [recentActivity] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'match_found',
      title: '3 new family matches found',
      subtitle: 'AI discovered potential relatives',
      time: '2 hours ago',
      icon: 'people'
    },
    {
      id: '2',
      type: 'member_added',
      title: 'John Smith added to tree',
      subtitle: 'Added by Sarah Johnson',
      time: '1 day ago',
      icon: 'person-add'
    }
  ]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const matchesData = await genealogyService.getMyMatches();
      setMatches(matchesData.slice(0, 5)); // Show only first 5 for dashboard
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: 'discover',
      title: 'Discover Family',
      subtitle: 'Find potential matches',
      icon: 'search',
      color: COLORS.primary,
      onPress: () => navigation.navigate('CollaborativeGenealogy')
    },
    {
      id: 'create_tree',
      title: 'Create Tree',
      subtitle: 'Start your family tree',
      icon: 'git-network',
      color: COLORS.success,
      onPress: () => navigation.navigate('CreateFamilyTree')
    },
    {
      id: 'add_member',
      title: 'Add Member',
      subtitle: 'Expand your family',
      icon: 'person-add',
      color: COLORS.secondary,
      onPress: () => navigation.navigate('AddFamilyMember')
    },
    {
      id: 'ai_research',
      title: 'AI Research',
      subtitle: 'Let AI find connections',
      icon: 'sparkles',
      color: '#FF6B35',
      onPress: async () => {
        try {
          Alert.alert('AI Research', 'Starting AI research to find your family connections...', [
            { text: 'Cancel' },
            { 
              text: 'Start Research', 
              onPress: async () => {
                try {
                  const results = await genealogyService.runAIResearch();
                  Alert.alert(
                    'AI Research Complete!', 
                    `Found ${results.matchesFound} potential family connections!\n\n` +
                    `• High confidence: ${results.highConfidenceMatches}\n` +
                    `• Medium confidence: ${results.mediumConfidenceMatches}`,
                    [
                      { 
                        text: 'View Matches', 
                        onPress: () => navigation.navigate('CollaborativeGenealogy')
                      },
                      { text: 'OK' }
                    ]
                  );
                  await loadDashboardData(); // Refresh data
                } catch (error) {
                  Alert.alert('Error', 'Failed to run AI research. Please try again.');
                }
              }
            }
          ]);
        } catch (error) {
          Alert.alert('Error', 'Failed to start AI research.');
        }
      }
    },
  ];

  const renderQuickAction = (action: QuickAction) => (
    <TouchableOpacity
      key={action.id}
      style={styles.quickActionCard}
      onPress={action.onPress}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}20` }]}>
        <Ionicons name={action.icon as any} size={24} color={action.color} />
      </View>
      <Text style={styles.quickActionTitle}>{action.title}</Text>
      <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
    </TouchableOpacity>
  );

  const renderMatch = ({ item: match }: { item: any }) => (
    <TouchableOpacity
      style={styles.matchCard}
      onPress={() => navigation.navigate('FamilyTreeView', { memberId: match._id })}
    >
      <View style={styles.matchContent}>
        {match.photo ? (
          <Image source={{ uri: match.photo }} style={styles.matchAvatar} />
        ) : (
          <View style={styles.matchAvatarPlaceholder}>
            <Ionicons name="person" size={20} color={COLORS.textSecondary} />
          </View>
        )}
        
        <View style={styles.matchInfo}>
          <Text style={styles.matchName}>{match.name}</Text>
          <Text style={styles.matchFamily}>
            {match.familyTree?.name || 'Family Tree'}
          </Text>
        </View>
        
        <View style={styles.matchAction}>
          <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderActivity = (activity: RecentActivity) => (
    <View key={activity.id} style={styles.activityItem}>
      <View style={[styles.activityIcon, { backgroundColor: `${COLORS.primary}20` }]}>
        <Ionicons name={activity.icon as any} size={16} color={COLORS.primary} />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle}>{activity.title}</Text>
        <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
        <Text style={styles.activityTime}>{activity.time}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <LinearGradient colors={[COLORS.primary, '#04a7c7']} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>Family Heritage</Text>
              <Text style={styles.headerSubtitle}>Loading your family connections...</Text>
            </View>
          </View>
        </LinearGradient>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Setting up your family discovery...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Header */}
      <LinearGradient colors={[COLORS.primary, '#04a7c7']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Family Heritage</Text>
            <Text style={styles.headerSubtitle}>
              Discover and connect with your family
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications" size={20} color="#ffffff" />
            {matches.length > 0 && <View style={styles.notificationBadge} />}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome to Family Discovery</Text>
          <Text style={styles.welcomeSubtitle}>
            Our AI-powered system helps you find and connect with family members from around the world. 
            Start by creating your family tree or discovering existing connections.
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map(renderQuickAction)}
          </View>
        </View>

        {/* Family Matches */}
        {matches.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Potential Family Matches</Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('CollaborativeGenealogy')}
              >
                <Text style={styles.sectionAction}>View All ({matches.length})</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={matches.slice(0, 3)}
              renderItem={renderMatch}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            {recentActivity.map(renderActivity)}
          </View>
        </View>

        {/* Call to Action */}
        <View style={styles.ctaSection}>
          <LinearGradient
            colors={[`${COLORS.primary}20`, `${COLORS.secondary}20`]}
            style={styles.ctaCard}
          >
            <Ionicons name="sparkles" size={40} color={COLORS.primary} />
            <Text style={styles.ctaTitle}>Unlock Your Family History</Text>
            <Text style={styles.ctaSubtitle}>
              Let our AI research your family background and find connections you never knew existed.
            </Text>
            <TouchableOpacity 
              style={styles.ctaButton}
              onPress={async () => {
                try {
                  const results = await genealogyService.runAIResearch();
                  Alert.alert(
                    'AI Research Complete!', 
                    `Found ${results.matchesFound} potential family connections!`,
                    [
                      { 
                        text: 'View Matches', 
                        onPress: () => navigation.navigate('CollaborativeGenealogy')
                      },
                      { text: 'OK' }
                    ]
                  );
                  await loadDashboardData();
                } catch (error) {
                  Alert.alert('Error', 'Failed to run AI research. Please try again.');
                }
              }}
            >
              <Text style={styles.ctaButtonText}>Start AI Research</Text>
              <Ionicons name="arrow-forward" size={16} color="#ffffff" />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CollaborativeGenealogy')}
      >
        <Ionicons name="people" size={24} color="#ffffff" />
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
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
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
    fontSize: 24,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4444',
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
  welcomeSection: {
    padding: 20,
    backgroundColor: COLORS.surface,
    margin: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  welcomeTitle: {
    fontSize: 20,
    fontFamily: getSystemFont('bold'),
    color: COLORS.text,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: getSystemFont('bold'),
    color: COLORS.text,
    marginBottom: 16,
  },
  sectionAction: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
    color: COLORS.primary,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: (width - 52) / 2, // Account for padding and gap
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 12,
    fontFamily: getSystemFont('regular'),
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  matchCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  matchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  matchAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  matchAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  matchInfo: {
    flex: 1,
  },
  matchName: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: COLORS.text,
    marginBottom: 2,
  },
  matchFamily: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: COLORS.textSecondary,
  },
  matchAction: {
    padding: 4,
  },
  activityList: {
    gap: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
    color: COLORS.text,
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 12,
    fontFamily: getSystemFont('regular'),
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 11,
    fontFamily: getSystemFont('regular'),
    color: COLORS.textSecondary,
    opacity: 0.8,
  },
  ctaSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  ctaCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 20,
    fontFamily: getSystemFont('bold'),
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  ctaSubtitle: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  ctaButtonText: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
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

export default ModernGenealogyScreen;