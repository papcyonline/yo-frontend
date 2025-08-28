// src/hooks/useMediaPicker.ts
import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

interface MediaResult {
  uri: string;
  type: 'image' | 'video';
  size?: number;
  duration?: number;
}

export const useMediaPicker = () => {
  const [isLoading, setIsLoading] = useState(false);

  const validateFileSize = (fileSize: number | undefined, maxSize: number = 10 * 1024 * 1024): boolean => {
    if (!fileSize) return true; // Allow if size is unknown
    
    if (fileSize > maxSize) {
      Alert.alert('File Too Large', `Please select a file smaller than ${Math.round(maxSize / (1024 * 1024))}MB`);
      return false;
    }
    return true;
  };

  const validateVideoDuration = (duration: number | undefined, maxDuration: number = 60000): boolean => {
    if (!duration) return true; // Allow if duration is unknown
    
    if (duration > maxDuration) {
      Alert.alert('Video Too Long', `Please select a video shorter than ${Math.round(maxDuration / 1000)} seconds`);
      return false;
    }
    return true;
  };

  const pickImage = async (): Promise<MediaResult | null> => {
    try {
      setIsLoading(true);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        if (!validateFileSize(asset.fileSize)) {
          return null;
        }

        return {
          uri: asset.uri,
          type: 'image',
          size: asset.fileSize || 0
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const pickVideo = async (): Promise<MediaResult | null> => {
    try {
      setIsLoading(true);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        videoMaxDuration: 60, // 1 minute max
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        if (!validateFileSize(asset.fileSize)) {
          return null;
        }
        
        if (!validateVideoDuration(asset.duration ?? 0)) {
          return null;
        }

        return {
          uri: asset.uri,
          type: 'video',
          size: asset.fileSize || 0,
          duration: asset.duration ? Math.round(asset.duration / 1000) : 0
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to pick video');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const takePhoto = async (): Promise<MediaResult | null> => {
    try {
      setIsLoading(true);
      
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        return {
          uri: asset.uri,
          type: 'image',
          size: asset.fileSize || 0
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const recordVideo = async (): Promise<MediaResult | null> => {
    try {
      setIsLoading(true);
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        videoMaxDuration: 60, // 1 minute max
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        if (!validateFileSize(asset.fileSize)) {
          return null;
        }
        
        if (!validateVideoDuration(asset.duration ?? 0)) {
          return null;
        }

        return {
          uri: asset.uri,
          type: 'video',
          size: asset.fileSize || 0,
          duration: asset.duration ? Math.round(asset.duration / 1000) : 0
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error recording video:', error);
      Alert.alert('Error', 'Failed to record video');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return {
    isLoading,
    pickImage,
    pickVideo,
    takePhoto,
    recordVideo,
    formatFileSize,
  };
};