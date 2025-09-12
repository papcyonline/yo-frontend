import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ImageBackground,
  Animated,
  PanResponder
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { StatusAPI } from '../../services/api/status';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface StatusViewModalProps {
  visible: boolean;
  status: any;
  userStatuses?: any[]; // All statuses from the same user
  currentStatusIndex?: number; // Index of current status in userStatuses
  onClose: () => void;
  currentUserId: string;
  onDelete: (statusId: string) => void;
  onStatusChange?: (newIndex: number) => void; // Callback when user navigates to different status
}

const StatusViewModal: React.FC<StatusViewModalProps> = ({
  visible,
  status,
  userStatuses = [],
  currentStatusIndex = 0,
  onClose,
  currentUserId,
  onDelete,
  onStatusChange
}) => {
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [liked, setLiked] = useState(false);
  const [viewers, setViewers] = useState<any[]>([]);
  const [showViewers, setShowViewers] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  
  const isOwn = status?.user_id?._id === currentUserId;
  const hasMultipleStatuses = userStatuses.length > 1;
  const hasNextStatus = currentStatusIndex < userStatuses.length - 1;
  const hasPreviousStatus = currentStatusIndex > 0;

  const handleNextStatus = () => {
    if (hasNextStatus && onStatusChange) {
      onStatusChange(currentStatusIndex + 1);
    }
  };

  const handlePreviousStatus = () => {
    if (hasPreviousStatus && onStatusChange) {
      onStatusChange(currentStatusIndex - 1);
    }
  };

  const getNextStatuses = () => {
    const nextStatuses = userStatuses.slice(currentStatusIndex + 1, currentStatusIndex + 4); // Show up to 3 next statuses
    console.log('📱 [StatusViewModal] Getting next statuses:', {
      totalStatuses: userStatuses.length,
      currentIndex: currentStatusIndex,
      nextStatusesCount: nextStatuses.length,
      hasMultipleStatuses
    });
    return nextStatuses;
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to upward swipes from the bottom area when it's own status
        return isOwn && evt.nativeEvent.pageY > SCREEN_HEIGHT * 0.8 && gestureState.dy < -10;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dy < 0) { // Only allow upward movement
          slideAnim.setValue(SCREEN_HEIGHT + gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy < -100) { // If swiped up enough, show viewers
          showViewersList();
        } else { // Otherwise, snap back
          hideViewersList();
        }
      },
    })
  ).current;

  const showViewersList = () => {
    setShowViewers(true);
    Animated.spring(slideAnim, {
      toValue: SCREEN_HEIGHT * 0.4, // Show 60% of screen
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  };

  const hideViewersList = () => {
    Animated.spring(slideAnim, {
      toValue: SCREEN_HEIGHT,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start(() => {
      setShowViewers(false);
    });
  };

  useEffect(() => {
    // Reset animation when modal closes
    if (!visible) {
      slideAnim.setValue(SCREEN_HEIGHT);
      setShowViewers(false);
    }
  }, [visible]);

  useEffect(() => {
    if (visible && !isPaused) {
      const timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            onClose();
            return 0;
          }
          return prev + 2;
        });
      }, 100);

      return () => clearInterval(timer);
    }
  }, [visible, isPaused, onClose]);

  useEffect(() => {
    if (visible) {
      console.log('📱 [StatusViewModal] Modal opened with:', {
        statusId: status._id,
        userStatusesLength: userStatuses.length,
        currentStatusIndex,
        hasMultipleStatuses
      });
      setProgress(0);
      setLiked(status.engagement.likes.some((like: any) => like.user_id === currentUserId));
      // Mark as viewed and load viewers if it's own status
      if (status.user_id._id !== currentUserId) {
        StatusAPI.recordView(status._id).catch(console.error);
      } else {
        // Load viewers for own status
        loadViewers();
      }
    }
  }, [visible, status, userStatuses, currentStatusIndex]);

  const loadViewers = async () => {
    try {
      const response = await StatusAPI.getViewers(status._id);
      if (response.success && response.data) {
        setViewers(response.data.viewers);
      }
    } catch (error) {
      console.error('Error loading viewers:', error);
    }
  };

  const handleLike = async () => {
    try {
      const response = await StatusAPI.likeStatus(status._id);
      setLiked(response.liked);
    } catch (error) {
      console.error('Error liking status:', error);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    
    try {
      await StatusAPI.addComment(status._id, replyText.trim());
      setReplyText('');
      setShowReply(false);
      Alert.alert('Success', 'Reply sent!');
    } catch (error) {
      console.error('Error sending reply:', error);
      Alert.alert('Error', 'Failed to send reply');
    }
  };

  const handleDeletePress = () => {
    Alert.alert(
      'Delete Status',
      'Are you sure you want to delete this status?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(status._id);
            onClose();
          }
        }
      ]
    );
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const hasImage = status.media?.image_url;

  const ContainerComponent = hasImage ? ImageBackground : View;
  const containerProps = hasImage ? {
    source: { uri: status.media.image_url },
    style: [styles.container, styles.backgroundImage],
    blurRadius: 20,
    imageStyle: styles.backgroundImageStyle
  } : {
    style: styles.container
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        activeOpacity={1}
        onPressIn={() => setIsPaused(true)}
        onPressOut={() => setIsPaused(false)}
        onPress={onClose}
        style={{ flex: 1 }}
        {...(isOwn ? panResponder.panHandlers : {})}
      >
        <ContainerComponent {...containerProps}>
          {hasImage && <View style={styles.overlay} />}
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>

        {/* Status Indicators for Multiple Statuses - Only show for other people's statuses */}
        {hasMultipleStatuses && !isOwn && (
          <View style={styles.statusIndicators}>
            {userStatuses.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.statusDot,
                  index === currentStatusIndex && styles.activeStatusDot
                ]}
              />
            ))}
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.userInfo}>
            {status.user_id.profile_photo_url ? (
              <Image 
                source={{ uri: status.user_id.profile_photo_url }} 
                style={styles.userAvatar}
              />
            ) : (
              <View style={[styles.userAvatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {status.user_id.first_name?.[0]}{status.user_id.last_name?.[0]}
                </Text>
              </View>
            )}
            <View style={styles.userDetails}>
              <Text style={styles.userName}>
                {status.user_id.first_name} {status.user_id.last_name}
              </Text>
              <Text style={styles.statusTime}>{formatTime(status.created_at)}</Text>
            </View>
          </View>

          {isOwn && (
            <TouchableOpacity onPress={handleDeletePress} style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {status.media?.image_url && (
            <Image 
              source={{ uri: status.media.image_url }} 
              style={styles.statusImage}
              resizeMode="contain"
            />
          )}
          
          {status.content.text && (
            <View style={[
              styles.textContainer,
              // For your own status, make it full screen. For others, keep card-like appearance
              isOwn ? {
                backgroundColor: status.content.style?.background_color || '#04a7c7',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: -1 // Put it behind other elements
              } : {
                backgroundColor: status.content.style?.background_color || '#04a7c7',
                borderRadius: 16,
                margin: 20,
                padding: 20
              }
            ]}>
              <ScrollView contentContainerStyle={isOwn ? { flex: 1, justifyContent: 'center' } : {}}>
                <Text style={[
                  styles.statusText,
                  {
                    color: status.content.style?.text_color || '#FFFFFF',
                    fontSize: isOwn ? (status.content.style?.font_size || 28) : (status.content.style?.font_size || 20), // Slightly larger font for own status
                    fontFamily: status.content.style?.font_family || 'System',
                    textAlign: status.content.style?.text_alignment || 'center',
                    paddingHorizontal: isOwn ? 40 : 0 // Add some horizontal padding for full screen
                  }
                ]}>
                  {status.content.text}
                </Text>
              </ScrollView>
            </View>
          )}
        </View>

        {/* Footer Actions */}
        {!isOwn && (
          <View style={styles.footer}>
            <TouchableOpacity 
              onPress={() => setShowReply(!showReply)}
              style={styles.footerButton}
            >
              <Ionicons name="chatbubble-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleLike}
              style={styles.footerButton}
            >
              <Ionicons 
                name={liked ? "heart" : "heart-outline"} 
                size={24} 
                color={liked ? "#FF4444" : "#FFFFFF"} 
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Reply Input */}
        {showReply && (
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.replyContainer}
          >
            <TextInput
              style={styles.replyInput}
              placeholder="Type a reply..."
              placeholderTextColor="#888"
              value={replyText}
              onChangeText={setReplyText}
              multiline
            />
            <TouchableOpacity onPress={handleReply} style={styles.sendButton}>
              <Ionicons name="send" size={20} color="#04a7c7" />
            </TouchableOpacity>
          </KeyboardAvoidingView>
        )}

        {/* Stats */}
        <View style={styles.stats}>
          {!isOwn && (
            <>
              <View style={styles.statItem}>
                <Ionicons name="eye-outline" size={16} color="#FFFFFF" />
                <Text style={styles.statText}>{status.engagement.views}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="heart-outline" size={16} color="#FFFFFF" />
                <Text style={styles.statText}>{status.engagement.likes.length}</Text>
              </View>
            </>
          )}
        </View>

        {/* Right Side Viewers Button for Own Status */}
        {isOwn && (
          <TouchableOpacity 
            style={styles.rightViewersButton}
            onPress={showViewersList}
          >
            <Ionicons name="eye-outline" size={18} color="#FFFFFF" />
            <Text style={styles.viewersCount}>{viewers.length}</Text>
          </TouchableOpacity>
        )}

        {/* Slide-up Viewers List */}
        {isOwn && (
          <Animated.View 
            style={[
              styles.slideUpViewersList,
              { transform: [{ translateY: slideAnim }] }
            ]}
          >
            <View style={styles.handleBar} />
            <View style={styles.viewersListContent}>
              <Text style={styles.viewersTitle}>Who viewed your status</Text>
              <ScrollView style={styles.viewersScroll}>
                {viewers.length > 0 ? (
                  viewers.map((viewer: any, index: number) => (
                    <View key={index} style={styles.viewerItem}>
                      {viewer.user_id?.profile_photo_url ? (
                        <Image 
                          source={{ uri: viewer.user_id.profile_photo_url }} 
                          style={styles.viewerAvatar}
                        />
                      ) : (
                        <View style={[styles.viewerAvatar, styles.avatarPlaceholder]}>
                          <Text style={styles.viewerAvatarText}>
                            {viewer.user_id?.first_name?.[0]}{viewer.user_id?.last_name?.[0]}
                          </Text>
                        </View>
                      )}
                      <Text style={styles.viewerName}>
                        {viewer.user_id?.first_name} {viewer.user_id?.last_name}
                      </Text>
                      <Text style={styles.viewerTime}>
                        {formatTime(viewer.viewed_at)}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noViewersText}>No views yet</Text>
                )}
              </ScrollView>
              
              <TouchableOpacity 
                style={styles.closeViewersButton}
                onPress={hideViewersList}
              >
                <Text style={styles.closeViewersText}>Close</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Multiple Status Previews - Only show for other people's statuses, not your own */}
        {hasMultipleStatuses && !isOwn && (
          <View style={styles.statusPreviewsContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.statusPreviewsContent}
            >
              {getNextStatuses().map((nextStatus, index) => (
                <TouchableOpacity
                  key={nextStatus._id}
                  style={styles.statusPreview}
                  onPress={() => handleNextStatus()}
                >
                  {nextStatus.media?.image_url ? (
                    <Image
                      source={{ uri: nextStatus.media.image_url }}
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.previewImage, styles.textPreview, { backgroundColor: nextStatus.content.style?.background_color || '#04a7c7' }]}>
                      <Text style={styles.previewText} numberOfLines={3}>
                        {nextStatus.content.text || 'Status'}
                      </Text>
                    </View>
                  )}
                  <View style={styles.previewOverlay}>
                    <Text style={styles.previewIndex}>
                      {currentStatusIndex + index + 2} / {userStatuses.length}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Navigation Buttons - Only show for other people's statuses, not your own */}
        {hasMultipleStatuses && !isOwn && hasNextStatus && (
          <TouchableOpacity 
            style={styles.nextButton}
            onPress={handleNextStatus}
          >
            <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        )}
        
        {hasMultipleStatuses && !isOwn && hasPreviousStatus && (
          <TouchableOpacity 
            style={styles.prevButton}
            onPress={handlePreviousStatus}
          >
            <Ionicons name="chevron-back" size={16} color="#FFFFFF" />
            <Text style={styles.prevButtonText}>Prev</Text>
          </TouchableOpacity>
        )}

        {/* Swipe Up Hint for Own Status */}
        {isOwn && !showViewers && (
          <View style={styles.swipeHint}>
            <Ionicons name="chevron-up" size={16} color="rgba(255, 255, 255, 0.6)" />
            <Text style={styles.swipeHintText}>Swipe up to see viewers</Text>
          </View>
        )}
        </ContainerComponent>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundImage: {
    flex: 1,
  },
  backgroundImageStyle: {
    opacity: 0.3,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  progressContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 10,
    right: 10,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    zIndex: 1000,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#04a7c7',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#0091ad',
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statusTime: {
    color: '#B0B0B0',
    fontSize: 12,
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  statusImage: {
    width: SCREEN_WIDTH - 32,
    height: SCREEN_HEIGHT * 0.6,
    borderRadius: 12,
  },
  textContainer: {
    maxHeight: SCREEN_HEIGHT * 0.5,
    paddingVertical: 20,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 220,
    right: 16,
    gap: 16,
  },
  footerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  replyContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  replyInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    padding: 8,
  },
  stats: {
    position: 'absolute',
    bottom: 70,
    left: 16,
    flexDirection: 'row',
    gap: 16,
  },
  rightViewersButton: {
    position: 'absolute',
    bottom: 70,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewersCount: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  slideUpViewersList: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SCREEN_HEIGHT * 0.6,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  viewersListContent: {
    flex: 1,
    padding: 20,
  },
  viewersTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  viewersScroll: {
    flex: 1,
    marginBottom: 20,
  },
  closeViewersButton: {
    backgroundColor: '#04a7c7',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
  },
  closeViewersText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  swipeHint: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 4,
  },
  swipeHintText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
  statusIndicators: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 70 : 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    zIndex: 999,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  activeStatusDot: {
    backgroundColor: '#04a7c7',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusPreviewsContainer: {
    position: 'absolute',
    bottom: 150,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  statusPreviewsContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  statusPreview: {
    width: 80,
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  textPreview: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  previewText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  previewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  previewIndex: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  nextButton: {
    position: 'absolute',
    right: 16,
    bottom: 170,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  prevButton: {
    position: 'absolute',
    left: 16,
    bottom: 170,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  prevButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  viewerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  viewerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  viewerAvatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  viewerName: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  viewerTime: {
    color: '#888',
    fontSize: 12,
  },
  noViewersText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
});

export default StatusViewModal;