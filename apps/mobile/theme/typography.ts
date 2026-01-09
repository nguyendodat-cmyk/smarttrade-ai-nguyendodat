/**
 * SmartTrade AI - Bloomberg Grade Typography System
 * Strict hierarchy with monospace numbers for trading data
 */

import { Platform, TextStyle } from 'react-native'

// Font families - System fonts for performance
export const fonts = {
  // Display & Headlines
  display: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'System',
  }),

  // Body text
  body: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'System',
  }),

  // Medium weight
  medium: Platform.select({
    ios: 'System',
    android: 'sans-serif-medium',
    default: 'System',
  }),

  // Numbers ONLY - Critical for trading app
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }),

  monoBold: Platform.select({
    ios: 'Menlo-Bold',
    android: 'monospace',
    default: 'monospace',
  }),

  // Legacy
  sans: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'System',
  }),

  sansBold: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'System',
  }),
} as const

// Font sizes
export const fontSizes = {
  xs: 9,
  sm: 11,
  base: 13,
  md: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 36,
} as const

// Line heights
export const lineHeights = {
  tight: 1.1,
  snug: 1.25,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
} as const

// Font weights
export const fontWeights = {
  thin: '100' as const,
  light: '300' as const,
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
}

// Letter spacing
export const letterSpacing = {
  tighter: -0.5,
  tight: -0.3,
  normal: 0,
  wide: 0.4,
  wider: 0.8,
  widest: 1.0,
} as const

// Typography presets - Bloomberg style
export const typography: Record<string, TextStyle> = {
  // Headlines
  h1: {
    fontSize: 32,
    fontFamily: fonts.display,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontFamily: fonts.display,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 20,
    fontFamily: fonts.display,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  h4: {
    fontSize: 17,
    fontFamily: fonts.display,
    fontWeight: '600',
  },

  // Body
  body: {
    fontSize: 15,
    fontFamily: fonts.body,
    fontWeight: '400',
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 13,
    fontFamily: fonts.body,
    fontWeight: '400',
    lineHeight: 18,
  },
  bodyLarge: {
    fontSize: 17,
    fontFamily: fonts.body,
    fontWeight: '400',
    lineHeight: 24,
  },

  // Labels - Uppercase with tracking
  label: {
    fontSize: 11,
    fontFamily: fonts.medium,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  labelSmall: {
    fontSize: 9,
    fontFamily: fonts.medium,
    fontWeight: '600',
    letterSpacing: 1.0,
    textTransform: 'uppercase',
  },

  // Numbers - ALWAYS MONOSPACE
  price: {
    fontSize: 28,
    fontFamily: fonts.monoBold,
    fontWeight: '700',
  },
  priceLarge: {
    fontSize: 36,
    fontFamily: fonts.monoBold,
    fontWeight: '700',
  },
  priceSmall: {
    fontSize: 17,
    fontFamily: fonts.mono,
    fontWeight: '600',
  },
  number: {
    fontSize: 15,
    fontFamily: fonts.mono,
    fontWeight: '400',
  },
  numberSmall: {
    fontSize: 13,
    fontFamily: fonts.mono,
    fontWeight: '400',
  },
  percent: {
    fontSize: 13,
    fontFamily: fonts.mono,
    fontWeight: '600',
  },

  // Legacy aliases
  change: {
    fontSize: 13,
    fontFamily: fonts.mono,
    fontWeight: '600',
  },
  caption: {
    fontSize: 11,
    fontFamily: fonts.body,
    fontWeight: '400',
    lineHeight: 14,
  },
  button: {
    fontSize: 15,
    fontFamily: fonts.medium,
    fontWeight: '600',
  },
  buttonSmall: {
    fontSize: 13,
    fontFamily: fonts.medium,
    fontWeight: '600',
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: fonts.medium,
    fontWeight: '500',
  },
  symbol: {
    fontSize: 15,
    fontFamily: fonts.mono,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
} as const

// Alias for backward compatibility
export const textStyles = typography

// Type exports
export type TextStyleKey = keyof typeof typography
export type FontSize = keyof typeof fontSizes
export type FontWeight = keyof typeof fontWeights
