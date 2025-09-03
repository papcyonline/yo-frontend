// src/services/matchingAPI.ts - AI Matching API Service
import { API_BASE_URL } from '../config/constants';

export interface Match {
  id: string;
  matched_user_id: string;
  match_type: 'family' | 'friend' | 'heritage' | 'community';
  match_score: number;
  confidence_level: 'low' | 'medium' | 'high';
  ai_reasoning: {
    reasoning: string;
  };
  match_factors: any;
  status: 'pending' | 'viewed' | 'liked' | 'passed' | 'connected';
  created_at: string;
  matched_user: {
    id: string;
    first_name: string;
    last_name: string;
    profile_photo_url?: string;
    bio?: string;
    location?: string;
    age_range?: string;
  };
}

export interface MatchAnalytics {
  user_id: string;
  total_matches: number;
  family_matches: number;
  friend_matches: number;
  heritage_matches: number;
  community_matches: number;
  avg_match_score: number;
  last_processed_at?: string;
  processing_version: string;
}

export interface GetMatchesResponse {
  matches: Match[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProcessingStatus {
  is_processing: boolean;
  has_pending: boolean;
  pending_items: number;
  last_completed?: string;
  queue_items: any[];
}

class MatchingAPI {
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const token = await this.getAuthToken();
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }
    
    return data;
  }

  private async getAuthToken(): Promise<string> {
    // Get token from AsyncStorage using the correct key
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return await AsyncStorage.getItem('yofam_auth_token') || '';
  }

  // Get matches by type with pagination
  async getMatches(type?: string, page = 1, limit = 20, userId?: string): Promise<GetMatchesResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    // Add user_id parameter if provided (for testing different users)
    if (userId) {
      params.append('user_id', userId);
    }

    // Map frontend type to backend endpoints
    let endpoint = '/matching';
    if (type === 'family') {
      endpoint = '/matching/family';
    } else if (type === 'friend') {
      endpoint = '/matching/friends';
    } else if (type && type !== 'all') {
      params.append('type', type);
    }

    const response = await this.makeRequest(`${endpoint}?${params}`);
    
    // Transform backend data to frontend format
    const backendMatches = response.data.matches || [];
    const transformedMatches = backendMatches.map((match: any) => ({
      id: match.userId || match.id,
      matched_user_id: match.userId,
      match_type: match.type === 'family' ? 'family' : match.type === 'friend' ? 'friend' : 'community',
      match_score: match.score || 0,
      confidence_level: match.confidence || 'medium',
      ai_reasoning: {
        reasoning: match.reason || 'Match found based on profile similarity'
      },
      match_factors: match.factors || {},
      status: 'pending',
      created_at: new Date().toISOString(),
      predictedRelationship: match.predictedRelationship, // Include AI predicted relationship
      matched_user: {
        id: match.userId,
        first_name: match.profileData?.first_name || (match.name ? match.name.split(' ')[0] : 'Unknown'),
        last_name: match.profileData?.last_name || (match.name ? match.name.split(' ').slice(1).join(' ') : ''),
        profile_photo_url: match.profileData?.profile_photo_url || match.profilePictureUrl,
        bio: match.profileData?.bio || match.bio,
        location: match.profileData?.location || match.location,
        age_range: match.age_range
      }
    }));
    
    return {
      matches: transformedMatches,
      pagination: response.data.pagination || { page, limit, total: transformedMatches.length, totalPages: 1 }
    };
  }

  // Get match analytics
  async getMatchAnalytics(): Promise<MatchAnalytics> {
    try {
      // Try to get analytics from backend, fallback to mock data
      const response = await this.makeRequest('/matching/analytics');
      return response.data.analytics;
    } catch (error) {
      // Return mock analytics if endpoint doesn't exist
      return {
        user_id: 'current_user',
        total_matches: 0,
        family_matches: 0,
        friend_matches: 0,
        heritage_matches: 0,
        community_matches: 0,
        avg_match_score: 0,
        processing_version: '1.0.0'
      };
    }
  }

  // Update match status (like, pass, connect, etc.)
  async updateMatchStatus(
    matchId: string, 
    status: 'viewed' | 'liked' | 'passed' | 'connected',
    feedbackReason?: string,
    feedbackText?: string
  ): Promise<void> {
    await this.makeRequest(`/ai/matches/${matchId}/status`, {
      method: 'PUT',
      body: JSON.stringify({
        status,
        feedback_reason: feedbackReason,
        feedback_text: feedbackText
      }),
    });
  }

  // Trigger AI processing for current user
  async triggerProcessing(immediate = false, type = 'profile_update'): Promise<any> {
    try {
      const response = await this.makeRequest('/matching/process', {
        method: 'POST',
        body: JSON.stringify({ immediate, type }),
      });
      return response.data;
    } catch (error) {
      // Mock success response if endpoint doesn't exist
      return { success: true, message: 'Processing queued' };
    }
  }

  // Get processing status
  async getProcessingStatus(): Promise<ProcessingStatus> {
    try {
      const response = await this.makeRequest('/matching/status');
      return response.data;
    } catch (error) {
      // Return mock status if endpoint doesn't exist
      return {
        is_processing: false,
        has_pending: false,
        pending_items: 0,
        queue_items: []
      };
    }
  }

  // Get similar users (preview)
  async getSimilarUsers(type = 'all', limit = 10): Promise<any[]> {
    const params = new URLSearchParams({
      type,
      limit: limit.toString(),
    });

    const response = await this.makeRequest(`/ai/similar-users?${params}`);
    return response.data.users;
  }

  // Report a match
  async reportMatch(matchId: string, reason: string, description?: string): Promise<void> {
    await this.makeRequest(`/ai/matches/${matchId}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason, description }),
    });
  }

  // Get AI queue stats (development)
  async getQueueStats(): Promise<any> {
    const response = await this.makeRequest('/ai/queue/stats');
    return response.data.stats;
  }
}

export const matchingAPI = new MatchingAPI();