import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  Alert,
  Animated,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../../store/authStore';
import { apiService } from '../../../services/api';
import { API_ENDPOINTS } from '../../../constants/api';
import { COLORS } from '../../../config/constants';

const { width, height } = Dimensions.get('window');

interface ModernProfileProps {
  navigation: any;
  route: any;
}

const ModernProfileScreen: React.FC<ModernProfileProps> = ({ navigation, route }) => {
  const { user: authUser } = useAuthStore();
  const [user, setUser] = useState(route.params?.user || authUser);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [completionData, setCompletionData] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // Fetch profile data when screen focuses
  useFocusEffect(
    React.useCallback(() => {
      fetchUserProfile();
      checkProfileCompletion();
    }, [])
  );

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(API_ENDPOINTS.GET_PROFILE);
      
      if (response.success) {
        console.log('👤 Profile data received:', {
          profilePhotoUrl: response.data.user?.profile_photo_url,
          profilePictureUrl: response.data.user?.profile_picture_url,
          avatarUrl: response.data.user?.avatar_url,
          user: response.data.user?.first_name
        });
        setUser(response.data.user);
        setCompletionData(response.data);
        useAuthStore.getState().setUser(response.data.user);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkProfileCompletion = async () => {
    try {
      const response = await apiService.get('/ai/profile-completion-analysis');
      if (response.success) {
        setCompletionData(response.data);
      }
    } catch (error) {
      console.log('Completion check error:', error);
    }
  };

  const handleImagePicker = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadProfilePhoto(result.assets[0]);
    }
  };

  const uploadProfilePhoto = async (image: any) => {
    try {
      setUploadingPhoto(true);
      
      const formData = new FormData();
      formData.append('photo', {
        uri: image.uri,
        type: 'image/jpeg',
        name: 'profile-photo.jpg',
      } as any);

      const response = await apiService.upload('/users/profile/photo', formData);
      
      if (response.success) {
        setUser(response.data.user);
        useAuthStore.getState().setUser(response.data.user);
        Alert.alert('Success', 'Profile photo updated successfully!');
      } else {
        Alert.alert('Error', response.error || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload profile photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserProfile();
    await checkProfileCompletion();
    setRefreshing(false);
  };

  const getCompletionPercentage = () => {
    // Try to get completion percentage from multiple sources
    return user?.profile_completion_percentage || 
           user?.completionPercentage || 
           completionData?.percentage || 
           0;
  };

  const renderProfileHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Profile</Text>
        
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('EditProfile', { user })}
        >
          <Ionicons name="create-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.profileSection}>
        <TouchableOpacity 
          style={styles.profileImageContainer}
          onPress={handleImagePicker} 
          disabled={uploadingPhoto}
        >
          {(() => {
            const urls = [user?.profile_photo_url, user?.profilePhotoUrl, user?.profile_picture_url, user?.profilePictureUrl, user?.avatarUrl, user?.avatar_url, user?.profileImage];
            const cloudinaryUrl = urls.find(url => url && url.includes('cloudinary.com'));
            const validUrl = cloudinaryUrl || urls.find(url => url && !url.includes(':3010')) || urls.find(url => url);
            return validUrl;
          })() ? (
            <Image
              source={{ uri: (() => {
                const urls = [user?.profile_photo_url, user?.profilePhotoUrl, user?.profile_picture_url, user?.profilePictureUrl, user?.avatarUrl, user?.avatar_url, user?.profileImage];
                const cloudinaryUrl = urls.find(url => url && url.includes('cloudinary.com'));
                return cloudinaryUrl || urls.find(url => url && !url.includes(':3010')) || urls.find(url => url);
              })() }}
              style={styles.profileImage}
              onError={(error) => {
                const urls = [user?.profile_photo_url, user?.profilePhotoUrl, user?.profile_picture_url, user?.profilePictureUrl, user?.avatarUrl, user?.avatar_url, user?.profileImage];
                const imageUrl = urls.find(url => url && url.includes('cloudinary.com')) || urls.find(url => url);
                console.log('❌ Profile image failed to load:', imageUrl, error.nativeEvent.error);
              }}
              onLoad={() => {
                const urls = [user?.profile_photo_url, user?.profilePhotoUrl, user?.profile_picture_url, user?.profilePictureUrl, user?.avatarUrl, user?.avatar_url, user?.profileImage];
                const imageUrl = urls.find(url => url && url.includes('cloudinary.com')) || urls.find(url => url);
                console.log('✅ Profile image loaded successfully:', imageUrl);
              }}
            />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Ionicons name="person" size={40} color={COLORS.textSecondary} />
            </View>
          )}
          
          {uploadingPhoto ? (
            <View style={styles.uploadOverlay}>
              <ActivityIndicator color={COLORS.primary} size="small" />
            </View>
          ) : (
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={16} color={COLORS.text} />
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.profileInfo}>
          <Text style={styles.userName}>
            {user?.fullName || user?.full_name || user?.username || 'Your Name'}
          </Text>
          <Text style={styles.userHandle}>
            @{user?.username || 'username'}
          </Text>
          
          {/* Completion Progress */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${getCompletionPercentage()}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {getCompletionPercentage()}% Complete
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderInfoSection = (title: string, value: string | null, icon: string) => {
    if (!value || value === '') {
      return (
        <TouchableOpacity 
          style={styles.infoItemEmpty}
          onPress={() => navigation.navigate('EditProfile', { user })}
        >
          <View style={styles.infoIcon}>
            <Ionicons name={icon as any} size={18} color={COLORS.textSecondary} />
          </View>
          <Text style={styles.infoTextEmpty}>Add {title}</Text>
          <Ionicons name="add" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.infoItem}>
        <View style={styles.infoIcon}>
          <Ionicons name={icon as any} size={18} color={COLORS.primary} />
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>{title}</Text>
          <Text style={styles.infoValue}>{value}</Text>
        </View>
      </View>
    );
  };

  const renderStatsCard = () => (
    <View style={styles.statsCard}>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>
          {user?.family_info ? Object.keys(user.family_info).length : 0}
        </Text>
        <Text style={styles.statLabel}>Family</Text>
      </View>
      
      <View style={styles.statDivider} />
      
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>
          {user?.education ? Object.keys(user.education).length : 0}
        </Text>
        <Text style={styles.statLabel}>Education</Text>
      </View>
      
      <View style={styles.statDivider} />
      
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>
          {getCompletionPercentage()}%
        </Text>
        <Text style={styles.statLabel}>Complete</Text>
      </View>
    </View>
  );

  if (loading && !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {renderProfileHeader()}
        
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {renderStatsCard()}
          
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            {renderInfoSection('Email', user?.email, 'mail')}
            {renderInfoSection('Phone', user?.phone, 'call')}
            {renderInfoSection('Location', user?.current_address || user?.location, 'location')}
            {renderInfoSection('Bio', user?.bio, 'information-circle')}
            
            <Text style={styles.sectionTitle}>Family & Background</Text>
            
            {renderInfoSection('Father', user?.familyInfo?.father_name || user?.father_name, 'man')}
            {renderInfoSection('Mother', user?.familyInfo?.mother_name || user?.mother_name, 'woman')}
            {renderInfoSection('Profession', user?.personalInfo?.profession || user?.profession, 'briefcase')}
            {renderInfoSection('Education', user?.education?.university || user?.university, 'school')}
          </View>

          {/* Review & Edit All Responses Button */}
          <TouchableOpacity
            style={styles.reviewButton}
            onPress={() => navigation.navigate('ProfileQAReview')}
          >
            <View style={styles.reviewButtonContent}>
              <View style={styles.reviewButtonLeft}>
                <View style={styles.reviewButtonIcon}>
                  <Ionicons name="list-circle" size={24} color={COLORS.primary} />
                </View>
                <View style={styles.reviewButtonInfo}>
                  <Text style={styles.reviewButtonTitle}>Review All Responses</Text>
                  <Text style={styles.reviewButtonSubtitle}>
                    View and edit your AI chat responses
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </View>
          </TouchableOpacity>

          {/* Complete Profile CTA for incomplete profiles */}
          {getCompletionPercentage() < 80 && (
            <TouchableOpacity
              style={styles.completeButton}
              onPress={() => navigation.navigate('ProgressiveProfile', { user })}
            >
              <Ionicons name="rocket-outline" size={20} color={COLORS.text} />
              <Text style={styles.completeButtonText}>
                Complete Your Profile ({getCompletionPercentage()}%)
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.surface,
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 40,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  profileInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  userHandle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: 120,
    height: 6,
    backgroundColor: COLORS.background,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  content: {
    padding: 20,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.textSecondary,
    marginHorizontal: 16,
    opacity: 0.3,
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
    marginTop: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  infoItemEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
    borderStyle: 'dashed',
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  infoTextEmpty: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  reviewButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reviewButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reviewButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reviewButtonInfo: {
    flex: 1,
  },
  reviewButtonTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  reviewButtonSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 8,
  },
});

export default ModernProfileScreen;