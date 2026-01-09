/**
 * SmartTrade AI v1.3.0 - Theme-Aware Stock Card
 * Data-dense display with premium animations
 */

import React, { useMemo } from 'react'
import { View, StyleSheet, Pressable, ViewStyle } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Text, LabelSmall, ChangeText } from '@/components/ui/Text'
import { MiniChart } from './MiniChart'
import { useTheme } from '@/context/ThemeContext'
import { spacing, radius } from '@/theme/spacing'
import { typography } from '@/theme/typography'

interface StockData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume?: number
  reference?: number
  ceiling?: number
  floor?: number
  exchange?: 'HOSE' | 'HNX' | 'UPCOM'
  chartData?: number[]
}

interface StockCardProps {
  stock: StockData
  variant?: 'default' | 'compact' | 'detailed'
  showChart?: boolean
  onPress?: () => void
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function StockCard({
  stock,
  variant = 'default',
  showChart = true,
  onPress,
}: StockCardProps) {
  const { theme } = useTheme()
  const scale = useSharedValue(1)
  const isCeiling = stock.ceiling !== undefined && stock.price >= stock.ceiling
  const isFloor = stock.floor !== undefined && stock.price <= stock.floor
  const isPositive = stock.change >= 0

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 })
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 })
  }

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress?.()
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  // Get price color based on Vietnam stock market conventions
  const priceColor = useMemo(() => {
    if (isCeiling) return theme.stock.ceiling
    if (isFloor) return theme.stock.floor
    if (stock.change > 0) return theme.semantic.positive
    if (stock.change < 0) return theme.semantic.negative
    return theme.stock.reference
  }, [isCeiling, isFloor, stock.change, theme])

  // Dynamic styles based on theme
  const cardStyle: ViewStyle = {
    backgroundColor: theme.bg.card,
    borderColor: theme.border.primary,
  }

  const exchangeBadgeStyle: ViewStyle = {
    backgroundColor: theme.bg.tertiary,
  }

  if (variant === 'compact') {
    return (
      <AnimatedPressable
        style={[styles.compactCard, cardStyle, animatedStyle]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <View style={styles.compactLeft}>
          <Text variant="h4" style={styles.symbol}>{stock.symbol}</Text>
          <Text variant="numberSmall" style={{ color: priceColor }}>
            {stock.price.toLocaleString('vi-VN')}
          </Text>
        </View>
        <ChangeText percent={stock.changePercent} size="small" showIcon={false} />
      </AnimatedPressable>
    )
  }

  if (variant === 'detailed') {
    return (
      <AnimatedPressable
        style={[styles.detailedCard, cardStyle, animatedStyle]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        {/* Header */}
        <View style={styles.detailedHeader}>
          <View style={styles.symbolRow}>
            <Text variant="h3" style={styles.symbol}>{stock.symbol}</Text>
            {stock.exchange && (
              <View style={[styles.exchangeBadge, exchangeBadgeStyle]}>
                <LabelSmall style={{ color: theme.text.tertiary }}>{stock.exchange}</LabelSmall>
              </View>
            )}
          </View>
          <Text variant="bodySmall" color="secondary" numberOfLines={1}>{stock.name}</Text>
        </View>

        {/* Chart */}
        {showChart && stock.chartData && (
          <View style={styles.chartContainer}>
            <MiniChart data={stock.chartData} positive={isPositive} height={60} width={280} />
          </View>
        )}

        {/* Price info */}
        <View style={styles.priceRow}>
          <Text variant="price" style={{ color: priceColor }}>
            {stock.price.toLocaleString('vi-VN')}
          </Text>
          <View style={[
            styles.changeBadge,
            { backgroundColor: isPositive ? theme.semantic.positive + '20' : theme.semantic.negative + '20' }
          ]}>
            <Text variant="numberSmall" style={{ color: priceColor }}>
              {stock.change >= 0 ? '+' : ''}{stock.change.toLocaleString('vi-VN')}
            </Text>
            <Text variant="numberSmall" style={{ color: priceColor }}>
              ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
            </Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={[styles.statsRow, { borderTopColor: theme.border.primary }]}>
          <View style={styles.stat}>
            <LabelSmall style={{ color: theme.text.tertiary }}>KL</LabelSmall>
            <Text variant="numberSmall">{formatVolume(stock.volume || 0)}</Text>
          </View>
          {stock.ceiling && (
            <View style={styles.stat}>
              <LabelSmall style={{ color: theme.text.tertiary }}>TRẦN</LabelSmall>
              <Text variant="numberSmall" style={{ color: theme.stock.ceiling }}>
                {stock.ceiling.toLocaleString('vi-VN')}
              </Text>
            </View>
          )}
          {stock.floor && (
            <View style={styles.stat}>
              <LabelSmall style={{ color: theme.text.tertiary }}>SÀN</LabelSmall>
              <Text variant="numberSmall" style={{ color: theme.stock.floor }}>
                {stock.floor.toLocaleString('vi-VN')}
              </Text>
            </View>
          )}
        </View>
      </AnimatedPressable>
    )
  }

  // Default variant - Bloomberg style horizontal layout
  return (
    <AnimatedPressable
      style={[styles.card, cardStyle, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <View style={styles.row}>
        {/* Symbol & Name */}
        <View style={styles.leftSection}>
          <View style={styles.symbolRow}>
            <Text variant="h4" style={styles.symbol}>{stock.symbol}</Text>
            {stock.exchange && (
              <View style={[styles.exchangeBadge, exchangeBadgeStyle]}>
                <Text style={[styles.exchangeText, { color: theme.text.tertiary }]}>{stock.exchange}</Text>
              </View>
            )}
          </View>
          <Text variant="bodySmall" color="tertiary" numberOfLines={1} style={styles.name}>
            {stock.name}
          </Text>
        </View>

        {/* Mini Chart */}
        {showChart && stock.chartData && (
          <View style={styles.chartSmall}>
            <MiniChart data={stock.chartData} positive={isPositive} height={28} width={56} />
          </View>
        )}

        {/* Price & Change */}
        <View style={styles.rightSection}>
          <Text variant="number" style={{ color: priceColor }}>
            {stock.price.toLocaleString('vi-VN')}
          </Text>
          <ChangeText percent={stock.changePercent} size="small" showIcon={false} />
        </View>
      </View>
    </AnimatedPressable>
  )
}

// Helper to format volume
function formatVolume(volume: number): string {
  if (volume >= 1e9) return `${(volume / 1e9).toFixed(1)}B`
  if (volume >= 1e6) return `${(volume / 1e6).toFixed(1)}M`
  if (volume >= 1e3) return `${(volume / 1e3).toFixed(1)}K`
  return volume.toString()
}

const styles = StyleSheet.create({
  // Default card
  card: {
    borderRadius: radius.lg,
    padding: spacing[3],
    marginBottom: spacing[2],
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftSection: {
    flex: 1,
  },
  symbolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  symbol: {
    letterSpacing: 0.5,
  },
  name: {
    marginTop: spacing[1],
    maxWidth: 100,
  },
  exchangeBadge: {
    paddingHorizontal: spacing[1.5],
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  exchangeText: {
    fontSize: 9,
    fontFamily: typography.tabLabel.fontFamily,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  chartSmall: {
    marginHorizontal: spacing[3],
  },
  rightSection: {
    alignItems: 'flex-end',
    minWidth: 80,
  },

  // Compact card
  compactCard: {
    borderRadius: radius.md,
    padding: spacing[3],
    marginBottom: spacing[2],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
  },
  compactLeft: {
    gap: spacing[1],
  },

  // Detailed card
  detailedCard: {
    borderRadius: radius.lg,
    padding: spacing[4],
    marginBottom: spacing[3],
    borderWidth: 1,
  },
  detailedHeader: {
    marginBottom: spacing[3],
  },
  chartContainer: {
    marginBottom: spacing[3],
    alignItems: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: radius.full,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing[3],
    borderTopWidth: 1,
  },
  stat: {
    alignItems: 'center',
    gap: spacing[1],
  },
})

export default StockCard
