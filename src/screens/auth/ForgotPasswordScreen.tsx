import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_CONFIG } from '../../constants/api';
import { useTranslation } from '../../i18n/simpleI18n';

const { height, width } = Dimensions.get('window');

// Use the centralized API configuration
const API_BASE_URL = API_CONFIG.BASE_URL;

const ForgotPasswordScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const validateEmail = () => {
    if (!email.trim()) {
      setError(t('auth.emailRequired'));
      return false;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    setError('');
    return true;
  };

  const handleSendResetEmail = async () => {
    if (!validateEmail()) return;
    
    setLoading(true);
    setError('');

    try {
      console.log('=== FORGOT PASSWORD DEBUG ===');
      console.log('API URL:', `${API_BASE_URL}/auth/forgot-password`);
      console.log('Request data:', { email: email.toLowerCase().trim() });

      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim()
        }),
      });

      console.log('Response status:', response.status);

      const result = await response.json();
      
      console.log('=== FORGOT PASSWORD RESPONSE ===');
      console.log('Full response:', result);

      if (response.ok && result.success) {
        console.log('✅ Reset email sent successfully');
        setEmailSent(true);
        
        // Show development test code if available
        if (result.testCode && __DEV__) {
          console.log('🔑 Reset Code (DEV):', result.testCode);
        }
      } else {
        console.log('❌ Reset email failed:', result);
        // Don't show specific error for security - your backend returns generic message
        setError('If an account with this email exists, a reset code has been sent.');
      }
    } catch (error: any) {
      console.error('❌ Network/Parse error:', error);
      Alert.alert('Network Error', 'Unable to connect to server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setEmailSent(false);
    await handleSendResetEmail();
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const goToLogin = () => {
    navigation.navigate('Login');
  };

  const goToResetPassword = () => {
    navigation.navigate('ResetPassword', { email: email.toLowerCase().trim() });
  };

  if (emailSent) {
    return (
      <View style={styles.container}>
        <View style={styles.blackBackground} />
        
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={28} color="#fcd3aa" />
        </TouchableOpacity>

        <View style={styles.successContainer}>
          <View style={styles.successIconContainer}>
            <Ionicons name="mail-outline" size={64} color="#0091ad" />
          </View>
          
          <Text style={styles.successTitle}>{t('auth.checkYourEmail')}</Text>
          <Text style={styles.successMessage}>
            {t('auth.weSentReset')}
          </Text>
          <Text style={styles.emailText}>{email}</Text>
          
          <Text style={styles.instructionText}>
            {t('auth.checkEmailInstructions')}
          </Text>

          <TouchableOpacity 
            style={styles.enterCodeButton}
            onPress={goToResetPassword}
          >
            <Text style={styles.enterCodeButtonText}>{t('auth.enterResetCode')}</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonArrow} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.resendButton}
            onPress={handleResendEmail}
            disabled={loading}
          >
            <Text style={styles.resendButtonText}>
              {loading ? 'Sending...' : 'Resend Code'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.backToLoginContainer}
            onPress={goToLogin}
          >
            <Text style={styles.backToLoginText}>{t('auth.backToSignIn')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.blackBackground} />

      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Ionicons name="chevron-back" size={28} color="#fcd3aa" />
      </TouchableOpacity>

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="lock-closed-outline" size={48} color="#0091ad" />
          </View>
          <Text style={styles.title}>{t('auth.forgotPassword')}</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you a verification code to reset your password.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('auth.emailAddress')}</Text>
            <View style={[styles.inputContainer, error && styles.inputError]}>
              <View style={styles.inputIconContainer}>
                <Ionicons name="mail-outline" size={20} color="#ffffff" />
              </View>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) setError('');
                }}
                placeholder="Enter your email address"
                placeholderTextColor="rgba(252, 211, 170, 0.4)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                autoFocus={true}
              />
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>

          {/* Send Reset Email Button */}
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.buttonDisabled]}
            onPress={handleSendResetEmail}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {loading ? t('common.loading') : t('auth.sendResetCode')}
            </Text>
            {!loading && (
              <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonArrow} />
            )}
          </TouchableOpacity>

          {/* Back to Login */}
          <TouchableOpacity 
            style={styles.backToLoginContainer} 
            onPress={goToLogin}
            disabled={loading}
          >
            <Text style={styles.backToLoginText}>
              Remember your password? 
              <Text style={styles.backToLoginLink}> {t('auth.signIn')}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blackBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    backgroundColor: '#000000',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 145, 173, 0.3)', // Updated to new color scheme
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 145, 173, 0.1)', // Updated to new color scheme
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fcd3aa', // Updated to new color scheme
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(252, 211, 170, 0.7)', // Updated to new color scheme
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    marginTop: 20,
  },
  inputGroup: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fcd3aa', // Updated to new color scheme
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(252, 211, 170, 0.1)', // Updated to new color scheme
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(252, 211, 170, 0.2)', // Updated to new color scheme
    paddingRight: 16,
    paddingVertical: 4,
    minHeight: 56,
  },
  inputError: {
    borderColor: '#ff4444',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },
  inputIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#0091ad', // Updated to new color scheme
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginLeft: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#fcd3aa', // Updated to new color scheme
    fontWeight: '400',
    paddingVertical: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#ff4444',
    fontWeight: '400',
    marginTop: 6,
    marginLeft: 4,
  },
  submitButton: {
    backgroundColor: '#0091ad', // Updated to new color scheme
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    elevation: 6,
    shadowColor: '#0091ad', // Updated to new color scheme
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  buttonArrow: {
    marginLeft: 8,
  },
  backToLoginContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  backToLoginText: {
    fontSize: 16,
    color: 'rgba(252, 211, 170, 0.7)', // Updated to new color scheme
    fontWeight: '400',
  },
  backToLoginLink: {
    color: '#04a7c7', // Updated to new color scheme
    fontWeight: '700',
  },

  // Success State Styles
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 145, 173, 0.1)', // Updated to new color scheme
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fcd3aa', // Updated to new color scheme
    marginBottom: 16,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(252, 211, 170, 0.7)', // Updated to new color scheme
    textAlign: 'center',
    marginBottom: 8,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#04a7c7', // Updated to new color scheme
    textAlign: 'center',
    marginBottom: 24,
  },
  instructionText: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(252, 211, 170, 0.6)', // Updated to new color scheme
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  enterCodeButton: {
    backgroundColor: '#0091ad', // Updated to new color scheme
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#0091ad', // Updated to new color scheme
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  enterCodeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  resendButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 145, 173, 0.5)', // Updated to new color scheme
    marginBottom: 16,
  },
  resendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#04a7c7', // Updated to new color scheme
    textAlign: 'center',
  },
});

export default ForgotPasswordScreen;