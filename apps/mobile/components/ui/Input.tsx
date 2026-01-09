/**
 * SmartTrade AI v1.3.0 - Theme-Aware Input Components
 * Premium inputs with haptic feedback
 */

import React, { useState } from 'react'
import {
  View,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextInputProps,
  Pressable,
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Eye, EyeOff, Minus, Plus } from 'lucide-react-native'
import { Text, LabelSmall } from './Text'
import { useTheme } from '@/context/ThemeContext'
import { typography } from '@/theme/typography'
import { spacing, radius, touchTarget } from '@/theme/spacing'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
  helper?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  onRightIconPress?: () => void
  containerStyle?: ViewStyle
  size?: 'sm' | 'md' | 'lg'
}

export function Input({
  label,
  error,
  helper,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  size = 'md',
  style,
  secureTextEntry,
  ...props
}: InputProps) {
  const { theme } = useTheme()
  const [isFocused, setIsFocused] = useState(false)
  const [isSecure, setIsSecure] = useState(secureTextEntry)

  const inputHeight = {
    sm: touchTarget.min,
    md: touchTarget.comfortable,
    lg: touchTarget.large,
  }[size]

  const handleToggleSecure = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    if (secureTextEntry) {
      setIsSecure(!isSecure)
    } else if (onRightIconPress) {
      onRightIconPress()
    }
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <LabelSmall style={[styles.label, { color: theme.text.tertiary }]}>{label}</LabelSmall>}

      <View
        style={[
          styles.inputWrapper,
          {
            height: inputHeight,
            backgroundColor: theme.bg.card,
            borderColor: isFocused ? theme.brand.primary : error ? theme.semantic.negative : theme.border.primary,
          },
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            { color: theme.text.primary },
            leftIcon ? styles.inputWithLeftIcon : undefined,
            (rightIcon || secureTextEntry) ? styles.inputWithRightIcon : undefined,
            style,
          ]}
          placeholderTextColor={theme.text.tertiary}
          selectionColor={theme.brand.primary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isSecure}
          {...props}
        />

        {(rightIcon || secureTextEntry) && (
          <Pressable onPress={handleToggleSecure} style={styles.rightIcon} hitSlop={8}>
            {secureTextEntry ? (
              isSecure ? (
                <EyeOff size={20} color={theme.text.tertiary} strokeWidth={1.5} />
              ) : (
                <Eye size={20} color={theme.text.tertiary} strokeWidth={1.5} />
              )
            ) : (
              rightIcon
            )}
          </Pressable>
        )}
      </View>

      {(error || helper) && (
        <Text
          variant="bodySmall"
          style={[styles.helper, { color: error ? theme.semantic.negative : theme.text.tertiary }]}
        >
          {error || helper}
        </Text>
      )}
    </View>
  )
}

// Numeric input for prices/quantities
interface NumericInputProps {
  value: number
  onChangeValue: (value: number) => void
  min?: number
  max?: number
  step?: number
  suffix?: string
  editable?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function NumericInput({
  value,
  onChangeValue,
  min,
  max,
  step = 1,
  suffix,
  editable = true,
  size = 'md',
}: NumericInputProps) {
  const { theme } = useTheme()
  const scaleLeft = useSharedValue(1)
  const scaleRight = useSharedValue(1)

  const increment = () => {
    if (!editable) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const newValue = value + step
    if (max === undefined || newValue <= max) {
      onChangeValue(newValue)
    }
  }

  const decrement = () => {
    if (!editable) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const newValue = value - step
    if (min === undefined || newValue >= min) {
      onChangeValue(newValue)
    }
  }

  const handleLeftPressIn = () => {
    scaleLeft.value = withSpring(0.9, { damping: 15, stiffness: 400 })
  }
  const handleLeftPressOut = () => {
    scaleLeft.value = withSpring(1, { damping: 15, stiffness: 400 })
  }
  const handleRightPressIn = () => {
    scaleRight.value = withSpring(0.9, { damping: 15, stiffness: 400 })
  }
  const handleRightPressOut = () => {
    scaleRight.value = withSpring(1, { damping: 15, stiffness: 400 })
  }

  const leftAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleLeft.value }],
  }))
  const rightAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleRight.value }],
  }))

  const buttonSize = size === 'lg' ? 56 : size === 'sm' ? 40 : 48

  return (
    <View style={[
      styles.numericContainer,
      { backgroundColor: theme.bg.card, borderColor: theme.border.primary }
    ]}>
      <AnimatedPressable
        style={[
          styles.numericButton,
          { width: buttonSize, height: buttonSize, backgroundColor: theme.bg.tertiary },
          leftAnimatedStyle
        ]}
        onPress={decrement}
        onPressIn={handleLeftPressIn}
        onPressOut={handleLeftPressOut}
        disabled={!editable}
      >
        <Minus
          size={20}
          color={editable ? theme.text.primary : theme.text.tertiary}
          strokeWidth={2}
        />
      </AnimatedPressable>

      <View style={styles.numericValue}>
        <Text variant="number" style={!editable && { color: theme.text.tertiary }}>
          {value.toLocaleString('vi-VN')}
        </Text>
        {suffix && (
          <Text variant="bodySmall" color="tertiary" style={styles.numericSuffix}>
            {suffix}
          </Text>
        )}
      </View>

      <AnimatedPressable
        style={[
          styles.numericButton,
          { width: buttonSize, height: buttonSize, backgroundColor: theme.bg.tertiary },
          rightAnimatedStyle
        ]}
        onPress={increment}
        onPressIn={handleRightPressIn}
        onPressOut={handleRightPressOut}
        disabled={!editable}
      >
        <Plus
          size={20}
          color={editable ? theme.text.primary : theme.text.tertiary}
          strokeWidth={2}
        />
      </AnimatedPressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
  },

  label: {
    marginBottom: spacing[2],
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
  },

  input: {
    flex: 1,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    paddingHorizontal: spacing[4],
  },

  inputWithLeftIcon: {
    paddingLeft: spacing[2],
  },

  inputWithRightIcon: {
    paddingRight: spacing[2],
  },

  leftIcon: {
    marginLeft: spacing[3],
  },

  rightIcon: {
    padding: spacing[3],
  },

  helper: {
    marginTop: spacing[1],
  },

  // Numeric input
  numericContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },

  numericButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  numericValue: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    paddingVertical: spacing[3],
  },

  numericSuffix: {
    marginLeft: spacing[1],
  },
})

export default Input
