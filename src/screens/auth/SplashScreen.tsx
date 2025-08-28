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
  const textProgress = useSharedValue(0);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    // Logo animation - appears and shifts up
    logoOpacity.value = withTiming(1, { duration: 800 });
    logoScale.value = withSequence(
      withSpring(1.1, { damping: 6 }),
      withSpring(1, { damping: 8 })
    );
    
    // Shift logo up after it appears
    setTimeout(() => {
      logoTranslateY.value = withSpring(-50, { damping: 8 });
    }, 800);

    // Animated text "fam" - starts after logo shifts up
    setTimeout(() => {
      textOpacity.value = withTiming(1, { duration: 500 });
      textProgress.value = withTiming(1, { duration: 2000 }); // Type over 2 seconds
    }, 1200);

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

    // Navigate after animation completes (4 seconds)
    const timer = setTimeout(handleNavigation, 4000);

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
    const progress = textProgress.value;
    
    return {
      opacity: textOpacity.value,
      transform: [
        { 
          scale: interpolate(progress, [0, 1], [0.8, 1]) 
        }
      ]
    };
  });

  // Animated character rendering
  const renderAnimatedText = () => {
    const text = "fam";
    const characters = text.split('');
    
    return (
      <View style={styles.textContainer}>
        {characters.map((char, index) => {
          const animatedCharStyle = useAnimatedStyle(() => {
            const charProgress = interpolate(
              textProgress.value,
              [index / characters.length, (index + 1) / characters.length],
              [0, 1],
              'clamp'
            );
            
            return {
              opacity: charProgress,
              transform: [
                { 
                  translateY: interpolate(charProgress, [0, 1], [20, 0]) 
                }
              ]
            };
          });

          return (
            <Animated.Text
              key={index}
              style={[styles.animatedChar, animatedCharStyle]}
            >
              {char}
            </Animated.Text>
          );
        })}
      </View>
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
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  animatedChar: {
    fontSize: 56,
    fontFamily: getSystemFont('light'), // Clean system font
    color: '#fcd3aa', // Brand color that works on both themes
    marginHorizontal: 1,
    letterSpacing: 2,
  },
});

export default SplashScreen;