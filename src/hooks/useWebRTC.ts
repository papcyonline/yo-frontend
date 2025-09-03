import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { webRTCService } from '../services/WebRTCServiceSelector';
import { chatService } from '../services/ChatService';

export interface CallState {
  isInCall: boolean;
  isVideo: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  callId: string | null;
  caller: {
    id: string;
    name: string;
    profileImage?: string;
  } | null;
  connectionState: 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed';
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callDuration: number;
  isIncoming: boolean;
}

export const useWebRTC = () => {
  const { user } = useAuthStore();
  const [callState, setCallState] = useState<CallState>({
    isInCall: false,
    isVideo: false,
    isMuted: false,
    isVideoOff: false,
    callId: null,
    caller: null,
    connectionState: 'new',
    localStream: null,
    remoteStream: null,
    callDuration: 0,
    isIncoming: false,
  });

  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [incomingCall, setIncomingCall] = useState<{
    callId: string;
    caller: { id: string; name: string; profileImage?: string };
    callType: 'voice' | 'video';
  } | null>(null);

  useEffect(() => {
    // Set up WebRTC event handlers
    webRTCService.setEventHandlers({
      onCallStarted: (callId: string) => {
        setCallState(prev => ({
          ...prev,
          isInCall: true,
          callId,
          connectionState: 'connecting'
        }));
        startCallTimer();
      },
      onCallEnded: () => {
        setCallState(prev => ({
          ...prev,
          isInCall: false,
          callId: null,
          caller: null,
          connectionState: 'disconnected',
          localStream: null,
          remoteStream: null,
          callDuration: 0
        }));
        setIncomingCall(null);
        stopCallTimer();
      },
      onRemoteStreamReceived: (stream: MediaStream) => {
        setCallState(prev => ({
          ...prev,
          remoteStream: stream,
          connectionState: 'connected'
        }));
      },
      onError: (error: string) => {
        console.error('WebRTC Error:', error);
        setCallState(prev => ({
          ...prev,
          connectionState: 'failed'
        }));
      }
    });

    // Set up socket event listeners for incoming calls
    const handleIncomingCall = (data: any) => {
      console.log('📞 Incoming call received:', data);
      setIncomingCall({
        callId: data.callId,
        caller: {
          id: data.caller.id,
          name: data.caller.name,
          profileImage: data.caller.profileImage
        },
        callType: data.callType
      });
    };

    const handleCallAnswer = (data: any) => {
      console.log('📞 Call answered:', data);
      if (data.sdp) {
        webRTCService.handleAnswer(data.sdp);
      }
    };

    const handleCallOffer = (data: any) => {
      console.log('📞 Call offer received:', data);
      if (data.sdp) {
        webRTCService.handleOffer(data.sdp, data.callId);
      }
    };

    const handleIceCandidate = (data: any) => {
      console.log('📞 ICE candidate received:', data);
      if (data.candidate) {
        webRTCService.handleIceCandidate(data.candidate);
      }
    };

    const handleCallEnd = (data: any) => {
      console.log('📞 Call ended by peer:', data);
      webRTCService.endCall();
    };

    // Register socket event listeners
    chatService.socket?.on('incoming_call', handleIncomingCall);
    chatService.socket?.on('call_answer', handleCallAnswer);
    chatService.socket?.on('call_offer', handleCallOffer);
    chatService.socket?.on('ice_candidate', handleIceCandidate);
    chatService.socket?.on('call_end', handleCallEnd);

    return () => {
      // Clean up socket listeners
      chatService.socket?.off('incoming_call', handleIncomingCall);
      chatService.socket?.off('call_answer', handleCallAnswer);
      chatService.socket?.off('call_offer', handleCallOffer);
      chatService.socket?.off('ice_candidate', handleIceCandidate);
      chatService.socket?.off('call_end', handleCallEnd);
      stopCallTimer();
    };
  }, []);

  const startCallTimer = () => {
    callTimerRef.current = setInterval(() => {
      setCallState(prev => ({
        ...prev,
        callDuration: prev.callDuration + 1
      }));
    }, 1000);
  };

  const stopCallTimer = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  };

  const startVoiceCall = async (targetUserId: string) => {
    try {
      console.log('🎯 useWebRTC: Starting voice call with user:', targetUserId);
      const success = await webRTCService.startVoiceCall(targetUserId);
      console.log('🎯 useWebRTC: Voice call result:', success);
      
      if (success) {
        const state = webRTCService.getCallState();
        console.log('🎯 useWebRTC: Call state after start:', state);
        setCallState(prev => {
          const newState = {
            ...prev,
            isInCall: true,
            isVideo: false,
            callId: state.callId || null,
            localStream: state.localStream || null,
            isIncoming: false
          };
          console.log('🎯 useWebRTC: Setting call state:', newState);
          return newState;
        });
      }
      return success;
    } catch (error) {
      console.error('Failed to start voice call:', error);
      return false;
    }
  };

  const startVideoCall = async (targetUserId: string) => {
    try {
      console.log('🎯 useWebRTC: Starting video call with user:', targetUserId);
      const success = await webRTCService.startVideoCall(targetUserId);
      console.log('🎯 useWebRTC: Video call result:', success);
      
      if (success) {
        const state = webRTCService.getCallState();
        console.log('🎯 useWebRTC: Call state after start:', state);
        setCallState(prev => {
          const newState = {
            ...prev,
            isInCall: true,
            isVideo: true,
            callId: state.callId || null,
            localStream: state.localStream || null,
            isIncoming: false
          };
          console.log('🎯 useWebRTC: Setting call state:', newState);
          return newState;
        });
      }
      return success;
    } catch (error) {
      console.error('Failed to start video call:', error);
      return false;
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return false;

    try {
      const success = await webRTCService.answerCall(
        incomingCall.callId, 
        incomingCall.callType === 'video'
      );
      
      if (success) {
        setCallState(prev => ({
          ...prev,
          isInCall: true,
          isVideo: incomingCall.callType === 'video',
          callId: incomingCall.callId,
          caller: incomingCall.caller,
          isIncoming: true
        }));
        setIncomingCall(null);
      }
      return success;
    } catch (error) {
      console.error('Failed to accept call:', error);
      return false;
    }
  };

  const declineCall = async () => {
    if (!incomingCall) return;

    try {
      // Send decline message through socket
      chatService.socket?.emit('call_decline', {
        callId: incomingCall.callId,
        reason: 'declined'
      });
      
      setIncomingCall(null);
    } catch (error) {
      console.error('Failed to decline call:', error);
    }
  };

  const endCall = async () => {
    try {
      await webRTCService.endCall();
      
      // Send end call message through socket
      if (callState.callId) {
        chatService.socket?.emit('call_end', {
          callId: callState.callId,
          reason: 'ended'
        });
      }
    } catch (error) {
      console.error('Failed to end call:', error);
    }
  };

  const toggleMute = () => {
    const isMuted = webRTCService.toggleMute();
    setCallState(prev => ({ ...prev, isMuted }));
    return isMuted;
  };

  const toggleVideo = () => {
    const isVideoOff = webRTCService.toggleVideo();
    setCallState(prev => ({ ...prev, isVideoOff }));
    return isVideoOff;
  };

  const switchCamera = async () => {
    try {
      await webRTCService.switchCamera();
    } catch (error) {
      console.error('Failed to switch camera:', error);
    }
  };

  const formatCallDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    callState,
    incomingCall,
    startVoiceCall,
    startVideoCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleVideo,
    switchCamera,
    formatCallDuration
  };
};