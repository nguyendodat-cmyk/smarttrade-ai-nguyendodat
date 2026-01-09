/**
 * SmartTrade AI - Security Settings
 * Password, 2FA, and security options
 */

import React, { useState } from 'react'
import { View, StyleSheet, ScrollView, Pressable, Switch } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import {
  ArrowLeft,
  Key,
  Smartphone,
  Fingerprint,
  Shield,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react-native'

import { Text } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import { useTheme } from '@/context/ThemeContext'
import { spacing, radius } from '@/theme/spacing'
import { Theme } from '@/theme/colors'

export default function SecurityScreen() {
  const { theme } = useTheme()
  const [biometricEnabled, setBiometricEnabled] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

  const styles = createStyles(theme)

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme.text.primary} strokeWidth={1.5} />
        </Pressable>
        <Text variant="h3">Bao mat</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Password Section */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Text variant="labelSmall" color="tertiary" style={styles.sectionTitle}>
            MAT KHAU
          </Text>
          <Card padding="none" style={styles.card}>
            <Pressable
              style={styles.settingRow}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              }}
            >
              <View style={[styles.iconBox, { backgroundColor: theme.brand.muted }]}>
                <Key size={20} color={theme.brand.primary} strokeWidth={1.5} />
              </View>
              <View style={styles.settingText}>
                <Text variant="body">Doi mat khau</Text>
                <Text variant="bodySmall" color="tertiary">
                  Thay doi dinh ky de bao ve tai khoan
                </Text>
              </View>
              <ChevronRight size={18} color={theme.text.tertiary} strokeWidth={1.5} />
            </Pressable>
          </Card>
        </Animated.View>

        {/* Authentication Section */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Text variant="labelSmall" color="tertiary" style={styles.sectionTitle}>
            XAC THUC
          </Text>
          <Card padding="none" style={styles.card}>
            {/* Biometric */}
            <View style={[styles.settingRow, { borderBottomWidth: 1, borderBottomColor: theme.border.primary }]}>
              <View style={[styles.iconBox, { backgroundColor: theme.semantic.positive + '20' }]}>
                <Fingerprint size={20} color={theme.semantic.positive} strokeWidth={1.5} />
              </View>
              <View style={styles.settingText}>
                <Text variant="body">Van tay / Face ID</Text>
                <Text variant="bodySmall" color="tertiary">
                  Mo khoa nhanh bang sinh trac hoc
                </Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={(value) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  setBiometricEnabled(value)
                }}
                trackColor={{
                  false: theme.border.primary,
                  true: theme.brand.primary,
                }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* 2FA */}
            <View style={styles.settingRow}>
              <View style={[styles.iconBox, { backgroundColor: theme.semantic.info + '20' }]}>
                <Smartphone size={20} color={theme.semantic.info} strokeWidth={1.5} />
              </View>
              <View style={styles.settingText}>
                <Text variant="body">Xac thuc 2 buoc (2FA)</Text>
                <Text variant="bodySmall" color="tertiary">
                  Them lop bao ve voi ma OTP
                </Text>
              </View>
              <Switch
                value={twoFactorEnabled}
                onValueChange={(value) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  setTwoFactorEnabled(value)
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

        {/* Security Status */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Text variant="labelSmall" color="tertiary" style={styles.sectionTitle}>
            TRANG THAI BAO MAT
          </Text>
          <Card style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <View style={[
                styles.statusIcon,
                {
                  backgroundColor: biometricEnabled || twoFactorEnabled
                    ? theme.semantic.positive + '20'
                    : theme.semantic.warning + '20',
                },
              ]}>
                {biometricEnabled || twoFactorEnabled ? (
                  <Shield size={24} color={theme.semantic.positive} strokeWidth={1.5} />
                ) : (
                  <AlertTriangle size={24} color={theme.semantic.warning} strokeWidth={1.5} />
                )}
              </View>
              <View style={styles.statusText}>
                <Text variant="body" style={{
                  color: biometricEnabled || twoFactorEnabled
                    ? theme.semantic.positive
                    : theme.semantic.warning,
                }}>
                  {biometricEnabled || twoFactorEnabled ? 'Bao mat tot' : 'Can cai thien'}
                </Text>
                <Text variant="bodySmall" color="tertiary">
                  {biometricEnabled || twoFactorEnabled
                    ? 'Tai khoan cua ban duoc bao ve'
                    : 'Bat xac thuc 2 buoc de tang bao mat'
                  }
                </Text>
              </View>
            </View>

            <View style={styles.statusChecks}>
              <StatusCheck
                label="Mat khau manh"
                checked={true}
                theme={theme}
              />
              <StatusCheck
                label="Xac thuc sinh trac hoc"
                checked={biometricEnabled}
                theme={theme}
              />
              <StatusCheck
                label="Xac thuc 2 buoc"
                checked={twoFactorEnabled}
                theme={theme}
              />
            </View>
          </Card>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  )
}

function StatusCheck({
  label,
  checked,
  theme,
}: {
  label: string
  checked: boolean
  theme: Theme
}) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
      paddingVertical: spacing[1],
    }}>
      <View style={{
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: checked ? theme.semantic.positive : theme.border.primary,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {checked && (
          <Text variant="labelSmall" style={{ color: '#FFF', fontSize: 10 }}>✓</Text>
        )}
      </View>
      <Text variant="bodySmall" color={checked ? 'primary' : 'tertiary'}>
        {label}
      </Text>
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

  // Setting Row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  settingText: {
    flex: 1,
  },

  // Status Card
  statusCard: {
    marginBottom: spacing[4],
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
    gap: spacing[3],
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    flex: 1,
  },
  statusChecks: {
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: theme.border.primary,
  },
})
