/**
 * SmartTrade AI - Login Screen
 * Professional login with validation and social auth
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
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react-native'

import { Text } from '@/components/ui/Text'
import { Button } from '@/components/ui/Button'
import { useTheme } from '@/context/ThemeContext'
import { spacing, radius } from '@/theme/spacing'
import { Theme } from '@/theme/colors'

export default function LoginScreen() {
  const { theme } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email)
  }

  const handleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    // Validation
    const newErrors: typeof errors = {}
    if (!email) {
      newErrors.email = 'Email la bat buoc'
    } else if (!validateEmail(email)) {
      newErrors.email = 'Email khong hop le'
    }
    if (!password) {
      newErrors.password = 'Mat khau la bat buoc'
    } else if (password.length < 6) {
      newErrors.password = 'Mat khau toi thieu 6 ky tu'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      return
    }

    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      router.replace('/(tabs)')
    } catch (error) {
      setErrors({ email: 'Email hoac mat khau khong dung' })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    } finally {
      setLoading(false)
    }
  }

  const styles = createStyles(theme)

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
          {/* Logo */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(500)}
            style={styles.logoContainer}
          >
            <View style={[styles.logoBox, { backgroundColor: theme.brand.primary }]}>
              <Text variant="h2" style={styles.logoText}>ST</Text>
            </View>
            <Text variant="h2" style={styles.brandName}>SmartTrade AI</Text>
            <Text variant="body" color="secondary" style={styles.tagline}>
              Giao dich thong minh voi AI
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(500)}
            style={styles.form}
          >
            <Text variant="h3" style={styles.formTitle}>Dang nhap</Text>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text variant="labelSmall" color="tertiary" style={styles.label}>EMAIL</Text>
              <View style={[
                styles.inputWrapper,
                focusedField === 'email' ? styles.inputFocused : undefined,
                errors.email ? styles.inputError : undefined,
              ]}>
                <Mail size={20} color={theme.text.tertiary} strokeWidth={1.5} />
                <TextInput
                  style={[styles.input, { color: theme.text.primary }]}
                  placeholder="name@example.com"
                  placeholderTextColor={theme.text.tertiary}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text)
                    setErrors(prev => ({ ...prev, email: undefined }))
                  }}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
              {errors.email && (
                <Text variant="bodySmall" style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text variant="labelSmall" color="tertiary" style={styles.label}>MAT KHAU</Text>
              <View style={[
                styles.inputWrapper,
                focusedField === 'password' ? styles.inputFocused : undefined,
                errors.password ? styles.inputError : undefined,
              ]}>
                <Lock size={20} color={theme.text.tertiary} strokeWidth={1.5} />
                <TextInput
                  style={[styles.input, { color: theme.text.primary }]}
                  placeholder="••••••••"
                  placeholderTextColor={theme.text.tertiary}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text)
                    setErrors(prev => ({ ...prev, password: undefined }))
                  }}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    setShowPassword(!showPassword)
                  }}
                  hitSlop={10}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={theme.text.tertiary} strokeWidth={1.5} />
                  ) : (
                    <Eye size={20} color={theme.text.tertiary} strokeWidth={1.5} />
                  )}
                </Pressable>
              </View>
              {errors.password && (
                <Text variant="bodySmall" style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            {/* Forgot Password */}
            <Pressable
              style={styles.forgotPassword}
              onPress={() => router.push('/(auth)/forgot-password')}
            >
              <Text variant="bodySmall" style={{ color: theme.brand.primary }}>
                Quen mat khau?
              </Text>
            </Pressable>

            {/* Login Button */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              onPress={handleLogin}
            >
              Dang nhap
            </Button>
          </Animated.View>

          {/* Divider */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(500)}
            style={styles.divider}
          >
            <View style={[styles.dividerLine, { backgroundColor: theme.border.primary }]} />
            <Text variant="bodySmall" color="tertiary" style={styles.dividerText}>
              hoac
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.border.primary }]} />
          </Animated.View>

          {/* Social Login */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(500)}
            style={styles.socialButtons}
          >
            <Button variant="secondary" fullWidth onPress={() => {}}>
              Tiep tuc voi Google
            </Button>
            <Button variant="secondary" fullWidth onPress={() => {}}>
              Tiep tuc voi Apple
            </Button>
          </Animated.View>

          {/* Register Link */}
          <Animated.View
            entering={FadeInDown.delay(500).duration(500)}
            style={styles.registerLink}
          >
            <Text variant="body" color="secondary">
              Chua co tai khoan?{' '}
            </Text>
            <Pressable onPress={() => router.push('/(auth)/register')}>
              <Text variant="body" style={{ color: theme.brand.primary, fontWeight: '600' }}>
                Dang ky ngay
              </Text>
            </Pressable>
          </Animated.View>

          {/* Skip for Demo */}
          <Animated.View entering={FadeInDown.delay(600).duration(500)}>
            <Pressable
              style={styles.skipButton}
              onPress={() => router.replace('/(tabs)')}
            >
              <Text variant="bodySmall" color="tertiary">
                Bo qua, xem demo
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
    justifyContent: 'center',
  },

  // Logo
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  brandName: {
    marginBottom: spacing[1],
  },
  tagline: {
    textAlign: 'center',
  },

  // Form
  form: {
    marginBottom: spacing[6],
  },
  formTitle: {
    marginBottom: spacing[6],
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: spacing[4],
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing[6],
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: spacing[4],
  },

  // Social
  socialButtons: {
    gap: spacing[3],
    marginBottom: spacing[6],
  },

  // Register
  registerLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },

  // Skip
  skipButton: {
    alignItems: 'center',
    paddingVertical: spacing[3],
  },
})
