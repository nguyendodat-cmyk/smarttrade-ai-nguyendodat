/**
 * SmartTrade AI - Bloomberg Grade Theme System
 * Centralized export for all theme tokens
 */

export * from './colors'
export * from './typography'
export * from './spacing'

import { colors, getPriceColor, getSemanticColor, withOpacity } from './colors'
import { fonts, fontSizes, fontWeights, lineHeights, letterSpacing, typography, textStyles } from './typography'
import { spacing, borderRadius, borderWidth, shadows, layout, zIndex, touchTarget, radius } from './spacing'

// Combined theme object for easy access
export const theme = {
  colors,
  fonts,
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacing,
  typography,
  textStyles,
  spacing,
  borderRadius,
  borderWidth,
  shadows,
  layout,
  zIndex,
  touchTarget,
  radius,
} as const

// Utility functions
export { getPriceColor, getSemanticColor, withOpacity }

export type Theme = typeof theme

// Default export
export default theme
