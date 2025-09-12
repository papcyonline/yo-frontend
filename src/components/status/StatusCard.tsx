import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Dimensions,
  Share,
  Modal
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { StatusAPI } from '../../services/api/status';

interface StatusCardProps {
  onStatusPress?: (status: any) => void;
  status: {
    _id: string;
    user_id: {
      _id: string;
      first_name: string;
      last_name: string;
      profile_photo_url?: string;
    };
    content: {
      text?: string;
      type: 'text' | 'image' | 'text_with_image';
      style?: {
        background_color?: string;
        font_size?: number;
        text_color?: string;
        font_family?: string;
        text_alignment?: string;
      };
    };
    media?: {
      image_url?: string;
      thumbnail_url?: string;
      image_width?: number;
      image_height?: number;
    };
    engagement: {
      likes: Array<{ user_id: string; created_at: string }>;
      comments: Array<{
        user_id: { 
          _id: string; 
          first_name: string; 
          last_name: string; 
          profile_photo_url?: string; 
        };
        comment: string;
        created_at: string;
      }>;
      views: number;
      shares: number;
    };
    visibility: string;
    location?: {
      name?: string;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
    };
    created_at: string;
    updated_at: string;
  };
  currentUserId?: string;
  onLike?: (statusId: string) => void;
  onComment?: (statusId: string) => void;
  onShare?: (status: any) => void;
  onUserPress?: (userId: string) => void;
  onDelete?: (statusId: string) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const imageWidth = screenWidth - 32; // Account for padding

const StatusCard: React.FC<StatusCardProps> = ({
  status,
  currentUserId,
  onLike,
  onComment,
  onShare,
  onUserPress,
  onDelete,
  onStatusPress
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLiked, setIsLiked] = useState(
    currentUserId ? status.engagement.likes.some(like => like.user_id === currentUserId) : false
  );
  const [likeCount, setLikeCount] = useState(status.engagement.likes.length);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showViewersModal, setShowViewersModal] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [viewers, setViewers] = useState([]);
  const [likers, setLikers] = useState(status.engagement.likes);
  
  // Check if this is user's own post - handle both _id and id fields
  const statusUserId = status.user_id._id || status.user_id.id;
  const isOwnPost = currentUserId && statusUserId && (currentUserId === statusUserId || currentUserId.toString() === statusUserId.toString());
  
  console.log('🔍 [StatusCard DEBUG] Checking ownership:', {
    currentUserId,
    statusUserId,
    isOwnPost,
    currentUserIdType: typeof currentUserId,
    statusUserIdType: typeof statusUserId,
    statusUserFullObject: status.user_id
  });

  // DEBUG: Log basic image info
  if (status.media?.image_url) {
    console.log('🖼️ [StatusCard] Status has image:', status.media.image_url.substring(0, 50) + '...');
  }

  // Helper function to validate and fix image URL
  const getValidImageUrl = (url: string | undefined) => {
    if (!url) return null;
    
    // Ensure it's a proper URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // If it's a relative Cloudinary path, make it absolute
    if (url.includes('cloudinary.com') && !url.startsWith('http')) {
      return `https://${url}`;
    }
    
    // If it starts with res.cloudinary.com but missing protocol
    if (url.startsWith('res.cloudinary.com')) {
      return `https://${url}`;
    }
    
    console.warn('🚨 [StatusCard] Invalid image URL format:', url);
    return url; // Return as-is and let it fail with error handling
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d`;
    
    return date.toLocaleDateString();
  };

  const handleLike = async () => {
    if (!onLike || !currentUserId) return;

    try {
      // Optimistic update
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
      
      await onLike(status._id);
    } catch (error) {
      // Revert on error
      setIsLiked(isLiked);
      setLikeCount(status.engagement.likes.length);
      console.error('Error liking status:', error);
    }
  };

  const handleShare = async () => {
    try {
      const shareContent = status.content.text || 'Check out this status!';
      const result = await Share.share({
        message: shareContent,
        title: `${status.user_id.first_name}'s Status`
      });

      if (result.action === Share.sharedAction && onShare) {
        onShare(status);
      }
    } catch (error) {
      console.error('Error sharing status:', error);
      Alert.alert('Error', 'Failed to share status');
    }
  };

  const handleDelete = () => {
    setShowOptionsModal(false);
    Alert.alert(
      'Delete Status',
      'Are you sure you want to delete this status? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (onDelete) {
              onDelete(status._id);
            }
          }
        }
      ]
    );
  };

  const handleOptionsPress = () => {
    if (isOwnPost) {
      setShowOptionsModal(true);
    }
  };

  const handleShowViewers = async () => {
    if (!isOwnPost) return;
    
    try {
      setShowViewersModal(true);
      const response = await StatusAPI.getViewers(status._id);
      
      if (response.success && response.data) {
        setViewers(response.data.viewers || []);
      }
    } catch (error) {
      console.error('Error loading viewers:', error);
      Alert.alert('Error', 'Failed to load viewers');
    }
  };

  const handleShowLikes = () => {
    if (!isOwnPost) return;
    setShowLikesModal(true);
  };

  const getImageDimensions = () => {
    if (!status.media?.image_width || !status.media?.image_height) {
      return { width: imageWidth, height: 300 };
    }

    const aspectRatio = status.media.image_width / status.media.image_height;
    const maxHeight = 400;
    const calculatedHeight = imageWidth / aspectRatio;
    
    return {
      width: imageWidth,
      height: Math.min(calculatedHeight, maxHeight)
    };
  };

  // Debug logging for content type
  console.log('🔍 [StatusCard DEBUG] Content type check:', {
    statusId: status._id.substring(0, 8),
    contentType: status.content.type,
    hasText: !!status.content.text,
    textLength: status.content.text?.length,
    text: status.content.text,
    styleData: status.content.style
  });

  // Additional debug for rendering path
  if (status.content.text && status.content.type === 'text') {
    console.log('🎨 [StatusCard] Will render TEXT ONLY with full screen background');
  } else if (status.content.text && status.content.type === 'text_with_image') {
    console.log('🖼️ [StatusCard] Will render TEXT WITH IMAGE');
  } else {
    console.log('❓ [StatusCard] Unknown rendering path:', { 
      hasText: !!status.content.text, 
      type: status.content.type 
    });
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.userInfo}
          onPress={() => onUserPress?.(status.user_id._id)}
        >
          {status.user_id.profile_photo_url ? (
            <Image 
              source={{ uri: status.user_id.profile_photo_url }} 
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {status.user_id.first_name.charAt(0)}{status.user_id.last_name.charAt(0)}
              </Text>
            </View>
          )}
          
          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {status.user_id.first_name} {status.user_id.last_name}
            </Text>
            <View style={styles.timeLocationRow}>
              <Text style={styles.timeAgo}>{formatTimeAgo(status.created_at)}</Text>
              {status.location?.name && (
                <>
                  <Text style={styles.dot}> • </Text>
                  <Ionicons name="location" size={12} color="#666" />
                  <Text style={styles.location}>{status.location.name}</Text>
                </>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {isOwnPost && (
          <TouchableOpacity style={styles.moreButton} onPress={handleOptionsPress}>
            <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <TouchableOpacity 
        style={[
          styles.content,
          status.content.type === 'text' && styles.textOnlyContent
        ]}
        activeOpacity={0.9}
        onPress={() => onStatusPress?.(status)}
      >
        {/* Text Content */}
        {status.content.text && status.content.type === 'text' && (
          <View style={[
            styles.textOnlyStatusContainer,
            { 
              backgroundColor: status.content.style?.background_color || '#04a7c7',
            }
          ]}>
            <Text style={[
              styles.textOnlyStatusText,
              {
                color: status.content.style?.text_color || '#FFFFFF',
                fontSize: status.content.style?.font_size || 24,
                fontFamily: status.content.style?.font_family || 'System',
                textAlign: status.content.style?.text_alignment || 'center'
              }
            ]}>
              {status.content.text}
            </Text>
          </View>
        )}

        {/* Text with Image Content */}
        {status.content.text && status.content.type === 'text_with_image' && (
          <View style={styles.textWithImageContainer}>
            <Text style={[
              styles.statusText,
              {
                color: status.content.style?.text_color || '#000000',
                fontSize: status.content.style?.font_size || 16,
                fontFamily: status.content.style?.font_family || 'System',
                textAlign: status.content.style?.text_alignment || 'left',
                marginBottom: 12
              }
            ]}>
              {status.content.text}
            </Text>
          </View>
        )}

        {/* Image Content */}
        {status.media?.image_url && (
          <View style={styles.imageContainer}>
            <LinearGradient
              colors={[
                COLORS.gradients.primary[0],   // Warm orange
                COLORS.gradients.secondary[0], // Deep blue
                COLORS.gradients.accent[0]     // Green
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientBackground}
            >
              <View style={styles.imageWrapper}>
                <Image
                  source={{ uri: getValidImageUrl(status.media.image_url) || status.media.image_url }}
                  style={[styles.statusImage, getImageDimensions()]}
                  contentFit="contain" // Changed from "cover" to show full image
                  onLoad={() => {
                    console.log('✅ [StatusCard] Image loaded successfully:', status.media.image_url);
                    setImageLoaded(true);
                    setImageError(false);
                  }}
                  onError={(error) => {
                    console.log('❌ [StatusCard] Image load error:', error, 'URL:', status.media.image_url);
                    setImageError(true);
                    setImageLoaded(false);
                  }}
                  onLoadStart={() => {
                    console.log('🔄 [StatusCard] Image load started:', status.media.image_url);
                    setImageLoaded(false);
                    setImageError(false);
                  }}
                  onLoadEnd={() => console.log('⏹️ [StatusCard] Image load ended:', status.media.image_url)}
                />
              </View>
            </LinearGradient>
            {/* Show overlay based on loading/error state */}
            {(!imageLoaded && !imageError) && (
              <View style={styles.imageLoadingOverlay}>
                <Text style={styles.imageLoadingText}>Loading image...</Text>
              </View>
            )}
            {imageError && (
              <View style={[styles.imageLoadingOverlay, styles.imageErrorOverlay]}>
                <Text style={styles.imageLoadingText}>Failed to load image</Text>
                <Text style={styles.imageUrlText} numberOfLines={2}>
                  {status.media.image_url}
                </Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>

      {/* Engagement Stats */}
      {(likeCount > 0 || status.engagement.comments.length > 0) && (
        <View style={styles.stats}>
          <View style={styles.leftStats}>
            {likeCount > 0 && (
              <TouchableOpacity style={styles.statItem}>
                <View style={styles.likeIcon}>
                  <Ionicons name="heart" size={12} color="#FFFFFF" />
                </View>
                <Text style={styles.statText}>{likeCount}</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.rightStats}>
            {status.engagement.comments.length > 0 && (
              <TouchableOpacity onPress={() => onComment?.(status._id)}>
                <Text style={styles.statText}>
                  {status.engagement.comments.length} comments
                </Text>
              </TouchableOpacity>
            )}
            {status.engagement.shares > 0 && (
              <Text style={styles.statText}>{status.engagement.shares} shares</Text>
            )}
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        {isOwnPost ? (
          // Actions for own posts
          <>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleShowViewers}
            >
              <Ionicons name="eye-outline" size={20} color="#666" />
              <Text style={styles.actionText}>
                {status.engagement.views || 0} views
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleShowLikes}
            >
              <Ionicons name="heart-outline" size={20} color="#666" />
              <Text style={styles.actionText}>
                {likeCount} likes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={20} color="#FF4444" />
              <Text style={[styles.actionText, { color: '#FF4444' }]}>Delete</Text>
            </TouchableOpacity>
          </>
        ) : (
          // Actions for others' posts
          <>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleLike}
            >
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={20} 
                color={isLiked ? "#FF4444" : "#666"} 
              />
              <Text style={[styles.actionText, isLiked && { color: '#FF4444' }]}>
                Like
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => onComment?.(status._id)}
            >
              <Ionicons name="chatbubble-outline" size={20} color="#666" />
              <Text style={styles.actionText}>Comment</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={20} color="#666" />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Recent Comments Preview */}
      {status.engagement.comments.length > 0 && (
        <View style={styles.commentsPreview}>
          {status.engagement.comments.slice(-2).map((comment, index) => (
            <View key={index} style={styles.commentItem}>
              <TouchableOpacity 
                onPress={() => onUserPress?.(comment.user_id._id)}
              >
                <Text style={styles.commentAuthor}>
                  {comment.user_id.first_name} {comment.user_id.last_name}
                </Text>
              </TouchableOpacity>
              <Text style={styles.commentText}>{comment.comment}</Text>
              <Text style={styles.commentTime}>
                {formatTimeAgo(comment.created_at)}
              </Text>
            </View>
          ))}
          
          {status.engagement.comments.length > 2 && (
            <TouchableOpacity onPress={() => onComment?.(status._id)}>
              <Text style={styles.viewMoreComments}>
                View all {status.engagement.comments.length} comments
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Options Modal */}
      <Modal
        visible={showOptionsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsModal(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={20} color="#FF4444" />
              <Text style={styles.deleteText}>Delete Status</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => setShowOptionsModal(false)}
            >
              <Ionicons name="close-outline" size={20} color="#666" />
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Viewers Modal */}
      <Modal
        visible={showViewersModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowViewersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.listModalContent}>
            <View style={styles.listModalHeader}>
              <Text style={styles.listModalTitle}>Viewers</Text>
              <TouchableOpacity onPress={() => setShowViewersModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <View style={styles.listContainer}>
              {viewers.length === 0 ? (
                <Text style={styles.emptyListText}>No viewers yet</Text>
              ) : (
                viewers.map((viewer: any, index: number) => (
                  <View key={index} style={styles.listItem}>
                    <View style={styles.viewerInfo}>
                      {viewer.user_id?.profile_photo_url ? (
                        <Image 
                          source={{ uri: viewer.user_id.profile_photo_url }} 
                          style={styles.viewerAvatar}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={[styles.viewerAvatar, styles.viewerAvatarPlaceholder]}>
                          <Text style={styles.viewerAvatarText}>
                            {viewer.user_id?.first_name?.[0]}{viewer.user_id?.last_name?.[0]}
                          </Text>
                        </View>
                      )}
                      <Text style={styles.listItemName}>
                        {viewer.user_id?.first_name} {viewer.user_id?.last_name}
                      </Text>
                    </View>
                    <Text style={styles.listItemTime}>
                      {formatTimeAgo(viewer.viewed_at)}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Likes Modal */}
      <Modal
        visible={showLikesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLikesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.listModalContent}>
            <View style={styles.listModalHeader}>
              <Text style={styles.listModalTitle}>Likes</Text>
              <TouchableOpacity onPress={() => setShowLikesModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <View style={styles.listContainer}>
              {likers.map((like, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.listItemName}>
                    {like.user_id?.first_name} {like.user_id?.last_name}
                  </Text>
                  <Text style={styles.listItemTime}>
                    {formatTimeAgo(like.created_at)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  timeLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  timeAgo: {
    fontSize: 12,
    color: '#666',
  },
  dot: {
    fontSize: 12,
    color: '#666',
  },
  location: {
    fontSize: 12,
    color: '#666',
    marginLeft: 2,
  },
  moreButton: {
    padding: 8,
  },
  content: {
    paddingHorizontal: 16,
  },
  textOnlyContent: {
    paddingHorizontal: 0, // Remove padding for text-only statuses
  },
  statusText: {
    fontSize: 16,
    color: '#000',
    lineHeight: 22,
    marginBottom: 12,
  },
  textOnlyStatusContainer: {
    width: screenWidth, // Full screen width
    marginLeft: -16, // Cancel out parent card padding (since content has paddingHorizontal: 0 for text-only)
    paddingHorizontal: 32,
    paddingVertical: 80,
    minHeight: 350, // Minimum height for full-screen effect
    justifyContent: 'center',
    alignItems: 'center',
  },
  textOnlyStatusText: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
    textAlign: 'center',
  },
  textWithImageContainer: {
    marginBottom: 8,
  },
  imageContainer: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  gradientBackground: {
    borderRadius: 16,
    padding: 8, // Add padding around the image
    minHeight: 300, // Ensure minimum height for the gradient
  },
  imageWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Subtle overlay
  },
  statusImage: {
    borderRadius: 12,
    backgroundColor: 'transparent', // Let gradient show through
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
  },
  leftStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  statText: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  commentsPreview: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  commentItem: {
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  commentText: {
    fontSize: 14,
    color: '#000',
    marginTop: 2,
  },
  commentTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  viewMoreComments: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  deleteText: {
    fontSize: 16,
    color: '#FF4444',
    marginLeft: 12,
    fontWeight: '500',
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
    fontWeight: '500',
  },
  listModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    width: '100%',
    marginTop: 'auto',
  },
  listModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  listModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  listContainer: {
    padding: 20,
    maxHeight: 400,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  listItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  listItemTime: {
    fontSize: 12,
    color: '#666',
  },
  emptyListText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 20,
  },
  viewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  viewerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  viewerAvatarPlaceholder: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  imageLoadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  imageErrorOverlay: {
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
  },
  imageUrlText: {
    color: '#FFFFFF',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default StatusCard;