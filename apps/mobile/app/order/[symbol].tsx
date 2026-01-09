/**
 * SmartTrade AI v1.3.0 - Theme-Aware Order Screen
 */

import React, { useState, useMemo } from 'react'
import { View, ScrollView, StyleSheet, Alert, ViewStyle } from 'react-native'
import { useLocalSearchParams, router, Stack } from 'expo-router'
import { Heading4, Body, Caption, PriceText, ChangeText, SymbolText } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { NumericInput } from '@/components/ui/Input'
import { PriceLevelBar } from '@/components/stocks/PriceDisplay'
import { useTheme } from '@/context/ThemeContext'
import { spacing, layout, radius } from '@/theme/spacing'
import { TouchableOpacity } from 'react-native-gesture-handler'

// Demo stock data
const DEMO_STOCK = {
  symbol: 'VNM',
  name: 'Vinamilk',
  price: 76500,
  reference: 75000,
  ceiling: 80200,
  floor: 69800,
  change: 1500,
  changePercent: 2.0,
}

const ORDER_TYPES = ['LO', 'MP', 'ATO', 'ATC']

export default function OrderScreen() {
  const { theme } = useTheme()
  const { symbol, side: initialSide } = useLocalSearchParams<{ symbol: string; side?: string }>()

  const [side, setSide] = useState<'buy' | 'sell'>((initialSide as 'buy' | 'sell') || 'buy')
  const [orderType, setOrderType] = useState('LO')
  const [price, setPrice] = useState(DEMO_STOCK.price)
  const [quantity, setQuantity] = useState(100)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const orderValue = price * quantity
  const fee = orderValue * 0.0015

  // Dynamic styles based on theme
  const dynamicStyles = useMemo(() => ({
    container: {
      backgroundColor: theme.bg.primary,
    } as ViewStyle,
    sideContainer: {
      backgroundColor: theme.bg.tertiary,
    } as ViewStyle,
    buyTab: {
      backgroundColor: theme.stock.up,
    } as ViewStyle,
    sellTab: {
      backgroundColor: theme.stock.down,
    } as ViewStyle,
    sideText: {
      color: theme.text.tertiary,
    },
    sideTextActive: {
      color: '#FFFFFF',
    },
    orderTypeBtn: {
      backgroundColor: theme.bg.tertiary,
    } as ViewStyle,
    orderTypeBtnActive: {
      backgroundColor: theme.brand.primary,
    } as ViewStyle,
    orderTypeText: {
      color: theme.text.secondary,
    },
    orderTypeTextActive: {
      color: '#FFFFFF',
    },
    totalRow: {
      borderTopColor: theme.border.primary,
    } as ViewStyle,
  }), [theme])

  const handleSubmit = async () => {
    setIsSubmitting(true)

    // Validate
    if (price < DEMO_STOCK.floor || price > DEMO_STOCK.ceiling) {
      Alert.alert('Lỗi', 'Giá phải nằm trong khoảng sàn - trần')
      setIsSubmitting(false)
      return
    }

    if (quantity < 100 || quantity % 100 !== 0) {
      Alert.alert('Lỗi', 'Khối lượng phải là bội số của 100')
      setIsSubmitting(false)
      return
    }

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      Alert.alert(
        'Thành công',
        `Đã đặt lệnh ${side === 'buy' ? 'MUA' : 'BÁN'} ${quantity} ${symbol} giá ${price.toLocaleString('vi-VN')}`,
        [{ text: 'OK', onPress: () => router.back() }]
      )
    }, 1000)
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: `Đặt lệnh ${symbol}`,
          presentation: 'modal',
        }}
      />

      <ScrollView style={[styles.container, dynamicStyles.container]} showsVerticalScrollIndicator={false}>
        {/* Stock Info */}
        <Card padding="md" style={styles.stockCard}>
          <View style={styles.stockHeader}>
            <View>
              <SymbolText>{DEMO_STOCK.symbol}</SymbolText>
              <Caption>{DEMO_STOCK.name}</Caption>
            </View>
            <View style={styles.stockPrice}>
              <PriceText value={DEMO_STOCK.price} change={DEMO_STOCK.change} />
              <ChangeText percent={DEMO_STOCK.changePercent} />
            </View>
          </View>
          <PriceLevelBar
            price={DEMO_STOCK.price}
            reference={DEMO_STOCK.reference}
            ceiling={DEMO_STOCK.ceiling}
            floor={DEMO_STOCK.floor}
          />
        </Card>

        {/* Buy/Sell Tabs */}
        <View style={[styles.sideContainer, dynamicStyles.sideContainer]}>
          <TouchableOpacity
            style={[styles.sideTab, side === 'buy' && dynamicStyles.buyTab]}
            onPress={() => setSide('buy')}
            activeOpacity={0.8}
          >
            <Body style={[
              styles.sideText,
              dynamicStyles.sideText,
              side === 'buy' && dynamicStyles.sideTextActive
            ]}>MUA</Body>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sideTab, side === 'sell' && dynamicStyles.sellTab]}
            onPress={() => setSide('sell')}
            activeOpacity={0.8}
          >
            <Body style={[
              styles.sideText,
              dynamicStyles.sideText,
              side === 'sell' && dynamicStyles.sideTextActive
            ]}>BÁN</Body>
          </TouchableOpacity>
        </View>

        {/* Order Type */}
        <View style={styles.section}>
          <Caption style={styles.label}>Loại lệnh</Caption>
          <View style={styles.orderTypes}>
            {ORDER_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.orderTypeBtn,
                  dynamicStyles.orderTypeBtn,
                  orderType === type && dynamicStyles.orderTypeBtnActive
                ]}
                onPress={() => setOrderType(type)}
              >
                <Body style={[
                  styles.orderTypeText,
                  dynamicStyles.orderTypeText,
                  orderType === type && dynamicStyles.orderTypeTextActive
                ]}>
                  {type}
                </Body>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Price */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Caption style={styles.label}>Giá</Caption>
            <Caption style={{ color: theme.stock.floor }}>Sàn: {DEMO_STOCK.floor.toLocaleString('vi-VN')}</Caption>
            <Caption style={{ color: theme.stock.ceiling }}>Trần: {DEMO_STOCK.ceiling.toLocaleString('vi-VN')}</Caption>
          </View>
          <NumericInput
            value={price}
            onChangeValue={setPrice}
            min={DEMO_STOCK.floor}
            max={DEMO_STOCK.ceiling}
            step={100}
          />
        </View>

        {/* Quantity */}
        <View style={styles.section}>
          <Caption style={styles.label}>Khối lượng</Caption>
          <NumericInput
            value={quantity}
            onChangeValue={setQuantity}
            min={100}
            step={100}
            suffix="CP"
          />
        </View>

        {/* Summary */}
        <Card padding="md" style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Caption>Giá trị lệnh</Caption>
            <Body style={styles.summaryValue}>{orderValue.toLocaleString('vi-VN')}đ</Body>
          </View>
          <View style={styles.summaryRow}>
            <Caption>Phí GD (ước tính)</Caption>
            <Body style={styles.summaryValue}>{Math.round(fee).toLocaleString('vi-VN')}đ</Body>
          </View>
          <View style={[styles.summaryRow, styles.totalRow, dynamicStyles.totalRow]}>
            <Body>Tổng {side === 'buy' ? 'tiền mua' : 'tiền bán'}</Body>
            <Heading4 style={{ color: side === 'buy' ? theme.stock.up : theme.stock.down }}>
              {Math.round(orderValue + (side === 'buy' ? fee : -fee)).toLocaleString('vi-VN')}đ
            </Heading4>
          </View>
        </Card>

        {/* Submit */}
        <View style={styles.submitSection}>
          <Button
            variant={side === 'buy' ? 'success' : 'danger'}
            size="lg"
            fullWidth
            loading={isSubmitting}
            onPress={handleSubmit}
          >
            {side === 'buy' ? 'XÁC NHẬN MUA' : 'XÁC NHẬN BÁN'}
          </Button>
        </View>
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Stock card
  stockCard: {
    margin: layout.screenPadding,
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  stockPrice: {
    alignItems: 'flex-end',
  },

  // Side tabs
  sideContainer: {
    flexDirection: 'row',
    marginHorizontal: layout.screenPadding,
    marginBottom: spacing[5],
    borderRadius: radius.lg,
    padding: spacing[1],
  },
  sideTab: {
    flex: 1,
    paddingVertical: spacing[3],
    alignItems: 'center',
    borderRadius: radius.md,
  },
  sideText: {
    fontWeight: '600',
  },

  // Section
  section: {
    paddingHorizontal: layout.screenPadding,
    marginBottom: spacing[5],
  },
  label: {
    marginBottom: spacing[2],
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },

  // Order types
  orderTypes: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  orderTypeBtn: {
    flex: 1,
    paddingVertical: spacing[3],
    alignItems: 'center',
    borderRadius: radius.md,
  },
  orderTypeText: {
    fontWeight: '500',
  },

  // Summary
  summaryCard: {
    marginHorizontal: layout.screenPadding,
    marginBottom: spacing[5],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  summaryValue: {
    fontWeight: '500',
  },
  totalRow: {
    marginTop: spacing[2],
    paddingTop: spacing[3],
    borderTopWidth: 1,
  },

  // Submit
  submitSection: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing[8],
  },
})
