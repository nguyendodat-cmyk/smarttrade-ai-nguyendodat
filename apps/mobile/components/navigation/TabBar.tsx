/**
 * SmartTrade AI v1.2.0 - Premium Tab Bar
 * Enhanced tab bar with haptics and animations
 */

import React from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LucideIcon } from 'lucide-react-native'
import { Text } from '@/components/ui/Text'
import { useTheme } from '@/context/ThemeContext'
import { spacing } from '@/theme/spacing'

interface TabItem {
  name: string
  label: string
  icon: LucideIcon
}

interface TabBarProps {
  tabs: TabItem[]
  activeTab: string
  onTabPress: (name: string) => void
}

export function TabBar({ tabs, activeTab, onTabPress }: TabBarProps) {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.tabBar.background,
          borderTopColor: theme.tabBar.border,
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}
    >
      {tabs.map((tab) => (
        <TabBarItem
          key={tab.name}
          tab={tab}
          isActive={activeTab === tab.name}
          onPress={() => onTabPress(tab.name)}
          theme={theme}
        />
      ))}
    </View>
  )
}

function TabBarItem({
  tab,
  isActive,
  onPress,
  theme,
}: {
  tab: TabItem
  isActive: boolean
  onPress: () => void
  theme: any
}) {
  const scale = useSharedValue(1)
  const IconComponent = tab.icon

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 300 })
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 })
  }

  const handlePress = () => {
    // Strong haptic for tab change
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onPress()
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <Pressable
      style={styles.tabItem}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <Animated.View style={[styles.tabContent, animatedStyle]}>
        {/* Active Indicator - Pill Background */}
        {isActive && (
          <Animated.View
            style={[
              styles.activeIndicator,
              { backgroundColor: theme.brand.muted },
            ]}
          />
        )}

        <IconComponent
          size={22}
          color={isActive ? theme.brand.primary : theme.tabBar.inactive}
          strokeWidth={isActive ? 2 : 1.5}
        />

        <Text
          variant="labelSmall"
          style={[
            styles.tabLabel,
            {
              color: isActive ? theme.brand.primary : theme.tabBar.inactive,
              fontWeight: isActive ? '600' : '400',
            },
          ]}
        >
          {tab.label}
        </Text>
      </Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: spacing[2],
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabContent: {
    alignItems: 'center',
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[3],
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: -2,
    left: 0,
    right: 0,
    bottom: -2,
    borderRadius: 16,
  },
  tabLabel: {
    marginTop: 4,
    fontSize: 10,
  },
})

export default TabBar
