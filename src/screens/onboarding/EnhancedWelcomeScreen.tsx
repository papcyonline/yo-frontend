// src/screens/onboarding/EnhancedWelcomeScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getSystemFont } from '../../config/constants';
import { OnboardingService, OnboardingProgress } from '../../services/OnboardingService';
import OnboardingProgressComponent from '../../components/onboarding/OnboardingProgress';
import { useAuthStore } from '../../store/authStore';

interface EnhancedWelcomeScreenProps {
  navigation: any;
  route?: {
    params?: {
      user?: any;
      skipIntro?: boolean;
    };
  };
}

const EnhancedWelcomeScreen: React.FC<EnhancedWelcomeScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const { user } = useAuthStore();
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  const userId = user?.id || route?.params?.user?.id;

  useEffect(() => {
    initializeOnboarding();
  }, [userId]);

  const initializeOnboarding = async () => {
    if (!userId) {
      console.warn('No user ID available for onboarding');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Try to load existing progress first
      let userProgress = await OnboardingService.getProgress(userId);
      
      // If no progress exists, initialize it
      if (!userProgress) {
        userProgress = await OnboardingService.initializeOnboarding(userId);
      }
      
      setProgress(userProgress);
      
      // Get completion percentage
      const percentage = await OnboardingService.getCompletionPercentage(userId);
      setCompletionPercentage(percentage);
      
      // Mark welcome step as completed
      if (userProgress && !userProgress.completedSteps.includes('welcome')) {
        const updatedProgress = await OnboardingService.completeStep(userId, 'welcome');
        setProgress(updatedProgress);
      }
      
    } catch (error) {
      console.error('Error initializing onboarding:', error);
      Alert.alert('Error', 'Failed to initialize onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    if (!userId || !progress) return;

    try {
      // Get next step
      const nextStep = await OnboardingService.getNextStep(userId);
      
      if (nextStep && nextStep.screen) {
        // Navigate to next step
        navigation.navigate(nextStep.screen, { 
          user: user || route?.params?.user,
          onboardingStep: nextStep 
        });
      } else {
        // All steps completed, go to main app
        navigation.navigate('MainApp', { user: user || route?.params?.user });
      }
    } catch (error) {
      console.error('Error continuing onboarding:', error);
      Alert.alert('Error', 'Failed to continue. Please try again.');
    }
  };

  const handleSkipSetup = () => {
    Alert.alert(
      'Skip Setup?',
      'You can complete your profile later in settings. Some features may be limited until your profile is complete.',
      [
        { text: 'Continue Setup', style: 'cancel' },
        { 
          text: 'Skip for Now', 
          style: 'destructive',
          onPress: () => {
            navigation.navigate('MainApp', { user: user || route?.params?.user });
          }
        }
      ]
    );
  };

  const renderWelcomeContent = () => (
    <View style={styles.welcomeContent}>
      <View style={styles.logoContainer}>
        <LinearGradient
          colors={['#0091ad', '#04a7c7', '#fcd3aa']}
          style={styles.logoGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="people" size={48} color="#ffffff" />
        </LinearGradient>
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title}>Welcome to YoFam!</Text>
        <Text style={styles.subtitle}>
          Connect with family, make new friends, and build meaningful relationships through our AI-powered matching system.
        </Text>
      </View>

      <View style={styles.featuresContainer}>
        <View style={styles.feature}>
          <View style={styles.featureIcon}>
            <Ionicons name="git-network" size={20} color="#0091ad" />
          </View>
          <Text style={styles.featureText}>Build Your Family Tree</Text>
        </View>
        
        <View style={styles.feature}>
          <View style={styles.featureIcon}>
            <Ionicons name="people" size={20} color="#04a7c7" />
          </View>
          <Text style={styles.featureText}>Find New Connections</Text>
        </View>
        
        <View style={styles.feature}>
          <View style={styles.featureIcon}>
            <Ionicons name="sparkles" size={20} color="#fcd3aa" />
          </View>
          <Text style={styles.featureText}>AI-Powered Matching</Text>
        </View>
        
        <View style={styles.feature}>
          <View style={styles.featureIcon}>
            <Ionicons name="chatbubbles" size={20} color="#0091ad" />
          </View>
          <Text style={styles.featureText}>Real-time Messaging</Text>
        </View>
      </View>
    </View>
  );

  const renderProgressSection = () => {
    if (!progress) return null;

    return (
      <View style={styles.progressSection}>
        <Text style={styles.progressTitle}>Let's Get You Started</Text>
        <OnboardingProgressComponent
          currentStep={progress.currentStep}
          totalSteps={progress.totalSteps}
          completionPercentage={completionPercentage}
          stepTitle={progress.steps[progress.currentStep - 1]?.title}
          stepDescription={progress.steps[progress.currentStep - 1]?.description}
          showStepInfo={true}
        />
      </View>
    );
  };

  const renderActionButtons = () => (
    <View style={styles.actionsContainer}>
      <TouchableOpacity
        style={styles.continueButton}
        onPress={handleContinue}
        disabled={loading}
      >
        <LinearGradient
          colors={['#0091ad', '#04a7c7']}
          style={styles.continueGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.continueButtonText}>
            {progress?.isCompleted ? 'Start Exploring' : 'Continue Setup'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#ffffff" />
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleSkipSetup}
      >
        <Text style={styles.skipButtonText}>Skip Setup for Now</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={['#0091ad', '#04a7c7', '#fcd3aa']}
            style={styles.loadingIcon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="people" size={32} color="#ffffff" />
          </LinearGradient>
          <Text style={styles.loadingText}>Preparing your journey...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderWelcomeContent()}
        {renderProgressSection()}
        {renderActionButtons()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  
  scrollView: {
    flex: 1,
  },
  
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  
  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  loadingText: {
    fontSize: 16,
    fontFamily: getSystemFont('medium'),
    color: 'rgba(255,255,255,0.7)',
  },
  
  // Welcome Content
  welcomeContent: {
    alignItems: 'center',
    marginBottom: 32,
  },
  
  logoContainer: {
    marginBottom: 32,
  },
  
  logoGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#0091ad',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  
  textContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  
  title: {
    fontSize: 32,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  
  subtitle: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  
  // Features
  featuresContainer: {
    gap: 16,
    width: '100%',
  },
  
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  featureText: {
    fontSize: 16,
    fontFamily: getSystemFont('medium'),
    color: '#ffffff',
    flex: 1,
  },
  
  // Progress Section
  progressSection: {
    marginBottom: 32,
  },
  
  progressTitle: {
    fontSize: 20,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  
  // Actions
  actionsContainer: {
    gap: 16,
  },
  
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#0091ad',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
  },
  
  continueButtonText: {
    fontSize: 18,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
  },
  
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  
  skipButtonText: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.6)',
  },
});

export default EnhancedWelcomeScreen;