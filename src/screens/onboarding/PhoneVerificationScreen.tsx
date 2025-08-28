import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { getSystemFont } from '../../config/constants';

const { width } = Dimensions.get('window');

import { API_CONFIG } from '../../constants/api';

const PhoneVerificationScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { theme, isDark } = useTheme();
  const { phone, testCode, userInfo } = route.params;
  
  const [code, setCode] = useState(['', '', '', '', '', '']); // 6 digits
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [error, setError] = useState('');
  
  // Create refs for each input
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-focus first input when screen loads
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Log test code in development (no alert popup)
  useEffect(() => {
    if (testCode && __DEV__) {
      console.log('🔑 Test Code:', testCode);
    }
  }, [testCode]);

  const handleCodeChange = (text: string, index: number) => {
    // Only allow single digit
    const digit = text.replace(/[^\d]/g, '').slice(-1);
    
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    
    if (error) setError('');
    
    // Move to next input if digit entered
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Auto-verify when all 6 digits entered
    const fullCode = newCode.join('');
    if (fullCode.length === 6) {
      setTimeout(() => {
        handleVerify(fullCode);
      }, 300);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Handle backspace - move to previous input
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (otpCode?: string) => {
    const fullCode = otpCode || code.join('');
    
    if (fullCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('=== VERIFY PHONE DEBUG ===');
      console.log('API URL:', `${API_CONFIG.BASE_URL}/auth/verify-phone`);
      console.log('Request data:', {
        phone,
        code: fullCode
      });

      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/verify-phone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone,
          code: fullCode
        }),
      });

      console.log('Response status:', response.status);

      const result = await response.json();
      
      console.log('=== VERIFICATION RESPONSE ===');
      console.log('Full response:', result);

      if (response.ok && result.success) {
        console.log('✅ Phone verification successful');
        console.log('User data:', result.data.user);
        
        // Phone verification creates the user account
        // Navigate to email/password collection screen
        navigation.navigate('EmailPassword', {
          phoneVerified: true,
          userToken: result.data.token,
          refreshToken: result.data.refreshToken,
          userData: result.data.user,
          userInfo: userInfo, // Pass user info forward
          verificationData: {
            phoneVerified: true,
            timestamp: new Date().toISOString()
          }
        });
      } else {
        console.log('❌ Verification failed:', result);
        setError(result.message || 'Invalid verification code');
        setCode(['', '', '', '', '', '']); // Clear all inputs
        inputRefs.current[0]?.focus(); // Focus first input
      }
    } catch (err) {
      console.error('❌ Network/Parse error:', err);
      setError('Unable to connect to server. Please check your connection.');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || resendLoading) return;
    
    setResendLoading(true);
    setError('');
    
    try {
      console.log('=== RESEND OTP DEBUG ===');
      console.log('Phone:', phone);

      // Resend using the same registration endpoint
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/register/phone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone,
          firstName: userInfo?.firstName || 'Unknown',
          lastName: userInfo?.lastName || 'User'
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setTimer(60);
        setCode(['', '', '', '', '', '']); // Clear inputs
        inputRefs.current[0]?.focus(); // Focus first input
        Alert.alert('Code Sent', 'New verification code sent to your phone');
        
        if (result.data?.testCode && __DEV__) {
          console.log('🔑 New Test Code:', result.data.testCode);
        }
      } else {
        Alert.alert('Error', result.message || 'Failed to resend code');
      }
    } catch (err) {
      console.error('❌ Resend error:', err);
      Alert.alert('Network Error', 'Unable to connect to server.');
    } finally {
      setResendLoading(false);
    }
  };

  const formatPhone = (phone: string) => {
    if (phone.length > 10) {
      const countryCode = phone.slice(0, 4);
      const lastThree = phone.slice(-3);
      return `${countryCode} ••• •••• ${lastThree}`;
    }
    return phone;
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
    inputRefs.current.forEach(ref => ref?.blur());
  };

  const isComplete = code.every(digit => digit !== '');

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
    content: { 
      flex: 1,
      paddingHorizontal: 30,
      paddingTop: 40,
      alignItems: 'center',
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: isDark ? 'rgba(0, 145, 173, 0.1)' : 'rgba(0, 145, 173, 0.05)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 30,
    },
    title: { 
      fontSize: 32, 
      fontFamily: getSystemFont('bold'), 
      color: theme.text,
      textAlign: 'center', 
      marginBottom: 16 
    },
    subtitle: { 
      fontSize: 16, 
      fontFamily: getSystemFont('regular'), 
      color: theme.textSecondary,
      textAlign: 'center', 
      marginBottom: 40,
      lineHeight: 22
    },
    phoneText: {
      fontFamily: getSystemFont('semiBold'),
      color: theme.primary,
    },
    codeContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
      gap: 12,
    },
    digitInput: {
      width: 45,
      height: 55,
      fontSize: 24,
      fontFamily: getSystemFont('bold'),
      color: theme.text,
      backgroundColor: theme.inputBackground,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.inputBorder,
      textAlign: 'center',
    },
    digitFilled: {
      borderColor: theme.primary,
      backgroundColor: isDark ? 'rgba(0, 145, 173, 0.1)' : 'rgba(0, 145, 173, 0.05)',
    },
    inputError: {
      borderColor: theme.error,
      backgroundColor: isDark ? 'rgba(255,68,68,0.1)' : 'rgba(255,68,68,0.05)',
    },
    errorText: {
      fontSize: 14,
      color: theme.error,
      fontFamily: getSystemFont('regular'),
      textAlign: 'center',
      marginBottom: 20,
      paddingHorizontal: 20,
      lineHeight: 20,
    },
    resendContainer: {
      paddingVertical: 16,
      paddingHorizontal: 20,
      marginBottom: 20,
      borderRadius: 12,
    },
    resendDisabled: {
      opacity: 0.5,
    },
    resendText: {
      fontSize: 16,
      fontFamily: getSystemFont('medium'),
      color: theme.primary,
      textAlign: 'center',
    },
    resendTextDisabled: {
      color: theme.textSecondary,
    },
    button: { 
      backgroundColor: theme.primary,
      borderRadius: 16, 
      paddingVertical: 18,
      paddingHorizontal: 32,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 30,
      marginBottom: 40,
      elevation: 6,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    buttonDisabled: {
      opacity: 0.4,
      elevation: 0,
      shadowOpacity: 0,
    },
    buttonText: { 
      fontSize: 18, 
      fontFamily: getSystemFont('bold'), 
      color: theme.buttonText,
      marginRight: 8,
    },
    buttonIcon: {
      marginLeft: 4,
    },
  });

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={dynamicStyles.container}>
        <View style={dynamicStyles.blackBg} />
        
        <TouchableOpacity style={dynamicStyles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={isDark ? "#fcd3aa" : theme.text} />
        </TouchableOpacity>

        {/* Progress Bar */}
        <View style={dynamicStyles.progressContainer}>
          <Text style={dynamicStyles.progressText}>Step 3 of 4</Text>
          <View style={dynamicStyles.progressBar}>
            <View style={[dynamicStyles.progressFill, { width: '75%' }]} />
          </View>
        </View>

        <View style={dynamicStyles.content}>
          <View style={dynamicStyles.iconContainer}>
            <Ionicons name="phone-portrait-outline" size={48} color={theme.primary} />
          </View>

          <Text style={dynamicStyles.title}>Verify Phone</Text>
          <Text style={dynamicStyles.subtitle}>
            Enter the 6-digit code sent to{'\n'}
            <Text style={dynamicStyles.phoneText}>{formatPhone(phone)}</Text>
          </Text>

          {/* 6-Digit Input Boxes */}
          <View style={dynamicStyles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  dynamicStyles.digitInput,
                  error && dynamicStyles.inputError,
                  digit && dynamicStyles.digitFilled
                ]}
                value={digit}
                onChangeText={(text) => handleCodeChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="numeric"
                textAlign="center"
                maxLength={1}
                editable={!loading}
                selectTextOnFocus={true}
              />
            ))}
          </View>

          {error ? <Text style={dynamicStyles.errorText}>{error}</Text> : null}

          <TouchableOpacity 
            style={[dynamicStyles.resendContainer, (timer > 0 || resendLoading) && dynamicStyles.resendDisabled]}
            onPress={handleResend}
            disabled={timer > 0 || resendLoading}
          >
            <Text style={[dynamicStyles.resendText, (timer > 0 || resendLoading) && dynamicStyles.resendTextDisabled]}>
              {timer > 0 
                ? `Resend code in ${timer}s` 
                : resendLoading 
                  ? 'Sending...' 
                  : 'Resend verification code'
              }
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[dynamicStyles.button, (loading || !isComplete) && dynamicStyles.buttonDisabled]} 
          onPress={() => handleVerify()}
          disabled={loading || !isComplete}
        >
          <Text style={dynamicStyles.buttonText}>
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </Text>
          {!loading && isComplete && (
            <Ionicons name="arrow-forward" size={20} color={theme.buttonText} style={dynamicStyles.buttonIcon} />
          )}
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
};


export default PhoneVerificationScreen;