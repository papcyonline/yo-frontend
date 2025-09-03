// services/aiVoiceService.ts
// Updated to use expo-audio for audio recording
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-audio';
import { API_CONFIG } from '../constants/api';
import logger from './LoggingService';

// Types
export interface ConversationState {
  step: number;
  extractedData: any;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
}

export interface VoiceResult {
  success: boolean;
  transcript?: string;
  aiResponse?: string;
  extractedData?: any;
  isComplete?: boolean;
  nextStep?: number;
  error?: string;
}

class AIVoiceService {
  private recording: any = null;
  private isRecording = false;
  public apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = API_CONFIG.BASE_URL; // Use centralized API configuration
  }

  async initializeConversation(): Promise<string> {
    try {
      // Set up audio permissions and mode
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Audio permission not granted');
      }
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Return initial greeting
      return "Hello! I'm your AI assistant here to help set up your family profile. I'll ask you some questions about yourself, your family, and your background. This will help us connect you with potential relatives and family members. Let's start with something simple - what's your full name?";
    } catch (error) {
      logger.error('Voice service initialization error', error);
      throw error;
    }
  }

  async startRecording(): Promise<boolean> {
    try {
      if (this.isRecording) {
        return false;
      }

      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        return false;
      }

      // Create recording instance with expo-audio
      const { recording } = await Audio.Recording.createAsync({
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
      
      this.recording = recording;
      this.isRecording = true;
      
      return true;
    } catch (error) {
      logger.error('Start recording error', error);
      return false;
    }
  }

  async stopRecording(): Promise<string | null> {
    try {
      if (!this.recording || !this.isRecording) {
        return null;
      }

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.isRecording = false;
      this.recording = null;

      return uri;
    } catch (error) {
      logger.error('Stop recording error', error);
      return null;
    }
  }

  async processVoiceInput(
    audioUri: string,
    conversationState: ConversationState,
    userToken: string
  ): Promise<VoiceResult> {
    try {
      // Step 1: Transcribe audio using your backend
      const transcript = await this.transcribeAudio(audioUri, userToken);
      
      if (!transcript) {
        return {
          success: false,
          error: "I couldn't hear you clearly. Could you please try again?"
        };
      }

      // Step 2: Process the transcript with AI
      const aiResult = await this.processWithAI(transcript, conversationState, userToken);
      
      return {
        success: true,
        transcript,
        ...aiResult
      };
    } catch (error) {
      logger.error('Voice processing error', error);
      return {
        success: false,
        error: "I had trouble processing your response. Please try again."
      };
    }
  }

  private async transcribeAudio(audioUri: string, userToken: string): Promise<string | null> {
    try {
      // Create form data for audio upload
      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);

      const response = await fetch(`${this.apiBaseUrl}/voice/transcribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        return result.transcript;
      } else {
        logger.error('Transcription failed', result.message);
        return null;
      }
    } catch (error) {
      logger.error('Transcription error', error);
      return null;
    }
  }

  private async processWithAI(
    transcript: string,
    conversationState: ConversationState,
    userToken: string
  ): Promise<Partial<VoiceResult>> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/voice/process-conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          transcript,
          conversationState,
          step: conversationState.step
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        return {
          aiResponse: result.aiResponse,
          extractedData: result.extractedData,
          isComplete: result.isComplete,
          nextStep: result.nextStep
        };
      } else {
        return {
          aiResponse: "I didn't quite understand that. Could you please rephrase?",
          nextStep: conversationState.step
        };
      }
    } catch (error) {
      logger.error('AI processing error', error);
      return {
        aiResponse: "Let me ask that again in a different way...",
        nextStep: conversationState.step
      };
    }
  }

  async saveProfileData(extractedData: any, userToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/users/profile/voice-complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          profileData: extractedData,
          completedViaVoice: true,
          profileCompleted: true
        }),
      });

      const result = await response.json();
      return response.ok && result.success;
    } catch (error) {
      logger.error('Save profile error', error);
      return false;
    }
  }

  cleanup() {
    if (this.recording && this.isRecording) {
      this.recording.stopAndUnloadAsync().catch((error: any) => logger.error('Cleanup error', error));
    }
    this.recording = null;
    this.isRecording = false;
  }
}

export const aiVoiceService = new AIVoiceService();