import React, { useState, useEffect } from 'react';
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
  ScrollView
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { StatusAPI } from '../../services/api/status';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface StatusViewModalProps {
  visible: boolean;
  status: any;
  onClose: () => void;
  currentUserId: string;
  onDelete: (statusId: string) => void;
}

const StatusViewModal: React.FC<StatusViewModalProps> = ({
  visible,
  status,
  onClose,
  currentUserId,
  onDelete
}) => {
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [liked, setLiked] = useState(false);

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
      setProgress(0);
      setLiked(status.engagement.likes.some((like: any) => like.user_id === currentUserId));
      // Mark as viewed
      StatusAPI.getStatus(status._id).catch(console.error);
    }
  }, [visible, status]);

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

  const isOwn = status.user_id._id === currentUserId;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.container}
        activeOpacity={1}
        onPressIn={() => setIsPaused(true)}
        onPressOut={() => setIsPaused(false)}
        onPress={onClose}
      >
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>

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
            <View style={styles.textContainer}>
              <ScrollView>
                <Text style={styles.statusText}>{status.content.text}</Text>
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
          <View style={styles.statItem}>
            <Ionicons name="eye-outline" size={16} color="#FFFFFF" />
            <Text style={styles.statText}>{status.engagement.views}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="heart-outline" size={16} color="#FFFFFF" />
            <Text style={styles.statText}>{status.engagement.likes.length}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
    bottom: 100,
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
    bottom: 20,
    left: 16,
    flexDirection: 'row',
    gap: 16,
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
});

export default StatusViewModal;