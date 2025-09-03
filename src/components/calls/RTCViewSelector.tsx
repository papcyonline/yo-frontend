// Component selector to choose between real and mock RTCView
import React from 'react';
import Constants from 'expo-constants';

// Check if we're running in Expo Go
const isExpoGo = Constants.executionEnvironment === 'storeClient';

interface RTCViewProps {
  streamURL?: string;
  style?: any;
  objectFit?: 'cover' | 'contain';
  mirror?: boolean;
}

let RTCView: React.ComponentType<RTCViewProps>;

// For production builds, always try to use real RTCView first
if (!isExpoGo) {
  // Use real RTCView in production/custom builds
  try {
    const { RTCView: RealRTCView } = require('react-native-webrtc');
    RTCView = RealRTCView;
    console.log('📹 Using Real RTCView for video rendering');
  } catch (error) {
    // Fallback to mock if real RTCView is not available
    console.warn('⚠️ Real RTCView not available, using mock view');
    const { MockRTCView } = require('./MockRTCView');
    RTCView = (props: RTCViewProps) => <MockRTCView {...props} isLocal={props.mirror} />;
  }
} else {
  // Use mock RTCView only in Expo Go
  console.warn('🔧 Using Mock RTCView for Expo Go compatibility');
  const { MockRTCView } = require('./MockRTCView');
  RTCView = (props: RTCViewProps) => <MockRTCView {...props} isLocal={props.mirror} />;
}

export { RTCView };
export default RTCView;