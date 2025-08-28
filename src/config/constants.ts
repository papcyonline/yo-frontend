import { Platform } from 'react-native';

// API Configuration - Using the centralized API config
import { API_CONFIG } from '../constants/api';

export const API_BASE_URL = API_CONFIG.BASE_URL;

// App Configuration
export const APP_NAME = 'YoFam';
export const APP_VERSION = '1.0.0';
export const BUILD_NUMBER = '2025.01.001';

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'yofam_auth_token',
  REFRESH_TOKEN: 'yofam_refresh_token',
  USER_DATA: 'yofam_user_data',
  LANGUAGE: 'yofam_language',
  THEME: 'yofam_theme',
} as const;

// Supported Languages
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
] as const;

// Theme Colors
export const COLORS = {
  primary: '#0091ad',
  secondary: '#04a7c7', 
  accent: '#fcd3aa',
  background: '#000000',
  surface: '#1a1a1a',
  text: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  error: '#ff6b6b',
  success: '#51cf66',
  warning: '#ffd43b',
} as const;

// System Fonts - Using platform defaults
export const FONTS = {
  // iOS system fonts - undefined will use system default
  ios: {
    regular: undefined,
    medium: undefined,
    semiBold: undefined,
    bold: undefined,
    light: undefined,
  },
  // Android system fonts - undefined will use system default
  android: {
    regular: undefined,
    medium: undefined,
    semiBold: undefined,
    bold: undefined,
    light: undefined,
  },
  // Default fallback
  default: {
    regular: undefined,
    medium: undefined,
    semiBold: undefined,
    bold: undefined,
    light: undefined,
  }
} as const;

// Font utility function - returns undefined to use platform defaults
export const getSystemFont = (weight: keyof typeof FONTS.ios = 'regular') => {
  // Always return undefined to use platform default fonts
  return undefined;
};

// API Endpoints
export const ENDPOINTS = {
  // Auth
  REGISTER_PHONE: '/auth/register-phone',
  VERIFY_PHONE: '/auth/verify-phone',
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh-token',
  
  // Users
  PROFILE: '/users/profile',
  UPDATE_PROFILE: '/users/profile',
  
  // Settings
  GET_PREFERENCES: '/settings/preferences',
  UPDATE_PREFERENCES: '/settings/preferences',
  TERMS_OF_SERVICE: '/settings/terms-of-service',
  PRIVACY_POLICY: '/settings/privacy-policy',
  ABOUT: '/settings/about',
  
  // Progressive Profile
  PROGRESSIVE_STATUS: '/users/progressive/status',
  SAVE_ANSWER: '/users/progressive/answer',
  FINALIZE_PROFILE: '/users/progressive/finalize',
} as const;