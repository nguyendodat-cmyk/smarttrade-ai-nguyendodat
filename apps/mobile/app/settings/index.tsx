/**
 * SmartTrade AI - Settings Screen
 * Main settings hub with profile and preferences
 */

import React from 'react'
import { View, StyleSheet, ScrollView, Pressable, Switch } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import {
  User,
  Bell,
  Shield,
  Palette,
  HelpCircle,
  FileText,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  ArrowLeft,
  Crown,
} from 'lucide-react-native'

import { Text } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import { useTheme } from '@/context/ThemeContext'
import { spacing, radius } from '@/theme/spacing'
import { Theme } from '@/theme/colors'

// Mock user data
const mockUser = {
  name: 'Nguyen Van A',
  email: 'nguyenvana@email.com',
  subscription: 'FREE',
  avatar: null,
}

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme()
  const styles = createStyles(theme)

  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    router.replace('/(auth)/login')
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme.text.primary} strokeWidth={1.5} />
        </Pressable>
        <Text variant="h3">Cai dat</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Pressable
            style={styles.profileCard}
            onPress={() => router.push('/settings/profile')}
          >
            <View style={[styles.avatar, { backgroundColor: theme.brand.primary }]}>
              <Text variant="h3" style={{ color: '#FFF' }}>
                {mockUser.name.charAt(0)}
              </Text>
            </View>

            <View style={styles.profileInfo}>
              <Text variant="h4">{mockUser.name}</Text>
              <Text variant="bodySmall" color="secondary">{mockUser.email}</Text>
              <View style={[styles.planBadge, { backgroundColor: theme.brand.muted }]}>
                <Crown size={12} color={theme.brand.primary} strokeWidth={2} />
                <Text variant="labelSmall" style={{ color: theme.brand.primary }}>
                  {mockUser.subscription}
                </Text>
              </View>
            </View>

            <ChevronRight size={20} color={theme.text.tertiary} strokeWidth={1.5} />
          </Pressable>
        </Animated.View>

        {/* Quick Theme Toggle */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <Card style={styles.themeCard} padding="md">
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconBox, { backgroundColor: theme.brand.muted }]}>
                  {isDark ? (
                    <Moon size={20} color={theme.brand.primary} strokeWidth={1.5} />
                  ) : (
                    <Sun size={20} color={theme.brand.primary} strokeWidth={1.5} />
                  )}
                </View>
                <View>
                  <Text variant="body">Che do toi</Text>
                  <Text variant="bodySmall" color="tertiary">
                    {isDark ? 'Dang bat' : 'Dang tat'}
                  </Text>
                </View>
              </View>
              <Switch
                value={isDark}
                onValueChange={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  toggleTheme()
                }}
                trackColor={{
                  false: theme.border.primary,
                  true: theme.brand.primary,
                }}
                thumbColor="#FFFFFF"
              />
            </View>
          </Card>
        </Animated.View>

        {/* Account Section */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <View style={styles.section}>
            <Text variant="labelSmall" color="tertiary" style={styles.sectionTitle}>
              TAI KHOAN
            </Text>
            <Card padding="none">
              <SettingItem
                icon={User}
                label="Thong tin ca nhan"
                onPress={() => router.push('/settings/profile')}
                theme={theme}
              />
              <SettingItem
                icon={Shield}
                label="Bao mat"
                subtitle="Mat khau, 2FA"
                onPress={() => router.push('/settings/security')}
                theme={theme}
              />
              <SettingItem
                icon={Bell}
                label="Thong bao"
                onPress={() => router.push('/settings/notifications')}
                theme={theme}
                isLast
              />
            </Card>
          </View>
        </Animated.View>

        {/* App Section */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)}>
          <View style={styles.section}>
            <Text variant="labelSmall" color="tertiary" style={styles.sectionTitle}>
              UNG DUNG
            </Text>
            <Card padding="none">
              <SettingItem
                icon={Palette}
                label="Giao dien"
                subtitle={isDark ? 'Toi' : 'Sang'}
                onPress={() => router.push('/settings/appearance')}
                theme={theme}
              />
              <SettingItem
                icon={HelpCircle}
                label="Tro giup & Ho tro"
                onPress={() => {}}
                theme={theme}
              />
              <SettingItem
                icon={FileText}
                label="Dieu khoan & Chinh sach"
                onPress={() => {}}
                theme={theme}
                isLast
              />
            </Card>
          </View>
        </Animated.View>

        {/* Logout */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color={theme.semantic.negative} strokeWidth={1.5} />
            <Text variant="body" style={{ color: theme.semantic.negative }}>
              Dang xuat
            </Text>
          </Pressable>
        </Animated.View>

        {/* Version */}
        <Animated.View entering={FadeInDown.delay(350).duration(400)}>
          <Text variant="bodySmall" color="tertiary" style={styles.version}>
            SmartTrade AI v1.0.0
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  )
}

// Setting Item Component
function SettingItem({
  icon: Icon,
  label,
  subtitle,
  onPress,
  theme,
  isLast = false,
}: {
  icon: any
  label: string
  subtitle?: string
  onPress: () => void
  theme: Theme
  isLast?: boolean
}) {
  return (
    <Pressable
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          padding: spacing[4],
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: theme.border.primary,
        },
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        onPress()
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          backgroundColor: theme.bg.tertiary,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing[3],
        }}
      >
        <Icon size={20} color={theme.text.secondary} strokeWidth={1.5} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="body">{label}</Text>
        {subtitle && (
          <Text variant="bodySmall" color="tertiary">{subtitle}</Text>
        )}
      </View>
      <ChevronRight size={18} color={theme.text.tertiary} strokeWidth={1.5} />
    </Pressable>
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

  // Profile
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.bg.secondary,
    borderRadius: radius.xl,
    padding: spacing[4],
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: theme.border.primary,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  profileInfo: {
    flex: 1,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginTop: spacing[1],
  },

  // Theme Card
  themeCard: {
    marginBottom: spacing[6],
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Section
  section: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    marginBottom: spacing[2],
    marginLeft: spacing[1],
  },

  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    padding: spacing[4],
    marginTop: spacing[2],
  },

  // Version
  version: {
    textAlign: 'center',
    marginTop: spacing[4],
  },
})
