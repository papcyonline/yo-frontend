import React, { useEffect } from 'react';
import { useWebRTC } from '../../hooks/useWebRTC';
import { IncomingCallScreen } from './IncomingCallScreen';
import { ActiveCallScreen } from './ActiveCallScreen';

export const CallManager: React.FC = () => {
  const {
    callState,
    incomingCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleVideo,
    switchCamera,
    formatCallDuration
  } = useWebRTC();

  // Debug logging
  useEffect(() => {
    console.log('🎯 CallManager: Call state changed:', {
      isInCall: callState.isInCall,
      hasIncomingCall: !!incomingCall,
      callId: callState.callId,
      isVideo: callState.isVideo,
      connectionState: callState.connectionState
    });
    
    // Log which screens should be shown
    if (incomingCall) {
      console.log('📱 CallManager: Should show INCOMING CALL screen');
    } else if (callState.isInCall) {
      console.log('📱 CallManager: Should show ACTIVE CALL screen');
    } else {
      console.log('📱 CallManager: Should show NO screens');
    }
  }, [callState, incomingCall]);

  return (
    <>
      {/* Incoming Call Screen */}
      {incomingCall && (
        <IncomingCallScreen
          visible={!!incomingCall}
          caller={incomingCall.caller}
          callType={incomingCall.callType}
          callId={incomingCall.callId}
          onAccept={acceptCall}
          onDecline={declineCall}
        />
      )}

      {/* Active Call Screen */}
      {callState.isInCall && !incomingCall && (
        <ActiveCallScreen
          visible={callState.isInCall && !incomingCall}
          callState={{
            isVideo: callState.isVideo,
            isMuted: callState.isMuted,
            isVideoOff: callState.isVideoOff,
            callDuration: callState.callDuration,
            caller: callState.caller || undefined,
            localStream: callState.localStream || undefined,
            remoteStream: callState.remoteStream || undefined,
            connectionState: callState.connectionState
          }}
          onEndCall={endCall}
          onToggleMute={toggleMute}
          onToggleVideo={toggleVideo}
          onSwitchCamera={switchCamera}
          formatCallDuration={formatCallDuration}
        />
      )}
    </>
  );
};