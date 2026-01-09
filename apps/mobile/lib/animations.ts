/**
 * SmartTrade AI v1.2.0 - Animation Presets
 * Consistent spring and timing configurations
 */

import { withSpring, withTiming, Easing } from 'react-native-reanimated'

// Spring configurations
export const springConfig = {
  // Fast & snappy - for quick interactions
  snappy: {
    damping: 15,
    stiffness: 300,
    mass: 0.5,
  },

  // Smooth & bouncy - for playful animations
  bouncy: {
    damping: 10,
    stiffness: 150,
    mass: 1,
  },

  // Gentle - for subtle transitions
  gentle: {
    damping: 20,
    stiffness: 100,
    mass: 1,
  },

  // Default - balanced
  default: {
    damping: 15,
    stiffness: 200,
    mass: 0.8,
  },

  // Button press
  press: {
    damping: 15,
    stiffness: 400,
  },
}

// Timing configurations
export const timingConfig = {
  // Fast - 150ms
  fast: {
    duration: 150,
    easing: Easing.out(Easing.cubic),
  },

  // Normal - 250ms
  normal: {
    duration: 250,
    easing: Easing.inOut(Easing.cubic),
  },

  // Slow - 400ms
  slow: {
    duration: 400,
    easing: Easing.inOut(Easing.cubic),
  },

  // Very slow - 600ms
  verySlow: {
    duration: 600,
    easing: Easing.inOut(Easing.cubic),
  },
}

// Entrance animation presets (for Reanimated entering prop)
export const entranceAnimations = {
  fadeInUp: {
    from: { opacity: 0, translateY: 20 },
    to: { opacity: 1, translateY: 0 },
  },

  fadeInDown: {
    from: { opacity: 0, translateY: -20 },
    to: { opacity: 1, translateY: 0 },
  },

  scaleIn: {
    from: { opacity: 0, scale: 0.9 },
    to: { opacity: 1, scale: 1 },
  },

  slideInRight: {
    from: { opacity: 0, translateX: 50 },
    to: { opacity: 1, translateX: 0 },
  },

  slideInLeft: {
    from: { opacity: 0, translateX: -50 },
    to: { opacity: 1, translateX: 0 },
  },
}

// Helper functions
export const animate = {
  // Spring with snappy config
  snappy: (value: number) => withSpring(value, springConfig.snappy),

  // Spring with bouncy config
  bouncy: (value: number) => withSpring(value, springConfig.bouncy),

  // Spring with gentle config
  gentle: (value: number) => withSpring(value, springConfig.gentle),

  // Spring with default config
  spring: (value: number) => withSpring(value, springConfig.default),

  // Timing with fast config
  fast: (value: number) => withTiming(value, timingConfig.fast),

  // Timing with normal config
  normal: (value: number) => withTiming(value, timingConfig.normal),

  // Timing with slow config
  slow: (value: number) => withTiming(value, timingConfig.slow),
}

export default {
  springConfig,
  timingConfig,
  entranceAnimations,
  animate,
}
