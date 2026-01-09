/**
 * SmartTrade AI v1.2.0 - Filter Chips Component
 * Horizontal scrolling chips with NO overflow issues
 */

import React from 'react'
import { ScrollView, StyleSheet, Pressable, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { LucideIcon } from 'lucide-react-native'
import { Text } from './Text'
import { useTheme } from '@/context/ThemeContext'
import { spacing, radius, layout } from '@/theme/spacing'

interface FilterChip {
  id: string
  label: string
  icon?: LucideIcon
}

interface FilterChipsProps {
  chips: FilterChip[]
  selected: string
  onSelect: (id: string) => void
  style?: object
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function FilterChips({ chips, selected, onSelect, style }: FilterChipsProps) {
  const { theme } = useTheme()

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      // Extend beyond screen padding for edge-to-edge scroll
      style={[styles.scrollView, style]}
    >
      {chips.map((chip) => (
        <FilterChipItem
          key={chip.id}
          chip={chip}
          isSelected={selected === chip.id}
          onPress={() => onSelect(chip.id)}
          theme={theme}
        />
      ))}
      {/* Spacer to ensure last item is fully visible */}
      <View style={styles.endSpacer} />
    </ScrollView>
  )
}

function FilterChipItem({
  chip,
  isSelected,
  onPress,
  theme,
}: {
  chip: FilterChip
  isSelected: boolean
  onPress: () => void
  theme: any
}) {
  const scale = useSharedValue(1)
  const Icon = chip.icon

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15 })
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 })
  }

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <AnimatedPressable
      style={[
        styles.chip,
        {
          backgroundColor: isSelected ? theme.brand.primary : theme.bg.card,
          borderColor: isSelected ? theme.brand.primary : theme.border.primary,
        },
        animatedStyle,
      ]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      {Icon && (
        <Icon
          size={14}
          color={isSelected ? '#FFFFFF' : theme.text.secondary}
          style={{ marginRight: spacing[1] }}
        />
      )}
      <Text
        variant="bodySmall"
        style={{
          color: isSelected ? '#FFFFFF' : theme.text.primary,
          fontWeight: isSelected ? '600' : '400',
        }}
      >
        {chip.label}
      </Text>
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  scrollView: {
    marginHorizontal: -layout.screenPadding, // Extend to edges
  },
  container: {
    paddingHorizontal: layout.screenPadding,
    gap: spacing[2],
    paddingVertical: spacing[1],
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    borderWidth: 1,
  },
  endSpacer: {
    width: layout.screenPadding, // Ensure last item is fully visible
  },
})

export default FilterChips
