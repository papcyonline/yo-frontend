// src/services/api/auth.ts
import { apiService } from './index';
import { API_ENDPOINTS } from '../../constants/api';

export interface RegisterRequest {
  email: string;   
  phone: string;      
  fullName: string;
  password: string;
}

export interface LoginRequest {
  emailOrUsername: string;
  password: string;
}

export interface GoogleAuthRequest {
  accessToken: string;
  idToken?: string;
  user: {
    id: string;
    email: string;
    name: string;
    picture?: string;
  };
  isSignUp: boolean;
}

export interface VerifyOTPRequest {
  userId: string;
  code: string;
}

export interface ResendOTPRequest {
  userId: string;
  type: 'phone' | 'email';
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  email?: string;
}

export interface SaveProfileAnswersRequest {
  userId: string;
  answers: string[];
  method: 'typing' | 'voice';
  conversationLog?: Array<{type: 'ai' | 'user', message: string}>;
  completedAt: string;
}

export const authApi = {
  register: async (data: RegisterRequest) => {
    return apiService.post(API_ENDPOINTS.REGISTER, data);
  },

  login: async (data: LoginRequest) => {
    return apiService.post(API_ENDPOINTS.LOGIN, data);
  },

  googleAuth: async (data: GoogleAuthRequest) => {
    return apiService.post(API_ENDPOINTS.GOOGLE_AUTH, data);
  },

  verifyPhone: async (data: VerifyOTPRequest) => {
    return apiService.post(API_ENDPOINTS.VERIFY_PHONE, data);
  },

  verifyEmail: async (data: VerifyOTPRequest) => {
    return apiService.post(API_ENDPOINTS.VERIFY_EMAIL, data);
  },

  resendOTP: async (data: ResendOTPRequest) => {
    return apiService.post(API_ENDPOINTS.RESEND_OTP, data);
  },

  forgotPassword: async (email: string) => {
    return apiService.post(API_ENDPOINTS.FORGOT_PASSWORD, { email });
  },

  resetPassword: async (data: ResetPasswordRequest) => {
    return apiService.post(API_ENDPOINTS.RESET_PASSWORD, data);
  },

  saveProfileAnswers: async (data: SaveProfileAnswersRequest) => {
    return apiService.post(API_ENDPOINTS.SAVE_PROFILE_ANSWERS, data);
  },
};