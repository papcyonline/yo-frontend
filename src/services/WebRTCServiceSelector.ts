// Service selector to choose between real and mock WebRTC service
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Check if we're running in Expo Go
const isExpoGo = Constants.executionEnvironment === 'storeClient';

let webRTCService: any;

// For production builds, always try to use real WebRTC first
if (!isExpoGo) {
  // Use real WebRTC service in production/custom builds
  try {
    console.log('📞 Loading Real WebRTC Service');
    const { webRTCService: realWebRTCService } = require('./WebRTCService');
    webRTCService = realWebRTCService;
  } catch (error) {
    console.warn('⚠️ Real WebRTC not available, falling back to mock service');
    const { mockWebRTCService } = require('./MockWebRTCService');
    webRTCService = mockWebRTCService;
  }
} else {
  // Use mock service only in Expo Go
  console.warn('🔧 Loading Mock WebRTC Service for Expo Go compatibility');
  const { mockWebRTCService } = require('./MockWebRTCService');
  webRTCService = mockWebRTCService;
}

export { webRTCService };
export default webRTCService;