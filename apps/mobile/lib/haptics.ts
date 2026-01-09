/**
 * SmartTrade AI v1.2.0 - Enhanced Haptic Feedback
 * Centralized haptic utilities for consistent feedback
 */

import * as Haptics from 'expo-haptics'
import { Platform } from 'react-native'

export const haptic = {
  // Light - for hover, focus, small interactions
  light: () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
  },

  // Medium - for button press, selection, tab change
  medium: () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    }
  },

  // Heavy - for important actions, confirmations
  heavy: () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    }
  },

  // Success - for completed actions
  success: () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }
  },

  // Warning - for alerts, caution
  warning: () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    }
  },

  // Error - for errors, failures
  error: () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    }
  },

  // Selection - for picker, toggle, segmented control
  selection: () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync()
    }
  },
}

// Contextual haptics for trading actions
export const tradingHaptic = {
  // Buy order
  buy: () => haptic.success(),

  // Sell order
  sell: () => haptic.medium(),

  // Order confirmed
  orderConfirmed: () => haptic.success(),

  // Order failed
  orderFailed: () => haptic.error(),

  // Price alert triggered
  priceAlert: () => haptic.warning(),

  // Watchlist add
  watchlistAdd: () => haptic.light(),

  // Watchlist remove
  watchlistRemove: () => haptic.light(),
}

export default haptic
