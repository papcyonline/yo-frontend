import React, { useState } from 'react';
import { 
  View, 
  Text,
  StyleSheet, 
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
  ImageBackground,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { googleAuthService } from '../../services/googleAuthService';
import { useTheme } from '../../context/ThemeContext';
import { getSystemFont } from '../../config/constants';

const { height, width } = Dimensions.get('window');

const SignUpScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const insets = useSafeAreaInsets();
  
  // Dynamic styles based on theme
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
  });

  // Google Sign-In setup
  const [request, response, promptAsync] = googleAuthService.createAuthRequest();

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    try {
      const result = await googleAuthService.signUpWithGoogle(promptAsync);
      
      if (result.success && result.user) {
        navigation.navigate('MainApp', {
          userId: result.userId,
          user: result.user,
          token: result.token,
          refreshToken: result.refreshToken,
          fromGoogle: true
        });
      } else if (result.error && result.error !== 'Google sign up was cancelled') {
        Alert.alert('Google Sign Up Failed', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Google sign up failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFacebookAuth = () => {
    Alert.alert(
      'Social Authentication',
      'Social login features require additional configuration. Please contact support or use email registration.',
      [{ text: 'OK' }]
    );
  };

  const handleSignUp = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('UserInfo');
    }, 300);
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={dynamicStyles.container}>
      {/* Full-screen background image */}
      <ImageBackground 
        source={require('../../../assets/introimage.jpg')} 
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
      >
        {/* Dark overlay for better text readability */}
        <View style={styles.overlay} />
        
        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 40) + 20 }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Yo! Fam</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content overlay */}
        <View style={styles.contentContainer}>
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Join Yo! Fam</Text>
            <Text style={styles.welcomeSubtitle}>
              Connect with relatives, discover your heritage, and preserve family memories for generations to come.
            </Text>
          </View>

          {/* Spacer to push buttons to bottom */}
          <View style={styles.spacer} />

          {/* Bottom Section with Sign Up Buttons */}
          <View style={[
            styles.bottomSection, 
            { 
              paddingBottom: Platform.OS === 'android' 
                ? Math.max(insets.bottom, 20) + 30  // Extra padding for Android nav gestures
                : Math.max(insets.bottom, 20) + 20 
            }
          ]}>
            {/* Social Authentication */}
            <View style={styles.socialSection}>
              <TouchableOpacity 
                style={[styles.socialButton, styles.googleButton]}
                onPress={handleGoogleAuth}
                disabled={loading || googleLoading}
              >
                <View style={styles.socialButtonContent}>
                  <View style={styles.socialIconContainer}>
                    {googleLoading ? (
                      <View style={styles.loadingSpinner} />
                    ) : (
                      <Ionicons name="logo-google" size={20} color="#4285f4" />
                    )}
                  </View>
                  <Text style={[styles.socialButtonText, styles.googleButtonText]}>Continue with Google</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.socialButton, styles.facebookButton]}
                onPress={handleFacebookAuth}
                disabled={loading || googleLoading}
              >
                <View style={styles.socialButtonContent}>
                  <View style={styles.socialIconContainer}>
                    <Ionicons name="logo-facebook" size={20} color="#ffffff" />
                  </View>
                  <Text style={styles.socialButtonText}>Continue with Facebook</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.dividerSection}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Email Sign Up */}
            <View style={styles.emailSection}>
              <TouchableOpacity 
                style={styles.emailButton}
                onPress={handleSignUp}
                disabled={loading || googleLoading}
              >
                <LinearGradient
                  colors={['#0091ad', '#04a7c7', '#0091ad']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  locations={[0, 0.5, 1]}
                >
                  <Ionicons name="mail-outline" size={18} color="#ffffff" />
                  <Text style={styles.emailButtonText}>
                    {loading ? 'Loading...' : 'Sign Up with Email'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Login Link */}
            <View style={styles.loginSection}>
              <Text style={styles.loginText}>Already have an account?</Text>
              <TouchableOpacity onPress={handleLogin} disabled={loading || googleLoading}>
                <Text style={styles.loginLink}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundImageStyle: {
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dark overlay for better text readability
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  placeholder: {
    width: 40,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  welcomeSection: {
    alignItems: 'center',
    paddingTop: 40,
  },
  welcomeTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  spacer: {
    flex: 1,
  },
  bottomSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 30,
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    backdropFilter: 'blur(10px)', // Glass effect on supported platforms
  },
  socialSection: {
    marginBottom: 20,
  },
  socialButton: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  socialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  googleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  facebookButton: {
    backgroundColor: 'rgba(24, 119, 242, 0.9)',
    borderColor: 'rgba(24, 119, 242, 0.3)',
  },
  socialIconContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  googleButtonText: {
    color: '#333333',
  },
  loadingSpinner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4285f4',
    opacity: 0.7,
  },
  dividerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerText: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
    marginHorizontal: 16,
  },
  emailSection: {
    marginBottom: 24,
  },
  emailButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#0091ad',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  emailButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  loginText: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  loginLink: {
    fontSize: 16,
    fontWeight: '700',
    color: '#04a7c7',
    textDecorationLine: 'underline',
  },
});

export default SignUpScreen;