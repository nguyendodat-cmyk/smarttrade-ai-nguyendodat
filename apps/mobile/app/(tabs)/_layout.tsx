/**
 * SmartTrade AI v1.2.1 - Theme-Aware Tab Bar
 * Uses theme context for proper light/dark mode support
 */

import { Tabs } from 'expo-router'
import { View, Platform } from 'react-native'
import {
  LayoutGrid,
  TrendingUp,
  ArrowLeftRight,
  PieChart,
  MessageSquare,
} from 'lucide-react-native'
import { useTheme } from '@/context/ThemeContext'

export default function TabLayout() {
  const { theme } = useTheme()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.tabBar.background,
          borderTopWidth: 1,
          borderTopColor: theme.tabBar.border,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
        },
        tabBarActiveTintColor: theme.tabBar.active,
        tabBarInactiveTintColor: theme.tabBar.inactive,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tổng quan',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={LayoutGrid} color={color} focused={focused} bgColor={theme.brand.muted} />
          ),
        }}
      />
      <Tabs.Screen
        name="market"
        options={{
          title: 'Thị trường',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={TrendingUp} color={color} focused={focused} bgColor={theme.brand.muted} />
          ),
        }}
      />
      <Tabs.Screen
        name="trade"
        options={{
          title: 'Giao dịch',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={ArrowLeftRight} color={color} focused={focused} bgColor={theme.brand.muted} />
          ),
        }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{
          title: 'Danh mục',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={PieChart} color={color} focused={focused} bgColor={theme.brand.muted} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'AI',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={MessageSquare} color={color} focused={focused} bgColor={theme.brand.muted} />
          ),
        }}
      />
    </Tabs>
  )
}

function TabIcon({
  icon: Icon,
  color,
  focused,
  bgColor,
}: {
  icon: any
  color: string
  focused: boolean
  bgColor: string
}) {
  return (
    <View style={{
      width: 44,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
      backgroundColor: focused ? bgColor : 'transparent',
    }}>
      <Icon size={22} color={color} strokeWidth={focused ? 2 : 1.5} />
    </View>
  )
}
