/**
 * SmartTrade AI v1.3.0 - Theme-Aware Stock Detail Screen
 */

import React, { useMemo } from 'react'
import { View, ScrollView, StyleSheet, Dimensions, ViewStyle } from 'react-native'
import { useLocalSearchParams, router, Stack } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Heading2, Heading4, Body, Caption, PriceText, ChangeText } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import { TouchableOpacity } from 'react-native'
import { Button } from '@/components/ui/Button'
import { Badge, ExchangeBadge } from '@/components/ui/Badge'
import { PriceLevelBar } from '@/components/stocks/PriceDisplay'
import { MiniChart } from '@/components/stocks/MiniChart'
import { useTheme } from '@/context/ThemeContext'
import { spacing, layout, radius } from '@/theme/spacing'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// Demo data - would come from API
const DEMO_STOCK = {
  VNM: {
    symbol: 'VNM',
    name: 'Công ty Cổ phần Sữa Việt Nam',
    exchange: 'HOSE' as const,
    price: 76500,
    reference: 75000,
    ceiling: 80200,
    floor: 69800,
    change: 1500,
    changePercent: 2.0,
    volume: 2500000,
    value: 191250000000,
    high: 77000,
    low: 75500,
    open: 75500,
    avgPrice: 76200,
    foreignBuy: 150000,
    foreignSell: 80000,
    chartData: [75000, 75500, 76000, 75800, 76200, 76500, 76300, 76500],
    fundamentals: {
      marketCap: '180.5T',
      pe: 22.5,
      pb: 4.8,
      eps: 3400,
      dividend: 1500,
      dividendYield: 2.0,
    },
  },
}

const TIME_FILTERS = ['1D', '1W', '1M', '3M', '1Y', 'All']

export default function StockDetailScreen() {
  const { theme } = useTheme()
  const { symbol } = useLocalSearchParams<{ symbol: string }>()
  const [activeTimeFilter, setActiveTimeFilter] = React.useState('1D')

  // Get stock data (demo)
  const stock = DEMO_STOCK[symbol as keyof typeof DEMO_STOCK] || DEMO_STOCK.VNM

  const isCeiling = stock.price >= stock.ceiling
  const isFloor = stock.price <= stock.floor

  // Dynamic styles based on theme
  const dynamicStyles = useMemo(() => ({
    container: {
      backgroundColor: theme.bg.primary,
    } as ViewStyle,
    timeFilter: {
      backgroundColor: theme.bg.tertiary,
    } as ViewStyle,
    timeFilterActive: {
      backgroundColor: theme.brand.primary,
    } as ViewStyle,
    chartContainer: {
      backgroundColor: theme.bg.tertiary,
    } as ViewStyle,
  }), [theme])

  const priceUpColor = theme.stock.up
  const priceDownColor = theme.stock.down

  return (
    <>
      <Stack.Screen
        options={{
          title: stock.symbol,
          headerRight: () => (
            <View style={styles.headerRight}>
              <Ionicons name="star-outline" size={24} color={theme.text.primary} />
              <Ionicons name="share-outline" size={24} color={theme.text.primary} style={{ marginLeft: spacing[4] }} />
            </View>
          ),
        }}
      />

      <ScrollView style={[styles.container, dynamicStyles.container]} showsVerticalScrollIndicator={false}>
        {/* Header Info */}
        <View style={styles.headerSection}>
          <View style={styles.stockInfo}>
            <View style={styles.nameRow}>
              <Heading2>{stock.symbol}</Heading2>
              <ExchangeBadge exchange={stock.exchange} />
            </View>
            <Body color="secondary" numberOfLines={2}>{stock.name}</Body>
          </View>

          <View style={styles.priceSection}>
            <PriceText
              value={stock.price}
              change={stock.change}
              isCeiling={isCeiling}
              isFloor={isFloor}
              size="large"
            />
            <View style={styles.changeRow}>
              <Body style={{ color: stock.change >= 0 ? priceUpColor : priceDownColor }}>
                {stock.change >= 0 ? '+' : ''}{stock.change.toLocaleString('vi-VN')}
              </Body>
              <ChangeText percent={stock.changePercent} />
            </View>
          </View>
        </View>

        {/* Price Level Bar */}
        <View style={styles.levelBarSection}>
          <PriceLevelBar
            price={stock.price}
            reference={stock.reference}
            ceiling={stock.ceiling}
            floor={stock.floor}
          />
        </View>

        {/* Chart */}
        <View style={styles.chartSection}>
          {/* Time Filters */}
          <View style={styles.timeFilters}>
            {TIME_FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter}
                onPress={() => setActiveTimeFilter(filter)}
                style={[
                  styles.timeFilter,
                  dynamicStyles.timeFilter,
                  activeTimeFilter === filter && dynamicStyles.timeFilterActive
                ]}
              >
                <Caption style={activeTimeFilter === filter ? { color: theme.text.inverse } : undefined}>
                  {filter}
                </Caption>
              </TouchableOpacity>
            ))}
          </View>

          {/* Chart placeholder */}
          <View style={[styles.chartContainer, dynamicStyles.chartContainer]}>
            <MiniChart
              data={stock.chartData}
              positive={stock.change >= 0}
              width={SCREEN_WIDTH - spacing[8]}
              height={180}
            />
          </View>
        </View>

        {/* Trading Stats */}
        <Card padding="md" style={styles.statsCard}>
          <Heading4 style={styles.statsTitle}>Thông tin giao dịch</Heading4>
          <View style={styles.statsGrid}>
            <StatItem label="Mở cửa" value={stock.open.toLocaleString('vi-VN')} />
            <StatItem label="Cao nhất" value={stock.high.toLocaleString('vi-VN')} color={priceUpColor} />
            <StatItem label="Thấp nhất" value={stock.low.toLocaleString('vi-VN')} color={priceDownColor} />
            <StatItem label="TB khớp" value={stock.avgPrice.toLocaleString('vi-VN')} />
            <StatItem label="KL khớp" value={formatVolume(stock.volume)} />
            <StatItem label="GT khớp" value={formatValue(stock.value)} />
            <StatItem label="NN Mua" value={formatVolume(stock.foreignBuy)} color={priceUpColor} />
            <StatItem label="NN Bán" value={formatVolume(stock.foreignSell)} color={priceDownColor} />
          </View>
        </Card>

        {/* Fundamentals */}
        <Card padding="md" style={styles.statsCard}>
          <Heading4 style={styles.statsTitle}>Chỉ số cơ bản</Heading4>
          <View style={styles.statsGrid}>
            <StatItem label="Vốn hóa" value={stock.fundamentals.marketCap} />
            <StatItem label="P/E" value={stock.fundamentals.pe.toString()} />
            <StatItem label="P/B" value={stock.fundamentals.pb.toString()} />
            <StatItem label="EPS" value={stock.fundamentals.eps.toLocaleString('vi-VN')} />
            <StatItem label="Cổ tức" value={`${stock.fundamentals.dividend.toLocaleString('vi-VN')}đ`} />
            <StatItem label="Tỷ suất CT" value={`${stock.fundamentals.dividendYield}%`} />
          </View>
        </Card>

        {/* Trade Buttons */}
        <View style={styles.tradeButtons}>
          <Button
            variant="success"
            size="lg"
            style={styles.tradeButton}
            onPress={() => router.push(`/order/${stock.symbol}?side=buy`)}
          >
            Mua
          </Button>
          <Button
            variant="danger"
            size="lg"
            style={styles.tradeButton}
            onPress={() => router.push(`/order/${stock.symbol}?side=sell`)}
          >
            Bán
          </Button>
        </View>
      </ScrollView>
    </>
  )
}

function StatItem({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color?: string
}) {
  return (
    <View style={styles.statItem}>
      <Caption>{label}</Caption>
      <Body style={[styles.statValue, color ? { color } : undefined]}>{value}</Body>
    </View>
  )
}

function formatVolume(volume: number): string {
  if (volume >= 1e6) return `${(volume / 1e6).toFixed(1)}M`
  if (volume >= 1e3) return `${(volume / 1e3).toFixed(1)}K`
  return volume.toString()
}

function formatValue(value: number): string {
  if (value >= 1e12) return `${(value / 1e12).toFixed(1)}T`
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`
  return formatVolume(value)
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  headerRight: {
    flexDirection: 'row',
  },

  // Header
  headerSection: {
    padding: layout.screenPadding,
    paddingBottom: spacing[4],
  },
  stockInfo: {
    marginBottom: spacing[4],
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[1],
  },
  priceSection: {},
  changeRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[1],
  },

  // Level bar
  levelBarSection: {
    paddingHorizontal: layout.screenPadding,
    marginBottom: spacing[4],
  },

  // Chart
  chartSection: {
    paddingHorizontal: layout.screenPadding,
    marginBottom: spacing[6],
  },
  timeFilters: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  timeFilter: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.md,
  },
  chartContainer: {
    alignItems: 'center',
    paddingVertical: spacing[4],
    borderRadius: radius.lg,
  },

  // Stats
  statsCard: {
    marginHorizontal: layout.screenPadding,
    marginBottom: spacing[4],
  },
  statsTitle: {
    marginBottom: spacing[4],
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '25%',
    marginBottom: spacing[4],
  },
  statValue: {
    fontWeight: '600',
    marginTop: spacing[1],
  },

  // Trade buttons
  tradeButtons: {
    flexDirection: 'row',
    padding: layout.screenPadding,
    gap: spacing[4],
    paddingBottom: spacing[8],
  },
  tradeButton: {
    flex: 1,
  },
})
