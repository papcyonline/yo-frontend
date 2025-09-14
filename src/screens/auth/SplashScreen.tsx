import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  withSequence,
  withDelay,
  interpolate
} from 'react-native-reanimated';
import { getSystemFont } from '../../config/constants';
import { useTheme } from '../../context/ThemeContext';
import { AuthStorage } from '../../utils/AuthStorage';
import { useAuthStore } from '../../store/authStore';

const { height, width } = Dimensions.get('window');

const SplashScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.3);
  const logoTranslateY = useSharedValue(0);
  
  // Animated text values
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    // Step 1: Logo appears at center (500ms)
    logoOpacity.value = withTiming(1, { duration: 500 });
    logoScale.value = withTiming(1, { duration: 500 });

    // Step 2: Logo slides up after appearing (300ms delay + 400ms animation)
    setTimeout(() => {
      logoTranslateY.value = withTiming(-60, { duration: 400 });
    }, 500);

    // Step 3: "fam" text slides in after logo moves up (200ms delay + 300ms animation)
    setTimeout(() => {
      textOpacity.value = withTiming(1, { duration: 300 });
    }, 1100);

    // Handle navigation after animation completes
    const handleNavigation = async () => {
      try {
        console.log('🎬 Splash animation complete, checking auth...');
        const storedData = await AuthStorage.getStoredData();

        if (storedData.auth && storedData.auth.isAuthenticated && storedData.user) {
          // User is authenticated, go directly to MainApp
          const { setUser, setTokens } = useAuthStore.getState();
          setUser(storedData.user);
          if (storedData.auth.token) {
            setTokens(storedData.auth.token, storedData.auth.refreshToken || '');
          }
          
          console.log('✅ Authenticated user, navigating to MainApp');
          navigation.replace('MainApp');
        } else {
          // New user, go through the flow: Language -> Intro -> Terms -> SignUp
          console.log('🆕 New user, navigating to LanguageSelection');
          navigation.replace('LanguageSelection');
        }
      } catch (error) {
        console.error('❌ Error during navigation:', error);
        // Default to language selection on error
        navigation.replace('LanguageSelection');
      }
    };

    // Navigate after 3 seconds total (logo appears + slides up + text shows for a moment)
    const timer = setTimeout(handleNavigation, 3000);

    return () => clearTimeout(timer);
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { scale: logoScale.value },
      { translateY: logoTranslateY.value }
    ]
  }));

  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: textOpacity.value,
      transform: [
        {
          translateY: interpolate(textOpacity.value, [0, 1], [30, 0])
        }
      ]
    };
  });

  // Simple text display
  const renderAnimatedText = () => {
    return (
      <Text style={styles.famText}>fam</Text>
    );
  };

  // Dynamic styles based on theme
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    text: {
      color: theme.text,
    },
  });

  return (
    <View style={dynamicStyles.container}>
      {/* Logo - smaller and positioned to shift up */}
      <View style={styles.logoContainer}>
        <Animated.View style={[styles.logoWrapper, logoAnimatedStyle]}>
          <Image
            source={require('../../../assets/splash.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </Animated.View>
      </View>

      {/* Clean animated "fam" text at bottom */}
      <Animated.View style={[styles.bottomTextContainer, textAnimatedStyle]}>
        {renderAnimatedText()}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  logoWrapper: {
    position: 'relative',
    zIndex: 2,
  },
  logo: {
    width: 140, // Reduced from 180
    height: 140, // Reduced from 180
  },
  bottomTextContainer: {
    position: 'absolute',
    bottom: height * 0.15, // 15% from bottom
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  famText: {
    fontSize: 56,
    fontFamily: getSystemFont('light'),
    color: '#fcd3aa', // Brand color that works on both themes
    letterSpacing: 2,
  },
});

export default SplashScreen;