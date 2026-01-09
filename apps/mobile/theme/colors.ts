/**
 * SmartTrade AI v1.2.0 - Complete Theme System
 * Light + Dark themes with Vietnam stock market colors
 * FIXED: Light theme cards now properly use light backgrounds
 */

// ===== DARK THEME (Bloomberg-grade) =====
export const darkTheme = {
  // Backgrounds
  bg: {
    primary: '#000000',      // Pure black - main bg
    secondary: '#0A0A0A',    // Cards, elevated surfaces
    tertiary: '#111111',     // Subtle elevation
    elevated: '#1A1A1A',     // Modal, popover
    input: '#0D0D0D',        // Input fields
    card: '#0A0A0A',         // Card background - NEW
  },

  // Text
  text: {
    primary: '#FFFFFF',      // Main text
    secondary: '#A0A0A0',    // Secondary info
    tertiary: '#666666',     // Disabled, hints
    inverse: '#000000',      // On light backgrounds
  },

  // Brand
  brand: {
    primary: '#FF6B35',      // Main orange - CTAs
    secondary: '#FF8B5A',    // Hover/pressed state
    muted: 'rgba(255,107,53,0.15)', // Subtle backgrounds
  },

  // Semantic - Trading
  semantic: {
    positive: '#00D26A',     // Up, profit, buy
    negative: '#FF3B3B',     // Down, loss, sell
    warning: '#FFB800',      // Alerts, caution
    info: '#0A84FF',         // Information
  },

  // Stock Price Colors (Vietnam Market)
  stock: {
    ceiling: '#FF00FF',      // Trần - Magenta
    floor: '#00FFFF',        // Sàn - Cyan
    reference: '#FFD700',    // Tham chiếu - Gold
    up: '#00D26A',           // Tăng - Green
    down: '#FF3B3B',         // Giảm - Red
  },

  // Borders
  border: {
    primary: '#1F1F1F',      // Default borders
    secondary: '#2A2A2A',    // Subtle dividers
    focus: '#FF6B35',        // Focus state
  },

  // Tab bar - NEW
  tabBar: {
    background: '#0A0A0A',
    border: '#1F1F1F',
    active: '#FF6B35',
    inactive: '#666666',
  },

  // Chart
  chart: {
    line: '#0A84FF',
    area: 'rgba(10, 132, 255, 0.1)',
    grid: '#1A1A1A',
    candleUp: '#00D26A',
    candleDown: '#FF3B3B',
    volume: 'rgba(255, 107, 53, 0.5)',
  },

  // UI Elements
  ui: {
    skeleton: '#1A1A1A',
    shimmer: '#252525',
    overlay: 'rgba(0, 0, 0, 0.8)',
    divider: '#1A1A1A',
  },
} as const

// ===== LIGHT THEME - FIXED =====
export const lightTheme = {
  // Backgrounds - ALL LIGHT
  bg: {
    primary: '#FFFFFF',      // Main background - white
    secondary: '#F8F9FA',    // Subtle sections
    tertiary: '#F1F3F5',     // Subtle elevation
    elevated: '#FFFFFF',     // Modal, popover
    input: '#F5F5F5',        // Input fields
    card: '#FFFFFF',         // Card background - WHITE for light theme
  },

  // Text - DARK for contrast
  text: {
    primary: '#0A0A0A',      // Main text - near black
    secondary: '#4A4A4A',    // Secondary text
    tertiary: '#8A8A8A',     // Hints, labels
    inverse: '#FFFFFF',      // On dark backgrounds
  },

  // Brand (same as dark)
  brand: {
    primary: '#FF6B35',
    secondary: '#FF8B5A',
    muted: 'rgba(255,107,53,0.08)', // Lighter for light theme
  },

  // Semantic - Trading (brighter for light bg)
  semantic: {
    positive: '#00C853',     // Brighter green for light bg
    negative: '#FF1744',     // Brighter red
    warning: '#FF9100',
    info: '#2979FF',
  },

  // Stock Price Colors (Vietnam Market - adjusted for light bg)
  stock: {
    ceiling: '#9C27B0',      // Purple
    floor: '#00BCD4',        // Cyan
    reference: '#FFC107',    // Amber
    up: '#00C853',
    down: '#FF1744',
  },

  // Borders - SUBTLE
  border: {
    primary: '#E8E8E8',      // Card borders
    secondary: '#F0F0F0',    // Dividers
    focus: '#FF6B35',        // Focus state
  },

  // Tab bar - NEW
  tabBar: {
    background: '#FFFFFF',
    border: '#E8E8E8',
    active: '#FF6B35',
    inactive: '#8A8A8A',
  },

  // Chart
  chart: {
    line: '#3B82F6',
    area: 'rgba(59, 130, 246, 0.1)',
    grid: '#E5E7EB',
    candleUp: '#00C853',
    candleDown: '#FF1744',
    volume: 'rgba(255, 107, 53, 0.3)',
  },

  // UI Elements
  ui: {
    skeleton: '#E5E7EB',
    shimmer: '#F3F4F6',
    overlay: 'rgba(0, 0, 0, 0.5)',
    divider: '#E8E8E8',
  },
} as const

// Theme type
export type Theme = {
  bg: {
    primary: string
    secondary: string
    tertiary: string
    elevated: string
    input: string
    card: string
  }
  text: {
    primary: string
    secondary: string
    tertiary: string
    inverse: string
  }
  brand: {
    primary: string
    secondary: string
    muted: string
  }
  semantic: {
    positive: string
    negative: string
    warning: string
    info: string
  }
  stock: {
    ceiling: string
    floor: string
    reference: string
    up: string
    down: string
  }
  border: {
    primary: string
    secondary: string
    focus: string
  }
  tabBar: {
    background: string
    border: string
    active: string
    inactive: string
  }
  chart: {
    line: string
    area: string
    grid: string
    candleUp: string
    candleDown: string
    volume: string
  }
  ui: {
    skeleton: string
    shimmer: string
    overlay: string
    divider: string
  }
}

// Default export (dark theme for backward compatibility)
export const colors = {
  ...darkTheme,
  // ===== LEGACY MAPPINGS (backward compatibility) =====
  background: {
    primary: darkTheme.bg.primary,
    secondary: darkTheme.bg.secondary,
    tertiary: darkTheme.bg.tertiary,
    elevated: darkTheme.bg.elevated,
  },
  surface: {
    default: darkTheme.bg.secondary,
    hover: darkTheme.bg.tertiary,
    active: darkTheme.border.primary,
    border: darkTheme.border.primary,
    borderLight: darkTheme.border.secondary,
  },
  price: {
    up: darkTheme.stock.up,
    down: darkTheme.stock.down,
    reference: darkTheme.stock.reference,
    ceiling: darkTheme.stock.ceiling,
    floor: darkTheme.stock.floor,
  },
  status: {
    success: darkTheme.semantic.positive,
    warning: darkTheme.semantic.warning,
    error: darkTheme.semantic.negative,
    info: darkTheme.semantic.info,
  },
}

// Separate exports for legacy imports
export const background = colors.background
export const surface = colors.surface
export const price = colors.price
export const status = colors.status

// ===== HELPER FUNCTIONS =====

// Get price color based on change
export function getPriceColor(
  change: number,
  isCeiling?: boolean,
  isFloor?: boolean,
  theme: Theme = darkTheme
): string {
  if (isCeiling) return theme.stock.ceiling
  if (isFloor) return theme.stock.floor
  if (change > 0) return theme.stock.up
  if (change < 0) return theme.stock.down
  return theme.stock.reference
}

// Get semantic color
export function getSemanticColor(value: number, theme: Theme = darkTheme): string {
  if (value > 0) return theme.semantic.positive
  if (value < 0) return theme.semantic.negative
  return theme.text.secondary
}

// Add opacity to color
export function withOpacity(color: string, opacity: number): string {
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }
  return color
}

// Type exports
export type ColorKeys = keyof Theme
export type BackgroundColors = keyof Theme['bg']
export type TextColors = keyof Theme['text']
