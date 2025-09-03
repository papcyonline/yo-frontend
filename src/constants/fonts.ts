// src/constants/fonts.ts
// Using system default fonts instead of custom fonts
export const FONTS = {
  // Font Families - Using system fonts
  family: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
  },
  
  // Font Sizes
  size: {
    xs: 10,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
    '4xl': 28,
    '5xl': 32,
    '6xl': 36,
    '7xl': 48,
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },
  
  // Common Font Combinations (Ready to use)
  text: {
    // Headers
    h1: {
      fontWeight: '700' as const,
      fontSize: 32,
      lineHeight: 38,
    },
    h2: {
      fontWeight: '700' as const,
      fontSize: 28,
      lineHeight: 34,
    },
    h3: {
      fontWeight: '700' as const,
      fontSize: 24,
      lineHeight: 30,
    },
    h4: {
      fontWeight: '600' as const,
      fontSize: 20,
      lineHeight: 26,
    },
    h5: {
      fontWeight: '600' as const,
      fontSize: 18,
      lineHeight: 24,
    },
    h6: {
      fontWeight: '600' as const,
      fontSize: 16,
      lineHeight: 22,
    },
    
    // Body Text
    bodyLarge: {
      fontWeight: '400' as const,
      fontSize: 16,
      lineHeight: 24,
    },
    body: {
      fontWeight: '400' as const,
      fontSize: 14,
      lineHeight: 20,
    },
    bodySmall: {
      fontWeight: '400' as const,
      fontSize: 12,
      lineHeight: 18,
    },
    
    // Captions and Labels
    caption: {
      fontWeight: '500' as const,
      fontSize: 12,
      lineHeight: 16,
    },
    label: {
      fontWeight: '600' as const,
      fontSize: 14,
      lineHeight: 20,
    },
    
    // Buttons
    button: {
      fontWeight: '600' as const,
      fontSize: 16,
      lineHeight: 20,
    },
    buttonSmall: {
      fontWeight: '600' as const,
      fontSize: 14,
      lineHeight: 18,
    },
  },
} as const;