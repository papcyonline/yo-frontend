// src/components/communities/CommunitiesScreen.tsx - Clean Modern Design
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomNavigation } from '../dashboard/BottomNavigation';
import Svg, { Defs, Pattern, Rect, Circle } from 'react-native-svg';
import { getSystemFont } from '../../config/constants';
import { API_CONFIG } from '../../constants/api';
import { useAuthStore } from '../../store/authStore';
import logger from '../../services/LoggingService';

const { width, height } = Dimensions.get('window');

interface Community {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  isJoined: boolean;
  category: string;
  createdBy: string;
  posts: number;
  recentActivity: string;
}

interface CommunitiesProps {
  navigation: any;
  route: any;
}

const CommunitiesScreen: React.FC<CommunitiesProps> = ({ navigation, route }) => {
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState('discover');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState('');
  const [newCommunityDescription, setNewCommunityDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Family');

  // Communities data from API
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  // Load communities from API
  React.useEffect(() => {
    loadCommunities();
  }, []);

  const loadCommunities = async () => {
    try {
      setLoading(true);
      logger.debug('Loading communities from API');
      
      if (!token) {
        logger.warn('No auth token available for loading communities');
        setCommunities([]);
        return;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/communities`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        setCommunities(result.data.communities || []);
        logger.info(`Loaded ${result.data.communities?.length || 0} communities`);
      } else {
        throw new Error(result.message || 'Failed to load communities');
      }
    } catch (error) {
      logger.error('Error loading communities', error);
      setCommunities([]);
      Alert.alert('Error', 'Failed to load communities. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['Family', 'Heritage', 'Location', 'Surname', 'DNA Research', 'General'];

  const handleCreateCommunity = async () => {
    if (!newCommunityName.trim()) {
      Alert.alert('Error', 'Please enter a community name');
      return;
    }

    if (!token) {
      Alert.alert('Error', 'You must be logged in to create a community');
      return;
    }

    try {
      logger.debug('Creating new community:', newCommunityName);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/communities`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCommunityName.trim(),
          description: newCommunityDescription.trim() || 'No description provided',
          category: selectedCategory,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        logger.info('Community created successfully:', result.data.community.id);
        
        // Add the new community to the local state
        const newCommunity: Community = {
          id: result.data.community.id,
          name: result.data.community.name,
          description: result.data.community.description,
          memberCount: 1,
          isJoined: true,
          category: result.data.community.category,
          createdBy: 'You',
          posts: 0,
          recentActivity: 'Just created'
        };

        setCommunities(prev => [newCommunity, ...prev]);
        
        // Reset form
        setNewCommunityName('');
        setNewCommunityDescription('');
        setSelectedCategory('Family');
        setShowCreateModal(false);
        
        Alert.alert(
          'Community Created!',
          `"${newCommunity.name}" has been created successfully. Start inviting members!`,
          [{ text: 'OK' }]
        );
      } else {
        throw new Error(result.message || 'Failed to create community');
      }
    } catch (error) {
      logger.error('Error creating community', error);
      Alert.alert('Error', 'Failed to create community. Please try again later.');
    }
  };

  const handleJoinCommunity = (communityId: string) => {
    setCommunities(prev => 
      prev.map(community => 
        community.id === communityId 
          ? { ...community, isJoined: true, memberCount: community.memberCount + 1 }
          : community
      )
    );
    
    const community = communities.find(c => c.id === communityId);
    Alert.alert('Joined!', `You've joined "${community?.name}"`);
  };

  const handleLeaveCommunity = (communityId: string) => {
    const community = communities.find(c => c.id === communityId);
    
    Alert.alert(
      'Leave Community',
      `Are you sure you want to leave "${community?.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            setCommunities(prev => 
              prev.map(c => 
                c.id === communityId 
                  ? { ...c, isJoined: false, memberCount: Math.max(0, c.memberCount - 1) }
                  : c
              )
            );
          }
        }
      ]
    );
  };

  const handleCommunityPress = (community: Community) => {
    navigation.navigate('CommunityDetail', { community });
  };

  const getFilteredCommunities = () => {
    switch (activeTab) {
      case 'joined':
        return communities.filter(c => c.isJoined);
      case 'discover':
      default:
        return communities;
    }
  };

  // Clean Community Card Component
  const renderCommunityItem = ({ item, index }: { item: Community; index: number }) => (
    <View style={styles.cleanCommunityItem}>
      <TouchableOpacity 
        style={styles.cleanCommunityCard}
        onPress={() => handleCommunityPress(item)}
        activeOpacity={0.95}
      >
        {/* Left Side - Clean Icon */}
        <View style={styles.communityIconSection}>
          <View style={[styles.cleanCommunityIcon, { backgroundColor: index % 2 === 0 ? '#0091ad' : '#04a7c7' }]}>
            <Ionicons name="globe" size={20} color="#ffffff" />
          </View>
        </View>
        
        {/* Center - Information */}
        <View style={styles.communityInfoSection}>
          <View style={styles.communityNameSection}>
            <Text style={styles.cleanCommunityName}>{item.name}</Text>
            <View style={[styles.categoryBadge, { backgroundColor: `${index % 2 === 0 ? '#0091ad' : '#04a7c7'}20` }]}>
              <Text style={[styles.categoryText, { color: index % 2 === 0 ? '#0091ad' : '#04a7c7' }]}>
                {item.category.toUpperCase()}
              </Text>
            </View>
          </View>
          
          <Text style={styles.cleanCommunityDescription} numberOfLines={1}>
            {item.description}
          </Text>
          
          <View style={styles.communityMetaInfo}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="people" size={11} color="#0091ad" />
                <Text style={styles.statText}>{item.memberCount}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="chatbubbles" size={11} color="#04a7c7" />
                <Text style={styles.statText}>{item.posts}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="time" size={11} color="rgba(255, 255, 255, 0.5)" />
                <Text style={styles.statText}>{item.recentActivity}</Text>
              </View>
            </View>
            {item.isJoined && (
              <View style={styles.joinedTag}>
                <Text style={styles.joinedTagText}>JOINED</Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Right Side - Action */}
        <View style={styles.communityActionSection}>
          <TouchableOpacity
            style={[
              styles.cleanJoinButton,
              item.isJoined ? styles.joinedAction : styles.joinAction
            ]}
            onPress={() => item.isJoined ? handleLeaveCommunity(item.id) : handleJoinCommunity(item.id)}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={item.isJoined ? "checkmark" : "add"} 
              size={16} 
              color={item.isJoined ? "#fcd3aa" : "#0091ad"} 
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
      
      {/* Divider */}
      {index < communities.length - 1 && (
        <View style={styles.communityDivider}>
          <LinearGradient
            colors={['transparent', 'rgba(252, 211, 170, 0.25)', 'rgba(0, 145, 173, 0.15)', 'transparent']}
            style={styles.dividerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>
      )}
    </View>
  );

  // Clean Background Pattern
  const renderBackground = () => (
    <View style={styles.backgroundPattern}>
      <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
        <Defs>
          <Pattern
            id="communityDots"
            patternUnits="userSpaceOnUse"
            width="25"
            height="25"
          >
            <Circle
              cx="12.5"
              cy="12.5"
              r="1"
              fill="rgba(252, 211, 170, 0.05)"
            />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#communityDots)" />
      </Svg>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {renderBackground()}

      {/* Clean Header */}
      <View style={styles.cleanHeader}>
        <TouchableOpacity style={styles.cleanBackButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fcd3aa" />
        </TouchableOpacity>
        <Text style={styles.cleanHeaderTitle}>Communities</Text>
        <TouchableOpacity style={styles.cleanCreateButton} onPress={() => setShowCreateModal(true)}>
          <Ionicons name="add" size={24} color="#fcd3aa" />
        </TouchableOpacity>
      </View>

      {/* Clean Tabs */}
      <View style={styles.cleanTabContainer}>
        {[
          { key: 'discover', label: 'Discover', icon: 'compass' },
          { key: 'joined', label: 'My Communities', icon: 'people' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.cleanTab, activeTab === tab.key && styles.activeCleanTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={16} 
              color={activeTab === tab.key ? '#fcd3aa' : 'rgba(255, 255, 255, 0.6)'}
              style={styles.cleanTabIcon}
            />
            <Text style={[
              styles.cleanTabText,
              activeTab === tab.key && styles.activeCleanTabText
            ]}>
              {tab.label}
            </Text>
            {activeTab === tab.key && <View style={styles.cleanTabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Clean Stats */}
      <View style={styles.cleanStatsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.cleanStatNumber}>{communities.filter(c => c.isJoined).length}</Text>
          <Text style={styles.cleanStatLabel}>Joined</Text>
        </View>
        <View style={styles.cleanStatDivider} />
        <View style={styles.statItem}>
          <Text style={styles.cleanStatNumber}>{communities.length}</Text>
          <Text style={styles.cleanStatLabel}>Available</Text>
        </View>
        <View style={styles.cleanStatDivider} />
        <View style={styles.statItem}>
          <Text style={styles.cleanStatNumber}>{communities.reduce((sum, c) => sum + c.memberCount, 0)}</Text>
          <Text style={styles.cleanStatLabel}>Total Members</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.communitiesContainer}>
          {getFilteredCommunities().length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="globe-outline" size={48} color="rgba(252, 211, 170, 0.3)" />
              </View>
              <Text style={styles.emptyTitle}>No Communities Found</Text>
              <Text style={styles.emptyText}>
                {activeTab === 'joined' 
                  ? 'You haven\'t joined any communities yet'
                  : 'No communities match your criteria'
                }
              </Text>
              {activeTab === 'joined' && (
                <TouchableOpacity 
                  style={styles.emptyButton}
                  onPress={() => setActiveTab('discover')}
                >
                  <Text style={styles.emptyButtonText}>Discover Communities</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            getFilteredCommunities().map((item, index) => 
              renderCommunityItem({ item, index })
            )
          )}
        </View>
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Create Community Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowCreateModal(false)}
            >
              <Ionicons name="close" size={24} color="#015b01" />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Create Community</Text>
            
            <TouchableOpacity 
              style={styles.modalCreateButton}
              onPress={handleCreateCommunity}
            >
              <Text style={styles.modalCreateButtonText}>Create</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Community Name *</Text>
              <TextInput
                style={styles.formInput}
                value={newCommunityName}
                onChangeText={setNewCommunityName}
                placeholder="Enter community name"
                placeholderTextColor="#9ca3af"
                maxLength={50}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={newCommunityDescription}
                onChangeText={setNewCommunityDescription}
                placeholder="Describe your community and its purpose"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                maxLength={200}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Category</Text>
              <View style={styles.categoryGrid}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryItem,
                      selectedCategory === category && styles.selectedCategory
                    ]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Text style={[
                      styles.categoryText,
                      selectedCategory === category && styles.selectedCategoryText
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formSection}>
              <View style={styles.privacyInfo}>
                <Ionicons name="information-circle-outline" size={20} color="#6b7280" />
                <Text style={styles.privacyText}>
                  Communities are public by default. All YoFam users can discover and join your community.
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <BottomNavigation
        activeTab="community"
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
  
  // Clean Background Pattern
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  
  // Clean Header
  cleanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(252, 211, 170, 0.1)',
  },
  cleanBackButton: {
    padding: 10,
    borderRadius: 22,
    backgroundColor: 'rgba(252, 211, 170, 0.1)',
  },
  cleanHeaderTitle: {
    fontSize: 24,
    fontFamily: getSystemFont('bold'),
    color: '#fcd3aa',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  cleanCreateButton: {
    padding: 10,
    borderRadius: 22,
    backgroundColor: 'rgba(252, 211, 170, 0.1)',
  },
  
  // Clean Tabs
  cleanTabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(252, 211, 170, 0.1)',
  },
  cleanTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    position: 'relative',
  },
  activeCleanTab: {
    backgroundColor: 'rgba(252, 211, 170, 0.1)',
  },
  cleanTabIcon: {
    marginRight: 6,
  },
  cleanTabText: {
    fontSize: 15,
    fontFamily: getSystemFont('medium'),
    color: 'rgba(255, 255, 255, 0.6)',
  },
  activeCleanTabText: {
    color: '#fcd3aa',
    fontFamily: getSystemFont('bold'),
  },
  cleanTabIndicator: {
    position: 'absolute',
    bottom: 4,
    left: '50%',
    transform: [{ translateX: -12 }],
    width: 24,
    height: 2,
    backgroundColor: '#fcd3aa',
    borderRadius: 1,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
  
  // Clean Stats
  cleanStatsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(252, 211, 170, 0.08)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  cleanStatNumber: {
    fontSize: 24,
    fontFamily: getSystemFont('bold'),
    color: '#fcd3aa',
    marginBottom: 4,
  },
  cleanStatLabel: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  cleanStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(252, 211, 170, 0.15)',
    marginHorizontal: 16,
  },
  
  scrollContent: {
    paddingBottom: 20,
  },
  
  communitiesContainer: {
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  
  // ===== CLEAN COMMUNITY CARD STYLES =====
  
  cleanCommunityItem: {
    backgroundColor: 'transparent',
  },
  
  cleanCommunityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  
  // Icon Section
  communityIconSection: {
    marginRight: 16,
  },
  
  cleanCommunityIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#0091ad',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  
  // Information Section
  communityInfoSection: {
    flex: 1,
    paddingRight: 10,
  },
  
  communityNameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  
  cleanCommunityName: {
    fontSize: 16,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    flex: 1,
  },
  
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  
  categoryText: {
    fontSize: 9,
    fontFamily: getSystemFont('bold'),
    letterSpacing: 0.5,
  },
  
  cleanCommunityDescription: {
    fontSize: 13,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 17,
    marginBottom: 6,
  },
  
  communityMetaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  
  statItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  
  statText: {
    fontSize: 11,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255, 255, 255, 0.5)',
  },
  
  joinedTag: {
    backgroundColor: 'rgba(252, 211, 170, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  
  joinedTagText: {
    fontSize: 9,
    fontFamily: getSystemFont('bold'),
    color: '#fcd3aa',
    letterSpacing: 0.5,
  },
  
  // Action Section
  communityActionSection: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
  },
  
  cleanJoinButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  
  joinAction: {
    backgroundColor: 'rgba(0, 145, 173, 0.1)',
    borderColor: 'rgba(0, 145, 173, 0.2)',
  },
  
  joinedAction: {
    backgroundColor: 'rgba(252, 211, 170, 0.1)',
    borderColor: 'rgba(252, 211, 170, 0.2)',
  },
  
  // Community Dividers
  communityDivider: {
    height: 2,
    marginHorizontal: 12,
    marginLeft: 68, // Align with content
    marginVertical: 2,
  },
  
  dividerGradient: {
    flex: 1,
    height: '100%',
    borderRadius: 1,
  },
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(252, 211, 170, 0.05)',
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
  emptyText: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#0091ad',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  emptyButtonText: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
  },
  
  bottomSpacing: {
    height: 100,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(252, 211, 170, 0.1)',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(252, 211, 170, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: getSystemFont('bold'),
    color: '#fcd3aa',
  },
  modalCreateButton: {
    backgroundColor: '#0091ad',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  modalCreateButtonText: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#000000',
  },
  formSection: {
    marginTop: 24,
  },
  formLabel: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#fcd3aa',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: 'rgba(252, 211, 170, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: '#ffffff',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  formTextArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryItem: {
    borderWidth: 1,
    borderColor: 'rgba(252, 211, 170, 0.2)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  selectedCategory: {
    borderColor: '#0091ad',
    backgroundColor: 'rgba(0, 145, 173, 0.1)',
  },
  categoryButtonText: {
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
    color: 'rgba(255, 255, 255, 0.7)',
  },
  selectedCategoryText: {
    color: '#0091ad',
    fontFamily: getSystemFont('semiBold'),
  },
  privacyInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(252, 211, 170, 0.05)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  privacyText: {
    flex: 1,
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
  },
});

export default CommunitiesScreen;