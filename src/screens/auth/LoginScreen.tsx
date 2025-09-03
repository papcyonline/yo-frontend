import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  ScrollView,
  Image,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { getSystemFont } from '../../config/constants';
import { useTranslation } from '../../i18n/simpleI18n';

const { height, width } = Dimensions.get('window');

import { API_CONFIG } from '../../constants/api';

const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loginType, setLoginType] = useState<'email' | 'phone'>('email');

  // Create dynamic styles based on theme
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    
    // Image Section
    imageSection: {
      height: height * 0.35,
      position: 'relative',
    },
    backgroundImage: {
      width: '100%',
      height: '100%',
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30,
    },
    imageOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.3)',
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30,
    },
    backButton: {
      position: 'absolute',
      top: 50,
      left: 20,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: isDark ? 'rgba(0, 145, 173, 0.3)' : 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
      elevation: 4,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    welcomeOverlay: {
      position: 'absolute',
      bottom: 30,
      left: 24,
      right: 24,
      alignItems: 'center',
    },
    welcomeTitle: {
      fontSize: 32,
      fontFamily: getSystemFont('bold'),
      color: isDark ? '#fcd3aa' : '#FFFFFF',
      textAlign: 'center',
      marginBottom: 8,
      textShadowColor: 'rgba(0, 0, 0, 0.5)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    welcomeSubtitle: {
      fontSize: 16,
      fontFamily: getSystemFont('regular'),
      color: isDark ? 'rgba(252, 211, 170, 0.9)' : 'rgba(255, 255, 255, 0.9)',
      textAlign: 'center',
      textShadowColor: 'rgba(0, 0, 0, 0.5)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },

    // Content Section
    contentSection: {
      flex: 1,
    },
    scrollContent: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 24,
    },

    // Social Section
    socialSection: {
      marginBottom: 24,
    },
    socialTitle: {
      fontSize: 16,
      fontFamily: getSystemFont('semiBold'),
      color: theme.text,
      textAlign: 'center',
      marginBottom: 16,
    },
    socialButtons: {
      flexDirection: 'row',
      gap: 16,
      justifyContent: 'center',
    },
    socialButton: {
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 24,
      borderRadius: 12,
      borderWidth: 1,
      minWidth: 140,
    },
    socialButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 6,
    },
    socialIconContainer: {
      width: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
    },
    googleButton: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      borderColor: isDark ? 'rgba(255, 255, 255, 0.3)' : theme.border,
    },
    facebookButton: {
      backgroundColor: 'rgba(24, 119, 242, 0.9)',
      borderColor: 'rgba(24, 119, 242, 0.3)',
    },
    socialButtonText: {
      fontSize: 14,
      fontFamily: getSystemFont('medium'),
      color: '#ffffff',
    },
    googleButtonText: {
      color: '#333333',
    },
    loadingSpinner: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: '#4285f4',
      opacity: 0.7,
    },

    // Divider
    dividerSection: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.divider,
    },
    dividerText: {
      fontSize: 14,
      fontFamily: getSystemFont('regular'),
      color: theme.textSecondary,
      marginHorizontal: 16,
    },

    // Form Section
    formSection: {
      position: 'relative',
      marginBottom: 24,
    },
    inputGroup: {
      marginBottom: 20,
    },
    labelContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    inputLabel: {
      fontSize: 14,
      fontFamily: getSystemFont('semiBold'),
      color: theme.text,
    },
    loginTypeIndicator: {
      fontSize: 12,
      fontFamily: getSystemFont('regular'),
      color: theme.primary,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.inputBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      paddingRight: 12,
      minHeight: 52,
    },
    inputError: {
      borderColor: theme.error,
      backgroundColor: isDark ? 'rgba(255, 68, 68, 0.1)' : 'rgba(255, 68, 68, 0.05)',
    },
    inputIcon: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 6,
      marginRight: 12,
    },
    textInput: {
      flex: 1,
      fontSize: 16,
      color: theme.text,
      fontFamily: getSystemFont('regular'),
      paddingVertical: 12,
    },
    eyeButton: {
      padding: 8,
    },
    errorMessage: {
      fontSize: 12,
      color: theme.error,
      fontFamily: getSystemFont('regular'),
      marginTop: 6,
    },
    loginInfoContainer: {
      alignItems: 'flex-end',
      marginBottom: 16,
    },
    loginInfoText: {
      fontSize: 12,
      color: theme.textSecondary,
      fontFamily: getSystemFont('regular'),
      textAlign: 'center',
      paddingHorizontal: 20,
    },
    forgotPasswordButton: {
      alignSelf: 'flex-end',
    },
    forgotPasswordText: {
      fontSize: 14,
      color: theme.primary,
      fontFamily: getSystemFont('semiBold'),
    },

    // Sign In Button
    signInButton: {
      backgroundColor: theme.primary,
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 24,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
      elevation: 4,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
    },
    buttonDisabled: {
      opacity: 0.6,
      elevation: 0,
      shadowOpacity: 0,
    },
    signInButtonText: {
      fontSize: 16,
      fontFamily: getSystemFont('bold'),
      color: theme.buttonText,
    },
    buttonArrow: {
      marginLeft: 8,
    },

    // Register Section
    registerSection: {
      alignItems: 'center',
      paddingBottom: 32,
    },
    registerText: {
      fontSize: 14,
      color: theme.textSecondary,
      fontFamily: getSystemFont('regular'),
    },
    registerLink: {
      color: theme.primary,
      fontFamily: getSystemFont('bold'),
    },
  });

  // Detect if input is phone or email
  useEffect(() => {
    if (identifier.trim()) {
      const isPhone = /^\+?\d{10,15}$/.test(identifier.trim());
      setLoginType(isPhone ? 'phone' : 'email');
    }
  }, [identifier]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!identifier.trim()) {
      newErrors.identifier = t('auth.emailRequired');
    } else {
      const isEmail = /\S+@\S+\.\S+/.test(identifier.trim());
      const isPhone = /^\+?\d{10,15}$/.test(identifier.replace(/\s/g, ''));
      
      if (!isEmail && !isPhone) {
        newErrors.identifier = t('auth.invalidEmail');
      }
    }

    // Password is only required for email login
    if (loginType === 'email' && !password) {
      newErrors.password = t('auth.passwordRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      console.log('=== LOGIN DEBUG ===');
      console.log('API URL:', `${API_CONFIG.BASE_URL}/auth/login`);
      console.log('Login type:', loginType);

      let requestBody;
      if (loginType === 'phone') {
        // Phone login - password not required according to your controller
        requestBody = {
          phone: identifier.trim()
        };
        console.log('Phone login request:', { phone: identifier.trim() });
      } else {
        // Email login - password required
        requestBody = {
          email: identifier.toLowerCase().trim(),
          password: password
        };
        console.log('Email login request:', { 
          email: identifier.toLowerCase().trim(), 
          password: '[HIDDEN]' 
        });
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);

      const result = await response.json();
      
      console.log('=== LOGIN RESPONSE ===');
      console.log('Full response:', result);

      if (response.ok && result.success) {
        console.log('✅ Login successful');
        console.log('User data:', result.data.user);
        
        // Navigate to main app
        navigation.navigate('MainApp', {
          userId: result.data.user.id,
          user: result.data.user,
          token: result.data.token,
          refreshToken: result.data.refreshToken
        });
      } else {
        console.log('❌ Login failed:', result);
        
        // Handle specific error cases
        if (result.message?.toLowerCase().includes('not found')) {
          Alert.alert(
            'Account Not Found',
            'No account found with this information. Would you like to create an account?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign Up', onPress: () => navigation.navigate('UserInfo') }
            ]
          );
        } else if (result.message?.toLowerCase().includes('password')) {
          setErrors({ password: 'Invalid password' });
        } else if (result.message?.toLowerCase().includes('deactivated')) {
          Alert.alert('Account Deactivated', 'Your account has been deactivated. Please contact support.');
        } else if (result.message?.toLowerCase().includes('password not set')) {
          Alert.alert(
            'Password Not Set',
            'This account was created with phone verification. Please use phone login or reset your password.',
            [
              { text: 'Phone Login', onPress: () => setLoginType('phone') },
              { text: 'Reset Password', onPress: () => navigation.navigate('ForgotPassword') }
            ]
          );
        } else {
          Alert.alert('Login Failed', result.message || 'Invalid credentials');
        }
      }
    } catch (err) {
      console.error('❌ Network/Parse error:', err);
      Alert.alert('Network Error', 'Unable to connect to server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (googleLoading) return;

    setGoogleLoading(true);
    try {
      console.log('=== GOOGLE LOGIN DEBUG ===');
      console.log('API URL:', `${API_CONFIG.BASE_URL}/auth/social/google`);
      
      // This is a placeholder - you'll need to implement actual Google Auth
      // For now, showing what the request should look like
      Alert.alert(
        'Google Sign In',
        'Google authentication needs to be implemented with your Google OAuth setup.',
        [
          { text: 'OK' }
        ]
      );

      /* Example implementation:
      const googleToken = await getGoogleToken(); // Your Google auth implementation
      const googleUserInfo = await getGoogleUserInfo(); // Get user info from Google

      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          googleToken: googleToken,
          firstName: googleUserInfo.given_name,
          lastName: googleUserInfo.family_name,
          email: googleUserInfo.email,
          googleId: googleUserInfo.id
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        navigation.navigate('MainApp', {
          userId: result.data.user.id,
          user: result.data.user,
          token: result.data.token,
          refreshToken: result.data.refreshToken
        });
      } else {
        Alert.alert('Google Sign In Failed', result.message);
      }
      */

    } catch (error) {
      console.error('Google sign in error:', error);
      Alert.alert('Error', 'Google sign in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    Alert.alert(
      'Facebook Sign In',
      'Facebook authentication endpoint is available at /auth/social/facebook but needs to be implemented.',
      [{ text: 'OK' }]
    );
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const goToRegister = () => {
    navigation.navigate('UserInfo');
  };

  const getInputPlaceholder = () => {
    if (loginType === 'phone') {
      return 'Enter your phone number';
    }
    return 'Enter your email address';
  };

  const getInputLabel = () => {
    if (loginType === 'phone') {
      return t('auth.phoneNumber');
    }
    return t('auth.emailAddress');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={dynamicStyles.container}>
        {/* Image Section */}
        <View style={dynamicStyles.imageSection}>
          <Image 
            source={require('../../../assets/signup.jpg')} 
            style={dynamicStyles.backgroundImage}
            resizeMode="cover"
          />
          
          {/* Dark Overlay */}
          <View style={dynamicStyles.imageOverlay} />
          
          {/* Back Button */}
          <TouchableOpacity style={dynamicStyles.backButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color={isDark ? "#fcd3aa" : "#FFFFFF"} />
          </TouchableOpacity>

          {/* Welcome Text Overlay */}
          <View style={dynamicStyles.welcomeOverlay}>
            <Text style={dynamicStyles.welcomeTitle}>{t('auth.welcomeBack')}</Text>
            <Text style={dynamicStyles.welcomeSubtitle}>{t('auth.signInToContinue')}</Text>
          </View>
        </View>

        {/* Content Section */}
        <KeyboardAvoidingView
          style={dynamicStyles.contentSection}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={dynamicStyles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Social Login Section */}
            <View style={dynamicStyles.socialSection}>
              <Text style={dynamicStyles.socialTitle}>{t('auth.quickSignIn')}</Text>
              <View style={dynamicStyles.socialButtons}>
                <TouchableOpacity
                  style={[dynamicStyles.socialButton, dynamicStyles.googleButton]}
                  onPress={handleGoogleSignIn}
                  disabled={loading || googleLoading}
                >
                  <View style={dynamicStyles.socialButtonContent}>
                    <View style={dynamicStyles.socialIconContainer}>
                      {googleLoading ? (
                        <View style={dynamicStyles.loadingSpinner} />
                      ) : (
                        <Ionicons name="logo-google" size={20} color="#4285f4" />
                      )}
                    </View>
                    <Text style={[dynamicStyles.socialButtonText, dynamicStyles.googleButtonText]}>{t('auth.google')}</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[dynamicStyles.socialButton, dynamicStyles.facebookButton]}
                  onPress={handleFacebookSignIn}
                  disabled={loading || googleLoading}
                >
                  <View style={dynamicStyles.socialButtonContent}>
                    <View style={dynamicStyles.socialIconContainer}>
                      <Ionicons name="logo-facebook" size={20} color="#ffffff" />
                    </View>
                    <Text style={dynamicStyles.socialButtonText}>{t('auth.facebook')}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Divider */}
            <View style={dynamicStyles.dividerSection}>
              <View style={dynamicStyles.dividerLine} />
              <Text style={dynamicStyles.dividerText}>{t('auth.orSignInWith')}</Text>
              <View style={dynamicStyles.dividerLine} />
            </View>

            {/* Form Section */}
            <View style={dynamicStyles.formSection}>
              {/* Email/Phone Input */}
              <View style={dynamicStyles.inputGroup}>
                <View style={dynamicStyles.labelContainer}>
                  <Text style={dynamicStyles.inputLabel}>{getInputLabel()}</Text>
                  <Text style={dynamicStyles.loginTypeIndicator}>
                    {loginType === 'phone' ? '📱 Phone Login' : '📧 Email Login'}
                  </Text>
                </View>
                <View style={[dynamicStyles.inputContainer, errors.identifier && dynamicStyles.inputError]}>
                  <View style={dynamicStyles.inputIcon}>
                    <Ionicons 
                      name={loginType === 'phone' ? "call-outline" : "mail-outline"} 
                      size={20} 
                      color="#ffffff" 
                    />
                  </View>
                  <TextInput
                    style={dynamicStyles.textInput}
                    value={identifier}
                    onChangeText={(text) => {
                      setIdentifier(text);
                      if (errors.identifier) {
                        setErrors(prev => ({ ...prev, identifier: '' }));
                      }
                    }}
                    placeholder={getInputPlaceholder()}
                    placeholderTextColor={theme.placeholder}
                    keyboardType={loginType === 'phone' ? 'phone-pad' : 'email-address'}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading && !googleLoading}
                    returnKeyType="next"
                    blurOnSubmit={false}
                  />
                </View>
                {errors.identifier && <Text style={dynamicStyles.errorMessage}>{errors.identifier}</Text>}
              </View>

              {/* Password Input - Only show for email login */}
              {loginType === 'email' && (
                <View style={dynamicStyles.inputGroup}>
                  <Text style={dynamicStyles.inputLabel}>{t('auth.password')}</Text>
                  <View style={[dynamicStyles.inputContainer, errors.password && dynamicStyles.inputError]}>
                    <View style={dynamicStyles.inputIcon}>
                      <Ionicons name="lock-closed-outline" size={20} color="#ffffff" />
                    </View>
                    <TextInput
                      style={dynamicStyles.textInput}
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (errors.password) {
                          setErrors(prev => ({ ...prev, password: '' }));
                        }
                      }}
                      placeholder="Enter your password"
                      placeholderTextColor={theme.placeholder}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loading && !googleLoading}
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                    />
                    <TouchableOpacity
                      style={dynamicStyles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons
                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color={theme.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.password && <Text style={dynamicStyles.errorMessage}>{errors.password}</Text>}
                </View>
              )}

              {/* Login Info */}
              <View style={dynamicStyles.loginInfoContainer}>
                {loginType === 'phone' ? (
                  <Text style={dynamicStyles.loginInfoText}>
                    📱 Phone login doesn't require a password
                  </Text>
                ) : (
                  <TouchableOpacity
                    style={dynamicStyles.forgotPasswordButton}
                    onPress={handleForgotPassword}
                    disabled={loading || googleLoading}
                  >
                    <Text style={dynamicStyles.forgotPasswordText}>{t('auth.forgotPassword')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[dynamicStyles.signInButton, (loading || googleLoading) && dynamicStyles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading || googleLoading}
              activeOpacity={0.8}
            >
              <Text style={dynamicStyles.signInButtonText}>
                {loading ? t('common.loading') : t('auth.signIn')}
              </Text>
              {!loading && (
                <Ionicons name="arrow-forward" size={20} color={theme.buttonText} style={dynamicStyles.buttonArrow} />
              )}
            </TouchableOpacity>

            {/* Register Link */}
            <TouchableOpacity
              style={dynamicStyles.registerSection}
              onPress={goToRegister}
              disabled={loading || googleLoading}
            >
              <Text style={dynamicStyles.registerText}>
                {t('auth.dontHaveAccount')}{' '}
                <Text style={dynamicStyles.registerLink}>{t('auth.signUp')}</Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};


export default LoginScreen;