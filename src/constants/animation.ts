// src/constants/animations.ts
export const ANIMATIONS = {
  // Durations (in milliseconds)
  duration: {
    fast: 150,
    normal: 250,
    slow: 350,
    verySlow: 500,
  },
  
  // Easing functions
  easing: {
    linear: 'linear',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
  
  // Common animation configs
  spring: {
    tension: 100,
    friction: 8,
  },
  
  // Timing configs
  timing: {
    fast: { duration: 150 },
    normal: { duration: 250 },
    slow: { duration: 350 },
  },
} as const;