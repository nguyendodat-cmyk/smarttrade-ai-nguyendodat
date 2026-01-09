/**
 * SmartTrade AI v1.3.0 - Theme-Aware Badge Component
 * Dynamic theming for all badge variants
 */

import React, { useMemo } from 'react'
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native'
import { useTheme } from '@/context/ThemeContext'
import { Theme } from '@/theme/colors'
import { typography } from '@/theme/typography'
import { spacing, radius } from '@/theme/spacing'

type BadgeVariant = 'default' | 'success' | 'error' | 'warning' | 'info' | 'price-up' | 'price-down' | 'ceiling' | 'floor' | 'reference'
type BadgeSize = 'sm' | 'md' | 'lg'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  style?: ViewStyle
}

function getVariantStyles(variant: BadgeVariant, theme: Theme): { bg: ViewStyle; text: TextStyle } {
  switch (variant) {
    case 'success':
      return {
        bg: { backgroundColor: `${theme.semantic.positive}20` },
        text: { color: theme.semantic.positive },
      }
    case 'error':
      return {
        bg: { backgroundColor: `${theme.semantic.negative}20` },
        text: { color: theme.semantic.negative },
      }
    case 'warning':
      return {
        bg: { backgroundColor: `${theme.semantic.warning}20` },
        text: { color: theme.semantic.warning },
      }
    case 'info':
      return {
        bg: { backgroundColor: `${theme.semantic.info}20` },
        text: { color: theme.semantic.info },
      }
    case 'price-up':
      return {
        bg: { backgroundColor: `${theme.stock.up}20` },
        text: { color: theme.stock.up },
      }
    case 'price-down':
      return {
        bg: { backgroundColor: `${theme.stock.down}20` },
        text: { color: theme.stock.down },
      }
    case 'ceiling':
      return {
        bg: { backgroundColor: `${theme.stock.ceiling}20` },
        text: { color: theme.stock.ceiling },
      }
    case 'floor':
      return {
        bg: { backgroundColor: `${theme.stock.floor}20` },
        text: { color: theme.stock.floor },
      }
    case 'reference':
      return {
        bg: { backgroundColor: `${theme.stock.reference}20` },
        text: { color: theme.stock.reference },
      }
    default:
      return {
        bg: { backgroundColor: theme.bg.tertiary },
        text: { color: theme.text.secondary },
      }
  }
}

function getSizeStyles(size: BadgeSize): { container: ViewStyle; text: TextStyle } {
  switch (size) {
    case 'sm':
      return {
        container: { paddingHorizontal: spacing[2], paddingVertical: 2 },
        text: typography.caption,
      }
    case 'lg':
      return {
        container: { paddingHorizontal: spacing[4], paddingVertical: spacing[1.5] },
        text: typography.body,
      }
    default:
      return {
        container: { paddingHorizontal: spacing[3], paddingVertical: spacing[1] },
        text: typography.bodySmall,
      }
  }
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  style,
}: BadgeProps) {
  const { theme } = useTheme()

  const variantStyles = useMemo(() => getVariantStyles(variant, theme), [variant, theme])
  const sizeStyles = useMemo(() => getSizeStyles(size), [size])

  return (
    <View style={[styles.base, variantStyles.bg, sizeStyles.container, style]}>
      <Text style={[styles.text, variantStyles.text, sizeStyles.text]}>
        {children}
      </Text>
    </View>
  )
}

// Specialized badge for price changes
export function PriceChangeBadge({
  value,
  percent,
  isCeiling,
  isFloor,
  style,
}: {
  value?: number
  percent?: number
  isCeiling?: boolean
  isFloor?: boolean
  style?: ViewStyle
}) {
  let variant: BadgeVariant = 'reference'

  if (isCeiling) {
    variant = 'ceiling'
  } else if (isFloor) {
    variant = 'floor'
  } else if (value !== undefined) {
    if (value > 0) variant = 'price-up'
    else if (value < 0) variant = 'price-down'
  } else if (percent !== undefined) {
    if (percent > 0) variant = 'price-up'
    else if (percent < 0) variant = 'price-down'
  }

  const displayValue = percent !== undefined
    ? `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`
    : value !== undefined
    ? `${value >= 0 ? '+' : ''}${value.toLocaleString('vi-VN')}`
    : '0%'

  return (
    <Badge variant={variant} style={style}>
      {displayValue}
    </Badge>
  )
}

// Exchange badge (HOSE, HNX, UPCOM)
export function ExchangeBadge({
  exchange,
  style,
}: {
  exchange: 'HOSE' | 'HNX' | 'UPCOM'
  style?: ViewStyle
}) {
  const variant: BadgeVariant = exchange === 'HOSE' ? 'info' : exchange === 'HNX' ? 'warning' : 'default'

  return (
    <Badge variant={variant} size="sm" style={style}>
      {exchange}
    </Badge>
  )
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: radius.md,
  },
  text: {
    fontWeight: '600',
  },
})

export default Badge
