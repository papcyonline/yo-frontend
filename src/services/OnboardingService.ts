// src/services/OnboardingService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../constants/api';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = API_CONFIG.BASE_URL;

// Helper function to get auth headers
const getAuthHeaders = () => {
  const { token } = useAuthStore.getState();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isRequired: boolean;
  screen?: string;
  icon: string;
  order: number;
}

export interface OnboardingProgress {
  userId: string;
  currentStep: number;
  totalSteps: number;
  completedSteps: string[];
  isCompleted: boolean;
  lastUpdated: Date;
  steps: OnboardingStep[];
}

export class OnboardingService {
  private static readonly STORAGE_KEY = 'onboarding_progress';
  
  // Define the onboarding steps
  private static readonly DEFAULT_STEPS: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome',
      description: 'Welcome to YoFam family connection app',
      isCompleted: false,
      isRequired: true,
      screen: 'Welcome',
      icon: 'hand-right',
      order: 1
    },
    {
      id: 'permissions',
      title: 'Permissions',
      description: 'Grant necessary permissions for the best experience',
      isCompleted: false,
      isRequired: true,
      screen: 'PermissionsSetup',
      icon: 'shield-checkmark',
      order: 2
    },
    {
      id: 'profile_photo',
      title: 'Profile Photo',
      description: 'Add a profile photo to help others recognize you',
      isCompleted: false,
      isRequired: false,
      screen: 'ProfilePhotoSetup',
      icon: 'camera',
      order: 3
    },
    {
      id: 'personal_details',
      title: 'Personal Details',
      description: 'Complete your basic profile information',
      isCompleted: false,
      isRequired: true,
      screen: 'PersonalDetails',
      icon: 'person',
      order: 4
    },
    {
      id: 'family_tree',
      title: 'Family Tree',
      description: 'Set up your family connections',
      isCompleted: false,
      isRequired: false,
      screen: 'FamilyTreeSetup',
      icon: 'git-network',
      order: 5
    },
    {
      id: 'interests',
      title: 'Interests & Hobbies',
      description: 'Tell us about your interests for better matching',
      isCompleted: false,
      isRequired: false,
      screen: 'InterestsSetup',
      icon: 'heart',
      order: 6
    },
    {
      id: 'privacy_settings',
      title: 'Privacy Settings',
      description: 'Configure your privacy and visibility preferences',
      isCompleted: false,
      isRequired: true,
      screen: 'PrivacySetup',
      icon: 'lock-closed',
      order: 7
    },
    {
      id: 'tutorial',
      title: 'App Tutorial',
      description: 'Learn how to use YoFam effectively',
      isCompleted: false,
      isRequired: false,
      screen: 'AppTutorial',
      icon: 'help-circle',
      order: 8
    },
    {
      id: 'completion',
      title: 'Setup Complete',
      description: 'You\'re ready to start connecting!',
      isCompleted: false,
      isRequired: true,
      screen: 'OnboardingComplete',
      icon: 'checkmark-circle',
      order: 9
    }
  ];

  /**
   * Initialize onboarding progress for a new user
   */
  static async initializeOnboarding(userId: string): Promise<OnboardingProgress> {
    const progress: OnboardingProgress = {
      userId,
      currentStep: 1,
      totalSteps: this.DEFAULT_STEPS.length,
      completedSteps: [],
      isCompleted: false,
      lastUpdated: new Date(),
      steps: this.DEFAULT_STEPS.map(step => ({ ...step }))
    };

    await this.saveProgress(progress);
    return progress;
  }

  /**
   * Get current onboarding progress
   */
  static async getProgress(userId: string): Promise<OnboardingProgress | null> {
    try {
      const stored = await AsyncStorage.getItem(`${this.STORAGE_KEY}_${userId}`);
      if (!stored) return null;

      const progress = JSON.parse(stored);
      progress.lastUpdated = new Date(progress.lastUpdated);
      
      return progress;
    } catch (error) {
      console.error('Error getting onboarding progress:', error);
      return null;
    }
  }

  /**
   * Save onboarding progress
   */
  static async saveProgress(progress: OnboardingProgress): Promise<void> {
    try {
      progress.lastUpdated = new Date();
      await AsyncStorage.setItem(
        `${this.STORAGE_KEY}_${progress.userId}`, 
        JSON.stringify(progress)
      );

      // Also sync to backend if possible
      try {
        await this.syncProgressToBackend(progress);
      } catch (error) {
        console.warn('Failed to sync onboarding progress to backend:', error);
      }
    } catch (error) {
      console.error('Error saving onboarding progress:', error);
      throw error;
    }
  }

  /**
   * Mark a step as completed
   */
  static async completeStep(userId: string, stepId: string): Promise<OnboardingProgress> {
    let progress = await this.getProgress(userId);
    
    if (!progress) {
      progress = await this.initializeOnboarding(userId);
    }

    // Mark step as completed
    const stepIndex = progress.steps.findIndex(step => step.id === stepId);
    if (stepIndex !== -1) {
      progress.steps[stepIndex].isCompleted = true;
      
      if (!progress.completedSteps.includes(stepId)) {
        progress.completedSteps.push(stepId);
      }
    }

    // Update current step to next incomplete required step
    const nextStep = progress.steps.find(step => !step.isCompleted && step.isRequired);
    if (nextStep) {
      progress.currentStep = nextStep.order;
    } else {
      // All required steps completed
      progress.isCompleted = true;
      progress.currentStep = progress.totalSteps;
    }

    await this.saveProgress(progress);
    return progress;
  }

  /**
   * Skip a non-required step
   */
  static async skipStep(userId: string, stepId: string): Promise<OnboardingProgress> {
    let progress = await this.getProgress(userId);
    
    if (!progress) {
      progress = await this.initializeOnboarding(userId);
    }

    const step = progress.steps.find(s => s.id === stepId);
    if (step && !step.isRequired) {
      step.isCompleted = true; // Mark as completed to skip
      
      if (!progress.completedSteps.includes(stepId)) {
        progress.completedSteps.push(stepId);
      }
    }

    // Update current step
    const nextStep = progress.steps.find(step => !step.isCompleted && step.isRequired);
    if (nextStep) {
      progress.currentStep = nextStep.order;
    } else {
      progress.isCompleted = true;
      progress.currentStep = progress.totalSteps;
    }

    await this.saveProgress(progress);
    return progress;
  }

  /**
   * Get next step to complete
   */
  static async getNextStep(userId: string): Promise<OnboardingStep | null> {
    const progress = await this.getProgress(userId);
    if (!progress) return this.DEFAULT_STEPS[0];

    return progress.steps.find(step => !step.isCompleted) || null;
  }

  /**
   * Get completion percentage
   */
  static async getCompletionPercentage(userId: string): Promise<number> {
    const progress = await this.getProgress(userId);
    if (!progress) return 0;

    const requiredSteps = progress.steps.filter(step => step.isRequired);
    const completedRequired = requiredSteps.filter(step => step.isCompleted);
    
    return Math.round((completedRequired.length / requiredSteps.length) * 100);
  }

  /**
   * Check if onboarding is completed
   */
  static async isOnboardingCompleted(userId: string): Promise<boolean> {
    const progress = await this.getProgress(userId);
    if (!progress) return false;

    // Check if all required steps are completed
    const requiredSteps = progress.steps.filter(step => step.isRequired);
    return requiredSteps.every(step => step.isCompleted);
  }

  /**
   * Reset onboarding progress
   */
  static async resetOnboarding(userId: string): Promise<OnboardingProgress> {
    await AsyncStorage.removeItem(`${this.STORAGE_KEY}_${userId}`);
    return await this.initializeOnboarding(userId);
  }

  /**
   * Sync progress to backend
   */
  private static async syncProgressToBackend(progress: OnboardingProgress): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/onboarding-progress`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          currentStep: progress.currentStep,
          completedSteps: progress.completedSteps,
          isCompleted: progress.isCompleted,
          lastUpdated: progress.lastUpdated.toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync onboarding progress');
      }
    } catch (error) {
      console.error('Backend sync error:', error);
      throw error;
    }
  }

  /**
   * Load progress from backend
   */
  static async loadProgressFromBackend(userId: string): Promise<OnboardingProgress | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/onboarding-progress`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // No progress found
        }
        throw new Error('Failed to load onboarding progress');
      }

      const backendProgress = await response.json();
      
      // Merge with local steps definition
      const progress: OnboardingProgress = {
        userId,
        currentStep: backendProgress.data.currentStep || 1,
        totalSteps: this.DEFAULT_STEPS.length,
        completedSteps: backendProgress.data.completedSteps || [],
        isCompleted: backendProgress.data.isCompleted || false,
        lastUpdated: new Date(backendProgress.data.lastUpdated),
        steps: this.DEFAULT_STEPS.map(step => ({
          ...step,
          isCompleted: backendProgress.data.completedSteps?.includes(step.id) || false
        }))
      };

      // Save locally
      await this.saveProgress(progress);
      return progress;
    } catch (error) {
      console.error('Error loading progress from backend:', error);
      return null;
    }
  }

  /**
   * Get recommended next action for user
   */
  static async getRecommendedAction(userId: string): Promise<{
    action: 'continue_onboarding' | 'complete_profile' | 'explore_app';
    message: string;
    screen?: string;
  }> {
    const progress = await this.getProgress(userId);
    
    if (!progress) {
      return {
        action: 'continue_onboarding',
        message: 'Let\'s get you started with YoFam!',
        screen: 'Welcome'
      };
    }

    if (!progress.isCompleted) {
      const nextStep = await this.getNextStep(userId);
      return {
        action: 'continue_onboarding',
        message: nextStep ? `Next: ${nextStep.title}` : 'Continue setup',
        screen: nextStep?.screen
      };
    }

    // Check profile completion
    const completionPercentage = await this.getCompletionPercentage(userId);
    if (completionPercentage < 100) {
      return {
        action: 'complete_profile',
        message: 'Complete your profile for better matches',
        screen: 'Profile'
      };
    }

    return {
      action: 'explore_app',
      message: 'You\'re all set! Start exploring.',
      screen: 'MainApp'
    };
  }
}