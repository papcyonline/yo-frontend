// src/constants/layout.ts
import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const LAYOUT = {
  // Screen dimensions
  screen: {
    width: screenWidth,
    height: screenHeight,
  },
  
  // Border radius
  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    full: 9999,
  },
  
  // Shadows
  shadow: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
    },
  },
  
  // Component sizes
  component: {
    button: {
      height: {
        small: 36,
        medium: 44,
        large: 52,
      },
      minWidth: {
        small: 80,
        medium: 100,
        large: 120,
      },
    },
    input: {
      height: {
        small: 40,
        medium: 48,
        large: 56,
      },
    },
    avatar: {
      small: 32,
      medium: 48,
      large: 64,
      xlarge: 80,
    },
    icon: {
      small: 16,
      medium: 20,
      large: 24,
      xlarge: 32,
    },
  },
  
  // Header heights
  header: {
    default: 56,
    large: 80,
    withStatus: 80, // Includes status bar
  },
  
  // Tab bar
  tabBar: {
    height: 60,
    paddingBottom: 8,
  },
} as const;