import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  SafeAreaView,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Modal,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { getSystemFont } from '../../config/constants';

const { width, height } = Dimensions.get('window');

// Location suggestions
const LOCATIONS = [
  'Dubai, UAE',
  'Abu Dhabi, UAE',
  'Sharjah, UAE',
  'New York, USA',
  'London, UK',
  'Paris, France',
  'Tokyo, Japan',
  'Sydney, Australia',
  'Toronto, Canada',
  'Berlin, Germany',
  'Mumbai, India',
  'Singapore',
  'Other'
];

interface UserInfo {
  fullName: string;
  username: string;
  dateOfBirth: Date | null;
  location: string;
  gender: string;
}

const UserInfoScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const [userInfo, setUserInfo] = useState<UserInfo>({
    fullName: '',
    username: '',
    dateOfBirth: null,
    location: '',
    gender: ''
  });
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Gender options
  const GENDERS = [
    { id: 'male', label: 'Male' },
    { id: 'female', label: 'Female' },
    { id: 'prefer-not-to-say', label: 'Prefer not to say' },
  ];

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!userInfo.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (userInfo.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    } else if (!userInfo.fullName.trim().includes(' ')) {
      newErrors.fullName = 'Please enter your full name (first and last name)';
    }
    
    if (!userInfo.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (userInfo.username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(userInfo.username.trim())) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }
    
    if (!userInfo.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const age = new Date().getFullYear() - userInfo.dateOfBirth.getFullYear();
      if (age < 13) {
        newErrors.dateOfBirth = 'You must be at least 13 years old';
      } else if (age > 120) {
        newErrors.dateOfBirth = 'Please enter a valid date of birth';
      }
    }
    
    if (!userInfo.location.trim()) {
      newErrors.location = 'Location is required';
    }
    
    if (!userInfo.gender.trim()) {
      newErrors.gender = 'Gender is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Split full name into first and last name for backend compatibility
      const nameParts = userInfo.fullName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || nameParts[0]; // Use first name as last if only one name provided
      
      // Navigate to phone input with user data
      navigation.navigate('PhoneInput', {
        userInfo: {
          ...userInfo,
          fullName: userInfo.fullName.trim(),
          firstName: firstName,
          lastName: lastName,
          username: userInfo.username.trim().toLowerCase(),
          location: userInfo.location.trim(),
          gender: userInfo.gender
        }
      });
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setUserInfo(prev => ({ ...prev, dateOfBirth: selectedDate }));
      if (errors.dateOfBirth) {
        setErrors(prev => ({ ...prev, dateOfBirth: '' }));
      }
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Create dynamic styles based on theme
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },

    // Image Section
    imageSection: {
      height: height * 0.25,
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
      paddingTop: 16,
    },
    contentHeader: {
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 26,
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

    // Form Section
    scrollView: {
      flex: 1,
      marginBottom: 10,
    },
    inputGroup: {
      marginBottom: 18,
    },
    inputLabel: {
      fontSize: 16,
      fontFamily: getSystemFont('semiBold'),
      color: theme.text,
      marginBottom: 8,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.inputBackground,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      minHeight: 56,
      paddingHorizontal: 16,
    },
    inputError: {
      borderColor: theme.error,
      backgroundColor: isDark ? 'rgba(255, 68, 68, 0.1)' : 'rgba(255, 68, 68, 0.05)',
    },
    inputIcon: {
      marginRight: 12,
    },
    textInput: {
      flex: 1,
      fontSize: 16,
      color: theme.text,
      fontFamily: getSystemFont('regular'),
      paddingVertical: 16,
    },

    // Date Selection Styles
    dateTextContainer: {
      flex: 1,
      justifyContent: 'center',
      paddingVertical: 16,
    },
    dateText: {
      fontSize: 16,
      color: theme.text,
      fontFamily: getSystemFont('regular'),
      textAlign: 'left',
    },
    dateTextPlaceholder: {
      color: theme.placeholder,
    },

    // Location Selection Styles
    locationTextContainer: {
      flex: 1,
      justifyContent: 'center',
      paddingVertical: 16,
    },
    locationText: {
      fontSize: 16,
      color: theme.text,
      fontFamily: getSystemFont('regular'),
      textAlign: 'left',
    },
    locationTextPlaceholder: {
      color: theme.placeholder,
    },

    // Date Picker Modal Styles
    datePickerModalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    datePickerModalContent: {
      backgroundColor: isDark ? '#1a1a1a' : theme.surface,
      borderRadius: 20,
      width: width * 0.9,
      paddingVertical: 20,
      borderWidth: 1,
      borderColor: theme.border,
    },
    datePickerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    datePickerTitle: {
      fontSize: 18,
      fontFamily: getSystemFont('bold'),
      color: theme.text,
    },
    datePickerCancelButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    datePickerCancelText: {
      fontSize: 16,
      fontFamily: getSystemFont('regular'),
      color: theme.textSecondary,
    },
    datePickerDoneButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: theme.primary,
      borderRadius: 8,
    },
    datePickerDoneText: {
      fontSize: 16,
      fontFamily: getSystemFont('semiBold'),
      color: theme.buttonText,
    },
    datePickerStyle: {
      backgroundColor: 'transparent',
      width: '100%',
    },
    errorMessage: {
      fontSize: 14,
      color: theme.error,
      fontFamily: getSystemFont('regular'),
      marginTop: 6,
      marginLeft: 4,
    },
    helperText: {
      fontSize: 12,
      color: theme.textSecondary,
      fontFamily: getSystemFont('regular'),
      marginTop: 6,
      marginLeft: 4,
    },

    // Continue Button
    continueButton: {
      backgroundColor: theme.primary,
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 24,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 12,
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
    continueButtonText: {
      fontSize: 18,
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
    locationsList: {
      paddingHorizontal: 24,
    },
    locationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
    },
    locationItemText: {
      fontSize: 16,
      fontFamily: getSystemFont('regular'),
      color: theme.text,
    },
    genderItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
    },
    genderItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    genderItemText: {
      fontSize: 16,
      fontFamily: getSystemFont('regular'),
      color: theme.text,
    },
  });

  const renderLocationItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={dynamicStyles.locationItem}
      onPress={() => {
        setUserInfo(prev => ({ ...prev, location: item }));
        setShowLocationModal(false);
        if (errors.location) {
          setErrors(prev => ({ ...prev, location: '' }));
        }
      }}
    >
      <Text style={dynamicStyles.locationItemText}>{item}</Text>
      {userInfo.location === item && (
        <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
      )}
    </TouchableOpacity>
  );

  const renderGenderItem = ({ item }: { item: typeof GENDERS[0] }) => (
    <TouchableOpacity
      style={dynamicStyles.genderItem}
      onPress={() => {
        setUserInfo(prev => ({ ...prev, gender: item.id }));
        setShowGenderModal(false);
        if (errors.gender) {
          setErrors(prev => ({ ...prev, gender: '' }));
        }
      }}
    >
      <View style={dynamicStyles.genderItemContent}>
        <Text style={dynamicStyles.genderItemText}>{item.label}</Text>
      </View>
      {userInfo.gender === item.id && (
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
            <Text style={dynamicStyles.progressText}>Step 1 of 4</Text>
            <View style={dynamicStyles.progressBar}>
              <View style={[dynamicStyles.progressFill, { width: '25%' }]} />
            </View>
          </View>
        </View>

        {/* Content Section */}
        <View style={dynamicStyles.contentSection}>
          <View style={dynamicStyles.contentHeader}>
            <Text style={dynamicStyles.title}>Tell us about yourself</Text>
            <Text style={dynamicStyles.subtitle}>
              Let's start with some basic information about you
            </Text>
          </View>

          <ScrollView 
            style={dynamicStyles.scrollView}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Full Name */}
            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.inputLabel}>Full Name</Text>
              <View style={[dynamicStyles.inputContainer, errors.fullName && dynamicStyles.inputError]}>
                <Ionicons name="person-outline" size={20} color={theme.primary} style={dynamicStyles.inputIcon} />
                <TextInput
                  style={dynamicStyles.textInput}
                  value={userInfo.fullName}
                  onChangeText={(text) => {
                    setUserInfo(prev => ({ ...prev, fullName: text }));
                    if (errors.fullName) {
                      setErrors(prev => ({ ...prev, fullName: '' }));
                    }
                  }}
                  placeholder="Enter your full name"
                  placeholderTextColor={theme.placeholder}
                  autoCapitalize="words"
                  editable={!loading}
                />
              </View>
              {errors.fullName && <Text style={dynamicStyles.errorMessage}>{errors.fullName}</Text>}
            </View>

            {/* Username */}
            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.inputLabel}>Username</Text>
              <View style={[dynamicStyles.inputContainer, errors.username && dynamicStyles.inputError]}>
                <Ionicons name="at-outline" size={20} color={theme.primary} style={dynamicStyles.inputIcon} />
                <TextInput
                  style={dynamicStyles.textInput}
                  value={userInfo.username}
                  onChangeText={(text) => {
                    const cleanText = text.toLowerCase().replace(/[^a-z0-9_]/g, '');
                    setUserInfo(prev => ({ ...prev, username: cleanText }));
                    if (errors.username) {
                      setErrors(prev => ({ ...prev, username: '' }));
                    }
                  }}
                  placeholder="Choose a username"
                  placeholderTextColor={theme.placeholder}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
              {errors.username && <Text style={dynamicStyles.errorMessage}>{errors.username}</Text>}
              <Text style={dynamicStyles.helperText}>
                Username can only contain letters, numbers, and underscores
              </Text>
            </View>

            {/* Date of Birth */}
            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.inputLabel}>Date of Birth</Text>
              <TouchableOpacity 
                style={[dynamicStyles.inputContainer, errors.dateOfBirth && dynamicStyles.inputError]}
                onPress={() => setShowDatePicker(true)}
                disabled={loading}
              >
                <Ionicons name="calendar-outline" size={20} color={theme.primary} style={dynamicStyles.inputIcon} />
                <View style={dynamicStyles.dateTextContainer}>
                  <Text style={[dynamicStyles.dateText, !userInfo.dateOfBirth && dynamicStyles.dateTextPlaceholder]}>
                    {userInfo.dateOfBirth ? formatDate(userInfo.dateOfBirth) : 'Select your date of birth'}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
              </TouchableOpacity>
              {errors.dateOfBirth && <Text style={dynamicStyles.errorMessage}>{errors.dateOfBirth}</Text>}
            </View>

            {/* Location */}
            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.inputLabel}>Location</Text>
              <TouchableOpacity 
                style={[dynamicStyles.inputContainer, errors.location && dynamicStyles.inputError]}
                onPress={() => setShowLocationModal(true)}
                disabled={loading}
              >
                <Ionicons name="location-outline" size={20} color={theme.primary} style={dynamicStyles.inputIcon} />
                <View style={dynamicStyles.locationTextContainer}>
                  <Text style={[dynamicStyles.locationText, !userInfo.location && dynamicStyles.locationTextPlaceholder]}>
                    {userInfo.location || 'Select your location'}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
              </TouchableOpacity>
              {errors.location && <Text style={dynamicStyles.errorMessage}>{errors.location}</Text>}
            </View>

            {/* Gender */}
            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.inputLabel}>Gender</Text>
              <TouchableOpacity 
                style={[dynamicStyles.inputContainer, errors.gender && dynamicStyles.inputError]}
                onPress={() => setShowGenderModal(true)}
                disabled={loading}
              >
                <Ionicons name="person-outline" size={20} color={theme.primary} style={dynamicStyles.inputIcon} />
                <View style={dynamicStyles.locationTextContainer}>
                  <Text style={[dynamicStyles.locationText, !userInfo.gender && dynamicStyles.locationTextPlaceholder]}>
                    {userInfo.gender ? GENDERS.find(g => g.id === userInfo.gender)?.label : 'Select your gender'}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
              </TouchableOpacity>
              {errors.gender && <Text style={dynamicStyles.errorMessage}>{errors.gender}</Text>}
            </View>
          </ScrollView>

          <TouchableOpacity 
            style={[dynamicStyles.continueButton, loading && dynamicStyles.buttonDisabled]} 
            onPress={handleContinue}
            disabled={loading}
          >
            <Text style={dynamicStyles.continueButtonText}>
              {loading ? 'Processing...' : 'Continue'}
            </Text>
            {!loading && (
              <Ionicons name="arrow-forward" size={20} color={theme.buttonText} style={dynamicStyles.buttonArrow} />
            )}
          </TouchableOpacity>
        </View>

        {/* Date Picker Modal */}
        {showDatePicker && (
          <Modal
            visible={showDatePicker}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowDatePicker(false)}
          >
            <View style={dynamicStyles.datePickerModalBackdrop}>
              <View style={dynamicStyles.datePickerModalContent}>
                <View style={dynamicStyles.datePickerHeader}>
                  <TouchableOpacity
                    style={dynamicStyles.datePickerCancelButton}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={dynamicStyles.datePickerCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={dynamicStyles.datePickerTitle}>Select Date of Birth</Text>
                  <TouchableOpacity
                    style={dynamicStyles.datePickerDoneButton}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={dynamicStyles.datePickerDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={userInfo.dateOfBirth || new Date(2000, 0, 1)}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  minimumDate={new Date(1920, 0, 1)}
                  textColor={theme.text}
                  themeVariant={isDark ? "dark" : "light"}
                  style={dynamicStyles.datePickerStyle}
                />
              </View>
            </View>
          </Modal>
        )}

        {/* Location Selection Modal */}
        <Modal
          visible={showLocationModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowLocationModal(false)}
        >
          <View style={dynamicStyles.modalBackdrop}>
            <SafeAreaView style={dynamicStyles.modalContent}>
              <View style={dynamicStyles.modalHeader}>
                <Text style={dynamicStyles.modalTitle}>Select Location</Text>
                <TouchableOpacity
                  style={dynamicStyles.modalCloseButton}
                  onPress={() => setShowLocationModal(false)}
                >
                  <Ionicons name="close" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={LOCATIONS}
                renderItem={renderLocationItem}
                keyExtractor={(item) => item}
                showsVerticalScrollIndicator={false}
                style={dynamicStyles.locationsList}
              />
            </SafeAreaView>
          </View>
        </Modal>

        {/* Gender Selection Modal */}
        <Modal
          visible={showGenderModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowGenderModal(false)}
        >
          <View style={dynamicStyles.modalBackdrop}>
            <SafeAreaView style={dynamicStyles.modalContent}>
              <View style={dynamicStyles.modalHeader}>
                <Text style={dynamicStyles.modalTitle}>Select Gender</Text>
                <TouchableOpacity
                  style={dynamicStyles.modalCloseButton}
                  onPress={() => setShowGenderModal(false)}
                >
                  <Ionicons name="close" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={GENDERS}
                renderItem={renderGenderItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                style={dynamicStyles.locationsList}
              />
            </SafeAreaView>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
};


export default UserInfoScreen;