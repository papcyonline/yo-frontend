// src/components/media/PhotoPicker.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { getSystemFont } from '../../config/constants';
import { MediaService } from '../../services/MediaServiceExpress';
import { API_CONFIG } from '../../constants/api';
import { useAuthStore } from '../../store/authStore';

interface PhotoPickerProps {
  visible: boolean;
  onClose: () => void;
  onImageSelected: (imageUri: string) => void;
  onImageUploaded?: (mediaFile: any) => void;
  context?: 'profile' | 'chat' | 'general';
  title?: string;
  autoUpload?: boolean;
  aspectRatio?: [number, number];
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

// Direct profile photo upload function (bypasses broken MediaService)
const uploadProfileImageDirect = async (imageUri: string) => {
  const { token, user } = useAuthStore.getState();
  if (!token) throw new Error('No authentication token');
  
  console.log('🖼️ UPLOAD DEBUG - Current user:', user?.id || user?._id);
  console.log('🔑 UPLOAD DEBUG - Token preview:', token.substring(0, 50) + '...');

  // Create FormData
  const formData = new FormData();
  formData.append('photo', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'profile-photo.jpg',
  } as any);

  const response = await fetch(`${API_CONFIG.BASE_URL}/users/profile/photo`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
    body: formData,
  });

  const result = await response.json();

  console.log('📸 UPLOAD RESPONSE - Status:', response.status);
  console.log('📸 UPLOAD RESPONSE - Success:', result.success);
  console.log('📸 UPLOAD RESPONSE - Photo URL:', result.data?.photoUrl);
  console.log('📸 UPLOAD RESPONSE - User ID:', result.data?.user?.id || result.data?.user?._id);

  if (!response.ok) {
    throw new Error(result.message || 'Failed to upload image');
  }

  return result; // Return the full API response
};

const PhotoPicker: React.FC<PhotoPickerProps> = ({
  visible,
  onClose,
  onImageSelected,
  onImageUploaded,
  context = 'general',
  title = 'Select Photo',
  autoUpload = false,
  aspectRatio = [1, 1],
  maxWidth = 1920,
  maxHeight = 1920,
  quality = 0.8,
}) => {
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const requestPermissions = async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraPermission.status !== 'granted' || mediaPermission.status !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'We need camera and photo library permissions to select photos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const pickFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: aspectRatio,
        quality: quality,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        handleImageSelection(imageUri);
      }
    } catch (error) {
      console.error('Error picking image from gallery:', error);
      Alert.alert('Error', 'Failed to pick image from gallery');
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: aspectRatio,
        quality: quality,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        handleImageSelection(imageUri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleImageSelection = async (imageUri: string) => {
    try {
      // Always call onImageSelected first
      onImageSelected(imageUri);

      // If autoUpload is enabled and we have an upload callback
      if (autoUpload && onImageUploaded) {
        setUploading(true);
        
        let mediaFile;
        if (context === 'profile') {
          // Use direct API call for profile uploads (bypassing broken MediaService)
          mediaFile = await uploadProfileImageDirect(imageUri);
        } else {
          // For general context, we'd need a reference ID
          // This might need to be passed as a prop
          throw new Error('Auto upload for general context requires additional implementation');
        }

        onImageUploaded(mediaFile);
        setUploading(false);
        onClose();
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Error handling image selection:', error);
      setUploading(false);
      Alert.alert('Error', 'Failed to process image');
    }
  };

  const handleConfirmSelection = async () => {
    if (!selectedImage) return;

    if (autoUpload && onImageUploaded) {
      try {
        setUploading(true);
        
        let mediaFile;
        if (context === 'profile') {
          mediaFile = await uploadProfileImageDirect(selectedImage);
        } else {
          throw new Error('Auto upload for general context requires additional implementation');
        }

        onImageUploaded(mediaFile);
        onClose();
      } catch (error) {
        console.error('Error uploading image:', error);
        Alert.alert('Error', 'Failed to upload image');
      } finally {
        setUploading(false);
      }
    } else {
      onClose();
    }
  };

  const renderPreview = () => {
    if (!selectedImage) return null;

    return (
      <View style={styles.previewContainer}>
        <View style={styles.previewImageContainer}>
          <Image source={{ uri: selectedImage }} style={styles.previewImage} />
        </View>
        
        <View style={styles.previewActions}>
          <TouchableOpacity 
            style={styles.retakeButton} 
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="refresh" size={16} color="#fcd3aa" />
            <Text style={styles.retakeText}>Retake</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.confirmButton}
            onPress={handleConfirmSelection}
            disabled={uploading}
          >
            <LinearGradient
              colors={['#0091ad', '#04a7c7']}
              style={styles.confirmGradient}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={16} color="#ffffff" />
                  <Text style={styles.confirmText}>
                    {autoUpload ? 'Upload' : 'Confirm'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderOptions = () => (
    <View style={styles.optionsContainer}>
      <TouchableOpacity style={styles.optionButton} onPress={takePhoto}>
        <LinearGradient
          colors={['rgba(0,145,173,0.1)', 'rgba(4,167,199,0.1)']}
          style={styles.optionGradient}
        >
          <View style={styles.optionIconContainer}>
            <LinearGradient
              colors={['#0091ad', '#04a7c7']}
              style={styles.optionIcon}
            >
              <Ionicons name="camera" size={24} color="#ffffff" />
            </LinearGradient>
          </View>
          <Text style={styles.optionTitle}>Camera</Text>
          <Text style={styles.optionDescription}>Take a new photo</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={styles.optionButton} onPress={pickFromGallery}>
        <LinearGradient
          colors={['rgba(252,211,170,0.1)', 'rgba(252,211,170,0.05)']}
          style={styles.optionGradient}
        >
          <View style={styles.optionIconContainer}>
            <LinearGradient
              colors={['#fcd3aa', '#f59e0b']}
              style={styles.optionIcon}
            >
              <Ionicons name="images" size={24} color="#ffffff" />
            </LinearGradient>
          </View>
          <Text style={styles.optionTitle}>Gallery</Text>
          <Text style={styles.optionDescription}>Choose from library</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#fcd3aa" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>{title}</Text>
          
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {selectedImage ? renderPreview() : renderOptions()}
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Ionicons name="information-circle" size={16} color="#fcd3aa" />
            <Text style={styles.infoText}>
              Photos will be compressed to maintain quality while reducing file size
            </Text>
          </View>
          
          {context === 'profile' && (
            <View style={styles.infoItem}>
              <Ionicons name="shield-checkmark" size={16} color="#0091ad" />
              <Text style={styles.infoText}>
                Profile photos are visible according to your privacy settings
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(252,211,170,0.1)',
  },
  
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(252,211,170,0.08)',
  },
  
  headerTitle: {
    fontSize: 18,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  
  headerSpacer: {
    width: 40,
  },
  
  // Content
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  
  // Options
  optionsContainer: {
    gap: 20,
  },
  
  optionButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  
  optionGradient: {
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  
  optionIconContainer: {
    marginBottom: 16,
  },
  
  optionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  
  optionTitle: {
    fontSize: 18,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginBottom: 4,
  },
  
  optionDescription: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  
  // Preview
  previewContainer: {
    flex: 1,
    alignItems: 'center',
  },
  
  previewImageContainer: {
    width: 280,
    height: 280,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 32,
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  
  previewActions: {
    flexDirection: 'row',
    gap: 16,
  },
  
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(252,211,170,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(252,211,170,0.3)',
    gap: 8,
  },
  
  retakeText: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
    color: '#fcd3aa',
  },
  
  confirmButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  
  confirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  
  confirmText: {
    fontSize: 14,
    fontFamily: getSystemFont('semiBold'),
    color: '#ffffff',
  },
  
  // Info
  infoContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  
  infoText: {
    fontSize: 12,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.6)',
    flex: 1,
    lineHeight: 16,
  },
});

export default PhotoPicker;