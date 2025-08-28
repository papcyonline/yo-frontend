import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RTCView } from './RTCViewSelector';
import { getSystemFont } from '../../config/constants';
import { useTranslation } from '../../i18n/simpleI18n';

const { width, height } = Dimensions.get('window');

interface ActiveCallScreenProps {
  visible: boolean;
  callState: {
    isVideo: boolean;
    isMuted: boolean;
    isVideoOff: boolean;
    callDuration: number;
    caller?: {
      id: string;
      name: string;
      profileImage?: string;
    };
    localStream?: MediaStream;
    remoteStream?: MediaStream;
    connectionState: string;
  };
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onSwitchCamera: () => void;
  formatCallDuration: (seconds: number) => string;
}

export const ActiveCallScreen: React.FC<ActiveCallScreenProps> = ({
  visible,
  callState,
  onEndCall,
  onToggleMute,
  onToggleVideo,
  onSwitchCamera,
  formatCallDuration
}) => {
  const { t } = useTranslation();
  const [fadeAnim] = useState(new Animated.Value(0));

  // Debug logging
  console.log('🎬 ActiveCallScreen render:', { 
    visible, 
    isInCall: callState?.isVideo
  });

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) {
    console.log('🎬 ActiveCallScreen: Not visible, returning null');
    return null;
  }
  
  console.log('🎬 ActiveCallScreen: Rendering call screen!');

  const isVideoCall = callState.isVideo;
  const hasRemoteVideo = isVideoCall && callState.remoteStream && !callState.isVideoOff;


  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#000000" barStyle="light-content" />
      
      {/* Background */}
      {!hasRemoteVideo && (
        <LinearGradient
          colors={['#000000', '#1a1a2e', '#16213e']}
          style={styles.background}
        />
      )}

      {/* Remote Video (Full Screen) */}
      {hasRemoteVideo && callState.remoteStream && (
        <RTCView
          streamURL={(callState.remoteStream as any).toURL ? (callState.remoteStream as any).toURL() : ''}
          style={styles.remoteVideo}
          objectFit="cover"
        />
      )}

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        
        {/* Header Info */}
        <View style={styles.header}>
          <View style={styles.connectionInfo}>
            <View style={[
              styles.connectionDot,
              { backgroundColor: callState.connectionState === 'connected' ? '#2ed573' : '#ff4757' }
            ]} />
            <Text style={styles.connectionText}>
              {callState.connectionState === 'connected' ? t('calls.connected') : t('calls.connecting')}
            </Text>
          </View>
          
          <Text style={styles.callerName}>
            {callState.caller?.name || t('calls.unknown')}
          </Text>
          
          <Text style={styles.callDuration}>
            {formatCallDuration(callState.callDuration)}
          </Text>
          
          <Text style={styles.callType}>
            {isVideoCall ? t('calls.videoCall') : t('calls.voiceCall')}
          </Text>
        </View>

        {/* Local Video (Picture-in-Picture for video calls) */}
        {isVideoCall && callState.localStream && (
          <View style={styles.localVideoContainer}>
            <RTCView
              streamURL={(callState.localStream as any).toURL ? (callState.localStream as any).toURL() : ''}
              style={styles.localVideo}
              objectFit="cover"
              mirror={true}
            />
            
            {/* Switch Camera Button */}
            <TouchableOpacity
              style={styles.switchCameraButton}
              onPress={onSwitchCamera}
              activeOpacity={0.8}
            >
              <Ionicons name="camera-reverse" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Call Controls */}
        <View style={styles.controlsContainer}>
          
          {/* Secondary Controls */}
          <View style={styles.secondaryControls}>
            
            {/* Mute Button */}
            <TouchableOpacity
              style={[
                styles.controlButton,
                callState.isMuted && styles.controlButtonActive
              ]}
              onPress={onToggleMute}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={callState.isMuted ? "mic-off" : "mic"} 
                size={24} 
                color={callState.isMuted ? "#ff4757" : "#ffffff"} 
              />
            </TouchableOpacity>

            {/* Video Toggle (only for video calls) */}
            {isVideoCall && (
              <TouchableOpacity
                style={[
                  styles.controlButton,
                  callState.isVideoOff && styles.controlButtonActive
                ]}
                onPress={onToggleVideo}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name={callState.isVideoOff ? "videocam-off" : "videocam"} 
                  size={24} 
                  color={callState.isVideoOff ? "#ff4757" : "#ffffff"} 
                />
              </TouchableOpacity>
            )}

            {/* Speaker Button */}
            <TouchableOpacity
              style={styles.controlButton}
              activeOpacity={0.8}
            >
              <Ionicons name="volume-high" size={24} color="#ffffff" />
            </TouchableOpacity>

            {/* Add Contact Button */}
            <TouchableOpacity
              style={styles.controlButton}
              activeOpacity={0.8}
            >
              <Ionicons name="person-add" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* End Call Button */}
          <TouchableOpacity
            style={styles.endCallButton}
            onPress={onEndCall}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#ff4757', '#ff3838']}
              style={styles.endCallGradient}
            >
              <Ionicons name="call" size={32} color="#ffffff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  remoteVideo: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
  },
  connectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connectionText: {
    fontSize: 14,
    fontFamily: getSystemFont('medium'),
    color: 'rgba(255,255,255,0.8)',
  },
  callerName: {
    fontSize: 24,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  callDuration: {
    fontSize: 18,
    fontFamily: getSystemFont('medium'),
    color: '#ffffff',
    marginBottom: 4,
  },
  callType: {
    fontSize: 14,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.7)',
  },
  localVideoContainer: {
    position: 'absolute',
    top: 100,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  localVideo: {
    width: '100%',
    height: '100%',
  },
  switchCameraButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsContainer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  secondaryControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
    gap: 20,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  controlButtonActive: {
    backgroundColor: 'rgba(255,71,87,0.3)',
    borderColor: '#ff4757',
  },
  endCallButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    transform: [{ rotate: '135deg' }],
  },
  endCallGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});