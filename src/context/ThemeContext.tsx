import React, { createContext, useContext, ReactNode } from 'react';

// Theme colors
export const themes = {
  light: {
    // Background colors - High contrast light design
    background: '#F5F5F5',           // Light gray background for better contrast
    surface: '#FFFFFF',              // Pure white for cards/surfaces
    card: '#FFFFFF',                 // White cards with good shadows
    
    // Text colors - Maximum contrast for readability
    text: '#000000',                 // Pure black for maximum readability
    textSecondary: '#333333',        // Dark gray for secondary text
    textTertiary: '#666666',         // Medium gray for tertiary text
    
    // Primary colors - Adjusted for light mode visibility
    primary: '#006B7D',              // Darker teal for better contrast on white
    primaryDark: '#004A5C',          // Even darker for hover states
    accent: '#FF8C00',               // Dark orange for excellent visibility
    
    // Status colors - High contrast versions
    success: '#008A00',              // Dark green for strong contrast
    warning: '#CC6600',              // Dark orange/brown
    error: '#CC0000',                // Dark red for clear visibility
    
    // Border and divider colors - More visible
    border: '#CCCCCC',               // Medium gray borders (more visible)
    divider: '#E0E0E0',              // Light gray dividers but visible
    
    // Shadow colors - More pronounced for depth
    shadow: '#000000',
    shadowOpacity: 0.15,             // Increased for better depth perception
    
    // Input colors - Clear boundaries
    inputBackground: '#FFFFFF',      // White input backgrounds
    inputBorder: '#999999',          // Darker borders for clear definition
    inputFocusBorder: '#006B7D',     // Dark teal focus border
    placeholder: '#808080',          // Medium gray placeholder text
    
    // Button colors
    buttonText: '#FFFFFF',           // White text on colored buttons
    buttonDisabled: '#E0E0E0',       // Gray disabled state
    buttonDisabledText: '#999999',   // Dark gray disabled text
    
    // Header - High contrast
    headerBackground: '#FFFFFF',      // White header
    headerText: '#000000',           // Black text for maximum contrast
    
    // Additional light mode colors
    overlay: 'rgba(0, 0, 0, 0.3)',   // Darker overlay for visibility
    shimmer: '#E0E0E0',              // Loading shimmer color
    highlight: '#E6F3FF',            // Light blue highlight
    
    // Special light mode additions for better visibility
    cardShadow: 'rgba(0, 0, 0, 0.12)',  // Card shadows
    activeBg: '#F0F0F0',                // Active/selected background
    hoverBg: '#FAFAFA',                 // Hover state background
  },
  dark: {
    // Background colors
    background: '#000000',
    surface: '#1A1A1A',
    card: '#1A1A1A',
    
    // Text colors
    text: '#FFFFFF',
    textSecondary: '#CCCCCC',
    textTertiary: '#999999',
    
    // Primary colors (same in both themes)
    primary: '#0091ad',
    primaryDark: '#04a7c7',
    accent: '#fcd3aa',
    
    // Status colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    
    // Border and divider colors
    border: '#333333',
    divider: '#2A2A2A',
    
    // Shadow colors
    shadow: '#fcd3aa',
    shadowOpacity: 0.1,
    
    // Input colors
    inputBackground: '#1A1A1A',
    inputBorder: '#333333',
    inputFocusBorder: '#0091ad',
    placeholder: '#666666',
    
    // Button colors
    buttonText: '#FFFFFF',
    buttonDisabled: '#333333',
    buttonDisabledText: '#666666',
    
    // Header
    headerBackground: '#0091ad',
    headerText: '#FFFFFF',
    
    // Additional dark mode colors
    overlay: 'rgba(0, 0, 0, 0.5)',
    shimmer: '#2A2A2A',
    highlight: '#1A3A4A',
    
    // Special dark mode additions
    cardShadow: 'rgba(0, 145, 173, 0.1)',
    activeBg: '#2A2A2A',
    hoverBg: '#252525',
  },
};

export type Theme = typeof themes.light;
export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // App is now dark mode only
  const isDark = true;
  const theme = themes.dark;
  
  console.log('🎨 ThemeProvider - DARK MODE ONLY - background:', theme.background);

  // No-op functions since theme switching is disabled
  const toggleTheme = () => {
    console.log('🎨 Theme switching is disabled - app is dark mode only');
  };

  const setTheme = (mode: ThemeMode) => {
    console.log('🎨 Theme switching is disabled - app is dark mode only');
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};