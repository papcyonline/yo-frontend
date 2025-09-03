import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_CONFIG } from '../../constants/api';
import { useTheme } from '../../context/ThemeContext';
import { getSystemFont } from '../../config/constants';

// Use the centralized API configuration
const API_BASE_URL = API_CONFIG.BASE_URL;

const EmailPasswordScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { theme, isDark } = useTheme();
  const { phoneVerified, userToken, refreshToken, userData, userInfo } = route.params;
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validatePassword = (password: string) => {
    return {
      isValid: password.length >= 6, // Simple 6+ character requirement
      strongPassword: password.length >= 8,
      missingCount: 0
    };
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else {
      const validation = validatePassword(password);
      if (!validation.isValid) {
        newErrors.password = 'Password must be at least 6 characters long';
      }
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (!validateForm()) return;
    
    if (!userToken) {
      Alert.alert('Error', 'Authentication token missing. Please restart the registration process.');
      navigation.navigate('PhoneInput');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('=== ADD EMAIL DEBUG ===');
      console.log('API URL:', `${API_BASE_URL}/auth/add-email`);
      console.log('Request data:', {
        email: email.toLowerCase().trim(),
        password: '[HIDDEN]'
      });
      console.log('Using token:', userToken);

      const response = await fetch(`${API_BASE_URL}/auth/add-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`, // Required for authenticated endpoint
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password: password,
          userInfo: userInfo // Include the complete registration form data
        }),
      });

      console.log('Response status:', response.status);

      const result = await response.json();
      
      console.log('=== ADD EMAIL RESPONSE ===');
      console.log('Full response:', result);

      if (response.ok && result.success) {
        console.log('✅ Email registration successful');
        
        // Navigate to email verification screen
        navigation.navigate('EmailVerification', {
          email: result.data.email,
          userToken: userToken,
          refreshToken: refreshToken,
          userData: userData,
          userInfo: userInfo, // Pass user info forward
          testCode: result.data.testCode, // Development mode
          emailAdded: true
        });
      } else {
        console.log('❌ Email registration failed:', result);
        
        if (result.message && result.message.toLowerCase().includes('email already in use')) {
          setErrors({ email: 'This email is already registered' });
        } else if (result.message && result.message.toLowerCase().includes('password')) {
          setErrors({ password: result.message });
        } else {
          Alert.alert('Error', result.message || 'Failed to add email');
        }
      }
    } catch (err) {
      console.error('❌ Network/Parse error:', err);
      Alert.alert('Error', 'Unable to connect to server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    if (!password) return null;
    
    if (password.length < 6) return { color: '#ff4444', text: 'Too Short', width: '25%' };
    if (password.length < 8) return { color: '#ffaa00', text: 'Okay', width: '50%' };
    if (password.length < 12) return { color: '#04a7c7', text: 'Good', width: '75%' };
    return { color: '#0091ad', text: 'Strong', width: '100%' };
  };

  const passwordStrength = getPasswordStrength();

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Create dynamic styles based on theme
  const dynamicStyles = StyleSheet.create({
    container: { 
      flex: 1 
    },
    blackBg: { 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: theme.background 
    },
    backBtn: { 
      position: 'absolute', 
      top: 60, 
      left: 20, 
      zIndex: 10, 
      width: 40, 
      height: 40, 
      borderRadius: 20, 
      backgroundColor: isDark ? 'rgba(0, 145, 173, 0.1)' : 'rgba(0, 145, 173, 0.1)',
      justifyContent: 'center', 
      alignItems: 'center' 
    },
    progressContainer: {
      paddingTop: 80,
      paddingHorizontal: 30,
      paddingBottom: 20,
    },
    progressText: {
      fontSize: 14,
      fontFamily: getSystemFont('medium'),
      color: theme.primary,
      textAlign: 'center',
      marginBottom: 12,
    },
    progressBar: {
      height: 4,
      backgroundColor: theme.divider,
      borderRadius: 2,
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.primary,
      borderRadius: 2,
    },
    scrollView: { 
      flex: 1 
    },
    content: { 
      paddingHorizontal: 30, 
      paddingBottom: 20 
    },
    title: { 
      fontSize: 32, 
      fontFamily: getSystemFont('bold'), 
      color: theme.text,
      textAlign: 'center', 
      marginBottom: 8 
    },
    subtitle: { 
      fontSize: 16, 
      fontFamily: getSystemFont('regular'), 
      color: theme.textSecondary,
      textAlign: 'center', 
      marginBottom: 30 
    },
    verifiedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(0, 145, 173, 0.1)' : 'rgba(0, 145, 173, 0.05)',
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(0, 145, 173, 0.3)' : 'rgba(0, 145, 173, 0.15)',
    },
    verifiedText: {
      fontSize: 14,
      fontFamily: getSystemFont('medium'),
      color: theme.primary,
      marginLeft: 8,
    },
    userInfoBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.inputBackground,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginBottom: 30,
      borderWidth: 1,
      borderColor: theme.inputBorder,
    },
    userInfoText: {
      fontSize: 14,
      fontFamily: getSystemFont('medium'),
      color: theme.text,
      marginLeft: 8,
    },
    inputGroup: { 
      marginBottom: 20 
    },
    label: { 
      fontSize: 16, 
      fontFamily: getSystemFont('bold'), 
      color: theme.text,
      marginBottom: 8 
    },
    inputContainer: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      backgroundColor: theme.inputBackground,
      borderRadius: 12, 
      borderWidth: 1, 
      borderColor: theme.inputBorder,
      paddingRight: 16 
    },
    inputError: { 
      borderColor: theme.error, 
      backgroundColor: isDark ? 'rgba(255,68,68,0.1)' : 'rgba(255,68,68,0.05)' 
    },
    iconContainer: { 
      width: 40, 
      height: 40, 
      borderRadius: 8, 
      backgroundColor: theme.primary,
      justifyContent: 'center', 
      alignItems: 'center', 
      marginLeft: 8, 
      marginRight: 12 
    },
    input: { 
      flex: 1, 
      fontSize: 16, 
      color: theme.text,
      fontFamily: getSystemFont('regular'), 
      paddingVertical: 16 
    },
    error: { 
      fontSize: 14, 
      color: theme.error, 
      fontFamily: getSystemFont('regular'), 
      marginTop: 6, 
      marginLeft: 4 
    },
    strengthContainer: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      marginTop: 8, 
      marginLeft: 4 
    },
    strengthBar: { 
      flex: 1, 
      height: 4, 
      backgroundColor: theme.divider,
      borderRadius: 2, 
      marginRight: 12 
    },
    strengthFill: { 
      height: '100%', 
      borderRadius: 2 
    },
    strengthText: { 
      fontSize: 12, 
      fontFamily: getSystemFont('semiBold') 
    },
    securityNote: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 10,
      paddingHorizontal: 20,
    },
    securityText: {
      fontSize: 12,
      fontFamily: getSystemFont('regular'),
      color: theme.textSecondary,
      marginLeft: 6,
      textAlign: 'center',
      lineHeight: 16,
    },
    button: { 
      backgroundColor: theme.primary,
      borderRadius: 16, 
      paddingVertical: 18,
      paddingHorizontal: 32,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      margin: 30,
      elevation: 6,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    buttonDisabled: { 
      opacity: 0.6 
    },
    buttonText: { 
      fontSize: 18, 
      fontFamily: getSystemFont('bold'), 
      color: theme.buttonText, 
      marginRight: 8 
    },
    buttonIcon: { 
      marginLeft: 4 
    },
  });

  return (
    <KeyboardAvoidingView 
      style={dynamicStyles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View style={dynamicStyles.container}>
          <View style={dynamicStyles.blackBg} />
          
          <TouchableOpacity style={dynamicStyles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={isDark ? "#fcd3aa" : theme.text} />
          </TouchableOpacity>

          {/* Progress Bar */}
          <View style={dynamicStyles.progressContainer}>
            <Text style={dynamicStyles.progressText}>Step 4 of 4</Text>
            <View style={dynamicStyles.progressBar}>
              <View style={[dynamicStyles.progressFill, { width: '100%' }]} />
            </View>
          </View>

          <ScrollView style={dynamicStyles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={dynamicStyles.content}>
              <Text style={dynamicStyles.title}>Email & Password</Text>
              <Text style={dynamicStyles.subtitle}>Add email and password to your account</Text>

              {/* Phone Verified Badge */}
              <View style={dynamicStyles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                <Text style={dynamicStyles.verifiedText}>
                  Phone verified: {userData?.phone || 'Verified'}
                </Text>
              </View>

              {/* User Info Display */}
              {(userData || userInfo) && (
                <View style={dynamicStyles.userInfoBadge}>
                  <Ionicons name="person-circle-outline" size={20} color={theme.primary} />
                  <Text style={dynamicStyles.userInfoText}>
                    {userInfo?.firstName || userData?.firstName} {userInfo?.lastName || userData?.lastName}
                    {userInfo?.username && ` (@${userInfo.username})`}
                  </Text>
                </View>
              )}

              {/* Email */}
              <View style={dynamicStyles.inputGroup}>
                <Text style={dynamicStyles.label}>Email Address</Text>
                <View style={[dynamicStyles.inputContainer, errors.email && dynamicStyles.inputError]}>
                  <View style={dynamicStyles.iconContainer}>
                    <Ionicons name="mail-outline" size={20} color="#ffffff" />
                  </View>
                  <TextInput
                    style={dynamicStyles.input}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (errors.email) setErrors(prev => ({...prev, email: ''}));
                    }}
                    placeholder="Enter your email"
                    placeholderTextColor={theme.placeholder}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                {errors.email && <Text style={dynamicStyles.error}>{errors.email}</Text>}
              </View>

              {/* Password */}
              <View style={dynamicStyles.inputGroup}>
                <Text style={dynamicStyles.label}>Password</Text>
                <View style={[dynamicStyles.inputContainer, errors.password && dynamicStyles.inputError]}>
                  <View style={dynamicStyles.iconContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#ffffff" />
                  </View>
                  <TextInput
                    style={dynamicStyles.input}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errors.password) setErrors(prev => ({...prev, password: ''}));
                    }}
                    placeholder="Create a password"
                    placeholderTextColor={theme.placeholder}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons 
                      name={showPassword ? "eye-outline" : "eye-off-outline"} 
                      size={20} 
                      color={theme.textSecondary} 
                    />
                  </TouchableOpacity>
                </View>
                
                {/* Password Strength */}
                {password && passwordStrength && (
                  <View style={dynamicStyles.strengthContainer}>
                    <View style={dynamicStyles.strengthBar}>
                      <View 
                        style={[dynamicStyles.strengthFill, { 
                          backgroundColor: passwordStrength.color, 
                          width: passwordStrength.width 
                        }]} 
                      />
                    </View>
                    <Text style={[dynamicStyles.strengthText, { color: passwordStrength.color }]}>
                      {passwordStrength.text}
                    </Text>
                  </View>
                )}
                
                {errors.password && <Text style={dynamicStyles.error}>{errors.password}</Text>}
              </View>

              {/* Confirm Password */}
              <View style={dynamicStyles.inputGroup}>
                <Text style={dynamicStyles.label}>Confirm Password</Text>
                <View style={[dynamicStyles.inputContainer, errors.confirmPassword && dynamicStyles.inputError]}>
                  <View style={dynamicStyles.iconContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#ffffff" />
                  </View>
                  <TextInput
                    style={dynamicStyles.input}
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (errors.confirmPassword) setErrors(prev => ({...prev, confirmPassword: ''}));
                    }}
                    placeholder="Confirm your password"
                    placeholderTextColor={theme.placeholder}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Ionicons 
                      name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                      size={20} 
                      color={theme.textSecondary} 
                    />
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && <Text style={dynamicStyles.error}>{errors.confirmPassword}</Text>}
              </View>

              {/* Security Note */}
              <View style={dynamicStyles.securityNote}>
                <Ionicons name="shield-checkmark-outline" size={16} color={theme.primary} />
                <Text style={dynamicStyles.securityText}>
                  Your password will be securely encrypted and stored
                </Text>
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity 
            style={[dynamicStyles.button, loading && dynamicStyles.buttonDisabled]} 
            onPress={handleContinue}
            disabled={loading}
          >
            <Text style={dynamicStyles.buttonText}>
              {loading ? 'Adding Email...' : 'Add Email & Continue'}
            </Text>
            {!loading && (
              <Ionicons name="arrow-forward" size={20} color={theme.buttonText} style={dynamicStyles.buttonIcon} />
            )}
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};


export default EmailPasswordScreen;