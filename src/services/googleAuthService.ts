// src/services/googleAuthService.ts
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Alert } from 'react-native';
import { authApi } from './api/auth';
import { API_CONFIG } from '../constants/api';

WebBrowser.maybeCompleteAuthSession();

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  verified_email: boolean;
}

export interface GoogleAuthResult {
  success: boolean;
  user?: GoogleUser;
  accessToken?: string;
  token?: string;
  userId?: string;
  error?: string;
}

class GoogleAuthService {
  private static instance: GoogleAuthService;
  
  // Google OAuth Configuration - Replace with your actual IDs
  private readonly config = {
    expoClientId: 'YOUR_EXPO_CLIENT_ID.apps.googleusercontent.com',
    iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com', 
    androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
    webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  };

  // Check if Google OAuth is configured
  private isConfigured(): boolean {
    return !this.config.expoClientId.includes('YOUR_') && 
           !this.config.androidClientId.includes('YOUR_');
  }

  private constructor() {}

  public static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }

  // Create Google auth request - FIXED VERSION
  public createAuthRequest() {
    return Google.useAuthRequest({
      expoClientId: this.config.expoClientId,
      iosClientId: this.config.iosClientId,
      androidClientId: this.config.androidClientId,
      webClientId: this.config.webClientId,
      scopes: ['openid', 'profile', 'email'],
      // REMOVED the problematic responseType line
    });
  }

  // Get user info from Google
  private async getUserInfo(accessToken: string): Promise<GoogleUser> {
    try {
      const userInfoResponse = await fetch(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!userInfoResponse.ok) {
        throw new Error('Failed to fetch user information');
      }

      const userData = await userInfoResponse.json();
      return userData;
    } catch (error) {
      console.error('Error fetching user info:', error);
      throw new Error('Failed to get user information from Google');
    }
  }

  // Handle Google authentication
  public async handleGoogleAuth(
    authentication: any,
    isSignUp: boolean = false
  ): Promise<GoogleAuthResult> {
    try {
      if (!authentication || !authentication.accessToken) {
        return {
          success: false,
          error: 'No access token received from Google'
        };
      }

      console.log('Getting user info from Google...');
      
      // Get user information from Google
      const googleUser = await this.getUserInfo(authentication.accessToken);

      console.log('Google user info:', googleUser);

      // Send to backend for processing (backend expects different format)
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          googleToken: authentication.accessToken,
          firstName: googleUser.given_name,
          lastName: googleUser.family_name, 
          email: googleUser.email,
          googleId: googleUser.id
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return {
          success: false,
          error: result.message || 'Google authentication failed'
        };
      }

      return {
        success: true,
        user: googleUser,
        accessToken: authentication.accessToken,
        token: result.data?.token,
        refreshToken: result.data?.refreshToken,
        userId: result.data?.user?.id,
        ...result.data
      };

    } catch (error: any) {
      console.error('Google auth error:', error);
      return {
        success: false,
        error: error.message || 'Google authentication failed'
      };
    }
  }

  // Sign up with Google
  public async signUpWithGoogle(
    promptAsync: () => Promise<any>
  ): Promise<GoogleAuthResult> {
    try {
      console.log('Starting Google sign up...');
      
      // Check if Google OAuth is properly configured
      if (!this.isConfigured()) {
        return {
          success: false,
          error: 'Google OAuth is not configured. Please use Email sign up instead.'
        };
      }
      
      const result = await promptAsync();
      console.log('Google auth result:', result);

      if (result.type === 'success') {
        return await this.handleGoogleAuth(result.authentication, true);
      } else if (result.type === 'cancel') {
        return {
          success: false,
          error: 'Google sign up was cancelled'
        };
      } else {
        return {
          success: false,
          error: result.error?.message || 'Google sign up failed'
        };
      }
    } catch (error: any) {
      console.error('Google sign up error:', error);
      return {
        success: false,
        error: error.message || 'Google sign up failed'
      };
    }
  }

  // Sign in with Google
  public async signInWithGoogle(
    promptAsync: () => Promise<any>
  ): Promise<GoogleAuthResult> {
    try {
      console.log('Starting Google sign in...');
      
      const result = await promptAsync();
      console.log('Google auth result:', result);

      if (result.type === 'success') {
        return await this.handleGoogleAuth(result.authentication, false);
      } else if (result.type === 'cancel') {
        return {
          success: false,
          error: 'Google sign in was cancelled'
        };
      } else {
        return {
          success: false,
          error: result.error?.message || 'Google sign in failed'
        };
      }
    } catch (error: any) {
      console.error('Google sign in error:', error);
      return {
        success: false,
        error: error.message || 'Google sign in failed'
      };
    }
  }
}

export const googleAuthService = GoogleAuthService.getInstance();