import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../constants/api';

export interface FamilyMember {
  _id?: string;
  firstName: string;
  lastName: string;
  name: string;
  gender: 'male' | 'female';
  dateOfBirth?: string;
  placeOfBirth?: string;
  dateOfDeath?: string;
  burialPlace?: string;
  isAlive: boolean;
  currentLocation?: string;
  profession?: string;
  bio?: string;
  achievements?: string[];
  photo?: string;
  photos?: string[];
  parents?: string[];
  children?: string[];
  siblings?: string[];
  spouse?: string;
  generation: number;
  familyTreeId: string;
  userId: string;
  isCurrentUser?: boolean;
  isEditable?: boolean;
  isAIMatched?: boolean;
  matchConfidence?: number;
  aiMatchingData?: {
    sources: string[];
    matchedRecords: string[];
    lastMatched: string;
  };
  isPrivate?: boolean;
  createdBy: string;
  lastModifiedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FamilyTree {
  _id?: string;
  name: string;
  description?: string;
  owner: string;
  familySurname?: string;
  originLocation?: string;
  isPublic: boolean;
  isSearchable: boolean;
  allowCollaboration: boolean;
  enableAIMatching: boolean;
  stats?: {
    totalMembers: number;
    generations: number;
    completeness: number;
    lastUpdated: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface TreeStats {
  totalMembers: number;
  generations: number;
  aiMatched: number;
  withPhotos: number;
  withBios: number;
  completeness: number;
}

class GenealogyService {
  private baseURL: string;

  constructor() {
    // Use test server with genealogy endpoints - network IP for React Native  
    this.baseURL = 'http://192.168.1.231:3020/api/genealogy';
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    try {
      console.log('🔑 GenealogyService - Searching for auth token...');
      
      // Method 1: Check Zustand auth store persistence (most likely)
      const authStoreData = await AsyncStorage.getItem('authStore');
      if (authStoreData) {
        console.log('🔑 Found authStore data');
        const parsedAuthStore = JSON.parse(authStoreData);
        if (parsedAuthStore.state?.token) {
          const token = parsedAuthStore.state.token;
          console.log('🔑 Token from authStore:', token.substring(0, 20) + '...');
          return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          };
        }
      }

      // Method 2: Check AuthStorage format (correct key with hyphens!)
      const authDataString = await AsyncStorage.getItem('yofam-auth-storage');
      if (authDataString) {
        console.log('🔑 Found yofam-auth-storage');
        const authData = JSON.parse(authDataString);
        // Handle nested state structure: authData.state.token
        const token = authData.token || authData.state?.token;
        if (token) {
          console.log('🔑 Token from yofam-auth-storage:', token.substring(0, 20) + '...');
          return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          };
        }
      }

      // Method 3: Check direct token storage
      const directToken = await AsyncStorage.getItem('yofam_auth_token');
      if (directToken) {
        console.log('🔑 Found direct token');
        console.log('🔑 Token from yofam_auth_token:', directToken.substring(0, 20) + '...');
        return {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${directToken}`,
        };
      }

      // Method 4: Check all keys to see what's actually stored
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('🔑 All AsyncStorage keys:', allKeys);
      
      // Look for any key containing 'auth' or 'token'
      for (const key of allKeys) {
        if (key.toLowerCase().includes('auth') || key.toLowerCase().includes('token')) {
          const value = await AsyncStorage.getItem(key);
          console.log(`🔍 Found ${key}:`, value ? 'Has value' : 'Empty');
          if (value && key !== 'yofam_auth_data') {
            try {
              const parsed = JSON.parse(value);
              if (parsed.token || parsed.accessToken || parsed.authToken) {
                const token = parsed.token || parsed.accessToken || parsed.authToken;
                console.log(`🔑 Token from ${key}:`, token.substring(0, 20) + '...');
                return {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                };
              }
            } catch (e) {
              // Not JSON, might be direct token
              if (typeof value === 'string' && value.length > 20) {
                console.log(`🔑 Direct token from ${key}:`, value.substring(0, 20) + '...');
                return {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${value}`,
                };
              }
            }
          }
        }
      }
      
      console.warn('⚠️ No auth token found in any storage method');
      return {
        'Content-Type': 'application/json',
        'Authorization': '',
      };
    } catch (error) {
      console.error('🚨 Error getting auth headers:', error);
      return {
        'Content-Type': 'application/json',
        'Authorization': '',
      };
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`🚨 GenealogyService API Error [${response.status}]:`, data.message);
        if (response.status === 401) {
          // Clear expired token and ask user to re-login
          await this.clearAuthData();
          throw new Error('Your session has expired. Please log in again to continue.');
        }
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      console.log(`✅ GenealogyService API Success:`, endpoint);
      return data;
    } catch (error) {
      console.error(`GenealogyService request error:`, error);
      throw error;
    }
  }

  private async clearAuthData(): Promise<void> {
    try {
      await AsyncStorage.removeItem('yofam-auth-storage');
      await AsyncStorage.removeItem('yofam_auth_token');
      await AsyncStorage.removeItem('authStore');
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }

  // Family Tree Operations
  async getFamilyTrees(): Promise<FamilyTree[]> {
    const response = await this.makeRequest('/trees');
    return response.data;
  }

  async createFamilyTree(treeData: Partial<FamilyTree>): Promise<FamilyTree> {
    const response = await this.makeRequest('/trees', {
      method: 'POST',
      body: JSON.stringify(treeData),
    });
    return response.data;
  }

  async getFamilyTree(treeId: string): Promise<FamilyTree> {
    const response = await this.makeRequest(`/trees/${treeId}`);
    return response.data;
  }

  async updateFamilyTree(treeId: string, treeData: Partial<FamilyTree>): Promise<FamilyTree> {
    const response = await this.makeRequest(`/trees/${treeId}`, {
      method: 'PUT',
      body: JSON.stringify(treeData),
    });
    return response.data;
  }

  async deleteFamilyTree(treeId: string): Promise<void> {
    await this.makeRequest(`/trees/${treeId}`, {
      method: 'DELETE',
    });
  }

  // Family Member Operations
  async getFamilyMembers(treeId: string): Promise<FamilyMember[]> {
    const response = await this.makeRequest(`/trees/${treeId}/members`);
    return response.data;
  }

  async getFamilyMember(memberId: string): Promise<FamilyMember> {
    const response = await this.makeRequest(`/members/${memberId}`);
    return response.data;
  }

  async createFamilyMember(treeId: string, memberData: Partial<FamilyMember>, photo?: any, galleryImages?: any[]): Promise<FamilyMember> {
    const headers = await this.getAuthHeaders();
    
    // If we have photos, use FormData; otherwise use JSON
    if (photo || (galleryImages && galleryImages.length > 0)) {
      const formData = new FormData();
      
      // Add member data as JSON string to avoid array parsing issues
      Object.keys(memberData).forEach(key => {
        const value = (memberData as any)[key];
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            // Send arrays as JSON string
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      // Add profile photo if provided
      if (photo && typeof photo === 'string') {
        formData.append('photo', {
          uri: photo,
          type: 'image/jpeg',
          name: 'profile_photo.jpg',
        } as any);
      } else if (photo && photo.uri) {
        formData.append('photo', {
          uri: photo.uri,
          type: photo.type || 'image/jpeg',
          name: photo.fileName || 'photo.jpg',
        } as any);
      }
      
      const response = await fetch(`${this.baseURL}/trees/${treeId}/members`, {
        method: 'POST',
        headers: {
          'Authorization': headers.Authorization,
          // Don't set Content-Type, let the browser set it with boundary
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      // If we have gallery images, add them after creating the member
      if (galleryImages && galleryImages.length > 0 && data.data._id) {
        try {
          await this.addPhotosToMember(data.data._id, galleryImages);
        } catch (error) {
          console.warn('Failed to add gallery photos:', error);
        }
      }

      return data.data;
    } else {
      // No photos, use JSON
      const response = await fetch(`${this.baseURL}/trees/${treeId}/members`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memberData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data.data;
    }
  }

  async updateFamilyMember(memberId: string, memberData: Partial<FamilyMember>, photo?: any): Promise<FamilyMember> {
    const formData = new FormData();
    
    // Add member data
    Object.keys(memberData).forEach(key => {
      const value = (memberData as any)[key];
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    // Add photo if provided
    if (photo) {
      formData.append('photo', {
        uri: photo.uri,
        type: photo.type || 'image/jpeg',
        name: photo.fileName || 'photo.jpg',
      } as any);
    }

    const token = await AsyncStorage.getItem('yofam_auth_token');
    
    const response = await fetch(`${this.baseURL}/members/${memberId}`, {
      method: 'PUT',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data.data;
  }

  async addPhotosToMember(memberId: string, photos: any[]): Promise<{ photos: string[]; newPhotos: string[] }> {
    const formData = new FormData();
    
    photos.forEach((photo, index) => {
      if (typeof photo === 'string') {
        // If photo is a URI string (from AddChildModal galleryImages)
        formData.append('photos', {
          uri: photo,
          type: 'image/jpeg',
          name: `gallery_photo_${index}.jpg`,
        } as any);
      } else {
        // If photo is an object with uri
        formData.append('photos', {
          uri: photo.uri,
          type: photo.type || 'image/jpeg',
          name: photo.fileName || `photo_${index}.jpg`,
        } as any);
      }
    });

    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}/members/${memberId}/photos`, {
      method: 'POST',
      headers: {
        'Authorization': headers.Authorization,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data.data;
  }

  async deleteFamilyMember(memberId: string): Promise<void> {
    await this.makeRequest(`/members/${memberId}`, {
      method: 'DELETE',
    });
  }

  // Statistics
  async getTreeStats(treeId: string): Promise<TreeStats> {
    const response = await this.makeRequest(`/trees/${treeId}/stats`);
    return response.data;
  }

  // Helper methods for frontend integration
  convertToFrontendFormat(backendMember: any): FamilyMember {
    return {
      ...backendMember,
      id: backendMember._id,
      dateOfBirth: backendMember.dateOfBirth,
      dateOfDeath: backendMember.dateOfDeath,
      // Map any other field differences between backend and frontend
    };
  }

  convertFromFrontendFormat(frontendMember: any): Partial<FamilyMember> {
    const { id, ...rest } = frontendMember;
    return {
      ...rest,
      _id: id,
    };
  }

  // Create a default family tree for a new user
  async createDefaultFamilyTree(userId: string, userName: string): Promise<FamilyTree> {
    const defaultTree = {
      name: `${userName}'s Family Tree`,
      description: 'My family heritage and genealogy',
      isPublic: false,
      isSearchable: true,
      allowCollaboration: false,
      enableAIMatching: true,
    };

    return this.createFamilyTree(defaultTree);
  }

  // Create user as the first family member
  async createUserAsFamilyMember(
    treeId: string, 
    user: any, 
    additionalData: Partial<FamilyMember> = {}
  ): Promise<FamilyMember> {
    const userData = {
      firstName: user.firstName || user.name?.split(' ')[0] || 'User',
      lastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
      gender: user.gender || 'male',
      generation: 0,
      isCurrentUser: true,
      isEditable: true,
      photo: user.profileImage,
      ...additionalData,
    };

    return this.createFamilyMember(treeId, userData);
  }
}

export const genealogyService = new GenealogyService();
export default genealogyService;