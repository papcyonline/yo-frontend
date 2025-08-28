// src/constants/colors.ts
// YoFam Color Palette
export const COLORS = {
  // Primary colors (warm and family-focused)
  primary: '#FF6B35',        // Warm orange - main brand color
  primaryLight: '#FF8A65',   // Lighter orange
  primaryDark: '#E64A19',    // Darker orange
  
  // Secondary colors
  secondary: '#1E3A8A',      // Deep blue - trust and discovery
  secondaryLight: '#3B82F6', // Lighter blue
  secondaryDark: '#1E40AF',  // Darker blue
  
  // Accent colors
  accent: '#10B981',         // Green - growth and new beginnings
  accentLight: '#34D399',    // Lighter green
  accentDark: '#059669',     // Darker green
  
  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  
  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Background colors - Improved for better visibility
  background: '#F5F5F5',           // Light gray instead of pure white
  backgroundSecondary: '#FAFAFA',   // Very light gray
  surface: '#FFFFFF',               // Keep white for cards
  
  // Text colors - Maximum contrast
  textPrimary: '#000000',           // Pure black for maximum readability
  textSecondary: '#333333',         // Dark gray for secondary text
  textTertiary: '#666666',          // Medium gray for tertiary text
  textWhite: '#FFFFFF',
  
  // Border colors - More visible
  border: '#CCCCCC',               // Medium gray for better visibility
  borderLight: '#E0E0E0',           // Light but visible
  borderDark: '#999999',            // Dark gray border
  
  // Match percentage colors
  matchHigh: '#10B981',      // 80%+ matches
  matchMedium: '#F59E0B',    // 50-79% matches
  matchLow: '#6B7280',       // <50% matches
  
  // Community colors
  communityCard: '#F9FAFB',
  communityActive: '#EBF8FF',
  
  // Transparent colors - Adjusted for better visibility
  overlay: 'rgba(0, 0, 0, 0.6)',        // Darker overlay for better contrast
  overlayLight: 'rgba(0, 0, 0, 0.4)',   // Medium overlay
  shadowColor: 'rgba(0, 0, 0, 0.15)',   // More pronounced shadows
  
  // Gradients
  gradients: {
    primary: ['#FF6B35', '#FF8A65'],
    secondary: ['#1E3A8A', '#3B82F6'],
    accent: ['#10B981', '#34D399'],
    warm: ['#FF6B35', '#F59E0B'],
    cool: ['#1E3A8A', '#10B981'],
    multiColor: ['#FF6B35', '#1E3A8A', '#10B981'],
    subtle: ['#F9FAFB', '#E5E7EB'],
  },
  
  // Alpha Colors (with transparency)
  alpha: {
    primary10: 'rgba(255, 107, 53, 0.1)',
    primary20: 'rgba(255, 107, 53, 0.2)',
    primary30: 'rgba(255, 107, 53, 0.3)',
    secondary20: 'rgba(30, 58, 138, 0.2)',
    accent20: 'rgba(16, 185, 129, 0.2)',
    accent30: 'rgba(16, 185, 129, 0.3)',
    white05: 'rgba(255, 255, 255, 0.05)',
    white10: 'rgba(255, 255, 255, 0.1)',
    white20: 'rgba(255, 255, 255, 0.2)',
    black50: 'rgba(0, 0, 0, 0.5)',
    black70: 'rgba(0, 0, 0, 0.7)',
    black80: 'rgba(0, 0, 0, 0.8)',
  },
} as const;

// Color theme for different sections
export const THEME_COLORS = {
  family: {
    primary: COLORS.primary,
    background: '#FFF2E6',      // Slightly tinted for better visibility
    text: COLORS.textPrimary,
  },
  friends: {
    primary: COLORS.secondary,
    background: '#E6F4FF',      // Slightly darker blue tint
    text: COLORS.textPrimary,
  },
  communities: {
    primary: COLORS.accent,
    background: '#E6FFF4',      // Slightly darker green tint
    text: COLORS.textPrimary,
  },
  ai: {
    primary: '#8B5CF6',
    background: '#F0EBFF',      // Slightly darker purple tint
    text: COLORS.textPrimary,
  },
};