import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Image,
  Alert,
  Dimensions,
  FlatList,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { getSystemFont, COLORS } from '../../config/constants';

const { width } = Dimensions.get('window');

interface NewPersonData {
  firstName: string;
  lastName: string;
  yearOfBirth: string;
  placeOfBirth: string;
  gender: 'male' | 'female';
  relationshipType?: 'child' | 'parent' | 'sibling' | 'spouse';
  bio?: string;
  profilePhoto?: string;
  galleryImages?: string[];
}

interface AddChildModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (data: NewPersonData) => void;
  personData: NewPersonData;
  onDataChange: (data: NewPersonData) => void;
}

export const AddChildModal: React.FC<AddChildModalProps> = ({
  visible,
  onClose,
  onAdd,
  personData,
  onDataChange,
}) => {
  const [galleryImages, setGalleryImages] = useState<string[]>(personData.galleryImages || []);

  const handleAdd = () => {
    if (!personData.firstName.trim()) {
      Alert.alert('Required', 'Please enter at least the first name');
      return;
    }
    onAdd({ ...personData, galleryImages });
    onClose();
  };

  const updateField = (field: keyof NewPersonData, value: any) => {
    onDataChange({
      ...personData,
      [field]: value,
    });
  };

  const pickProfilePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need camera roll permissions to select a photo');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      updateField('profilePhoto', result.assets[0].uri);
    }
  };

  const takeProfilePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need camera permissions to take a photo');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      updateField('profilePhoto', result.assets[0].uri);
    }
  };

  const addGalleryImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need camera roll permissions to select photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newImages = result.assets.map(asset => asset.uri);
      setGalleryImages([...galleryImages, ...newImages]);
    }
  };

  const removeGalleryImage = (index: number) => {
    const newImages = galleryImages.filter((_, i) => i !== index);
    setGalleryImages(newImages);
  };

  const showProfilePhotoOptions = () => {
    Alert.alert(
      'Profile Photo',
      'Choose how to add a profile photo',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: takeProfilePhoto },
        { text: 'Choose from Library', onPress: pickProfilePhoto },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Add Family Member</Text>
          
          <TouchableOpacity 
            onPress={handleAdd}
            style={[styles.saveButton, !personData.firstName.trim() && styles.saveButtonDisabled]}
            disabled={!personData.firstName.trim()}
          >
            <Text style={[styles.saveButtonText, !personData.firstName.trim() && styles.saveButtonTextDisabled]}>
              Save
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Photo Section */}
          <TouchableOpacity style={styles.profilePhotoSection} onPress={showProfilePhotoOptions}>
            {personData.profilePhoto ? (
              <Image source={{ uri: personData.profilePhoto }} style={styles.profilePhoto} />
            ) : (
              <View style={styles.profilePhotoPlaceholder}>
                <Ionicons name="person-circle-outline" size={80} color={COLORS.textSecondary} />
                <Text style={styles.addPhotoText}>Add Profile Photo</Text>
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={20} color={COLORS.text} />
            </View>
          </TouchableOpacity>

          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.nameRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput
                  style={[styles.input, !personData.firstName.trim() && styles.inputError]}
                  value={personData.firstName}
                  onChangeText={(text) => updateField('firstName', text)}
                  placeholder="Required"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  value={personData.lastName}
                  onChangeText={(text) => updateField('lastName', text)}
                  placeholder="Optional"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
            </View>

            {/* Gender Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderRow}>
                <TouchableOpacity
                  style={[styles.genderOption, personData.gender === 'male' && styles.genderOptionActive]}
                  onPress={() => updateField('gender', 'male')}
                >
                  <Ionicons 
                    name="male" 
                    size={20} 
                    color={personData.gender === 'male' ? COLORS.primary : COLORS.textSecondary} 
                  />
                  <Text style={[styles.genderText, personData.gender === 'male' && styles.genderTextActive]}>
                    Male
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.genderOption, personData.gender === 'female' && styles.genderOptionActive]}
                  onPress={() => updateField('gender', 'female')}
                >
                  <Ionicons 
                    name="female" 
                    size={20} 
                    color={personData.gender === 'female' ? COLORS.primary : COLORS.textSecondary} 
                  />
                  <Text style={[styles.genderText, personData.gender === 'female' && styles.genderTextActive]}>
                    Female
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Relationship Type Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Relationship to Selected Person</Text>
              <View style={styles.relationshipGrid}>
                <TouchableOpacity
                  style={[styles.relationshipOption, personData.relationshipType === 'child' && styles.relationshipOptionActive]}
                  onPress={() => updateField('relationshipType', 'child')}
                >
                  <Ionicons 
                    name="arrow-down" 
                    size={16} 
                    color={personData.relationshipType === 'child' ? COLORS.primary : COLORS.textSecondary} 
                  />
                  <Text style={[styles.relationshipText, personData.relationshipType === 'child' && styles.relationshipTextActive]}>
                    Child
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.relationshipOption, personData.relationshipType === 'parent' && styles.relationshipOptionActive]}
                  onPress={() => updateField('relationshipType', 'parent')}
                >
                  <Ionicons 
                    name="arrow-up" 
                    size={16} 
                    color={personData.relationshipType === 'parent' ? COLORS.primary : COLORS.textSecondary} 
                  />
                  <Text style={[styles.relationshipText, personData.relationshipType === 'parent' && styles.relationshipTextActive]}>
                    Parent
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.relationshipOption, personData.relationshipType === 'sibling' && styles.relationshipOptionActive]}
                  onPress={() => updateField('relationshipType', 'sibling')}
                >
                  <Ionicons 
                    name="people" 
                    size={16} 
                    color={personData.relationshipType === 'sibling' ? COLORS.primary : COLORS.textSecondary} 
                  />
                  <Text style={[styles.relationshipText, personData.relationshipType === 'sibling' && styles.relationshipTextActive]}>
                    Sibling
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.relationshipOption, personData.relationshipType === 'spouse' && styles.relationshipOptionActive]}
                  onPress={() => updateField('relationshipType', 'spouse')}
                >
                  <Ionicons 
                    name="heart" 
                    size={16} 
                    color={personData.relationshipType === 'spouse' ? COLORS.primary : COLORS.textSecondary} 
                  />
                  <Text style={[styles.relationshipText, personData.relationshipType === 'spouse' && styles.relationshipTextActive]}>
                    Spouse
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Year of Birth */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Year of Birth</Text>
              <TextInput
                style={styles.input}
                value={personData.yearOfBirth}
                onChangeText={(text) => updateField('yearOfBirth', text)}
                placeholder="e.g., 1950 (Optional)"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="numeric"
                maxLength={4}
              />
            </View>

            {/* Place of Birth */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Place of Birth</Text>
              <TextInput
                style={styles.input}
                value={personData.placeOfBirth}
                onChangeText={(text) => updateField('placeOfBirth', text)}
                placeholder="City, Country (Optional)"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
          </View>

          {/* Biography Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Biography</Text>
            <TextInput
              style={styles.bioInput}
              value={personData.bio || ''}
              onChangeText={(text) => updateField('bio', text)}
              placeholder="Tell their story... Share memories, achievements, and what made them special (Optional)"
              placeholderTextColor={COLORS.textSecondary}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          {/* Photo Gallery Section */}
          <View style={styles.section}>
            <View style={styles.gallerySectionHeader}>
              <Text style={styles.sectionTitle}>Photo Gallery</Text>
              <TouchableOpacity style={styles.addPhotoButton} onPress={addGalleryImage}>
                <Ionicons name="add-circle" size={24} color={COLORS.primary} />
                <Text style={styles.addPhotoButtonText}>Add Photos</Text>
              </TouchableOpacity>
            </View>

            {galleryImages.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
                <View style={styles.galleryContainer}>
                  {galleryImages.map((image, index) => (
                    <View key={index} style={styles.galleryImageWrapper}>
                      <Image source={{ uri: image }} style={styles.galleryImage} />
                      <TouchableOpacity 
                        style={styles.removeImageButton}
                        onPress={() => removeGalleryImage(index)}
                      >
                        <Ionicons name="close-circle" size={24} color={COLORS.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity style={styles.addMorePhotos} onPress={addGalleryImage}>
                    <Ionicons name="add" size={40} color={COLORS.textSecondary} />
                    <Text style={styles.addMoreText}>Add More</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            ) : (
              <TouchableOpacity style={styles.emptyGallery} onPress={addGalleryImage}>
                <Ionicons name="images-outline" size={50} color={COLORS.textSecondary} />
                <Text style={styles.emptyGalleryText}>
                  Add photos to preserve memories
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: getSystemFont('semiBold'),
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.surface,
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
    color: COLORS.text,
  },
  saveButtonTextDisabled: {
    color: COLORS.textSecondary,
  },
  content: {
    flex: 1,
  },
  
  // Profile Photo
  profilePhotoSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: COLORS.surface,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profilePhotoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 30,
    right: width / 2 - 50,
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.background,
  },
  
  // Sections
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: COLORS.text,
    marginBottom: 15,
  },
  
  // Inputs
  nameRow: {
    flexDirection: 'row',
    gap: 15,
  },
  inputGroup: {
    flex: 1,
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: COLORS.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: COLORS.text,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputError: {
    borderColor: COLORS.error,
  },
  
  // Gender Selection
  genderRow: {
    flexDirection: 'row',
    gap: 15,
  },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  genderOptionActive: {
    backgroundColor: 'rgba(0, 145, 173, 0.1)',
    borderColor: COLORS.primary,
  },
  genderText: {
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
    color: COLORS.textSecondary,
  },
  genderTextActive: {
    color: COLORS.primary,
  },
  
  // Relationship Type Selection
  relationshipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  relationshipOption: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  relationshipOptionActive: {
    backgroundColor: `${COLORS.primary}15`,
    borderColor: COLORS.primary,
  },
  relationshipText: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: COLORS.textSecondary,
  },
  relationshipTextActive: {
    color: COLORS.primary,
  },
  
  // Biography
  bioInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: COLORS.text,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  // Gallery
  gallerySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  addPhotoButtonText: {
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
    color: COLORS.primary,
  },
  galleryScroll: {
    marginHorizontal: -20,
  },
  galleryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
  },
  galleryImageWrapper: {
    position: 'relative',
  },
  galleryImage: {
    width: 120,
    height: 120,
    borderRadius: 10,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.background,
    borderRadius: 12,
  },
  addMorePhotos: {
    width: 120,
    height: 120,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
  },
  addMoreText: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: COLORS.textSecondary,
    marginTop: 5,
  },
  emptyGallery: {
    height: 150,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
  },
  emptyGalleryText: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: COLORS.textSecondary,
    marginTop: 10,
  },
  
  bottomSpacing: {
    height: 40,
  },
});