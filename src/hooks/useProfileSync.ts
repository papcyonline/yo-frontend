// src/hooks/useProfileSync.ts
import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

/**
 * Hook to automatically sync profile data when user data changes
 * This ensures all components stay in sync with the latest profile data
 */
export const useProfileSync = () => {
  const { user, syncProfileFromBackend, profileSyncInProgress, profileLastUpdated } = useAuthStore();

  useEffect(() => {
    // Auto-sync profile when component mounts if we have a user but no recent sync
    if (user && !profileSyncInProgress) {
      const now = Date.now();
      const lastUpdated = profileLastUpdated || 0;
      const fiveMinutesAgo = now - (5 * 60 * 1000);

      // Sync if we haven't synced in the last 5 minutes
      if (lastUpdated < fiveMinutesAgo) {
        syncProfileFromBackend();
      }
    }
  }, [user?.id]); // Only re-run if user ID changes

  return {
    user,
    isLoading: profileSyncInProgress,
    lastUpdated: profileLastUpdated
  };
};

/**
 * Hook specifically for components that display user profile information
 * Provides common profile display utilities
 */
export const useProfileDisplay = () => {
  const { user } = useProfileSync();

  const getDisplayName = () => {
    if (user?.fullName && user.fullName !== 'User') {
      return user.fullName;
    }
    if ((user as any)?.name && (user as any).name !== 'User') {
      return (user as any).name;
    }
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user?.first_name) {
      return user.first_name;
    }
    return 'User';
  };

  const getFirstName = () => {
    return getDisplayName().split(' ')[0] || 'User';
  };

  const getUserInitials = () => {
    const name = getDisplayName();
    if (name === 'User') return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name[0]?.toUpperCase() || 'U';
  };

  const getUserAvatar = () => {
    return user?.avatarUrl || (user as any)?.avatar_url || (user as any)?.profileImage || null;
  };

  const isProfileComplete = () => {
    return user?.profile_complete || user?.profile_completed || false;
  };

  return {
    user,
    getDisplayName,
    getFirstName,
    getUserInitials,
    getUserAvatar,
    isProfileComplete
  };
};