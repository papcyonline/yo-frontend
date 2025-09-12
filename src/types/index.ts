// Main type definitions for YoFam app

export interface User {
  _id: string;
  id?: string; // Keep for backward compatibility
  email: string;
  phone: string;
  fullName: string;
  full_name?: string;
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
  avatarUrl?: string;
  profile_photo_url?: string;
  profile_picture_url?: string;
  isVerified: boolean;
  phoneVerified: boolean;
  phone_verified?: boolean;
  emailVerified: boolean;
  email_verified?: boolean;
  profile_completed?: boolean;
  profile_complete?: boolean;
  languagePreference: string;
  preferred_language?: string;
  lastSeen: string;
  createdAt: string;
  username?: string;
  display_name?: string;
  bio?: string;
  location?: string;
  profession?: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  bio?: string;
  birthPlace?: string;
  currentLocation?: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  familyStories: string[];
  culturalBackground: string[];
  languagesSpoken: string[];
  interests: string[];
  setupCompleted: boolean;
  privacyLevel: 'public' | 'friends' | 'private';
}

export interface FamilyMember {
  id: string;
  userId: string;
  name: string;
  relationship: string;
  birthPlace?: string;
  birthYear?: number;
  additionalInfo?: string;
  isDeceased: boolean;
}

export interface Match {
  id: string;
  matchPercentage: number;
  matchType: string;
  confidenceScore: number;
  status: 'pending' | 'connected' | 'rejected' | 'blocked';
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    avatarUrl?: string;
    currentLocation?: string;
    culturalBackground?: string[];
  };
  matchingFactors?: Record<string, number>;
  sharedContext?: string; // For friend matches
  timePeriod?: string; // For friend matches
}

export interface Community {
  id: string;
  name: string;
  description: string;
  category: string;
  culturalTags: string[];
  location?: string;
  privacyLevel: 'public' | 'private' | 'invite_only';
  memberCount: number;
  isActive: boolean;
  createdBy: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
  createdAt: string;
  isMember?: boolean;
  userRole?: 'admin' | 'moderator' | 'member';
}

export interface CommunityPost {
  id: string;
  communityId: string;
  title?: string;
  content: string;
  mediaUrls: string[];
  likesCount: number;
  commentsCount: number;
  isPinned: boolean;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  type: string;
  value: any;
  msg: string;
  path: string;
  location: string;
}

// Navigation types
export interface NavigationProps {
  navigation: any;
  route: any;
}

// Language selection
export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

// Voice setup
export interface VoiceSetupData {
  voiceResponses: string[];
  language: string;
}

// Authentication states
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

// App settings
export interface AppSettings {
  language: string;
  darkMode: boolean;
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
    matches: boolean;
    communities: boolean;
    messages: boolean;
  };
  privacy: {
    shareProfile: boolean;
    shareLocation: boolean;
    allowFacialRecognition: boolean;
  };
}

// Status/Stories related types
export interface StatusStyle {
  background_color?: string;
  font_size?: number;
  text_color?: string;
  font_family?: string;
  text_alignment?: 'left' | 'center' | 'right';
}

export interface StatusContent {
  text?: string;
  type: 'text' | 'image' | 'text_with_image' | 'audio' | 'text_with_audio' | 'image_audio' | 'text_with_image_audio';
  style?: StatusStyle;
}

export interface StatusMedia {
  image_url?: string;
  thumbnail_url?: string;
  image_width?: number;
  image_height?: number;
  audio_url?: string;
  audio_duration?: number;
}

export interface StatusEngagement {
  likes: Array<{ user_id: string; created_at: string }>;
  comments: Array<{
    user_id: { 
      _id: string; 
      first_name: string; 
      last_name: string; 
      profile_photo_url?: string; 
    };
    comment: string;
    created_at: string;
  }>;
  views: number;
  shares: number;
}

export interface Status {
  _id: string;
  user_id: {
    _id: string;
    first_name: string;
    last_name: string;
    profile_photo_url?: string;
  };
  content: StatusContent;
  media?: StatusMedia;
  engagement: StatusEngagement;
  visibility: 'friends' | 'family' | 'public' | 'private';
  location?: {
    name?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  created_at: string;
  updated_at: string;
}