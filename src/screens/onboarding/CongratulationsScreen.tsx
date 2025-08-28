import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthStorage } from '../../utils/AuthStorage';
import { saveRegistrationToProfile } from '../../services/registrationDataService';
import { getSystemFont } from '../../config/constants';

const { width, height } = Dimensions.get('window');

const CongratulationsScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  // Handle both old and new parameter formats
  const userData = route.params?.userData;
  const userToken = route.params?.userToken || route.params?.token;
  const refreshToken = route.params?.refreshToken;
  const registrationComplete = route.params?.registrationComplete;
  const userInfo = route.params?.userInfo; // Registration form data
  
  // Extract user details from userData if available, otherwise use old params
  const userId = userData?.id || route.params?.userId;
  const email = userData?.email || route.params?.email;
  const phone = userData?.phone || route.params?.phone;
  
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Start animations
    Animated.sequence([
      // Scale in the checkmark
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      // Fade in text with slide up
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        })
      ])
    ]).start();

    // Navigate after 3 seconds
    const timer = setTimeout(async () => {
      // Save authentication data to storage
      if (userToken && userId && email) {
        try {
          await AuthStorage.saveAuthData({
            token: userToken,
            userId: userId,
            email: email,
            phone: phone || '',
            isAuthenticated: true,
            loginTime: Date.now()
          });
          
          if (userData) {
            await AuthStorage.saveUserData({
              id: userData.id,
              email: userData.email,
              phone: userData.phone || '',
              fullName: userData.fullName || `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
              profileCompleted: userData.profile_complete || false,
              dateOfBirth: userData.date_of_birth,
              placeOfBirth: userData.place_of_birth,
              currentAddress: userData.current_address,
              fatherName: userData.father_name,
              motherName: userData.mother_name,
              bio: userData.bio
            });
          }
          
          // Automatically save registration data to progressive profile
          if (userToken) {
            console.log('🔍 CongratulationsScreen - About to save registration data');
            console.log('📋 userInfo:', JSON.stringify(userInfo, null, 2));
            console.log('📊 userData:', JSON.stringify(userData, null, 2));
            
            const result = await saveRegistrationToProfile(userToken, {
              userInfo: userInfo,
              userData: userData
            });
            
            console.log('📤 Registration save result:', result);
          }
        } catch (error) {
          console.error('Error saving auth data:', error);
        }
      }
      
      // Check if user needs to complete profile or go to dashboard
      if (userData?.profile_complete || registrationComplete) {
        // User profile is complete, go to main app (TabNavigator)
        navigation.replace('MainApp', {
          userId: userId,
          user: userData,
          token: userToken,
          refreshToken: refreshToken
        });
      } else {
        // User needs to complete profile - use progressive system
        navigation.replace('ProgressiveProfile', {
          user: userData || { id: userId, email: email, phone: phone },
          fromCongrats: true
        });
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.blackBg} />
      
      {/* Animated Checkmark */}
      <Animated.View 
        style={[
          styles.checkmarkContainer,
          {
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <View style={styles.checkmarkCircle}>
          <Ionicons name="checkmark" size={60} color="#fff" />
        </View>
      </Animated.View>

      {/* Animated Text */}
      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <Text style={styles.congratsTitle}>Congratulations!</Text>
        <Text style={styles.congratsSubtitle}>
          Your account has been successfully verified.{'\n'}
          Let's get to know you better!
        </Text>
      </Animated.View>

      {/* Progress dots */}
      <View style={styles.dotsContainer}>
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
    backgroundColor: '#000',
  },
  checkmarkContainer: {
    marginBottom: 40,
  },
  checkmarkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#39b70d',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#39b70d',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  congratsTitle: {
    fontSize: 36,
    fontFamily: getSystemFont('bold'),
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  congratsSubtitle: {
    fontSize: 18,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
  },
  dotsContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 80,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  activeDot: {
    backgroundColor: '#39b70d',
  },
});

export default CongratulationsScreen;