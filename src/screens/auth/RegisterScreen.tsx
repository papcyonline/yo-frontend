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
  Dimensions,
  ScrollView,
  Modal,
  FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../../services/api/auth';
import { getSystemFont } from '../../config/constants';

const { height, width } = Dimensions.get('window');

// Country codes for phone numbers
const COUNTRIES = [
  { code: '+971', name: 'UAE', flag: '🇦🇪', iso: 'AE' },
  { code: '+1', name: 'United States', flag: '🇺🇸', iso: 'US' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧', iso: 'GB' },
  { code: '+91', name: 'India', flag: '🇮🇳', iso: 'IN' },
  { code: '+33', name: 'France', flag: '🇫🇷', iso: 'FR' },
  { code: '+49', name: 'Germany', flag: '🇩🇪', iso: 'DE' },
  { code: '+86', name: 'China', flag: '🇨🇳', iso: 'CN' },
  { code: '+81', name: 'Japan', flag: '🇯🇵', iso: 'JP' },
  { code: '+61', name: 'Australia', flag: '🇦🇺', iso: 'AU' },
  { code: '+55', name: 'Brazil', flag: '🇧🇷', iso: 'BR' },
];

const RegisterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]); // Default to UAE
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validatePassword = (password: string) => {
    const requirements = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };

    const missingRequirements = [];
    if (!requirements.minLength) missingRequirements.push('8+ characters');
    if (!requirements.hasUppercase) missingRequirements.push('uppercase letter');
    if (!requirements.hasLowercase) missingRequirements.push('lowercase letter');
    if (!requirements.hasNumber) missingRequirements.push('number');
    if (!requirements.hasSpecialChar) missingRequirements.push('special character');

    return {
      isValid: Object.values(requirements).every(req => req),
      requirements,
      missingRequirements
    };
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      const cleanPhone = phone.replace(/\s/g, '');
      if (!/^\d{7,15}$/.test(cleanPhone)) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        newErrors.password = `Password must contain: ${passwordValidation.missingRequirements.join(', ')}`;
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

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    const fullPhoneNumber = `${selectedCountry.code}${phone.replace(/\s/g, '')}`;
    
    const requestData = {
      email: email.toLowerCase().trim(),
      phone: fullPhoneNumber,
      fullName: fullName.trim(),
      password: password
    };

    console.log('=== REGISTRATION REQUEST ===');
    console.log('Sending data:', requestData);
    
    setLoading(true);
    try {
      const response = await authApi.register(requestData);

      console.log('Registration response:', response);

      if (response.success) {
        // Navigate directly to unified onboarding instead of question method selection
        navigation.navigate('UnifiedOnboarding', {
          userId: response.data?.userId,
          user: response.data?.user,
          email: email.toLowerCase().trim(),
          fullName: fullName.trim()
        });
      } else {
        if (response.error?.includes('email')) {
          setErrors({ email: 'This email is already registered' });
        } else if (response.error?.includes('phone')) {
          setErrors({ phone: 'This phone number is already registered' });
        } else {
          Alert.alert('Registration Failed', response.error || 'Something went wrong. Please try again.');
        }
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      
      if (error.response?.data?.errors) {
        const newErrors: {[key: string]: string} = {};
        error.response.data.errors.forEach((err: any) => {
          if (err.field && err.message) {
            newErrors[err.field] = err.message;
          }
        });
        setErrors(newErrors);
      } else if (error.message?.includes('network')) {
        Alert.alert('Network Error', 'Please check your internet connection and try again.');
      } else {
        Alert.alert('Error', 'Something went wrong. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    Alert.alert(
      'Social Authentication',
      'Social login features require additional app configuration. Please use email registration or contact support for assistance.',
      [{ text: 'OK' }]
    );
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const goToLogin = () => {
    navigation.navigate('Login');
  };

  const getPasswordStrength = () => {
    if (!password) return null;
    
    const validation = validatePassword(password);
    const score = Object.values(validation.requirements).filter(Boolean).length;
    
    if (score < 2) return { color: '#ff4444', text: 'Weak', width: '25%' };
    if (score < 4) return { color: '#ffaa00', text: 'Fair', width: '50%' };
    if (score < 5) return { color: '#ffdd00', text: 'Good', width: '75%' };
    return { color: '#39b70d', text: 'Strong', width: '100%' };
  };

  const passwordStrength = getPasswordStrength();

  const renderCountryItem = ({ item }: { item: typeof COUNTRIES[0] }) => (
    <TouchableOpacity
      style={styles.countryItem}
      onPress={() => {
        setSelectedCountry(item);
        setShowCountryModal(false);
      }}
    >
      <Text style={styles.countryFlag}>{item.flag}</Text>
      <View style={styles.countryInfo}>
        <Text style={styles.countryName}>{item.name}</Text>
        <Text style={styles.countryCode}>{item.code}</Text>
      </View>
      {selectedCountry.iso === item.iso && (
        <Ionicons name="checkmark" size={24} color="#39b70d" />
      )}
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.blackBackground} />

      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Ionicons name="chevron-back" size={28} color="#ffffff" />
      </TouchableOpacity>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Join YoFam</Text>
          <Text style={styles.subtitle}>Create your account to connect with family</Text>
        </View>

        {/* Social Login */}
        <View style={styles.socialContainer}>
          <TouchableOpacity 
            style={styles.socialButton}
            onPress={() => handleSocialLogin('Google')}
            disabled={loading}
          >
            <View style={styles.googleIcon}>
              <Text style={styles.googleText}>G</Text>
            </View>
          </TouchableOpacity>

          {Platform.OS === 'ios' && (
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => handleSocialLogin('Apple')}
              disabled={loading}
            >
              <View style={styles.appleIcon}>
                <Ionicons name="logo-apple" size={24} color="#ffffff" />
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.socialButton}
            onPress={() => handleSocialLogin('Facebook')}
            disabled={loading}
          >
            <View style={styles.facebookIcon}>
              <Ionicons name="logo-facebook" size={24} color="#ffffff" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or sign up with email</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={[styles.inputContainer, errors.fullName && styles.inputError]}>
              <View style={styles.iconContainer}>
                <Ionicons name="person-outline" size={20} color="#000000" />
              </View>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  if (errors.fullName) {
                    setErrors(prev => ({...prev, fullName: ''}));
                  }
                }}
                placeholder="Enter your full name"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                autoCapitalize="words"
                editable={!loading}
              />
            </View>
            {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={[styles.inputContainer, errors.email && styles.inputError]}>
              <View style={styles.iconContainer}>
                <Ionicons name="mail-outline" size={20} color="#000000" />
              </View>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) {
                    setErrors(prev => ({...prev, email: ''}));
                  }
                }}
                placeholder="Enter your email address"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Phone Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={[styles.inputContainer, errors.phone && styles.inputError]}>
              {/* Country Selector */}
              <TouchableOpacity 
                style={styles.countrySelector}
                onPress={() => setShowCountryModal(true)}
                disabled={loading}
              >
                <Text style={styles.flagText}>{selectedCountry.flag}</Text>
                <Text style={styles.codeText}>{selectedCountry.code}</Text>
                <Ionicons name="chevron-down" size={16} color="rgba(255, 255, 255, 0.6)" />
              </TouchableOpacity>
              
              <View style={styles.phoneSeparator} />
              
              <TextInput
                style={styles.phoneInput}
                value={phone}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^\d\s]/g, '');
                  setPhone(cleaned);
                  if (errors.phone) {
                    setErrors(prev => ({...prev, phone: ''}));
                  }
                }}
                placeholder="567 726 520"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                keyboardType="phone-pad"
                autoCorrect={false}
                editable={!loading}
              />
            </View>
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            <Text style={styles.helperText}>
              Enter your phone number without the country code
            </Text>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={[styles.inputContainer, errors.password && styles.inputError]}>
              <View style={styles.iconContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#000000" />
              </View>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) {
                    setErrors(prev => ({...prev, password: ''}));
                  }
                }}
                placeholder="Create a strong password"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color="rgba(255, 255, 255, 0.6)" 
                />
              </TouchableOpacity>
            </View>
            
            {/* Password Strength Indicator */}
            {password && passwordStrength && (
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
            
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            <Text style={styles.helperText}>
              Must contain: 8+ characters, uppercase, lowercase, number, special character
            </Text>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
              <View style={styles.iconContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#000000" />
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
                placeholder="Confirm your password"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
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
                  color="rgba(255, 255, 255, 0.6)" 
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
          </View>

          {/* Create Account Button */}
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={loading 
                ? ['#333333', '#222222'] 
                : ['#015b01', '#39b70d']
              }
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Sign In Link */}
          <TouchableOpacity 
            style={styles.loginContainer} 
            onPress={goToLogin}
            disabled={loading}
          >
            <Text style={styles.loginText}>
              Already have an account? 
              <Text style={styles.loginLink}> Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Country Selection Modal */}
      <Modal
        visible={showCountryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCountryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowCountryModal(false)}
              >
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={COUNTRIES}
              renderItem={renderCountryItem}
              keyExtractor={(item) => item.iso}
              showsVerticalScrollIndicator={false}
              style={styles.countryList}
            />
          </View>
        </View>
      </Modal>
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    paddingTop: 100,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 36,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },

  // Social Login
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4285f4',
  },
  appleIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  facebookIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1877f2',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: getSystemFont('regular'),
    marginHorizontal: 16,
  },

  // Form
  formContainer: {
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingRight: 16,
    paddingVertical: 4,
    minHeight: 56,
  },
  inputError: {
    borderColor: '#ff4444',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#39b70d',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginLeft: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    fontFamily: getSystemFont('regular'),
    paddingVertical: 12,
  },

  // Phone Input Specific Styles
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'rgba(57, 183, 13, 0.1)',
    borderRadius: 8,
    marginLeft: 8,
    marginRight: 8,
  },
  flagText: {
    fontSize: 20,
    marginRight: 6,
  },
  codeText: {
    fontSize: 16,
    color: '#ffffff',
    fontFamily: getSystemFont('bold'),
    marginRight: 6,
  },
  phoneSeparator: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginRight: 12,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    fontFamily: getSystemFont('regular'),
    paddingVertical: 12,
  },

  eyeButton: {
    padding: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#ff4444',
    fontFamily: getSystemFont('regular'),
    marginTop: 6,
    marginLeft: 4,
  },
  helperText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: getSystemFont('regular'),
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginRight: 12,
  },
  passwordStrengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  passwordStrengthText: {
    fontSize: 12,
    fontFamily: getSystemFont('semiBold'),
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 16,
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#015b01',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
  },
  loginContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 20,
  },
  loginText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: getSystemFont('regular'),
  },
  loginLink: {
    color: '#39b70d',
    fontFamily: getSystemFont('bold'),
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  countryFlag: {
    fontSize: 24,
    marginRight: 16,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: 16,
    fontFamily: getSystemFont('medium'),
    color: '#ffffff',
    marginBottom: 2,
  },
  countryCode: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255, 255, 255, 0.6)',
  },
});

export default RegisterScreen;