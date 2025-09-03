// src/services/MediaServiceExpress.ts
// Media service that works with Express.js backend
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { API_CONFIG } from '../constants/api';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = API_CONFIG.BASE_URL;

// Helper function to get auth headers
const getAuthHeaders = () => {
  const { token } = useAuthStore.getState();
  return {
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export interface MediaFile {
  id: string;
  uploader_id: string;
  filename: string;
  original_name: string;
  file_type: 'image' | 'audio' | 'video';
  mime_type: string;
  file_size: number;
  file_url: string;
  usage_context: string;
  reference_id?: string;
  is_active: boolean;
  is_processed: boolean;
  created_at: string;
  updated_at: string;
  duration?: number;
  dimensions?: { width: number; height: number };
}

export class MediaService {
  
  // File size limits (in bytes)
  private static readonly SIZE_LIMITS = {
    IMAGE: 10 * 1024 * 1024, // 10MB
    VIDEO: 10 * 1024 * 1024, // 10MB
    VOICE: 5 * 1024 * 1024,  // 5MB
    AVATAR: 2 * 1024 * 1024  // 2MB
  };

  // =============================================
  // IMAGE HANDLING
  // =============================================

  /**
   * Upload profile image (avatar)
   */
  static async uploadProfileImage(imageUri: string): Promise<MediaFile> {
    try {
      // Compress and resize image
      const processedImage = await this.processImage(imageUri, {
        width: 400,
        height: 400,
        quality: 0.8
      });

      return await this.uploadImageToExpress(
        processedImage.uri, 
        'profiles'
      );
    } catch (error) {
      console.error('Error uploading profile image:', error);
      throw error;
    }
  }

  /**
   * Upload message image
   */
  static async uploadImage(imageUri: string, conversationId?: string): Promise<MediaFile> {
    try {
      // Validate file size
      await this.validateFileSize(imageUri, this.SIZE_LIMITS.IMAGE);

      // Compress image
      const processedImage = await this.processImage(imageUri, {
        width: 1920,
        height: 1080,
        quality: 0.7
      });

      return await this.uploadImageToExpress(
        processedImage.uri, 
        'messages',
        conversationId
      );
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  /**
   * Upload image to Express backend
   */
  private static async uploadImageToExpress(
    imageUri: string, 
    folder: string = 'general',
    referenceId?: string
  ): Promise<MediaFile> {
    try {
      // Create FormData
      const formData = new FormData();
      
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!fileInfo.exists) throw new Error('File does not exist');

      // Create file blob
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Append to form data
      formData.append('image', blob, `image_${Date.now()}.jpg`);
      formData.append('folder', folder);
      
      if (referenceId) {
        formData.append('reference_id', referenceId);
      }

      // Upload to backend
      const uploadResponse = await fetch(`${API_BASE_URL}/media/upload/image`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });

      const result = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(result.message || 'Failed to upload image');
      }

      return result.data;
    } catch (error) {
      console.error('Error uploading image to Express:', error);
      throw error;
    }
  }

  /**
   * Process image (resize and compress)
   */
  private static async processImage(
    imageUri: string, 
    options: { width?: number; height?: number; quality?: number }
  ) {
    try {
      return await manipulateAsync(
        imageUri,
        [
          options.width && options.height 
            ? { resize: { width: options.width, height: options.height } }
            : {}
        ].filter(action => Object.keys(action).length > 0),
        {
          compress: options.quality || 0.7,
          format: SaveFormat.JPEG,
        }
      );
    } catch (error) {
      console.error('Error processing image:', error);
      throw error;
    }
  }

  // =============================================
  // AUDIO HANDLING
  // =============================================

  /**
   * Upload audio file
   */
  static async uploadAudio(audioUri: string, referenceId?: string): Promise<MediaFile> {
    try {
      // Validate file size
      await this.validateFileSize(audioUri, this.SIZE_LIMITS.VOICE);

      return await this.uploadAudioToExpress(audioUri, 'messages', referenceId);
    } catch (error) {
      console.error('Error uploading audio:', error);
      throw error;
    }
  }

  /**
   * Upload voice message
   */
  static async uploadVoiceMessage(audioUri: string, conversationId: string): Promise<MediaFile> {
    return await this.uploadAudio(audioUri, conversationId);
  }

  /**
   * Upload audio to Express backend
   */
  private static async uploadAudioToExpress(
    audioUri: string,
    folder: string = 'general', 
    referenceId?: string
  ): Promise<MediaFile> {
    try {
      // Create FormData
      const formData = new FormData();
      
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists) throw new Error('Audio file does not exist');

      // Create file blob
      const response = await fetch(audioUri);
      const blob = await response.blob();
      
      // Append to form data
      formData.append('audio', blob, `audio_${Date.now()}.m4a`);
      formData.append('folder', folder);
      
      if (referenceId) {
        formData.append('reference_id', referenceId);
      }

      // Upload to backend
      const uploadResponse = await fetch(`${API_BASE_URL}/media/upload/audio`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });

      const result = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(result.message || 'Failed to upload audio');
      }

      return result.data;
    } catch (error) {
      console.error('Error uploading audio to Express:', error);
      throw error;
    }
  }

  // =============================================
  // VIDEO HANDLING
  // =============================================

  /**
   * Upload video message
   */
  static async uploadVideo(videoUri: string, conversationId?: string): Promise<MediaFile> {
    try {
      // Validate file size
      await this.validateFileSize(videoUri, this.SIZE_LIMITS.VIDEO);

      return await this.uploadVideoToExpress(videoUri, 'messages', conversationId);
    } catch (error) {
      console.error('Error uploading video:', error);
      throw error;
    }
  }

  /**
   * Upload video to Express backend
   */
  private static async uploadVideoToExpress(
    videoUri: string,
    folder: string = 'general',
    referenceId?: string
  ): Promise<MediaFile> {
    try {
      // Create FormData
      const formData = new FormData();
      
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(videoUri);
      if (!fileInfo.exists) throw new Error('Video file does not exist');

      // Create file blob
      const response = await fetch(videoUri);
      const blob = await response.blob();
      
      // Append to form data
      formData.append('video', blob, `video_${Date.now()}.mp4`);
      formData.append('folder', folder);
      
      if (referenceId) {
        formData.append('reference_id', referenceId);
      }

      // Upload to backend
      const uploadResponse = await fetch(`${API_BASE_URL}/media/upload/video`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });

      const result = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(result.message || 'Failed to upload video');
      }

      return result.data;
    } catch (error) {
      console.error('Error uploading video to Express:', error);
      throw error;
    }
  }

  // =============================================
  // FILE MANAGEMENT
  // =============================================

  /**
   * Get user's media files
   */
  static async getUserMediaFiles(
    type?: 'image' | 'audio' | 'video', 
    context?: string, 
    limit: number = 50
  ): Promise<MediaFile[]> {
    try {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (context) params.append('context', context);
      if (limit) params.append('limit', limit.toString());

      const response = await fetch(`${API_BASE_URL}/media/files?${params.toString()}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch media files');
      }

      return result.data || [];
    } catch (error) {
      console.error('Error fetching user media files:', error);
      throw error;
    }
  }

  /**
   * Delete media file
   */
  static async deleteMediaFile(mediaFileId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/media/files/${mediaFileId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete media file');
      }
    } catch (error) {
      console.error('Error deleting media file:', error);
      throw error;
    }
  }

  /**
   * Get media file info
   */
  static async getMediaFileInfo(mediaFileId: string): Promise<MediaFile> {
    try {
      const response = await fetch(`${API_BASE_URL}/media/files/${mediaFileId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to get media file info');
      }

      return result.data;
    } catch (error) {
      console.error('Error getting media file info:', error);
      throw error;
    }
  }

  /**
   * Get file statistics
   */
  static async getFileStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    byType: { image: number; audio: number; video: number };
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/media/stats`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to get file statistics');
      }

      return result.data;
    } catch (error) {
      console.error('Error getting file statistics:', error);
      throw error;
    }
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  /**
   * Validate file size
   */
  private static async validateFileSize(fileUri: string, maxSize: number): Promise<void> {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) throw new Error('File does not exist');
    
    if (fileInfo.size && fileInfo.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      throw new Error(`File size exceeds ${maxSizeMB}MB limit`);
    }
  }

  /**
   * Get file size in human readable format
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Check if file is image
   */
  static isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  /**
   * Check if file is video
   */
  static isVideo(mimeType: string): boolean {
    return mimeType.startsWith('video/');
  }

  /**
   * Check if file is audio
   */
  static isAudio(mimeType: string): boolean {
    return mimeType.startsWith('audio/');
  }

  /**
   * Get full URL for media file
   */
  static getFullUrl(fileUrl: string): string {
    if (fileUrl.startsWith('http')) {
      return fileUrl;
    }
    return `${API_BASE_URL}${fileUrl}`;
  }
}