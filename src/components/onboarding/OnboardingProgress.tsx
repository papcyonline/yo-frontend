// src/components/onboarding/OnboardingProgress.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getSystemFont } from '../../config/constants';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  completionPercentage: number;
  stepTitle?: string;
  stepDescription?: string;
  showStepInfo?: boolean;
  variant?: 'horizontal' | 'circular';
}

const OnboardingProgress: React.FC<OnboardingProgressProps> = ({
  currentStep,
  totalSteps,
  completionPercentage,
  stepTitle,
  stepDescription,
  showStepInfo = true,
  variant = 'horizontal'
}) => {
  
  if (variant === 'circular') {
    return (
      <View style={styles.circularContainer}>
        <View style={styles.circularProgress}>
          <LinearGradient
            colors={['#0091ad', '#04a7c7', '#fcd3aa']}
            style={[
              styles.circularGradient,
              {
                transform: [{ rotate: `${(completionPercentage / 100) * 360}deg` }]
              }
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.circularInner}>
            <Text style={styles.circularPercentage}>{completionPercentage}%</Text>
            <Text style={styles.circularLabel}>Complete</Text>
          </View>
        </View>
        
        {showStepInfo && (
          <View style={styles.circularStepInfo}>
            <Text style={styles.circularStepNumber}>
              Step {currentStep} of {totalSteps}
            </Text>
            {stepTitle && (
              <Text style={styles.circularStepTitle}>{stepTitle}</Text>
            )}
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.stepCounter}>
          <Ionicons name="list" size={16} color="#fcd3aa" />
          <Text style={styles.stepText}>
            Step {currentStep} of {totalSteps}
          </Text>
        </View>
        
        <View style={styles.percentageContainer}>
          <Text style={styles.percentageText}>{completionPercentage}%</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <LinearGradient
            colors={['#0091ad', '#04a7c7', '#fcd3aa']}
            style={[
              styles.progressBarFill,
              { width: `${completionPercentage}%` }
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>
        
        {/* Progress Dots */}
        <View style={styles.progressDots}>
          {Array.from({ length: totalSteps }, (_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index < currentStep ? styles.progressDotCompleted : styles.progressDotPending
              ]}
            >
              {index < currentStep - 1 ? (
                <Ionicons name="checkmark" size={8} color="#ffffff" />
              ) : index === currentStep - 1 ? (
                <View style={styles.progressDotCurrent} />
              ) : null}
            </View>
          ))}
        </View>
      </View>

      {/* Step Information */}
      {showStepInfo && (stepTitle || stepDescription) && (
        <View style={styles.stepInfo}>
          {stepTitle && (
            <Text style={styles.stepTitle}>{stepTitle}</Text>
          )}
          {stepDescription && (
            <Text style={styles.stepDescription}>{stepDescription}</Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  stepCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  
  stepText: {
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
    color: '#fcd3aa',
  },
  
  percentageContainer: {
    backgroundColor: 'rgba(252,211,170,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(252,211,170,0.3)',
  },
  
  percentageText: {
    fontSize: 12,
    fontFamily: getSystemFont('bold'),
    color: '#fcd3aa',
  },
  
  // Progress Bar
  progressBarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  
  progressBarBackground: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    minWidth: 8,
  },
  
  progressDots: {
    position: 'absolute',
    top: -4,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  
  progressDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  
  progressDotCompleted: {
    backgroundColor: '#0091ad',
    borderColor: '#ffffff',
  },
  
  progressDotPending: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  
  progressDotCurrent: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fcd3aa',
  },
  
  // Step Information
  stepInfo: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  
  stepTitle: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
    marginBottom: 4,
  },
  
  stepDescription: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
  },
  
  // Circular Variant
  circularContainer: {
    alignItems: 'center',
    gap: 16,
  },
  
  circularProgress: {
    width: 120,
    height: 120,
    position: 'relative',
  },
  
  circularGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 60,
    opacity: 0.8,
  },
  
  circularInner: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    backgroundColor: '#000000',
    borderRadius: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  circularPercentage: {
    fontSize: 20,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
  },
  
  circularLabel: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: 'rgba(255,255,255,0.7)',
  },
  
  circularStepInfo: {
    alignItems: 'center',
  },
  
  circularStepNumber: {
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
    color: '#fcd3aa',
    marginBottom: 4,
  },
  
  circularStepTitle: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
    textAlign: 'center',
  },
});

export default OnboardingProgress;