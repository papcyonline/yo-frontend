// src/screens/main/Dashboard.tsx - Complete version with donut chart percentages

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Text, TouchableOpacity, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Pattern, Rect, Circle as SvgCircle, G } from 'react-native-svg';
import { useAlert } from '../../context/AlertContext';

// Components
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { DashboardTabs } from '../../components/dashboard/DashboardTabs';
import { BottomNavigation } from '../../components/dashboard/BottomNavigation';
import UpdatesSection from '../../components/status/UpdatesSection';
import SocialsFeed from '../../components/social/SocialsFeed';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api';
import { aiAnalysisAPI } from '../../services/api/aiAnalysis';
import { useTheme } from '../../context/ThemeContext';
import { getSystemFont, API_BASE_URL } from '../../config/constants';
import { matchingAPI } from '../../services/matchingAPI';
import { useUnreadChats } from '../../hooks/useUnreadChats';
import { chatService } from '../../services/ChatService';
import ratingService from '../../services/RatingService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../../services/LoggingService';

interface DashboardProps {
  navigation: any;
  route: any;
}

// Donut Chart Component for AI Match Percentages
const DonutChart: React.FC<{
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  textColor?: string;
}> = ({ percentage, size = 48, strokeWidth = 4, color, textColor = '#ffffff' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const center = size / 2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {/* Background circle */}
        <SvgCircle
          cx={center}
          cy={center}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <SvgCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      {/* Percentage text in center */}
      <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{
          fontSize: size * 0.32,
          fontWeight: '700',
          color: textColor,
        }}>
          {percentage}%
        </Text>
      </View>
    </View>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ navigation, route }) => {
  const routeParams = route.params || {};
  const authStore = useAuthStore();
  const { theme, isDark } = useTheme();
  const { unreadCount } = useUnreadChats();
  const { showError, success, showNetworkError, showAlert } = useAlert();
  
  // Create dynamic styles based on theme
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      flex: 1,
    },
    // Text colors that adapt to theme
    modernMatchName: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 2,
    },
    modernRelation: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 4,
    },
    modernBio: {
      fontSize: 13,
      fontWeight: '400',
      color: theme.textSecondary,
      marginBottom: 8,
      lineHeight: 18,
    },
    // Card backgrounds
    modernListItem: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      marginHorizontal: 8,
      marginVertical: 6,
      padding: 16,
      elevation: 3,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.shadowOpacity,
      shadowRadius: 4,
      borderWidth: 1,
      borderColor: theme.border,
    },
  });
  
  // Get user data from auth store first, fallback to route params
  const user = authStore.user || routeParams.user;
  const token = routeParams.token || authStore.token;
  const refreshToken = routeParams.refreshToken || authStore.refreshToken;
  
  const { setUser, setTokens } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('family');
  const [activeBottomTab, setActiveBottomTab] = useState('family');
  const [profileCompletionData, setProfileCompletionData] = useState(null);
  const [isCheckingCompletion, setIsCheckingCompletion] = useState(false);
  const [aiAnalysisData, setAiAnalysisData] = useState(null);
  const [ratingPromptTimeout, setRatingPromptTimeout] = useState<NodeJS.Timeout | null>(null);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  // Check if we have user data, if not redirect to login
  useEffect(() => {
    if (!user) {
      console.log('❌ Dashboard: No user data found, redirecting to login');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }]
      });
      return;
    }
    
    // Store auth data when Dashboard mounts from login
    if (user && token) {
      // Storing auth data from login
      setUser(user);
      if (refreshToken) {
        setTokens(token, refreshToken);
      } else {
        // Fallback to just token if refreshToken not provided
        useAuthStore.getState().setToken(token);
      }
    }
  }, [user, token, refreshToken, setUser, setTokens, navigation]);

  // Debounced real-time match updates to prevent excessive re-renders
  useEffect(() => {
    let updateTimeout: NodeJS.Timeout;
    
    const handleMatchesUpdated = (data: { matchCount: number; matches: any[]; timestamp: string }) => {
      // Debounce rapid updates to prevent UI spam
      clearTimeout(updateTimeout);
      updateTimeout = setTimeout(() => {
        if (__DEV__) {
          console.log('Real-time: Matches updated');
        }
        // Only refresh if user is on family tab to avoid unnecessary updates
        if (activeBottomTab === 'family' || activeTab === 'family') {
          // Minimal refresh logic here
        }
      }, 1000);
    };

    const handleHighMatchesFound = (data: { matches: any[]; timestamp: string }) => {
      if (__DEV__) {
        console.log(`High confidence matches found: ${data.matches.length}`);
      }
      // High confidence matches are handled by notification system
    };

    // Listen for match update events
    chatService.on('matches_updated', handleMatchesUpdated);
    chatService.on('high_matches_found', handleHighMatchesFound);

    return () => {
      clearTimeout(updateTimeout);
      chatService.off('matches_updated', handleMatchesUpdated);
      chatService.off('high_matches_found', handleHighMatchesFound);
    };
  }, [activeBottomTab, activeTab]);

  // Function to check profile completion status
  const checkProfileCompletion = async () => {
    if (!user || isCheckingCompletion) return;
    
    try {
      setIsCheckingCompletion(true);
      
      // Checking profile completion status
      
      // Try AI analysis first (enhanced)
      try {
        const aiResponse = await aiAnalysisAPI.getProfileCompletionAnalysis();
        // AI analysis received
        
        if (aiResponse.success) {
          setAiAnalysisData(aiResponse.data);
          
          // Use AI analysis data directly without overriding
          const completionData = {
            percentage: aiResponse.data.completionScore,
            isComplete: aiResponse.data.isComplete,
            missing: aiResponse.data.criticalMissing
          };
          
          setProfileCompletionData(completionData);
          
          // Profile completion data set from AI analysis
          
          // Update user data in auth store
          if (completionData.isComplete !== user.profile_completed) {
            const updatedUser = {
              ...user,
              profile_completed: completionData.isComplete,
              profile_complete: completionData.isComplete,
              completionPercentage: completionData.percentage
            };
            setUser(updatedUser);
          }
          return;
        }
      } catch (aiError) {
        console.log('AI analysis not available, using basic check:', aiError);
      }
      
      // Fallback to basic completion check
      const response = await apiService.get('/users/profile/completion-status');
      console.log('📊 BASIC COMPLETION RESPONSE:', response);
      
      if (response.success) {
        setProfileCompletionData(response.data);
        
        console.log('✅ PROFILE COMPLETION - Set from basic API:', response.data);
        
        // Update user data in auth store if completion status has changed
        if (response.data.isComplete !== user.profile_completed) {
          const updatedUser = {
            ...user,
            profile_completed: response.data.isComplete,
            profile_complete: response.data.isComplete,
            completionPercentage: response.data.percentage
          };
          setUser(updatedUser);
        }
      } else {
        // If API calls fail, ensure new users see the Complete Profile section
        console.log('⚠️ PROFILE COMPLETION - API failed, setting default for new user');
        setProfileCompletionData({
          percentage: 10, // Low percentage for new users
          isComplete: false, // Ensure it shows for new users
          missing: ['profile_questions', 'ai_chat']
        });
      }
    } catch (error) {
      console.log('Error checking profile completion:', error);
      
      // On error, ensure new users still see the Complete Profile section
      console.log('❌ PROFILE COMPLETION - Error occurred, setting default for new user');
      setProfileCompletionData({
        percentage: 10,
        isComplete: false,
        missing: ['profile_questions', 'ai_chat']
      });
    } finally {
      setIsCheckingCompletion(false);
    }
  };

  // Check profile completion when user data changes
  useEffect(() => {
    if (user) {
      checkProfileCompletion();
      // Auto-fix missing user data on mount
      fixMissingUserData();
      // Check for rating prompt opportunities
      const setupRatingPrompt = async () => {
        const timeoutId = await checkRatingPrompt();
        if (timeoutId) {
          setRatingPromptTimeout(timeoutId);
        }
      };
      setupRatingPrompt();
    }

    // Cleanup timeout on unmount or user change
    return () => {
      if (ratingPromptTimeout) {
        clearTimeout(ratingPromptTimeout);
        setRatingPromptTimeout(null);
      }
    };
  }, [user?.id]); // Only trigger when user ID changes

  // Check if we should show a rating prompt
  const checkRatingPrompt = async () => {
    try {
      const shouldShow = await ratingService.shouldShowRatingPrompt();
      
      if (shouldShow) {
        // Add a slight delay to prevent overwhelming the user on startup
        const timeoutId = setTimeout(() => {
          showAutomaticRatingPrompt();
        }, 3000); // Show after 3 seconds on dashboard
        
        // Store timeout ID for cleanup
        return timeoutId;
      }
    } catch (error) {
      console.log('Rating prompt check failed:', error);
    }
    return null;
  };

  // Show automatic rating prompt
  const showAutomaticRatingPrompt = async () => {
    try {
      showAlert({
        type: 'info',
        title: 'Enjoying YoFam? 🌟',
        message: 'It looks like you\'re getting great value from YoFam! Would you mind taking a moment to rate us? It really helps other families discover our app.',
        buttons: [
          { 
            text: 'Not Now', 
            style: 'cancel',
            onPress: async () => {
              // Record that user saw the prompt but declined
              try {
                const data = await ratingService.getRatingData();
                data.ratingPromptCount += 1;
                data.lastPromptDate = new Date().toISOString();
                // Save the updated data
                await AsyncStorage.setItem('app_rating_data', JSON.stringify(data));
                logger.debug('User declined rating prompt, data updated');
              } catch (error) {
                console.log('Failed to update rating data on decline:', error);
              }
            }
          },
          {
            text: 'Send Feedback',
            onPress: () => {
              navigation.navigate('SendFeedback', { user });
            }
          },
          { 
            text: 'Rate 5 Stars ⭐', 
            onPress: async () => {
              try {
                await ratingService.showRatingPrompt();
                // Record significant event
                await ratingService.recordSignificantEvent('automatic_rating_accepted');
              } catch (error) {
                // Fallback to store
                try {
                  await ratingService.openAppStore();
                } catch (storeError) {
                  console.error('Failed to open app store:', storeError);
                }
              }
            }
          }
        ]
      });
    } catch (error) {
      console.log('Failed to show rating prompt:', error);
    }
  };
  
  // Fix missing user data
  const fixMissingUserData = async () => {
    if (!token) return;
    
    try {
      const response = await apiService.post('/users/profile/fix', {});
      if (response.success && response.data.user) {
        console.log('Fixed user data:', response.data.fixed);
        setUser(response.data.user);
      }
    } catch (error) {
      console.log('Could not fix user data:', error);
    }
  };

  // Refresh user data when screen comes into focus (after profile edits)
  useFocusEffect(
    React.useCallback(() => {
      const refreshUserData = async () => {
        if (!user?.id || !token) return;
        
        try {
          // Fetch latest user data from API
          const response = await apiService.get('/users/profile');
          if (response.success && response.data.user) {
            // Update auth store with fresh user data
            setUser(response.data.user);
          }
        } catch (error) {
          console.log('Failed to refresh user data:', error);
        }
      };

      refreshUserData();
    }, [user?.id, token, setUser])
  );

  useEffect(() => {
    // Use API data first, then fallback to user fields
    const isProfileComplete = profileCompletionData 
      ? profileCompletionData.isComplete 
      : user && (
          user.profile_completed === true || 
          user.profile_complete === true ||
          user.profileCompleted === true
        );
    
    const currentCompletionPercentage = profileCompletionData 
      ? profileCompletionData.percentage 
      : user?.completionPercentage || 0;
    
    setCompletionPercentage(currentCompletionPercentage);
    
    // Profile completion popup disabled
    // if (user && !isProfileComplete && completionPercentage < 80) {
    //   const missingFields = profileCompletionData?.missing || [];
    //   const missingText = missingFields.length > 0 
    //     ? `Missing: ${missingFields.slice(0, 3).join(', ')}${missingFields.length > 3 ? '...' : ''}`
    //     : 'Add more details to help us find your family connections!';
    //   
    //   setTimeout(() => {
    //     Alert.alert(
    //       `Profile ${completionPercentage}% Complete`,
    //       missingText,
    //       [
    //         { text: 'Later', style: 'cancel' },
    //         { 
    //           text: 'Complete Now', 
    //           onPress: () => navigation.navigate('ProgressiveProfile', {
    //             user: user
    //           })
    //         }
    //       ]
    //     );
    //   }, 2000);
    // }
  }, [profileCompletionData, user?.profile_completed, user?.profile_complete, user?.profileCompleted, user]);

  // Handle Socials tab activation
  useEffect(() => {
    // Socials tab stays on dashboard, no navigation needed
  }, [activeTab]);

  // Load matches data from API
  useEffect(() => {
    loadMatchesData();
  }, [user?.id]);

  const loadMatchesData = async () => {
    if (!user?.id || !token) {
      console.log('⚠️ Dashboard: Missing user ID or token for matches');
      return;
    }

    try {
      setMatchesLoading(true);
      console.log('🔍 Dashboard: Loading matches for user:', user.id);
      
      // Load family matches - pass the actual user ID
      const familyResponse = await matchingAPI.getMatches('family', 1, 20, user.id);
      console.log('👨‍👩‍👧‍👦 Dashboard: Family matches response:', familyResponse);
      
      // Load friend matches - pass the actual user ID
      const friendResponse = await matchingAPI.getMatches('friend', 1, 20, user.id);
      console.log('👫 Dashboard: Friend matches response:', friendResponse);
      
      // Transform matches to Dashboard format with family relationship prioritization
      const transformedFamilyMatches = familyResponse.matches?.map((match, index) => {
        // Determine family relationship display
        let relationDisplay = 'Family member';
        
        if (match.predictedRelationship) {
          // Map AI predicted relationships to user-friendly terms
          switch (match.predictedRelationship.toLowerCase()) {
            case 'full sibling':
            case 'sibling':
              // Determine gender for better relationship display
              const userName = match.matched_user.first_name?.toLowerCase() || '';
              if (userName.includes('sonita') || userName.includes('fatima') || userName.includes('aisha')) {
                relationDisplay = 'Possible sister';
              } else if (userName.includes('ahmed') || userName.includes('ibrahim') || userName.includes('hassan')) {
                relationDisplay = 'Possible brother';
              } else {
                relationDisplay = 'Possible sibling';
              }
              break;
            case 'maternal sibling':
              relationDisplay = 'Possible half-sibling (same mother)';
              break;
            case 'paternal sibling':
              relationDisplay = 'Possible half-sibling (same father)';
              break;
            case 'parent':
              relationDisplay = 'Possible parent';
              break;
            case 'child':
              relationDisplay = 'Possible child';
              break;
            case 'cousin':
              relationDisplay = 'Possible cousin';
              break;
            default:
              relationDisplay = `Possible ${match.predictedRelationship}`;
          }
        } else if (match.match_score >= 60) {
          relationDisplay = 'Possible close relative';
        } else if (match.match_score >= 40) {
          relationDisplay = 'Possible relative';
        } else if (match.match_score >= 20) {
          relationDisplay = 'Possible distant relative';
        } else {
          relationDisplay = 'Possible connection';
        }

        return {
          id: match.id || match.matched_user_id,
          name: match.matched_user.first_name && match.matched_user.last_name 
            ? `${match.matched_user.first_name} ${match.matched_user.last_name}`
            : 'Unknown User',
          profileImage: match.matched_user.profile_photo_url,
          initials: match.matched_user.first_name ? 
            `${match.matched_user.first_name[0]}${match.matched_user.last_name?.[0] || ''}`.toUpperCase() : 'U',
          matchPercentage: match.match_score || 0,
          relation: relationDisplay,
          bio: match.matched_user.bio || 'No bio available',
          location: match.matched_user.location || 'Unknown location',
          matchTag: match.match_type === 'family' ? 'Family' : 'Relative',
          tagColor: '#0091ad',
          aiConfidence: match.confidence_level || 'medium',
          verified: false
        };
      }) || [];
      
      const transformedFriendMatches = friendResponse.matches?.map((match, index) => {
        // Determine friendship type based on AI reasoning and match factors
        let relationDisplay = 'Possible friend';
        const reasoning = match.ai_reasoning?.reasoning?.toLowerCase() || '';
        const factors = match.match_factors || {};
        const predictedRelationship = match.predictedRelationship?.toLowerCase() || '';
        
        // Check for school connections
        if (reasoning.includes('school') || reasoning.includes('education') || 
            predictedRelationship.includes('classmate') || factors.education_similarity > 0.3) {
          if (reasoning.includes('primary') || reasoning.includes('elementary')) {
            relationDisplay = 'Possible primary school classmate';
          } else if (reasoning.includes('secondary') || reasoning.includes('high school')) {
            relationDisplay = 'Possible high school classmate';
          } else if (reasoning.includes('university') || reasoning.includes('college')) {
            relationDisplay = 'Possible university classmate';
          } else {
            relationDisplay = 'Possible old classmate';
          }
        }
        // Check for childhood connections
        else if (reasoning.includes('childhood') || reasoning.includes('grew up') || 
                 predictedRelationship.includes('childhood') || factors.childhood_location_match > 0.3) {
          relationDisplay = 'Possible childhood friend';
        }
        // Check for neighborhood connections
        else if (reasoning.includes('neighbor') || reasoning.includes('neighbourhood') || 
                 reasoning.includes('lived near')) {
          relationDisplay = 'Possible old neighbor';
        }
        // Check for work connections
        else if (reasoning.includes('work') || reasoning.includes('colleague') || 
                 reasoning.includes('profession') || factors.profession_similarity > 0.3) {
          relationDisplay = 'Possible colleague';
        }
        // Check for community connections
        else if (reasoning.includes('community') || reasoning.includes('club') || 
                 reasoning.includes('organization')) {
          relationDisplay = 'Community friend';
        }
        // Check for shared interests
        else if (reasoning.includes('hobby') || reasoning.includes('interest') || 
                 factors.interests_similarity > 0.3) {
          relationDisplay = 'Shared interests friend';
        }
        // Age-based friendship
        else if (reasoning.includes('age') || factors.age_similarity > 0.7) {
          relationDisplay = 'Possible peer friend';
        }
        // Default based on score
        else if (match.match_score > 70) {
          relationDisplay = 'Highly likely friend';
        } else if (match.match_score > 50) {
          relationDisplay = 'Possible friend connection';
        }
        
        return {
          id: match.id || match.matched_user_id,
          name: match.matched_user.first_name && match.matched_user.last_name 
            ? `${match.matched_user.first_name} ${match.matched_user.last_name}`
            : 'Unknown User',
          profileImage: match.matched_user.profile_photo_url,
          initials: match.matched_user.first_name ? 
            `${match.matched_user.first_name[0]}${match.matched_user.last_name?.[0] || ''}`.toUpperCase() : 'U',
          matchPercentage: match.match_score || 0,
          relation: relationDisplay,
          bio: match.matched_user.bio || 'No bio available',
          location: match.matched_user.location || 'Unknown location',
          matchTag: 'Friend',
          tagColor: '#04a7c7',
          aiConfidence: match.confidence_level || 'medium',
          verified: false
        };
      }) || [];
      
      setFamilyMatches(transformedFamilyMatches);
      setFriendMatches(transformedFriendMatches);
      
      console.log('✅ Dashboard: Loaded matches:', {
        family: transformedFamilyMatches.length,
        friends: transformedFriendMatches.length
      });
      
    } catch (error) {
      console.error('❌ Dashboard: Error loading matches:', error);
      setFamilyMatches([]);
      setFriendMatches([]);
    } finally {
      setMatchesLoading(false);
    }
  };

  const handleProfilePress = () => {
    navigation.navigate('UserProfile', { 
      user, 
      isOwnProfile: true 
    });
  };

  const handleNotificationsPress = () => {
    navigation.navigate('Notifications', { user });
  };

  // UPDATED: Navigate to GenealogyDashboard
  const handleFamilyTreePress = () => {
    navigation.navigate('GenealogyDashboard', { user });
  };

  // NEW: Navigate to Friend Requests Screen
  const handleFriendRequestsPress = () => {
    navigation.navigate('FriendRequests', { user });
  };

  // Handle match card press - navigate to MatchDetail
  const handleMatchPress = (matchData: any) => {
    navigation.navigate('MatchDetail', {
      match: matchData,
      user: user
    });
  };

  // Handle sending friend request
  const handleSendFriendRequest = async (matchData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/friends/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientId: matchData.id,
          message: `Hi ${matchData.name}! I found you through YoFam and would like to connect. We have a ${matchData.matchPercentage}% match as ${matchData.relation}.`,
          matchContext: {
            match_type: matchData.matchTag?.toLowerCase(),
            match_score: matchData.matchPercentage,
            predicted_relationship: matchData.relation,
            match_reason: `${matchData.matchPercentage}% similarity - ${matchData.relation}`
          }
        }),
      });

      const result = await response.json();

      if (result.success) {
        success(`Friend request sent to ${matchData.name}!`);
      } else {
        showError('Request Failed', result.message || 'Unable to send friend request');
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      showNetworkError('Unable to send friend request. Please check your connection.');
    }
  };

  // Handle bottom navigation to match BottomNavigation.tsx structure
  const handleBottomTabPress = (tabId: string) => {
    setActiveBottomTab(tabId);
    
    switch (tabId) {
      case 'family':
        // Stay on Dashboard when family is pressed from bottom nav
        // Reset dashboard tab to family
        setActiveTab('family');
        break;
      case 'friends':
        navigation.navigate('Friends', { user });
        break;
      case 'community':
        navigation.navigate('Communities', { user });
        break;
      case 'chats':
        navigation.navigate('ChatsPage', { user });
        break;
      case 'settings':
        navigation.navigate('Settings', { user });
        break;
      default:
        break;
    }
  };

  // Social feed tab with proper navigation
  const tabsData = [
    { id: 'family', title: 'Family Match', icon: 'people' },
    { id: 'friends', title: 'Friends Match', icon: 'heart' },
    { id: 'socials', title: 'Social Media', icon: 'camera' }
  ];

  // Handle dashboard tabs properly
  const handleTabPress = (tabId: string) => {
    if (tabId === 'socials') {
      // Stay on dashboard and show socials feed
      setActiveTab(tabId);
      setActiveBottomTab('family');
    } else {
      // For family and friends, just switch tabs within dashboard
      setActiveTab(tabId);
      // Keep bottom navigation showing family (since we're still on dashboard)
      setActiveBottomTab('family');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  // State for matches data from API
  const [familyMatches, setFamilyMatches] = useState<any[]>([]);
  const [friendMatches, setFriendMatches] = useState<any[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(true);

  // Updated color function to match AI confidence levels
  const getPercentageColor = (percentage: number) => {
    if (percentage >= 80 && percentage <= 100) return '#0091ad'; // 80-100: Strong match (primary blue)
    if (percentage >= 60 && percentage < 80) return '#04a7c7';   // 60-79: Good match (secondary blue)
    if (percentage >= 40 && percentage < 60) return '#fcd3aa';   // 40-59: Fair match (cream)
    return '#ff6b6b'; // 1-39: Weak match (red)
  };

  // Updated relation color function to match percentage colors
  const getRelationColor = (percentage: number) => {
    return getPercentageColor(percentage);
  };

  // Modern List Item Component - Elegant Design with Dividers
  const renderModernListItem = (match: any, isFriend: boolean = false, index: number, totalItems: number) => {
    const percentageColor = getPercentageColor(match.matchPercentage);
    const isLastItem = index === totalItems - 1;

    return (
      <View key={match.id} style={styles.transparentListItem}>
        <TouchableOpacity
          style={styles.listItemContent}
          onPress={() => handleMatchPress(match)}
          activeOpacity={0.9}
        >
          {/* Left Side - Avatar & Status */}
          <View style={styles.listItemLeft}>
            <View style={styles.modernAvatar}>
              {match.profileImage ? (
                <Image 
                  source={{ uri: match.profileImage }} 
                  style={styles.modernProfileImage}
                  onError={() => console.log('Image failed to load')}
                />
              ) : (
                <LinearGradient
                  colors={isFriend ? ['#8b5cf6', '#a855f7'] : ['#0091ad', '#04a7c7']}
                  style={styles.avatarGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.modernAvatarText}>{match.initials}</Text>
                </LinearGradient>
              )}
              
              {/* Status Ring */}
              {match.verified && (
                <View style={[styles.statusRing, { borderColor: percentageColor }]}>
                  <Ionicons name="checkmark" size={8} color={percentageColor} />
                </View>
              )}
            </View>
          </View>
          
          {/* Center - Information */}
          <View style={styles.listItemCenter}>
            <View style={styles.nameRow}>
              <Text style={dynamicStyles.modernMatchName}>{match.name}</Text>
              <View style={[styles.matchTagChip, { backgroundColor: `${match.tagColor}20` }]}>
                <Text style={[styles.tagText, { color: match.tagColor }]}>
                  {match.matchTag}
                </Text>
              </View>
            </View>
            
            <Text style={[dynamicStyles.modernRelation, { color: percentageColor }]}>
              {match.relation}
            </Text>
            
            <Text style={dynamicStyles.modernBio} numberOfLines={1}>
              {match.bio}
            </Text>
            
            <View style={styles.modernMetaRow}>
              <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={12} color="rgba(255, 255, 255, 0.5)" />
                <Text style={styles.modernLocation}>{match.location}</Text>
              </View>
              <View style={[styles.aiConfidenceBadge, { backgroundColor: `${percentageColor}15` }]}>
                <Ionicons name="sparkles" size={10} color={percentageColor} />
                <Text style={[styles.aiConfidenceText, { color: percentageColor }]}>
                  {match.aiConfidence}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Right Side - Actions */}
          <View style={styles.listItemRight}>
            <View style={styles.actionSection}>
              <DonutChart
                percentage={match.matchPercentage}
                size={32}
                strokeWidth={3}
                color={percentageColor}
                textColor={theme.text}
              />
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.friendRequestButton, { borderColor: percentageColor }]}
                  onPress={() => handleSendFriendRequest(match)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="person-add" size={14} color={percentageColor} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.modernActionButton}>
                  <Ionicons name="chevron-forward" size={16} color="rgba(252, 211, 170, 0.6)" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
        
        {/* Enhanced Visible Divider */}
        {!isLastItem && (
          <View style={styles.modernDivider}>
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
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'family':
        return (
          <View style={styles.listContainer}>
            {/* Complete Profile Section */}
            {user && (completionPercentage < 85) && (
              <TouchableOpacity 
                style={styles.completeProfileCard}
                onPress={() => navigation.navigate('ProgressiveProfile', {
                  user: user
                })}
                activeOpacity={0.8}
              >
                <View style={styles.completeProfileBackground}>
                  <View style={styles.completeProfileContent}>
                    <View style={styles.completeProfileIcon}>
                      <Ionicons name="person-add" size={24} color="#000000" />
                    </View>
                    <View style={styles.completeProfileInfo}>
                      <Text style={styles.completeProfileTitle}>Complete Your Profile</Text>
                      <Text style={styles.completeProfileSubtitle}>
                        {profileCompletionData 
                          ? `${profileCompletionData.percentage}% complete • Unlock better matches` 
                          : 'Quick interactive questions • Unlock better matches'
                        }
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#000000" />
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {/* AI Statistics Card - DISABLED */}
            {/* <View style={styles.aiStatsCard}>
              <View style={styles.aiStatsBackground}>
                <View style={styles.aiStatsContent}>
                  <View style={styles.aiStatsHeader}>
                    <View style={styles.aiIconContainer}>
                      <Ionicons name="sparkles" size={18} color="#0091ad" />
                    </View>
                    <Text style={styles.aiStatsTitle}>AI Analysis Complete</Text>
                  </View>
                  <Text style={styles.aiStatsSubtitle}>
                    Found {familyMatches.length} potential family matches based on your profile data
                  </Text>
                </View>
              </View>
            </View> */}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Family Matches</Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Updates' as never)}
                style={styles.viewAllButton}
              >
                <Text style={styles.viewAllText}>View Status</Text>
                <Ionicons name="arrow-forward" size={16} color="#0091ad" />
              </TouchableOpacity>
            </View>
            
            {familyMatches.map((match, index) => renderModernListItem(match, false, index, familyMatches.length))}
            
            {/* White dotted background pattern */}
            <View style={styles.dottedBackground}>
              <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
                <Defs>
                  <Pattern
                    id="dots"
                    patternUnits="userSpaceOnUse"
                    width="20"
                    height="20"
                  >
                    <SvgCircle
                      cx="10"
                      cy="10"
                      r="1"
                      fill="rgba(252, 211, 170, 0.05)"
                    />
                  </Pattern>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#dots)" />
              </Svg>
            </View>
          </View>
        );
      case 'friends':
        return (
          <View style={styles.listContainer}>
            {/* AI Statistics Card for Friends - DISABLED */}
            {/* <View style={styles.aiStatsCard}>
              <LinearGradient
                colors={['#8b5cf6', '#a855f7', '#c084fc']}
                style={styles.aiStatsGradient}
              >
                <View style={styles.aiStatsContent}>
                  <View style={styles.aiStatsHeader}>
                    <Ionicons name="people" size={20} color="#ffffff" />
                    <Text style={styles.aiStatsTitle}>Friend Compatibility Analysis</Text>
                  </View>
                  <Text style={styles.aiStatsSubtitle}>
                    AI found {friendMatches.length} highly compatible friends based on interests & location
                  </Text>
                </View>
              </LinearGradient>
            </View> */}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Friend Suggestions</Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Updates' as never)}
                style={styles.viewAllButton}
              >
                <Text style={styles.viewAllText}>View Status</Text>
                <Ionicons name="arrow-forward" size={16} color="#15803d" />
              </TouchableOpacity>
            </View>
            {friendMatches.map((match, index) => renderModernListItem(match, true, index, friendMatches.length))}
            
            {/* White dotted background pattern */}
            <View style={styles.dottedBackground}>
              <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
                <Defs>
                  <Pattern
                    id="dots2"
                    patternUnits="userSpaceOnUse"
                    width="20"
                    height="20"
                  >
                    <SvgCircle
                      cx="10"
                      cy="10"
                      r="1"
                      fill="rgba(252, 211, 170, 0.05)"
                    />
                  </Pattern>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#dots2)" />
              </Svg>
            </View>
          </View>
        );
      case 'socials':
        return (
          <SocialsFeed user={user} />
        );
      default:
        return null;
    }
  };

  return (
    <View style={dynamicStyles.container}>
      {/* Header */}
      <DashboardHeader
        user={user}
        navigation={navigation}
        onProfilePress={handleProfilePress}
        onNotificationsPress={handleNotificationsPress}
        onGenealogyPress={handleFamilyTreePress}
        onFriendRequestsPress={handleFriendRequestsPress}
      />

      {/* Status Section - Right below header */}
      <UpdatesSection navigation={navigation} />

      {/* Tabs */}
      <DashboardTabs
        tabs={tabsData}
        activeTab={activeTab}
        onTabPress={handleTabPress}
      />

      {/* Main Content */}
      {activeTab === 'socials' ? (
        <View style={dynamicStyles.content}>
          {renderTabContent()}
        </View>
      ) : (
        <ScrollView 
          style={dynamicStyles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#0091ad']}
              tintColor="#0091ad"
              progressBackgroundColor="#1a1a1a"
            />
          }
        >
          {/* Main Tab Content - Matches */}
          {renderTabContent()}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      )}

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab={activeBottomTab}
        onTabPress={handleBottomTabPress}
        navigation={navigation}
        chatCount={unreadCount}
        communityNotifications={0}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // Note: container and content moved to dynamicStyles for theming
  // These static styles remain for non-themed elements
  listContainer: {
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 0, // Remove padding to control alignment per section
    position: 'relative',
  },
  
  // Complete Profile Card
  completeProfileCard: {
    borderRadius: 16,
    marginBottom: 24,
    marginHorizontal: 12, // Match other elements padding
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#fcd3aa',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  completeProfileBackground: {
    backgroundColor: '#fcd3aa',
    flex: 1,
  },
  completeProfileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  completeProfileIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  completeProfileInfo: {
    flex: 1,
  },
  completeProfileTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  completeProfileSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(0, 0, 0, 0.7)',
  },

  // AI Statistics Card - Redesigned
  aiStatsCard: {
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  aiStatsBackground: {
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(252, 211, 170, 0.15)',
    padding: 16,
  },
  aiStatsContent: {
    alignItems: 'flex-start',
  },
  aiStatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 145, 173, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  aiStatsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fcd3aa',
  },
  aiStatsSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  
  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 12, // Match listItemContent padding
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 145, 173, 0.1)',
  },
  viewAllText: {
    fontSize: 13,
    fontFamily: getSystemFont('semiBold'),
    color: '#0091ad',
    marginRight: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fcd3aa',
  },
  matchCountBadge: {
    backgroundColor: '#0091ad',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  friendsBadge: {
    backgroundColor: '#8b5cf6',
  },
  matchCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  
  // Match Cards
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(252, 211, 170, 0.08)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(252, 211, 170, 0.1)',
  },
  matchAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0091ad',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  friendAvatar: {
    backgroundColor: '#8b5cf6',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#0091ad',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
    display: 'none',
  },
  
  // Match Info
  matchInfo: {
    flex: 1,
    marginRight: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  matchName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fcd3aa',
  },
  verifiedIcon: {
    marginLeft: 6,
  },
  matchRelation: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  matchBio: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(252, 211, 170, 0.7)',
    marginBottom: 8,
    lineHeight: 18,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  matchLocation: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(252, 211, 170, 0.5)',
    marginLeft: 4,
  },

  // AI Confidence Badge
  aiConfidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiConfidenceText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#fcd3aa',
    marginLeft: 4,
  },
  
  // Match Percentage Container (for Donut Chart)
  matchPercentageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    marginTop: 8,
  },
  
  // Coming Soon
  comingSoon: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  comingSoonIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 145, 173, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  comingSoonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fcd3aa',
    textAlign: 'center',
    marginBottom: 8,
  },
  comingSoonSubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(252, 211, 170, 0.6)',
    textAlign: 'center',
  },
  
  // Background Elements
  dottedBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  
  bottomSpacing: {
    height: 40,
  },

  // ===== MODERN LIST DESIGN STYLES =====
  
  // Modern List Item Container
  modernListItem: {
    backgroundColor: 'transparent',
    marginHorizontal: 0,
    marginVertical: 0,
  },
  transparentListItem: {
    backgroundColor: 'transparent',
    marginHorizontal: 0,
    marginVertical: 0,
    borderRadius: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12, // Reduced from 20 to 12
    backgroundColor: 'transparent',
  },
  
  // Left Section - Avatar
  listItemLeft: {
    marginRight: 16,
  },
  
  modernAvatar: {
    position: 'relative',
    width: 48,
    height: 48,
  },
  
  avatarGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#0091ad',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  
  modernProfileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  
  modernAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  
  statusRing: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#000000',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Center Section - Information
  listItemCenter: {
    flex: 1,
    marginRight: 12,
  },
  
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  
  modernMatchName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  
  matchTagChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  
  modernRelation: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  
  modernBio: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
    marginBottom: 8,
  },
  
  modernMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  modernLocation: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
    marginLeft: 4,
  },
  
  aiConfidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  
  aiConfidenceText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  
  // Right Section - Actions
  listItemRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  actionSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  actionButtons: {
    alignItems: 'center',
    gap: 8,
  },
  
  friendRequestButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  modernActionButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  
  // Enhanced Visible Divider
  modernDivider: {
    height: 2, // Increased from 1 to 2
    marginHorizontal: 12,
    marginLeft: 76, // Align with text content (12 + 48 + 16)
    marginRight: 12, // Ensure consistent right margin
    marginVertical: 2, // Added vertical margin for better spacing
  },
  
  dividerGradient: {
    flex: 1,
    height: '100%',
    borderRadius: 1,
  },
});

export default Dashboard;