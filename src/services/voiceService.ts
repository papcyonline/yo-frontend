// src/services/voiceService.ts
import { Alert } from 'react-native';

interface VapiSession {
  sessionId: string;
  status: 'active' | 'inactive';
}

interface VoiceSessionConfig {
  userId: string;
  userName: string;
  questionContext: string;
  assistantPrompt: string;
}

interface ListeningConfig {
  onTranscription: (text: string) => void;
  onResponse: (response: string) => void;
  onError: (error: string) => void;
}

class VoiceService {
  private vapiApiKey: string;
  private currentSession: VapiSession | null = null;
  private isListening: boolean = false;
  private ws: WebSocket | null = null;

  constructor() {
    // Add your Vapi.ai API key here
    this.vapiApiKey = process.env.EXPO_PUBLIC_VAPI_API_KEY || 'YOUR_VAPI_API_KEY';
  }

  async createSession(config: VoiceSessionConfig): Promise<VapiSession> {
    try {
      const response = await fetch('https://api.vapi.ai/call', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.vapiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assistant: {
            model: {
              provider: 'openai',
              model: 'gpt-4',
              messages: [
                {
                  role: 'system',
                  content: config.assistantPrompt
                }
              ],
              maxTokens: 500,
              temperature: 0.7
            },
            voice: {
              provider: 'elevenlabs',
              voiceId: 'sarah', // Use a friendly female voice
              stability: 0.5,
              similarityBoost: 0.8,
              style: 0.0,
              useSpeakerBoost: true
            },
            firstMessage: `Hi ${config.userName}! I'm here to help you answer some questions about yourself and your family. ${config.questionContext}`,
            recordingEnabled: true,
            silenceTimeoutSeconds: 30,
            responseDelaySeconds: 1,
            llmRequestDelaySeconds: 0.1,
            numWordsToInterruptAssistant: 2,
            maxDurationSeconds: 1800, // 30 minutes max
            backgroundSound: 'none',
            backchannelingEnabled: false,
            backgroundDenoisingEnabled: true,
            modelOutputInMessagesEnabled: true
          },
          phoneNumberId: null, // Using web interface
          customer: {
            number: null, // Not using phone
            name: config.userName,
            email: null
          },
          assistantOverrides: {},
          squad: null
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create Vapi session: ${response.statusText}`);
      }

      const sessionData = await response.json();
      
      this.currentSession = {
        sessionId: sessionData.id,
        status: 'active'
      };

      // Initialize WebSocket connection for real-time communication
      await this.initializeWebSocket(sessionData.webSocketUrl);

      return this.currentSession;
    } catch (error) {
      console.error('Error creating Vapi session:', error);
      throw new Error('Failed to initialize voice assistant');
    }
  }

  private async initializeWebSocket(wsUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected to Vapi');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleWebSocketMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket connection closed');
          this.currentSession = null;
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  private handleWebSocketMessage(data: any) {
    switch (data.type) {
      case 'transcript':
        if (data.transcript && this.transcriptionCallback) {
          this.transcriptionCallback(data.transcript);
        }
        break;

      case 'assistant-response':
        if (data.message && this.responseCallback) {
          this.responseCallback(data.message);
        }
        break;

      case 'error':
        if (this.errorCallback) {
          this.errorCallback(data.error || 'Voice assistant error');
        }
        break;

      case 'call-ended':
        this.currentSession = null;
        this.isListening = false;
        break;
    }
  }

  private transcriptionCallback: ((text: string) => void) | null = null;
  private responseCallback: ((response: string) => void) | null = null;
  private errorCallback: ((error: string) => void) | null = null;

  async startListening(config: ListeningConfig): Promise<void> {
    if (!this.currentSession || this.isListening) {
      throw new Error('No active session or already listening');
    }

    this.transcriptionCallback = config.onTranscription;
    this.responseCallback = config.onResponse;
    this.errorCallback = config.onError;

    try {
      // Send start listening command via WebSocket
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'start-listening'
        }));
        this.isListening = true;
      } else {
        throw new Error('WebSocket not connected');
      }
    } catch (error) {
      console.error('Error starting to listen:', error);
      throw error;
    }
  }

  async stopListening(): Promise<string | null> {
    if (!this.isListening || !this.ws) {
      return null;
    }

    try {
      // Send stop listening command via WebSocket
      this.ws.send(JSON.stringify({
        type: 'stop-listening'
      }));

      this.isListening = false;
      
      // Return the final transcription (this would be handled in the WebSocket message)
      return new Promise((resolve) => {
        const originalCallback = this.transcriptionCallback;
        this.transcriptionCallback = (text) => {
          if (originalCallback) originalCallback(text);
          resolve(text);
        };
        
        // Timeout after 5 seconds
        setTimeout(() => resolve(null), 5000);
      });

    } catch (error) {
      console.error('Error stopping listening:', error);
      this.isListening = false;
      return null;
    }
  }

  async updateContext(config: Partial<VoiceSessionConfig>): Promise<void> {
    if (!this.currentSession || !this.ws) {
      throw new Error('No active session');
    }

    try {
      // Send context update via WebSocket
      this.ws.send(JSON.stringify({
        type: 'update-context',
        questionContext: config.questionContext,
        assistantPrompt: config.assistantPrompt
      }));
    } catch (error) {
      console.error('Error updating context:', error);
      throw error;
    }
  }

  async endSession(): Promise<void> {
    if (this.currentSession) {
      try {
        // End the Vapi call
        await fetch(`https://api.vapi.ai/call/${this.currentSession.sessionId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.vapiApiKey}`,
          },
        });
      } catch (error) {
        console.error('Error ending Vapi session:', error);
      }
    }

    // Close WebSocket
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.currentSession = null;
    this.isListening = false;
    this.transcriptionCallback = null;
    this.responseCallback = null;
    this.errorCallback = null;
  }

  isSessionActive(): boolean {
    return this.currentSession?.status === 'active';
  }

  isCurrentlyListening(): boolean {
    return this.isListening;
  }
}

export const voiceService = new VoiceService();