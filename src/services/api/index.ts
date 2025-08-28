import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG } from '../../constants/api';
import { useAuthStore } from '../../store/authStore';
import { ApiResponse } from '../../types';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const { token } = useAuthStore.getState();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Log requests in development
        if (__DEV__) {
          console.log(`🌐 ${config.method?.toUpperCase()} ${config.url}`, {
            data: config.data,
            params: config.params,
          });
        }
        
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        if (__DEV__) {
          console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, {
            status: response.status,
            data: response.data,
          });
        }
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 errors (token expired)
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            // Try to refresh token
            const refreshResponse = await this.client.post('/api/auth/refresh-token', {
              refreshToken: useAuthStore.getState().refreshToken,
            });

            if (refreshResponse.data.success) {
              const { token } = refreshResponse.data.data;
              useAuthStore.getState().setToken(token);
              
              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, logout user
            useAuthStore.getState().logout();
            // You might want to navigate to login screen here
          }
        }

        // Log errors in development (silently, without showing in app)
        if (__DEV__) {
          // Use console.warn instead of console.error to avoid red screen errors
          // Or just log minimal info
          console.log(`API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status || 'Network Error'}`);
        }

        return Promise.reject(error);
      }
    );
  }

  // Generic request method
  private async request<T = any>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client(config);
      return response.data;
    } catch (error: any) {
      // Handle network errors
      if (!error.response) {
        return {
          success: false,
          error: 'Network error. Please check your connection.',
        };
      }

      // Return server error response
      return error.response.data || {
        success: false,
        error: 'An unexpected error occurred.',
      };
    }
  }

  // HTTP methods
  async get<T = any>(url: string, params?: any): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'GET', url, params });
  }

  async post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'POST', url, data });
  }

  async put<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PUT', url, data });
  }

  async delete<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'DELETE', url, data });
  }

  // Upload method for files
  async upload<T = any>(url: string, formData: FormData): Promise<ApiResponse<T>> {
    if (__DEV__) {
      console.log('🚀 Starting file upload to:', url);
    }
    
    return this.request<T>({
      method: 'POST',
      url,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 seconds for file uploads
    });
  }

  // Upload profile photo
  async uploadProfilePhoto<T = any>(photoUri: string): Promise<ApiResponse<T>> {
    const formData = new FormData();
    
    // Create photo object for React Native
    const photo = {
      uri: photoUri,
      type: 'image/jpeg',
      name: 'profile-photo.jpg',
    } as any;
    
    formData.append('photo', photo);
    
    return this.upload<T>('/users/profile/photo', formData);
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;