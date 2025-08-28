// src/screens/onboarding/AppTutorialScreen.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getSystemFont } from '../../config/constants';
import { OnboardingService } from '../../services/OnboardingService';
import OnboardingProgressComponent from '../../components/onboarding/OnboardingProgress';
import { useAuthStore } from '../../store/authStore';

const { width } = Dimensions.get('window');

interface AppTutorialScreenProps {
  navigation: any;
  route?: {
    params?: {
      user?: any;
      onboardingStep?: any;
    };
  };
}

interface TutorialSlide {
  id: string;
  title: string;
  description: string;
  icon: string;
  features: string[];
  gradient: string[];
}

const tutorialSlides: TutorialSlide[] = [
  {
    id: 'discover',
    title: 'Discover Family',
    description: 'Find and connect with family members using our AI-powered matching system',
    icon: 'git-network',
    features: [
      'AI-powered family matching',
      'Build your family tree',
      'Connect with relatives'
    ],
    gradient: ['#0091ad', '#04a7c7']
  },
  {
    id: 'connect',
    title: 'Make Friends',
    description: 'Meet new people and build lasting friendships through shared interests',
    icon: 'people',
    features: [
      'Interest-based matching',
      'Send friend requests',
      'Build your social circle'
    ],
    gradient: ['#04a7c7', '#fcd3aa']
  },
  {
    id: 'chat',
    title: 'Stay Connected',
    description: 'Chat with family and friends using our secure messaging system',
    icon: 'chatbubbles',
    features: [
      'Real-time messaging',
      'Share photos and videos',
      'Voice messages'
    ],
    gradient: ['#fcd3aa', '#f59e0b']
  },
  {
    id: 'privacy',
    title: 'Your Privacy Matters',
    description: 'Control who can see your information and how you connect with others',
    icon: 'shield-checkmark',
    features: [
      'Granular privacy controls',
      'Block unwanted contacts',
      'Secure data handling'
    ],
    gradient: ['#22c55e', '#16a34a']
  }
];

const AppTutorialScreen: React.FC<AppTutorialScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const { user } = useAuthStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const userId = user?.id || route?.params?.user?.id;

  React.useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    if (userId) {
      const percentage = await OnboardingService.getCompletionPercentage(userId);
      setCompletionPercentage(percentage);
    }
  };

  const handleNext = () => {
    if (currentSlide < tutorialSlides.length - 1) {
      const nextSlide = currentSlide + 1;
      setCurrentSlide(nextSlide);
      scrollViewRef.current?.scrollTo({
        x: nextSlide * width,
        animated: true
      });
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      const prevSlide = currentSlide - 1;
      setCurrentSlide(prevSlide);
      scrollViewRef.current?.scrollTo({
        x: prevSlide * width,
        animated: true
      });
    }
  };

  const handleSkip = async () => {
    if (userId) {
      await OnboardingService.skipStep(userId, 'tutorial');
    }
    handleComplete();
  };

  const handleComplete = async () => {
    if (!userId) return;

    try {
      // Mark tutorial step as completed
      await OnboardingService.completeStep(userId, 'tutorial');
      
      // Get next step
      const nextStep = await OnboardingService.getNextStep(userId);
      
      if (nextStep && nextStep.screen) {
        navigation.navigate(nextStep.screen, {
          user: user || route?.params?.user,
          onboardingStep: nextStep
        });
      } else {
        navigation.navigate('OnboardingComplete', { 
          user: user || route?.params?.user 
        });
      }
    } catch (error) {
      console.error('Error completing tutorial:', error);
      Alert.alert('Error', 'Failed to continue. Please try again.');
    }
  };

  const handleScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    if (slideIndex !== currentSlide) {
      setCurrentSlide(slideIndex);
    }
  };

  const renderSlide = (slide: TutorialSlide, index: number) => (
    <View key={slide.id} style={[styles.slide, { width }]}>
      <View style={styles.slideContent}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={slide.gradient}
            style={styles.iconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name={slide.icon as any} size={48} color="#ffffff" />
          </LinearGradient>
        </View>

        {/* Content */}
        <View style={styles.textContent}>
          <Text style={styles.slideTitle}>{slide.title}</Text>
          <Text style={styles.slideDescription}>{slide.description}</Text>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          {slide.features.map((feature, featureIndex) => (
            <View key={featureIndex} style={styles.feature}>
              <View style={styles.featureBullet}>
                <Ionicons name="checkmark" size={12} color="#ffffff" />
              </View>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {tutorialSlides.map((_, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.dot,
            index === currentSlide ? styles.activeDot : styles.inactiveDot
          ]}
          onPress={() => {
            setCurrentSlide(index);
            scrollViewRef.current?.scrollTo({
              x: index * width,
              animated: true
            });
          }}
        />
      ))}
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
        
        <Text style={styles.headerTitle}>App Tutorial</Text>
        
        <TouchableOpacity style={styles.skipHeaderButton} onPress={handleSkip}>
          <Text style={styles.skipHeaderText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Progress */}
      <OnboardingProgressComponent
        currentStep={8}
        totalSteps={9}
        completionPercentage={completionPercentage}
        stepTitle="Learn YoFam"
        stepDescription="Discover how to make the most of your YoFam experience"
        showStepInfo={true}
      />

      {/* Slides */}
      <View style={styles.slidesContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {tutorialSlides.map(renderSlide)}
        </ScrollView>

        {/* Dots Indicator */}
        {renderDots()}
      </View>

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[
            styles.navButton,
            currentSlide === 0 && styles.navButtonDisabled
          ]}
          onPress={handlePrevious}
          disabled={currentSlide === 0}
        >
          <View style={styles.navButtonContent}>
            <Ionicons 
              name="chevron-back" 
              size={20} 
              color={currentSlide === 0 ? '#6b7280' : '#ffffff'} 
            />
            <Text style={[
              styles.navButtonText,
              currentSlide === 0 && styles.navButtonTextDisabled
            ]}>
              Previous
            </Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.slideCounter}>
          {currentSlide + 1} of {tutorialSlides.length}
        </Text>

        <TouchableOpacity
          style={styles.navButton}
          onPress={handleNext}
        >
          <LinearGradient
            colors={['#0091ad', '#04a7c7']}
            style={styles.navButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.navButtonText}>
              {currentSlide === tutorialSlides.length - 1 ? 'Finish' : 'Next'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#ffffff" />
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
  
  // Slides Container
  slidesContainer: {
    flex: 1,
    position: 'relative',
  },
  
  slide: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  
  slideContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Icon
  iconContainer: {
    marginBottom: 32,
  },
  
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  
  // Text Content
  textContent: {
    alignItems: 'center',
    marginBottom: 32,
  },
  
  slideTitle: {
    fontSize: 28,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  
  slideDescription: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  
  // Features
  featuresContainer: {
    width: '100%',
    gap: 16,
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
  
  featureBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  featureText: {
    fontSize: 16,
    fontFamily: getSystemFont('medium'),
    color: '#ffffff',
    flex: 1,
  },
  
  // Dots
  dotsContainer: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  
  activeDot: {
    backgroundColor: '#0091ad',
  },
  
  inactiveDot: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  
  // Navigation
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  
  navButton: {
    borderRadius: 12,
    overflow: 'hidden',
    minWidth: 100,
  },
  
  navButtonDisabled: {
    opacity: 0.5,
  },
  
  navButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  
  navButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  
  navButtonText: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
  },
  
  navButtonTextDisabled: {
    color: '#6b7280',
  },
  
  slideCounter: {
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
    color: 'rgba(255,255,255,0.7)',
  },
});

export default AppTutorialScreen;