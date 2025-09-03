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
import { API_CONFIG } from '../../constants/api';
import { getSystemFont } from '../../config/constants';

const { width } = Dimensions.get('window');

// Use the centralized API configuration
const API_BASE_URL = API_CONFIG.BASE_URL;

const EmailVerificationScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { email, userToken, refreshToken, userData, userInfo, testCode, emailAdded } = route.params;
  
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

  // Log test code in development (no popup)
  useEffect(() => {
    if (testCode && __DEV__) {
      console.log('🔑 Email Test Code:', testCode);
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

    if (!userToken) {
      Alert.alert('Error', 'Authentication token missing. Please restart the process.');
      navigation.navigate('PhoneInput');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('=== VERIFY EMAIL DEBUG ===');
      console.log('API URL:', `${API_BASE_URL}/auth/verify-email`);
      console.log('Request data:', {
        email: email,
        code: fullCode
      });
      console.log('Using token:', userToken);

      const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`, // Required for authenticated endpoint
        },
        body: JSON.stringify({
          email: email,
          code: fullCode
        }),
      });

      console.log('Response status:', response.status);

      const result = await response.json();
      
      console.log('=== EMAIL VERIFICATION RESPONSE ===');
      console.log('Full response:', result);

      if (response.ok && result.success) {
        console.log('✅ Email verification successful');
        console.log('Updated user data:', result.data.user);
        
        // Email verification completes the registration process
        navigation.replace('Congratulations', {
          userData: result.data.user,
          userToken: userToken,
          refreshToken: refreshToken,
          userInfo: userInfo, // Pass registration form data
          emailVerified: true,
          registrationComplete: true
        });
      } else {
        console.log('❌ Email verification failed:', result);
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
    
    if (!userToken) {
      Alert.alert('Error', 'Authentication token missing. Please restart the process.');
      return;
    }
    
    setResendLoading(true);
    setError('');
    
    try {
      console.log('=== RESEND EMAIL CODE DEBUG ===');
      console.log('Email:', email);

      // Resend using the same add-email endpoint
      const response = await fetch(`${API_BASE_URL}/auth/add-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          email: email,
          password: 'temp-password-for-resend' // This won't update the existing password
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setTimer(60);
        setCode(['', '', '', '', '', '']); // Clear inputs
        inputRefs.current[0]?.focus(); // Focus first input
        Alert.alert('Code Sent', 'New verification code sent to your email');
        
        if (result.data?.testCode && __DEV__) {
          console.log('🔑 New Email Test Code:', result.data.testCode);
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

  const formatEmail = (email: string) => {
    const [local, domain] = email.split('@');
    if (local.length <= 3) return email;
    return `${local.slice(0, 2)}${'•'.repeat(Math.max(1, local.length - 4))}${local.slice(-2)}@${domain}`;
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
    inputRefs.current.forEach(ref => ref?.blur());
  };

  const isComplete = code.every(digit => digit !== '');

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.container}>
        <View style={styles.blackBg} />
        
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#fcd3aa" />
        </TouchableOpacity>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>Step 4 of 4</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '100%' }]} />
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="mail-outline" size={48} color="#0091ad" />
          </View>

          <Text style={styles.title}>Verify Email</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{'\n'}
            <Text style={styles.emailText}>{formatEmail(email)}</Text>
          </Text>

          {/* Email Added Badge */}
          {emailAdded && (
            <View style={styles.successBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#0091ad" />
              <Text style={styles.successText}>Email added to your account!</Text>
            </View>
          )}

          {/* 6-Digit Input Boxes */}
          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  styles.digitInput,
                  error && styles.inputError,
                  digit && styles.digitFilled
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

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity 
            style={[styles.resendContainer, (timer > 0 || resendLoading) && styles.resendDisabled]}
            onPress={handleResend}
            disabled={timer > 0 || resendLoading}
          >
            <Text style={[styles.resendText, (timer > 0 || resendLoading) && styles.resendTextDisabled]}>
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
          style={[styles.button, (loading || !isComplete) && styles.buttonDisabled]} 
          onPress={() => handleVerify()}
          disabled={loading || !isComplete}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Verifying...' : 'Complete Registration'}
          </Text>
          {!loading && isComplete && (
            <Ionicons name="checkmark-circle" size={20} color="#fff" style={styles.buttonIcon} />
          )}
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  blackBg: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    backgroundColor: '#000' 
  },
  backBtn: { 
    position: 'absolute', 
    top: 60, 
    left: 20, 
    zIndex: 10, 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: 'rgba(0, 145, 173, 0.1)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  progressContainer: { 
    paddingTop: 80, 
    paddingHorizontal: 30, 
    paddingBottom: 20 
  },
  progressText: { 
    fontSize: 14, 
    fontFamily: getSystemFont('medium'), 
    color: '#0091ad', 
    textAlign: 'center', 
    marginBottom: 12 
  },
  progressBar: { 
    height: 4, 
    backgroundColor: 'rgba(252, 211, 170, 0.2)', 
    borderRadius: 2 
  },
  progressFill: { 
    height: '100%', 
    backgroundColor: '#0091ad', 
    borderRadius: 2 
  },
  content: { 
    flex: 1, 
    paddingHorizontal: 30, 
    paddingTop: 40, 
    alignItems: 'center' 
  },
  iconContainer: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: 'rgba(0, 145, 173, 0.1)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 30 
  },
  title: { 
    fontSize: 32, 
    fontFamily: getSystemFont('bold'), 
    color: '#fcd3aa', 
    textAlign: 'center', 
    marginBottom: 16 
  },
  subtitle: { 
    fontSize: 16, 
    fontFamily: getSystemFont('regular'), 
    color: 'rgba(252, 211, 170, 0.7)', 
    textAlign: 'center', 
    marginBottom: 30, 
    lineHeight: 22 
  },
  emailText: { 
    fontFamily: getSystemFont('semiBold'), 
    color: '#04a7c7' 
  },
  successBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: 'rgba(0, 145, 173, 0.1)', 
    borderRadius: 12, 
    paddingVertical: 12, 
    paddingHorizontal: 16, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: 'rgba(0, 145, 173, 0.3)' 
  },
  successText: { 
    fontSize: 14, 
    fontFamily: getSystemFont('medium'), 
    color: '#04a7c7', 
    marginLeft: 8 
  },
  userInfoBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: 'rgba(252, 211, 170, 0.1)', 
    borderRadius: 12, 
    paddingVertical: 10, 
    paddingHorizontal: 16, 
    marginBottom: 30, 
    borderWidth: 1, 
    borderColor: 'rgba(252, 211, 170, 0.2)',
    display: 'none' // Hide this component
  },
  userInfoText: { 
    fontSize: 12, 
    fontFamily: getSystemFont('regular'), 
    color: 'rgba(252, 211, 170, 0.8)', 
    marginLeft: 6 
  },
  codeContainer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 20, 
    gap: 12 
  },
  digitInput: { 
    width: 45, 
    height: 55, 
    fontSize: 24, 
    fontFamily: getSystemFont('bold'), 
    color: '#fcd3aa', 
    backgroundColor: 'rgba(252, 211, 170, 0.08)', 
    borderRadius: 12, 
    borderWidth: 2, 
    borderColor: 'rgba(252, 211, 170, 0.15)', 
    textAlign: 'center' 
  },
  digitFilled: { 
    borderColor: '#0091ad', 
    backgroundColor: 'rgba(0, 145, 173, 0.1)' 
  },
  inputError: { 
    borderColor: '#ff4444', 
    backgroundColor: 'rgba(255,68,68,0.1)' 
  },
  errorText: { 
    fontSize: 14, 
    color: '#ff4444', 
    fontFamily: getSystemFont('regular'), 
    textAlign: 'center', 
    marginBottom: 20, 
    paddingHorizontal: 20, 
    lineHeight: 20 
  },
  resendContainer: { 
    paddingVertical: 16, 
    paddingHorizontal: 20, 
    marginBottom: 20, 
    borderRadius: 12 
  },
  resendDisabled: { 
    opacity: 0.5 
  },
  resendText: { 
    fontSize: 16, 
    fontFamily: getSystemFont('medium'), 
    color: '#04a7c7', 
    textAlign: 'center' 
  },
  resendTextDisabled: { 
    color: 'rgba(252, 211, 170, 0.4)' 
  },
  button: { 
    backgroundColor: '#0091ad', 
    borderRadius: 16, 
    paddingVertical: 18, 
    paddingHorizontal: 32, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginHorizontal: 30, 
    marginBottom: 40, 
    elevation: 6, 
    shadowColor: '#0091ad', 
    shadowOffset: { width: 0, height: 3 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 8 
  },
  buttonDisabled: { 
    opacity: 0.4, 
    elevation: 0, 
    shadowOpacity: 0 
  },
  buttonText: { 
    fontSize: 18, 
    fontFamily: getSystemFont('bold'), 
    color: '#fff', 
    marginRight: 8 
  },
  buttonIcon: { 
    marginLeft: 4 
  },
});

export default EmailVerificationScreen;