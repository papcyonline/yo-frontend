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

// Background colors
const TEXT_BACKGROUNDS = [
  { id: 'blue', colors: ['#04a7c7', '#04a7c7'], name: 'Blue' },
  { id: 'black', colors: ['#000000', '#000000'], name: 'Black' },
  { id: 'white', colors: ['#FFFFFF', '#FFFFFF'], name: 'White' },
  { id: 'gray', colors: ['#424242', '#424242'], name: 'Gray' },
  { id: 'green', colors: ['#4CAF50', '#4CAF50'], name: 'Green' },
  { id: 'red', colors: ['#F44336', '#F44336'], name: 'Red' },
  { id: 'purple', colors: ['#9C27B0', '#9C27B0'], name: 'Purple' },
  { id: 'orange', colors: ['#FF9800', '#FF9800'], name: 'Orange' },
];

// Text colors
const TEXT_COLORS = [
  { id: 'white', color: '#FFFFFF', name: 'White' },
  { id: 'black', color: '#000000', name: 'Black' },
  { id: 'blue', color: '#04a7c7', name: 'Blue' },
  { id: 'red', color: '#F44336', name: 'Red' },
  { id: 'green', color: '#4CAF50', name: 'Green' },
  { id: 'yellow', color: '#FFEB3B', name: 'Yellow' },
];

// Font sizes
const FONT_SIZES = [16, 18, 20, 24, 28, 32, 36, 40];

const FONT_FAMILIES = [
  'System',
  'Georgia',
  'Helvetica'
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
  
  // Dropdown states
  const [showBackgroundDropdown, setShowBackgroundDropdown] = useState(false);
  const [showTextColorDropdown, setShowTextColorDropdown] = useState(false);
  const [showFontSizeDropdown, setShowFontSizeDropdown] = useState(false);
  
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
        statusData.textBackgroundColor = selectedBackground.colors[0]; // Use the actual color, not ID
        statusData.textFontSize = selectedFontSize;
        statusData.textColor = selectedTextColor;
        statusData.textFontFamily = selectedFontFamily;
        statusData.textAlignment = textAlignment;
        
        // Debug log to see what's being sent
        console.log('📤 [STATUS DATA] Sending:', {
          text: statusData.text,
          backgroundColor: statusData.textBackgroundColor,
          textColor: statusData.textColor,
          fontSize: statusData.textFontSize
        });
      }

      if (hasImages) {
        // Download iCloud image if needed and get actual file info
        const firstImageUri = selectedImages[0];
        
        try {
          // Use MediaLibrary to get the actual asset info for potential iCloud download
          const assets = await MediaLibrary.getAssetsAsync({
            first: 1,
            mediaType: [MediaLibrary.MediaType.photo]
          });
          
          // Find the matching asset by URI
          let targetAsset = null;
          const allAssets = await MediaLibrary.getAssetsAsync({
            first: 10000,
            mediaType: [MediaLibrary.MediaType.photo]
          });
          
          targetAsset = allAssets.assets.find(asset => asset.uri === firstImageUri);
          
          if (targetAsset) {
            // Get the asset info which should download iCloud images
            const assetInfo = await MediaLibrary.getAssetInfoAsync(targetAsset);
            const finalUri = assetInfo.localUri || assetInfo.uri || firstImageUri;
            
            const fileName = finalUri.split('/').pop() || 'image.jpg';
            const fileType = fileName.toLowerCase().includes('.heic') || fileName.toLowerCase().includes('.heif') 
              ? 'image/heic' 
              : fileName.includes('.') 
                ? `image/${fileName.split('.').pop()?.toLowerCase()}` 
                : 'image/jpeg';
            
            console.log('📸 [IMAGE] Processing image:', {
              originalUri: firstImageUri,
              finalUri,
              fileName,
              fileType,
              isICloud: firstImageUri.includes('PhotoData/Mutations')
            });
            
            statusData.image = {
              uri: finalUri,
              name: fileName,
              type: fileType
            };
          } else {
            // Fallback to direct URI
            const fileName = firstImageUri.split('/').pop() || 'image.jpg';
            const fileType = fileName.toLowerCase().includes('.heic') || fileName.toLowerCase().includes('.heif') 
              ? 'image/heic' 
              : 'image/jpeg';
            
            statusData.image = {
              uri: firstImageUri,
              name: fileName,
              type: fileType
            };
          }
        } catch (imageError) {
          console.error('📸 [ERROR] Image processing failed:', imageError);
          // Fallback to original approach
          const fileName = firstImageUri.split('/').pop() || 'image.jpg';
          const fileType = fileName.includes('.') ? `image/${fileName.split('.').pop()}` : 'image/jpeg';
          
          statusData.image = {
            uri: firstImageUri,
            name: fileName,
            type: fileType
          };
        }
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
    <View style={styles.textEditor}>
      {/* Top Toolbar */}
      <View style={styles.topToolbar}>
        {/* Background Color Dropdown */}
        <View style={styles.dropdownContainer}>
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={() => setShowBackgroundDropdown(!showBackgroundDropdown)}
          >
            <View style={[styles.colorPreview, { backgroundColor: selectedBackground.colors[0] }]} />
            <Ionicons name="chevron-down" size={16} color="#FFFFFF" />
          </TouchableOpacity>
          
          {showBackgroundDropdown && (
            <View style={styles.dropdown}>
              {TEXT_BACKGROUNDS.map((bg) => (
                <TouchableOpacity
                  key={bg.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedBackground(bg);
                    setShowBackgroundDropdown(false);
                  }}
                >
                  <View style={[styles.colorPreview, { backgroundColor: bg.colors[0] }]} />
                  <Text style={styles.dropdownText}>{bg.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Text Color Dropdown */}
        <View style={styles.dropdownContainer}>
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={() => setShowTextColorDropdown(!showTextColorDropdown)}
          >
            <View style={[styles.colorPreview, { backgroundColor: selectedTextColor }]} />
            <Text style={styles.dropdownButtonText}>Aa</Text>
            <Ionicons name="chevron-down" size={16} color="#FFFFFF" />
          </TouchableOpacity>
          
          {showTextColorDropdown && (
            <View style={styles.dropdown}>
              {TEXT_COLORS.map((textColor) => (
                <TouchableOpacity
                  key={textColor.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedTextColor(textColor.color);
                    setShowTextColorDropdown(false);
                  }}
                >
                  <View style={[styles.colorPreview, { backgroundColor: textColor.color }]} />
                  <Text style={styles.dropdownText}>{textColor.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Font Size Dropdown */}
        <View style={styles.dropdownContainer}>
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={() => setShowFontSizeDropdown(!showFontSizeDropdown)}
          >
            <Text style={styles.dropdownButtonText}>{selectedFontSize}</Text>
            <Ionicons name="chevron-down" size={16} color="#FFFFFF" />
          </TouchableOpacity>
          
          {showFontSizeDropdown && (
            <View style={styles.dropdown}>
              {FONT_SIZES.map((size) => (
                <TouchableOpacity
                  key={size}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedFontSize(size);
                    setShowFontSizeDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownText}>{size}px</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Share Button */}
        <TouchableOpacity 
          style={[styles.shareButton, { opacity: text.trim() ? 1 : 0.5 }]}
          onPress={handlePost}
          disabled={isLoading || !text.trim()}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.shareButtonText}>Share</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Text Input Area */}
      <View style={styles.textInputContainer}>
        <View
          style={[styles.textPreview, { backgroundColor: selectedBackground.colors[0] }]}
        >
          <TextInput
            style={[
              styles.textPreviewInput,
              { 
                color: selectedTextColor, 
                fontSize: selectedFontSize,
                fontFamily: Platform.OS === 'ios' ? selectedFontFamily : 'System',
                textAlign: textAlignment 
              }
            ]}
            value={text}
            onChangeText={setText}
            placeholder="Type your status..."
            placeholderTextColor={selectedTextColor === '#FFFFFF' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
            multiline
            maxLength={500}
            autoFocus
          />
        </View>
      </View>
    </View>
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
        style={[styles.postButton, { backgroundColor: canPost ? '#04a7c7' : '#333333' }]}
        onPress={handlePost}
        disabled={isLoading || !canPost}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={[styles.postButtonText, { opacity: canPost ? 1 : 0.5 }]}>
            Share
          </Text>
        )}
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
        {/* Clean Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Create Status</Text>
          
          <TouchableOpacity 
            style={styles.textToggle}
            onPress={() => setSelectedAction(selectedAction === 'text' ? null : 'text')}
          >
            <Ionicons 
              name="text" 
              size={24} 
              color={selectedAction === 'text' ? '#04a7c7' : '#FFFFFF'} 
            />
          </TouchableOpacity>
        </View>

        {/* Simple Navigation - only show when not in text mode */}
        {selectedAction !== 'text' && (
          <View style={styles.simpleNav}>
            {selectedAlbum ? (
              <TouchableOpacity 
                onPress={() => {
                  setSelectedAlbum(null);
                  setCurrentView('albums');
                }}
                style={styles.backNav}
              >
                <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
                <Text style={styles.backNavText}>Back to Albums</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.navOptions}>
                <TouchableOpacity 
                  style={[styles.navOption, currentView === 'photos' && styles.activeNavOption]}
                  onPress={() => {
                    setCurrentView('photos');
                    setSelectedAlbum(null);
                    loadMedia();
                  }}
                >
                  <Text style={[styles.navOptionText, currentView === 'photos' && styles.activeNavOptionText]}>
                    Recent
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.navOption, currentView === 'albums' && styles.activeNavOption]}
                  onPress={() => {
                    setCurrentView('albums');
                    setSelectedAlbum(null);
                    loadMedia();
                  }}
                >
                  <Text style={[styles.navOptionText, currentView === 'albums' && styles.activeNavOptionText]}>
                    Albums
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        
        {/* Content Area */}
        <View style={styles.content}>
          {renderContent()}
        </View>
        
        {/* Post Button - only for non-text content */}
        {selectedAction !== 'text' && (
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
        )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  textToggle: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  simpleNav: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  navOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
  },
  navOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  activeNavOption: {
    borderBottomWidth: 2,
    borderBottomColor: '#04a7c7',
  },
  navOptionText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '500',
  },
  activeNavOptionText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  backNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backNavText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
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
  },
  topToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1C1C1E',
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    gap: 6,
  },
  dropdownButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  colorPreview: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#666',
  },
  dropdown: {
    position: 'absolute',
    top: 40,
    left: 0,
    minWidth: 120,
    maxHeight: 200,
    zIndex: 2000,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
  },
  dropdownText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  shareButton: {
    backgroundColor: '#04a7c7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  textInputContainer: {
    flex: 1,
    padding: 20,
  },
  textPreview: {
    flex: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 300,
  },
  textPreviewInput: {
    width: '100%',
    textAlign: 'center',
    fontWeight: '500',
    minHeight: 200,
    textAlignVertical: 'center',
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
    padding: 20,
  },
  albumItem: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  albumPreview: {
    gap: 4,
  },
  albumTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  albumCount: {
    color: '#8E8E93',
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
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 12,
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