// src/screens/CommunityPage.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Pattern, Rect, Circle } from 'react-native-svg';
import { BottomNavigation } from '../../components/dashboard/BottomNavigation';
import { getSystemFont } from '../../config/constants';
import { useUnreadChats } from '../../hooks/useUnreadChats';

interface CommunityPageProps {
  navigation: any;
  route: any;
}

// Community Card Component
const CommunityCard: React.FC<{
  community: any;
  onPress: () => void;
  showJoinedBadge?: boolean;
  index: number;
}> = ({ community, onPress, showJoinedBadge = false, index }) => (
  <TouchableOpacity style={styles.communityCard} onPress={onPress} activeOpacity={0.9}>
    <LinearGradient
      colors={['#1a1a1a', '#0f0f0f']}
      style={styles.communityGradient}
    >
      <View style={styles.communityHeader}>
        <LinearGradient
          colors={index % 3 === 0 ? ['#0091ad', '#04a7c7'] : index % 3 === 1 ? ['#04a7c7', '#fcd3aa'] : ['#fcd3aa', '#0091ad']}
          style={styles.communityIcon}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="people" size={20} color="#ffffff" />
        </LinearGradient>
        {community.isPopular && (
          <View style={styles.popularBadge}>
            <LinearGradient
              colors={['#fcd3aa', '#0091ad']}
              style={styles.popularBadgeGradient}
            >
              <Ionicons name="trending-up" size={10} color="#ffffff" />
              <Text style={styles.popularText}>HOT</Text>
            </LinearGradient>
          </View>
        )}
      </View>

      <View style={styles.communityContent}>
        <Text style={styles.communityName} numberOfLines={1}>
          {community.name}
        </Text>
        
        <View style={styles.memberRow}>
          <Ionicons name="people-outline" size={12} color="#04a7c7" />
          <Text style={styles.memberCount} numberOfLines={1}>
            {community.memberCount.toLocaleString()} members
          </Text>
        </View>

        <Text style={styles.communityDescription} numberOfLines={2}>
          {community.description}
        </Text>

        <View style={styles.communityFooter}>
          <View style={[styles.categoryTag, { backgroundColor: '#0091ad30' }]}>
            <Text style={styles.categoryText}>{community.category}</Text>
          </View>
          {!showJoinedBadge && (
            <TouchableOpacity style={styles.joinButton}>
              <LinearGradient
                colors={['#0091ad', '#04a7c7']}
                style={styles.joinButtonGradient}
              >
                <Text style={styles.joinButtonText}>Join</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </LinearGradient>
  </TouchableOpacity>
);

// My Communities Tab
const MyCommunities: React.FC<{
  communities: any[];
  onCommunityPress: (community: any) => void;
}> = ({ communities, onCommunityPress }) => {
  if (communities.length === 0) {
    return (
      <View style={styles.emptyState}>
        <LinearGradient
          colors={['#0091ad30', '#04a7c730']}
          style={styles.emptyIcon}
        >
          <Ionicons name="people-outline" size={48} color="#fcd3aa" />
        </LinearGradient>
        <Text style={styles.emptyTitle}>No Communities Yet</Text>
        <Text style={styles.emptyDescription}>
          You haven't joined any communities yet. Discover communities that match your interests!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      <View style={styles.communitiesGrid}>
        {communities.map((community, index) => (
          <CommunityCard
            key={community.id}
            community={community}
            onPress={() => onCommunityPress(community)}
            showJoinedBadge={true}
            index={index}
          />
        ))}
      </View>
    </View>
  );
};

// Discover Communities Tab
const DiscoverCommunities: React.FC<{
  communities: any[];
  onCommunityPress: (community: any) => void;
}> = ({ communities, onCommunityPress }) => (
  <View style={styles.tabContent}>
    <View style={styles.aiMatchHeader}>
      <View style={[styles.aiIconContainer, { backgroundColor: '#fcd3aa30' }]}>
        <Ionicons name="sparkles" size={20} color="#fcd3aa" />
      </View>
      <Text style={styles.aiMatchText}>AI Potential Communities</Text>
    </View>
    <View style={styles.communitiesGrid}>
      {communities.map((community, index) => (
        <CommunityCard
          key={community.id}
          community={community}
          onPress={() => onCommunityPress(community)}
          index={index}
        />
      ))}
    </View>
  </View>
);

// Create Community Tab
const CreateCommunity: React.FC<{ navigation: any; user: any }> = ({ navigation, user }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');

  const categories = ['General', 'Family', 'Culture', 'Research', 'Food', 'Heritage', 'Business'];

  const handleCreate = () => {
    // Handle community creation logic here
    console.log('Creating community:', { name, description, category });
  };

  return (
    <ScrollView style={styles.createForm}>
      <View style={styles.createHeader}>
        <LinearGradient
          colors={['#0091ad30', '#04a7c730']}
          style={styles.createIconContainer}
        >
          <Ionicons name="add-circle" size={32} color="#fcd3aa" />
        </LinearGradient>
        <Text style={styles.createTitle}>Create New Community</Text>
        <Text style={styles.createSubtitle}>Start building your own community space</Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Community Name</Text>
        <TextInput
          style={styles.formInput}
          value={name}
          onChangeText={setName}
          placeholder="Enter community name"
          placeholderTextColor="#666666"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Description</Text>
        <TextInput
          style={[styles.formInput, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe your community..."
          placeholderTextColor="#666666"
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Category</Text>
        <View style={styles.categoryGrid}>
          {categories.map((cat, index) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryOption, category === cat && styles.selectedCategory]}
              onPress={() => setCategory(cat)}
            >
              {category === cat ? (
                <LinearGradient
                  colors={['#0091ad', '#04a7c7']}
                  style={styles.selectedCategoryGradient}
                >
                  <Text style={styles.selectedCategoryText}>{cat}</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.categoryOptionText}>{cat}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
        <LinearGradient
          colors={['#0091ad', '#04a7c7', '#fcd3aa']}
          style={styles.createButtonGradient}
        >
          <Text style={styles.createButtonText}>Create Community</Text>
          <Ionicons name="add-circle" size={20} color="#ffffff" />
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
};

// Main Component
const CommunityPage: React.FC<CommunityPageProps> = ({ navigation, route }) => {
  const { user } = route.params || {};
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [activeBottomTab, setActiveBottomTab] = useState('community');
  const { unreadCount } = useUnreadChats();

  const tabs = ['My', 'Discover', 'Create'];

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleCommunityPress = (community: any) => {
    navigation.navigate('CommunityDetailScreen', { 
      match: {
        id: community.id,
        name: community.name,
        relation: `${community.memberCount.toLocaleString()} members`,
        bio: community.description,
        location: community.category,
        type: 'community',
        isPopular: community.isPopular,
        recentActivity: community.recentActivity
      },
      user 
    });
  };

  const handleBottomTabPress = (tabId: string) => {
    setActiveBottomTab(tabId);
    switch (tabId) {
      case 'family': navigation.navigate('FamilyPage', { user }); break;
      case 'friends': navigation.navigate('FriendsPage', { user }); break;
      case 'community': break;
      case 'chats': navigation.navigate('ChatsPage', { user }); break;
      case 'settings': navigation.navigate('SettingsPage', { user }); break;
      default: navigation.navigate('Dashboard', { user }); break;
    }
  };

  // Mock data
  const allCommunities = [
    {
      id: '1', name: 'UAE Expat Families', description: 'Connect with expatriate families living in the UAE.',
      memberCount: 2847, category: 'Family', isPopular: true, recentActivity: '23 new posts today', isJoined: true,
    },
    {
      id: '2', name: 'Dubai Heritage Society', description: 'Preserving and celebrating the rich cultural heritage of Dubai.',
      memberCount: 1205, category: 'Culture', isPopular: false, recentActivity: '8 new posts today', isJoined: false,
    },
    {
      id: '3', name: 'Middle Eastern Genealogy', description: 'Research your Middle Eastern roots with fellow enthusiasts.',
      memberCount: 892, category: 'Research', isPopular: true, recentActivity: '15 new posts today', isJoined: true,
    },
    {
      id: '4', name: 'Palestinian Heritage Hub', description: 'Connect with Palestinians worldwide.',
      memberCount: 756, category: 'Heritage', isPopular: false, recentActivity: '9 new posts today', isJoined: true,
    }
  ];

  const joinedCommunities = allCommunities.filter(c => c.isJoined);
  const discoverCommunities = allCommunities.filter(c => !c.isJoined);

  const renderBackground = () => (
    <View style={styles.backgroundPattern}>
      <LinearGradient
        colors={['#0091ad08', '#04a7c708', '#fcd3aa08']}
        style={styles.bgGradient1}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <LinearGradient
        colors={['#fcd3aa05', '#0091ad05']}
        style={styles.bgGradient2}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
        <Defs>
          <Pattern
            id="communityDots"
            patternUnits="userSpaceOnUse"
            width="30"
            height="30"
          >
            <Circle
              cx="15"
              cy="15"
              r="1"
              fill="rgba(252, 211, 170, 0.08)"
            />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#communityDots)" />
      </Svg>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return <MyCommunities communities={joinedCommunities} onCommunityPress={handleCommunityPress} />;
      case 1:
        return <DiscoverCommunities communities={discoverCommunities} onCommunityPress={handleCommunityPress} />;
      case 2:
        return <CreateCommunity navigation={navigation} user={user} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderBackground()}
      
      {/* Header */}
      <LinearGradient
        colors={['#0091ad', '#04a7c7', '#fcd3aa']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Communities</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options" size={24} color="#ffffff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === index && styles.activeTab]}
            onPress={() => setActiveTab(index)}
          >
            <Text style={[styles.tabText, activeTab === index && styles.activeTabText]}>
              {tab}
            </Text>
            {activeTab === index && <View style={styles.tabIndicator} />}
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
            onRefresh={onRefresh}
            colors={['#0091ad']}
            tintColor="#0091ad"
            progressBackgroundColor="#000000"
          />
        }
      >
        {renderTabContent()}
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
    top: 180,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  bgGradient2: {
    position: 'absolute',
    bottom: 180,
    left: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
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
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  filterButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  
  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
    zIndex: 1,
    borderWidth: 1,
    borderColor: '#333333',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    position: 'relative',
  },
  activeTab: {
    backgroundColor: '#0091ad',
  },
  tabText: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
    color: '#cccccc',
  },
  activeTabText: {
    color: '#ffffff',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 2,
    left: '50%',
    transform: [{ translateX: -10 }],
    width: 20,
    height: 2,
    backgroundColor: '#fcd3aa',
    borderRadius: 1,
  },
  
  // Content
  content: {
    flex: 1,
    zIndex: 1,
  },
  tabContent: {
    padding: 16,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // AI Match Header
  aiMatchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  aiIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  aiMatchText: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#fcd3aa',
  },
  
  // Communities Grid
  communitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  
  // Community Cards
  communityCard: {
    width: '48%',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  communityGradient: {
    padding: 16,
    minHeight: 200,
  },
  communityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  communityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  communityContent: {
    flex: 1,
  },
  communityName: {
    fontSize: 16,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginBottom: 6,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  popularBadge: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  popularBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  popularText: {
    fontSize: 8,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginLeft: 2,
  },
  memberCount: {
    fontSize: 12,
    fontFamily: getSystemFont('regular'),
    color: '#cccccc',
    marginLeft: 4,
    flex: 1,
  },
  categoryTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 9,
    fontFamily: getSystemFont('bold'),
    color: '#0091ad',
  },
  communityDescription: {
    fontSize: 11,
    fontFamily: getSystemFont('regular'),
    color: '#b3b3b3',
    lineHeight: 15,
    marginBottom: 12,
    flex: 1,
  },
  communityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  activityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentActivity: {
    fontSize: 12,
    fontFamily: getSystemFont('regular'),
    color: '#999999',
    marginLeft: 6,
  },
  joinButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  joinButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  joinButtonText: {
    fontSize: 11,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
  },
  
  // Create Form
  createForm: {
    padding: 16,
  },
  createHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  createIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  createTitle: {
    fontSize: 24,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginBottom: 8,
  },
  createSubtitle: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: '#cccccc',
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#fcd3aa',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#333333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333333',
    overflow: 'hidden',
  },
  selectedCategory: {
    borderColor: '#0091ad',
  },
  selectedCategoryGradient: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryOptionText: {
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
    color: '#cccccc',
  },
  selectedCategoryText: {
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
    color: '#ffffff',
  },
  createButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 16,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
  },
  bottomSpacing: {
    height: 100,
  },
});

export default CommunityPage;