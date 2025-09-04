import { apiService } from './index';
import { ApiResponse } from '../../types';

export interface VerificationEligibility {
  can_apply_for_verification: boolean;
  verification_status: 'not_eligible' | 'eligible' | 'pending' | 'approved' | 'rejected';
  verification_requested: boolean;
  is_verified: boolean;
  profile_completion_percentage: number;
  requirements_met: boolean;
}

export interface VerificationStatus {
  is_verified: boolean;
  verification_status: 'not_eligible' | 'eligible' | 'pending' | 'approved' | 'rejected';
  verification_requested: boolean;
  verification_requested_at?: string;
  verified_at?: string;
  can_apply_for_verification: boolean;
  profile_completion_percentage: number;
  rejection_reason?: string;
}

export interface VerificationApplication {
  verification_status: 'pending';
  verification_requested: boolean;
  verification_requested_at: string;
}

export class VerificationAPI {
  /**
   * Check if user is eligible for verification
   */
  static async checkEligibility(): Promise<ApiResponse<VerificationEligibility>> {
    return apiService.get<VerificationEligibility>('/verification/eligibility');
  }

  /**
   * Apply for blue check verification
   */
  static async applyForVerification(): Promise<ApiResponse<VerificationApplication>> {
    return apiService.post<VerificationApplication>('/verification/apply');
  }

  /**
   * Get current verification status
   */
  static async getVerificationStatus(): Promise<ApiResponse<VerificationStatus>> {
    return apiService.get<VerificationStatus>('/verification/status');
  }

  /**
   * Admin: Approve verification (admin only)
   */
  static async approveVerification(userId: string): Promise<ApiResponse<{ user_id: string; is_verified: boolean; verified_at: string }>> {
    return apiService.post<{ user_id: string; is_verified: boolean; verified_at: string }>(`/verification/approve/${userId}`);
  }

  /**
   * Admin: Reject verification (admin only)
   */
  static async rejectVerification(userId: string, reason?: string): Promise<ApiResponse<{ user_id: string; verification_status: string; rejection_reason: string }>> {
    return apiService.post<{ user_id: string; verification_status: string; rejection_reason: string }>(`/verification/reject/${userId}`, { reason });
  }
}

export default VerificationAPI;