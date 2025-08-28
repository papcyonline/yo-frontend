// src/screens/onboarding/PermissionsSetupScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as Contacts from 'expo-contacts';
import { getSystemFont } from '../../config/constants';
import { OnboardingService } from '../../services/OnboardingService';
import { NotificationService } from '../../services/NotificationService';
import OnboardingProgressComponent from '../../components/onboarding/OnboardingProgress';
import { useAuthStore } from '../../store/authStore';

interface PermissionsSetupScreenProps {
  navigation: any;
  route?: {
    params?: {
      user?: any;
      onboardingStep?: any;
    };
  };
}

interface Permission {
  id: string;
  title: string;
  description: string;
  icon: string;
  isRequired: boolean;
  isGranted: boolean;
  requestFunction: () => Promise<boolean>;
}

const PermissionsSetupScreen: React.FC<PermissionsSetupScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const { user } = useAuthStore();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [currentStep, setCurrentStep] = useState(2);

  const userId = user?.id || route?.params?.user?.id;

  useEffect(() => {
    initializePermissions();
    loadProgress();
  }, []);

  const loadProgress = async () => {
    if (userId) {
      const percentage = await OnboardingService.getCompletionPercentage(userId);
      setCompletionPercentage(percentage);
    }
  };

  const initializePermissions = async () => {
    try {
      setLoading(true);
      
      const permissionsList: Permission[] = [
        {
          id: 'camera',
          title: 'Camera & Photos',
          description: 'Take photos and select from gallery for your profile',
          icon: 'camera',
          isRequired: false,
          isGranted: false,
          requestFunction: requestCameraPermission,
        },
        {
          id: 'location',
          title: 'Location Services',
          description: 'Find nearby family members and local connections',
          icon: 'location',
          isRequired: false,
          isGranted: false,
          requestFunction: requestLocationPermission,
        },
        {
          id: 'notifications',
          title: 'Push Notifications',
          description: 'Get notified about new matches and messages',
          icon: 'notifications',
          isRequired: false,
          isGranted: false,
          requestFunction: requestNotificationPermission,
        },
        {
          id: 'contacts',
          title: 'Contacts',
          description: 'Find family and friends already on YoFam',
          icon: 'people',
          isRequired: false,
          isGranted: false,
          requestFunction: requestContactsPermission,
        },
      ];

      // Check current permission status
      const updatedPermissions = await Promise.all(
        permissionsList.map(async (permission) => {
          const isGranted = await checkPermissionStatus(permission.id);
          return { ...permission, isGranted };
        })
      );

      setPermissions(updatedPermissions);
    } catch (error) {
      console.error('Error initializing permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkPermissionStatus = async (permissionId: string): Promise<boolean> => {
    try {
      switch (permissionId) {
        case 'camera':
          const cameraStatus = await ImagePicker.getCameraPermissionsAsync();
          const mediaStatus = await ImagePicker.getMediaLibraryPermissionsAsync();
          return cameraStatus.granted && mediaStatus.granted;
          
        case 'location':
          const locationStatus = await Location.getForegroundPermissionsAsync();
          return locationStatus.granted;
          
        case 'notifications':
          const notificationStatus = await Notifications.getPermissionsAsync();
          return notificationStatus.granted;
          
        case 'contacts':
          const contactsStatus = await Contacts.getPermissionsAsync();
          return contactsStatus.granted;
          
        default:
          return false;
      }
    } catch (error) {
      console.error(`Error checking ${permissionId} permission:`, error);
      return false;
    }
  };

  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      const cameraResult = await ImagePicker.requestCameraPermissionsAsync();
      const mediaResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return cameraResult.granted && mediaResult.granted;
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return false;
    }
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      const result = await Location.requestForegroundPermissionsAsync();
      return result.granted;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    try {
      const hasPermission = await NotificationService.requestPermissions();
      if (hasPermission) {
        // Initialize the full notification service if permission is granted
        try {
          await NotificationService.initialize();
          console.log('✅ Push notifications initialized during onboarding');
        } catch (error) {
          console.warn('⚠️ Failed to initialize notifications during onboarding:', error);
        }
      }
      return hasPermission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const requestContactsPermission = async (): Promise<boolean> => {
    try {
      const result = await Contacts.requestPermissionsAsync();
      return result.granted;
    } catch (error) {
      console.error('Error requesting contacts permission:', error);
      return false;
    }
  };

  const handleRequestPermission = async (permission: Permission) => {
    try {
      const granted = await permission.requestFunction();
      
      setPermissions(prev =>
        prev.map(p =>
          p.id === permission.id ? { ...p, isGranted: granted } : p
        )
      );

      if (granted) {
        // Show success feedback
      } else {
        Alert.alert(
          'Permission Denied',
          `${permission.title} permission was denied. You can enable it later in Settings.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      Alert.alert('Error', 'Failed to request permission. Please try again.');
    }
  };

  const handleRequestAllPermissions = async () => {
    try {
      setLoading(true);
      
      for (const permission of permissions) {
        if (!permission.isGranted) {
          await handleRequestPermission(permission);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error requesting all permissions:', error);
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    if (!userId) return;

    try {
      // Mark permissions step as completed
      await OnboardingService.completeStep(userId, 'permissions');
      
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
      'Skip Permissions?',
      'You can grant permissions later in Settings. Some features may be limited without permissions.',
      [
        { text: 'Continue Setup', style: 'cancel' },
        {
          text: 'Skip',
          style: 'default',
          onPress: handleContinue
        }
      ]
    );
  };

  const renderPermissionItem = (permission: Permission) => (
    <View key={permission.id} style={styles.permissionItem}>
      <View style={styles.permissionInfo}>
        <View style={[
          styles.permissionIcon,
          permission.isGranted ? styles.permissionIconGranted : styles.permissionIconPending
        ]}>
          <Ionicons 
            name={permission.icon as any} 
            size={24} 
            color={permission.isGranted ? '#ffffff' : '#9ca3af'} 
          />
        </View>
        
        <View style={styles.permissionDetails}>
          <Text style={styles.permissionTitle}>{permission.title}</Text>
          <Text style={styles.permissionDescription}>{permission.description}</Text>
          
          {permission.isRequired && (
            <View style={styles.requiredBadge}>
              <Text style={styles.requiredBadgeText}>Required</Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.permissionButton,
          permission.isGranted ? styles.permissionButtonGranted : styles.permissionButtonPending
        ]}
        onPress={() => !permission.isGranted && handleRequestPermission(permission)}
        disabled={permission.isGranted}
      >
        {permission.isGranted ? (
          <Ionicons name="checkmark" size={16} color="#ffffff" />
        ) : (
          <Text style={styles.permissionButtonText}>Grant</Text>
        )}
      </TouchableOpacity>
    </View>
  );

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
        
        <Text style={styles.headerTitle}>Permissions Setup</Text>
        
        <TouchableOpacity style={styles.skipHeaderButton} onPress={handleSkip}>
          <Text style={styles.skipHeaderText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Progress */}
      <OnboardingProgressComponent
        currentStep={currentStep}
        totalSteps={9}
        completionPercentage={completionPercentage}
        stepTitle="Grant Permissions"
        stepDescription="Enable features for the best YoFam experience"
        showStepInfo={true}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Introduction */}
        <View style={styles.introSection}>
          <View style={styles.introIcon}>
            <LinearGradient
              colors={['#0091ad', '#04a7c7']}
              style={styles.introIconGradient}
            >
              <Ionicons name="shield-checkmark" size={32} color="#ffffff" />
            </LinearGradient>
          </View>
          
          <Text style={styles.introTitle}>App Permissions</Text>
          <Text style={styles.introDescription}>
            Grant permissions to unlock YoFam's full potential. You can change these settings anytime in your device settings.
          </Text>
        </View>

        {/* Permissions List */}
        <View style={styles.permissionsContainer}>
          {permissions.map(renderPermissionItem)}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={styles.grantAllButton}
            onPress={handleRequestAllPermissions}
            disabled={loading}
          >
            <LinearGradient
              colors={['#0091ad', '#04a7c7']}
              style={styles.grantAllGradient}
            >
              <Ionicons name="checkmark-done" size={20} color="#ffffff" />
              <Text style={styles.grantAllText}>Grant All Permissions</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Privacy Note */}
        <View style={styles.privacyNote}>
          <Ionicons name="information-circle" size={16} color="#fcd3aa" />
          <Text style={styles.privacyText}>
            Your privacy is important to us. We only use permissions to enhance your experience and never share your data without consent.
          </Text>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          disabled={loading}
        >
          <LinearGradient
            colors={['#0091ad', '#04a7c7']}
            style={styles.continueGradient}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#ffffff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  },
  
  // Introduction
  introSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  
  introIcon: {
    marginBottom: 16,
  },
  
  introIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
  
  // Permissions
  permissionsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  
  permissionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  
  permissionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  permissionIconGranted: {
    backgroundColor: '#0091ad',
  },
  
  permissionIconPending: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  
  permissionDetails: {
    flex: 1,
  },
  
  permissionTitle: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
    marginBottom: 4,
  },
  
  permissionDescription: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
  },
  
  requiredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  
  requiredBadgeText: {
    fontSize: 10,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
  },
  
  permissionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  
  permissionButtonGranted: {
    backgroundColor: '#22c55e',
  },
  
  permissionButtonPending: {
    backgroundColor: 'rgba(0,145,173,0.2)',
    borderWidth: 1,
    borderColor: '#0091ad',
  },
  
  permissionButtonText: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
    color: '#0091ad',
  },
  
  // Quick Actions
  quickActionsContainer: {
    marginBottom: 24,
  },
  
  grantAllButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  
  grantAllGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  
  grantAllText: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
  },
  
  // Privacy Note
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: 'rgba(252,211,170,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(252,211,170,0.3)',
    marginBottom: 20,
  },
  
  privacyText: {
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

export default PermissionsSetupScreen;