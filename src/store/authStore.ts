import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

export interface AuthState {
  // Auth state
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;

  // Terms & Privacy state
  termsAccepted: boolean;
  privacyAccepted: boolean;
  needsTermsUpdate: boolean;

  // Onboarding state
  hasCompletedOnboarding: boolean;
  selectedLanguage: string | null;
  registrationData: {
    email: string;
    phone: string;
    fullName: string;
    userId?: string;
  } | null;

  // Profile sync state
  profileLastUpdated: number | null;
  profileSyncInProgress: boolean;

  // Actions
  setUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  setToken: (token: string) => void;
  setRefreshToken: (refreshToken: string) => void;
  setTokens: (token: string, refreshToken: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLanguage: (language: string) => void;
  setRegistrationData: (data: any) => void;
  completeOnboarding: () => void;
  logout: () => Promise<void>;
  clearError: () => void;
  
  // Terms & Privacy actions
  setTermsAccepted: (accepted: boolean) => void;
  setPrivacyAccepted: (accepted: boolean) => void;
  setNeedsTermsUpdate: (needsUpdate: boolean) => void;
  
  // Profile sync actions
  syncProfileFromBackend: () => Promise<void>;
  markProfileUpdated: () => void;
  setProfileSyncInProgress: (inProgress: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,
      error: null,
      termsAccepted: false,
      privacyAccepted: false,
      needsTermsUpdate: false,
      hasCompletedOnboarding: false,
      selectedLanguage: null,
      registrationData: null,
      profileLastUpdated: null,
      profileSyncInProgress: false,

      // Actions
      setUser: (user: User) => set({ 
        user, 
        isAuthenticated: true, 
        profileLastUpdated: Date.now(),
        hasCompletedOnboarding: user.profile_complete || user.profile_completed || false
      }),
      
      updateUser: (updates: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...updates };
          set({ 
            user: updatedUser, 
            profileLastUpdated: Date.now(),
            hasCompletedOnboarding: updatedUser.profile_complete || updatedUser.profile_completed || false
          });
        }
      },
      
      setToken: (token: string) => set({ token }),
      
      setRefreshToken: (refreshToken: string) => set({ refreshToken }),
      
      setTokens: (token: string, refreshToken: string) => set({ token, refreshToken }),
      
      setLoading: (isLoading: boolean) => set({ isLoading }),
      
      setError: (error: string | null) => set({ error }),
      
      setLanguage: (selectedLanguage: string) => set({ selectedLanguage }),
      
      setRegistrationData: (registrationData: any) => set({ registrationData }),
      
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      
      logout: async () => {
        const { token } = get();
        
        // Call backend logout endpoint if token exists
        if (token) {
          try {
            const { API_BASE_URL } = await import('../config/constants');
            await fetch(`${API_BASE_URL}/auth/logout`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
          } catch (error) {
            console.error('Backend logout error:', error);
            // Continue with local logout even if backend fails
          }
        }
        
        // Clear all local state
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          refreshToken: null,
          error: null,
          termsAccepted: false,
          privacyAccepted: false,
          needsTermsUpdate: false,
          registrationData: null,
          profileLastUpdated: null,
          profileSyncInProgress: false,
        });
        
        // Clear AsyncStorage
        try {
          await AsyncStorage.removeItem('auth-storage');
        } catch (error) {
          console.error('Error clearing AsyncStorage:', error);
        }
      },
      
      clearError: () => set({ error: null }),

      // Terms & Privacy actions
      setTermsAccepted: (termsAccepted: boolean) => set({ termsAccepted }),
      setPrivacyAccepted: (privacyAccepted: boolean) => set({ privacyAccepted }),
      setNeedsTermsUpdate: (needsTermsUpdate: boolean) => set({ needsTermsUpdate }),

      // Profile sync actions
      syncProfileFromBackend: async () => {
        const { token, setProfileSyncInProgress, setUser, setError } = get();
        if (!token) return;

        try {
          setProfileSyncInProgress(true);
          
          // Import MongoUserService dynamically to avoid circular dependencies
          const { MongoUserService } = await import('../services/MongoUserService');
          const updatedUser = await MongoUserService.getCurrentUser();
          
          if (updatedUser) {
            setUser(updatedUser);
          }
        } catch (error) {
          console.error('Failed to sync profile from backend:', error);
          setError('Failed to sync profile data');
        } finally {
          setProfileSyncInProgress(false);
        }
      },

      markProfileUpdated: () => set({ profileLastUpdated: Date.now() }),

      setProfileSyncInProgress: (profileSyncInProgress: boolean) => set({ profileSyncInProgress }),
    }),
    {
      name: 'yofam-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        selectedLanguage: state.selectedLanguage,
        profileLastUpdated: state.profileLastUpdated,
      }),
    }
  )
);