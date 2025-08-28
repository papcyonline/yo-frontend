import { apiService } from './index';
import { API_ENDPOINTS } from '../../constants/api';
import { ApiResponse, User, UserProfile, FamilyMember } from '../../types';

export interface ProfileUpdateRequest {
  fullName?: string;
  bio?: string;
  birthPlace?: string;
  currentLocation?: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  languagesSpoken?: string[];
  interests?: string[];
  privacyLevel?: 'public' | 'friends' | 'private';
}

export interface SetupCompleteRequest {
  bio?: string;
  birthPlace?: string;
  currentLocation?: string;
  birthDate?: string;
  gender?: string;
  familyStories?: string[];
  culturalBackground?: string[];
  languagesSpoken?: string[];
  interests?: string[];
  familyMembers?: Array<{
    name: string;
    relationship: string;
    birthPlace?: string;
    birthYear?: number;
    additionalInfo?: string;
    isDeceased?: boolean;
  }>;
  setupType?: 'voice' | 'manual';
}

export interface ProfileResponse {
  user: User;
  profile: UserProfile;
  familyMembers: FamilyMember[];
}

export const usersApi = {
  // Get current user profile
  getProfile: async (): Promise<ApiResponse<ProfileResponse>> => {
    return apiService.get(API_ENDPOINTS.GET_PROFILE);
  },

  // Update user profile
  updateProfile: async (data: ProfileUpdateRequest): Promise<ApiResponse<{ profile: UserProfile }>> => {
    return apiService.put(API_ENDPOINTS.UPDATE_PROFILE, data);
  },

  // Complete initial setup
  completeSetup: async (data: SetupCompleteRequest): Promise<ApiResponse<{ profile: UserProfile }>> => {
    return apiService.post(API_ENDPOINTS.COMPLETE_SETUP, data);
  },

  // Upload avatar
  uploadAvatar: async (avatarUrl: string): Promise<ApiResponse<{ avatarUrl: string }>> => {
    return apiService.post(API_ENDPOINTS.UPLOAD_AVATAR, { avatarUrl });
  },

  // Get user by ID
  getUserById: async (userId: string): Promise<ApiResponse<{ user: User }>> => {
    return apiService.get(`${API_ENDPOINTS.GET_PROFILE.replace('/profile', '')}/${userId}`);
  },

  // Search users
  searchUsers: async (query: string, page = 1, limit = 20): Promise<ApiResponse<{ users: User[]; pagination: any }>> => {
    return apiService.get(`${API_ENDPOINTS.SEARCH_USERS}/${query}`, { page, limit });
  },
};