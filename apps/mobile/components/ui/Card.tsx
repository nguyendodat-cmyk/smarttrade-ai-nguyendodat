/**
 * SmartTrade AI v1.2.0 - Theme-Aware Card Component
 * Uses theme.bg.card for proper light/dark mode support
 */

import React from 'react'
import {
  View,
  StyleSheet,
  ViewStyle,
  Pressable,
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { useTheme } from '@/context/ThemeContext'
import { spacing, radius } from '@/theme/spacing'

type CardVariant = 'default' | 'elevated' | 'outlined' | 'ghost'
type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl'

interface CardProps {
  children: React.ReactNode
  variant?: CardVariant
  padding?: CardPadding
  fullWidth?: boolean  // Edge-to-edge cards
  onPress?: () => void
  disabled?: boolean
  style?: ViewStyle
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

const paddingMap = {
  none: 0,
  sm: spacing[2],   // 8px
  md: spacing[3],   // 12px
  lg: spacing[4],   // 16px
  xl: spacing[5],   // 20px
}

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  fullWidth = false,
  onPress,
  disabled,
  style,
}: CardProps) {
  const { theme } = useTheme()
  const scale = useSharedValue(1)

  const handlePressIn = () => {
    if (onPress && !disabled) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 400 })
    }
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 })
  }

  const handlePress = () => {
    if (onPress && !disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      onPress()
    }
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  // CRITICAL: Use theme.bg.card for card backgrounds
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: theme.bg.card,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 4,
        }
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: theme.border.primary,
        }
      case 'ghost':
        return {
          backgroundColor: 'transparent',
        }
      default:
        return {
          backgroundColor: theme.bg.card,
          borderWidth: 1,
          borderColor: theme.border.primary,
        }
    }
  }

  const cardStyles: ViewStyle[] = [
    styles.base,
    getVariantStyles(),
    { padding: paddingMap[padding] },
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style as ViewStyle,
  ].filter(Boolean) as ViewStyle[]

  if (onPress) {
    return (
      <AnimatedPressable
        style={[cardStyles, animatedStyle]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled}
      >
        {children}
      </AnimatedPressable>
    )
  }

  return <View style={cardStyles}>{children}</View>
}

// Backward-compatible PressableCard
export function PressableCard({
  children,
  onPress,
  ...props
}: CardProps & { onPress: () => void }) {
  return (
    <Card onPress={onPress} {...props}>
      {children}
    </Card>
  )
}

// Card Header
export function CardHeader({
  children,
  style,
}: {
  children: React.ReactNode
  style?: ViewStyle
}) {
  const { theme } = useTheme()

  return (
    <View style={[
      styles.header,
      { borderBottomColor: theme.border.primary },
      style
    ]}>
      {children}
    </View>
  )
}

// Card Content
export function CardContent({
  children,
  style,
}: {
  children: React.ReactNode
  style?: ViewStyle
}) {
  return (
    <View style={[styles.content, style]}>
      {children}
    </View>
  )
}

// Card Footer
export function CardFooter({
  children,
  style,
}: {
  children: React.ReactNode
  style?: ViewStyle
}) {
  const { theme } = useTheme()

  return (
    <View style={[
      styles.footer,
      { borderTopColor: theme.border.primary },
      style
    ]}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  fullWidth: {
    marginHorizontal: -12, // Negative margin for edge-to-edge
    borderRadius: 0,
  },
  disabled: {
    opacity: 0.5,
  },
  header: {
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    marginBottom: spacing[3],
  },
  content: {
    // Default content area
  },
  footer: {
    paddingTop: spacing[3],
    borderTopWidth: 1,
    marginTop: spacing[3],
  },
})

export default Card
