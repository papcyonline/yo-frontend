import { apiService } from './index';
import { ApiResponse } from '../../types';

interface CreateStatusData {
  text?: string;
  visibility?: 'friends' | 'family' | 'public' | 'private';
  location_name?: string;
  latitude?: number;
  longitude?: number;
  image?: {
    uri: string;
    name: string;
    type: string;
  };
}

interface Status {
  _id: string;
  user_id: {
    _id: string;
    first_name: string;
    last_name: string;
    profile_photo_url?: string;
  };
  content: {
    text?: string;
    type: 'text' | 'image' | 'text_with_image';
  };
  media?: {
    image_url?: string;
    thumbnail_url?: string;
    image_width?: number;
    image_height?: number;
  };
  engagement: {
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
  };
  visibility: string;
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

interface Viewer {
  user_id: {
    _id: string;
    first_name: string;
    last_name: string;
    profile_photo_url?: string;
  };
  viewed_at: string;
}

export class StatusAPI {
  // Create a new status
  static async createStatus(data: CreateStatusData): Promise<ApiResponse<{ status: Status }>> {
    const formData = new FormData();

    if (data.text) formData.append('text', data.text);
    if (data.visibility) formData.append('visibility', data.visibility);
    if (data.location_name) formData.append('location_name', data.location_name);
    if (data.latitude) formData.append('latitude', data.latitude.toString());
    if (data.longitude) formData.append('longitude', data.longitude.toString());

    if (data.image) {
      formData.append('image', data.image as any);
    }

    return apiService.upload<{ status: Status }>('/status', formData);
  }

  // Get status feed
  static async getStatusFeed(
    limit: number = 20,
    offset: number = 0
  ): Promise<ApiResponse<{ statuses: Status[]; count: number; hasMore: boolean }>> {
    return apiService.get<{ statuses: Status[]; count: number; hasMore: boolean }>(
      `/status/feed?limit=${limit}&offset=${offset}`
    );
  }

  // Get statuses by specific user
  static async getUserStatuses(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<ApiResponse<{ statuses: Status[]; count: number; hasMore: boolean }>> {
    return apiService.get<{ statuses: Status[]; count: number; hasMore: boolean }>(
      `/status/user/${userId}?limit=${limit}&offset=${offset}`
    );
  }

  // Get current user's statuses
  static async getMyStatuses(
    limit: number = 20,
    offset: number = 0
  ): Promise<ApiResponse<{ statuses: Status[]; count: number; hasMore: boolean }>> {
    return apiService.get<{ statuses: Status[]; count: number; hasMore: boolean }>(
      `/status?limit=${limit}&offset=${offset}`
    );
  }

  // Get specific status
  static async getStatus(statusId: string): Promise<ApiResponse<{ status: Status }>> {
    return apiService.get<{ status: Status }>(`/status/${statusId}`);
  }

  // Like or unlike a status
  static async likeStatus(statusId: string): Promise<ApiResponse<{ liked: boolean; likeCount: number }>> {
    return apiService.post<{ liked: boolean; likeCount: number }>(`/status/${statusId}/like`);
  }

  // Add comment to status
  static async addComment(
    statusId: string,
    comment: string
  ): Promise<ApiResponse<{ 
    comment: {
      user_id: { 
        _id: string; 
        first_name: string; 
        last_name: string; 
        profile_photo_url?: string; 
      };
      comment: string;
      created_at: string;
    };
    commentCount: number;
  }>> {
    return apiService.post<{ comment: any; commentCount: number }>(`/status/${statusId}/comment`, {
      comment
    });
  }

  // Update status
  static async updateStatus(
    statusId: string,
    data: {
      text?: string;
      visibility?: 'friends' | 'family' | 'public' | 'private';
      is_pinned?: boolean;
    }
  ): Promise<ApiResponse<{ status: Status }>> {
    return apiService.put<{ status: Status }>(`/status/${statusId}`, data);
  }

  // Delete status
  static async deleteStatus(statusId: string): Promise<ApiResponse<{ message: string }>> {
    return apiService.delete<{ message: string }>(`/status/${statusId}`);
  }

  // Record a view
  static async recordView(statusId: string): Promise<ApiResponse<{ viewCount: number; viewerCount: number }>> {
    return apiService.post<{ viewCount: number; viewerCount: number }>(`/status/${statusId}/view`);
  }

  // Get status viewers (only for own status)
  static async getViewers(statusId: string): Promise<ApiResponse<{ viewers: Viewer[]; totalViews: number; totalViewers: number }>> {
    return apiService.get<{ viewers: Viewer[]; totalViews: number; totalViewers: number }>(`/status/${statusId}/viewers`);
  }
}

export default StatusAPI;