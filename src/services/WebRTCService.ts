// WebRTC Service for voice and video calling
import { Platform } from 'react-native';
import { mediaDevices, RTCPeerConnection, RTCView, RTCSessionDescription, RTCIceCandidate } from 'react-native-webrtc';
import { API_CONFIG } from '../constants/api';
import logger from './LoggingService';
import { useAuthStore } from '../store/authStore';

export interface CallState {
  isActive: boolean;
  isVideo: boolean;
  participants: string[];
  localStream?: MediaStream;
  remoteStream?: MediaStream;
  callId?: string;
  connectionState: RTCPeerConnectionState;
}

export interface CallEventHandlers {
  onCallStarted?: (callId: string) => void;
  onCallEnded?: () => void;
  onRemoteStreamReceived?: (stream: MediaStream) => void;
  onError?: (error: string) => void;
  onParticipantJoined?: (userId: string) => void;
  onParticipantLeft?: (userId: string) => void;
}

class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private currentCallId: string | null = null;
  private isInitiator = false;
  private eventHandlers: CallEventHandlers = {};
  
  private readonly pcConfig = {
    iceServers: [
      // Primary STUN server
      {
        urls: 'stun:stun.l.google.com:19302'
      },
      // Twilio STUN servers
      {
        urls: 'stun:global.stun.twilio.com:3478'
      },
      // Twilio TURN servers (with credentials)
      {
        urls: [
          'turn:global.turn.twilio.com:3478?transport=udp',
          'turn:global.turn.twilio.com:3478?transport=tcp',
          'turn:global.turn.twilio.com:443?transport=tcp'
        ],
        username: process.env.EXPO_PUBLIC_TWILIO_TURN_USERNAME || '',
        credential: process.env.EXPO_PUBLIC_TWILIO_TURN_PASSWORD || ''
      }
    ],
    iceCandidatePoolSize: 10
  };

  constructor() {
    this.setupEventHandlers();
  }

  setEventHandlers(handlers: CallEventHandlers) {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  private setupEventHandlers() {
    // Set up WebSocket connection for signaling
    // This would typically connect to your socket server
    // Example implementation would go here
  }

  // Initialize local media stream
  private async initializeLocalStream(isVideo: boolean = false): Promise<MediaStream | null> {
    try {
      logger.debug(`Initializing local stream with video: ${isVideo}`);

      const streamConstraints = {
        audio: true,
        video: isVideo ? {
          mandatory: {
            minWidth: 640,
            minHeight: 480,
            minFrameRate: 30,
          },
          facingMode: 'user',
        } : false,
      };

      const stream = await mediaDevices.getUserMedia(streamConstraints);
      this.localStream = stream;
      
      logger.info('Local stream initialized successfully');
      return stream;
    } catch (error) {
      logger.error('Failed to initialize local stream', error);
      this.eventHandlers.onError?.('Failed to access camera/microphone');
      return null;
    }
  }

  // Create peer connection
  private async createPeerConnection(): Promise<RTCPeerConnection> {
    try {
      const pc = new RTCPeerConnection(this.pcConfig);
      
      // Set up event handlers
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          logger.debug('ICE candidate generated');
          this.sendSignalingMessage({
            type: 'ice-candidate',
            candidate: event.candidate,
            callId: this.currentCallId
          });
        }
      };

      pc.onconnectionstatechange = () => {
        logger.debug(`Connection state changed: ${pc.connectionState}`);
        if (pc.connectionState === 'connected') {
          logger.info('WebRTC connection established');
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          this.handleCallEnd();
        }
      };

      pc.onaddstream = (event) => {
        logger.info('Remote stream received');
        this.remoteStream = event.stream;
        this.eventHandlers.onRemoteStreamReceived?.(event.stream);
      };

      // Add local stream to peer connection
      if (this.localStream) {
        pc.addStream(this.localStream);
      }

      this.peerConnection = pc;
      return pc;
    } catch (error) {
      logger.error('Failed to create peer connection', error);
      throw new Error('Failed to create WebRTC connection');
    }
  }

  // Start a voice call
  async startVoiceCall(targetUserId: string): Promise<boolean> {
    try {
      logger.info(`Starting voice call with user: ${targetUserId}`);

      // Initialize local audio stream
      const localStream = await this.initializeLocalStream(false);
      if (!localStream) {
        return false;
      }

      // Create peer connection
      await this.createPeerConnection();

      // Create call on backend
      const callId = await this.createCall(targetUserId, false);
      if (!callId) {
        await this.cleanup();
        return false;
      }

      this.currentCallId = callId;
      this.isInitiator = true;

      // Create and send offer
      const offer = await this.peerConnection!.createOffer();
      await this.peerConnection!.setLocalDescription(offer);
      
      await this.sendSignalingMessage({
        type: 'offer',
        sdp: offer,
        callId,
        targetUserId
      });

      this.eventHandlers.onCallStarted?.(callId);
      logger.info(`Voice call started with ID: ${callId}`);
      return true;

    } catch (error) {
      logger.error('Failed to start voice call', error);
      await this.cleanup();
      this.eventHandlers.onError?.('Failed to start voice call');
      return false;
    }
  }

  // Start a video call
  async startVideoCall(targetUserId: string): Promise<boolean> {
    try {
      logger.info(`Starting video call with user: ${targetUserId}`);

      // Initialize local video stream
      const localStream = await this.initializeLocalStream(true);
      if (!localStream) {
        return false;
      }

      // Create peer connection
      await this.createPeerConnection();

      // Create call on backend
      const callId = await this.createCall(targetUserId, true);
      if (!callId) {
        await this.cleanup();
        return false;
      }

      this.currentCallId = callId;
      this.isInitiator = true;

      // Create and send offer
      const offer = await this.peerConnection!.createOffer();
      await this.peerConnection!.setLocalDescription(offer);
      
      await this.sendSignalingMessage({
        type: 'offer',
        sdp: offer,
        callId,
        targetUserId
      });

      this.eventHandlers.onCallStarted?.(callId);
      logger.info(`Video call started with ID: ${callId}`);
      return true;

    } catch (error) {
      logger.error('Failed to start video call', error);
      await this.cleanup();
      this.eventHandlers.onError?.('Failed to start video call');
      return false;
    }
  }

  // Answer incoming call
  async answerCall(callId: string, isVideo: boolean = false): Promise<boolean> {
    try {
      logger.info(`Answering call: ${callId}`);

      // Initialize local stream
      const localStream = await this.initializeLocalStream(isVideo);
      if (!localStream) {
        return false;
      }

      // Create peer connection
      await this.createPeerConnection();

      this.currentCallId = callId;
      this.isInitiator = false;

      // Accept call on backend
      await this.acceptCall(callId);

      this.eventHandlers.onCallStarted?.(callId);
      logger.info(`Call answered: ${callId}`);
      return true;

    } catch (error) {
      logger.error('Failed to answer call', error);
      await this.cleanup();
      this.eventHandlers.onError?.('Failed to answer call');
      return false;
    }
  }

  // Handle incoming offer
  async handleOffer(offer: RTCSessionDescriptionInit, callId: string): Promise<void> {
    try {
      if (!this.peerConnection) {
        await this.createPeerConnection();
      }

      await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(offer));
      
      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);

      await this.sendSignalingMessage({
        type: 'answer',
        sdp: answer,
        callId
      });

      logger.debug('Offer handled and answer sent');
    } catch (error) {
      logger.error('Failed to handle offer', error);
      this.eventHandlers.onError?.('Call connection failed');
    }
  }

  // Handle incoming answer
  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    try {
      if (!this.peerConnection) {
        throw new Error('No peer connection available');
      }

      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      logger.debug('Answer handled successfully');
    } catch (error) {
      logger.error('Failed to handle answer', error);
      this.eventHandlers.onError?.('Call connection failed');
    }
  }

  // Handle ICE candidate
  async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    try {
      if (!this.peerConnection) {
        throw new Error('No peer connection available');
      }

      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      logger.debug('ICE candidate added');
    } catch (error) {
      logger.error('Failed to handle ICE candidate', error);
    }
  }

  // End current call
  async endCall(): Promise<void> {
    try {
      logger.info('Ending current call');

      if (this.currentCallId) {
        await this.endCallOnBackend(this.currentCallId);
      }

      await this.cleanup();
      this.eventHandlers.onCallEnded?.();
    } catch (error) {
      logger.error('Error ending call', error);
    }
  }

  // Toggle mute
  toggleMute(): boolean {
    if (!this.localStream) return false;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      logger.debug(`Audio ${audioTrack.enabled ? 'unmuted' : 'muted'}`);
      return !audioTrack.enabled; // Return true if muted
    }
    return false;
  }

  // Toggle video (for video calls)
  toggleVideo(): boolean {
    if (!this.localStream) return false;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      logger.debug(`Video ${videoTrack.enabled ? 'enabled' : 'disabled'}`);
      return !videoTrack.enabled; // Return true if video is off
    }
    return false;
  }

  // Switch camera (front/back)
  async switchCamera(): Promise<void> {
    try {
      const videoTrack = this.localStream?.getVideoTracks()[0];
      if (videoTrack && videoTrack._switchCamera) {
        await videoTrack._switchCamera();
        logger.debug('Camera switched');
      }
    } catch (error) {
      logger.error('Failed to switch camera', error);
    }
  }

  // Get current call state
  getCallState(): CallState {
    return {
      isActive: !!this.currentCallId,
      isVideo: !!this.localStream?.getVideoTracks().length,
      participants: this.currentCallId ? [this.currentCallId] : [],
      localStream: this.localStream || undefined,
      remoteStream: this.remoteStream || undefined,
      callId: this.currentCallId || undefined,
      connectionState: this.peerConnection?.connectionState || 'new'
    };
  }

  // Cleanup resources
  private async cleanup(): Promise<void> {
    try {
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
      }

      if (this.remoteStream) {
        this.remoteStream = null;
      }

      if (this.peerConnection) {
        this.peerConnection.close();
        this.peerConnection = null;
      }

      this.currentCallId = null;
      this.isInitiator = false;

      logger.debug('WebRTC cleanup completed');
    } catch (error) {
      logger.error('Error during cleanup', error);
    }
  }

  private handleCallEnd(): void {
    logger.info('Call ended by peer connection state change');
    this.cleanup();
    this.eventHandlers.onCallEnded?.();
  }

  // Backend API calls
  private async createCall(targetUserId: string, isVideo: boolean): Promise<string | null> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/calls/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${useAuthStore.getState().token}`
        },
        body: JSON.stringify({
          targetUserId,
          type: isVideo ? 'video' : 'voice'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      return result.success ? result.data.callId : null;
    } catch (error) {
      logger.error('Failed to create call on backend', error);
      return null;
    }
  }

  private async acceptCall(callId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/calls/${callId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${useAuthStore.getState().token}`
        }
      });

      return response.ok;
    } catch (error) {
      logger.error('Failed to accept call on backend', error);
      return false;
    }
  }

  private async endCallOnBackend(callId: string): Promise<void> {
    try {
      await fetch(`${API_CONFIG.BASE_URL}/calls/${callId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${useAuthStore.getState().token}`
        }
      });
    } catch (error) {
      logger.error('Failed to end call on backend', error);
    }
  }

  private async sendSignalingMessage(message: any): Promise<void> {
    try {
      logger.debug('Sending signaling message:', message.type);
      
      // Import chatService dynamically to avoid circular dependency
      const { chatService } = await import('./ChatService');
      
      switch (message.type) {
        case 'offer':
          chatService.socket?.emit('call_offer', {
            callId: message.callId,
            targetUserId: message.targetUserId,
            sdp: message.sdp,
            callType: this.localStream?.getVideoTracks().length ? 'video' : 'voice'
          });
          break;
          
        case 'answer':
          chatService.socket?.emit('call_answer', {
            callId: message.callId,
            sdp: message.sdp
          });
          break;
          
        case 'ice-candidate':
          chatService.socket?.emit('ice_candidate', {
            callId: message.callId,
            candidate: message.candidate
          });
          break;
          
        default:
          logger.warn('Unknown signaling message type:', message.type);
      }
    } catch (error) {
      logger.error('Failed to send signaling message', error);
    }
  }
}

export const webRTCService = new WebRTCService();
export default webRTCService;