// src/screens/onboarding/OnboardingCompleteScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getSystemFont } from '../../config/constants';
import { OnboardingService } from '../../services/OnboardingService';
import OnboardingProgressComponent from '../../components/onboarding/OnboardingProgress';
import { useAuthStore } from '../../store/authStore';

interface OnboardingCompleteScreenProps {
  navigation: any;
  route?: {
    params?: {
      user?: any;
      onboardingStep?: any;
    };
  };
}

const OnboardingCompleteScreen: React.FC<OnboardingCompleteScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const { user } = useAuthStore();
  const [completionPercentage, setCompletionPercentage] = useState(100);
  const [loading, setLoading] = useState(false);
  const [achievements, setAchievements] = useState<string[]>([]);

  const userId = user?.id || route?.params?.user?.id;

  useEffect(() => {
    completeOnboarding();
  }, []);

  const completeOnboarding = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      
      // Mark completion step as completed
      await OnboardingService.completeStep(userId, 'completion');
      
      // Get final completion percentage
      const percentage = await OnboardingService.getCompletionPercentage(userId);
      setCompletionPercentage(percentage);
      
      // Set achievements based on completed steps
      const progress = await OnboardingService.getProgress(userId);
      if (progress) {
        const completedSteps = progress.completedSteps;
        const userAchievements = [];
        
        if (completedSteps.includes('profile_photo')) {
          userAchievements.push('Profile Complete');
        }
        if (completedSteps.includes('permissions')) {
          userAchievements.push('Permissions Granted');
        }
        if (completedSteps.includes('tutorial')) {
          userAchievements.push('Tutorial Master');
        }
        if (completedSteps.includes('personal_details')) {
          userAchievements.push('Profile Builder');
        }
        
        userAchievements.push('YoFam Member');
        setAchievements(userAchievements);
      }
      
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartExploring = () => {
    // Navigate to main app
    navigation.reset({
      index: 0,
      routes: [{ 
        name: 'MainApp', 
        params: { user: user || route?.params?.user } 
      }],
    });
  };

  const handleViewProfile = () => {
    navigation.navigate('Profile', { 
      user: user || route?.params?.user,
      isOwnProfile: true 
    });
  };

  const handleInviteFriends = () => {
    // You could implement a share functionality here
    Alert.alert(
      'Invite Friends',
      'Share YoFam with your family and friends to start building your connections!',
      [
        { text: 'Later', style: 'cancel' },
        { text: 'Share Now', onPress: () => {
          // Implement sharing functionality
          console.log('Share YoFam app');
        }}
      ]
    );
  };

  const renderAchievementBadge = (achievement: string, index: number) => {
    const icons: { [key: string]: string } = {
      'Profile Complete': 'person-circle',
      'Permissions Granted': 'shield-checkmark',
      'Tutorial Master': 'school',
      'Profile Builder': 'construct',
      'YoFam Member': 'star'
    };

    return (
      <View key={index} style={styles.achievementBadge}>
        <LinearGradient
          colors={['#0091ad', '#04a7c7', '#fcd3aa']}
          style={styles.achievementIcon}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons 
            name={icons[achievement] as any || 'star'} 
            size={24} 
            color="#ffffff" 
          />
        </LinearGradient>
        <Text style={styles.achievementText}>{achievement}</Text>
      </View>
    );
  };

  const renderNextSteps = () => (
    <View style={styles.nextStepsContainer}>
      <Text style={styles.nextStepsTitle}>What's Next?</Text>
      
      <TouchableOpacity style={styles.nextStepItem} onPress={handleViewProfile}>
        <View style={styles.nextStepIcon}>
          <Ionicons name="person" size={20} color="#0091ad" />
        </View>
        <View style={styles.nextStepContent}>
          <Text style={styles.nextStepTitle}>Complete Your Profile</Text>
          <Text style={styles.nextStepDescription}>
            Add more details to get better matches
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.nextStepItem} onPress={handleInviteFriends}>
        <View style={styles.nextStepIcon}>
          <Ionicons name="people" size={20} color="#04a7c7" />
        </View>
        <View style={styles.nextStepContent}>
          <Text style={styles.nextStepTitle}>Invite Family & Friends</Text>
          <Text style={styles.nextStepDescription}>
            Share YoFam to start building connections
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.nextStepItem} 
        onPress={() => navigation.navigate('Friends', { user: user || route?.params?.user })}
      >
        <View style={styles.nextStepIcon}>
          <Ionicons name="search" size={20} color="#fcd3aa" />
        </View>
        <View style={styles.nextStepContent}>
          <Text style={styles.nextStepTitle}>Discover Connections</Text>
          <Text style={styles.nextStepDescription}>
            Find family members and make new friends
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress */}
        <OnboardingProgressComponent
          currentStep={9}
          totalSteps={9}
          completionPercentage={completionPercentage}
          variant="circular"
          showStepInfo={false}
        />

        {/* Success Content */}
        <View style={styles.successContent}>
          <View style={styles.celebrationContainer}>
            <LinearGradient
              colors={['#0091ad', '#04a7c7', '#fcd3aa']}
              style={styles.celebrationIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="checkmark-circle" size={48} color="#ffffff" />
            </LinearGradient>
          </View>

          <Text style={styles.congratsTitle}>Congratulations!</Text>
          <Text style={styles.congratsSubtitle}>
            You've successfully set up your YoFam account. You're now ready to connect with family and make new friends!
          </Text>
        </View>

        {/* Achievements */}
        {achievements.length > 0 && (
          <View style={styles.achievementsContainer}>
            <Text style={styles.achievementsTitle}>Your Achievements</Text>
            <View style={styles.achievementsList}>
              {achievements.map(renderAchievementBadge)}
            </View>
          </View>
        )}

        {/* Next Steps */}
        {renderNextSteps()}

        {/* Welcome Message */}
        <View style={styles.welcomeMessage}>
          <View style={styles.welcomeIcon}>
            <Ionicons name="heart" size={24} color="#ef4444" />
          </View>
          <Text style={styles.welcomeText}>
            Welcome to the YoFam family! We're excited to help you build meaningful connections.
          </Text>
        </View>
      </ScrollView>

      {/* Start Exploring Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.exploreButton}
          onPress={handleStartExploring}
          disabled={loading}
        >
          <LinearGradient
            colors={['#0091ad', '#04a7c7']}
            style={styles.exploreGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="rocket" size={20} color="#ffffff" />
            <Text style={styles.exploreButtonText}>Start Exploring YoFam</Text>
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
  
  scrollView: {
    flex: 1,
  },
  
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  
  // Success Content
  successContent: {
    alignItems: 'center',
    marginBottom: 32,
  },
  
  celebrationContainer: {
    marginBottom: 24,
  },
  
  celebrationIcon: {
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
  
  congratsTitle: {
    fontSize: 32,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  
  congratsSubtitle: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  
  // Achievements
  achievementsContainer: {
    marginBottom: 32,
  },
  
  achievementsTitle: {
    fontSize: 20,
    fontFamily: getSystemFont('semiBold'),
    color: '#fcd3aa',
    marginBottom: 16,
    textAlign: 'center',
  },
  
  achievementsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  
  achievementBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    minWidth: 100,
  },
  
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  achievementText: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: '#ffffff',
    textAlign: 'center',
  },
  
  // Next Steps
  nextStepsContainer: {
    marginBottom: 32,
  },
  
  nextStepsTitle: {
    fontSize: 20,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
    marginBottom: 16,
  },
  
  nextStepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 12,
  },
  
  nextStepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  
  nextStepContent: {
    flex: 1,
  },
  
  nextStepTitle: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
    marginBottom: 4,
  },
  
  nextStepDescription: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.7)',
  },
  
  // Welcome Message
  welcomeMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(252,211,170,0.1)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(252,211,170,0.3)',
  },
  
  welcomeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(239,68,68,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  welcomeText: {
    fontSize: 16,
    fontFamily: getSystemFont('medium'),
    color: '#ffffff',
    lineHeight: 24,
    flex: 1,
  },
  
  // Footer
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  
  exploreButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#0091ad',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  
  exploreGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 12,
  },
  
  exploreButtonText: {
    fontSize: 18,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
  },
});

export default OnboardingCompleteScreen;