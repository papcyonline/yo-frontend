// src/hooks/useVoiceRecording.ts
// Updated to use expo-audio for voice recording
import { useState, useRef, useEffect } from 'react';
import { Alert, Platform, PermissionsAndroid, Animated } from 'react-native';
import * as Audio from 'expo-audio';
import logger from '../services/LoggingService';

export const useVoiceRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<any>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);
  
  // Animation refs
  const recordingAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isRecording) {
      startRecordingAnimation();
    } else {
      stopRecordingAnimation();
    }
  }, [isRecording]);

  const startRecordingAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(recordingAnim, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(recordingAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  };

  const stopRecordingAnimation = () => {
    recordingAnim.stopAnimation();
    waveAnim.stopAnimation();
    Animated.timing(recordingAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const requestMicrophonePermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'YoFam needs access to your microphone to record voice messages.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        const hasPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
        setPermissionGranted(hasPermission);
        return hasPermission;
      } catch (err) {
        logger.warn('Failed to request Android microphone permission', err);
        return false;
      }
    }
    
    // iOS permission handled by Audio.requestPermissionsAsync()
    try {
      const { status } = await Audio.requestPermissionsAsync();
      const hasPermission = status === 'granted';
      setPermissionGranted(hasPermission);
      return hasPermission;
    } catch (error) {
      logger.error('Failed to request microphone permission', error);
      return false;
    }
  };

  const startRecording = async (): Promise<boolean> => {
    try {
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required', 
          'Please grant microphone permission to record voice messages.'
        );
        return false;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync({
        isMeteringEnabled: true,
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.MAX,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm;codecs=opus',
          bitsPerSecond: 128000,
        },
      });
      
      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration timer
      const timer = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      newRecording.setOnRecordingStatusUpdate((status: Audio.RecordingStatus) => {
        if (!status.isRecording) {
          clearInterval(timer);
        }
      });

      return true;
    } catch (err) {
      logger.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording');
      return false;
    }
  };

  const stopRecording = async (): Promise<{ uri: string; duration: number } | null> => {
    if (!recording) return null;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (uri && recordingDuration > 0) {
        const result = {
          uri,
          duration: recordingDuration
        };
        
        setRecording(null);
        setRecordingDuration(0);
        return result;
      }
      
      setRecording(null);
      setRecordingDuration(0);
      return null;
    } catch (err) {
      logger.error('Failed to stop recording', err);
      Alert.alert('Error', 'Failed to stop recording');
      return null;
    }
  };

  const cancelRecording = async (): Promise<void> => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      setRecording(null);
      setRecordingDuration(0);
    } catch (err) {
      logger.error('Failed to cancel recording', err);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    isRecording,
    recordingDuration,
    permissionGranted,
    recordingAnim,
    waveAnim,
    startRecording,
    stopRecording,
    cancelRecording,
    formatDuration,
  };
};