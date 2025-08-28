import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { API_CONFIG } from '../../../constants/api';
import { useAuthStore } from '../../../store/authStore';
import ratingService from '../../../services/RatingService';
import { useTheme } from '../../../context/ThemeContext';
import { getSystemFont } from '../../../config/constants';
import PhotoPicker from '../../../components/media/PhotoPicker';

const { width, height } = Dimensions.get('window');

// Use the centralized API configuration
const API_BASE_URL = API_CONFIG.BASE_URL;

interface User {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  profileCompleted: boolean;
  dateOfBirth?: string;
  placeOfBirth?: string;
  currentAddress?: string;
  fatherName?: string;
  motherName?: string;
}

interface EditProfileProps {
  navigation: any;
  route: any;
}

const EditProfileScreen: React.FC<EditProfileProps> = ({ navigation, route }) => {
  const { user: userFromRoute } = route.params;
  const { user: userFromStore, setUser } = useAuthStore();
  const { theme, isDark } = useTheme();
  
  // Use the most up-to-date user data (from store if available, otherwise from route)
  const user = userFromStore || userFromRoute;
  
  // Extract data from merged backend format
  const getFieldValue = (field: string, fallback = '') => {
    // Check direct properties first
    if (user[field]) return user[field];
    
    // Check nested structures
    switch (field) {
      case 'fatherName':
      case 'father_name':
        return user.familyInfo?.father_name || user.fatherName || fallback;
      case 'motherName':
      case 'mother_name':
        return user.familyInfo?.mother_name || user.motherName || fallback;
      case 'currentAddress':
        return user.current_address || user.currentAddress || user.location || fallback;
      case 'bio':
        return user.bio || user.personalInfo?.personal_bio || fallback;
      case 'placeOfBirth':
        return user.place_of_birth || user.placeOfBirth || fallback;
      default:
        return user[field] || fallback;
    }
  };
  
  const [fullName, setFullName] = useState(getFieldValue('fullName') || getFieldValue('full_name') || `${user.first_name || ''} ${user.last_name || ''}`.trim());
  const [username, setUsername] = useState(user.username || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [dateOfBirth, setDateOfBirth] = useState(
    user.dateOfBirth || user.date_of_birth ? new Date(user.dateOfBirth || user.date_of_birth) : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [placeOfBirth, setPlaceOfBirth] = useState(getFieldValue('placeOfBirth'));
  const [currentAddress, setCurrentAddress] = useState(getFieldValue('currentAddress'));
  const [fatherName, setFatherName] = useState(getFieldValue('fatherName'));
  const [motherName, setMotherName] = useState(getFieldValue('motherName'));
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(
    user.profile_photo_url || user.profilePhotoUrl || user.avatar_url || null
  );

  // Debug: Log profile photo changes
  useEffect(() => {
    console.log('🖼️ Profile photo state changed:', profilePhoto);
    console.log('🧑 Current user photo fields:', {
      profile_photo_url: user.profile_photo_url,
      profilePhotoUrl: user.profilePhotoUrl,
      avatar_url: user.avatar_url
    });
  }, [profilePhoto, user.profile_photo_url, user.profilePhotoUrl, user.avatar_url]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Full name is required');
      return;
    }
    
    if (!username.trim()) {
      Alert.alert('Error', 'Username is required');
      return;
    }

    const { token } = useAuthStore.getState();
    if (!token) {
      Alert.alert('Error', 'Authentication token missing. Please login again.');
      return;
    }

    setLoading(true);
    
    try {
      console.log('=== PROFILE UPDATE DEBUG ===');
      console.log('API URL:', `${API_BASE_URL}/users/profile`);
      console.log('Token present:', !!token);
      console.log('User ID:', user.id);
      
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          username: username.trim(),
          dateOfBirth: dateOfBirth.toISOString().split('T')[0],
          currentAddress: currentAddress.trim(),
          placeOfBirth: placeOfBirth.trim(),
          fatherName: fatherName.trim(),
          motherName: motherName.trim(),
          // MongoDB can handle all these fields without constraint issues
        }),
      });

      const result = await response.json();
      console.log('=== API RESPONSE ===');
      console.log('Status:', response.status);
      console.log('Response:', result);
      
      if (response.ok && result.success) {
        // Update auth store with new user data
        const updatedUser = {
          ...user,
          fullName: fullName.trim(),
          full_name: fullName.trim(),
          username: username.trim(),
          dateOfBirth: dateOfBirth.toISOString().split('T')[0],
          date_of_birth: dateOfBirth.toISOString().split('T')[0],
          location: currentAddress.trim(),
          currentAddress: currentAddress.trim(),
          placeOfBirth: placeOfBirth.trim(),
          fatherName: fatherName.trim(),
          motherName: motherName.trim(),
        };
        setUser(updatedUser);
        
        // Record significant event for rating system
        try {
          await ratingService.recordSignificantEvent('profile_updated');
        } catch (ratingError) {
          console.log('Rating service error (non-critical):', ratingError);
        }
        
        Alert.alert(
          'Success',
          'Your profile has been updated successfully.',
          [{
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            }
          }]
        );
      } else {
        console.log('❌ Profile update failed:', result);
        Alert.alert('Error', result.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('❌ Profile update error:', err);
      Alert.alert('Error', 'Unable to connect to server. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };

  const getFirstName = () => {
    if (fullName) {
      return fullName.split(' ')[0];
    }
    return 'U';
  };

  const formSections = [
    {
      title: 'Basic Information',
      fields: [
        {
          label: 'Full Name',
          value: fullName,
          onChangeText: setFullName,
          placeholder: 'Enter your full name',
          icon: 'person-outline',
          required: true,
        },
        {
          label: 'Username',
          value: username,
          onChangeText: setUsername,
          placeholder: 'Enter your username',
          icon: 'at-outline',
          required: true,
        },
        {
          label: 'Email',
          value: email,
          onChangeText: setEmail,
          placeholder: 'Enter your email',
          icon: 'mail-outline',
          editable: false,
          required: true,
        },
        {
          label: 'Phone',
          value: phone,
          onChangeText: setPhone,
          placeholder: 'Enter your phone number',
          icon: 'call-outline',
          editable: false,
          required: true,
        },
      ]
    },
    {
      title: 'Personal Details',
      fields: [
        {
          label: 'Date of Birth',
          value: formatDate(dateOfBirth),
          placeholder: 'Select your date of birth',
          icon: 'calendar-outline',
          isDatePicker: true,
        },
        {
          label: 'Place of Birth',
          value: placeOfBirth,
          onChangeText: setPlaceOfBirth,
          placeholder: 'City, Country',
          icon: 'location-outline',
        },
        {
          label: 'Current Address',
          value: currentAddress,
          onChangeText: setCurrentAddress,
          placeholder: 'Your current address',
          icon: 'home-outline',
          multiline: true,
        },
      ]
    },
    {
      title: 'Family Information',
      fields: [
        {
          label: 'Father\'s Name',
          value: fatherName,
          onChangeText: setFatherName,
          placeholder: 'Enter father\'s name (optional)',
          icon: 'man-outline',
        },
        {
          label: 'Mother\'s Name',
          value: motherName,
          onChangeText: setMotherName,
          placeholder: 'Enter mother\'s name (optional)',
          icon: 'woman-outline',
        },
      ]
    },
  ];

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.background} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={theme.accent} />
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Profile</Text>
          
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSave}
            disabled={loading}
          >
            <LinearGradient
              colors={['#0091ad', '#04a7c7']}
              style={styles.saveButtonGradient}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Profile Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarRing} />
{profilePhoto ? (
              <Image 
                source={{ 
                  uri: `${profilePhoto}${profilePhoto.includes('?') ? '&' : '?'}t=${Date.now()}` 
                }} 
                style={styles.avatar}
                onError={(error) => console.log('Image load error:', error)}
                onLoad={() => console.log('Image loaded successfully:', profilePhoto)}
              />
            ) : (
              <LinearGradient
                colors={['#0091ad', '#04a7c7', '#fcd3aa']}
                style={styles.avatar}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.avatarText}>{getFirstName()[0]?.toUpperCase()}</Text>
              </LinearGradient>
            )}
            <TouchableOpacity 
              style={styles.changeAvatarButton}
              onPress={() => setShowPhotoPicker(true)}
            >
              <View style={styles.changeAvatarButtonInner}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarLabel}>Profile Photo</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={[styles.content, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
        {formSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.accent }]}>{section.title}</Text>
            
            {section.fields.map((field, fieldIndex) => (
              <View key={fieldIndex} style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, { color: theme.text }]}>
                  {field.label}
                  {field.required && <Text style={styles.required}> *</Text>}
                </Text>
                
                {field.isDatePicker ? (
                  <TouchableOpacity
                    style={styles.inputContainer}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <View style={styles.iconWrapper}>
                      <Ionicons name={field.icon as any} size={20} color="#0091ad" />
                    </View>
                    <Text style={[styles.dateText, { color: theme.text }]}>{field.value}</Text>
                    <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
                  </TouchableOpacity>
                ) : (
                  <View style={[
                    styles.inputContainer,
                    !field.editable && styles.disabledInput
                  ]}>
                    <View style={styles.iconWrapper}>
                      <Ionicons name={field.icon as any} size={20} color="#0091ad" />
                    </View>
                    <TextInput
                      style={[styles.input, field.multiline && styles.multilineInput, { color: theme.text }]}
                      value={field.value}
                      onChangeText={field.onChangeText}
                      placeholder={field.placeholder}
                      placeholderTextColor={theme.textSecondary}
                      editable={field.editable !== false && !loading}
                      multiline={field.multiline}
                      numberOfLines={field.multiline ? 3 : 1}
                      textAlignVertical={field.multiline ? 'top' : 'center'}
                    />
                  </View>
                )}
              </View>
            ))}
          </View>
        ))}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={dateOfBirth}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          maximumDate={new Date()}
          minimumDate={new Date(1900, 0, 1)}
        />
      )}

      {/* Photo Picker */}
      <PhotoPicker
        visible={showPhotoPicker}
        onClose={() => setShowPhotoPicker(false)}
        onImageSelected={(imageUri) => {
          setProfilePhoto(imageUri);
          setShowPhotoPicker(false);
        }}
        onImageUploaded={(result) => {
          // Handle both MediaService response and direct API response
          const imageUrl = result.file_url || result.photoUrl || result.data?.photoUrl;
          if (imageUrl) {
            setProfilePhoto(imageUrl);
          }
          
          console.log('🔄 PROFILE UPDATE - Result received:', result.data?.user?.id || result.data?.user?._id);
          console.log('🔄 PROFILE UPDATE - Photo URL:', imageUrl);
          
          // Update user data if provided
          if (result.data?.user) {
            console.log('✅ PROFILE UPDATE - Updating auth store with new user data');
            setUser(result.data.user);
            useAuthStore.getState().setUser(result.data.user);
            
            // Also update local profile photo from the updated user
            const newPhotoUrl = result.data.user.profile_photo_url || result.data.user.profilePhotoUrl || result.data.user.avatar_url;
            if (newPhotoUrl) {
              console.log('🖼️ PROFILE UPDATE - Setting local photo URL:', newPhotoUrl);
              setProfilePhoto(newPhotoUrl);
            }
          }
          
          Alert.alert('Success', 'Profile photo updated successfully!');
          
          // Force refresh by re-reading user data
          setTimeout(() => {
            const updatedUser = useAuthStore.getState().user;
            console.log('🔄 DELAYED CHECK - Current user in auth store:', updatedUser?.id || updatedUser?._id);
            console.log('🔄 DELAYED CHECK - Photo URL in auth store:', updatedUser?.profile_photo_url);
            if (updatedUser?.profile_photo_url) {
              setProfilePhoto(updatedUser.profile_photo_url);
            }
          }, 1000);
        }}
        context="profile"
        title="Update Profile Photo"
        autoUpload={true}
        aspectRatio={[1, 1]}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: StatusBar.currentHeight || 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(252,211,170,0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(252,211,170,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(252,211,170,0.15)',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: getSystemFont('bold'),
  },
  saveButton: {
    borderRadius: 22,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#0091ad',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  saveButtonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
    color: '#fff',
  },
  avatarSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  avatarRing: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: 'rgba(252,211,170,0.3)',
    top: -4,
    left: -4,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#0091ad',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  avatarText: {
    fontSize: 32,
    fontFamily: getSystemFont('bold'),
    color: '#fff',
  },
  changeAvatarButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  changeAvatarButtonInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,145,173,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000000',
    elevation: 2,
    shadowColor: '#0091ad',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  avatarLabel: {
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
    color: 'rgba(255,255,255,0.8)',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: getSystemFont('bold'),
    color: '#fcd3aa',
    marginBottom: 16,
    marginLeft: 4,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
    marginLeft: 4,
  },
  required: {
    color: '#ef4444',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(252,211,170,0.3)',
    paddingHorizontal: 16,
    minHeight: 56,
  },
  disabledInput: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(252,211,170,0.08)',
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,145,173,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: getSystemFont('medium'),
    paddingVertical: 16,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    fontFamily: getSystemFont('medium'),
    paddingVertical: 16,
  },
  bottomSpacing: {
    height: 40,
  },
});

export default EditProfileScreen;