import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface MockCallUIProps {
  visible: boolean;
  isVideo: boolean;
  caller?: {
    name: string;
    profileImage?: string;
  };
  onEndCall: () => void;
  callDuration: number;
}

export const MockCallUI: React.FC<MockCallUIProps> = ({
  visible,
  isVideo,
  caller,
  onEndCall,
  callDuration,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent
    >
      <LinearGradient
        colors={isVideo ? ['#1a1a1a', '#2a2a2a'] : ['#667eea', '#764ba2']}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.callStatus}>
            {isVideo ? 'Video Call' : 'Voice Call'} - Mock Mode
          </Text>
          <Text style={styles.duration}>{formatDuration(callDuration)}</Text>
        </View>

        <View style={styles.callerInfo}>
          {caller?.profileImage ? (
            <Image source={{ uri: caller.profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={60} color="#fff" />
            </View>
          )}
          <Text style={styles.callerName}>{caller?.name || 'Unknown'}</Text>
          <Text style={styles.mockNotice}>
            (Expo Go doesn't support real WebRTC)
          </Text>
        </View>

        {isVideo && (
          <View style={styles.videoContainer}>
            <View style={styles.mockVideo}>
              <Ionicons name="videocam-off" size={50} color="#fff" />
              <Text style={styles.mockVideoText}>Video unavailable in Expo Go</Text>
            </View>
          </View>
        )}

        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlButton, isMuted && styles.activeButton]}
            onPress={() => setIsMuted(!isMuted)}
          >
            <Ionicons
              name={isMuted ? 'mic-off' : 'mic'}
              size={24}
              color="#fff"
            />
          </TouchableOpacity>

          {isVideo && (
            <TouchableOpacity
              style={[styles.controlButton, isVideoOff && styles.activeButton]}
              onPress={() => setIsVideoOff(!isVideoOff)}
            >
              <Ionicons
                name={isVideoOff ? 'videocam-off' : 'videocam'}
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.controlButton, isSpeakerOn && styles.activeButton]}
            onPress={() => setIsSpeakerOn(!isSpeakerOn)}
          >
            <Ionicons
              name={isSpeakerOn ? 'volume-high' : 'volume-medium'}
              size={24}
              color="#fff"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.endCallButton]}
            onPress={onEndCall}
          >
            <Ionicons name="call" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
  },
  callStatus: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
  },
  duration: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 5,
  },
  callerInfo: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  callerName: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
  mockNotice: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.7,
    marginTop: 10,
  },
  videoContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    bottom: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mockVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mockVideoText: {
    color: '#fff',
    marginTop: 10,
    opacity: 0.7,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  activeButton: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  endCallButton: {
    backgroundColor: '#ff4444',
    transform: [{ rotate: '135deg' }],
  },
});