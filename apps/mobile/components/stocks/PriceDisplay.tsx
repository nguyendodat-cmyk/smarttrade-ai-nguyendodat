/**
 * SmartTrade AI v1.3.0 - Theme-Aware Price Display
 * Price display with change indicators
 */

import React, { useMemo } from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import { Text, PriceText, ChangeText, LabelSmall } from '@/components/ui/Text'
import { useTheme } from '@/context/ThemeContext'
import { spacing, radius } from '@/theme/spacing'

interface PriceDisplayProps {
  price: number
  reference: number
  change: number
  changePercent: number
  ceiling?: number
  floor?: number
  variant?: 'default' | 'large' | 'compact'
}

export function PriceDisplay({
  price,
  reference,
  change,
  changePercent,
  ceiling,
  floor,
  variant = 'default',
}: PriceDisplayProps) {
  const { theme } = useTheme()
  const isCeiling = ceiling !== undefined && price >= ceiling
  const isFloor = floor !== undefined && price <= floor

  // Get price color
  const priceColor = useMemo(() => {
    if (isCeiling) return theme.stock.ceiling
    if (isFloor) return theme.stock.floor
    if (change > 0) return theme.semantic.positive
    if (change < 0) return theme.semantic.negative
    return theme.stock.reference
  }, [isCeiling, isFloor, change, theme])

  if (variant === 'large') {
    return (
      <View style={styles.largeContainer}>
        <View style={styles.mainPriceRow}>
          <PriceText
            value={price}
            change={change}
            isCeiling={isCeiling}
            isFloor={isFloor}
            size="large"
          />
          <View style={[styles.changeBadge, { backgroundColor: `${priceColor}20` }]}>
            <Text variant="numberSmall" style={{ color: priceColor }}>
              {change >= 0 ? '+' : ''}{change.toLocaleString('vi-VN')}
            </Text>
            <Text variant="numberSmall" style={{ color: priceColor }}>
              ({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)
            </Text>
          </View>
        </View>

        <View style={styles.refRow}>
          <Text variant="bodySmall" color="tertiary">TC: {reference.toLocaleString('vi-VN')}</Text>
          {ceiling && (
            <Text variant="bodySmall" style={{ color: theme.stock.ceiling }}>
              Trần: {ceiling.toLocaleString('vi-VN')}
            </Text>
          )}
          {floor && (
            <Text variant="bodySmall" style={{ color: theme.stock.floor }}>
              Sàn: {floor.toLocaleString('vi-VN')}
            </Text>
          )}
        </View>
      </View>
    )
  }

  if (variant === 'compact') {
    return (
      <View style={styles.compactContainer}>
        <PriceText
          value={price}
          change={change}
          isCeiling={isCeiling}
          isFloor={isFloor}
          size="small"
        />
        <ChangeText percent={changePercent} size="small" showIcon={false} />
      </View>
    )
  }

  // Default variant
  return (
    <View style={styles.container}>
      <PriceText
        value={price}
        change={change}
        isCeiling={isCeiling}
        isFloor={isFloor}
        size="normal"
      />
      <View style={styles.changeRow}>
        <Text variant="numberSmall" style={{ color: priceColor }}>
          {change >= 0 ? '+' : ''}{change.toLocaleString('vi-VN')}
        </Text>
        <ChangeText percent={changePercent} size="small" showIcon={false} />
      </View>
    </View>
  )
}

// Price level bar showing current price position between floor and ceiling
export function PriceLevelBar({
  price,
  reference,
  ceiling,
  floor,
}: {
  price: number
  reference: number
  ceiling: number
  floor: number
}) {
  const { theme } = useTheme()
  const range = ceiling - floor
  const pricePosition = Math.max(0, Math.min(100, ((price - floor) / range) * 100))
  const refPosition = ((reference - floor) / range) * 100

  return (
    <View style={styles.levelBarContainer}>
      <View style={[styles.levelBar, { backgroundColor: theme.bg.tertiary }]}>
        {/* Floor marker */}
        <View style={[styles.marker, { backgroundColor: theme.stock.floor, left: 0 }]} />

        {/* Reference marker */}
        <View style={[styles.marker, { backgroundColor: theme.stock.reference, left: `${refPosition}%` }]} />

        {/* Ceiling marker */}
        <View style={[styles.marker, { backgroundColor: theme.stock.ceiling, left: '100%' }]} />

        {/* Current price indicator */}
        <View
          style={[
            styles.priceIndicator,
            {
              left: `${pricePosition}%`,
              backgroundColor: theme.brand.primary,
              borderColor: theme.bg.primary,
            },
          ]}
        />
      </View>

      <View style={styles.levelLabels}>
        <Text variant="numberSmall" style={{ color: theme.stock.floor }}>
          {floor.toLocaleString('vi-VN')}
        </Text>
        <Text variant="numberSmall" style={{ color: theme.stock.reference }}>
          TC: {reference.toLocaleString('vi-VN')}
        </Text>
        <Text variant="numberSmall" style={{ color: theme.stock.ceiling }}>
          {ceiling.toLocaleString('vi-VN')}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  // Default
  container: {
    gap: spacing[1],
  },
  changeRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },

  // Large
  largeContainer: {
    gap: spacing[2],
  },
  mainPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: radius.md,
  },
  refRow: {
    flexDirection: 'row',
    gap: spacing[4],
  },

  // Compact
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },

  // Level bar
  levelBarContainer: {
    paddingVertical: spacing[3],
  },
  levelBar: {
    height: 4,
    borderRadius: radius.full,
    position: 'relative',
  },
  marker: {
    position: 'absolute',
    top: -4,
    width: 2,
    height: 12,
    marginLeft: -1,
    borderRadius: radius.full,
  },
  priceIndicator: {
    position: 'absolute',
    top: -6,
    width: 12,
    height: 12,
    marginLeft: -6,
    borderRadius: radius.full,
    borderWidth: 2,
  },
  levelLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[2],
  },
})

export default PriceDisplay
