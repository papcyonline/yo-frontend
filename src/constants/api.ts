// API Configuration with environment variables
const getApiBaseUrl = () => {
  if (__DEV__) {
    // In development, use DEV_API_BASE_URL if set, otherwise fallback to API_BASE_URL
    return process.env.EXPO_PUBLIC_DEV_API_BASE_URL || 
           process.env.EXPO_PUBLIC_API_BASE_URL || 
           'http://localhost:9002/api';
  } else {
    // In production, use PRODUCTION_API_BASE_URL or fallback to API_BASE_URL
    return process.env.EXPO_PUBLIC_PRODUCTION_API_BASE_URL || 
           process.env.EXPO_PUBLIC_API_BASE_URL || 
           'https://api.yofamapp.com/api';
  }
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  TIMEOUT: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000', 10),
  RETRY_ATTEMPTS: parseInt(process.env.EXPO_PUBLIC_API_RETRY_ATTEMPTS || '3', 10),
  ENVIRONMENT: process.env.EXPO_PUBLIC_ENVIRONMENT || (__DEV__ ? 'development' : 'production'),
};

export const API_ENDPOINTS = {
  // Auth endpoints
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  GOOGLE_AUTH: '/auth/google',
  VERIFY_PHONE: '/auth/verify-phone',
  VERIFY_EMAIL: '/auth/verify-email',
  RESEND_OTP: '/auth/resend-otp',

  // User endpoints
  GET_PROFILE: '/users/profile',
  UPDATE_PROFILE: '/users/profile',
  COMPLETE_SETUP: '/users/setup',
  UPLOAD_AVATAR: '/users/upload-avatar',
  SEARCH_USERS: '/users/search',

  // Matching endpoints (updated to working backend)
  GET_FAMILY_MATCHES: '/matching/family',
  GET_FRIEND_MATCHES: '/matching/friends',
  GET_ALL_MATCHES: '/matching',
  CALCULATE_MATCHES: '/matching/process',
  GET_MATCH_DETAILS: '/matching',
  SEND_CONNECTION_REQUEST: '/matching',
  RESPOND_TO_CONNECTION: '/matching',

  // Communities endpoints
  GET_COMMUNITIES: '/communities',
  GET_MY_COMMUNITIES: '/communities/my',
  GET_RECOMMENDED_COMMUNITIES: '/communities/recommendations',
  CREATE_COMMUNITY: '/communities',
  JOIN_COMMUNITY: '/communities',
  GET_COMMUNITY_POSTS: '/communities',

  // AI endpoints
  VOICE_SETUP: '/ai/voice-setup',
  ANALYZE_STORIES: '/ai/analyze-stories',
  CHAT_ASSISTANT: '/ai/chat-assistant',
  ENHANCE_PROFILE: '/ai/enhance-profile',
  PROFILE_COMPLETION_ANALYSIS: '/ai/profile-completion-analysis',
  
  // AI Chatflow endpoints
  CHATFLOW_NEXT_QUESTION: '/ai/chatflow/next-question',
  CHATFLOW_SAVE_ANSWER: '/ai/chatflow/save-answer',
  CHATFLOW_UNANSWERED: '/ai/chatflow/unanswered',
  CHATFLOW_STATUS: '/ai/chatflow/status',
  CHATFLOW_RESET: '/ai/chatflow/reset',
  CHATFLOW_RESPONSES: '/ai/chatflow/responses',
  CHATFLOW_SYNC_PROFILE: '/ai/chatflow/sync-profile',

  // Social endpoints
  GET_SOCIAL_CONNECTIONS: '/social/connections',
  CONNECT_FACEBOOK: '/social/connect/facebook',
  CONNECT_TIKTOK: '/social/connect/tiktok',
  SYNC_SOCIAL_DATA: '/social/sync',
  
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  SAVE_PROFILE_ANSWERS: '/users/profile-answers',
};