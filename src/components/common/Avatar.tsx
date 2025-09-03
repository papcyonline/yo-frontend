// src/components/common/Avatar.tsx - Reusable Avatar Component
import React, { useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getSystemFont } from '../../config/constants';
import { getBestAvatarUrl } from '../../utils/imageHelpers';

interface AvatarProps {
  user?: {
    profile_photo_url?: string;
    profile_picture_url?: string;
    profilePhotoUrl?: string;
    profilePictureUrl?: string;
    avatarUrl?: string;
    avatar_url?: string;
    profileImage?: string;
    first_name?: string;
    last_name?: string;
    fullName?: string;
    name?: string;
    username?: string;
  };
  size?: number;
  fontSize?: number;
  gradientColors?: string[];
  style?: any;
  textStyle?: any;
}

export const Avatar: React.FC<AvatarProps> = ({
  user,
  size = 50,
  fontSize = 18,
  gradientColors = ['#0091ad', '#04a7c7', '#fcd3aa'],
  style,
  textStyle
}) => {
  const [imageError, setImageError] = useState(false);
  // Get avatar URL using helper function
  const avatarUrl = getBestAvatarUrl(user);

  // Get user initials
  const getUserInitials = () => {
    if (!user) return 'U';
    
    const fullName = user.fullName || user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim();
    if (fullName && fullName !== 'User' && fullName.trim()) {
      return fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    
    const firstName = user.username || user.first_name || 'User';
    return firstName[0]?.toUpperCase() || 'U';
  };

  const initials = getUserInitials();
  const borderRadius = size / 2;

  // Debug logging
  console.log('🖼️ Avatar Debug:', {
    user: user?.first_name,
    avatarUrl,
    hasProfilePhotoUrl: !!user?.profile_photo_url,
    profilePhotoUrl: user?.profile_photo_url,
    hasProfilePictureUrl: !!user?.profile_picture_url,
    profilePictureUrl: user?.profile_picture_url
  });

  const dynamicStyles = StyleSheet.create({
    avatar: {
      width: size,
      height: size,
      borderRadius: borderRadius,
      justifyContent: 'center',
      alignItems: 'center',
      ...style
    },
    avatarImage: {
      width: size,
      height: size,
      borderRadius: borderRadius,
    },
    avatarText: {
      fontSize: fontSize,
      fontFamily: getSystemFont('bold'),
      color: '#ffffff',
      ...textStyle
    }
  });

  return (
    <LinearGradient
      colors={gradientColors.length >= 2 ? gradientColors as [string, string, ...string[]] : ['#0091ad', '#04a7c7']}
      style={dynamicStyles.avatar}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {avatarUrl && !imageError ? (
        <Image
          source={{ uri: avatarUrl }}
          style={dynamicStyles.avatarImage}
          onError={(error) => {
            console.log('❌ Avatar image failed to load:', avatarUrl, error.nativeEvent.error);
            setImageError(true);
          }}
          onLoad={() => {
            console.log('✅ Avatar image loaded successfully:', avatarUrl);
          }}
        />
      ) : (
        <Text style={dynamicStyles.avatarText}>{initials}</Text>
      )}
    </LinearGradient>
  );
};

export default Avatar;