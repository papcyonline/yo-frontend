// src/utils/imageHelpers.ts - Image URL utility functions

interface User {
  profile_photo_url?: string;
  profile_picture_url?: string;
  profilePhotoUrl?: string;
  profilePictureUrl?: string;
  avatarUrl?: string;
  avatar_url?: string;
  profileImage?: string;
}

/**
 * Get the best available avatar URL for a user, prioritizing Cloudinary URLs
 * over local URLs that might point to wrong ports or be outdated
 */
export const getBestAvatarUrl = (user?: User | null): string | null => {
  if (!user) return null;
  
  const urls = [
    user.profile_photo_url,
    user.profilePhotoUrl, 
    user.profile_picture_url,
    user.profilePictureUrl,
    user.avatarUrl,
    user.avatar_url,
    user.profileImage
  ];
  
  // First priority: Cloudinary URLs (these should always work)
  const cloudinaryUrl = urls.find(url => url && url.includes('cloudinary.com'));
  if (cloudinaryUrl) return cloudinaryUrl;
  
  // Second priority: URLs that don't point to wrong ports
  const validUrl = urls.find(url => url && !url.includes(':3010'));
  if (validUrl) return validUrl;
  
  // Last resort: any URL (likely to fail but better than nothing)
  return urls.find(url => url) || null;
};

/**
 * Check if a URL is likely to be valid/accessible
 */
export const isValidImageUrl = (url?: string): boolean => {
  if (!url) return false;
  
  // Cloudinary URLs are generally reliable
  if (url.includes('cloudinary.com')) return true;
  
  // Avoid URLs pointing to wrong ports that we know are problematic
  if (url.includes(':3010')) return false;
  
  // Basic URL validation
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};