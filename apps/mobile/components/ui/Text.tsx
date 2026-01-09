/**
 * SmartTrade AI v1.3.0 - Theme-Aware Text Components
 * Typography enforcer with specialized price/change components
 */

import React from 'react'
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native'
import { useTheme } from '@/context/ThemeContext'
import { Theme } from '@/theme/colors'
import { typography } from '@/theme/typography'

type TextVariant = keyof typeof typography
type TextColor = 'primary' | 'secondary' | 'tertiary' | 'inverse' | string

interface TextProps extends RNTextProps {
  variant?: TextVariant
  color?: TextColor
  align?: 'left' | 'center' | 'right'
}

export function Text({
  variant = 'body',
  color = 'primary',
  align = 'left',
  style,
  children,
  ...props
}: TextProps) {
  const { theme } = useTheme()
  const textColor = getColor(color, theme)

  return (
    <RNText
      style={[
        typography[variant],
        { color: textColor, textAlign: align },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  )
}

// ===== SPECIALIZED COMPONENTS =====

// Headings
export function Heading1(props: Omit<TextProps, 'variant'>) {
  return <Text variant="h1" {...props} />
}

export function Heading2(props: Omit<TextProps, 'variant'>) {
  return <Text variant="h2" {...props} />
}

export function Heading3(props: Omit<TextProps, 'variant'>) {
  return <Text variant="h3" {...props} />
}

export function Heading4(props: Omit<TextProps, 'variant'>) {
  return <Text variant="h4" {...props} />
}

// Body text
export function Body(props: Omit<TextProps, 'variant'>) {
  return <Text variant="body" {...props} />
}

export function BodySmall(props: Omit<TextProps, 'variant'>) {
  return <Text variant="bodySmall" {...props} />
}

// Labels
export function Label(props: Omit<TextProps, 'variant'>) {
  return <Text variant="label" color="secondary" {...props} />
}

export function LabelSmall(props: Omit<TextProps, 'variant'>) {
  return <Text variant="labelSmall" color="tertiary" {...props} />
}

export function Caption(props: Omit<TextProps, 'variant'>) {
  return <Text variant="caption" color="tertiary" {...props} />
}

// ===== PRICE DISPLAY COMPONENT =====
interface PriceTextProps extends Omit<RNTextProps, 'children'> {
  value: number
  size?: 'small' | 'normal' | 'large'
  change?: number
  isCeiling?: boolean
  isFloor?: boolean
  prefix?: string
}

export function PriceText({
  value,
  size = 'normal',
  change,
  isCeiling,
  isFloor,
  prefix = '',
  style,
  ...props
}: PriceTextProps) {
  const { theme } = useTheme()

  const sizeMap = {
    small: typography.priceSmall,
    normal: typography.price,
    large: typography.priceLarge,
  }

  // Determine color based on state
  let textColor: string = theme.text.primary
  if (isCeiling) textColor = theme.stock.ceiling
  else if (isFloor) textColor = theme.stock.floor
  else if (change !== undefined) {
    if (change > 0) textColor = theme.stock.up
    else if (change < 0) textColor = theme.stock.down
    else textColor = theme.stock.reference
  }

  return (
    <RNText
      style={[sizeMap[size], { color: textColor }, style]}
      {...props}
    >
      {prefix}{formatPrice(value)}
    </RNText>
  )
}

// ===== CHANGE TEXT COMPONENT =====
interface ChangeTextProps extends Omit<RNTextProps, 'children'> {
  value?: number
  percent: number
  showIcon?: boolean
  size?: 'small' | 'normal'
}

export function ChangeText({
  value,
  percent,
  showIcon = true,
  size = 'normal',
  style,
  ...props
}: ChangeTextProps) {
  const { theme } = useTheme()
  const isPositive = percent >= 0
  const color = isPositive ? theme.semantic.positive : theme.semantic.negative
  const icon = isPositive ? '↑' : '↓'
  const textStyle = size === 'small' ? typography.numberSmall : typography.percent

  const formattedPercent = `${isPositive ? '+' : ''}${percent.toFixed(2)}%`
  const formattedValue = value !== undefined
    ? ` (${isPositive ? '+' : ''}${value.toLocaleString('vi-VN')})`
    : ''

  return (
    <RNText style={[textStyle, { color }, style]} {...props}>
      {showIcon && icon} {formattedPercent}{formattedValue}
    </RNText>
  )
}

// ===== SYMBOL TEXT =====
export function SymbolText(props: Omit<TextProps, 'variant'>) {
  return <Text variant="symbol" {...props} />
}

// ===== NUMBER TEXT (monospace) =====
export function NumberText({
  value,
  size = 'normal',
  style,
  ...props
}: Omit<RNTextProps, 'children'> & {
  value: number | string
  size?: 'small' | 'normal'
}) {
  const { theme } = useTheme()
  const textStyle = size === 'small' ? typography.numberSmall : typography.number

  return (
    <RNText style={[textStyle, { color: theme.text.primary }, style]} {...props}>
      {typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
    </RNText>
  )
}

// ===== HELPER FUNCTIONS =====
function getColor(color: string, theme: Theme): string {
  // Check text colors
  if (color === 'primary') return theme.text.primary
  if (color === 'secondary') return theme.text.secondary
  if (color === 'tertiary') return theme.text.tertiary
  if (color === 'inverse') return theme.text.inverse

  // Check stock colors
  if (color === 'up') return theme.stock.up
  if (color === 'down') return theme.stock.down
  if (color === 'ceiling') return theme.stock.ceiling
  if (color === 'floor') return theme.stock.floor
  if (color === 'reference') return theme.stock.reference

  // Return as-is if it's a custom color
  return color
}

function formatPrice(price: number): string {
  return price.toLocaleString('vi-VN')
}

export default Text
