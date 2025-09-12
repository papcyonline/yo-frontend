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
  ActivityIndicator,
  Image,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
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
  avatar?: string;
  coverImage?: string;
  recentMembers?: {
    id: string;
    name: string;
    avatar?: string;
    initials: string;
    role: 'member' | 'admin' | 'creator';
    joinedAt: string;
  }[];
  isCreatedByUser?: boolean;
  isTrending?: boolean;
  userRole?: 'member' | 'admin' | 'creator';
  admins?: string[];
  members?: {
    id: string;
    name: string;
    avatar?: string;
    initials: string;
    role: 'member' | 'admin' | 'creator';
    joinedAt: string;
  }[];
}

interface CommunitiesProps {
  navigation: any;
  route: any;
}

const CommunitiesScreen: React.FC<CommunitiesProps> = ({ navigation, route }) => {
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState('joined');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState('');
  const [newCommunityDescription, setNewCommunityDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Family');
  const [isPrivate, setIsPrivate] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'name' | 'members' | 'activity'>('members');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [joiningCommunityId, setJoiningCommunityId] = useState<string | null>(null);
  const [leavingCommunityId, setLeavingCommunityId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
    visible: boolean;
  }>({ message: '', type: 'success', visible: false });
  const [refreshing, setRefreshing] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedCommunityForAdmin, setSelectedCommunityForAdmin] = useState<Community | null>(null);
  const [managingMemberId, setManagingMemberId] = useState<string | null>(null);
  const [showImageManagement, setShowImageManagement] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<'avatar' | 'cover' | null>(null);
  const [selectedCommunityForImage, setSelectedCommunityForImage] = useState<Community | null>(null);

  // Communities data from API
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  // Load communities from API
  React.useEffect(() => {
    loadCommunities();
  }, []);

  // Toast helper function
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  // Pull to refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadCommunities();
      showToast('Communities updated', 'success');
    } catch (error) {
      showToast('Failed to refresh communities', 'error');
    } finally {
      setRefreshing(false);
    }
  };

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
        const apiCommunities = result.data.communities || [];
        setCommunities(apiCommunities);
        logger.info(`Loaded ${apiCommunities.length} communities`);
      } else {
        throw new Error(result.message || 'Failed to load communities');
      }
    } catch (error) {
      logger.error('Error loading communities', error);
      setCommunities([]);
      showToast('Failed to load communities. Please check your connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'Family', name: 'Family', icon: 'people' as keyof typeof Ionicons.glyphMap, color: '#22c55e' },
    { id: 'Heritage', name: 'Heritage', icon: 'bookmark' as keyof typeof Ionicons.glyphMap, color: '#ef4444' },
    { id: 'Location', name: 'Location', icon: 'location' as keyof typeof Ionicons.glyphMap, color: '#8b5cf6' },
    { id: 'Surname', name: 'Surname', icon: 'library' as keyof typeof Ionicons.glyphMap, color: '#06b6d4' },
    { id: 'DNA Research', name: 'DNA Research', icon: 'analytics' as keyof typeof Ionicons.glyphMap, color: '#f59e0b' },
    { id: 'General', name: 'General', icon: 'chatbubbles' as keyof typeof Ionicons.glyphMap, color: '#6366f1' },
  ];

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
          isPrivate: isPrivate,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        logger.info('Community created successfully:', result.data.community.id);
        
        // Add the new community to the local state using backend response
        const newCommunity: Community = {
          id: result.data.community.id,
          name: result.data.community.name,
          description: result.data.community.description,
          memberCount: result.data.community.memberCount || 1,
          isJoined: result.data.community.isJoined,
          category: result.data.community.category,
          createdBy: result.data.community.createdBy,
          posts: result.data.community.posts || 0,
          recentActivity: result.data.community.recentActivity,
          userRole: result.data.community.userRole,
          isCreatedByUser: result.data.community.isCreatedByUser
        };

        setCommunities(prev => [newCommunity, ...prev]);
        
        // Reset form
        setNewCommunityName('');
        setNewCommunityDescription('');
        setSelectedCategory('Family');
        setIsPrivate(false);
        setShowCategoryDropdown(false);
        setShowCreateModal(false);
        
        showToast(`"${newCommunity.name}" created successfully!`, 'success');
      } else {
        throw new Error(result.message || 'Failed to create community');
      }
    } catch (error) {
      logger.error('Error creating community', error);
      showToast('Failed to create community. Please try again later.', 'error');
    }
  };

  const handleJoinCommunity = async (communityId: string) => {
    if (!token) {
      showToast('You must be logged in to join a community', 'error');
      return;
    }

    setJoiningCommunityId(communityId);
    
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/communities/${communityId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join community');
      }

      const result = await response.json();
      if (result.success) {
        setCommunities(prev => 
          prev.map(community => 
            community.id === communityId 
              ? { ...community, isJoined: true, memberCount: community.memberCount + 1 }
              : community
          )
        );
        
        const community = communities.find(c => c.id === communityId);
        showToast(`Joined "${community?.name}"!`, 'success');
      } else {
        throw new Error(result.error || 'Failed to join community');
      }
    } catch (error: any) {
      logger.error('Error joining community:', error);
      showToast(error.message || 'Failed to join community. Please try again.', 'error');
    } finally {
      setJoiningCommunityId(null);
    }
  };

  const handleLeaveCommunity = (communityId: string) => {
    const community = communities.find(c => c.id === communityId);
    
    // Prevent creators from leaving their own community
    if (community?.userRole === 'creator') {
      Alert.alert(
        'Cannot Leave Community',
        'As the creator, you cannot leave this community. You can delete it instead if needed.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }
    
    Alert.alert(
      'Leave Community',
      `Are you sure you want to leave "${community?.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            if (!token) {
              showToast('You must be logged in to leave a community', 'error');
              return;
            }

            setLeavingCommunityId(communityId);
            
            try {
              const response = await fetch(`${API_CONFIG.BASE_URL}/communities/${communityId}/leave`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to leave community');
              }

              const result = await response.json();
              if (result.success) {
                setCommunities(prev => 
                  prev.map(c => 
                    c.id === communityId 
                      ? { ...c, isJoined: false, memberCount: Math.max(0, c.memberCount - 1) }
                      : c
                  )
                );
                
                showToast(`Left "${community?.name}"`, 'success');
              } else {
                throw new Error(result.error || 'Failed to leave community');
              }
            } catch (error: any) {
              logger.error('Error leaving community:', error);
              showToast(error.message || 'Failed to leave community. Please try again.', 'error');
            } finally {
              setLeavingCommunityId(null);
            }
          }
        }
      ]
    );
  };

  const handleCommunityPress = (community: Community) => {
    navigation.navigate('CommunityDetail', { community });
  };

  const handleCommunityAdminMenu = (community: Community) => {
    const isCreator = community.userRole === 'creator' || community.isCreatedByUser;
    const isAdmin = community.userRole === 'admin' || isCreator;
    
    // Debug logging
    console.log('Community admin menu debug:', {
      name: community.name,
      userRole: community.userRole,
      isCreatedByUser: community.isCreatedByUser,
      isCreator,
      isAdmin
    });
    
    const options = [
      {
        text: 'Manage Members',
        onPress: () => handleManageMembers(community),
      },
      {
        text: 'Edit Community',
        onPress: () => handleEditCommunity(community),
      },
    ];

    if (isCreator) {
      options.push({
        text: 'Community Settings',
        onPress: () => handleCommunitySettings(community),
      });
      options.push({
        text: 'Delete Community',
        onPress: () => handleDeleteCommunity(community),
      });
    }

    options.push({
      text: 'Cancel',
      onPress: () => {},
    });

    Alert.alert(
      isCreator ? 'Manage Community' : 'Admin Options',
      `What would you like to do with "${community.name}"?`,
      options
    );
  };

  const handleEditCommunity = (community: Community) => {
    // Pre-populate the create modal with existing data
    setNewCommunityName(community.name);
    setNewCommunityDescription(community.description);
    setSelectedCategory(community.category);
    setIsPrivate(false); // Assume public for now
    setShowCreateModal(true);
  };

  const handleManageMembers = (community: Community) => {
    setSelectedCommunityForAdmin(community);
    setShowMembersModal(true);
  };

  const handleCommunitySettings = (community: Community) => {
    setSelectedCommunityForImage(community);
    setShowImageManagement(true);
  };

  // Image Management Functions
  const handleImagePicker = async (type: 'avatar' | 'cover') => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please allow photo library access to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'avatar' ? [1, 1] : [2, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingImage(type);
        
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const imageUri = result.assets[0].uri;
        
        // Update community with new image
        setCommunities(prev => prev.map(c => {
          if (c.id === selectedCommunityForImage?.id) {
            return {
              ...c,
              [type === 'avatar' ? 'avatar' : 'coverImage']: imageUri
            };
          }
          return c;
        }));
        
        setUploadingImage(null);
        showToast(`Community ${type} updated successfully!`, 'success');
      }
    } catch (error) {
      setUploadingImage(null);
      showToast(`Failed to update community ${type}`, 'error');
    }
  };

  const handleRemoveImage = (type: 'avatar' | 'cover') => {
    Alert.alert(
      `Remove ${type === 'avatar' ? 'Profile Picture' : 'Cover Image'}`,
      `Are you sure you want to remove the community ${type === 'avatar' ? 'profile picture' : 'cover image'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setCommunities(prev => prev.map(c => {
              if (c.id === selectedCommunityForImage?.id) {
                return {
                  ...c,
                  [type === 'avatar' ? 'avatar' : 'coverImage']: undefined
                };
              }
              return c;
            }));
            showToast(`Community ${type} removed successfully!`, 'success');
          }
        }
      ]
    );
  };

  const handlePromoteToAdmin = async (community: Community, memberId: string) => {
    setManagingMemberId(memberId);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCommunities(prev => prev.map(c => {
        if (c.id === community.id && c.members) {
          return {
            ...c,
            members: c.members.map(m => 
              m.id === memberId ? { ...m, role: 'admin' as const } : m
            )
          };
        }
        return c;
      }));
      
      const memberName = community.members?.find(m => m.id === memberId)?.name || 'Member';
      showToast(`${memberName} promoted to admin`, 'success');
    } catch (error) {
      showToast('Failed to promote member', 'error');
    } finally {
      setManagingMemberId(null);
    }
  };

  const handleRemoveFromCommunity = async (community: Community, memberId: string) => {
    setManagingMemberId(memberId);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCommunities(prev => prev.map(c => {
        if (c.id === community.id && c.members) {
          return {
            ...c,
            members: c.members.filter(m => m.id !== memberId),
            memberCount: Math.max(0, c.memberCount - 1)
          };
        }
        return c;
      }));
      
      const memberName = community.members?.find(m => m.id === memberId)?.name || 'Member';
      showToast(`${memberName} removed from community`, 'success');
    } catch (error) {
      showToast('Failed to remove member', 'error');
    } finally {
      setManagingMemberId(null);
    }
  };

  const handleRemoveAdmin = async (community: Community, memberId: string) => {
    setManagingMemberId(memberId);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCommunities(prev => prev.map(c => {
        if (c.id === community.id && c.members) {
          return {
            ...c,
            members: c.members.map(m => 
              m.id === memberId ? { ...m, role: 'member' as const } : m
            )
          };
        }
        return c;
      }));
      
      const memberName = community.members?.find(m => m.id === memberId)?.name || 'Member';
      showToast(`${memberName} removed from admin role`, 'success');
    } catch (error) {
      showToast('Failed to remove admin', 'error');
    } finally {
      setManagingMemberId(null);
    }
  };

  const handleDeleteCommunity = (community: Community) => {
    Alert.alert(
      'Delete Community',
      `Are you sure you want to delete "${community.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!token) {
              showToast('You must be logged in to delete a community', 'error');
              return;
            }

            try {
              const response = await fetch(`${API_CONFIG.BASE_URL}/communities/${community.id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete community');
              }

              const result = await response.json();
              if (result.success) {
                setCommunities(prev => prev.filter(c => c.id !== community.id));
                showToast(`"${community.name}" deleted successfully`, 'success');
              } else {
                throw new Error(result.error || 'Failed to delete community');
              }
            } catch (error: any) {
              logger.error('Error deleting community:', error);
              showToast(error.message || 'Failed to delete community. Please try again.', 'error');
            }
          }
        }
      ]
    );
  };

  const getFilteredCommunities = () => {
    let filtered = communities;
    
    // Filter by tab
    if (activeTab === 'joined') {
      filtered = filtered.filter(c => c.isJoined);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.category.toLowerCase().includes(query)
      );
    }
    
    // Filter by category
    if (selectedCategoryFilter !== 'All') {
      filtered = filtered.filter(c => c.category === selectedCategoryFilter);
    }
    
    // Sort communities
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'members':
          return b.memberCount - a.memberCount;
        case 'activity':
          return new Date(b.recentActivity || 0).getTime() - new Date(a.recentActivity || 0).getTime();
        default:
          return 0;
      }
    });
    
    return filtered;
  };

  // Aligned List Community Component
  const renderCommunityItem = ({ item, index }: { item: Community; index: number }) => (
    <View style={styles.alignedCommunityItem}>
      <TouchableOpacity 
        style={styles.alignedCommunityContainer}
        onPress={() => handleCommunityPress(item)}
        activeOpacity={0.95}
      >
        {/* Community Icon - Fixed Width */}
        <View style={styles.alignedIconSection}>
          <View style={styles.alignedCommunityIcon}>
            {item.avatar ? (
              <Image source={{ uri: item.avatar }} style={styles.alignedAvatarImage} />
            ) : (
              <LinearGradient
                colors={index % 2 === 0 ? ['#0091ad', '#04a7c7'] : ['#04a7c7', '#fcd3aa']}
                style={styles.alignedIconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="globe" size={18} color="#ffffff" />
              </LinearGradient>
            )}
          </View>
        </View>
        
        {/* Center Content - Flexible */}
        <View style={styles.alignedContentSection}>
          {/* Name Row with Category */}
          <View style={styles.alignedNameRow}>
            <Text style={styles.alignedCommunityName} numberOfLines={1}>{item.name}</Text>
            {item.isCreatedByUser && (
              <Ionicons name="star" size={10} color="#10b981" style={styles.creatorStar} />
            )}
            <View style={[styles.alignedCategoryBadge, { backgroundColor: `${index % 2 === 0 ? '#0091ad' : '#04a7c7'}20` }]}>
              <Text style={[styles.alignedCategoryText, { color: index % 2 === 0 ? '#0091ad' : '#04a7c7' }]}>
                {item.category.toUpperCase()}
              </Text>
            </View>
          </View>
          
          {/* Description */}
          <Text style={styles.alignedDescription} numberOfLines={1}>
            {item.description}
          </Text>
          
          {/* Stats Row */}
          <View style={styles.alignedStatsRow}>
            <View style={styles.alignedStatItem}>
              <Ionicons name="people" size={11} color="#0091ad" />
              <Text style={styles.alignedStatText}>{item.memberCount} members</Text>
            </View>
            <View style={styles.alignedStatDivider} />
            <View style={styles.alignedStatItem}>
              <Ionicons name="chatbubbles" size={11} color="#04a7c7" />
              <Text style={styles.alignedStatText}>{item.posts} posts</Text>
            </View>
            {item.isJoined && (
              <>
                <View style={styles.alignedStatDivider} />
                <View style={styles.alignedJoinedBadge}>
                  <Text style={styles.alignedJoinedText}>JOINED</Text>
                </View>
              </>
            )}
          </View>
        </View>
        
        {/* Action Button - Fixed Width */}
        <View style={styles.alignedActionSection}>
          {(item.userRole === 'creator' || item.userRole === 'admin') ? (
            <TouchableOpacity
              style={styles.alignedAdminButton}
              onPress={() => handleCommunityAdminMenu(item)}
              activeOpacity={0.8}
            >
              <Ionicons name="ellipsis-horizontal" size={16} color="#10b981" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.alignedJoinButton,
                item.isJoined ? styles.alignedJoinedButton : styles.alignedNotJoinedButton,
                (joiningCommunityId === item.id || leavingCommunityId === item.id) && styles.loadingAction
              ]}
              onPress={() => item.isJoined ? handleLeaveCommunity(item.id) : handleJoinCommunity(item.id)}
              activeOpacity={0.8}
              disabled={joiningCommunityId === item.id || leavingCommunityId === item.id}
            >
              {(joiningCommunityId === item.id || leavingCommunityId === item.id) ? (
                <ActivityIndicator 
                  size="small" 
                  color={item.isJoined ? "#fcd3aa" : "#0091ad"} 
                />
              ) : (
                <Ionicons 
                  name={item.isJoined ? "checkmark" : "add"} 
                  size={16} 
                  color={item.isJoined ? "#fcd3aa" : "#0091ad"} 
                />
              )}
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
      
      {/* Gradient Divider */}
      {index < communities.length - 1 && (
        <View style={styles.alignedDividerContainer}>
          <LinearGradient
            colors={['transparent', 'rgba(252, 211, 170, 0.25)', 'rgba(0, 145, 173, 0.15)', 'transparent']}
            style={styles.alignedDividerGradient}
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

      {/* Ultra Compact Tabs */}
      <View style={styles.ultraCompactTabContainer}>
        {[
          { key: 'joined', label: 'My Communities', icon: 'home' as keyof typeof Ionicons.glyphMap },
          { key: 'discover', label: 'Discover', icon: 'compass' as keyof typeof Ionicons.glyphMap }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.ultraCompactTab, activeTab === tab.key && styles.activeUltraCompactTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons 
              name={tab.icon as keyof typeof Ionicons.glyphMap} 
              size={16} 
              color={activeTab === tab.key ? '#000000' : 'rgba(255, 255, 255, 0.7)'}
            />
            <Text style={[
              styles.ultraCompactTabText,
              activeTab === tab.key && styles.activeUltraCompactTabText
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Mini Search - Only show for Discover tab and when needed */}
      {activeTab === 'discover' && (
        <View style={styles.miniSearchContainer}>
          <View style={styles.miniSearchBar}>
            <Ionicons name="search" size={14} color="#0091ad" />
            <TextInput
              style={styles.miniSearchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close" size={14} color="rgba(255, 255, 255, 0.4)" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Minimal Stats - Ultra compact info */}
      <View style={styles.miniStatsContainer}>
        <Text style={styles.miniStatsText}>
          {activeTab === 'joined' 
            ? `${communities.filter(c => c.isJoined).length} joined`
            : `${communities.length} available`
          }
        </Text>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0091ad']}
            tintColor="#0091ad"
            progressBackgroundColor="#1a1a1a"
            title="Pull to refresh"
            titleColor="#fcd3aa"
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0091ad" />
            <Text style={styles.loadingText}>Loading communities...</Text>
          </View>
        ) : (
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
                    : searchQuery.trim() || selectedCategoryFilter !== 'All'
                    ? 'No communities match your search criteria'
                    : 'No communities available'
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
                {(searchQuery.trim() || selectedCategoryFilter !== 'All') && (
                  <TouchableOpacity 
                    style={styles.emptyButton}
                    onPress={() => {
                      setSearchQuery('');
                      setSelectedCategoryFilter('All');
                    }}
                  >
                    <Text style={styles.emptyButtonText}>Clear Filters</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              getFilteredCommunities().map((item, index) => (
                <View key={item.id}>
                  {renderCommunityItem({ item, index })}
                </View>
              ))
            )}
          </View>
        )}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Create Community Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
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
              <TouchableOpacity
                style={styles.categoryDropdown}
                onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
              >
                <View style={styles.dropdownContent}>
                  <View style={styles.categoryIconContainer}>
                    <Ionicons
                      name={categories.find(c => c.id === selectedCategory)?.icon || 'chatbubbles'}
                      size={18}
                      color={categories.find(c => c.id === selectedCategory)?.color || '#6366f1'}
                    />
                  </View>
                  <Text style={styles.dropdownText}>
                    {categories.find(c => c.id === selectedCategory)?.name || 'Family'}
                  </Text>
                  <Ionicons
                    name={showCategoryDropdown ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#fcd3aa"
                  />
                </View>
              </TouchableOpacity>
              
              {showCategoryDropdown && (
                <View style={styles.dropdownOptions}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.dropdownOption, selectedCategory === cat.id && styles.selectedDropdownOption]}
                      onPress={() => {
                        setSelectedCategory(cat.id);
                        setShowCategoryDropdown(false);
                      }}
                    >
                      <View style={styles.categoryIconContainer}>
                        <Ionicons name={cat.icon as keyof typeof Ionicons.glyphMap} size={16} color={cat.color} />
                      </View>
                      <Text style={[styles.dropdownOptionText, selectedCategory === cat.id && styles.selectedDropdownOptionText]}>
                        {cat.name}
                      </Text>
                      {selectedCategory === cat.id && (
                        <Ionicons name="checkmark" size={16} color="#0091ad" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Privacy</Text>
              <View style={styles.privacyContainer}>
                <TouchableOpacity
                  style={[styles.privacyOption, !isPrivate && styles.selectedPrivacyOption]}
                  onPress={() => setIsPrivate(false)}
                >
                  <View style={styles.privacyIconContainer}>
                    <Ionicons name="globe-outline" size={18} color={!isPrivate ? '#22c55e' : '#666666'} />
                  </View>
                  <View style={styles.privacyTextContainer}>
                    <Text style={[styles.privacyOptionTitle, !isPrivate && styles.selectedPrivacyTitle]}>
                      Public
                    </Text>
                    <Text style={styles.privacyOptionDescription}>
                      Anyone can find and join this community
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.privacyOption, isPrivate && styles.selectedPrivacyOption]}
                  onPress={() => setIsPrivate(true)}
                >
                  <View style={styles.privacyIconContainer}>
                    <Ionicons name="lock-closed-outline" size={18} color={isPrivate ? '#f59e0b' : '#666666'} />
                  </View>
                  <View style={styles.privacyTextContainer}>
                    <Text style={[styles.privacyOptionTitle, isPrivate && styles.selectedPrivacyTitle]}>
                      Private
                    </Text>
                    <Text style={styles.privacyOptionDescription}>
                      Only invited members can join
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Members Management Modal */}
      <Modal
        visible={showMembersModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowMembersModal(false)}
            >
              <Ionicons name="close" size={24} color="#fcd3aa" />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>
              Manage Members - {selectedCommunityForAdmin?.name}
            </Text>
            
            <View style={styles.modalHeaderRight}>
              <Text style={styles.memberCountText}>
                {selectedCommunityForAdmin?.memberCount || 0} members
              </Text>
            </View>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedCommunityForAdmin?.members?.map((member, index) => (
              <View key={member.id} style={styles.memberItem}>
                <View style={styles.memberInfo}>
                  <View style={styles.memberAvatar}>
                    {member.avatar ? (
                      <Image source={{ uri: member.avatar }} style={styles.avatarImage} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarInitials}>{member.initials}</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.memberDetails}>
                    <View style={styles.memberNameRow}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      <View style={[
                        styles.roleTag, 
                        member.role === 'creator' ? styles.creatorRoleTag :
                        member.role === 'admin' ? styles.adminRoleTag : styles.memberRoleTag
                      ]}>
                        <Text style={[
                          styles.roleTagText,
                          member.role === 'creator' ? styles.creatorRoleText :
                          member.role === 'admin' ? styles.adminRoleText : styles.memberRoleText
                        ]}>
                          {member.role.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.memberJoinDate}>
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                {selectedCommunityForAdmin?.userRole === 'creator' && member.role !== 'creator' && (
                  <View style={styles.memberActions}>
                    {managingMemberId === member.id ? (
                      <ActivityIndicator size="small" color="#0091ad" />
                    ) : (
                      <>
                        {member.role === 'admin' ? (
                          <TouchableOpacity
                            style={[styles.memberActionButton, styles.removeAdminButton]}
                            onPress={() => handleRemoveAdmin(selectedCommunityForAdmin, member.id)}
                          >
                            <Ionicons name="remove-circle" size={16} color="#f59e0b" />
                            <Text style={styles.removeAdminText}>Remove Admin</Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            style={[styles.memberActionButton, styles.promoteButton]}
                            onPress={() => handlePromoteToAdmin(selectedCommunityForAdmin, member.id)}
                          >
                            <Ionicons name="arrow-up-circle" size={16} color="#10b981" />
                            <Text style={styles.promoteText}>Make Admin</Text>
                          </TouchableOpacity>
                        )}
                        
                        <TouchableOpacity
                          style={[styles.memberActionButton, styles.removeButton]}
                          onPress={() => {
                            Alert.alert(
                              'Remove Member',
                              `Are you sure you want to remove ${member.name} from this community?`,
                              [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                  text: 'Remove',
                                  style: 'destructive',
                                  onPress: () => handleRemoveFromCommunity(selectedCommunityForAdmin, member.id)
                                }
                              ]
                            );
                          }}
                        >
                          <Ionicons name="trash" size={16} color="#ef4444" />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                )}
              </View>
            ))}
            <View style={styles.bottomSpacing} />
          </ScrollView>
        </View>
      </Modal>

      {/* Image Management Modal */}
      <Modal
        visible={showImageManagement}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => {
                setShowImageManagement(false);
                setSelectedCommunityForImage(null);
              }}
            >
              <Ionicons name="close" size={24} color="#fcd3aa" />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>
              Manage Images - {selectedCommunityForImage?.name}
            </Text>
            
            <View style={styles.modalHeaderRight} />
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Cover Image Section */}
            <View style={styles.imageManagementSection}>
              <Text style={styles.imageManagementLabel}>Cover Image</Text>
              <Text style={styles.imageManagementDescription}>
                Add a cover image to make your community stand out. Recommended size: 800x400px
              </Text>
              
              <View style={styles.imagePreviewContainer}>
                {selectedCommunityForImage?.coverImage ? (
                  <View style={styles.coverImagePreview}>
                    <Image 
                      source={{ uri: selectedCommunityForImage.coverImage }} 
                      style={styles.coverImagePreviewImage}
                      resizeMode="cover"
                    />
                    <View style={styles.imageOverlay}>
                      <TouchableOpacity
                        style={styles.changeImageButton}
                        onPress={() => handleImagePicker('cover')}
                        disabled={uploadingImage === 'cover'}
                      >
                        {uploadingImage === 'cover' ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <Ionicons name="camera" size={20} color="#ffffff" />
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => handleRemoveImage('cover')}
                        disabled={uploadingImage === 'cover'}
                      >
                        <Ionicons name="trash" size={20} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.addImagePlaceholder}
                    onPress={() => handleImagePicker('cover')}
                    disabled={uploadingImage === 'cover'}
                  >
                    {uploadingImage === 'cover' ? (
                      <ActivityIndicator size="large" color="#0091ad" />
                    ) : (
                      <>
                        <Ionicons name="image" size={48} color="rgba(252, 211, 170, 0.3)" />
                        <Text style={styles.addImageText}>Add Cover Image</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Avatar Image Section */}
            <View style={styles.imageManagementSection}>
              <Text style={styles.imageManagementLabel}>Profile Picture</Text>
              <Text style={styles.imageManagementDescription}>
                Upload a profile picture for your community. Recommended size: 200x200px
              </Text>
              
              <View style={styles.avatarPreviewContainer}>
                {selectedCommunityForImage?.avatar ? (
                  <View style={styles.avatarImagePreview}>
                    <Image 
                      source={{ uri: selectedCommunityForImage.avatar }} 
                      style={styles.avatarImagePreviewImage}
                    />
                    <View style={styles.avatarImageOverlay}>
                      <TouchableOpacity
                        style={styles.changeAvatarButton}
                        onPress={() => handleImagePicker('avatar')}
                        disabled={uploadingImage === 'avatar'}
                      >
                        {uploadingImage === 'avatar' ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <Ionicons name="camera" size={16} color="#ffffff" />
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeAvatarButton}
                        onPress={() => handleRemoveImage('avatar')}
                        disabled={uploadingImage === 'avatar'}
                      >
                        <Ionicons name="trash" size={16} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.addAvatarPlaceholder}
                    onPress={() => handleImagePicker('avatar')}
                    disabled={uploadingImage === 'avatar'}
                  >
                    {uploadingImage === 'avatar' ? (
                      <ActivityIndicator size="small" color="#0091ad" />
                    ) : (
                      <>
                        <Ionicons name="person" size={32} color="rgba(252, 211, 170, 0.3)" />
                        <Text style={styles.addAvatarText}>Add Profile Picture</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.imageManagementTips}>
              <Text style={styles.tipsTitle}>Image Tips</Text>
              <Text style={styles.tipText}>• Use high-quality images for best results</Text>
              <Text style={styles.tipText}>• Cover images work best with landscape orientation</Text>
              <Text style={styles.tipText}>• Profile pictures should be square or circular</Text>
              <Text style={styles.tipText}>• Keep file sizes under 5MB for faster loading</Text>
            </View>

            <View style={styles.bottomSpacing} />
          </ScrollView>
        </View>
      </Modal>

      {/* Toast Notification */}
      {toast.visible && (
        <View style={[styles.toast, toast.type === 'success' ? styles.successToast : styles.errorToast]}>
          <Ionicons 
            name={toast.type === 'success' ? "checkmark-circle" : "alert-circle"} 
            size={20} 
            color="#ffffff" 
          />
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}

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
    paddingBottom: 16,
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

  // Ultra Compact Tab Styles
  ultraCompactTabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 2,
  },
  ultraCompactTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
  },
  activeUltraCompactTab: {
    backgroundColor: '#fcd3aa',
  },
  ultraCompactTabText: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 4,
  },
  activeUltraCompactTabText: {
    color: '#000000',
  },

  // Mini Search Styles
  miniSearchContainer: {
    marginHorizontal: 20,
    marginBottom: 8,
  },
  miniSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  miniSearchInput: {
    flex: 1,
    fontSize: 12,
    fontFamily: getSystemFont('regular'),
    color: '#ffffff',
  },

  // Mini Stats Styles
  miniStatsContainer: {
    marginHorizontal: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
  miniStatsText: {
    fontSize: 11,
    fontFamily: getSystemFont('medium'),
    color: 'rgba(255, 255, 255, 0.5)',
  },
  content: {
    flex: 1,
    zIndex: 1,
    marginTop: -4, // Reduce gap between stats and content
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
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  
  // ===== ALIGNED LIST STYLES =====
  
  alignedCommunityItem: {
    backgroundColor: 'transparent',
  },
  
  alignedCommunityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  
  // Icon Section - Fixed 48px width
  alignedIconSection: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  alignedCommunityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#0091ad',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  
  alignedAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },

  alignedIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Content Section - Flexible
  alignedContentSection: {
    flex: 1,
    paddingLeft: 12,
    paddingRight: 12,
  },
  
  alignedNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  
  alignedCommunityName: {
    fontSize: 16,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginRight: 6,
  },
  
  creatorStar: {
    marginRight: 8,
  },
  
  alignedCategoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 'auto',
  },
  
  alignedCategoryText: {
    fontSize: 9,
    fontFamily: getSystemFont('bold'),
    letterSpacing: 0.5,
  },
  
  alignedDescription: {
    fontSize: 13,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 17,
    marginBottom: 6,
  },
  
  // Stats Row
  alignedStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  alignedStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  
  alignedStatText: {
    fontSize: 11,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255, 255, 255, 0.5)',
  },
  
  alignedStatDivider: {
    width: 1,
    height: 10,
    backgroundColor: 'rgba(252, 211, 170, 0.2)',
    marginHorizontal: 8,
  },
  
  alignedJoinedBadge: {
    backgroundColor: 'rgba(252, 211, 170, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  
  alignedJoinedText: {
    fontSize: 9,
    fontFamily: getSystemFont('bold'),
    color: '#fcd3aa',
    letterSpacing: 0.5,
  },
  
  // Action Section - Fixed 48px width
  alignedActionSection: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  alignedJoinButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  
  alignedNotJoinedButton: {
    backgroundColor: 'rgba(0, 145, 173, 0.1)',
    borderColor: 'rgba(0, 145, 173, 0.2)',
  },
  
  alignedJoinedButton: {
    backgroundColor: 'rgba(252, 211, 170, 0.1)',
    borderColor: 'rgba(252, 211, 170, 0.2)',
  },
  
  alignedAdminButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  
  loadingAction: {
    opacity: 0.7,
  },
  
  // Gradient Dividers
  alignedDividerContainer: {
    height: 2,
    marginHorizontal: 16,
    marginLeft: 64, // Align with content after icon
    marginVertical: 2,
  },
  
  alignedDividerGradient: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: getSystemFont('medium'),
    color: 'rgba(255, 255, 255, 0.7)',
  },
  
  bottomSpacing: {
    height: 100,
  },

  // Search and Filter Styles
  searchFilterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(252, 211, 170, 0.1)',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(252, 211, 170, 0.1)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: '#ffffff',
  },
  clearSearchButton: {
    padding: 4,
  },
  filterSortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryFilters: {
    flex: 1,
    marginRight: 12,
  },
  categoryFiltersContent: {
    paddingRight: 8,
  },
  categoryFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(252, 211, 170, 0.1)',
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: 'rgba(0, 145, 173, 0.2)',
    borderColor: '#0091ad',
  },
  categoryFilterText: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: 'rgba(255, 255, 255, 0.7)',
  },
  activeFilterText: {
    color: '#0091ad',
    fontFamily: getSystemFont('semiBold'),
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(252, 211, 170, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(252, 211, 170, 0.2)',
    gap: 4,
  },
  sortButtonText: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: '#fcd3aa',
  },
  sortDropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: -20,
    right: -20,
    bottom: -200,
    zIndex: 999,
  },
  sortDropdown: {
    position: 'absolute',
    top: 75,
    right: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(252, 211, 170, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
    minWidth: 150,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(252, 211, 170, 0.1)',
    gap: 12,
  },
  activeSortOption: {
    backgroundColor: 'rgba(0, 145, 173, 0.1)',
  },
  sortOptionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
    color: 'rgba(255, 255, 255, 0.7)',
  },
  activeSortOptionText: {
    color: '#ffffff',
    fontFamily: getSystemFont('semiBold'),
  },

  // Member Avatars
  recentMembersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  memberAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#000000',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0091ad',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 8,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
  },
  moreMembers: {
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreMembersText: {
    fontSize: 6,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
  },

  // Tags Container
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  trendingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  trendingTagText: {
    fontSize: 8,
    fontFamily: getSystemFont('bold'),
    color: '#f59e0b',
    letterSpacing: 0.5,
  },
  creatorTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  creatorTagText: {
    fontSize: 8,
    fontFamily: getSystemFont('bold'),
    color: '#10b981',
    letterSpacing: 0.5,
  },

  // Toast Notification Styles
  toast: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
    gap: 12,
  },
  successToast: {
    backgroundColor: '#10b981',
  },
  errorToast: {
    backgroundColor: '#ef4444',
  },
  toastText: {
    flex: 1,
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
    color: '#ffffff',
  },

  // Members Management Modal Styles
  modalHeaderRight: {
    width: 80,
    alignItems: 'flex-end',
  },
  memberCountText: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: 'rgba(252, 211, 170, 0.7)',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(252, 211, 170, 0.1)',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberDetails: {
    flex: 1,
    marginLeft: 12,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  memberName: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
    marginRight: 8,
  },
  roleTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  creatorRoleTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  adminRoleTag: {
    backgroundColor: 'rgba(0, 145, 173, 0.2)',
  },
  memberRoleTag: {
    backgroundColor: 'rgba(107, 114, 128, 0.2)',
  },
  roleTagText: {
    fontSize: 8,
    fontFamily: getSystemFont('bold'),
    letterSpacing: 0.5,
  },
  creatorRoleText: {
    color: '#10b981',
  },
  adminRoleText: {
    color: '#0091ad',
  },
  memberRoleText: {
    color: '#6b7280',
  },
  memberJoinDate: {
    fontSize: 12,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255, 255, 255, 0.6)',
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  promoteButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  promoteText: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: '#10b981',
  },
  removeAdminButton: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  removeAdminText: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: '#f59e0b',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
  // Category Dropdown
  categoryDropdown: {
    borderWidth: 1,
    borderColor: 'rgba(252, 211, 170, 0.2)',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    fontFamily: getSystemFont('medium'),
    color: '#ffffff',
  },
  dropdownOptions: {
    borderWidth: 1,
    borderColor: 'rgba(252, 211, 170, 0.2)',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginTop: 8,
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(252, 211, 170, 0.1)',
  },
  selectedDropdownOption: {
    backgroundColor: 'rgba(0, 145, 173, 0.1)',
  },
  dropdownOptionText: {
    flex: 1,
    fontSize: 16,
    fontFamily: getSystemFont('medium'),
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 12,
  },
  selectedDropdownOptionText: {
    color: '#ffffff',
  },
  
  // Privacy Options
  privacyContainer: {
    gap: 12,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(252, 211, 170, 0.2)',
    borderRadius: 12,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  selectedPrivacyOption: {
    borderColor: '#0091ad',
    backgroundColor: 'rgba(0, 145, 173, 0.1)',
  },
  privacyIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 16,
  },
  privacyTextContainer: {
    flex: 1,
  },
  privacyOptionTitle: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  selectedPrivacyTitle: {
    color: '#ffffff',
  },
  privacyOptionDescription: {
    fontSize: 13,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: 18,
  },

  // Image Management Styles
  imageManagementSection: {
    marginTop: 24,
    marginBottom: 20,
  },
  imageManagementLabel: {
    fontSize: 18,
    fontFamily: getSystemFont('bold'),
    color: '#fcd3aa',
    marginBottom: 8,
  },
  imageManagementDescription: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 16,
    lineHeight: 20,
  },
  imagePreviewContainer: {
    marginBottom: 16,
  },
  coverImagePreview: {
    position: 'relative',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  coverImagePreviewImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  changeImageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImagePlaceholder: {
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(252, 211, 170, 0.2)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    fontSize: 16,
    fontFamily: getSystemFont('medium'),
    color: 'rgba(252, 211, 170, 0.7)',
    marginTop: 12,
  },
  avatarPreviewContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarImagePreview: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  avatarImagePreviewImage: {
    width: '100%',
    height: '100%',
  },
  avatarImageOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    gap: 6,
  },
  changeAvatarButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeAvatarButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addAvatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(252, 211, 170, 0.2)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addAvatarText: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: 'rgba(252, 211, 170, 0.7)',
    marginTop: 8,
    textAlign: 'center',
  },
  imageManagementTips: {
    marginTop: 32,
    padding: 20,
    backgroundColor: 'rgba(0, 145, 173, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 145, 173, 0.1)',
  },
  tipsTitle: {
    fontSize: 16,
    fontFamily: getSystemFont('bold'),
    color: '#0091ad',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 6,
    lineHeight: 20,
  },
});

export default CommunitiesScreen;