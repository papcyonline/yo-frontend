import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSystemFont } from '../../config/constants';

const { height } = Dimensions.get('window');

interface OnboardingCompletionScreenProps {
  navigation: any;
  route: any;
}

const OnboardingCompletionScreen: React.FC<OnboardingCompletionScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const buttonSlideAnim = useRef(new Animated.Value(100)).current;

  const { completionPercentage = 85 } = route.params || {};

  useEffect(() => {
    // Auto navigation timer - go to dashboard after 4 seconds
    const timer = setTimeout(() => {
      handleContinue();
    }, 4000);

    // Start animations
    const animationSequence = Animated.sequence([
      // First show the checkmark with scale effect
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Then slide in the text
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // Finally show the continue button
      Animated.timing(buttonSlideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]);

    animationSequence.start();

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const handleContinue = () => {
    navigation.navigate('MainApp');
  };

  return (
    <View style={styles.container}>
      <View style={styles.blackBg} />
      
      {/* Success Icon */}
      <Animated.View 
        style={[
          styles.checkmarkContainer,
          {
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <View style={styles.checkmarkCircle}>
          <Ionicons name="checkmark" size={50} color="#ffffff" />
        </View>
      </Animated.View>

      {/* Success Text */}
      <Animated.View 
        style={[
          styles.textContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <Text style={styles.congratsTitle}>Profile Complete!</Text>
        <Text style={styles.congratsSubtitle}>
          Amazing! Your profile is now {completionPercentage}% complete.{'\n'}
          You're all set to start connecting with your community!
        </Text>
        
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <Ionicons name="people" size={20} color="#0091ad" />
            <Text style={styles.featureText}>Find family members</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="heart" size={20} color="#0091ad" />
            <Text style={styles.featureText}>Connect with friends</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="globe" size={20} color="#0091ad" />
            <Text style={styles.featureText}>Join communities</Text>
          </View>
        </View>
      </Animated.View>

      {/* Continue Button */}
      <Animated.View
        style={[
          styles.buttonContainer,
          {
            transform: [{ translateY: buttonSlideAnim }]
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Continue to Dashboard</Text>
          <Ionicons name="arrow-forward" size={20} color="#ffffff" />
        </TouchableOpacity>
        
        <Text style={styles.autoRedirectText}>
          Automatically redirecting in a few seconds...
        </Text>
      </Animated.View>

      {/* Progress dots */}
      <View style={styles.dotsContainer}>
        <View style={[styles.dot, styles.activeDot]} />
        <View style={[styles.dot, styles.activeDot]} />
        <View style={[styles.dot, styles.activeDot]} />
        <View style={[styles.dot, styles.activeDot]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blackBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
  },
  checkmarkContainer: {
    marginBottom: 40,
  },
  checkmarkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#0091ad', // Using app's primary color
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#0091ad',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    marginBottom: 40,
  },
  congratsTitle: {
    fontSize: 36,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  congratsSubtitle: {
    fontSize: 18,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
  },
  featuresList: {
    gap: 12,
    alignItems: 'flex-start',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    fontFamily: getSystemFont('medium'),
    color: 'rgba(255,255,255,0.9)',
  },
  buttonContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
  },
  continueButton: {
    backgroundColor: '#0091ad',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    gap: 8,
    elevation: 6,
    shadowColor: '#0091ad',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    minWidth: 250,
  },
  continueButtonText: {
    fontSize: 18,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
  },
  autoRedirectText: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 16,
  },
  dotsContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 60,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  activeDot: {
    backgroundColor: '#0091ad', // Using app's primary color
  },
});

export default OnboardingCompletionScreen;