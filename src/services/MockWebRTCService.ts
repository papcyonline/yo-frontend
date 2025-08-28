// Mock WebRTC Service for Expo Go compatibility
import logger from './LoggingService';
import { CallEventHandlers, CallState } from './WebRTCService';

class MockWebRTCService {
  private currentCallId: string | null = null;
  private isInitiator = false;
  private eventHandlers: CallEventHandlers = {};
  private mockLocalStream: any = null;
  private mockRemoteStream: any = null;

  constructor() {
    console.warn('🔧 Using Mock WebRTC Service - Native WebRTC not available in Expo Go');
  }

  setEventHandlers(handlers: CallEventHandlers) {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  // Mock local stream initialization
  private async initializeMockLocalStream(isVideo: boolean = false): Promise<any> {
    try {
      logger.info(`Mock: Initializing local stream with video: ${isVideo}`);
      
      // Create mock stream object
      this.mockLocalStream = {
        id: 'mock-local-stream',
        getAudioTracks: () => [{ enabled: true, _switchCamera: async () => {} }],
        getVideoTracks: () => isVideo ? [{ enabled: true }] : [],
        getTracks: () => [{ stop: () => {} }],
        toURL: () => 'mock://local-stream'
      };
      
      logger.info('Mock: Local stream initialized successfully');
      return this.mockLocalStream;
    } catch (error) {
      logger.error('Mock: Failed to initialize local stream', error);
      return null;
    }
  }

  // Start a voice call
  async startVoiceCall(targetUserId: string): Promise<boolean> {
    try {
      logger.info(`Mock: Starting voice call with user: ${targetUserId}`);

      // Simulate local stream initialization
      const localStream = await this.initializeMockLocalStream(false);
      if (!localStream) {
        return false;
      }

      // Simulate call creation on backend
      const callId = await this.createMockCall(targetUserId, false);
      if (!callId) {
        return false;
      }

      this.currentCallId = callId;
      this.isInitiator = true;

      // Simulate signaling
      await this.sendMockSignalingMessage({
        type: 'offer',
        callId,
        targetUserId,
        sdp: { type: 'offer', sdp: 'mock-offer-sdp' },
        callType: 'voice'
      });

      this.eventHandlers.onCallStarted?.(callId);
      logger.info(`Mock: Voice call started with ID: ${callId}`);
      
      // Navigate to call screen immediately
      this.navigateToCallScreen(targetUserId, false);
      
      // Simulate connection after delay
      setTimeout(() => {
        this.simulateRemoteStream(false);
      }, 1000);

      return true;
    } catch (error) {
      logger.error('Mock: Failed to start voice call', error);
      this.eventHandlers.onError?.('Failed to start voice call');
      return false;
    }
  }

  // Start a video call
  async startVideoCall(targetUserId: string): Promise<boolean> {
    try {
      logger.info(`Mock: Starting video call with user: ${targetUserId}`);

      // Simulate local video stream initialization
      const localStream = await this.initializeMockLocalStream(true);
      if (!localStream) {
        return false;
      }

      // Simulate call creation on backend
      const callId = await this.createMockCall(targetUserId, true);
      if (!callId) {
        return false;
      }

      this.currentCallId = callId;
      this.isInitiator = true;

      // Simulate signaling
      await this.sendMockSignalingMessage({
        type: 'offer',
        callId,
        targetUserId,
        sdp: { type: 'offer', sdp: 'mock-video-offer-sdp' },
        callType: 'video'
      });

      this.eventHandlers.onCallStarted?.(callId);
      logger.info(`Mock: Video call started with ID: ${callId}`);
      
      // Navigate to call screen immediately
      this.navigateToCallScreen(targetUserId, true);
      
      // Simulate connection after delay
      setTimeout(() => {
        this.simulateRemoteStream(true);
      }, 1000);

      return true;
    } catch (error) {
      logger.error('Mock: Failed to start video call', error);
      this.eventHandlers.onError?.('Failed to start video call');
      return false;
    }
  }

  // Answer incoming call
  async answerCall(callId: string, isVideo: boolean = false): Promise<boolean> {
    try {
      logger.info(`Mock: Answering call: ${callId}`);

      // Simulate local stream initialization
      const localStream = await this.initializeMockLocalStream(isVideo);
      if (!localStream) {
        return false;
      }

      this.currentCallId = callId;
      this.isInitiator = false;

      // Simulate accepting call on backend
      await this.acceptMockCall(callId);

      this.eventHandlers.onCallStarted?.(callId);
      logger.info(`Mock: Call answered: ${callId}`);
      
      // Simulate remote stream after delay
      setTimeout(() => {
        this.simulateRemoteStream(isVideo);
      }, 1000);

      return true;
    } catch (error) {
      logger.error('Mock: Failed to answer call', error);
      this.eventHandlers.onError?.('Failed to answer call');
      return false;
    }
  }

  // Handle incoming offer (mock)
  async handleOffer(offer: any, callId: string): Promise<void> {
    try {
      logger.debug('Mock: Handling offer for call:', callId);
      
      // Simulate answer
      setTimeout(() => {
        this.sendMockSignalingMessage({
          type: 'answer',
          callId,
          sdp: { type: 'answer', sdp: 'mock-answer-sdp' }
        });
      }, 500);
    } catch (error) {
      logger.error('Mock: Failed to handle offer', error);
    }
  }

  // Handle incoming answer (mock)
  async handleAnswer(answer: any): Promise<void> {
    try {
      logger.debug('Mock: Handling answer');
      // Simulate successful connection
    } catch (error) {
      logger.error('Mock: Failed to handle answer', error);
    }
  }

  // Handle ICE candidate (mock)
  async handleIceCandidate(candidate: any): Promise<void> {
    try {
      logger.debug('Mock: Handling ICE candidate');
      // Mock ICE candidate handling
    } catch (error) {
      logger.error('Mock: Failed to handle ICE candidate', error);
    }
  }

  // End current call
  async endCall(): Promise<void> {
    try {
      logger.info('Mock: Ending current call');

      if (this.currentCallId) {
        await this.endMockCallOnBackend(this.currentCallId);
      }

      await this.cleanup();
      this.eventHandlers.onCallEnded?.();
    } catch (error) {
      logger.error('Mock: Error ending call', error);
    }
  }

  // Toggle mute
  toggleMute(): boolean {
    if (!this.mockLocalStream) return false;

    const audioTrack = this.mockLocalStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      logger.debug(`Mock: Audio ${audioTrack.enabled ? 'unmuted' : 'muted'}`);
      return !audioTrack.enabled;
    }
    return false;
  }

  // Toggle video
  toggleVideo(): boolean {
    if (!this.mockLocalStream) return false;

    const videoTrack = this.mockLocalStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      logger.debug(`Mock: Video ${videoTrack.enabled ? 'enabled' : 'disabled'}`);
      return !videoTrack.enabled;
    }
    return false;
  }

  // Switch camera
  async switchCamera(): Promise<void> {
    try {
      logger.debug('Mock: Camera switched');
    } catch (error) {
      logger.error('Mock: Failed to switch camera', error);
    }
  }

  // Get current call state
  getCallState(): CallState {
    return {
      isActive: !!this.currentCallId,
      isVideo: !!this.mockLocalStream?.getVideoTracks().length,
      participants: this.currentCallId ? [this.currentCallId] : [],
      localStream: this.mockLocalStream || undefined,
      remoteStream: this.mockRemoteStream || undefined,
      callId: this.currentCallId || undefined,
      connectionState: this.mockRemoteStream ? 'connected' : 'new'
    };
  }

  // Cleanup resources
  private async cleanup(): Promise<void> {
    try {
      if (this.mockLocalStream) {
        this.mockLocalStream.getTracks().forEach((track: any) => track.stop());
        this.mockLocalStream = null;
      }

      if (this.mockRemoteStream) {
        this.mockRemoteStream = null;
      }

      this.currentCallId = null;
      this.isInitiator = false;

      logger.debug('Mock: Cleanup completed');
    } catch (error) {
      logger.error('Mock: Error during cleanup', error);
    }
  }

  // Simulate remote stream
  private navigateToCallScreen(targetUserId: string, isVideo: boolean) {
    try {
      logger.info('Mock: Triggering call UI display');
      // The call UI should show automatically when onCallStarted is triggered
      // Additional navigation logic can be added here if needed
    } catch (error) {
      logger.error('Mock: Failed to trigger call UI', error);
    }
  }

  private simulateRemoteStream(isVideo: boolean) {
    this.mockRemoteStream = {
      id: 'mock-remote-stream',
      getAudioTracks: () => [{ enabled: true }],
      getVideoTracks: () => isVideo ? [{ enabled: true }] : [],
      toURL: () => 'mock://remote-stream'
    };
    
    this.eventHandlers.onRemoteStreamReceived?.(this.mockRemoteStream);
    logger.info('Mock: Remote stream simulated');
  }

  // Mock backend calls
  private async createMockCall(targetUserId: string, isVideo: boolean): Promise<string | null> {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockCallId = `mock-call-${Date.now()}`;
      logger.info(`Mock: Call created with ID: ${mockCallId}`);
      return mockCallId;
    } catch (error) {
      logger.error('Mock: Failed to create call', error);
      return null;
    }
  }

  private async acceptMockCall(callId: string): Promise<boolean> {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      logger.info(`Mock: Call accepted: ${callId}`);
      return true;
    } catch (error) {
      logger.error('Mock: Failed to accept call', error);
      return false;
    }
  }

  private async endMockCallOnBackend(callId: string): Promise<void> {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      logger.info(`Mock: Call ended on backend: ${callId}`);
    } catch (error) {
      logger.error('Mock: Failed to end call on backend', error);
    }
  }

  private async sendMockSignalingMessage(message: any): Promise<void> {
    try {
      logger.debug('Mock: Sending signaling message:', message.type);
      
      // Import chatService dynamically
      const { chatService } = await import('./ChatService');
      
      // Actually send socket events for testing
      switch (message.type) {
        case 'offer':
          logger.debug('Mock: Sending call offer via socket');
          if (chatService.socket) {
            chatService.socket.emit('call_offer', {
              callId: message.callId,
              targetUserId: message.targetUserId,
              offer: message.sdp,
              callType: message.callType || 'voice'
            });
          }
          break;
          
        case 'answer':
          logger.debug('Mock: Sending call answer via socket');
          if (chatService.socket) {
            chatService.socket.emit('call_answer', {
              callId: message.callId,
              answer: message.sdp
            });
          }
          break;
          
        case 'ice-candidate':
          logger.debug('Mock: Sending ICE candidate via socket');
          if (chatService.socket) {
            chatService.socket.emit('ice_candidate', {
              callId: message.callId,
              candidate: message.candidate,
              targetUserId: message.targetUserId
            });
          }
          break;
          
        default:
          logger.warn('Mock: Unknown signaling message type:', message.type);
      }
    } catch (error) {
      logger.error('Mock: Failed to send signaling message', error);
    }
  }
}

export const mockWebRTCService = new MockWebRTCService();
export default mockWebRTCService;