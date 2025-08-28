// src/constants/app.ts
export const APP = {
  // App Information
  name: 'FamilyConnect',
  version: '1.0.0',
  build: '2025.01.001',
  
  // API Configuration
  api: {
    baseUrl: __DEV__ ? 'https://dev-api.familyconnect.com' : 'https://api.familyconnect.com',
    timeout: 10000,
    retryAttempts: 3,
  },
  
  // Storage Keys
  storage: {
    keys: {
      auth: '@familyconnect:auth',
      user: '@familyconnect:user',
      preferences: '@familyconnect:preferences',
      language: '@familyconnect:language',
      onboarding: '@familyconnect:onboarding',
    },
  },
  
  // Validation Rules
  validation: {
    password: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
    },
    phone: {
      minLength: 10,
      maxLength: 15,
    },
    email: {
      regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
  },
  
  // Pagination
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },
  
  // Image/File limits
  media: {
    maxImageSize: 10 * 1024 * 1024, // 10MB
    maxVideoSize: 100 * 1024 * 1024, // 100MB
    allowedImageTypes: ['jpg', 'jpeg', 'png', 'gif'],
    allowedVideoTypes: ['mp4', 'mov', 'avi'],
  },
  
  // Timeouts
  timeouts: {
    shortAction: 5000,
    mediumAction: 15000,
    longAction: 30000,
  },
} as const;