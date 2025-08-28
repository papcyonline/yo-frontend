import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  Modal,
  FlatList,
  SafeAreaView,
  Image,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { getSystemFont } from '../../config/constants';

const { width, height } = Dimensions.get('window');

import { API_CONFIG } from '../../constants/api';

const COUNTRIES = [
  { code: '+971', name: 'United Arab Emirates', flag: '🇦🇪', iso: 'AE' },
  { code: '+1', name: 'United States', flag: '🇺🇸', iso: 'US' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧', iso: 'GB' },
  { code: '+237', name: 'Cameroon', flag: '🇨🇲', iso: 'CM' },
  { code: '+91', name: 'India', flag: '🇮🇳', iso: 'IN' },
  { code: '+33', name: 'France', flag: '🇫🇷', iso: 'FR' },
  { code: '+49', name: 'Germany', flag: '🇩🇪', iso: 'DE' },
  { code: '+86', name: 'China', flag: '🇨🇳', iso: 'CN' },
  { code: '+81', name: 'Japan', flag: '🇯🇵', iso: 'JP' },
  { code: '+61', name: 'Australia', flag: '🇦🇺', iso: 'AU' },
  { code: '+55', name: 'Brazil', flag: '🇧🇷', iso: 'BR' },
  { code: '+7', name: 'Russia', flag: '🇷🇺', iso: 'RU' },
  { code: '+82', name: 'South Korea', flag: '🇰🇷', iso: 'KR' },
  { code: '+39', name: 'Italy', flag: '🇮🇹', iso: 'IT' },
  { code: '+34', name: 'Spain', flag: '🇪🇸', iso: 'ES' },
  { code: '+31', name: 'Netherlands', flag: '🇳🇱', iso: 'NL' },
  { code: '+46', name: 'Sweden', flag: '🇸🇪', iso: 'SE' },
  { code: '+47', name: 'Norway', flag: '🇳🇴', iso: 'NO' },
  { code: '+45', name: 'Denmark', flag: '🇩🇰', iso: 'DK' },
  { code: '+41', name: 'Switzerland', flag: '🇨🇭', iso: 'CH' },
  { code: '+43', name: 'Austria', flag: '🇦🇹', iso: 'AT' },
];

const PhoneInputScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { theme, isDark } = useTheme();
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]); // Default UAE
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Get user info from previous screen
  const userInfo = route.params?.userInfo;

  const validatePhone = () => {
    if (!phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    
    const cleanPhone = phone.replace(/\s/g, '');
    if (!/^\d{7,15}$/.test(cleanPhone)) {
      setError('Please enter a valid phone number');
      return false;
    }
    
    setError('');
    return true;
  };

  const registerPhoneRequest = async (fullPhone: string) => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/register/phone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: fullPhone,
          firstName: userInfo?.firstName || 'Unknown',
          lastName: userInfo?.lastName || 'User',
          username: userInfo?.username || '',
          fullName: userInfo?.fullName || '',
          location: userInfo?.location || '',
          gender: userInfo?.gender || '',
          dateOfBirth: userInfo?.dateOfBirth ? userInfo.dateOfBirth.toISOString().split('T')[0] : ''
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return {
          success: true,
          phone: data.data?.phone,
          testCode: data.data?.testCode, // Development OTP
          message: data.message
        };
      } else {
        throw new Error(data.message || 'Failed to register phone number');
      }
    } catch (error) {
      console.error('Phone Registration Error:', error);
      throw error;
    }
  };

  const handleContinue = async () => {
    if (!validatePhone()) return;
    
    const fullPhone = `${selectedCountry.code}${phone.replace(/\s/g, '')}`;
    
    setLoading(true);
    setError('');

    try {
      const result = await registerPhoneRequest(fullPhone);
      
      if (result.success) {
        // Navigate to OTP verification screen
        navigation.navigate('PhoneVerification', {
          phone: fullPhone,
          countryData: selectedCountry,
          testCode: result.testCode, // Development OTP - remove in production
          userInfo: userInfo // Pass user info forward
        });
      }
    } catch (error) {
      setError(error.message || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Create dynamic styles based on theme
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },

    // Image Section
    imageSection: {
      height: height * 0.4,
      position: 'relative',
    },
    signImage: {
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
      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.3)',
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
    progressOverlay: {
      position: 'absolute',
      bottom: 30,
      left: 24,
      right: 24,
    },
    progressText: {
      fontSize: 14,
      fontFamily: getSystemFont('medium'),
      color: isDark ? '#fcd3aa' : '#FFFFFF',
      textAlign: 'center',
      marginBottom: 8,
      textShadowColor: 'rgba(0, 0, 0, 0.5)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    progressBar: {
      height: 4,
      backgroundColor: isDark ? 'rgba(252, 211, 170, 0.3)' : 'rgba(255, 255, 255, 0.3)',
      borderRadius: 2,
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.primary,
      borderRadius: 2,
    },

    // Content Section
    contentSection: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 32,
      justifyContent: 'space-between',
    },
    contentHeader: {
      alignItems: 'center',
      marginBottom: 32,
    },
    title: {
      fontSize: 28,
      fontFamily: getSystemFont('bold'),
      color: theme.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      fontFamily: getSystemFont('regular'),
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },

    // Input Section
    inputSection: {
      flex: 1,
      position: 'relative',
    },
    inputLabel: {
      fontSize: 16,
      fontFamily: getSystemFont('semiBold'),
      color: theme.text,
      marginBottom: 12,
    },
    backgroundIconContainer: {
      position: 'absolute',
      top: 80,
      left: '50%',
      transform: [{ translateX: -60 }],
      zIndex: -1,
    },
    phoneInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.inputBackground,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      minHeight: 60,
    },
    inputError: {
      borderColor: theme.error,
      backgroundColor: isDark ? 'rgba(255, 68, 68, 0.1)' : 'rgba(255, 68, 68, 0.05)',
    },
    countrySelector: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: isDark ? 'rgba(0, 145, 173, 0.1)' : 'rgba(0, 145, 173, 0.05)',
      borderRadius: 12,
      marginLeft: 6,
    },
    flagEmoji: {
      fontSize: 22,
      marginRight: 8,
    },
    countryCodeText: {
      fontSize: 16,
      fontFamily: getSystemFont('bold'),
      color: theme.text,
      marginRight: 6,
    },
    inputSeparator: {
      width: 1,
      height: 24,
      backgroundColor: theme.divider,
      marginHorizontal: 16,
    },
    phoneNumberInput: {
      flex: 1,
      fontSize: 18,
      color: theme.text,
      fontFamily: getSystemFont('regular'),
      paddingVertical: 16,
    },
    errorMessage: {
      fontSize: 14,
      color: theme.error,
      fontFamily: getSystemFont('regular'),
      marginTop: 8,
    },
    helperMessage: {
      fontSize: 14,
      color: theme.textSecondary,
      fontFamily: getSystemFont('regular'),
      marginTop: 8,
    },

    // Continue Button
    continueButton: {
      backgroundColor: theme.primary,
      borderRadius: 16,
      paddingVertical: 18,
      paddingHorizontal: 24,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 32,
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
    continueButtonText: {
      fontSize: 20,
      fontFamily: getSystemFont('bold'),
      color: theme.buttonText,
    },
    buttonArrow: {
      marginLeft: 8,
    },

    // Modal Styles
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: isDark ? '#1a1a1a' : theme.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: height * 0.7,
      borderWidth: 1,
      borderColor: theme.border,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 24,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    modalTitle: {
      fontSize: 20,
      fontFamily: getSystemFont('bold'),
      color: theme.text,
    },
    modalCloseButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? 'rgba(0, 145, 173, 0.1)' : 'rgba(0, 145, 173, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    countriesList: {
      paddingHorizontal: 24,
    },
    countryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
    },
    countryFlag: {
      fontSize: 28,
      marginRight: 16,
    },
    countryInfo: {
      flex: 1,
    },
    countryName: {
      fontSize: 16,
      fontFamily: getSystemFont('medium'),
      color: theme.text,
      marginBottom: 2,
    },
    countryCode: {
      fontSize: 14,
      fontFamily: getSystemFont('regular'),
      color: theme.textSecondary,
    },
  });

  const renderCountryItem = ({ item }: { item: typeof COUNTRIES[0] }) => (
    <TouchableOpacity
      style={dynamicStyles.countryItem}
      onPress={() => {
        setSelectedCountry(item);
        setShowCountryModal(false);
      }}
    >
      <Text style={dynamicStyles.countryFlag}>{item.flag}</Text>
      <View style={dynamicStyles.countryInfo}>
        <Text style={dynamicStyles.countryName}>{item.name}</Text>
        <Text style={dynamicStyles.countryCode}>{item.code}</Text>
      </View>
      {selectedCountry.iso === item.iso && (
        <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={dynamicStyles.container}>
        {/* Image Section */}
        <View style={dynamicStyles.imageSection}>
          <Image 
            source={require('../../../assets/signup.jpg')} 
            style={dynamicStyles.signImage}
            resizeMode="cover"
          />
          
          {/* Dark Overlay */}
          <View style={dynamicStyles.imageOverlay} />
          
          {/* Back Button Overlay */}
          <TouchableOpacity style={dynamicStyles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={isDark ? "#fcd3aa" : "#FFFFFF"} />
          </TouchableOpacity>

          {/* Progress Indicator Overlay */}
          <View style={dynamicStyles.progressOverlay}>
            <Text style={dynamicStyles.progressText}>Step 2 of 4</Text>
            <View style={dynamicStyles.progressBar}>
              <View style={[dynamicStyles.progressFill, { width: '50%' }]} />
            </View>
          </View>
        </View>

        {/* Content Section */}
        <View style={dynamicStyles.contentSection}>
          <View style={dynamicStyles.contentHeader}>
            <Text style={dynamicStyles.title}>Phone Number</Text>
            <Text style={dynamicStyles.subtitle}>
              We'll send a verification code to confirm your number
            </Text>
          </View>

          <View style={dynamicStyles.inputSection}>
            <Text style={dynamicStyles.inputLabel}>Enter your phone number</Text>
            
            <View style={[dynamicStyles.phoneInputContainer, error && dynamicStyles.inputError]}>
              {/* Country Selector */}
              <TouchableOpacity 
                style={dynamicStyles.countrySelector}
                onPress={() => setShowCountryModal(true)}
                disabled={loading}
              >
                <Text style={dynamicStyles.flagEmoji}>{selectedCountry.flag}</Text>
                <Text style={dynamicStyles.countryCodeText}>{selectedCountry.code}</Text>
                <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
              </TouchableOpacity>
              
              <View style={dynamicStyles.inputSeparator} />
              
              <TextInput
                style={dynamicStyles.phoneNumberInput}
                value={phone}
                onChangeText={(text) => {
                  // Only allow digits and spaces, format nicely
                  const cleaned = text.replace(/[^\d\s]/g, '');
                  setPhone(cleaned);
                  if (error) setError('');
                }}
                placeholder="567 726 520"
                placeholderTextColor={theme.placeholder}
                keyboardType="phone-pad"
                autoCorrect={false}
                editable={!loading}
                maxLength={15}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                blurOnSubmit={true}
              />
            </View>
            
            {/* Background Genealogy Icon */}
            <View style={dynamicStyles.backgroundIconContainer}>
              <Ionicons name="git-network-outline" size={120} color={isDark ? "rgba(252, 211, 170, 0.05)" : "rgba(0, 0, 0, 0.05)"} />
            </View>
            
            {error ? <Text style={dynamicStyles.errorMessage}>{error}</Text> : null}
            
            <Text style={dynamicStyles.helperMessage}>
              Enter your phone number without the country code
            </Text>
          </View>

          <TouchableOpacity 
            style={[dynamicStyles.continueButton, loading && dynamicStyles.buttonDisabled]} 
            onPress={handleContinue}
            disabled={loading}
          >
            <Text style={dynamicStyles.continueButtonText}>
              {loading ? 'Sending Code...' : 'Send Verification Code'}
            </Text>
            {!loading && (
              <Ionicons name="arrow-forward" size={20} color={theme.buttonText} style={dynamicStyles.buttonArrow} />
            )}
          </TouchableOpacity>
        </View>

        {/* Country Selection Modal */}
        <Modal
          visible={showCountryModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCountryModal(false)}
        >
          <View style={dynamicStyles.modalBackdrop}>
            <SafeAreaView style={dynamicStyles.modalContent}>
              <View style={dynamicStyles.modalHeader}>
                <Text style={dynamicStyles.modalTitle}>Select Country</Text>
                <TouchableOpacity
                  style={dynamicStyles.modalCloseButton}
                  onPress={() => setShowCountryModal(false)}
                >
                  <Ionicons name="close" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={COUNTRIES}
                renderItem={renderCountryItem}
                keyExtractor={(item) => item.iso}
                showsVerticalScrollIndicator={false}
                style={dynamicStyles.countriesList}
              />
            </SafeAreaView>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
};


export default PhoneInputScreen;