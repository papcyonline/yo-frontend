import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getSystemFont } from '../../config/constants';
import { useTranslation } from '../../i18n/simpleI18n';

const { width, height } = Dimensions.get('window');

interface IncomingCallScreenProps {
  visible: boolean;
  caller: {
    id: string;
    name: string;
    profileImage?: string;
  };
  callType: 'voice' | 'video';
  onAccept: () => void;
  onDecline: () => void;
  callId: string;
}

export const IncomingCallScreen: React.FC<IncomingCallScreenProps> = ({
  visible,
  caller,
  callType,
  onAccept,
  onDecline,
  callId
}) => {
  const { t } = useTranslation();
  const [pulseAnim] = useState(new Animated.Value(1));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Pulse animation for the avatar
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => {
        pulseAnimation.stop();
      };
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const handleAccept = () => {
    console.log('📞 Accepting call:', callId);
    onAccept();
  };

  const handleDecline = () => {
    console.log('📞 Declining call:', callId);
    onDecline();
  };

  if (!visible) return null;

  const getCallerInitials = () => {
    return caller.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#000000" barStyle="light-content" />
      
      {/* Background */}
      <LinearGradient
        colors={['#000000', '#1a1a2e', '#16213e']}
        style={styles.background}
      />

      {/* Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.incomingText}>
            {callType === 'video' ? t('calls.incomingVideoCall') : t('calls.incomingVoiceCall')}
          </Text>
          <Text style={styles.callId}>ID: {callId.substring(0, 8)}...</Text>
        </View>

        {/* Caller Info */}
        <View style={styles.callerSection}>
          <Animated.View 
            style={[
              styles.avatarContainer,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            {caller.profileImage ? (
              <Image 
                source={{ uri: caller.profileImage }} 
                style={styles.avatar}
              />
            ) : (
              <LinearGradient
                colors={['#0091ad', '#04a7c7']}
                style={styles.avatarPlaceholder}
              >
                <Text style={styles.avatarText}>
                  {getCallerInitials()}
                </Text>
              </LinearGradient>
            )}
            
            {/* Pulse rings */}
            <View style={styles.pulseRing1} />
            <View style={styles.pulseRing2} />
          </Animated.View>

          <Text style={styles.callerName}>{caller.name}</Text>
          <Text style={styles.callerStatus}>
            {callType === 'video' ? t('calls.videoCall') : t('calls.voiceCall')}
          </Text>
        </View>

        {/* Call Actions */}
        <View style={styles.actionsContainer}>
          
          {/* Decline Button */}
          <TouchableOpacity
            style={styles.declineButton}
            onPress={handleDecline}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#ff4757', '#ff3838']}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="call" size={28} color="#ffffff" />
            </LinearGradient>
          </TouchableOpacity>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickActionButton}>
              <Ionicons name="chatbubble" size={24} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton}>
              <Ionicons name="notifications-off" size={24} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>

          {/* Accept Button */}
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={handleAccept}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#2ed573', '#1dd1a1']}
              style={styles.actionButtonGradient}
            >
              <Ionicons 
                name={callType === 'video' ? 'videocam' : 'call'} 
                size={28} 
                color="#ffffff" 
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Swipe indicators */}
        <View style={styles.swipeIndicators}>
          <View style={styles.swipeIndicator}>
            <Ionicons name="arrow-up" size={16} color="rgba(255,255,255,0.5)" />
            <Text style={styles.swipeText}>{t('calls.swipeToDecline')}</Text>
          </View>
          <View style={styles.swipeIndicator}>
            <Ionicons name="arrow-up" size={16} color="rgba(255,255,255,0.5)" />
            <Text style={styles.swipeText}>{t('calls.swipeToAccept')}</Text>
          </View>
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
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  incomingText: {
    fontSize: 16,
    fontFamily: getSystemFont('medium'),
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  callId: {
    fontSize: 12,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.5)',
  },
  callerSection: {
    alignItems: 'center',
    marginTop: -50,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 30,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarText: {
    fontSize: 48,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
  },
  pulseRing1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: 'rgba(0,145,173,0.3)',
    top: -15,
    left: -15,
  },
  pulseRing2: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 1,
    borderColor: 'rgba(0,145,173,0.2)',
    top: -30,
    left: -30,
  },
  callerName: {
    fontSize: 28,
    fontFamily: getSystemFont('bold'),
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  callerStatus: {
    fontSize: 16,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  declineButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    transform: [{ rotate: '135deg' }],
  },
  acceptButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  actionButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  quickActions: {
    flexDirection: 'column',
    gap: 20,
  },
  quickActionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  swipeIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
  },
  swipeIndicator: {
    alignItems: 'center',
  },
  swipeText: {
    fontSize: 12,
    fontFamily: getSystemFont('regular'),
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
});