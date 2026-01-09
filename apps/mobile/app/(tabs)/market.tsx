/**
 * SmartTrade AI v1.2.0 - Bloomberg Grade Market Screen
 * Fixed: Reduced padding, FilterChips no overflow
 */

import React, { useState, useCallback, useMemo } from 'react'
import { View, FlatList, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Search, X, TrendingUp, TrendingDown, BarChart3, Filter } from 'lucide-react-native'

import { Text, LabelSmall, ChangeText } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import { StockCard } from '@/components/stocks/StockCard'
import { MiniChart } from '@/components/stocks/MiniChart'
import { useTheme } from '@/context/ThemeContext'
import { Theme } from '@/theme/colors'
import { spacing, radius, touchTarget, layout } from '@/theme/spacing'
import { typography } from '@/theme/typography'

// Demo data
const INDICES = [
  { symbol: 'VN-INDEX', value: 1250.5, change: 0.99, data: [1240, 1245, 1242, 1248, 1250, 1249, 1250.5] },
  { symbol: 'VN30', value: 1285.2, change: 0.68, data: [1280, 1282, 1279, 1283, 1285, 1284, 1285.2] },
  { symbol: 'HNX', value: 235.8, change: -0.51, data: [237, 236.5, 236, 235.5, 236, 235.8, 235.8] },
  { symbol: 'UPCOM', value: 92.45, change: 0.25, data: [92, 92.2, 92.1, 92.3, 92.4, 92.45] },
]

const ALL_STOCKS = [
  { symbol: 'VNM', name: 'Vinamilk', price: 76500, change: 1500, changePercent: 2.0, volume: 2500000, exchange: 'HOSE' as const, chartData: [75000, 75500, 76000, 75800, 76200, 76500] },
  { symbol: 'FPT', name: 'FPT Corp', price: 92000, change: -1000, changePercent: -1.1, volume: 1800000, exchange: 'HOSE' as const, chartData: [93500, 93000, 92500, 92800, 92200, 92000] },
  { symbol: 'VCB', name: 'Vietcombank', price: 95000, change: 500, changePercent: 0.53, volume: 1200000, exchange: 'HOSE' as const, chartData: [94500, 94600, 94800, 95000, 94900, 95000] },
  { symbol: 'HPG', name: 'Hoa Phat', price: 28500, change: -300, changePercent: -1.04, volume: 15000000, exchange: 'HOSE' as const, chartData: [28800, 28700, 28600, 28500, 28400, 28500] },
  { symbol: 'MWG', name: 'Mobile World', price: 52000, change: 1200, changePercent: 2.36, volume: 3200000, exchange: 'HOSE' as const, chartData: [50800, 51000, 51500, 51800, 52000, 52000] },
  { symbol: 'VIC', name: 'Vingroup', price: 42500, change: 200, changePercent: 0.47, volume: 2100000, exchange: 'HOSE' as const, chartData: [42300, 42400, 42500, 42400, 42500, 42500] },
  { symbol: 'VHM', name: 'Vinhomes', price: 38000, change: -500, changePercent: -1.30, volume: 4500000, exchange: 'HOSE' as const, chartData: [38500, 38400, 38200, 38100, 38000, 38000] },
  { symbol: 'TCB', name: 'Techcombank', price: 35500, change: 700, changePercent: 2.01, volume: 2800000, exchange: 'HOSE' as const, chartData: [34800, 35000, 35200, 35400, 35500, 35500] },
  { symbol: 'MSN', name: 'Masan Group', price: 68000, change: 800, changePercent: 1.19, volume: 1500000, exchange: 'HOSE' as const, chartData: [67200, 67500, 67800, 68000, 67900, 68000] },
  { symbol: 'VRE', name: 'Vincom Retail', price: 25500, change: -200, changePercent: -0.78, volume: 2000000, exchange: 'HOSE' as const, chartData: [25700, 25600, 25500, 25400, 25500, 25500] },
]

type FilterType = 'all' | 'gainers' | 'losers' | 'volume'

const FILTER_OPTIONS: { key: FilterType; label: string; icon: any }[] = [
  { key: 'all', label: 'Tất cả', icon: Filter },
  { key: 'gainers', label: 'Tăng', icon: TrendingUp },
  { key: 'losers', label: 'Giảm', icon: TrendingDown },
  { key: 'volume', label: 'Khối lượng', icon: BarChart3 },
]

export default function MarketScreen() {
  const { theme } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const styles = createStyles(theme)

  const filteredStocks = useMemo(() => {
    let stocks = ALL_STOCKS

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toUpperCase()
      stocks = stocks.filter(
        (s) => s.symbol.includes(query) || s.name.toUpperCase().includes(query)
      )
    }

    // Category filter
    switch (activeFilter) {
      case 'gainers':
        stocks = stocks.filter((s) => s.change > 0).sort((a, b) => b.changePercent - a.changePercent)
        break
      case 'losers':
        stocks = stocks.filter((s) => s.change < 0).sort((a, b) => a.changePercent - b.changePercent)
        break
      case 'volume':
        stocks = [...stocks].sort((a, b) => b.volume - a.volume)
        break
    }

    return stocks
  }, [searchQuery, activeFilter])

  const handleFilterPress = useCallback((filter: FilterType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setActiveFilter(filter)
  }, [])

  const clearSearch = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSearchQuery('')
  }, [])

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header - minimal, no duplicate title */}
      <View style={styles.header}>
        <Text variant="h2">Thị trường</Text>
      </View>

      {/* Search Bar */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.searchContainer}>
        <View style={[styles.searchInputWrapper, { backgroundColor: theme.bg.card }]}>
          <Search size={18} color={theme.text.tertiary} strokeWidth={1.5} />
          <TextInput
            style={[styles.searchInput, { color: theme.text.primary }]}
            placeholder="Tìm mã, tên công ty..."
            placeholderTextColor={theme.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={clearSearch} hitSlop={8}>
              <X size={18} color={theme.text.tertiary} strokeWidth={1.5} />
            </Pressable>
          )}
        </View>
      </Animated.View>

      {/* Market Indices - Edge to edge scroll */}
      <Animated.View entering={FadeInDown.delay(200).duration(400)}>
        <FlatList
          horizontal
          data={INDICES}
          keyExtractor={(item) => item.symbol}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.indicesScroll}
          style={styles.indicesContainer}
          renderItem={({ item }) => (
            <IndexCard
              theme={theme}
              name={item.symbol}
              value={item.value}
              change={item.change}
              data={item.data}
            />
          )}
        />
      </Animated.View>

      {/* Filter Tabs - Fixed horizontal scroll */}
      <Animated.View entering={FadeInDown.delay(300).duration(400)}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
          style={styles.filterContainer}
        >
          {FILTER_OPTIONS.map((option) => (
            <FilterChip
              key={option.key}
              theme={theme}
              label={option.label}
              icon={option.icon}
              active={activeFilter === option.key}
              onPress={() => handleFilterPress(option.key)}
            />
          ))}
          {/* End spacer to prevent last item cutoff */}
          <View style={{ width: layout.screenPadding }} />
        </ScrollView>
      </Animated.View>

      {/* Stock List */}
      <FlatList
        data={filteredStocks}
        keyExtractor={(item) => item.symbol}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(400 + index * 50).duration(400)}>
            <StockCard
              stock={item}
              onPress={() => router.push(`/stock/${item.symbol}`)}
            />
          </Animated.View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Search size={48} color={theme.text.tertiary} strokeWidth={1} />
            <Text variant="body" color="tertiary" style={styles.emptyText}>
              Không tìm thấy kết quả
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

// Index Card Component
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

// Filter Chip Component
function FilterChip({ theme, label, icon: Icon, active, onPress }: {
  theme: Theme
  label: string
  icon: any
  active: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing[1.5],
          paddingHorizontal: spacing[3],
          paddingVertical: spacing[2],
          borderRadius: radius.full,
          backgroundColor: active ? theme.brand.primary : theme.bg.card,
          borderWidth: 1,
          borderColor: active ? theme.brand.primary : theme.border.primary,
        },
      ]}
      onPress={onPress}
    >
      <Icon
        size={14}
        color={active ? '#FFFFFF' : theme.text.secondary}
        strokeWidth={active ? 2 : 1.5}
      />
      <Text
        variant="bodySmall"
        style={{
          fontWeight: '500',
          color: active ? '#FFFFFF' : theme.text.primary,
        }}
      >
        {label}
      </Text>
    </Pressable>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg.primary,
  },

  // Header - Reduced padding
  header: {
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing[3],
  },

  // Search - Reduced padding
  searchContainer: {
    paddingHorizontal: layout.screenPadding,
    marginBottom: spacing[3],
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: theme.border.primary,
    paddingHorizontal: spacing[3],
    height: touchTarget.comfortable,
    gap: spacing[3],
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    paddingVertical: 0,
  },

  // Indices - Edge to edge
  indicesContainer: {
    marginHorizontal: -layout.screenPadding,
    marginBottom: spacing[3],
  },
  indicesScroll: {
    paddingHorizontal: layout.screenPadding,
    gap: spacing[2],
  },

  // Filter - Edge to edge horizontal scroll
  filterContainer: {
    marginHorizontal: -layout.screenPadding,
    marginBottom: spacing[3],
  },
  filterScroll: {
    paddingHorizontal: layout.screenPadding,
    gap: spacing[2],
    paddingVertical: spacing[1],
  },

  // List - Reduced padding
  listContent: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 100,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[12],
    gap: spacing[3],
  },
  emptyText: {
    textAlign: 'center',
  },
})
