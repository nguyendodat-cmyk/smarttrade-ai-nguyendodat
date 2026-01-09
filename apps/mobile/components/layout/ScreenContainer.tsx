/**
 * SmartTrade AI v1.2.0 - Screen Container
 * Layout wrapper with animated header that hides on scroll
 */

import React from 'react'
import {
  ScrollView,
  StyleSheet,
  RefreshControl,
  View,
  ViewStyle,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated'
import { useTheme } from '@/context/ThemeContext'
import { layout } from '@/theme/spacing'

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView)

interface ScreenContainerProps {
  children: React.ReactNode
  header?: React.ReactNode
  headerRight?: React.ReactNode
  onRefresh?: () => Promise<void>
  scrollEnabled?: boolean
  contentStyle?: ViewStyle
  hideHeaderOnScroll?: boolean
}

export function ScreenContainer({
  children,
  header,
  headerRight,
  onRefresh,
  scrollEnabled = true,
  contentStyle,
  hideHeaderOnScroll = true,
}: ScreenContainerProps) {
  const { theme } = useTheme()
  const [refreshing, setRefreshing] = React.useState(false)
  const scrollY = useSharedValue(0)

  const handleRefresh = async () => {
    if (onRefresh) {
      setRefreshing(true)
      await onRefresh()
      setRefreshing(false)
    }
  }

  // Scroll handler for animations
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
    },
  })

  // Header icons animation - fade and slide up on scroll
  const headerAnimatedStyle = useAnimatedStyle(() => {
    if (!hideHeaderOnScroll) {
      return { opacity: 1, transform: [{ translateY: 0 }] }
    }

    const opacity = interpolate(
      scrollY.value,
      [0, 50],
      [1, 0],
      Extrapolation.CLAMP
    )
    const translateY = interpolate(
      scrollY.value,
      [0, 50],
      [0, -10],
      Extrapolation.CLAMP
    )

    return {
      opacity,
      transform: [{ translateY }],
    }
  })

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.bg.primary }]}
      edges={['top']}
    >
      {/* Animated Header Right (Bell/Settings icons) */}
      {headerRight && (
        <Animated.View style={[styles.headerRight, headerAnimatedStyle]}>
          {headerRight}
        </Animated.View>
      )}

      <AnimatedScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, contentStyle]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.brand.primary}
              colors={[theme.brand.primary]}
            />
          ) : undefined
        }
      >
        {header}
        {children}
      </AnimatedScrollView>
    </SafeAreaView>
  )
}

// Simple header component
export function ScreenHeader({
  title,
  subtitle,
  style,
}: {
  title: string
  subtitle?: string
  style?: ViewStyle
}) {
  const { theme } = useTheme()

  return (
    <View style={[styles.headerContainer, style]}>
      {subtitle && (
        <Animated.Text style={[styles.subtitle, { color: theme.text.tertiary }]}>
          {subtitle}
        </Animated.Text>
      )}
      <Animated.Text style={[styles.title, { color: theme.text.primary }]}>
        {title}
      </Animated.Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRight: {
    position: 'absolute',
    top: 50, // Below safe area
    right: layout.screenPadding,
    zIndex: 10,
    flexDirection: 'row',
    gap: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 100,
  },
  headerContainer: {
    paddingVertical: layout.gapMd,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
})

export default ScreenContainer
