/**
 * SmartTrade AI v1.2.0 - Bloomberg Grade Dashboard
 * Fixed: Light theme, reduced padding, header hide on scroll
 */

import React from 'react'
import { View, ScrollView, StyleSheet, RefreshControl, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated'
import {
  Settings,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Briefcase,
  Zap,
  Plus,
} from 'lucide-react-native'

import { Text, PriceText, ChangeText, LabelSmall } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import { IconButton, IconCircle } from '@/components/ui/Icon'
import { NotificationBell } from '@/components/ui/NotificationBell'
import { StockCard } from '@/components/stocks/StockCard'
import { MiniChart } from '@/components/stocks/MiniChart'
import { useTheme } from '@/context/ThemeContext'
import { Theme } from '@/theme/colors'
import { spacing, radius, layout } from '@/theme/spacing'
import { haptic } from '@/lib/haptics'

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView)

// Demo data
const INDICES = [
  { symbol: 'VN-INDEX', value: 1250.5, change: 0.99, data: [1240, 1245, 1242, 1248, 1250, 1249, 1250.5] },
  { symbol: 'HNX', value: 235.8, change: -0.51, data: [237, 236.5, 236, 235.5, 236, 235.8, 235.8] },
  { symbol: 'VN30', value: 1285.2, change: 0.68, data: [1280, 1282, 1279, 1283, 1285, 1284, 1285.2] },
  { symbol: 'UPCOM', value: 92.45, change: 0.25, data: [92, 92.2, 92.1, 92.3, 92.4, 92.45] },
]

const HOLDINGS = [
  { symbol: 'VNM', price: 76500, change: 2.34, quantity: 1000, pnl: 4500000 },
  { symbol: 'FPT', price: 92100, change: -1.1, quantity: 500, pnl: -550000 },
  { symbol: 'VCB', price: 108500, change: 1.12, quantity: 200, pnl: 2700000 },
]

const WATCHLIST = [
  { symbol: 'VNM', name: 'Vinamilk', price: 76500, change: 1500, changePercent: 2.0, volume: 2500000, exchange: 'HOSE' as const, chartData: [75000, 75500, 76000, 75800, 76200, 76500] },
  { symbol: 'FPT', name: 'FPT Corp', price: 92000, change: -1000, changePercent: -1.1, volume: 1800000, exchange: 'HOSE' as const, chartData: [93500, 93000, 92500, 92800, 92200, 92000] },
  { symbol: 'VCB', name: 'Vietcombank', price: 95000, change: 500, changePercent: 0.53, volume: 1200000, exchange: 'HOSE' as const, chartData: [94500, 94600, 94800, 95000, 94900, 95000] },
]

export default function DashboardScreen() {
  const { theme } = useTheme()
  const [refreshing, setRefreshing] = React.useState(false)
  const scrollY = useSharedValue(0)
  const styles = createStyles(theme)

  const onRefresh = React.useCallback(() => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1500)
  }, [])

  // Scroll handler for header animation
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
    },
  })

  // Header icons fade out on scroll
  const headerIconsStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 60],
      [1, 0],
      Extrapolation.CLAMP
    )
    const translateY = interpolate(
      scrollY.value,
      [0, 60],
      [0, -10],
      Extrapolation.CLAMP
    )
    return { opacity, transform: [{ translateY }] }
  })

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header - Minimal, no duplicate title */}
      <View style={styles.header}>
        <Text variant="h2" style={{ letterSpacing: -0.5 }}>SmartTrade</Text>
        {/* Animated header icons - hide on scroll */}
        <Animated.View style={[styles.headerActions, headerIconsStyle]}>
          <NotificationBell count={3} hasNew={false} />
          <IconButton
            icon={Settings}
            color={theme.text.secondary}
            onPress={() => {
              haptic.light()
              router.push('/settings' as any)
            }}
          />
        </Animated.View>
      </View>

      <AnimatedScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.brand.primary}
          />
        }
      >
        {/* Portfolio Summary - Hero Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Card variant="elevated" padding="xl" style={styles.heroCard}>
            <LabelSmall style={{ color: theme.text.tertiary }}>TỔNG TÀI SẢN</LabelSmall>
            <PriceText value={1245680000} size="large" style={styles.heroPrice} />
            <View style={styles.pnlRow}>
              <View style={[styles.pnlBadge, { backgroundColor: theme.semantic.positive + '15' }]}>
                <ChangeText percent={3.77} value={45230000} showIcon />
              </View>
              <Text variant="bodySmall" color="tertiary">Hôm nay</Text>
            </View>
          </Card>
        </Animated.View>

        {/* Quick Stats Grid */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <View style={styles.statsGrid}>
            <StatCard theme={theme} label="Cổ phiếu" value="₫1,025M" change={4.2} />
            <StatCard theme={theme} label="Tiền mặt" value="₫220M" />
            <StatCard theme={theme} label="Lãi chưa chốt" value="+₫156M" change={12.5} />
            <StatCard theme={theme} label="Lãi đã chốt" value="+₫89M" />
          </View>
        </Animated.View>

        {/* Market Indices - Horizontal with edge-to-edge scroll */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <View style={styles.sectionHeader}>
            <LabelSmall style={{ color: theme.text.tertiary }}>THỊ TRƯỜNG</LabelSmall>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.indicesScroll}
            style={styles.indicesContainer}
          >
            {INDICES.map((item) => (
              <IndexCard
                key={item.symbol}
                theme={theme}
                name={item.symbol}
                value={item.value}
                change={item.change}
                data={item.data}
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* Holdings Preview */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <Pressable style={styles.sectionHeader} onPress={() => router.push('/portfolio')}>
            <LabelSmall style={{ color: theme.text.tertiary }}>DANH MỤC</LabelSmall>
            <View style={styles.seeAllButton}>
              <Text variant="bodySmall" style={{ color: theme.brand.primary }}>
                Xem tất cả
              </Text>
              <ChevronRight size={16} color={theme.brand.primary} strokeWidth={1.5} />
            </View>
          </Pressable>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.holdingsScroll}
            style={styles.holdingsContainer}
          >
            {HOLDINGS.map((item) => (
              <HoldingCard
                key={item.symbol}
                theme={theme}
                symbol={item.symbol}
                price={item.price}
                change={item.change}
                quantity={item.quantity}
                pnl={item.pnl}
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)}>
          <View style={styles.sectionHeader}>
            <LabelSmall style={{ color: theme.text.tertiary }}>THAO TÁC NHANH</LabelSmall>
          </View>
          <View style={styles.quickActions}>
            <QuickActionCard
              theme={theme}
              icon={TrendingUp}
              label="Mua"
              color={theme.semantic.positive}
              onPress={() => router.push('/trade')}
            />
            <QuickActionCard
              theme={theme}
              icon={TrendingDown}
              label="Bán"
              color={theme.semantic.negative}
              onPress={() => router.push('/trade')}
            />
            <QuickActionCard
              theme={theme}
              icon={Briefcase}
              label="Danh mục"
              onPress={() => router.push('/portfolio')}
            />
            <QuickActionCard
              theme={theme}
              icon={Zap}
              label="AI"
              color={theme.brand.primary}
              onPress={() => router.push('/ai')}
            />
          </View>
        </Animated.View>

        {/* Watchlist */}
        <Animated.View entering={FadeInDown.delay(600).duration(400)}>
          <Pressable style={styles.sectionHeader}>
            <LabelSmall style={{ color: theme.text.tertiary }}>THEO DÕI</LabelSmall>
            <IconButton icon={Plus} size="sm" color={theme.brand.primary} />
          </Pressable>
          {WATCHLIST.map((stock) => (
            <StockCard
              key={stock.symbol}
              stock={stock}
              onPress={() => router.push(`/stock/${stock.symbol}`)}
            />
          ))}
        </Animated.View>
      </AnimatedScrollView>
    </SafeAreaView>
  )
}

// Sub-components
function StatCard({ theme, label, value, change }: {
  theme: Theme
  label: string
  value: string
  change?: number
}) {
  return (
    <Card style={{ width: '48%', flexGrow: 1 }} padding="md">
      <LabelSmall style={{ color: theme.text.tertiary }}>{label}</LabelSmall>
      <Text variant="number" style={{ marginTop: spacing[1], marginBottom: spacing[1] }}>{value}</Text>
      {change !== undefined && (
        <Text
          variant="numberSmall"
          style={{ color: change >= 0 ? theme.semantic.positive : theme.semantic.negative }}
        >
          {change >= 0 ? '+' : ''}{change}%
        </Text>
      )}
    </Card>
  )
}

function IndexCard({ theme, name, value, change, data }: {
  theme: Theme
  name: string
  value: number
  change: number
  data: number[]
}) {
  const isPositive = change >= 0

  return (
    <Card style={{ width: 120 }} padding="md">
      <LabelSmall style={{ color: theme.text.tertiary }}>{name}</LabelSmall>
      <Text variant="number" style={{ marginVertical: spacing[1] }}>
        {value.toLocaleString('vi-VN', { minimumFractionDigits: 2 })}
      </Text>
      <ChangeText percent={change} size="small" showIcon={false} />
      <View style={{ marginTop: spacing[2] }}>
        <MiniChart data={data} positive={isPositive} width={90} height={28} />
      </View>
    </Card>
  )
}

function HoldingCard({ theme, symbol, price, change, quantity, pnl }: {
  theme: Theme
  symbol: string
  price: number
  change: number
  quantity: number
  pnl: number
}) {
  const isPositive = change >= 0

  return (
    <Card
      style={{ width: 160 }}
      padding="md"
      onPress={() => router.push(`/stock/${symbol}`)}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[2] }}>
        <Text variant="h3">{symbol}</Text>
        <View style={{
          paddingHorizontal: spacing[2],
          paddingVertical: 2,
          borderRadius: 12,
          backgroundColor: isPositive ? theme.semantic.positive + '20' : theme.semantic.negative + '20',
        }}>
          <ChangeText percent={change} size="small" showIcon={false} />
        </View>
      </View>

      <PriceText value={price} size="small" />

      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing[3],
        paddingTop: spacing[2],
        borderTopWidth: 1,
        borderTopColor: theme.border.primary,
      }}>
        <Text variant="numberSmall" color="tertiary">{quantity} cp</Text>
        <Text
          variant="numberSmall"
          style={{ color: pnl >= 0 ? theme.semantic.positive : theme.semantic.negative }}
        >
          {pnl >= 0 ? '+' : ''}₫{(pnl / 1e6).toFixed(1)}M
        </Text>
      </View>
    </Card>
  )
}

function QuickActionCard({ theme, icon: Icon, label, color, onPress }: {
  theme: Theme
  icon: any
  label: string
  color?: string
  onPress?: () => void
}) {
  const iconColor = color || theme.text.secondary

  return (
    <Card style={{ flex: 1, alignItems: 'center' }} onPress={onPress} padding="md">
      <IconCircle
        icon={Icon}
        color={iconColor}
        backgroundColor={iconColor + '15'}
        containerSize={44}
      />
      <Text variant="bodySmall" color="secondary" style={{ marginTop: spacing[2], textAlign: 'center' }}>
        {label}
      </Text>
    </Card>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing[3],
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing[1],
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 100,
    gap: spacing[5],
  },

  // Hero Card
  heroCard: {
    // Uses theme.bg.card automatically now
  },
  heroPrice: {
    marginTop: spacing[2],
    marginBottom: spacing[3],
  },
  pnlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  pnlBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 20,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Indices - Edge to edge
  indicesContainer: {
    marginHorizontal: -layout.screenPadding,
  },
  indicesScroll: {
    paddingHorizontal: layout.screenPadding,
    gap: spacing[2],
  },

  // Holdings - Edge to edge
  holdingsContainer: {
    marginHorizontal: -layout.screenPadding,
  },
  holdingsScroll: {
    paddingHorizontal: layout.screenPadding,
    gap: spacing[2],
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
})
