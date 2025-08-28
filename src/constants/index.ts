// src/constants/index.ts - Main export file
import { COLORS, THEME_COLORS } from './colors';
import { FONTS } from './fonts';
import { SPACING } from './spacing';
import { LAYOUT } from './layout';
import { ANIMATIONS } from './animation';
import { APP } from './app';

// Re-export all constants
export { COLORS, THEME_COLORS } from './colors';
export { FONTS } from './fonts';
export { SPACING } from './spacing';
export { LAYOUT } from './layout';
export { ANIMATIONS } from './animation';
export { APP } from './app';

// Combined theme object for easy access
export const THEME = {
  colors: COLORS,
  themeColors: THEME_COLORS,
  fonts: FONTS,
  spacing: SPACING,
  layout: LAYOUT,
  animations: ANIMATIONS,
  app: APP,
} as const;

// Helper functions
export const getMatchColor = (percentage: number) => {
  if (percentage >= 80) return COLORS.matchHigh;
  if (percentage >= 50) return COLORS.matchMedium;
  return COLORS.matchLow;
};

export const getThemeColor = (section: keyof typeof THEME_COLORS) => {
  return THEME_COLORS[section];
};

export const createShadow = (type: keyof typeof LAYOUT.shadow) => {
  return LAYOUT.shadow[type];
};

// Type definitions for better TypeScript support
export type ColorKey = keyof typeof COLORS;
export type FontKey = keyof typeof FONTS.family;
export type SpacingKey = keyof typeof SPACING;
export type LayoutKey = keyof typeof LAYOUT;