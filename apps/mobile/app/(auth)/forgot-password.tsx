/**
 * SmartTrade AI - Forgot Password Screen
 * Password reset flow
 */

import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react-native'

import { Text } from '@/components/ui/Text'
import { Button } from '@/components/ui/Button'
import { useTheme } from '@/context/ThemeContext'
import { spacing, radius } from '@/theme/spacing'
import { Theme } from '@/theme/colors'

export default function ForgotPasswordScreen() {
  const { theme } = useTheme()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email)

  const handleSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    if (!email) {
      setError('Email la bat buoc')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      return
    }
    if (!validateEmail(email)) {
      setError('Email khong hop le')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      return
    }

    setLoading(true)
    setError(null)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setSuccess(true)
    } catch (err) {
      setError('Co loi xay ra, vui long thu lai')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    } finally {
      setLoading(false)
    }
  }

  const styles = createStyles(theme)

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            <View style={[styles.successIcon, { backgroundColor: theme.semantic.positive + '20' }]}>
              <CheckCircle size={48} color={theme.semantic.positive} strokeWidth={1.5} />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.successText}>
            <Text variant="h3" style={{ textAlign: 'center' }}>Kiem tra email</Text>
            <Text variant="body" color="secondary" style={{ textAlign: 'center' }}>
              Chung toi da gui huong dan khoi phuc mat khau den{'\n'}
              <Text variant="body" style={{ color: theme.brand.primary }}>{email}</Text>
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.successActions}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onPress={() => router.replace('/(auth)/login')}
            >
              Quay lai dang nhap
            </Button>

            <Pressable style={styles.resendLink} onPress={() => setSuccess(false)}>
              <Text variant="bodySmall" color="tertiary">
                Khong nhan duoc email?{' '}
                <Text variant="bodySmall" style={{ color: theme.brand.primary }}>
                  Gui lai
                </Text>
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
              hitSlop={10}
            >
              <ArrowLeft size={24} color={theme.text.primary} strokeWidth={1.5} />
            </Pressable>
            <View style={styles.headerText}>
              <Text variant="h2">Quen mat khau</Text>
              <Text variant="body" color="secondary">
                Nhap email de nhan huong dan khoi phuc
              </Text>
            </View>
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.form}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <View style={[styles.iconBox, { backgroundColor: theme.brand.muted }]}>
                <Mail size={32} color={theme.brand.primary} strokeWidth={1.5} />
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text variant="labelSmall" color="tertiary" style={styles.label}>EMAIL</Text>
              <View style={[
                styles.inputWrapper,
                focusedField === 'email' ? styles.inputFocused : undefined,
                error ? styles.inputError : undefined,
              ]}>
                <Mail size={20} color={theme.text.tertiary} strokeWidth={1.5} />
                <TextInput
                  style={[styles.input, { color: theme.text.primary }]}
                  placeholder="name@example.com"
                  placeholderTextColor={theme.text.tertiary}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text)
                    setError(null)
                  }}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoFocus
                />
              </View>
              {error && (
                <Text variant="bodySmall" style={styles.errorText}>{error}</Text>
              )}
            </View>

            {/* Submit Button */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              onPress={handleSubmit}
            >
              Gui huong dan
            </Button>
          </Animated.View>

          {/* Back to Login */}
          <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.loginLink}>
            <Pressable onPress={() => router.back()}>
              <Text variant="body" color="secondary">
                Nho mat khau?{' '}
                <Text variant="body" style={{ color: theme.brand.primary, fontWeight: '600' }}>
                  Dang nhap
                </Text>
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing[6],
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing[8],
    gap: spacing[4],
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.bg.secondary,
    borderRadius: radius.lg,
    marginTop: spacing[1],
  },
  headerText: {
    flex: 1,
    gap: spacing[1],
  },

  // Form
  form: {
    marginBottom: spacing[6],
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputGroup: {
    marginBottom: spacing[6],
  },
  label: {
    marginBottom: spacing[2],
    marginLeft: spacing[1],
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.bg.secondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: theme.border.primary,
    paddingHorizontal: spacing[4],
    height: 52,
    gap: spacing[3],
  },
  inputFocused: {
    borderColor: theme.brand.primary,
  },
  inputError: {
    borderColor: theme.semantic.negative,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  errorText: {
    color: theme.semantic.negative,
    marginTop: spacing[1],
    marginLeft: spacing[1],
  },

  // Login Link
  loginLink: {
    alignItems: 'center',
  },

  // Success State
  successContainer: {
    flex: 1,
    padding: spacing[6],
    justifyContent: 'center',
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing[6],
  },
  successText: {
    gap: spacing[2],
    marginBottom: spacing[8],
  },
  successActions: {
    gap: spacing[4],
  },
  resendLink: {
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
})
