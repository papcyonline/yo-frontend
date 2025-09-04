import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Animated, Easing, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Pattern, Rect, Circle } from 'react-native-svg';
import { useAuthStore } from '../../../store/authStore';
import { getSystemFont } from '../../../config/constants';
import { aiAnalysisAPI } from '../../../services/api/aiAnalysis';

const { width } = Dimensions.get('window');

interface ProfileScreenProps {
  navigation: any;
  route?: any;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, syncProfileFromBackend, profileSyncInProgress } = useAuthStore();
  const [headerAnim] = useState(new Animated.Value(0));
  const [profileAnim] = useState(new Animated.Value(0));
  const [menuAnim] = useState(new Animated.Value(0));
  const [profileCompletion, setProfileCompletion] = useState({ percentage: 0, isComplete: false });

  useEffect(() => {
    // Sync profile data when component mounts
    if (user && !profileSyncInProgress) {
      syncProfileFromBackend();
    }

    // Load profile completion data using same API as Dashboard
    loadProfileCompletion();

    Animated.stagger(200, [
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.bezier(0.25, 0.46, 0.45, 0.94)),
        useNativeDriver: true,
      }),
      Animated.timing(profileAnim, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(menuAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const loadProfileCompletion = async () => {
    try {
      const response = await aiAnalysisAPI.getProfileCompletionAnalysis();
      if (response.success && response.data) {
        setProfileCompletion({
          percentage: response.data.completionScore,
          isComplete: response.data.isComplete
        });
      }
    } catch (error) {
      console.error('Failed to load profile completion:', error);
    }
  };

  const getDisplayName = () => {
    if (user?.fullName && user.fullName !== 'User') {
      return user.fullName;
    }
    if (user?.name && user.name !== 'User') {
      return user.name;
    }
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user?.first_name) {
      return user.first_name;
    }
    return 'Your Profile';
  };

  const getDisplayEmail = () => {
    return user?.email || 'Complete your profile to get started';
  };

  const getUserInitials = () => {
    const name = getDisplayName();
    if (name === 'Your Profile') return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name[0]?.toUpperCase() || 'U';
  };

  const getUserAvatar = () => {
    return user?.avatar_url || user?.profileImage || null;
  };

  const isProfileComplete = () => {
    return profileCompletion.isComplete || user?.profile_complete || user?.profile_completed || false;
  };

  const getProfileCompletionPercentage = () => {
    return profileCompletion.percentage || 0;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Pattern */}
      <View style={styles.backgroundPattern}>
        <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
          <Defs>
            <Pattern
              id="profileDots"
              patternUnits="userSpaceOnUse"
              width="30"
              height="30"
            >
              <Circle cx="15" cy="15" r="0.8" fill="rgba(252,211,170,0.05)" opacity="0.4" />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#profileDots)" />
        </Svg>
      </View>

      {/* Modern Header */}
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
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fcd3aa" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings" size={24} color="#fcd3aa" />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <Animated.View 
          style={[
            styles.profileCard,
            {
              opacity: profileAnim,
              transform: [{
                scale: profileAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              }],
            }
          ]}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
            style={styles.profileCardGradient}
          >
            {/* Profile Avatar */}
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
                  <Text style={styles.avatarText}>{getUserInitials()}</Text>
                )}
              </LinearGradient>
              <View style={styles.onlineIndicator} />
            </View>

            <Text style={styles.name}>{getDisplayName()}</Text>
            <Text style={styles.email}>{getDisplayEmail()}</Text>
            
            {/* Profile Completion Progress */}
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Profile Completion</Text>
                <Text style={styles.progressPercentage}>{getProfileCompletionPercentage()}%</Text>
              </View>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { width: `${getProfileCompletionPercentage()}%` }
                  ]} 
                />
              </View>
            </View>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate(isProfileComplete() ? 'EditProfile' : 'PersonalDetails', { fromDashboard: true })}
            >
              <LinearGradient
                colors={['#0091ad', '#04a7c7']}
                style={styles.actionButtonGradient}
              >
                <Ionicons name={isProfileComplete() ? "create" : "person-add"} size={20} color="#ffffff" />
                <Text style={styles.actionButtonText}>
                  {isProfileComplete() ? 'Edit Profile' : 'Complete Profile'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>

        {/* Menu Items */}
        <Animated.View 
          style={[
            styles.menuContainer,
            {
              opacity: menuAnim,
              transform: [{
                translateY: menuAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              }],
            }
          ]}
        >
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>Account Settings</Text>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <View style={[styles.menuIcon, { backgroundColor: 'rgba(0,145,173,0.15)' }]}>
                <Ionicons name="person-circle" size={24} color="#0091ad" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuText}>Edit Profile</Text>
                <Text style={styles.menuSubtext}>Update your personal information</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#fcd3aa" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={[styles.menuIcon, { backgroundColor: 'rgba(4,167,199,0.15)' }]}>
                <Ionicons name="lock-closed" size={24} color="#04a7c7" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuText}>Privacy Settings</Text>
                <Text style={styles.menuSubtext}>Control your privacy options</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#fcd3aa" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('ProfileQAReview')}
            >
              <View style={[styles.menuIcon, { backgroundColor: 'rgba(252,211,170,0.15)' }]}>
                <Ionicons name="chatbubbles" size={24} color="#fcd3aa" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuText}>Review & Edit Responses</Text>
                <Text style={styles.menuSubtext}>View and edit your AI questionnaire responses</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#fcd3aa" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={[styles.menuIcon, { backgroundColor: 'rgba(252,211,170,0.15)' }]}>
                <Ionicons name="notifications" size={24} color="#fcd3aa" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuText}>Notifications</Text>
                <Text style={styles.menuSubtext}>Manage your notifications</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#fcd3aa" />
            </TouchableOpacity>
          </View>

          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>Support</Text>
            
            <TouchableOpacity style={styles.menuItem}>
              <View style={[styles.menuIcon, { backgroundColor: 'rgba(0,145,173,0.15)' }]}>
                <Ionicons name="help-circle" size={24} color="#0091ad" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuText}>Help & Support</Text>
                <Text style={styles.menuSubtext}>Get help and contact support</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#fcd3aa" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={[styles.menuIcon, { backgroundColor: 'rgba(4,167,199,0.15)' }]}>
                <Ionicons name="information-circle" size={24} color="#04a7c7" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuText}>About</Text>
                <Text style={styles.menuSubtext}>App information and legal</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#fcd3aa" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(252,211,170,0.1)',
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
    fontSize: 24,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(252,211,170,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(252,211,170,0.15)',
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
  profileCard: {
    margin: 20,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#0091ad',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(252,211,170,0.1)',
  },
  profileCardGradient: {
    padding: 32,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatarRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
    borderColor: 'rgba(252,211,170,0.3)',
    top: -5,
    left: -5,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#0091ad',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  avatarText: {
    fontSize: 48,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    letterSpacing: 2,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4ade80',
    borderWidth: 3,
    borderColor: '#000000',
  },
  name: {
    fontSize: 28,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  email: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(252,211,170,0.8)',
    marginBottom: 24,
    textAlign: 'center',
  },
  actionButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#0091ad',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
    marginLeft: 8,
  },
  menuContainer: {
    paddingHorizontal: 20,
  },
  menuSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: getSystemFont('bold'),
    color: '#fcd3aa',
    marginBottom: 16,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(252,211,170,0.08)',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuText: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
    marginBottom: 2,
  },
  menuSubtext: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.6)',
  },
  bottomSpacing: {
    height: 40,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
    color: 'rgba(252,211,170,0.9)',
  },
  progressPercentage: {
    fontSize: 14,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: 'rgba(252,211,170,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#fcd3aa',
    borderRadius: 3,
  },
});

export default ProfileScreen;