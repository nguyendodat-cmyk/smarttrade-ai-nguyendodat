/**
 * SmartTrade AI - Spacing System
 * 4px base unit for consistent spacing
 */

// Base spacing unit (4px)
const BASE_UNIT = 4

// Spacing scale
export const spacing = {
  0: 0,
  0.5: BASE_UNIT * 0.5,  // 2px
  1: BASE_UNIT,          // 4px
  1.5: BASE_UNIT * 1.5,  // 6px
  2: BASE_UNIT * 2,      // 8px
  2.5: BASE_UNIT * 2.5,  // 10px
  3: BASE_UNIT * 3,      // 12px
  3.5: BASE_UNIT * 3.5,  // 14px
  4: BASE_UNIT * 4,      // 16px
  5: BASE_UNIT * 5,      // 20px
  6: BASE_UNIT * 6,      // 24px
  7: BASE_UNIT * 7,      // 28px
  8: BASE_UNIT * 8,      // 32px
  9: BASE_UNIT * 9,      // 36px
  10: BASE_UNIT * 10,    // 40px
  11: BASE_UNIT * 11,    // 44px
  12: BASE_UNIT * 12,    // 48px
  14: BASE_UNIT * 14,    // 56px
  16: BASE_UNIT * 16,    // 64px
  20: BASE_UNIT * 20,    // 80px
  24: BASE_UNIT * 24,    // 96px
  28: BASE_UNIT * 28,    // 112px
  32: BASE_UNIT * 32,    // 128px
} as const

// Border radius
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
} as const

// Border widths
export const borderWidth = {
  0: 0,
  1: 1,
  2: 2,
  4: 4,
} as const

// Shadows (Android elevation + iOS shadow)
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 3,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
} as const

// Touch targets - minimum 44x44 for accessibility
export const touchTarget = {
  min: 44,
  comfortable: 48,
  large: 56,
}

// Radius shortcuts
export const radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
}

// Layout constants - v1.2.0 REDUCED PADDING
export const layout = {
  // Screen padding - REDUCED from 16px to 12px
  screenPadding: 12,                   // 12px (was 16px)
  screenPaddingHorizontal: 12,         // 12px (was 16px)
  screenPaddingVertical: spacing[4],   // 16px

  // Card padding
  cardPadding: spacing[4],             // 16px
  cardPaddingSmall: spacing[3],        // 12px

  // Component gaps
  gapXs: spacing[1],                   // 4px
  gapSm: spacing[2],                   // 8px
  gapMd: spacing[3],                   // 12px
  gapLg: spacing[4],                   // 16px
  gapXl: spacing[6],                   // 24px

  // Section spacing
  sectionGap: spacing[6],              // 24px

  // Horizontal scroll
  horizontalScrollPadding: 12,
  horizontalScrollGap: 10,

  // Touch targets (minimum 44px for accessibility)
  touchTarget: touchTarget.min,
  touchTargetSmall: 36,

  // Tab bar
  tabBarHeight: 60,
  tabBarPadding: spacing[2],

  // Header
  headerHeight: 56,

  // Bottom sheet
  bottomSheetHandle: 4,
  bottomSheetHandleWidth: 40,

  // Input heights
  inputHeight: 48,
  inputHeightSmall: 40,
  inputHeightLarge: 56,

  // Button heights
  buttonHeight: 48,
  buttonHeightSmall: 36,
  buttonHeightLarge: 56,

  // Icon sizes
  iconSizeXs: 12,
  iconSizeSm: 16,
  iconSizeMd: 20,
  iconSizeLg: 24,
  iconSizeXl: 32,

  // Avatar sizes
  avatarSizeSm: 32,
  avatarSizeMd: 40,
  avatarSizeLg: 56,
  avatarSizeXl: 80,
} as const

// Z-index levels
export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
  toast: 80,
} as const

// Type exports
export type Spacing = keyof typeof spacing
export type BorderRadius = keyof typeof borderRadius
export type Shadow = keyof typeof shadows
