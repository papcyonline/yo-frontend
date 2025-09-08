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
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { getSystemFont, COLORS } from '../../config/constants';
import { Person } from './Person';

const { width } = Dimensions.get('window');

interface EditPersonModalProps {
  visible: boolean;
  person: Person | null;
  onClose: () => void;
  onSave: () => void;
  onPersonChange?: (person: Person | null) => void;
}

export const EditPersonModal: React.FC<EditPersonModalProps> = ({
  visible,
  person,
  onClose,
  onSave,
  onPersonChange,
}) => {
  const [editedPerson, setEditedPerson] = useState<Person | null>(person);

  React.useEffect(() => {
    setEditedPerson(person);
  }, [person]);

  if (!editedPerson) return null;

  const handleSave = () => {
    if (onPersonChange && editedPerson) {
      onPersonChange(editedPerson);
    }
    onSave();
    onClose();
  };

  const updateField = (field: keyof Person, value: any) => {
    const updated = {
      ...editedPerson,
      [field]: value,
    };
    setEditedPerson(updated);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      updateField('photo', result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      updateField('photo', result.assets[0].uri);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Add Photo',
      'Choose how you would like to add a photo',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImage },
      ]
    );
  };

  const addPhoto = () => {
    if (!editedPerson.photos) {
      updateField('photos', []);
    }
    
    Alert.alert(
      'Add to Gallery',
      'Choose how you would like to add photos to the gallery',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.8,
          });
          if (!result.canceled && result.assets[0]) {
            const currentPhotos = editedPerson.photos || [];
            updateField('photos', [...currentPhotos, result.assets[0].uri]);
          }
        }},
        { text: 'Choose from Library', onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
          });
          if (!result.canceled && result.assets.length > 0) {
            const currentPhotos = editedPerson.photos || [];
            const newPhotos = result.assets.map(asset => asset.uri);
            updateField('photos', [...currentPhotos, ...newPhotos]);
          }
        }},
      ]
    );
  };

  const removePhoto = (index: number) => {
    const currentPhotos = editedPerson.photos || [];
    const updatedPhotos = currentPhotos.filter((_, i) => i !== index);
    updateField('photos', updatedPhotos);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.modalContainer}>
        {/* Header */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>Edit Member</Text>
            
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Photo Section */}
          <View style={styles.photoSection}>
            <Text style={styles.sectionTitle}>Profile Photo</Text>
            <View style={styles.photoContainer}>
              <TouchableOpacity style={styles.mainPhotoButton} onPress={showImageOptions}>
                {editedPerson.photo ? (
                  <Image source={{ uri: editedPerson.photo }} style={styles.mainPhoto} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Ionicons name="camera" size={32} color={COLORS.textSecondary} />
                    <Text style={styles.photoPlaceholderText}>Add Photo</Text>
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.photoLabel}>Profile Picture</Text>
            </View>
          </View>

          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  value={editedPerson.firstName || ''}
                  onChangeText={(text) => {
                    updateField('firstName', text);
                    updateField('name', `${text} ${editedPerson.lastName || ''}`.trim());
                  }}
                  placeholder="First name"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
              
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  value={editedPerson.lastName || ''}
                  onChangeText={(text) => {
                    updateField('lastName', text);
                    updateField('name', `${editedPerson.firstName || ''} ${text}`.trim());
                  }}
                  placeholder="Last name"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderSelector}>
                <TouchableOpacity
                  style={[styles.genderButton, editedPerson.gender === 'male' && styles.genderButtonActive]}
                  onPress={() => updateField('gender', 'male')}
                >
                  <Ionicons name="man" size={20} color={editedPerson.gender === 'male' ? COLORS.text : COLORS.textSecondary} />
                  <Text style={[styles.genderButtonText, editedPerson.gender === 'male' && styles.genderButtonTextActive]}>
                    Male
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.genderButton, editedPerson.gender === 'female' && styles.genderButtonActive]}
                  onPress={() => updateField('gender', 'female')}
                >
                  <Ionicons name="woman" size={20} color={editedPerson.gender === 'female' ? COLORS.text : COLORS.textSecondary} />
                  <Text style={[styles.genderButtonText, editedPerson.gender === 'female' && styles.genderButtonTextActive]}>
                    Female
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Life Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Life Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date of Birth</Text>
              <TextInput
                style={styles.input}
                value={editedPerson.dateOfBirth || ''}
                onChangeText={(text) => updateField('dateOfBirth', text)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Place of Birth</Text>
              <TextInput
                style={styles.input}
                value={editedPerson.placeOfBirth || ''}
                onChangeText={(text) => updateField('placeOfBirth', text)}
                placeholder="City, Country"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current Location</Text>
              <TextInput
                style={styles.input}
                value={editedPerson.currentLocation || ''}
                onChangeText={(text) => updateField('currentLocation', text)}
                placeholder="Current city, country"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Profession</Text>
              <TextInput
                style={styles.input}
                value={editedPerson.profession || ''}
                onChangeText={(text) => updateField('profession', text)}
                placeholder="What do they do?"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date of Death (if applicable)</Text>
              <TextInput
                style={styles.input}
                value={editedPerson.dateOfDeath || ''}
                onChangeText={(text) => {
                  updateField('dateOfDeath', text);
                  updateField('isAlive', !text);
                }}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
          </View>

          {/* Biography */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Biography</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tell their story...</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editedPerson.bio || ''}
                onChangeText={(text) => updateField('bio', text)}
                placeholder="Share memories, achievements, and stories that capture who they are..."
                placeholderTextColor={COLORS.textSecondary}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Photo Gallery */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Photo Gallery</Text>
              <TouchableOpacity style={styles.addPhotoButton} onPress={addPhoto}>
                <Ionicons name="add" size={20} color={COLORS.primary} />
                <Text style={styles.addPhotoText}>Add Photos</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoGallery}>
              {editedPerson.photos && editedPerson.photos.length > 0 ? (
                editedPerson.photos.map((photo, index) => (
                  <View key={index} style={styles.galleryPhotoContainer}>
                    <Image source={{ uri: photo }} style={styles.galleryPhoto} />
                    <TouchableOpacity 
                      style={styles.removePhotoButton} 
                      onPress={() => removePhoto(index)}
                    >
                      <Ionicons name="close-circle" size={24} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <View style={styles.emptyGallery}>
                  <Ionicons name="images-outline" size={32} color={COLORS.textSecondary} />
                  <Text style={styles.emptyGalleryText}>No photos added yet</Text>
                </View>
              )}
            </ScrollView>
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
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.background}30`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: getSystemFont('bold'),
    color: COLORS.text,
  },
  saveButton: {
    backgroundColor: `${COLORS.background}30`,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: getSystemFont('semiBold'),
    color: COLORS.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: `${COLORS.textSecondary}20`,
  },
  photoContainer: {
    alignItems: 'center',
  },
  mainPhotoButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 12,
  },
  mainPhoto: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  photoPlaceholderText: {
    fontSize: 12,
    fontFamily: getSystemFont('medium'),
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  photoLabel: {
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
    color: COLORS.textSecondary,
  },
  section: {
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: `${COLORS.textSecondary}20`,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: getSystemFont('bold'),
    color: COLORS.text,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: `${COLORS.textSecondary}40`,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    backgroundColor: COLORS.surface,
    color: COLORS.text,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  genderSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: `${COLORS.textSecondary}40`,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    gap: 8,
  },
  genderButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  genderButtonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: getSystemFont('medium'),
  },
  genderButtonTextActive: {
    color: COLORS.text,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  addPhotoText: {
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
    color: COLORS.primary,
  },
  photoGallery: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  galleryPhotoContainer: {
    position: 'relative',
    marginRight: 12,
  },
  galleryPhoto: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.background,
    borderRadius: 12,
  },
  emptyGallery: {
    alignItems: 'center',
    paddingVertical: 32,
    width: width - 40,
  },
  emptyGalleryText: {
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  bottomSpacing: {
    height: 40,
  },
});