/**
 * SmartTrade AI - Root Layout
 * App entry point with providers
 * v1.4.1 - Added Error Boundary for crash debugging
 */

import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import * as SplashScreen from 'expo-splash-screen'
import { ThemeProvider, useTheme } from '@/context/ThemeContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// Debug logging
console.log('🚀 [1/5] Root layout module loading...')

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync()
console.log('🚀 [2/5] SplashScreen.preventAutoHideAsync() called')

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    },
  },
})

console.log('🚀 [3/5] QueryClient created')

// Main navigation stack with theme support
function MainStack() {
  console.log('🚀 [4/5] MainStack rendering...')
  const { theme, isDark } = useTheme()
  console.log('🚀 [4/5] useTheme() returned:', { isDark, hasBg: !!theme?.bg })

  useEffect(() => {
    // Hide splash screen after theme is loaded
    console.log('🚀 [5/5] Hiding splash screen...')
    SplashScreen.hideAsync()
    console.log('🚀 [5/5] Splash hidden!')
  }, [])

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={theme.bg.primary} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: theme.bg.primary,
          },
          animation: 'slide_from_right',
        }}
      >
        {/* Auth Flow */}
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />

        {/* Main Tabs */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Stock Detail */}
        <Stack.Screen
          name="stock/[symbol]"
          options={{
            headerShown: true,
            headerStyle: {
              backgroundColor: theme.bg.primary,
            },
            headerTintColor: theme.text.primary,
            headerTitleStyle: {
              fontWeight: '600',
            },
            presentation: 'card',
          }}
        />

        {/* Order Modal */}
        <Stack.Screen
          name="order/[symbol]"
          options={{
            presentation: 'modal',
            headerShown: true,
            headerStyle: {
              backgroundColor: theme.bg.primary,
            },
            headerTintColor: theme.text.primary,
            title: 'Dat lenh',
          }}
        />

        {/* Settings */}
        <Stack.Screen
          name="settings"
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />

        {/* Notifications */}
        <Stack.Screen
          name="notifications"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
      </Stack>
    </>
  )
}

export default function RootLayout() {
  console.log('🚀 RootLayout rendering...')
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <MainStack />
          </ThemeProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  )
}
