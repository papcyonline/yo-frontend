import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ScrollView,
  Modal,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  Dimensions,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusAPI } from '../../services/api/status';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CreateStatusModalProps {
  visible: boolean;
  onClose: () => void;
  onStatusCreated: (status: any) => void;
}

type TabType = 'gallery' | 'text' | 'camera';

const CreateStatusModal: React.FC<CreateStatusModalProps> = ({
  visible,
  onClose,
  onStatusCreated
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('gallery');
  const [galleryImages, setGalleryImages] = useState<MediaLibrary.Asset[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasGalleryPermission, setHasGalleryPermission] = useState(false);
  const textInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      loadGalleryImages();
    }
  }, [visible]);

  const loadGalleryImages = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        setHasGalleryPermission(true);
        const assets = await MediaLibrary.getAssetsAsync({
          first: 50,
          mediaType: MediaLibrary.MediaType.photo,
          sortBy: MediaLibrary.SortBy.creationTime
        });
        setGalleryImages(assets.assets);
        if (assets.assets.length > 0 && !selectedImage) {
          setSelectedImage(assets.assets[0].uri);
        }
      } else {
        console.log('Gallery permission not granted');
        setHasGalleryPermission(false);
      }
    } catch (error) {
      console.error('Error loading gallery:', error);
      Alert.alert('Error', 'Failed to load gallery images');
    }
  };

  const handleSelectImage = (uri: string) => {
    setSelectedImage(uri);
    setActiveTab('text');
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setActiveTab('text');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
    }
  };

  const handlePost = async () => {
    if (!text.trim() && !selectedImage) {
      Alert.alert('Error', 'Please add some content to your status');
      return;
    }

    setIsLoading(true);
    try {
      console.log('📝 Creating status with:', { hasText: !!text.trim(), hasImage: !!selectedImage });
      
      const statusData: any = {
        visibility: 'friends'
      };
      
      if (text.trim()) {
        statusData.text = text.trim();
      }

      if (selectedImage) {
        // For image upload, we need to format it properly for FormData
        statusData.image = {
          uri: selectedImage,
          type: 'image/jpeg',
          name: 'status.jpg',
        };
        console.log('📷 Image data prepared for upload');
      }

      const response = await StatusAPI.createStatus(statusData);
      console.log('📝 Status creation response:', response);
      
      if (response.success) {
        // Handle both response.data and response.status formats
        const createdStatus = response.data?.status || response.status;
        if (createdStatus) {
          onStatusCreated(createdStatus);
          setText('');
          setSelectedImage(null);
          setActiveTab('gallery');
          onClose();
        } else {
          Alert.alert('Success', 'Status created successfully!');
          setText('');
          setSelectedImage(null);
          setActiveTab('gallery');
          onClose();
        }
      } else {
        Alert.alert('Error', response.error || response.message || 'Failed to create status');
      }
    } catch (error: any) {
      console.error('Error creating status:', error);
      Alert.alert('Error', error.message || 'Failed to create status');
    } finally {
      setIsLoading(false);
    }
  };

  const renderGalleryTab = () => (
    <View style={styles.galleryContainer}>
      {!hasGalleryPermission ? (
        <View style={styles.emptyGallery}>
          <Text style={styles.emptyText}>Gallery permission required</Text>
          <TouchableOpacity onPress={loadGalleryImages} style={styles.permissionButton}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={galleryImages}
          keyExtractor={(item) => item.id}
          numColumns={3}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.galleryItem}
              onPress={() => handleSelectImage(item.uri)}
            >
              <Image 
                source={{ uri: item.uri }} 
                style={styles.galleryImage}
                resizeMode="cover"
              />
              {selectedImage === item.uri && (
                <View style={styles.selectedOverlay}>
                  <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyGallery}>
              <Text style={styles.emptyText}>No images in gallery</Text>
              <Text style={styles.emptySubtext}>Take a photo to get started</Text>
            </View>
          }
        />
      )}
      
      <TouchableOpacity style={styles.cameraButton} onPress={takePhoto}>
        <Ionicons name="camera" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  const renderTextTab = () => (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.textContainer}
    >
      {selectedImage && (
        <View style={styles.selectedImageContainer}>
          <Image source={{ uri: selectedImage }} style={styles.selectedImagePreview} />
          <TouchableOpacity 
            style={styles.removeImageButton}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close-circle" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
      
      <TextInput
        ref={textInputRef}
        style={styles.textInput}
        placeholder="Type a status..."
        placeholderTextColor="#666"
        value={text}
        onChangeText={setText}
        multiline
        autoFocus
        maxLength={2000}
      />
      
      <View style={styles.textActions}>
        <View style={styles.emojiRow}>
          {['😊', '❤️', '👍', '🎉', '😂', '😍', '🔥', '💯'].map((emoji) => (
            <TouchableOpacity 
              key={emoji}
              onPress={() => setText(text + emoji)}
              style={styles.emojiButton}
            >
              <Text style={styles.emoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {!selectedImage && (
          <View style={styles.mediaButtons}>
            <TouchableOpacity 
              style={styles.mediaButton}
              onPress={() => setActiveTab('gallery')}
            >
              <Ionicons name="image" size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.mediaButton}
              onPress={takePhoto}
            >
              <Ionicons name="camera" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.tabs}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'gallery' && styles.activeTab]}
              onPress={() => setActiveTab('gallery')}
            >
              <Ionicons name="image" size={20} color={activeTab === 'gallery' ? '#FFFFFF' : '#666'} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'text' && styles.activeTab]}
              onPress={() => setActiveTab('text')}
            >
              <MaterialIcons name="text-fields" size={20} color={activeTab === 'text' ? '#FFFFFF' : '#666'} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'camera' && styles.activeTab]}
              onPress={() => {
                setActiveTab('camera');
                takePhoto();
              }}
            >
              <Ionicons name="camera" size={20} color={activeTab === 'camera' ? '#FFFFFF' : '#666'} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.postButton, (!text.trim() && !selectedImage) && styles.postButtonDisabled]}
            onPress={handlePost}
            disabled={isLoading || (!text.trim() && !selectedImage)}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.postButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {activeTab === 'gallery' && renderGalleryTab()}
          {activeTab === 'text' && renderTextTab()}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  closeButton: {
    padding: 4,
  },
  tabs: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'center',
    gap: 20,
  },
  tab: {
    padding: 8,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#1A1A1A',
  },
  postButton: {
    backgroundColor: '#0091ad',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  galleryContainer: {
    flex: 1,
  },
  galleryItem: {
    width: SCREEN_WIDTH / 3,
    height: SCREEN_WIDTH / 3,
    padding: 1,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(4, 167, 199, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyGallery: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
  emptySubtext: {
    color: '#444',
    fontSize: 14,
    marginTop: 8,
  },
  permissionButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#0091ad',
    borderRadius: 20,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0091ad',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  textContainer: {
    flex: 1,
    padding: 16,
  },
  selectedImageContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  selectedImagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 18,
    color: '#FFFFFF',
    textAlignVertical: 'top',
    padding: 12,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    minHeight: 100,
  },
  textActions: {
    marginTop: 16,
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginBottom: 12,
  },
  emojiButton: {
    padding: 4,
  },
  emoji: {
    fontSize: 24,
  },
  mediaButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  mediaButton: {
    padding: 12,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
  },
});

export default CreateStatusModal;