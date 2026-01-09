/**
 * SmartTrade AI v1.2.1 - Theme-Aware Trade Screen
 * Premium trading interface with haptic feedback
 */

import React, { useState, useCallback } from 'react'
import { View, ScrollView, StyleSheet, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { FadeInDown } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { ChevronDown } from 'lucide-react-native'

import { Text, LabelSmall, ChangeText } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { NumericInput } from '@/components/ui/Input'
import { useTheme } from '@/context/ThemeContext'
import { Theme } from '@/theme/colors'
import { spacing, radius } from '@/theme/spacing'

// Demo data
const SELECTED_STOCK = {
  symbol: 'VNM',
  name: 'Vinamilk',
  price: 76500,
  reference: 75000,
  ceiling: 80200,
  floor: 69800,
  change: 1500,
  changePercent: 2.0,
}

const ORDER_TYPES = [
  { key: 'LO', label: 'LO', description: 'Lệnh giới hạn' },
  { key: 'MP', label: 'MP', description: 'Lệnh thị trường' },
  { key: 'ATO', label: 'ATO', description: 'Lệnh mở cửa' },
  { key: 'ATC', label: 'ATC', description: 'Lệnh đóng cửa' },
]

const QUICK_QUANTITIES = [100, 500, 1000, 5000]

type OrderSide = 'buy' | 'sell'

export default function TradeScreen() {
  const { theme } = useTheme()
  const [side, setSide] = useState<OrderSide>('buy')
  const [orderType, setOrderType] = useState('LO')
  const [price, setPrice] = useState(SELECTED_STOCK.price)
  const [quantity, setQuantity] = useState(100)
  const styles = createStyles(theme)

  const orderValue = price * quantity
  const estimatedFee = orderValue * 0.0015 // 0.15% fee
  const total = orderValue + (side === 'buy' ? estimatedFee : -estimatedFee)

  const handleSideChange = useCallback((newSide: OrderSide) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setSide(newSide)
  }, [])

  const handleOrderTypeChange = useCallback((type: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setOrderType(type)
    // Reset price for market orders
    if (type !== 'LO') {
      setPrice(SELECTED_STOCK.price)
    }
  }, [])

  const handleQuickQuantity = useCallback((qty: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setQuantity(qty)
  }, [])

  const handleSubmit = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    console.log({ side, orderType, price, quantity })
  }, [side, orderType, price, quantity])

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Header - minimal, no duplicate title */}
        <View style={styles.header}>
          <Text variant="h2">Đặt lệnh</Text>
        </View>

        {/* Symbol Selector */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Pressable style={styles.symbolSelector}>
            <View style={styles.symbolInfo}>
              <View style={styles.symbolRow}>
                <Text variant="h3">{SELECTED_STOCK.symbol}</Text>
                <View style={styles.exchangeBadge}>
                  <LabelSmall style={{ color: theme.text.tertiary }}>HOSE</LabelSmall>
                </View>
              </View>
              <Text variant="bodySmall" color="tertiary">{SELECTED_STOCK.name}</Text>
            </View>
            <View style={styles.symbolPrice}>
              <Text
                variant="number"
                style={{ color: SELECTED_STOCK.change >= 0 ? theme.semantic.positive : theme.semantic.negative }}
              >
                {SELECTED_STOCK.price.toLocaleString('vi-VN')}
              </Text>
              <ChangeText percent={SELECTED_STOCK.changePercent} size="small" showIcon={false} />
            </View>
            <ChevronDown size={20} color={theme.text.tertiary} strokeWidth={1.5} />
          </Pressable>
        </Animated.View>

        {/* Price Level Bar */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <View style={styles.priceLevelContainer}>
            <View style={styles.priceLevelBar}>
              <View
                style={[
                  styles.priceLevelIndicator,
                  {
                    left: `${((SELECTED_STOCK.price - SELECTED_STOCK.floor) / (SELECTED_STOCK.ceiling - SELECTED_STOCK.floor)) * 100}%`,
                  },
                ]}
              />
            </View>
            <View style={styles.priceLevelLabels}>
              <Text variant="numberSmall" style={{ color: theme.stock.floor }}>
                {SELECTED_STOCK.floor.toLocaleString('vi-VN')}
              </Text>
              <Text variant="numberSmall" style={{ color: theme.stock.reference }}>
                TC: {SELECTED_STOCK.reference.toLocaleString('vi-VN')}
              </Text>
              <Text variant="numberSmall" style={{ color: theme.stock.ceiling }}>
                {SELECTED_STOCK.ceiling.toLocaleString('vi-VN')}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Buy/Sell Tabs */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <View style={styles.sideContainer}>
            <Pressable
              style={[styles.sideTab, side === 'buy' && styles.buyTab]}
              onPress={() => handleSideChange('buy')}
            >
              <Text
                variant="button"
                style={[styles.sideText, side === 'buy' && styles.sideTextActive]}
              >
                MUA
              </Text>
            </Pressable>
            <Pressable
              style={[styles.sideTab, side === 'sell' && styles.sellTab]}
              onPress={() => handleSideChange('sell')}
            >
              <Text
                variant="button"
                style={[styles.sideText, side === 'sell' && styles.sideTextActive]}
              >
                BÁN
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Order Type */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <View style={styles.section}>
            <LabelSmall style={styles.sectionLabel}>LOẠI LỆNH</LabelSmall>
            <View style={styles.orderTypes}>
              {ORDER_TYPES.map((type) => (
                <Pressable
                  key={type.key}
                  style={[
                    styles.orderTypeButton,
                    orderType === type.key && styles.orderTypeActive,
                  ]}
                  onPress={() => handleOrderTypeChange(type.key)}
                >
                  <Text
                    variant="button"
                    style={[
                      styles.orderTypeText,
                      orderType === type.key && styles.orderTypeTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Price Input */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)}>
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <LabelSmall style={styles.sectionLabel}>GIÁ</LabelSmall>
              <View style={styles.priceInfo}>
                <Text variant="bodySmall" style={{ color: theme.stock.floor }}>
                  Sàn: {SELECTED_STOCK.floor.toLocaleString('vi-VN')}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.stock.ceiling }}>
                  Trần: {SELECTED_STOCK.ceiling.toLocaleString('vi-VN')}
                </Text>
              </View>
            </View>
            <NumericInput
              value={price}
              onChangeValue={setPrice}
              min={SELECTED_STOCK.floor}
              max={SELECTED_STOCK.ceiling}
              step={100}
              editable={orderType === 'LO'}
            />
            {orderType !== 'LO' && (
              <Text variant="bodySmall" color="tertiary" style={styles.hint}>
                Lệnh {orderType} sẽ khớp tại giá thị trường
              </Text>
            )}
          </View>
        </Animated.View>

        {/* Quantity Input */}
        <Animated.View entering={FadeInDown.delay(600).duration(400)}>
          <View style={styles.section}>
            <LabelSmall style={styles.sectionLabel}>KHỐI LƯỢNG</LabelSmall>
            <NumericInput
              value={quantity}
              onChangeValue={setQuantity}
              min={100}
              step={100}
              suffix="CP"
            />
            <View style={styles.quickQuantity}>
              {QUICK_QUANTITIES.map((qty) => (
                <Pressable
                  key={qty}
                  style={[
                    styles.quickButton,
                    quantity === qty && styles.quickButtonActive,
                  ]}
                  onPress={() => handleQuickQuantity(qty)}
                >
                  <Text
                    variant="numberSmall"
                    style={[
                      styles.quickButtonText,
                      quantity === qty && styles.quickButtonTextActive,
                    ]}
                  >
                    {qty.toLocaleString('vi-VN')}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Order Summary */}
        <Animated.View entering={FadeInDown.delay(700).duration(400)}>
          <Card style={styles.summaryCard} padding="lg">
            <View style={styles.summaryRow}>
              <Text variant="bodySmall" color="tertiary">Giá trị lệnh</Text>
              <Text variant="number">{orderValue.toLocaleString('vi-VN')}đ</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text variant="bodySmall" color="tertiary">Phí GD (ước tính)</Text>
              <Text variant="numberSmall">{Math.round(estimatedFee).toLocaleString('vi-VN')}đ</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text variant="body">Tổng {side === 'buy' ? 'tiền mua' : 'tiền bán'}</Text>
              <Text
                variant="price"
                style={{ color: side === 'buy' ? theme.semantic.positive : theme.semantic.negative }}
              >
                {Math.round(total).toLocaleString('vi-VN')}đ
              </Text>
            </View>
          </Card>
        </Animated.View>

        {/* Submit Button */}
        <Animated.View entering={FadeInDown.delay(800).duration(400)} style={styles.submitSection}>
          <Button
            variant={side === 'buy' ? 'buy' : 'sell'}
            size="lg"
            fullWidth
            onPress={handleSubmit}
          >
            {`Đặt lệnh ${side === 'buy' ? 'MUA' : 'BÁN'} ${SELECTED_STOCK.symbol}`}
          </Button>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
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

  // Symbol Selector
  symbolSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.bg.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: theme.border.primary,
    marginHorizontal: spacing[4],
    marginBottom: spacing[4],
    padding: spacing[3],
    gap: spacing[3],
  },
  symbolInfo: {
    flex: 1,
  },
  symbolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  exchangeBadge: {
    backgroundColor: theme.bg.tertiary,
    paddingHorizontal: spacing[1.5],
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  symbolPrice: {
    alignItems: 'flex-end',
  },

  // Price Level Bar
  priceLevelContainer: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[5],
  },
  priceLevelBar: {
    height: 4,
    backgroundColor: theme.bg.tertiary,
    borderRadius: radius.full,
    position: 'relative',
  },
  priceLevelIndicator: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    marginLeft: -6,
    backgroundColor: theme.brand.primary,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.bg.primary,
  },
  priceLevelLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[2],
  },

  // Side Tabs
  sideContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing[4],
    marginBottom: spacing[5],
    backgroundColor: theme.bg.card,
    borderRadius: radius.lg,
    padding: spacing[1],
  },
  sideTab: {
    flex: 1,
    paddingVertical: spacing[3],
    alignItems: 'center',
    borderRadius: radius.md,
  },
  buyTab: {
    backgroundColor: theme.semantic.positive,
  },
  sellTab: {
    backgroundColor: theme.semantic.negative,
  },
  sideText: {
    color: theme.text.tertiary,
  },
  sideTextActive: {
    color: '#FFFFFF',
  },

  // Section
  section: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[5],
  },
  sectionLabel: {
    color: theme.text.tertiary,
    marginBottom: spacing[2],
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  priceInfo: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  hint: {
    marginTop: spacing[2],
    fontStyle: 'italic',
  },

  // Order Types
  orderTypes: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  orderTypeButton: {
    flex: 1,
    paddingVertical: spacing[3],
    alignItems: 'center',
    backgroundColor: theme.bg.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: theme.border.primary,
  },
  orderTypeActive: {
    backgroundColor: theme.brand.primary,
    borderColor: theme.brand.primary,
  },
  orderTypeText: {
    color: theme.text.secondary,
  },
  orderTypeTextActive: {
    color: '#FFFFFF',
  },

  // Quick Quantity
  quickQuantity: {
    flexDirection: 'row',
    marginTop: spacing[3],
    gap: spacing[2],
  },
  quickButton: {
    flex: 1,
    paddingVertical: spacing[2],
    alignItems: 'center',
    backgroundColor: theme.bg.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: theme.border.primary,
  },
  quickButtonActive: {
    borderColor: theme.brand.primary,
    backgroundColor: theme.brand.muted,
  },
  quickButtonText: {
    color: theme.text.secondary,
  },
  quickButtonTextActive: {
    color: theme.brand.primary,
  },

  // Summary
  summaryCard: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[5],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  totalRow: {
    marginTop: spacing[2],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: theme.border.primary,
    marginBottom: 0,
  },

  // Submit
  submitSection: {
    paddingHorizontal: spacing[4],
  },
})
