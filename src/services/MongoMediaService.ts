// src/services/MongoMediaService.ts - Media handling for MongoDB chat backend
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../config/constants';
import { useAuthStore } from '../store/authStore';

export interface MediaUploadResult {
  success: boolean;
  url?: string;
  type: 'image' | 'voice' | 'video';
  filename?: string;
  messageId?: string;
  error?: string;
}

export interface VoiceRecording {
  uri: string;
  duration: number;
  recording: Audio.Recording;
}

export class MongoMediaService {
  private static currentRecording: Audio.Recording | null = null;
  
  private static getAuthHeaders() {
    const { token } = useAuthStore.getState();
    return {
      'Authorization': `Bearer ${token}`
    };
  }

  // Permission handling
  static async requestCameraPermissions(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('❌ Error requesting camera permissions:', error);
      return false;
    }
  }

  static async requestMediaLibraryPermissions(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('❌ Error requesting media library permissions:', error);
      return false;
    }
  }

  static async requestMicrophonePermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('❌ Error requesting microphone permissions:', error);
      return false;
    }
  }

  // Image handling
  static async pickImageFromCamera(): Promise<ImagePicker.ImagePickerResult | null> {
    try {
      const hasPermission = await this.requestCameraPermissions();
      if (!hasPermission) {
        console.warn('⚠️ Camera permission denied');
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      console.log('📸 Camera result:', result);
      return result;
    } catch (error) {
      console.error('❌ Error picking image from camera:', error);
      return null;
    }
  }

  static async pickImageFromLibrary(): Promise<ImagePicker.ImagePickerResult | null> {
    try {
      const hasPermission = await this.requestMediaLibraryPermissions();
      if (!hasPermission) {
        console.warn('⚠️ Media library permission denied');
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      console.log('🖼️ Gallery result:', result);
      return result;
    } catch (error) {
      console.error('❌ Error picking image from library:', error);
      return null;
    }
  }

  // Voice recording
  static async startVoiceRecording(): Promise<boolean> {
    try {
      console.log('🎤 Starting voice recording...');
      
      const hasPermission = await this.requestMicrophonePermissions();
      if (!hasPermission) {
        console.warn('⚠️ Microphone permission denied');
        return false;
      }

      // Set audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create recording
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      
      this.currentRecording = recording;
      console.log('✅ Voice recording started');
      return true;
    } catch (error) {
      console.error('❌ Error starting voice recording:', error);
      return false;
    }
  }

  static async stopVoiceRecording(): Promise<VoiceRecording | null> {
    try {
      if (!this.currentRecording) {
        console.warn('⚠️ No active recording to stop');
        return null;
      }

      console.log('🛑 Stopping voice recording...');
      
      await this.currentRecording.stopAndUnloadAsync();
      const uri = this.currentRecording.getURI();
      const status = await this.currentRecording.getStatusAsync();
      
      if (!uri) {
        console.error('❌ No URI from recording');
        return null;
      }

      const result: VoiceRecording = {
        uri,
        duration: status.durationMillis || 0,
        recording: this.currentRecording
      };

      this.currentRecording = null;
      console.log('✅ Voice recording stopped:', result);
      return result;
    } catch (error) {
      console.error('❌ Error stopping voice recording:', error);
      this.currentRecording = null;
      return null;
    }
  }

  static async cancelVoiceRecording(): Promise<void> {
    try {
      if (this.currentRecording) {
        await this.currentRecording.stopAndUnloadAsync();
        this.currentRecording = null;
        console.log('❌ Voice recording cancelled');
      }
    } catch (error) {
      console.error('❌ Error cancelling voice recording:', error);
    }
  }

  static isRecording(): boolean {
    return this.currentRecording !== null;
  }

  // Send image message
  static async sendImageMessage(chatId: string, imageUri: string): Promise<MediaUploadResult> {
    try {
      console.log('📤 Sending image message to chat:', chatId);

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        return { success: false, type: 'image', error: 'File does not exist' };
      }

      // Create form data
      const formData = new FormData();
      
      const filename = `image_${Date.now()}.jpg`;
      formData.append('image', {
        uri: imageUri,
        name: filename,
        type: 'image/jpeg',
      } as any);

      // Send as message to the chat
      const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages/image`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Image message error:', response.status, errorText);
        return { success: false, type: 'image', error: `Upload failed: ${response.statusText}` };
      }

      const result = await response.json();
      console.log('✅ Image message sent:', result);
      
      return {
        success: true,
        type: 'image',
        url: result.data.message.mediaUrl,
        filename: result.data.message.mediaFilename,
        messageId: result.data.message.id
      };
    } catch (error) {
      console.error('❌ Error sending image message:', error);
      return { success: false, type: 'image', error: error.message };
    }
  }

  // Send voice message
  static async sendVoiceMessage(chatId: string, voiceUri: string, duration: number): Promise<MediaUploadResult> {
    try {
      console.log('📤 Sending voice message to chat:', chatId);

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(voiceUri);
      if (!fileInfo.exists) {
        return { success: false, type: 'voice', error: 'File does not exist' };
      }

      // Create form data
      const formData = new FormData();
      
      const filename = `voice_${Date.now()}.m4a`;
      formData.append('voice', {
        uri: voiceUri,
        name: filename,
        type: 'audio/m4a',
      } as any);
      
      formData.append('duration', duration.toString());

      // Send as message to the chat
      const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages/voice`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Voice message error:', response.status, errorText);
        return { success: false, type: 'voice', error: `Upload failed: ${response.statusText}` };
      }

      const result = await response.json();
      console.log('✅ Voice message sent:', result);
      
      return {
        success: true,
        type: 'voice',
        url: result.data.message.mediaUrl,
        filename: result.data.message.mediaFilename,
        messageId: result.data.message.id
      };
    } catch (error) {
      console.error('❌ Error sending voice message:', error);
      return { success: false, type: 'voice', error: error.message };
    }
  }

  // Audio playback
  static async playVoiceMessage(uri: string): Promise<boolean> {
    try {
      console.log('▶️ Playing voice message:', uri);
      
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );
      
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
      
      return true;
    } catch (error) {
      console.error('❌ Error playing voice message:', error);
      return false;
    }
  }

  // Video/Voice calls using WebRTC
  static async startVoiceCall(targetUserId: string): Promise<boolean> {
    try {
      console.log('📞 Starting voice call with:', targetUserId);
      const { webRTCService } = await import('./WebRTCService');
      return await webRTCService.startVoiceCall(targetUserId);
    } catch (error) {
      console.error('❌ Error starting voice call:', error);
      return false;
    }
  }

  static async startVideoCall(targetUserId: string): Promise<boolean> {
    try {
      console.log('📹 Starting video call with:', targetUserId);
      const { webRTCService } = await import('./WebRTCService');
      return await webRTCService.startVideoCall(targetUserId);
    } catch (error) {
      console.error('❌ Error starting video call:', error);
      return false;
    }
  }

  // Utility methods
  static formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `0:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  }
}