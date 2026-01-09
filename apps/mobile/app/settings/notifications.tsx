/**
 * SmartTrade AI - Notification Settings
 * Configure push notification preferences
 */

import React, { useState } from 'react'
import { View, StyleSheet, ScrollView, Pressable, Switch } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import {
  ArrowLeft,
  Bell,
  TrendingUp,
  ShoppingCart,
  Newspaper,
  Zap,
  Clock,
} from 'lucide-react-native'

import { Text } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import { useTheme } from '@/context/ThemeContext'
import { spacing, radius } from '@/theme/spacing'
import { Theme } from '@/theme/colors'

export default function NotificationsSettingsScreen() {
  const { theme } = useTheme()
  const [settings, setSettings] = useState({
    priceAlerts: true,
    orderUpdates: true,
    marketNews: false,
    aiInsights: true,
    dailySummary: true,
  })

  const styles = createStyles(theme)

  const toggleSetting = (key: keyof typeof settings) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme.text.primary} strokeWidth={1.5} />
        </Pressable>
        <Text variant="h3">Thong bao</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Trading Notifications */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Text variant="labelSmall" color="tertiary" style={styles.sectionTitle}>
            GIAO DICH
          </Text>
          <Card padding="none" style={styles.card}>
            <NotificationRow
              icon={TrendingUp}
              iconColor={theme.semantic.positive}
              title="Canh bao gia"
              description="Thong bao khi gia cham nguong dat truoc"
              enabled={settings.priceAlerts}
              onToggle={() => toggleSetting('priceAlerts')}
              theme={theme}
            />
            <NotificationRow
              icon={ShoppingCart}
              iconColor={theme.brand.primary}
              title="Cap nhat lenh"
              description="Trang thai khop lenh, huy lenh"
              enabled={settings.orderUpdates}
              onToggle={() => toggleSetting('orderUpdates')}
              theme={theme}
              isLast
            />
          </Card>
        </Animated.View>

        {/* Content Notifications */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Text variant="labelSmall" color="tertiary" style={styles.sectionTitle}>
            NOI DUNG
          </Text>
          <Card padding="none" style={styles.card}>
            <NotificationRow
              icon={Newspaper}
              iconColor={theme.semantic.info}
              title="Tin tuc thi truong"
              description="Tin tuc va phan tich moi nhat"
              enabled={settings.marketNews}
              onToggle={() => toggleSetting('marketNews')}
              theme={theme}
            />
            <NotificationRow
              icon={Zap}
              iconColor={theme.semantic.warning}
              title="Khuyen nghi AI"
              description="Goi y giao dich tu SmartTrade AI"
              enabled={settings.aiInsights}
              onToggle={() => toggleSetting('aiInsights')}
              theme={theme}
            />
            <NotificationRow
              icon={Clock}
              iconColor={theme.text.secondary}
              title="Tom tat hang ngay"
              description="Bao cao danh muc cuoi ngay"
              enabled={settings.dailySummary}
              onToggle={() => toggleSetting('dailySummary')}
              theme={theme}
              isLast
            />
          </Card>
        </Animated.View>

        {/* Info */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <View style={styles.infoBox}>
            <Bell size={20} color={theme.text.tertiary} strokeWidth={1.5} />
            <Text variant="bodySmall" color="tertiary" style={styles.infoText}>
              De nhan thong bao, hay bat thong bao cho ung dung SmartTrade AI trong cai dat he thong.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  )
}

function NotificationRow({
  icon: Icon,
  iconColor,
  title,
  description,
  enabled,
  onToggle,
  theme,
  isLast = false,
}: {
  icon: any
  iconColor: string
  title: string
  description: string
  enabled: boolean
  onToggle: () => void
  theme: Theme
  isLast?: boolean
}) {
  return (
    <View style={[
      {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing[4],
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: theme.border.primary,
      },
    ]}>
      <View style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: iconColor + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[3],
      }}>
        <Icon size={20} color={iconColor} strokeWidth={1.5} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="body">{title}</Text>
        <Text variant="bodySmall" color="tertiary">{description}</Text>
      </View>
      <Switch
        value={enabled}
        onValueChange={onToggle}
        trackColor={{
          false: theme.border.primary,
          true: theme.brand.primary,
        }}
        thumbColor="#FFFFFF"
      />
    </View>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.border.primary,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing[4],
    paddingBottom: 100,
  },

  // Section
  sectionTitle: {
    marginBottom: spacing[2],
    marginLeft: spacing[1],
  },
  card: {
    marginBottom: spacing[6],
  },

  // Info
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    padding: spacing[4],
    backgroundColor: theme.bg.secondary,
    borderRadius: radius.lg,
  },
  infoText: {
    flex: 1,
  },
})
