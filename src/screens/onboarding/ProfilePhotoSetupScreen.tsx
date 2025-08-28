// src/screens/onboarding/ProfilePhotoSetupScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getSystemFont } from '../../config/constants';
import { OnboardingService } from '../../services/OnboardingService';
import { useTranslation } from '../../i18n/simpleI18n';
import OnboardingProgressComponent from '../../components/onboarding/OnboardingProgress';
import PhotoPicker from '../../components/media/PhotoPicker';
import { MediaService } from '../../services/MediaServiceExpress';
import { useAuthStore } from '../../store/authStore';

interface ProfilePhotoSetupScreenProps {
  navigation: any;
  route?: {
    params?: {
      user?: any;
      onboardingStep?: any;
    };
  };
}

const ProfilePhotoSetupScreen: React.FC<ProfilePhotoSetupScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [currentStep, setCurrentStep] = useState(3);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);

  const userId = user?.id || route?.params?.user?.id;

  useEffect(() => {
    loadProgress();
    // Check if user already has a profile photo
    if (user?.profile_picture_url || user?.profilePhotoUrl) {
      setSelectedImageUri(user.profile_picture_url || user.profilePhotoUrl);
    }
  }, []);

  const loadProgress = async () => {
    if (userId) {
      const percentage = await OnboardingService.getCompletionPercentage(userId);
      setCompletionPercentage(percentage);
    }
  };

  const handleImageSelected = (imageUri: string) => {
    setSelectedImageUri(imageUri);
    setShowPhotoPicker(false);
  };

  const handleImageUploaded = async (mediaFile: any) => {
    try {
      setUploading(false);
      setSelectedImageUri(mediaFile.file_url);
      setShowPhotoPicker(false);
      
      // Update user store if needed
      // You might want to update the user's profile photo URL in your auth store
      
      Alert.alert('Success', 'Profile photo uploaded successfully!');
    } catch (error) {
      console.error('Error handling uploaded image:', error);
      setUploading(false);
      Alert.alert('Error', 'Failed to process uploaded image');
    }
  };

  const handleUploadPhoto = async () => {
    if (!selectedImageUri) return;

    try {
      setUploading(true);
      
      // Upload the selected image
      const mediaFile = await MediaService.uploadProfileImage(selectedImageUri);
      
      if (mediaFile) {
        handleImageUploaded(mediaFile);
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      setUploading(false);
      Alert.alert('Error', 'Failed to upload photo. Please try again.');
    }
  };

  const handleContinue = async () => {
    if (!userId) return;

    try {
      // Mark profile photo step as completed
      await OnboardingService.completeStep(userId, 'profile_photo');
      
      // Get next step
      const nextStep = await OnboardingService.getNextStep(userId);
      
      if (nextStep && nextStep.screen) {
        navigation.navigate(nextStep.screen, {
          user: user || route?.params?.user,
          onboardingStep: nextStep
        });
      } else {
        navigation.navigate('MainApp', { user: user || route?.params?.user });
      }
    } catch (error) {
      console.error('Error continuing onboarding:', error);
      Alert.alert('Error', 'Failed to continue. Please try again.');
    }
  };

  const handleSkip = async () => {
    Alert.alert(
      'Skip Profile Photo?',
      'You can add a profile photo later in your profile settings. A photo helps others recognize you.',
      [
        { text: 'Add Photo', style: 'cancel' },
        {
          text: 'Skip for Now',
          style: 'default',
          onPress: async () => {
            if (userId) {
              await OnboardingService.skipStep(userId, 'profile_photo');
            }
            handleContinue();
          }
        }
      ]
    );
  };

  const renderProfilePhotoArea = () => {
    if (selectedImageUri) {
      return (
        <View style={styles.photoContainer}>
          <View style={styles.photoFrame}>
            <Image source={{ uri: selectedImageUri }} style={styles.profilePhoto} />
            
            {/* Overlay buttons */}
            <View style={styles.photoOverlay}>
              <TouchableOpacity
                style={styles.changePhotoButton}
                onPress={() => setShowPhotoPicker(true)}
              >
                <Ionicons name="camera" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
          
          <Text style={styles.photoLabel}>{t('onboarding.lookingGreat')}</Text>
          
          {/* Upload button if photo is not uploaded yet */}
          {!uploading && selectedImageUri && !selectedImageUri.startsWith('http') && (
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleUploadPhoto}
            >
              <LinearGradient
                colors={['#0091ad', '#04a7c7']}
                style={styles.uploadGradient}
              >
                <Ionicons name="cloud-upload" size={16} color="#ffffff" />
                <Text style={styles.uploadButtonText}>{t('onboarding.uploadPhoto')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <View style={styles.placeholderContainer}>
        <TouchableOpacity
          style={styles.addPhotoButton}
          onPress={() => setShowPhotoPicker(true)}
        >
          <LinearGradient
            colors={['rgba(0,145,173,0.2)', 'rgba(4,167,199,0.1)']}
            style={styles.addPhotoGradient}
          >
            <View style={styles.addPhotoIcon}>
              <LinearGradient
                colors={['#0091ad', '#04a7c7']}
                style={styles.addPhotoIconGradient}
              >
                <Ionicons name="camera" size={32} color="#ffffff" />
              </LinearGradient>
            </View>
            
            <Text style={styles.addPhotoTitle}>{t('onboarding.addProfilePhoto')}</Text>
            <Text style={styles.addPhotoDescription}>
              Help others recognize you with a great profile photo
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fcd3aa" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>{t('profile.profilePhoto')}</Text>
        
        <TouchableOpacity style={styles.skipHeaderButton} onPress={handleSkip}>
          <Text style={styles.skipHeaderText}>{t('common.skip')}</Text>
        </TouchableOpacity>
      </View>

      {/* Progress */}
      <OnboardingProgressComponent
        currentStep={currentStep}
        totalSteps={9}
        completionPercentage={completionPercentage}
        stepTitle="Add Profile Photo"
        stepDescription="Upload a photo to help others recognize you"
        showStepInfo={true}
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Introduction */}
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>{t('profile.profilePhoto')}</Text>
          <Text style={styles.introDescription}>
            A profile photo makes your profile more trustworthy and helps family members recognize you.
          </Text>
        </View>

        {/* Photo Area */}
        {renderProfilePhotoArea()}

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>{t('onboarding.photoTips')}</Text>
          
          <View style={styles.tip}>
            <View style={styles.tipIcon}>
              <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
            </View>
            <Text style={styles.tipText}>{t('onboarding.photoTip1')}</Text>
          </View>
          
          <View style={styles.tip}>
            <View style={styles.tipIcon}>
              <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
            </View>
            <Text style={styles.tipText}>{t('onboarding.photoTip2')}</Text>
          </View>
          
          <View style={styles.tip}>
            <View style={styles.tipIcon}>
              <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
            </View>
            <Text style={styles.tipText}>{t('onboarding.photoTip3')}</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedImageUri && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={uploading}
        >
          <LinearGradient
            colors={selectedImageUri ? ['#0091ad', '#04a7c7'] : ['#374151', '#4b5563']}
            style={styles.continueGradient}
          >
            {uploading ? (
              <>
                <Text style={styles.continueButtonText}>Uploading...</Text>
              </>
            ) : (
              <>
                <Text style={styles.continueButtonText}>
                  {selectedImageUri ? 'Continue' : 'Skip for Now'}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#ffffff" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Photo Picker Modal */}
      <PhotoPicker
        visible={showPhotoPicker}
        onClose={() => setShowPhotoPicker(false)}
        onImageSelected={handleImageSelected}
        onImageUploaded={handleImageUploaded}
        context="profile"
        title="Profile Photo"
        autoUpload={true}
        aspectRatio={[1, 1]}
        quality={0.8}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(252,211,170,0.1)',
  },
  
  headerTitle: {
    fontSize: 18,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
  },
  
  skipHeaderButton: {
    padding: 8,
  },
  
  skipHeaderText: {
    fontSize: 16,
    fontFamily: getSystemFont('medium'),
    color: '#9ca3af',
  },
  
  // Content
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  
  // Introduction
  introSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  
  introTitle: {
    fontSize: 24,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginBottom: 8,
  },
  
  introDescription: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  
  // Photo Container (when photo is selected)
  photoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  
  photoFrame: {
    position: 'relative',
    marginBottom: 16,
  },
  
  profilePhoto: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
    borderColor: '#0091ad',
  },
  
  photoOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
  
  changePhotoButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0091ad',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  
  photoLabel: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#22c55e',
    marginBottom: 16,
  },
  
  uploadButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  
  uploadGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  
  uploadButtonText: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
  },
  
  // Placeholder (when no photo)
  placeholderContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  
  addPhotoButton: {
    borderRadius: 20,
    overflow: 'hidden',
    width: '100%',
  },
  
  addPhotoGradient: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(0,145,173,0.3)',
  },
  
  addPhotoIcon: {
    marginBottom: 16,
  },
  
  addPhotoIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  addPhotoTitle: {
    fontSize: 20,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
    marginBottom: 8,
  },
  
  addPhotoDescription: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Tips
  tipsContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  
  tipsTitle: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#fcd3aa',
    marginBottom: 12,
  },
  
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 12,
  },
  
  tipIcon: {
    marginTop: 2,
  },
  
  tipText: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
    flex: 1,
  },
  
  // Footer
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  
  continueButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  
  continueButtonDisabled: {
    opacity: 0.6,
  },
  
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  
  continueButtonText: {
    fontSize: 18,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
  },
});

export default ProfilePhotoSetupScreen;