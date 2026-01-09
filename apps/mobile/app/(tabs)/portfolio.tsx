/**
 * SmartTrade AI - Bloomberg Grade Portfolio Screen
 * Data-dense portfolio view with premium animations
 */

import React from 'react'
import { View, ScrollView, StyleSheet, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { ChevronRight, Clock, TrendingUp, TrendingDown } from 'lucide-react-native'

import { Text, LabelSmall, ChangeText, PriceText } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import { useTheme } from '@/context/ThemeContext'
import { Theme } from '@/theme/colors'
import { spacing, radius } from '@/theme/spacing'

// Demo data
const PORTFOLIO_SUMMARY = {
  totalValue: 125000000,
  investedValue: 116500000,
  totalGain: 8500000,
  gainPercent: 7.29,
  dayChange: 2100000,
  dayPercent: 1.71,
}

const HOLDINGS = [
  { symbol: 'VNM', name: 'Vinamilk', quantity: 500, avgPrice: 72000, currentPrice: 76500, value: 38250000, gain: 2250000, gainPercent: 6.25, dayChange: 1.2 },
  { symbol: 'FPT', name: 'FPT Corp', quantity: 300, avgPrice: 88000, currentPrice: 92000, value: 27600000, gain: 1200000, gainPercent: 4.55, dayChange: -0.8 },
  { symbol: 'VCB', name: 'Vietcombank', quantity: 200, avgPrice: 90000, currentPrice: 95000, value: 19000000, gain: 1000000, gainPercent: 5.56, dayChange: 0.5 },
  { symbol: 'HPG', name: 'Hoa Phat', quantity: 1000, avgPrice: 26000, currentPrice: 28500, value: 28500000, gain: 2500000, gainPercent: 9.62, dayChange: -1.0 },
  { symbol: 'MWG', name: 'Mobile World', quantity: 150, avgPrice: 48000, currentPrice: 52000, value: 7800000, gain: 600000, gainPercent: 8.33, dayChange: 2.1 },
]

const PENDING_ORDERS = [
  { id: '1', symbol: 'VNM', side: 'buy' as const, type: 'LO', price: 75000, quantity: 100, status: 'pending' as const, time: '09:15' },
  { id: '2', symbol: 'TCB', side: 'sell' as const, type: 'LO', price: 36000, quantity: 200, status: 'partial' as const, filledQty: 100, time: '09:22' },
]

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export default function PortfolioScreen() {
  const { theme } = useTheme()
  const styles = createStyles(theme)

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Header - minimal, no duplicate title */}
        <View style={styles.header}>
          <Text variant="h2">Tài sản</Text>
        </View>

        {/* Summary Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Card variant="elevated" padding="xl" style={styles.summaryCard}>
            <LabelSmall style={{ color: theme.text.tertiary }}>TỔNG GIÁ TRỊ</LabelSmall>
            <PriceText value={PORTFOLIO_SUMMARY.totalValue} size="large" style={styles.summaryValue} />

            <View style={styles.summaryStats}>
              <View style={styles.summaryStatItem}>
                <LabelSmall style={{ color: theme.text.tertiary }}>TỔNG LỢI NHUẬN</LabelSmall>
                <View style={styles.statValue}>
                  <Text
                    variant="number"
                    style={{ color: PORTFOLIO_SUMMARY.totalGain >= 0 ? theme.semantic.positive : theme.semantic.negative }}
                  >
                    {PORTFOLIO_SUMMARY.totalGain >= 0 ? '+' : ''}
                    {(PORTFOLIO_SUMMARY.totalGain / 1e6).toFixed(1)}M
                  </Text>
                  <View style={[
                    styles.percentBadge,
                    { backgroundColor: PORTFOLIO_SUMMARY.gainPercent >= 0 ? theme.semantic.positive + '20' : theme.semantic.negative + '20' }
                  ]}>
                    <Text
                      variant="numberSmall"
                      style={{ color: PORTFOLIO_SUMMARY.gainPercent >= 0 ? theme.semantic.positive : theme.semantic.negative }}
                    >
                      {PORTFOLIO_SUMMARY.gainPercent >= 0 ? '+' : ''}{PORTFOLIO_SUMMARY.gainPercent.toFixed(2)}%
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.summaryStatItem}>
                <LabelSmall style={{ color: theme.text.tertiary }}>HÔM NAY</LabelSmall>
                <View style={styles.statValue}>
                  <Text
                    variant="number"
                    style={{ color: PORTFOLIO_SUMMARY.dayChange >= 0 ? theme.semantic.positive : theme.semantic.negative }}
                  >
                    {PORTFOLIO_SUMMARY.dayChange >= 0 ? '+' : ''}
                    {(PORTFOLIO_SUMMARY.dayChange / 1e6).toFixed(1)}M
                  </Text>
                  <View style={[
                    styles.percentBadge,
                    { backgroundColor: PORTFOLIO_SUMMARY.dayPercent >= 0 ? theme.semantic.positive + '20' : theme.semantic.negative + '20' }
                  ]}>
                    <Text
                      variant="numberSmall"
                      style={{ color: PORTFOLIO_SUMMARY.dayPercent >= 0 ? theme.semantic.positive : theme.semantic.negative }}
                    >
                      {PORTFOLIO_SUMMARY.dayPercent >= 0 ? '+' : ''}{PORTFOLIO_SUMMARY.dayPercent.toFixed(2)}%
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.investedRow}>
              <Text variant="bodySmall" color="tertiary">Giá trị đầu tư</Text>
              <Text variant="number">{(PORTFOLIO_SUMMARY.investedValue / 1e6).toFixed(1)}M</Text>
            </View>
          </Card>
        </Animated.View>

        {/* Pending Orders */}
        {PENDING_ORDERS.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Clock size={16} color={theme.text.tertiary} strokeWidth={1.5} />
                <LabelSmall style={{ color: theme.text.tertiary }}>LỆNH CHỜ KHỚP</LabelSmall>
              </View>
              <View style={[styles.countBadge, { backgroundColor: theme.brand.muted }]}>
                <Text variant="numberSmall" style={{ color: theme.brand.primary }}>
                  {PENDING_ORDERS.length}
                </Text>
              </View>
            </View>

            {PENDING_ORDERS.map((order, index) => (
              <Animated.View
                key={order.id}
                entering={FadeInDown.delay(250 + index * 50).duration(400)}
              >
                <OrderCard theme={theme} order={order} />
              </Animated.View>
            ))}
          </Animated.View>
        )}

        {/* Holdings */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <View style={styles.sectionHeader}>
            <LabelSmall style={{ color: theme.text.tertiary }}>CỔ PHIẾU NẮM GIỮ</LabelSmall>
            <Text variant="bodySmall" color="tertiary">{HOLDINGS.length} mã</Text>
          </View>
        </Animated.View>

        {HOLDINGS.map((holding, index) => (
          <Animated.View
            key={holding.symbol}
            entering={FadeInDown.delay(350 + index * 50).duration(400)}
          >
            <HoldingCard theme={theme} holding={holding} />
          </Animated.View>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

// Order Card Component
function OrderCard({ theme, order }: { theme: Theme; order: typeof PENDING_ORDERS[0] }) {
  const isBuy = order.side === 'buy'

  return (
    <Card style={{ marginHorizontal: spacing[4], marginBottom: spacing[2] }} padding="md">
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1, gap: spacing[1] }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
            <Text variant="h4">{order.symbol}</Text>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing[1],
              paddingHorizontal: spacing[2],
              paddingVertical: 2,
              borderRadius: radius.full,
              backgroundColor: isBuy ? theme.semantic.positive + '20' : theme.semantic.negative + '20',
            }}>
              {isBuy ? (
                <TrendingUp size={12} color={theme.semantic.positive} strokeWidth={2} />
              ) : (
                <TrendingDown size={12} color={theme.semantic.negative} strokeWidth={2} />
              )}
              <Text
                variant="bodySmall"
                style={{ color: isBuy ? theme.semantic.positive : theme.semantic.negative, fontWeight: '600' }}
              >
                {isBuy ? 'MUA' : 'BÁN'}
              </Text>
            </View>
          </View>
          <Text variant="bodySmall" color="tertiary">{order.type} - {order.time}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', marginRight: spacing[3] }}>
          <Text variant="number">{order.price.toLocaleString('vi-VN')}</Text>
          <Text variant="numberSmall" color="tertiary">
            {order.status === 'partial'
              ? `${order.filledQty}/${order.quantity}`
              : order.quantity} CP
          </Text>
        </View>
        <View style={{
          paddingHorizontal: spacing[2],
          paddingVertical: spacing[1],
          borderRadius: radius.full,
          backgroundColor: order.status === 'pending' ? theme.brand.muted : theme.semantic.positive + '20',
        }}>
          <Text
            variant="bodySmall"
            style={{
              color: order.status === 'pending' ? theme.brand.primary : theme.semantic.positive,
              fontWeight: '500',
            }}
          >
            {order.status === 'pending' ? 'Chờ' : 'Khớp 1 phần'}
          </Text>
        </View>
      </View>
    </Card>
  )
}

// Holding Card Component
function HoldingCard({ theme, holding }: { theme: Theme; holding: typeof HOLDINGS[0] }) {
  const scale = useSharedValue(1)

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 })
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 })
  }

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/stock/${holding.symbol}`)
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const isPositive = holding.gain >= 0

  return (
    <AnimatedPressable
      style={[{
        backgroundColor: theme.bg.secondary,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: theme.border.primary,
        marginHorizontal: spacing[4],
        marginBottom: spacing[2],
        padding: spacing[3],
      }, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing[3] }}>
        <View style={{ flex: 1, gap: spacing[1] }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
            <Text variant="h4">{holding.symbol}</Text>
            <View style={{
              paddingHorizontal: spacing[2],
              paddingVertical: 2,
              borderRadius: radius.full,
              backgroundColor: isPositive ? theme.semantic.positive + '15' : theme.semantic.negative + '15',
            }}>
              <Text
                variant="numberSmall"
                style={{ color: isPositive ? theme.semantic.positive : theme.semantic.negative }}
              >
                {isPositive ? '+' : ''}{holding.gainPercent.toFixed(1)}%
              </Text>
            </View>
          </View>
          <Text variant="bodySmall" color="tertiary">{holding.name}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', marginRight: spacing[2] }}>
          <Text variant="number">{holding.currentPrice.toLocaleString('vi-VN')}</Text>
          <ChangeText percent={holding.dayChange} size="small" showIcon={false} />
        </View>
        <ChevronRight size={16} color={theme.text.tertiary} strokeWidth={1.5} />
      </View>

      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: spacing[3],
        borderTopWidth: 1,
        borderTopColor: theme.border.primary,
      }}>
        <View style={{ alignItems: 'center', gap: spacing[1] }}>
          <LabelSmall style={{ color: theme.text.tertiary }}>KL</LabelSmall>
          <Text variant="numberSmall">{holding.quantity.toLocaleString('vi-VN')}</Text>
        </View>
        <View style={{ alignItems: 'center', gap: spacing[1] }}>
          <LabelSmall style={{ color: theme.text.tertiary }}>GIÁ TB</LabelSmall>
          <Text variant="numberSmall">{holding.avgPrice.toLocaleString('vi-VN')}</Text>
        </View>
        <View style={{ alignItems: 'center', gap: spacing[1] }}>
          <LabelSmall style={{ color: theme.text.tertiary }}>GIÁ TRỊ</LabelSmall>
          <Text variant="numberSmall">{(holding.value / 1e6).toFixed(1)}M</Text>
        </View>
        <View style={{ alignItems: 'center', gap: spacing[1] }}>
          <LabelSmall style={{ color: theme.text.tertiary }}>LỢI NHUẬN</LabelSmall>
          <Text
            variant="numberSmall"
            style={{ color: isPositive ? theme.semantic.positive : theme.semantic.negative }}
          >
            {isPositive ? '+' : ''}{(holding.gain / 1e6).toFixed(2)}M
          </Text>
        </View>
      </View>
    </AnimatedPressable>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg.primary,
  },
  content: {
    paddingBottom: 100,
  },

  // Header
  header: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },

  // Summary
  summaryCard: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[5],
  },
  summaryValue: {
    marginTop: spacing[2],
    marginBottom: spacing[4],
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing[4],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.border.primary,
    marginBottom: spacing[4],
  },
  summaryStatItem: {
    gap: spacing[1],
  },
  statValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  percentBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  investedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
    marginTop: spacing[2],
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  countBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radius.full,
  },
})
