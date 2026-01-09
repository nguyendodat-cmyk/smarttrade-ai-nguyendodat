/**
 * SmartTrade AI - Notification Center
 * View and manage all notifications
 */

import React, { useState } from 'react'
import { View, StyleSheet, FlatList, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import Animated, { FadeInRight, FadeOutLeft, Layout } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Bell,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Settings,
} from 'lucide-react-native'

import { Text } from '@/components/ui/Text'
import { useTheme } from '@/context/ThemeContext'
import { spacing, radius } from '@/theme/spacing'
import { Theme } from '@/theme/colors'

interface Notification {
  id: string
  type: 'price_alert' | 'order' | 'news' | 'system' | 'ai'
  title: string
  message: string
  time: string
  read: boolean
  data?: any
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'price_alert',
    title: 'VNM dat gia muc tieu',
    message: 'VNM da tang len 77,000 (+2.5%)',
    time: '5 phut truoc',
    read: false,
  },
  {
    id: '2',
    type: 'order',
    title: 'Lenh mua da khop',
    message: 'Mua 100 FPT @ 92,100 da khop hoan toan',
    time: '30 phut truoc',
    read: false,
  },
  {
    id: '3',
    type: 'ai',
    title: 'Khuyen nghi AI',
    message: 'VNM dang o vung ho tro manh, co the xem xet mua',
    time: '1 gio truoc',
    read: false,
  },
  {
    id: '4',
    type: 'news',
    title: 'Tin tuc: FPT',
    message: 'FPT cong bo ket qua kinh doanh Q4 vuot ky vong',
    time: '2 gio truoc',
    read: true,
  },
  {
    id: '5',
    type: 'price_alert',
    title: 'MWG cham san',
    message: 'MWG giam xuong gia san 45,000 (-7%)',
    time: '3 gio truoc',
    read: true,
  },
  {
    id: '6',
    type: 'system',
    title: 'Cap nhat ung dung',
    message: 'Phien ban moi 1.1.0 da san sang',
    time: '1 ngay truoc',
    read: true,
  },
]

export default function NotificationsScreen() {
  const { theme } = useTheme()
  const [notifications, setNotifications] = useState(mockNotifications)
  const styles = createStyles(theme)

  const getIcon = (type: string) => {
    switch (type) {
      case 'price_alert':
        return TrendingUp
      case 'order':
        return CheckCircle
      case 'news':
      case 'ai':
        return AlertTriangle
      default:
        return Bell
    }
  }

  const getIconColor = (type: string) => {
    switch (type) {
      case 'price_alert':
        return theme.semantic.positive
      case 'order':
        return theme.brand.primary
      case 'news':
        return theme.semantic.info
      case 'ai':
        return theme.semantic.warning
      default:
        return theme.text.secondary
    }
  }

  const markAsRead = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const deleteNotification = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const markAllAsRead = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const renderItem = ({ item, index }: { item: Notification; index: number }) => {
    const Icon = getIcon(item.type)
    const iconColor = getIconColor(item.type)

    return (
      <Animated.View
        entering={FadeInRight.delay(index * 50).duration(300)}
        exiting={FadeOutLeft.duration(200)}
        layout={Layout.springify()}
      >
        <Pressable
          style={[styles.notificationItem, !item.read && styles.unread]}
          onPress={() => markAsRead(item.id)}
        >
          <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
            <Icon size={20} color={iconColor} strokeWidth={1.5} />
          </View>

          <View style={styles.notificationContent}>
            <View style={styles.notificationHeader}>
              <Text
                variant="body"
                style={{ fontWeight: '600', flex: 1 }}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {!item.read && <View style={[styles.unreadDot, { backgroundColor: theme.brand.primary }]} />}
            </View>
            <Text variant="bodySmall" color="secondary" numberOfLines={2}>
              {item.message}
            </Text>
            <Text variant="labelSmall" color="tertiary" style={styles.time}>
              {item.time}
            </Text>
          </View>

          <Pressable
            style={styles.deleteButton}
            onPress={() => deleteNotification(item.id)}
            hitSlop={10}
          >
            <Trash2 size={16} color={theme.text.tertiary} strokeWidth={1.5} />
          </Pressable>
        </Pressable>
      </Animated.View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.headerButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme.text.primary} strokeWidth={1.5} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text variant="h3">Thong bao</Text>
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: theme.brand.primary }]}>
              <Text variant="labelSmall" style={{ color: '#FFF', fontSize: 10 }}>
                {unreadCount}
              </Text>
            </View>
          )}
        </View>
        <Pressable
          style={styles.headerButton}
          onPress={() => router.push('/settings/notifications')}
        >
          <Settings size={22} color={theme.text.primary} strokeWidth={1.5} />
        </Pressable>
      </View>

      {/* Mark All Read */}
      {unreadCount > 0 && (
        <Pressable style={styles.markAllButton} onPress={markAllAsRead}>
          <Text variant="bodySmall" style={{ color: theme.brand.primary }}>
            Danh dau tat ca da doc
          </Text>
        </Pressable>
      )}

      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.bg.secondary }]}>
            <Bell size={48} color={theme.text.tertiary} strokeWidth={1} />
          </View>
          <Text variant="body" color="tertiary" style={styles.emptyText}>
            Khong co thong bao moi
          </Text>
          <Text variant="bodySmall" color="tertiary" style={styles.emptySubtext}>
            Cac thong bao ve gia, lenh, tin tuc se hien thi o day
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
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
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: theme.border.primary,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  markAllButton: {
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.border.primary,
  },
  listContent: {
    padding: spacing[4],
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.bg.secondary,
    borderRadius: radius.lg,
    padding: spacing[3],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: theme.border.primary,
  },
  unread: {
    borderColor: theme.brand.primary + '40',
    backgroundColor: theme.brand.muted,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: spacing[2],
  },
  time: {
    marginTop: spacing[1],
  },
  deleteButton: {
    padding: spacing[2],
    marginLeft: spacing[2],
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  emptyText: {
    marginBottom: spacing[2],
  },
  emptySubtext: {
    textAlign: 'center',
  },
})
