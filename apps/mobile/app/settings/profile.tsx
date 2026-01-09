/**
 * SmartTrade AI - Profile Settings
 * Edit user profile information
 */

import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { ArrowLeft, Camera, User, Mail, Phone, MapPin } from 'lucide-react-native'

import { Text } from '@/components/ui/Text'
import { Button } from '@/components/ui/Button'
import { useTheme } from '@/context/ThemeContext'
import { spacing, radius } from '@/theme/spacing'
import { Theme } from '@/theme/colors'

export default function ProfileScreen() {
  const { theme } = useTheme()
  const [name, setName] = useState('Nguyen Van A')
  const [email, setEmail] = useState('nguyenvana@email.com')
  const [phone, setPhone] = useState('0912345678')
  const [address, setAddress] = useState('Ho Chi Minh, Viet Nam')
  const [loading, setLoading] = useState(false)

  const styles = createStyles(theme)

  const handleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setLoading(false)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    router.back()
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme.text.primary} strokeWidth={1.5} />
        </Pressable>
        <Text variant="h3">Thong tin ca nhan</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <View style={styles.avatarSection}>
            <View style={[styles.avatar, { backgroundColor: theme.brand.primary }]}>
              <Text variant="h1" style={{ color: '#FFF' }}>{name.charAt(0)}</Text>
            </View>
            <Pressable style={[styles.cameraButton, { backgroundColor: theme.brand.primary }]}>
              <Camera size={16} color="#FFF" strokeWidth={2} />
            </Pressable>
            <Text variant="bodySmall" color="tertiary" style={styles.avatarHint}>
              Nhan de thay doi anh dai dien
            </Text>
          </View>
        </Animated.View>

        {/* Form */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <View style={styles.form}>
            <InputField
              icon={User}
              label="Ho ten"
              value={name}
              onChangeText={setName}
              theme={theme}
            />
            <InputField
              icon={Mail}
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              theme={theme}
            />
            <InputField
              icon={Phone}
              label="So dien thoai"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              theme={theme}
            />
            <InputField
              icon={MapPin}
              label="Dia chi"
              value={address}
              onChangeText={setAddress}
              theme={theme}
            />
          </View>
        </Animated.View>

        {/* Save Button */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            onPress={handleSave}
          >
            Luu thay doi
          </Button>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  )
}

function InputField({
  icon: Icon,
  label,
  value,
  onChangeText,
  keyboardType,
  theme,
}: {
  icon: any
  label: string
  value: string
  onChangeText: (text: string) => void
  keyboardType?: 'default' | 'email-address' | 'phone-pad'
  theme: Theme
}) {
  const [focused, setFocused] = useState(false)

  return (
    <View style={{ marginBottom: spacing[4] }}>
      <Text variant="labelSmall" color="tertiary" style={{ marginBottom: spacing[2], marginLeft: spacing[1] }}>
        {label.toUpperCase()}
      </Text>
      <View style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.bg.secondary,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: focused ? theme.brand.primary : theme.border.primary,
          paddingHorizontal: spacing[4],
          height: 52,
          gap: spacing[3],
        },
      ]}>
        <Icon size={20} color={theme.text.tertiary} strokeWidth={1.5} />
        <TextInput
          style={{ flex: 1, fontSize: 16, color: theme.text.primary }}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType={keyboardType}
          placeholderTextColor={theme.text.tertiary}
        />
      </View>
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

  // Avatar
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButton: {
    position: 'absolute',
    right: '35%',
    bottom: 30,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.bg.primary,
  },
  avatarHint: {
    marginTop: spacing[3],
  },

  // Form
  form: {
    marginBottom: spacing[6],
  },
})
