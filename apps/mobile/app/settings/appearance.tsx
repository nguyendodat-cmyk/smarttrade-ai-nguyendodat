/**
 * SmartTrade AI - Appearance Settings
 * Theme selection (Light, Dark, System)
 */

import React from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { ArrowLeft, Sun, Moon, Smartphone, Check } from 'lucide-react-native'

import { Text } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import { useTheme, ThemeMode } from '@/context/ThemeContext'
import { spacing, radius } from '@/theme/spacing'
import { Theme } from '@/theme/colors'

const THEME_OPTIONS: { key: ThemeMode; label: string; description: string; icon: any }[] = [
  {
    key: 'light',
    label: 'Sang',
    description: 'Nen trang, phu hop ban ngay',
    icon: Sun,
  },
  {
    key: 'dark',
    label: 'Toi',
    description: 'Nen den, de chiu cho mat',
    icon: Moon,
  },
  {
    key: 'system',
    label: 'Theo he thong',
    description: 'Tu dong theo cai dat dien thoai',
    icon: Smartphone,
  },
]

export default function AppearanceScreen() {
  const { theme, mode, setMode, isDark } = useTheme()
  const styles = createStyles(theme)

  const handleSelectTheme = (newMode: ThemeMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setMode(newMode)
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme.text.primary} strokeWidth={1.5} />
        </Pressable>
        <Text variant="h3">Giao dien</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        {/* Theme Preview */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <View style={styles.preview}>
            <View style={[
              styles.previewBox,
              isDark ? styles.previewDark : styles.previewLight,
            ]}>
              <View style={[styles.previewHeader, { backgroundColor: isDark ? '#111' : '#F8F9FA' }]}>
                <View style={[styles.previewDot, { backgroundColor: '#FF6B35' }]} />
              </View>
              <View style={styles.previewContent}>
                <View style={[styles.previewLine, { backgroundColor: isDark ? '#333' : '#E5E7EB' }]} />
                <View style={[styles.previewLineShort, { backgroundColor: isDark ? '#333' : '#E5E7EB' }]} />
              </View>
            </View>
            <Text variant="bodySmall" color="secondary" style={styles.previewLabel}>
              Xem truoc: {isDark ? 'Che do toi' : 'Che do sang'}
            </Text>
          </View>
        </Animated.View>

        {/* Theme Options */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Text variant="labelSmall" color="tertiary" style={styles.sectionTitle}>
            CHON GIAO DIEN
          </Text>
          <Card padding="none">
            {THEME_OPTIONS.map((option, index) => {
              const Icon = option.icon
              const isSelected = mode === option.key
              const isLast = index === THEME_OPTIONS.length - 1

              return (
                <Pressable
                  key={option.key}
                  style={[
                    styles.optionRow,
                    !isLast && { borderBottomWidth: 1, borderBottomColor: theme.border.primary },
                  ]}
                  onPress={() => handleSelectTheme(option.key)}
                >
                  <View style={[
                    styles.optionIcon,
                    isSelected && { backgroundColor: theme.brand.muted },
                  ]}>
                    <Icon
                      size={20}
                      color={isSelected ? theme.brand.primary : theme.text.secondary}
                      strokeWidth={1.5}
                    />
                  </View>

                  <View style={styles.optionText}>
                    <Text variant="body" style={isSelected && { color: theme.brand.primary }}>
                      {option.label}
                    </Text>
                    <Text variant="bodySmall" color="tertiary">
                      {option.description}
                    </Text>
                  </View>

                  {isSelected && (
                    <View style={[styles.checkCircle, { backgroundColor: theme.brand.primary }]}>
                      <Check size={14} color="#FFF" strokeWidth={2.5} />
                    </View>
                  )}
                </Pressable>
              )
            })}
          </Card>
        </Animated.View>

        {/* Info */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <View style={styles.infoBox}>
            <Text variant="bodySmall" color="tertiary" style={{ textAlign: 'center' }}>
              Che do toi giup giam moi mat khi su dung trong moi truong it anh sang
              va tiet kiem pin tren man hinh OLED.
            </Text>
          </View>
        </Animated.View>
      </View>
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
  content: {
    flex: 1,
    padding: spacing[4],
  },

  // Preview
  preview: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  previewBox: {
    width: 160,
    height: 120,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 2,
  },
  previewDark: {
    backgroundColor: '#000',
    borderColor: '#333',
  },
  previewLight: {
    backgroundColor: '#FFF',
    borderColor: '#E5E7EB',
  },
  previewHeader: {
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
  },
  previewDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  previewContent: {
    flex: 1,
    padding: spacing[2],
    gap: spacing[2],
  },
  previewLine: {
    height: 8,
    borderRadius: 4,
    width: '100%',
  },
  previewLineShort: {
    height: 8,
    borderRadius: 4,
    width: '60%',
  },
  previewLabel: {
    marginTop: spacing[3],
  },

  // Section
  sectionTitle: {
    marginBottom: spacing[2],
    marginLeft: spacing[1],
  },

  // Options
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  optionText: {
    flex: 1,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Info
  infoBox: {
    marginTop: spacing[6],
    padding: spacing[4],
    backgroundColor: theme.bg.secondary,
    borderRadius: radius.lg,
  },
})
