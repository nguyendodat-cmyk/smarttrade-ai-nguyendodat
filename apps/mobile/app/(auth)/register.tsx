/**
 * SmartTrade AI - Register Screen
 * Professional registration with validation
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
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Check } from 'lucide-react-native'

import { Text } from '@/components/ui/Text'
import { Button } from '@/components/ui/Button'
import { useTheme } from '@/context/ThemeContext'
import { spacing, radius } from '@/theme/spacing'
import { Theme } from '@/theme/colors'

type FormErrors = {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
  terms?: string
}

export default function RegisterScreen() {
  const { theme } = useTheme()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [acceptTerms, setAcceptTerms] = useState(false)

  const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email)

  const clearError = (field: keyof FormErrors) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }

  const handleRegister = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    const newErrors: FormErrors = {}
    if (!name) newErrors.name = 'Ten la bat buoc'
    if (!email) newErrors.email = 'Email la bat buoc'
    else if (!validateEmail(email)) newErrors.email = 'Email khong hop le'
    if (!password) newErrors.password = 'Mat khau la bat buoc'
    else if (password.length < 6) newErrors.password = 'Mat khau toi thieu 6 ky tu'
    if (password !== confirmPassword) newErrors.confirmPassword = 'Mat khau khong khop'
    if (!acceptTerms) newErrors.terms = 'Ban can dong y dieu khoan'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      return
    }

    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      router.replace('/(tabs)')
    } catch (error) {
      setErrors({ email: 'Email da duoc su dung' })
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
              <Text variant="h2">Tao tai khoan</Text>
              <Text variant="body" color="secondary">
                Dang ky de bat dau giao dich
              </Text>
            </View>
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.form}>
            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text variant="labelSmall" color="tertiary" style={styles.label}>HO TEN</Text>
              <View style={[
                styles.inputWrapper,
                focusedField === 'name' ? styles.inputFocused : undefined,
                errors.name ? styles.inputError : undefined,
              ]}>
                <User size={20} color={theme.text.tertiary} strokeWidth={1.5} />
                <TextInput
                  style={[styles.input, { color: theme.text.primary }]}
                  placeholder="Nguyen Van A"
                  placeholderTextColor={theme.text.tertiary}
                  value={name}
                  onChangeText={(text) => {
                    setName(text)
                    clearError('name')
                  }}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  autoComplete="name"
                />
              </View>
              {errors.name && (
                <Text variant="bodySmall" style={styles.errorText}>{errors.name}</Text>
              )}
            </View>

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
                    clearError('email')
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
                  placeholder="Toi thieu 6 ky tu"
                  placeholderTextColor={theme.text.tertiary}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text)
                    clearError('password')
                  }}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  secureTextEntry={!showPassword}
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

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text variant="labelSmall" color="tertiary" style={styles.label}>XAC NHAN MAT KHAU</Text>
              <View style={[
                styles.inputWrapper,
                focusedField === 'confirmPassword' ? styles.inputFocused : undefined,
                errors.confirmPassword ? styles.inputError : undefined,
              ]}>
                <Lock size={20} color={theme.text.tertiary} strokeWidth={1.5} />
                <TextInput
                  style={[styles.input, { color: theme.text.primary }]}
                  placeholder="Nhap lai mat khau"
                  placeholderTextColor={theme.text.tertiary}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text)
                    clearError('confirmPassword')
                  }}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  secureTextEntry={!showPassword}
                />
              </View>
              {errors.confirmPassword && (
                <Text variant="bodySmall" style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>

            {/* Terms Checkbox */}
            <Pressable
              style={styles.termsRow}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                setAcceptTerms(!acceptTerms)
                clearError('terms')
              }}
            >
              <View style={[
                styles.checkbox,
                acceptTerms ? { backgroundColor: theme.brand.primary, borderColor: theme.brand.primary } : undefined,
                errors.terms ? { borderColor: theme.semantic.negative } : undefined,
              ]}>
                {acceptTerms && <Check size={14} color="#FFF" strokeWidth={2} />}
              </View>
              <Text variant="bodySmall" color="secondary" style={{ flex: 1 }}>
                Toi dong y voi{' '}
                <Text variant="bodySmall" style={{ color: theme.brand.primary }}>
                  Dieu khoan su dung
                </Text>
                {' '}va{' '}
                <Text variant="bodySmall" style={{ color: theme.brand.primary }}>
                  Chinh sach bao mat
                </Text>
              </Text>
            </Pressable>
            {errors.terms && (
              <Text variant="bodySmall" style={[styles.errorText, { marginTop: -spacing[2] }]}>
                {errors.terms}
              </Text>
            )}

            {/* Register Button */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              onPress={handleRegister}
              style={{ marginTop: spacing[4] }}
            >
              Tao tai khoan
            </Button>
          </Animated.View>

          {/* Login Link */}
          <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.loginLink}>
            <Text variant="body" color="secondary">
              Da co tai khoan?{' '}
            </Text>
            <Pressable onPress={() => router.back()}>
              <Text variant="body" style={{ color: theme.brand.primary, fontWeight: '600' }}>
                Dang nhap
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
  form: {
    marginBottom: spacing[6],
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
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.border.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
})
