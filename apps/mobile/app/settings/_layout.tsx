/**
 * SmartTrade AI - Settings Layout
 */

import { Stack } from 'expo-router'
import { useTheme } from '@/context/ThemeContext'

export default function SettingsLayout() {
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
      <Stack.Screen name="index" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="security" />
      <Stack.Screen name="appearance" />
      <Stack.Screen name="notifications" />
    </Stack>
  )
}
