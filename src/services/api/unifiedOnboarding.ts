import { apiService } from './index';
import { ApiResponse } from '../../types';

// Unified Onboarding API Types
export interface UnifiedOnboardingResponse {
  answers: Record<string, any>;
  phase: 'essential' | 'core' | 'rich' | 'completed';
  completed: boolean;
  completionPercentage: number;
}

export interface OnboardingStatusResponse {
  currentPhase: 'essential' | 'core' | 'rich' | 'completed';
  recommendedPhase: 'essential' | 'core' | 'rich' | 'completed';
  completionPercentage: number;
  isComplete: boolean;
  canUseApp: boolean;
  answeredCount: number;
  user: any;
}

export interface SaveResponseData {
  user: any;
  completionPercentage: number;
}

class UnifiedOnboardingAPI {
  private baseURL = '/users/onboarding';

  // Get all onboarding responses
  async getOnboardingResponses(): Promise<ApiResponse<UnifiedOnboardingResponse>> {
    return apiService.get(`${this.baseURL}/responses`);
  }

  // Save a single onboarding response
  async saveOnboardingResponse(
    questionId: string,
    answer: any,
    phase?: 'essential' | 'core' | 'rich'
  ): Promise<ApiResponse<{data: SaveResponseData}>> {
    return apiService.post(`${this.baseURL}/response`, {
      questionId,
      answer,
      phase
    });
  }

  // Save multiple onboarding responses in batch
  async saveOnboardingBatch(
    answers: Record<string, any>,
    phase?: 'essential' | 'core' | 'rich',
    autoSaved: boolean = false
  ): Promise<ApiResponse<{data: SaveResponseData}>> {
    return apiService.post(`${this.baseURL}/batch`, {
      responses: answers,
      phase,
      isComplete: autoSaved
    });
  }

  // Complete onboarding
  async completeOnboarding(
    phase: 'essential' | 'core' | 'rich' | 'completed' = 'completed'
  ): Promise<ApiResponse<{data: SaveResponseData}>> {
    return apiService.post(`${this.baseURL}/complete`, {
      phase
    });
  }

  // Get onboarding status and recommendations
  async getOnboardingStatus(): Promise<ApiResponse<OnboardingStatusResponse>> {
    return apiService.get(`${this.baseURL}/status`);
  }
}

export const unifiedOnboardingAPI = new UnifiedOnboardingAPI();