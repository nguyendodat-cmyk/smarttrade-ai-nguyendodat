/**
 * SmartTrade AI v1.3.0 - Theme-Aware Icon Component
 * Wrapper for lucide-react-native with consistent sizing
 */

import React from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import { LucideIcon } from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import { useTheme } from '@/context/ThemeContext'
import { touchTarget } from '@/theme/spacing'

type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const sizeMap: Record<IconSize, number> = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
}

interface IconProps {
  icon: LucideIcon
  size?: IconSize
  color?: string
  strokeWidth?: number
}

export function Icon({
  icon: LucideIconComponent,
  size = 'md',
  color,
  strokeWidth = 1.5,
}: IconProps) {
  const { theme } = useTheme()
  const iconSize = sizeMap[size]
  const iconColor = color || theme.text.secondary

  return (
    <LucideIconComponent
      size={iconSize}
      color={iconColor}
      strokeWidth={strokeWidth}
    />
  )
}

// Icon Button with touch target
interface IconButtonProps extends IconProps {
  onPress?: () => void
  disabled?: boolean
  haptic?: boolean
}

export function IconButton({
  onPress,
  disabled,
  haptic = true,
  ...iconProps
}: IconButtonProps) {
  const handlePress = () => {
    if (!disabled && onPress) {
      if (haptic) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      }
      onPress()
    }
  }

  return (
    <Pressable
      style={[styles.iconButton, disabled && styles.disabled]}
      onPress={handlePress}
      disabled={disabled}
      hitSlop={8}
    >
      <Icon {...iconProps} />
    </Pressable>
  )
}

// Circular icon container (for quick actions, etc.)
interface IconCircleProps extends IconProps {
  backgroundColor?: string
  containerSize?: number
}

export function IconCircle({
  backgroundColor,
  containerSize = 44,
  ...iconProps
}: IconCircleProps) {
  const { theme } = useTheme()
  const bgColor = backgroundColor || theme.brand.muted

  return (
    <View
      style={[
        styles.iconCircle,
        {
          backgroundColor: bgColor,
          width: containerSize,
          height: containerSize,
          borderRadius: containerSize / 2,
        },
      ]}
    >
      <Icon {...iconProps} />
    </View>
  )
}

const styles = StyleSheet.create({
  iconButton: {
    width: touchTarget.min,
    height: touchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: touchTarget.min / 2,
  },
  disabled: {
    opacity: 0.5,
  },
  iconCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default Icon
