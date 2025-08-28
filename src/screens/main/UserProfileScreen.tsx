import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
  Animated,
  Easing,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Pattern, Rect, Circle } from 'react-native-svg';
import { useAuthStore } from '../../store/authStore';
import { API_CONFIG } from '../../constants/api';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

interface User {
  id: string;
  email: string;
  phone: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  fullName?: string;
  name?: string;
  profileCompleted?: boolean;
  profile_completed?: boolean;
  dateOfBirth?: string;
  date_of_birth?: string;
  placeOfBirth?: string;
  place_of_birth?: string;
  currentAddress?: string;
  current_address?: string;
  location?: string;
  fatherName?: string;
  father_name?: string;
  motherName?: string;
  mother_name?: string;
  siblings?: string;
  bio?: string;
  familyOriginStories?: string;
  family_origin_stories?: string;
  grandfatherStories?: string;
  grandfather_stories?: string;
  uncleStories?: string;
  uncle_stories?: string;
  familyTraditions?: string;
  family_traditions?: string;
  primarySchool?: string;
  primary_school?: string;
  highSchool?: string;
  high_school?: string;
  university?: string;
  closeSchoolFriends?: string;
  close_school_friends?: string;
  hobbies?: string;
  profession?: string;
  languages?: string;
  religiousBackground?: string;
  religious_background?: string;
  childhoodMemories?: string;
  childhood_memories?: string;
  kindergartenMemories?: string;
  kindergarten_memories?: string;
}

interface UserProfileProps {
  navigation: any;
  route: any;
}

const UserProfileScreen: React.FC<UserProfileProps> = ({ navigation, route }) => {
  const { user: initialUser, isOwnProfile = false } = route.params || {};
  const { user: authUser, token } = useAuthStore();
  const { theme, isDark } = useTheme();
  
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');
  const [headerAnim] = useState(new Animated.Value(0));
  const [contentAnim] = useState(new Animated.Value(0));
  const [editButtonScale] = useState(new Animated.Value(1));
  const [questionnaireResponses, setQuestionnaireResponses] = useState({});
  const [loadingResponses, setLoadingResponses] = useState(false);

  // Fetch fresh profile data
  const fetchProfileData = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userId = isOwnProfile ? authUser?.id : user?.id;
      
      if (!userId) {
        setLoading(false);
        return;
      }

      // For own profile, use the main profile endpoint that includes all fields
      const endpoint = isOwnProfile 
        ? `${API_CONFIG.BASE_URL}/users/profile`
        : `${API_CONFIG.BASE_URL}/users/profile/${userId}`;
        
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success && data.data) {
        setUser(data.data.user);
      } else {
        console.log('Profile fetch response:', data);
        // Use initial user data if API fails
        setUser(initialUser || authUser);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      // Use initial user data if API fails
      setUser(initialUser || authUser);
    } finally {
      setLoading(false);
    }
  };

  // Fetch AI questionnaire responses
  const fetchQuestionnaireResponses = async () => {
    if (!token || !isOwnProfile) {
      return; // Only fetch for own profile
    }

    try {
      setLoadingResponses(true);
      console.log('📋 Fetching AI questionnaire responses...');
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/users/progressive/answers`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('✅ AI responses fetched:', Object.keys(data.data.answers).length, 'responses');
        setQuestionnaireResponses(data.data.answers);
      } else {
        console.log('⚠️ Failed to fetch AI responses:', data.message);
        setQuestionnaireResponses({});
      }
    } catch (error) {
      console.error('❌ Error fetching AI responses:', error);
      setQuestionnaireResponses({});
    } finally {
      setLoadingResponses(false);
    }
  };

  useEffect(() => {
    // Fetch profile data first
    fetchProfileData();
    
    // Fetch questionnaire responses if this is own profile
    if (isOwnProfile) {
      fetchQuestionnaireResponses();
    }

    // Animations
    Animated.parallel([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.bezier(0.25, 0.46, 0.45, 0.94)),
        useNativeDriver: true,
      }),
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 800,
        delay: 200,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      })
    ]).start();

    // Pulse animation for edit button
    if (isOwnProfile) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(editButtonScale, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(editButtonScale, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          })
        ])
      ).start();
    }
  }, []);

  const getFirstName = () => {
    const fullName = user?.fullName || user?.name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim();
    if (fullName && fullName !== 'User' && fullName.trim()) {
      return fullName.split(' ')[0];
    }
    return user?.username || user?.first_name || 'User';
  };

  const getUserAvatar = () => {
    // Check all possible avatar field names from the API response
    if (user?.profile_photo_url) return user.profile_photo_url;
    if (user?.profile_picture_url) return user.profile_picture_url;
    if (user?.profilePhotoUrl) return user.profilePhotoUrl;
    if (user?.profilePictureUrl) return user.profilePictureUrl;
    if (user?.avatarUrl) return user.avatarUrl;
    if (user?.avatar_url) return user.avatar_url;
    if (user?.profileImage) return user.profileImage;
    return null;
  };

  const getCompletionPercentage = () => {
    if (!user) return 0;
    
    let completed = 0;
    const fields = [
      // Basic info (from registration)
      user.fullName && user.fullName !== 'User',
      user.email,
      user.phone,
      user.dateOfBirth,
      user.currentAddress,
      
      // Family info
      user.fatherName,
      user.motherName,
      user.siblings,
      
      // Personal details
      user.bio,
      user.profession,
      user.hobbies,
      user.languages,
      user.religiousBackground,
      
      // Stories & heritage (progressive profile fields)
      user.familyOriginStories,
      user.grandfatherStories,
      user.uncleStories,
      user.familyTraditions,
      
      // Education
      user.primarySchool,
      user.highSchool,
      user.university,
      user.closeSchoolFriends,
    ];
    
    fields.forEach(field => {
      if (field && field !== 'Not provided' && field !== '') completed += 1;
    });
    
    return Math.round((completed / fields.length) * 100);
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile', { user });
  };

  const profileSections = [
    {
      title: 'Basic Information',
      icon: 'person-outline',
      color: '#0091ad',
      items: [
        { label: 'Full Name', value: user?.fullName || user?.name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Not provided', icon: 'person' },
        { label: 'Username', value: user?.username || 'Not provided', icon: 'at' },
        { label: 'Email', value: user?.email || 'Not provided', icon: 'mail' },
        { label: 'Phone', value: user?.phone || 'Not provided', icon: 'call' },
        { label: 'Date of Birth', value: user?.dateOfBirth || user?.date_of_birth || 'Not provided', icon: 'calendar' },
        { label: 'Place of Birth', value: user?.placeOfBirth || user?.place_of_birth || 'Not provided', icon: 'location' },
        { label: 'Current Address', value: user?.currentAddress || user?.current_address || user?.location || 'Not provided', icon: 'home' },
      ]
    },
    {
      title: 'Family Information',
      icon: 'people-outline',
      color: '#04a7c7',
      items: [
        { label: 'Father\'s Name', value: user?.fatherName || user?.father_name || 'Not provided', icon: 'man' },
        { label: 'Mother\'s Name', value: user?.motherName || user?.mother_name || 'Not provided', icon: 'woman' },
        { label: 'Siblings', value: user?.siblings || 'Not provided', icon: 'people' },
      ]
    },
    {
      title: 'Personal Details',
      icon: 'heart-outline',
      color: '#fcd3aa',
      items: [
        { label: 'Bio', value: user?.bio || 'Not provided', icon: 'document-text', multiline: true },
        { label: 'Profession', value: user?.profession || 'Not provided', icon: 'briefcase' },
        { label: 'Hobbies', value: user?.hobbies || 'Not provided', icon: 'heart' },
        { label: 'Languages', value: user?.languages || 'Not provided', icon: 'language' },
        { label: 'Religious Background', value: user?.religiousBackground || user?.religious_background || 'Not provided', icon: 'book' },
      ]
    },
    {
      title: 'Family Stories & Heritage',
      icon: 'library-outline',
      color: '#0091ad',
      items: [
        { label: 'Family Origin Stories', value: user?.familyOriginStories || user?.family_origin_stories || 'Not provided', icon: 'library', multiline: true },
        { label: 'Grandfather\'s Stories', value: user?.grandfatherStories || user?.grandfather_stories || 'Not provided', icon: 'time', multiline: true },
        { label: 'Uncle\'s Stories', value: user?.uncleStories || user?.uncle_stories || 'Not provided', icon: 'chatbubbles', multiline: true },
        { label: 'Family Traditions', value: user?.familyTraditions || user?.family_traditions || 'Not provided', icon: 'star', multiline: true },
      ]
    },
    {
      title: 'Education',
      icon: 'school-outline',
      color: '#04a7c7',
      items: [
        { label: 'Primary School', value: user?.primarySchool || user?.primary_school || 'Not provided', icon: 'school' },
        { label: 'High School', value: user?.highSchool || user?.high_school || 'Not provided', icon: 'school' },
        { label: 'University', value: user?.university || 'Not provided', icon: 'school' },
        { label: 'Close School Friends', value: user?.closeSchoolFriends || user?.close_school_friends || 'Not provided', icon: 'people' },
      ]
    },
    {
      title: 'AI Questionnaire Responses',
      icon: 'chatbubble-ellipses-outline',
      color: '#fcd3aa',
      isQuestionnaire: true,
      items: [] // This will be populated dynamically from AI responses
    },
  ];

  const renderProfileSection = (section: any) => {
    // Handle AI questionnaire section specially
    if (section.isQuestionnaire && isOwnProfile) {
      const responseCount = Object.keys(questionnaireResponses).length;
      const hasResponses = responseCount > 0;
      
      return (
        <View key={section.title} style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: `${section.color}30` }]}>
              <Ionicons name={section.icon as any} size={24} color={section.color} />
            </View>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
          
          <View style={styles.sectionCard}>
            {loadingResponses ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={section.color} />
                <Text style={styles.loadingText}>Loading AI responses...</Text>
              </View>
            ) : hasResponses ? (
              <>
                <View style={styles.questionnairePreview}>
                  <Text style={styles.questionnaireCount}>
                    {responseCount} AI questionnaire responses
                  </Text>
                  <Text style={styles.questionnaireDescription}>
                    Your AI conversation responses are used to build your profile and help find better matches.
                  </Text>
                  
                  {/* Show a preview of first 2 responses */}
                  {Object.entries(questionnaireResponses).slice(0, 2).map(([key, value]: [string, any], index: number) => (
                    <View key={key} style={[styles.profileItem, styles.questionnaireItem]}>
                      <Text style={styles.questionnaireKey}>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Text>
                      <Text style={styles.questionnaireValue} numberOfLines={2}>
                        {String(value)}
                      </Text>
                    </View>
                  ))}
                  
                  {responseCount > 2 && (
                    <Text style={styles.moreResponsesText}>
                      and {responseCount - 2} more responses...
                    </Text>
                  )}
                </View>
                
                <TouchableOpacity 
                  style={[styles.viewAllButton, { borderColor: section.color }]}
                  onPress={() => navigation.navigate('ProfileQAReview')}
                >
                  <Ionicons name="eye-outline" size={18} color={section.color} />
                  <Text style={[styles.viewAllButtonText, { color: section.color }]}>
                    View & Edit All Responses
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.emptyQuestionnaireContainer}>
                <Ionicons name="chatbubble-outline" size={32} color="#666" />
                <Text style={styles.emptyQuestionnaireTitle}>No AI responses yet</Text>
                <Text style={styles.emptyQuestionnaireText}>
                  Use "Complete Your Profile" in the dashboard to start building your profile with AI assistance.
                </Text>
              </View>
            )}
          </View>
        </View>
      );
    }

    // Regular sections
    return (
      <View key={section.title} style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIconContainer, { backgroundColor: `${section.color}30` }]}>
            <Ionicons name={section.icon as any} size={24} color={section.color} />
          </View>
          <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
        
        <View style={styles.sectionCard}>
          {section.items.map((item: any, index: number) => (
            <View 
              key={index} 
              style={[
                styles.profileItem,
                index < section.items.length - 1 && styles.itemBorder
              ]}
            >
              <View style={styles.itemHeader}>
                <View style={[styles.iconContainer, { backgroundColor: `${section.color}20` }]}>
                  <Ionicons name={item.icon as any} size={18} color={section.color} />
                </View>
                <Text style={styles.itemLabel}>{item.label}</Text>
              </View>
              <Text style={[
                styles.itemValue,
                item.multiline && styles.itemValueMultiline,
                item.value === 'Not provided' && styles.itemValueEmpty
              ]}>
                {item.value}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Show loading indicator while fetching profile data
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <ActivityIndicator size="large" color="#0091ad" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Background Pattern */}
      <View style={styles.backgroundPattern}>
        <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
          <Defs>
            <Pattern
              id="profileDots"
              patternUnits="userSpaceOnUse"
              width="50"
              height="50"
            >
              <Circle cx="25" cy="25" r="1" fill="rgba(252,211,170,0.06)" opacity="0.5" />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#profileDots)" />
        </Svg>
      </View>

      {/* Modern Header without gradient */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: headerAnim,
            transform: [{
              translateY: headerAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0],
              }),
            }],
          }
        ]}
      >
        <View style={styles.headerTopRow}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#fcd3aa" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>
            {isOwnProfile ? 'My Profile' : `${getFirstName()}'s Profile`}
          </Text>
          
          {isOwnProfile && (
            <Animated.View
              style={{
                transform: [{ scale: editButtonScale }]
              }}
            >
              <TouchableOpacity 
                style={styles.editButton}
                onPress={handleEditProfile}
              >
                <LinearGradient
                  colors={['#0091ad', '#04a7c7']}
                  style={styles.editButtonGradient}
                >
                  <Ionicons name="create" size={22} color="#ffffff" />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <LinearGradient
            colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
            style={styles.profileCardGradient}
          >
            <View style={styles.profileSummary}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatarRing} />
                <LinearGradient
                  colors={['#0091ad', '#04a7c7', '#fcd3aa']}
                  style={styles.avatar}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {getUserAvatar() ? (
                    <Image
                      source={{ uri: getUserAvatar() }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Text style={styles.avatarText}>{getFirstName()[0]?.toUpperCase()}</Text>
                  )}
                </LinearGradient>
                {user?.profileCompleted && (
                  <View style={styles.onlineIndicator}>
                    <Ionicons name="checkmark-circle" size={20} color="#4ade80" />
                  </View>
                )}
              </View>
              
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {user?.fullName && user.fullName !== 'User' ? user.fullName : 'Profile Incomplete'}
                </Text>
                <Text style={styles.profileEmail}>{user?.email || 'No email'}</Text>
                
                <View style={styles.completionContainer}>
                  <View style={styles.progressBar}>
                    <LinearGradient
                      colors={['#0091ad', '#04a7c7', '#fcd3aa']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.progressFill, { width: `${getCompletionPercentage()}%` }]}
                    />
                  </View>
                  <Text style={styles.completionText}>
                    {getCompletionPercentage()}% complete
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {[
            { key: 'about', label: 'About', icon: 'person' },
            { key: 'stories', label: 'Stories', icon: 'book' },
            { key: 'education', label: 'Education', icon: 'school' }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && styles.activeTab
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={16} 
                color={activeTab === tab.key ? '#000000' : 'rgba(252,211,170,0.8)'}
                style={styles.tabIcon}
              />
              <Text style={[
                styles.tabText,
                activeTab === tab.key && styles.activeTabText
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* Content */}
      <Animated.ScrollView 
        style={[
          styles.content,
          {
            opacity: contentAnim,
            transform: [{
              translateY: contentAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            }],
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'about' && (
          <>
            {profileSections.slice(0, 3).map(renderProfileSection)}
          </>
        )}
        
        {activeTab === 'stories' && (
          <>
            {profileSections.slice(3, 4).map(renderProfileSection)}
          </>
        )}
        
        {activeTab === 'education' && (
          <>
            {profileSections.slice(4).map(renderProfileSection)}
          </>
        )}

        {/* Actions Section for own profile */}
        {isOwnProfile && (
          <View style={styles.actionsSection}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleEditProfile}
            >
              <LinearGradient
                colors={['#0091ad', '#04a7c7']}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="create" size={20} color="#ffffff" />
                <Text style={styles.actionButtonText}>Edit Profile</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('PersonalDetails', {
                userId: user?.id,
                email: user?.email,
                phone: user?.phone,
                fromDashboard: true
              })}
            >
              <Ionicons name="add-circle" size={20} color="#fcd3aa" />
              <Text style={styles.secondaryButtonText}>
                Add More Details
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fcd3aa',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '400',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  header: {
    paddingTop: StatusBar.currentHeight || 50,
    paddingBottom: 20,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(252,211,170,0.1)',
    zIndex: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(252,211,170,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(252,211,170,0.15)',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  editButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#0091ad',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  editButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(252,211,170,0.1)',
  },
  profileCardGradient: {
    padding: 20,
  },
  profileSummary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 20,
  },
  avatarRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: 'rgba(252,211,170,0.3)',
    top: -5,
    left: -5,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#0091ad',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(252,211,170,0.7)',
    marginBottom: 12,
  },
  completionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(252,211,170,0.2)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  completionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fcd3aa',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 20,
    borderRadius: 25,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(252,211,170,0.1)',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    minWidth: 80,
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#fcd3aa',
  },
  tabIcon: {
    marginRight: 4,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(252,211,170,0.8)',
  },
  activeTabText: {
    color: '#000000',
    fontWeight: '700',
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
  section: {
    margin: 16,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIconContainer: {
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
    flex: 1,
  },
  sectionCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(252,211,170,0.1)',
  },
  profileItem: {
    padding: 16,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(252,211,170,0.08)',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  itemValue: {
    fontSize: 15,
    fontWeight: '400',
    color: '#cccccc',
    lineHeight: 22,
  },
  itemValueMultiline: {
    lineHeight: 24,
  },
  itemValueEmpty: {
    color: '#666666',
    fontStyle: 'italic',
  },
  actionsSection: {
    margin: 16,
    gap: 12,
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#0091ad',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: '#fcd3aa',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fcd3aa',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 40,
  },
  
  // AI Questionnaire styles
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
  },
  questionnairePreview: {
    padding: 4,
  },
  questionnaireCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  questionnaireDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: '#cccccc',
    marginBottom: 16,
    lineHeight: 18,
  },
  questionnaireItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(252,211,170,0.1)',
  },
  questionnaireKey: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fcd3aa',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  questionnaireValue: {
    fontSize: 14,
    fontWeight: '400',
    color: '#ffffff',
    lineHeight: 18,
  },
  moreResponsesText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
  },
  viewAllButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  emptyQuestionnaireContainer: {
    alignItems: 'center',
    padding: 24,
  },
  emptyQuestionnaireTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyQuestionnaireText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default UserProfileScreen;