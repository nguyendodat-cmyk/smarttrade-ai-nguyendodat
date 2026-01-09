/**
 * SmartTrade AI v1.3.0 - Theme-Aware Button Component
 * Uses theme context for proper light/dark mode support
 */

import React from 'react'
import {
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  Pressable,
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Text } from './Text'
import { useTheme } from '@/context/ThemeContext'
import { Theme } from '@/theme/colors'
import { spacing, radius, touchTarget } from '@/theme/spacing'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'buy' | 'sell' | 'danger' | 'success'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps {
  children: string
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  onPress?: () => void
  style?: ViewStyle
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  fullWidth,
  leftIcon,
  rightIcon,
  onPress,
  style,
}: ButtonProps) {
  const { theme } = useTheme()
  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.97, { damping: 15, stiffness: 400 })
      opacity.value = withSpring(0.9, { damping: 15 })
    }
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 })
    opacity.value = withSpring(1, { damping: 15 })
  }

  const handlePress = () => {
    if (!disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      onPress?.()
    }
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  // Get variant styles based on theme
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: theme.brand.primary }
      case 'secondary':
        return {
          backgroundColor: theme.bg.tertiary,
          borderWidth: 1,
          borderColor: theme.border.primary,
        }
      case 'ghost':
        return { backgroundColor: 'transparent' }
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: theme.brand.primary,
        }
      case 'buy':
        return { backgroundColor: theme.semantic.positive }
      case 'sell':
      case 'danger':
        return { backgroundColor: theme.semantic.negative }
      case 'success':
        return { backgroundColor: theme.semantic.positive }
      default:
        return { backgroundColor: theme.brand.primary }
    }
  }

  // Get size styles
  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return { height: touchTarget.min, paddingHorizontal: spacing[3] }
      case 'lg':
        return { height: touchTarget.large, paddingHorizontal: spacing[5] }
      default:
        return { height: touchTarget.comfortable, paddingHorizontal: spacing[4] }
    }
  }

  // Get text color based on variant
  const getTextColor = (): string => {
    switch (variant) {
      case 'primary':
      case 'buy':
      case 'sell':
      case 'danger':
      case 'success':
        return '#FFFFFF'
      case 'secondary':
        return theme.text.primary
      case 'ghost':
      case 'outline':
        return theme.brand.primary
      default:
        return theme.text.primary
    }
  }

  const buttonStyles: ViewStyle[] = [
    styles.base,
    getVariantStyle(),
    getSizeStyle(),
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
    style as ViewStyle,
  ].filter(Boolean) as ViewStyle[]

  const textColor = getTextColor()

  return (
    <AnimatedPressable
      style={[buttonStyles, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {leftIcon}
          <Text
            variant="button"
            style={[
              styles.text,
              { color: textColor },
              leftIcon ? { marginLeft: 8 } : undefined,
              rightIcon ? { marginRight: 8 } : undefined,
            ]}
          >
            {children}
          </Text>
          {rightIcon}
        </>
      )}
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '600',
  },
})

export default Button
