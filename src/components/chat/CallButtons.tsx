// src/components/chat/CallButtons.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CallButtonsProps {
  targetUserName?: string;
  onVoiceCall?: () => void;
  onVideoCall?: () => void;
  showLabels?: boolean;
  buttonSize?: number;
  iconSize?: number;
  backgroundColor?: string;
  iconColor?: string;
}

export const CallButtons: React.FC<CallButtonsProps> = ({
  targetUserName = 'User',
  onVoiceCall,
  onVideoCall,
  showLabels = false,
  buttonSize = 40,
  iconSize = 22,
  backgroundColor = 'rgba(255,255,255,0.2)',
  iconColor = '#ffffff'
}) => {
  const handleVoiceCall = () => {
    if (onVoiceCall) {
      onVoiceCall();
    } else {
      Alert.alert(
        'Voice Call',
        `Call ${targetUserName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Call', 
            onPress: () => {
              // Here you would integrate with a calling service like Twilio, Agora, etc.
              Alert.alert('Calling...', `Initiating voice call with ${targetUserName}`);
            }
          }
        ]
      );
    }
  };

  const handleVideoCall = () => {
    if (onVideoCall) {
      onVideoCall();
    } else {
      Alert.alert(
        'Video Call',
        `Video call ${targetUserName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Call', 
            onPress: () => {
              // Here you would integrate with a video calling service
              Alert.alert('Video Calling...', `Initiating video call with ${targetUserName}`);
            }
          }
        ]
      );
    }
  };

  const buttonStyle = {
    width: buttonSize,
    height: buttonSize,
    borderRadius: buttonSize / 2,
    backgroundColor,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  };

  return (
    <View style={[styles.container, showLabels && styles.containerColumn]}>
      <TouchableOpacity 
        style={[styles.callButton, buttonStyle]}
        onPress={handleVideoCall}
      >
        <Ionicons name="videocam" size={iconSize} color={iconColor} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.callButton, buttonStyle]}
        onPress={handleVoiceCall}
      >
        <Ionicons name="call" size={iconSize} color={iconColor} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
  },
  containerColumn: {
    flexDirection: 'column',
    gap: 12,
  },
  callButton: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});