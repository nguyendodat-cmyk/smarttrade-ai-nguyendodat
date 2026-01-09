/**
 * SmartTrade AI - Theme Context
 * Manages Light/Dark theme with system detection and persistence
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { useColorScheme, StatusBar } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { lightTheme, darkTheme, Theme } from '@/theme/colors'

// Theme mode type
export type ThemeMode = 'light' | 'dark' | 'system'

// Context type
interface ThemeContextType {
  theme: Theme
  mode: ThemeMode
  isDark: boolean
  setMode: (mode: ThemeMode) => void
  toggleTheme: () => void
}

// Storage key
const THEME_STORAGE_KEY = '@smarttrade_theme_mode'

// Create context
const ThemeContext = createContext<ThemeContextType | null>(null)

// Provider component
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme()
  const [mode, setModeState] = useState<ThemeMode>('system')

  // Determine if dark mode based on mode setting
  const isDark = useMemo(() => {
    if (mode === 'system') {
      return systemColorScheme === 'dark'
    }
    return mode === 'dark'
  }, [mode, systemColorScheme])

  // Get theme based on isDark
  const theme = useMemo(() => (isDark ? darkTheme : lightTheme), [isDark])

  // Load saved theme on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY)
        if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
          setModeState(savedMode as ThemeMode)
        }
      } catch (error) {
        console.warn('Failed to load theme preference:', error)
      }
    }
    loadTheme()
  }, [])

  // Set mode and persist
  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode)
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode)
    } catch (error) {
      console.warn('Failed to save theme preference:', error)
    }
  }

  // Toggle between light and dark
  const toggleTheme = () => {
    setMode(isDark ? 'light' : 'dark')
  }

  // Update status bar style
  useEffect(() => {
    StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content')
  }, [isDark])

  // Always render children - use default theme while loading
  // This prevents the app from getting stuck on splash screen
  return (
    <ThemeContext.Provider value={{ theme, mode, isDark, setMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// Hook to use theme
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Hook to create dynamic styles
export function useThemedStyles<T>(styleFactory: (theme: Theme) => T): T {
  const { theme } = useTheme()
  return useMemo(() => styleFactory(theme), [theme, styleFactory])
}

export default ThemeContext
