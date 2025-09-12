import { API_CONFIG } from '../../constants/api';

export interface Community {
  id: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  isJoined: boolean;
  isPrivate?: boolean;
  createdBy: string;
  posts: number;
  recentActivity: string;
  userRole?: 'member' | 'admin' | 'creator';
  avatar?: string;
  coverImage?: string;
  isCreatedByUser?: boolean;
}

export interface CreateCommunityRequest {
  name: string;
  description?: string;
  category: string;
  isPrivate?: boolean;
}

export interface CommunityApiResponse {
  success: boolean;
  data: {
    community?: Community;
    communities?: Community[];
    count?: number;
    total?: number;
    hasMore?: boolean;
  };
  message?: string;
  error?: string;
}

class CommunityAPI {
  private getAuthHeaders(token: string) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async getCommunities(token: string, options?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
  }): Promise<CommunityApiResponse> {
    try {
      const params = new URLSearchParams();
      if (options?.page) params.set('page', options.page.toString());
      if (options?.limit) params.set('limit', options.limit.toString());
      if (options?.category) params.set('category', options.category);
      if (options?.search) params.set('search', options.search);

      const response = await fetch(`${API_CONFIG.BASE_URL}/communities?${params.toString()}`, {
        method: 'GET',
        headers: this.getAuthHeaders(token),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching communities:', error);
      throw error;
    }
  }

  async createCommunity(token: string, communityData: CreateCommunityRequest): Promise<CommunityApiResponse> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/communities`, {
        method: 'POST',
        headers: this.getAuthHeaders(token),
        body: JSON.stringify(communityData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating community:', error);
      throw error;
    }
  }

  async getCommunityById(token: string, communityId: string): Promise<CommunityApiResponse> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/communities/${communityId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(token),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching community:', error);
      throw error;
    }
  }

  async joinCommunity(token: string, communityId: string): Promise<CommunityApiResponse> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/communities/${communityId}/join`, {
        method: 'POST',
        headers: this.getAuthHeaders(token),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error joining community:', error);
      throw error;
    }
  }

  async leaveCommunity(token: string, communityId: string): Promise<CommunityApiResponse> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/communities/${communityId}/leave`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(token),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error leaving community:', error);
      throw error;
    }
  }

  async updateCommunity(token: string, communityId: string, updates: Partial<CreateCommunityRequest>): Promise<CommunityApiResponse> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/communities/${communityId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(token),
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating community:', error);
      throw error;
    }
  }

  async deleteCommunity(token: string, communityId: string): Promise<CommunityApiResponse> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/communities/${communityId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(token),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting community:', error);
      throw error;
    }
  }

  async getMembers(token: string, communityId: string): Promise<CommunityApiResponse> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/communities/${communityId}/members`, {
        method: 'GET',
        headers: this.getAuthHeaders(token),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching community members:', error);
      throw error;
    }
  }

  async addMembers(token: string, communityId: string, userIds: string[]): Promise<CommunityApiResponse> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/communities/${communityId}/add-members`, {
        method: 'POST',
        headers: this.getAuthHeaders(token),
        body: JSON.stringify({ userIds }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding members to community:', error);
      throw error;
    }
  }
}

export const communityAPI = new CommunityAPI();
export default communityAPI;