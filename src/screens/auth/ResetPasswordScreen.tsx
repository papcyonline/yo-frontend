import React, { useState, useRef } from 'react';
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
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_CONFIG } from '../../constants/api';

const { height, width } = Dimensions.get('window');

// Use the centralized API configuration
const API_BASE_URL = API_CONFIG.BASE_URL;

interface ResetPasswordScreenProps {
  navigation: any;
  route: {
    params: {
      email: string;
    };
  };
}

const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ navigation, route }) => {
  const { email } = route.params || {};
  
  const [code, setCode] = useState(['', '', '', '', '', '']); // 6 digits
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Create refs for each code input
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleCodeChange = (text: string, index: number) => {
    // Only allow single digit
    const digit = text.replace(/[^\d]/g, '').slice(-1);
    
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    
    if (errors.code) {
      setErrors(prev => ({...prev, code: ''}));
    }
    
    // Move to next input if digit entered
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Handle backspace - move to previous input
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const validatePassword = (password: string) => {
    const requirements = {
      minLength: password.length >= 6, // Match your backend requirement
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };

    const missingRequirements = [];
    if (!requirements.minLength) missingRequirements.push('6+ characters');
    if (!requirements.hasUppercase) missingRequirements.push('uppercase letter');
    if (!requirements.hasLowercase) missingRequirements.push('lowercase letter');
    if (!requirements.hasNumber) missingRequirements.push('number');
    if (!requirements.hasSpecialChar) missingRequirements.push('special character');

    return {
      isValid: requirements.minLength, // Your backend only requires 6+ chars
      strongPassword: Object.values(requirements).every(req => req),
      requirements,
      missingRequirements
    };
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      newErrors.code = 'Please enter the complete 6-digit code';
    }
    
    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else {
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        newErrors.newPassword = 'Password must be at least 6 characters long';
      }
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;
    
    if (!email) {
      Alert.alert('Error', 'Email is missing. Please go back and try again.');
      return;
    }
    
    setLoading(true);
    setErrors({});

    try {
      const fullCode = code.join('');
      
      console.log('=== RESET PASSWORD DEBUG ===');
      console.log('API URL:', `${API_BASE_URL}/auth/reset-password`);
      console.log('Request data:', {
        email,
        code: fullCode,
        newPassword: '[HIDDEN]'
      });

      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          code: fullCode,
          newPassword: newPassword
        }),
      });

      console.log('Response status:', response.status);

      const result = await response.json();
      
      console.log('=== RESET PASSWORD RESPONSE ===');
      console.log('Full response:', result);

      if (response.ok && result.success) {
        console.log('✅ Password reset successful');
        Alert.alert(
          'Password Reset Successful',
          'Your password has been updated successfully. You can now sign in with your new password.',
          [
            {
              text: 'Sign In',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      } else {
        console.log('❌ Password reset failed:', result);
        
        if (result.message?.toLowerCase().includes('invalid') || result.message?.toLowerCase().includes('expired')) {
          setErrors({ code: 'Invalid or expired reset code' });
        } else {
          Alert.alert('Reset Failed', result.message || 'Failed to reset password');
        }
      }
    } catch (error: any) {
      console.error('❌ Network/Parse error:', error);
      Alert.alert('Network Error', 'Unable to connect to server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const goToLogin = () => {
    navigation.navigate('Login');
  };

  const getPasswordStrength = () => {
    if (!newPassword) return null;
    
    const validation = validatePassword(newPassword);
    const score = Object.values(validation.requirements).filter(Boolean).length;
    
    if (score < 2) return { color: '#ff4444', text: 'Weak', width: '25%' };
    if (score < 4) return { color: '#ffaa00', text: 'Fair', width: '50%' };
    if (score < 5) return { color: '#04a7c7', text: 'Good', width: '75%' };
    return { color: '#0091ad', text: 'Strong', width: '100%' };
  };

  const passwordStrength = getPasswordStrength();

  const formatEmail = (email: string) => {
    const [local, domain] = email.split('@');
    if (local.length <= 3) return email;
    return `${local.slice(0, 2)}${'•'.repeat(Math.max(1, local.length - 4))}${local.slice(-2)}@${domain}`;
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.blackBackground} />

      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Ionicons name="chevron-back" size={28} color="#fcd3aa" />
      </TouchableOpacity>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="key-outline" size={48} color="#0091ad" />
          </View>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{'\n'}
            <Text style={styles.emailText}>{formatEmail(email)}</Text>
            {'\n'}and create your new password
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Verification Code */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Verification Code</Text>
            <View style={styles.codeContainer}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={[
                    styles.digitInput,
                    errors.code && styles.inputError,
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
            {errors.code && <Text style={styles.errorText}>{errors.code}</Text>}
          </View>

          {/* New Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>New Password</Text>
            <View style={[styles.inputContainer, errors.newPassword && styles.inputError]}>
              <View style={styles.inputIconContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#ffffff" />
              </View>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  if (errors.newPassword) {
                    setErrors(prev => ({...prev, newPassword: ''}));
                  }
                }}
                placeholder="Enter your new password"
                placeholderTextColor="rgba(252, 211, 170, 0.4)"
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <Ionicons 
                  name={showNewPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color="rgba(252, 211, 170, 0.6)" 
                />
              </TouchableOpacity>
            </View>
            
            {/* Password Strength Indicator */}
            {newPassword && passwordStrength && (
              <View style={styles.passwordStrengthContainer}>
                <View style={styles.passwordStrengthBar}>
                  <View 
                    style={[
                      styles.passwordStrengthFill, 
                      { backgroundColor: passwordStrength.color, width: passwordStrength.width }
                    ]} 
                  />
                </View>
                <Text style={[styles.passwordStrengthText, { color: passwordStrength.color }]}>
                  {passwordStrength.text}
                </Text>
              </View>
            )}
            
            {errors.newPassword && <Text style={styles.errorText}>{errors.newPassword}</Text>}
            <Text style={styles.helperText}>
              Must be at least 6 characters long
            </Text>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm New Password</Text>
            <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
              <View style={styles.inputIconContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#ffffff" />
              </View>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errors.confirmPassword) {
                    setErrors(prev => ({...prev, confirmPassword: ''}));
                  }
                }}
                placeholder="Confirm your new password"
                placeholderTextColor="rgba(252, 211, 170, 0.4)"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons 
                  name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color="rgba(252, 211, 170, 0.6)" 
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
          </View>

          {/* Reset Password Button */}
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.buttonDisabled]}
            onPress={handleResetPassword}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Updating Password...' : 'Update Password'}
            </Text>
            {!loading && (
              <Ionicons name="checkmark-circle" size={20} color="#fff" style={styles.buttonIcon} />
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
              <Text style={styles.backToLoginLink}> Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  scrollContainer: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 145, 173, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    paddingTop: 120,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 145, 173, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fcd3aa',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(252, 211, 170, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
  },
  emailText: {
    fontWeight: '600',
    color: '#04a7c7',
  },
  formContainer: {
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fcd3aa',
    marginBottom: 8,
  },

  // Code Input Styles
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  digitInput: {
    width: 45,
    height: 55,
    fontSize: 24,
    fontWeight: '700',
    color: '#fcd3aa',
    backgroundColor: 'rgba(252, 211, 170, 0.08)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(252, 211, 170, 0.15)',
    textAlign: 'center',
  },
  digitFilled: {
    borderColor: '#0091ad',
    backgroundColor: 'rgba(0, 145, 173, 0.1)',
  },

  // Regular Input Styles
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(252, 211, 170, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(252, 211, 170, 0.2)',
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
    backgroundColor: '#0091ad',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginLeft: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#fcd3aa',
    fontWeight: '400',
    paddingVertical: 12,
  },
  eyeButton: {
    padding: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#ff4444',
    fontWeight: '400',
    marginTop: 6,
    marginLeft: 4,
  },
  helperText: {
    fontSize: 12,
    color: 'rgba(252, 211, 170, 0.5)',
    fontWeight: '400',
    marginTop: 6,
    marginLeft: 4,
    lineHeight: 16,
  },
  passwordStrengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 4,
  },
  passwordStrengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(252, 211, 170, 0.2)',
    borderRadius: 2,
    marginRight: 12,
  },
  passwordStrengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  passwordStrengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#0091ad',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 24,
    elevation: 6,
    shadowColor: '#0091ad',
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
  buttonIcon: {
    marginLeft: 8,
  },
  backToLoginContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  backToLoginText: {
    fontSize: 16,
    color: 'rgba(252, 211, 170, 0.7)',
    fontWeight: '400',
  },
  backToLoginLink: {
    color: '#04a7c7',
    fontWeight: '700',
  },
});

export default ResetPasswordScreen;