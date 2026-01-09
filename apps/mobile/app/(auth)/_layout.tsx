/**
 * SmartTrade AI - Auth Layout
 * Layout for authentication screens
 */

import { Stack } from 'expo-router'
import { useTheme } from '@/context/ThemeContext'

export default function AuthLayout() {
  const { theme } = useTheme()

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.bg.primary,
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  )
}
