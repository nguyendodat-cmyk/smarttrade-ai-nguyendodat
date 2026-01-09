/**
 * SmartTrade AI v1.2.1 - Animated Notification Bell
 * Shake animation + badge with count
 */

import React, { useEffect, useState } from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  withRepeat,
  withSpring,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Bell } from 'lucide-react-native'
import { router } from 'expo-router'
import { Text } from './Text'
import { useTheme } from '@/context/ThemeContext'

interface NotificationBellProps {
  count?: number
  hasNew?: boolean
  onPress?: () => void
}

export function NotificationBell({ count = 0, hasNew = false, onPress }: NotificationBellProps) {
  const { theme } = useTheme()
  const [showBadge, setShowBadge] = useState(count > 0)

  // Animation values
  const rotation = useSharedValue(0)
  const scale = useSharedValue(1)
  const badgeScale = useSharedValue(count > 0 ? 1 : 0)

  // Shake animation when new notification
  useEffect(() => {
    if (hasNew && count > 0) {
      // Show badge with bounce
      setShowBadge(true)
      badgeScale.value = withSequence(
        withTiming(1.3, { duration: 150 }),
        withSpring(1, { damping: 12 })
      )

      // Shake bell
      rotation.value = withSequence(
        withTiming(15, { duration: 50 }),
        withRepeat(
          withSequence(
            withTiming(-15, { duration: 80 }),
            withTiming(15, { duration: 80 })
          ),
          3,
          true
        ),
        withTiming(0, { duration: 50 })
      )

      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    }
  }, [hasNew, count])

  // Update badge visibility when count changes
  useEffect(() => {
    if (count > 0) {
      setShowBadge(true)
      badgeScale.value = withSpring(1, { damping: 12 })
    } else {
      badgeScale.value = withTiming(0, { duration: 200 })
      setTimeout(() => setShowBadge(false), 200)
    }
  }, [count])

  const bellAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }))

  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }))

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    scale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withSpring(1, { damping: 12 })
    )

    if (onPress) {
      onPress()
    } else {
      router.push('/notifications')
    }
  }

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      <Animated.View style={bellAnimatedStyle}>
        <Bell
          size={24}
          color={theme.text.primary}
          strokeWidth={1.5}
        />
      </Animated.View>

      {/* Badge with count */}
      {showBadge && count > 0 && (
        <Animated.View
          style={[
            styles.badge,
            { backgroundColor: theme.semantic.negative },
            badgeAnimatedStyle,
          ]}
        >
          <Text style={styles.badgeText}>
            {count > 99 ? '99+' : count}
          </Text>
        </Animated.View>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
})

export default NotificationBell
