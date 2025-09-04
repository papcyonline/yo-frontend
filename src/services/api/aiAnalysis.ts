import { apiService } from './index';
import { API_ENDPOINTS } from '../../constants/api';
import { ApiResponse } from '../../types';

export interface ProfileCompletionAnalysis {
  completionScore: number;
  isComplete: boolean;
  criticalMissing: string[];
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    field: string;
    reason: string;
  }[];
  estimatedTime: string;
  familyTreePotential: 'high' | 'medium' | 'low';
  matchingInsights: string;
  aiGenerated?: boolean;
  matchingRecommendations?: {
    title: string;
    description: string;
    impact: string;
    estimatedTime: string;
  }[];
  traditionalAnalysis?: any;
  timestamp: string;
  userId: string;
}

class AIAnalysisAPI {
  // Get AI-powered profile completion analysis
  async getProfileCompletionAnalysis(): Promise<ApiResponse<ProfileCompletionAnalysis>> {
    return apiService.get(API_ENDPOINTS.PROFILE_COMPLETION_ANALYSIS);
  }

  // Trigger profile sync before analysis
  async syncAndAnalyze(): Promise<ApiResponse<{ syncResult: any; analysis: ProfileCompletionAnalysis }>> {
    try {
      // First sync progressive profile data
      const syncResponse = await apiService.post('/ai/chatflow/sync-profile');
      
      // Then get AI analysis
      const analysisResponse = await this.getProfileCompletionAnalysis();
      
      if (syncResponse.success && analysisResponse.success) {
        return {
          success: true,
          data: {
            syncResult: syncResponse.data,
            analysis: analysisResponse.data
          }
        };
      }
      
      return {
        success: false,
        error: 'Failed to sync or analyze profile'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export const aiAnalysisAPI = new AIAnalysisAPI();