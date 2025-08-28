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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuthStore } from '../../../store/authStore';
import { apiService } from '../../../services/api';
import { progressiveProfileAPI } from '../../../services/api/progressive';
import { COLORS, getSystemFont } from '../../../config/constants';

const { width } = Dimensions.get('window');

interface ModernEditProfileProps {
  navigation: any;
  route: any;
}

const ModernEditProfileScreen: React.FC<ModernEditProfileProps> = ({ navigation, route }) => {
  const { user: authUser } = useAuthStore();
  const { user: routeUser, section, focus } = route.params || {};
  const user = routeUser || authUser;

  // Form states
  const [formData, setFormData] = useState({
    first_name: user?.firstName || user?.first_name || '',
    last_name: user?.lastName || user?.last_name || '',
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    location: user?.current_address || user?.location || '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showDatePicker, setShowDatePicker] = useState(false);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before saving.');
      return;
    }

    try {
      setLoading(true);
      
      // Log the data being sent for debugging
      console.log('Sending profile update:', formData);
      
      // Map the form data to progressive profile format
      const progressiveData = {
        full_name: `${formData.first_name} ${formData.last_name}`.trim(),
        username: formData.username,
        personal_bio: formData.bio,
        location: formData.location,
        ...(formData.email && { email: formData.email }),
        ...(formData.phone && { phone: formData.phone })
      };
      
      const response = await progressiveProfileAPI.saveBatchAnswers(progressiveData);
      
      console.log('Profile update response:', response);
      
      if (response.success) {
        // The progressive API returns profile data, not user data
        // We should refresh the user profile from the main API
        const profileResponse = await apiService.get('/users/profile');
        if (profileResponse.success) {
          useAuthStore.getState().setUser(profileResponse.data.user);
        }
        Alert.alert('Success', 'Profile updated successfully!');
        navigation.goBack();
      } else {
        Alert.alert('Error', response.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      Alert.alert('Error', `Failed to update profile: ${error.message || 'Please check your connection.'}`);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="chevron-back" size={24} color={COLORS.text} />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>Edit Profile</Text>
      
      <TouchableOpacity
        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.text} size="small" />
        ) : (
          <Text style={styles.saveButtonText}>Save</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderInputField = (
    label: string,
    field: string,
    placeholder: string,
    icon: string,
    multiline: boolean = false,
    keyboardType: any = 'default'
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputWrapper, errors[field] && styles.inputError]}>
        <Ionicons name={icon as any} size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={[styles.textInput, multiline && styles.textInputMultiline]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSecondary}
          value={formData[field as keyof typeof formData]}
          onChangeText={(value) => updateField(field, value)}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          keyboardType={keyboardType}
        />
      </View>
      {errors[field] && (
        <Text style={styles.errorText}>{errors[field]}</Text>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      {renderHeader()}
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Basic Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          {renderInputField(
            'First Name', 
            'first_name', 
            'Enter your first name', 
            'person'
          )}
          
          {renderInputField(
            'Last Name', 
            'last_name', 
            'Enter your last name', 
            'person'
          )}
          
          {renderInputField(
            'Username', 
            'username', 
            'Choose a username', 
            'at'
          )}
          
          {renderInputField(
            'Email', 
            'email', 
            'Enter your email address', 
            'mail',
            false,
            'email-address'
          )}
          
          {renderInputField(
            'Phone', 
            'phone', 
            'Enter your phone number', 
            'call',
            false,
            'phone-pad'
          )}
          
          {renderInputField(
            'Bio', 
            'bio', 
            'Tell us about yourself...', 
            'information-circle',
            true
          )}
          
          {renderInputField(
            'Location', 
            'location', 
            'Where do you live?', 
            'location'
          )}
        </View>

        {/* Additional Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Note</Text>
          <Text style={styles.helperText}>
            Additional profile fields (family, education, etc.) are managed through your conversation responses with the AI assistant.
          </Text>
        </View>

        {/* Auto-fill suggestion */}
        <TouchableOpacity style={styles.autoFillButton}>
          <Ionicons name="refresh" size={20} color={COLORS.primary} />
          <Text style={styles.autoFillText}>
            Auto-fill from answered questions
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 40,
    paddingBottom: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.textSecondary,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: getSystemFont('semiBold'),
    color: COLORS.text,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: COLORS.text,
    fontWeight: '600',
    fontFamily: getSystemFont('semiBold'),
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: getSystemFont('bold'),
    color: COLORS.text,
    marginBottom: 20,
  },
  helperText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 16,
    paddingRight: 16,
  },
  textInputMultiline: {
    paddingTop: 16,
    paddingBottom: 16,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
    marginLeft: 4,
  },
  autoFillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  autoFillText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 40,
  },
});

export default ModernEditProfileScreen;