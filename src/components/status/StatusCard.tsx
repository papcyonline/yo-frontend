import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  Dimensions,
  Share
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StatusCardProps {
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
}

const { width: screenWidth } = Dimensions.get('window');
const imageWidth = screenWidth - 32; // Account for padding

const StatusCard: React.FC<StatusCardProps> = ({
  status,
  currentUserId,
  onLike,
  onComment,
  onShare,
  onUserPress
}) => {
  const [isLiked, setIsLiked] = useState(
    currentUserId ? status.engagement.likes.some(like => like.user_id === currentUserId) : false
  );
  const [likeCount, setLikeCount] = useState(status.engagement.likes.length);

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

        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Text Content */}
        {status.content.text && (
          <Text style={styles.statusText}>{status.content.text}</Text>
        )}

        {/* Image Content */}
        {status.media?.image_url && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: status.media.image_url }}
              style={[styles.statusImage, getImageDimensions()]}
              resizeMode="cover"
            />
          </View>
        )}
      </View>

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
  statusText: {
    fontSize: 16,
    color: '#000',
    lineHeight: 22,
    marginBottom: 12,
  },
  imageContainer: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statusImage: {
    borderRadius: 12,
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
});

export default StatusCard;