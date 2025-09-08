import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useAlert } from '../../context/AlertContext';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
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

type ViewType = 'photos' | 'albums';
type ActionType = 'text' | null;

// Predefined text background colors
const TEXT_BACKGROUNDS = [
  { id: 'gradient1', colors: ['#0091ad', '#04a7c7'], name: 'Ocean Blue' },
  { id: 'gradient2', colors: ['#fcd3aa', '#0091ad'], name: 'Sunset' },
  { id: 'gradient3', colors: ['#FF6B6B', '#4ECDC4'], name: 'Coral' },
  { id: 'gradient4', colors: ['#A8E6CF', '#DCEDC1'], name: 'Green' },
  { id: 'gradient5', colors: ['#FFD93D', '#6BCF7F'], name: 'Sunny' },
  { id: 'gradient6', colors: ['#667eea', '#764ba2'], name: 'Purple' },
  { id: 'gradient7', colors: ['#f093fb', '#f5576c'], name: 'Pink' },
  { id: 'solid1', colors: ['#000000', '#000000'], name: 'Black' },
  { id: 'solid2', colors: ['#FFFFFF', '#FFFFFF'], name: 'White' },
  { id: 'solid3', colors: ['#0091ad', '#0091ad'], name: 'Blue' },
];

const FONT_FAMILIES = [
  'System',
  'Georgia',
  'Times New Roman', 
  'Courier New',
  'Helvetica',
  'Arial Black'
];

const CreateStatusModal: React.FC<CreateStatusModalProps> = ({
  visible,
  onClose,
  onStatusCreated
}) => {
  const [currentView, setCurrentView] = useState<ViewType>('photos');
  const [selectedAction, setSelectedAction] = useState<ActionType>(null);
  const [galleryImages, setGalleryImages] = useState<MediaLibrary.Asset[]>([]);
  const [albums, setAlbums] = useState<MediaLibrary.Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  
  // Debug selectedImages changes
  useEffect(() => {
    console.log('🔄 [STATE] selectedImages changed to:', selectedImages.length + ' images selected');
  }, [selectedImages]);
  
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasGalleryPermission, setHasGalleryPermission] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  
  // Text styling states
  const [selectedBackground, setSelectedBackground] = useState(TEXT_BACKGROUNDS[0]);
  const [selectedTextColor, setSelectedTextColor] = useState('#FFFFFF');
  const [selectedFontFamily, setSelectedFontFamily] = useState(FONT_FAMILIES[0]);
  const [selectedFontSize, setSelectedFontSize] = useState(20);
  const [textAlignment, setTextAlignment] = useState<'left' | 'center' | 'right'>('center');
  
  const { showAlert, success, error } = useAlert();

  // Permissions and loading
  useEffect(() => {
    if (visible) {
      requestPermissions();
    }
  }, [visible]);

  // Load media when view changes or modal opens
  useEffect(() => {
    if (visible && hasGalleryPermission) {
      // Only load media if we're not viewing album photos
      if (!selectedAlbum) {
        loadMedia();
      }
    }
  }, [visible, currentView, hasGalleryPermission]);

  const requestPermissions = async () => {
    try {
      // Request gallery permission first
      const { status: galleryStatus } = await MediaLibrary.requestPermissionsAsync();
      setHasGalleryPermission(galleryStatus === 'granted');
      
      const cameraResult = await ImagePicker.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraResult.status === 'granted');
      
      const locationResult = await Location.requestForegroundPermissionsAsync();
      if (locationResult.status === 'granted') {
        try {
          const location = await Location.getCurrentPositionAsync();
          setCurrentLocation(location);
        } catch (locError) {
          console.log('Location not available');
        }
      }
    } catch (error) {
      console.error('Permission error:', error);
    }
  };

  const loadMedia = async () => {
    try {
      // Check if we already have permission
      if (!hasGalleryPermission) {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Please grant photo library access to select images.');
          return;
        }
        setHasGalleryPermission(true);
      }
      
      if (currentView === 'photos') {
        const assets = await MediaLibrary.getAssetsAsync({
          mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
          sortBy: [MediaLibrary.SortBy.creationTime],
          first: 10000, // Load up to 10,000 images to get all device images
        });
        console.log('📱 [Gallery] Loaded', assets.assets.length, 'photos');
        setGalleryImages(assets.assets);
      } else if (currentView === 'albums') {
        const albumsList = await MediaLibrary.getAlbumsAsync({
          includeSmartAlbums: true,
        });
        console.log('📂 [Albums] Loaded', albumsList.length, 'albums');
        setAlbums(albumsList);
      }
    } catch (error) {
      console.error('❌ [Media] Error loading media:', error);
      Alert.alert('Error', 'Failed to load media. Please try again.');
    }
  };

  const loadAlbumPhotos = async (albumId: string) => {
    try {
      const assets = await MediaLibrary.getAssetsAsync({
        album: albumId,
        mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
        sortBy: [MediaLibrary.SortBy.creationTime],
        first: 10000, // Load up to 10,000 images to get all album images
      });
      console.log('📂 [Album] Loaded', assets.assets.length, 'photos from album');
      setGalleryImages(assets.assets);
      setSelectedAlbum(albumId);
    } catch (error) {
      console.error('❌ [Album] Error loading album photos:', error);
      Alert.alert('Error', 'Failed to load album photos.');
    }
  };

  const takePhoto = async () => {
    if (!hasCameraPermission) {
      error('Camera permission required');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImages([result.assets[0].uri]);
        setSelectedAction(null);
      }
    } catch (error) {
      console.error('Camera error:', error);
      showAlert('Error', 'Failed to take photo');
    }
  };


  const handleImageSelect = async (asset: MediaLibrary.Asset) => {
    try {
      // Use asset.uri directly instead of getting localUri for consistency
      const imageUri = asset.uri;
      
      // Toggle selection - if already selected, remove it; if not selected, add it
      setSelectedImages(prevSelected => {
        if (prevSelected.includes(imageUri)) {
          // Remove from selection
          return prevSelected.filter(uri => uri !== imageUri);
        } else {
          // Add to selection (limit to 15 images for performance)
          if (prevSelected.length >= 15) {
            alert('You can select maximum 15 images');
            return prevSelected;
          }
          return [...prevSelected, imageUri];
        }
      });
      
      setSelectedAction(null);
    } catch (error) {
      console.error('Error selecting image:', error);
      error('Failed to select image');
    }
  };

  const handlePost = async () => {
    const hasText = text && text.trim().length > 0;
    const hasImages = selectedImages && selectedImages.length > 0;

    if (!hasText && !hasImages) {
      error('Please add text or select images');
      return;
    }

    setIsLoading(true);

    try {
      const statusData: any = {};

      if (hasText) {
        statusData.text = text.trim();
        statusData.textBackgroundColor = selectedBackground.id;
        statusData.textFontSize = selectedFontSize;
        statusData.textColor = selectedTextColor;
        statusData.textFontFamily = selectedFontFamily;
        statusData.textAlignment = textAlignment;
      }

      if (hasImages) {
        // For now, send only the first selected image since backend supports single image
        // TODO: Extend backend to support multiple images
        const firstImage = selectedImages[0];
        const fileName = firstImage.split('/').pop() || 'image.jpg';
        const fileType = fileName.includes('.') ? `image/${fileName.split('.').pop()}` : 'image/jpeg';
        
        statusData.image = {
          uri: firstImage,
          name: fileName,
          type: fileType
        };
      }


      if (currentLocation) {
        statusData.latitude = currentLocation.coords.latitude;
        statusData.longitude = currentLocation.coords.longitude;
      }

      statusData.visibility = 'friends';

      const response = await StatusAPI.createStatus(statusData);

      if (response.success && response.data) {
        success('Status posted successfully!');
        onStatusCreated(response.data.status);
        resetForm();
        onClose();
      } else {
        error(response.message || 'Failed to post status');
      }
    } catch (err) {
      console.error('Post error:', err);
      error('Failed to post status');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedImages([]);
    setText('');
    setSelectedAction(null);
    setCurrentView('photos');
    setSelectedBackground(TEXT_BACKGROUNDS[0]);
    setSelectedTextColor('#FFFFFF');
    setSelectedFontFamily(FONT_FAMILIES[0]);
    setSelectedFontSize(20);
    setTextAlignment('center');
  };


  const renderTextEditor = () => (
    <ScrollView style={styles.textEditor} showsVerticalScrollIndicator={false}>
      {/* Text Preview */}
      <View style={styles.textPreviewContainer}>
        <LinearGradient
          colors={selectedBackground.colors}
          style={styles.textPreview}
        >
          <Text style={[
            styles.textPreviewText, 
            { 
              color: selectedTextColor, 
              fontSize: selectedFontSize,
              fontFamily: Platform.OS === 'ios' ? selectedFontFamily : 'System',
              textAlign: textAlignment 
            }
          ]}>
            {text || 'Type your status...'}
          </Text>
        </LinearGradient>
      </View>
      
      {/* Text Input */}
      <TextInput
        style={styles.textInput}
        value={text}
        onChangeText={setText}
        placeholder="What's on your mind?"
        placeholderTextColor="#999"
        multiline
        maxLength={500}
      />
      
      {/* Background Colors */}
      <View style={styles.controlSection}>
        <Text style={styles.controlTitle}>Background</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.backgroundPicker}>
          {TEXT_BACKGROUNDS.map((bg) => (
            <TouchableOpacity
              key={bg.id}
              style={[styles.backgroundOption, selectedBackground.id === bg.id && styles.selectedBackground]}
              onPress={() => setSelectedBackground(bg)}
            >
              <LinearGradient colors={bg.colors} style={styles.backgroundPreview} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Text Color */}
      <View style={styles.controlSection}>
        <Text style={styles.controlTitle}>Text Color</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorPicker}>
          {[
            '#FFFFFF', '#000000', '#0091ad', '#04a7c7', '#fcd3aa', 
            '#FF6B6B', '#4ECDC4', '#FFD93D', '#A8E6CF', '#667eea'
          ].map((color) => (
            <TouchableOpacity
              key={color}
              style={[styles.colorOption, { backgroundColor: color }, selectedTextColor === color && styles.selectedColor]}
              onPress={() => setSelectedTextColor(color)}
            />
          ))}
        </ScrollView>
      </View>
      
      {/* Font Controls */}
      <View style={styles.controlSection}>
        <Text style={styles.controlTitle}>Font & Size</Text>
        <View style={styles.fontControls}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fontPicker}>
            {FONT_FAMILIES.map((font) => (
              <TouchableOpacity
                key={font}
                style={[styles.fontOption, selectedFontFamily === font && styles.selectedFont]}
                onPress={() => setSelectedFontFamily(font)}
              >
                <Text style={[styles.fontOptionText, { fontFamily: Platform.OS === 'ios' ? font : 'System' }]}>
                  {font}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        <View style={styles.fontSizeControls}>
          <TouchableOpacity onPress={() => setSelectedFontSize(Math.max(12, selectedFontSize - 2))}>
            <Ionicons name="remove-circle" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.fontSizeText}>{selectedFontSize}px</Text>
          <TouchableOpacity onPress={() => setSelectedFontSize(Math.min(36, selectedFontSize + 2))}>
            <Ionicons name="add-circle" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Text Alignment */}
      <View style={styles.controlSection}>
        <Text style={styles.controlTitle}>Alignment</Text>
        <View style={styles.alignmentControls}>
          {(['left', 'center', 'right'] as const).map((align) => (
            <TouchableOpacity
              key={align}
              style={[styles.alignmentButton, textAlignment === align && styles.selectedAlignment]}
              onPress={() => setTextAlignment(align)}
            >
              <Ionicons 
                name={`text-${align === 'left' ? 'left' : align === 'center' ? 'center' : 'right'}-outline` as any}
                size={20} 
                color={textAlignment === align ? '#0091ad' : '#666'} 
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );


  const renderAlbums = () => (
    <ScrollView style={styles.albumsContainer}>
      {albums.map((album) => (
        <TouchableOpacity
          key={album.id}
          style={styles.albumItem}
          onPress={() => {
            loadAlbumPhotos(album.id);
            // Don't automatically switch view - let loadAlbumPhotos handle it
          }}
        >
          <View style={styles.albumPreview}>
            <Text style={styles.albumTitle}>{album.title}</Text>
            <Text style={styles.albumCount}>{album.assetCount} items</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderGalleryGrid = () => (
    <FlatList
      data={galleryImages}
      numColumns={4}
      key={`gallery-${currentView}-${selectedAlbum || 'all'}`} // Force re-render with unique key
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.galleryGrid}
      renderItem={({ item }) => {
        const isSelected = selectedImages.includes(item.uri);
        return (
          <TouchableOpacity
            style={styles.galleryItem}
            onPress={() => handleImageSelect(item)}
          >
            <Image
              source={{ uri: item.uri }}
              style={[styles.galleryImage, isSelected && styles.selectedImage]}
              contentFit="cover"
            />
            {item.mediaType === MediaLibrary.MediaType.video && (
              <View style={styles.videoDuration}>
                <Ionicons name="play" size={12} color="#FFFFFF" />
                <Text style={styles.durationText}>
                  {item.duration ? `${Math.floor(item.duration / 60)}:${(item.duration % 60).toFixed(0).padStart(2, '0')}` : '0:00'}
                </Text>
              </View>
            )}
            {isSelected && (
              <View style={styles.checkmarkContainer}>
                <Ionicons name="checkmark-circle" size={24} color="#0091ad" />
              </View>
            )}
            {isSelected && (
              <View style={styles.selectionNumber}>
                <Text style={styles.selectionNumberText}>
                  {selectedImages.indexOf(item.uri) + 1}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      }}
    />
  );

  const renderContent = () => {
    if (selectedAction === 'text') return renderTextEditor();
    
    // Show albums list when in albums view and no album selected
    if (currentView === 'albums' && !selectedAlbum) return renderAlbums();
    
    // Show gallery grid for photos view or when an album is selected
    if (currentView === 'photos' || selectedAlbum) return renderGalleryGrid();
    
    return renderAlbums();
  };

  const renderPostButton = () => {
    const hasText = text && text.trim().length > 0;
    const hasImages = selectedImages && selectedImages.length > 0;
    const canPost = hasText || hasImages;

    return (
      <TouchableOpacity 
        style={[styles.postButton, !canPost && styles.postButtonDisabled]}
        onPress={handlePost}
        disabled={isLoading || !canPost}
      >
        <LinearGradient
          colors={canPost ? ['#0091ad', '#04a7c7'] : ['#666', '#888']}
          style={styles.postButtonGradient}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.postButtonText}>Post Status</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Compact Header */}
        <View style={styles.compactHeader}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          {/* Navigation Tabs */}
          <View style={styles.centerNavigation}>
            {selectedAlbum ? (
              <TouchableOpacity 
                onPress={() => {
                  setSelectedAlbum(null);
                  setCurrentView('albums');
                }}
                style={styles.backButton}
              >
                <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
                <Text style={styles.backButtonText}>Albums</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.navTabs}>
                <TouchableOpacity 
                  style={[styles.navTab, currentView === 'photos' && styles.activeNavTab]}
                  onPress={() => {
                    setCurrentView('photos');
                    setSelectedAlbum(null);
                    loadMedia();
                  }}
                >
                  <Text style={[styles.navTabText, currentView === 'photos' && styles.activeNavTabText]}>
                    Photos
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.navTab, currentView === 'albums' && styles.activeNavTab]}
                  onPress={() => {
                    setCurrentView('albums');
                    setSelectedAlbum(null);
                    loadMedia();
                  }}
                >
                  <Text style={[styles.navTabText, currentView === 'albums' && styles.activeNavTabText]}>
                    Albums
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={[styles.compactActionButton, selectedAction === 'text' && styles.activeCompactAction]}
              onPress={() => setSelectedAction(selectedAction === 'text' ? null : 'text')}
            >
              <Ionicons name="text" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.compactActionButton}
              onPress={takePhoto}
            >
              <Ionicons name="camera" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Content Area */}
        <View style={styles.content}>
          {renderContent()}
        </View>
        
        {/* Post Button */}
        <View style={styles.bottomSection}>
          {selectedImages.length > 0 && (
            <View style={styles.selectionSummary}>
              <Text style={styles.selectionText}>
                {selectedImages.length} image{selectedImages.length > 1 ? 's' : ''} selected
              </Text>
              <TouchableOpacity onPress={() => setSelectedImages([])}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            </View>
          )}
          {renderPostButton()}
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
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerNavigation: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  compactActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeCompactAction: {
    backgroundColor: '#0091ad',
  },
  topNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  navTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 4,
  },
  navTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
  },
  activeNavTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  navTabText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    fontWeight: '500',
  },
  activeNavTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  actionButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
  },
  activeActionButton: {
    transform: [{ scale: 1.05 }],
  },
  actionButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButtonIcon: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  activeActionIcon: {
    color: '#FFFFFF',
  },
  actionButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  activeActionText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    marginHorizontal: 10,
  },
  // Text Editor Styles
  textEditor: {
    flex: 1,
    padding: 20,
  },
  textPreviewContainer: {
    marginBottom: 20,
  },
  textPreview: {
    height: 250,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  textPreviewText: {
    textAlign: 'center',
    fontWeight: '600',
    maxWidth: '90%',
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    color: '#FFFFFF',
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  controlSection: {
    marginBottom: 20,
  },
  controlTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  backgroundPicker: {
    flexDirection: 'row',
  },
  backgroundOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  selectedBackground: {
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },
  backgroundPreview: {
    flex: 1,
  },
  colorPicker: {
    flexDirection: 'row',
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },
  fontControls: {
    gap: 10,
  },
  fontPicker: {
    flexDirection: 'row',
  },
  fontOption: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedFont: {
    backgroundColor: '#0091ad',
  },
  fontOptionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  fontSizeControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
    marginTop: 10,
  },
  fontSizeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  alignmentControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  alignmentButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedAlignment: {
    backgroundColor: 'rgba(0, 145, 173, 0.3)',
  },
  // Albums & Gallery Styles
  albumsContainer: {
    flex: 1,
    padding: 15,
  },
  albumItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
  },
  albumPreview: {
    gap: 5,
  },
  albumTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  albumCount: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  galleryGrid: {
    padding: 10,
  },
  galleryItem: {
    width: (SCREEN_WIDTH - 50) / 4,
    height: (SCREEN_WIDTH - 50) / 4,
    margin: 2,
    position: 'relative',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  selectedImage: {
    borderWidth: 3,
    borderColor: '#0091ad',
  },
  videoDuration: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
  },
  // Bottom Section Styles
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 35 : 20,
  },
  selectionSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 145, 173, 0.2)',
    borderRadius: 12,
    marginBottom: 12,
  },
  selectionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  clearText: {
    color: '#0091ad',
    fontSize: 14,
    fontWeight: '600',
  },
  // Post Button Styles
  postButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonGradient: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    alignItems: 'center',
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionNumber: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#0091ad',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default CreateStatusModal;