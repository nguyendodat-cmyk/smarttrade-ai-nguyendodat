/**
 * SmartTrade AI - Bloomberg Grade AI Chat Screen
 * Premium chat interface with haptic feedback
 */

import React, { useState, useRef, useCallback } from 'react'
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { ArrowUp, Sparkles, RefreshCw, User } from 'lucide-react-native'

import { Text, LabelSmall } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import { IconButton } from '@/components/ui/Icon'
import { useTheme } from '@/context/ThemeContext'
import { Theme } from '@/theme/colors'
import { spacing, radius, touchTarget } from '@/theme/spacing'
import { typography } from '@/theme/typography'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const QUICK_PROMPTS = [
  'Phân tích VNM',
  'So sánh FPT và VNG',
  'Thị trường tuần này',
  'Cổ phiếu tiềm năng',
]

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: 'Xin chào! Tôi là trợ lý AI của SmartTrade. Tôi có thể giúp bạn:\n\n• Phân tích cổ phiếu\n• Đánh giá thị trường\n• Giải thích chỉ số kỹ thuật\n• Tư vấn danh mục đầu tư\n\nBạn muốn hỏi điều gì?',
    timestamp: new Date(),
  },
]

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export default function AIScreen() {
  const { theme } = useTheme()
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollViewRef = useRef<ScrollView>(null)
  const styles = createStyles(theme)

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true })
    }, 100)

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateDemoResponse(userMessage.content),
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiResponse])
      setIsLoading(false)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

      // Scroll to bottom after response
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }, 1500)
  }, [input, isLoading])

  const handleQuickPrompt = useCallback((prompt: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setInput(prompt)
  }, [])

  const handleReset = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setMessages(INITIAL_MESSAGES)
  }, [])

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={88}
      >
        {/* Header - minimal */}
        <View style={styles.header}>
          <Text variant="h2">AI Chat</Text>
          <IconButton
            icon={RefreshCw}
            color={theme.text.secondary}
            onPress={handleReset}
          />
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message, index) => (
            <Animated.View
              key={message.id}
              entering={FadeInDown.delay(index * 50).duration(300)}
            >
              <MessageBubble theme={theme} message={message} />
            </Animated.View>
          ))}

          {isLoading && (
            <Animated.View entering={FadeInUp.duration(300)}>
              <LoadingIndicator theme={theme} />
            </Animated.View>
          )}
        </ScrollView>

        {/* Quick Prompts */}
        {messages.length <= 1 && (
          <Animated.View entering={FadeInUp.delay(200).duration(400)}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.quickPrompts}
              contentContainerStyle={styles.quickPromptsContent}
            >
              {QUICK_PROMPTS.map((prompt, index) => (
                <QuickPromptChip
                  key={index}
                  theme={theme}
                  text={prompt}
                  onPress={() => handleQuickPrompt(prompt)}
                />
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, { color: theme.text.primary }]}
              placeholder="Nhập câu hỏi..."
              placeholderTextColor={theme.text.tertiary}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
            />
            <SendButton
              theme={theme}
              onPress={handleSend}
              disabled={!input.trim() || isLoading}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

// Message Bubble Component
function MessageBubble({ theme, message }: { theme: Theme; message: Message }) {
  const isUser = message.role === 'user'

  return (
    <View style={[
      { flexDirection: 'row', marginBottom: spacing[4], alignItems: 'flex-start' },
      isUser && { justifyContent: 'flex-end' },
    ]}>
      {!isUser && (
        <View style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: theme.bg.secondary,
          borderWidth: 1,
          borderColor: theme.border.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Sparkles size={16} color={theme.brand.primary} strokeWidth={2} />
        </View>
      )}
      <View style={[
        {
          maxWidth: '75%',
          padding: spacing[3],
          borderRadius: radius.lg,
          marginHorizontal: spacing[2],
        },
        isUser
          ? { backgroundColor: theme.brand.primary, borderBottomRightRadius: radius.sm }
          : {
              backgroundColor: theme.bg.secondary,
              borderWidth: 1,
              borderColor: theme.border.primary,
              borderBottomLeftRadius: radius.sm,
            },
      ]}>
        <Text
          variant="body"
          style={isUser ? { color: '#FFFFFF' } : { color: theme.text.primary }}
        >
          {message.content}
        </Text>
        <Text variant="bodySmall" style={{ marginTop: spacing[2], textAlign: 'right', color: theme.text.tertiary, opacity: 0.7 }}>
          {message.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      {isUser && (
        <View style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: theme.brand.primary,
          borderWidth: 1,
          borderColor: theme.brand.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <User size={16} color={theme.text.primary} strokeWidth={2} />
        </View>
      )}
    </View>
  )
}

// Loading Indicator Component
function LoadingIndicator({ theme }: { theme: Theme }) {
  const dot1Opacity = useSharedValue(0.4)
  const dot2Opacity = useSharedValue(0.4)
  const dot3Opacity = useSharedValue(0.4)

  React.useEffect(() => {
    dot1Opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0.4, { duration: 400 })
      ),
      -1,
      false
    )
    setTimeout(() => {
      dot2Opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.4, { duration: 400 })
        ),
        -1,
        false
      )
    }, 150)
    setTimeout(() => {
      dot3Opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.4, { duration: 400 })
        ),
        -1,
        false
      )
    }, 300)
  }, [])

  const dot1Style = useAnimatedStyle(() => ({ opacity: dot1Opacity.value }))
  const dot2Style = useAnimatedStyle(() => ({ opacity: dot2Opacity.value }))
  const dot3Style = useAnimatedStyle(() => ({ opacity: dot3Opacity.value }))

  const dotStyle = { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.brand.primary }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing[4] }}>
      <View style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.bg.secondary,
        borderWidth: 1,
        borderColor: theme.border.primary,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Sparkles size={16} color={theme.brand.primary} strokeWidth={2} />
      </View>
      <View style={{
        flexDirection: 'row',
        gap: 6,
        padding: spacing[3],
        backgroundColor: theme.bg.secondary,
        borderWidth: 1,
        borderColor: theme.border.primary,
        borderRadius: radius.lg,
        borderBottomLeftRadius: radius.sm,
        marginLeft: spacing[2],
      }}>
        <Animated.View style={[dotStyle, dot1Style]} />
        <Animated.View style={[dotStyle, dot2Style]} />
        <Animated.View style={[dotStyle, dot3Style]} />
      </View>
    </View>
  )
}

// Quick Prompt Chip Component
function QuickPromptChip({ theme, text, onPress }: { theme: Theme; text: string; onPress: () => void }) {
  const scale = useSharedValue(1)

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 })
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 })
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <AnimatedPressable
      style={[{
        backgroundColor: theme.bg.secondary,
        borderWidth: 1,
        borderColor: theme.border.primary,
        borderRadius: radius.full,
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[2],
      }, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Text variant="bodySmall" style={{ color: theme.text.secondary }}>{text}</Text>
    </AnimatedPressable>
  )
}

// Send Button Component
function SendButton({ theme, onPress, disabled }: { theme: Theme; onPress: () => void; disabled: boolean }) {
  const scale = useSharedValue(1)

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.9, { damping: 15, stiffness: 400 })
    }
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 })
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <AnimatedPressable
      style={[
        {
          width: touchTarget.min,
          height: touchTarget.min,
          borderRadius: touchTarget.min / 2,
          backgroundColor: disabled ? theme.bg.tertiary : theme.brand.primary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        animatedStyle,
      ]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled}
    >
      <ArrowUp
        size={20}
        color={disabled ? theme.text.tertiary : '#FFFFFF'}
        strokeWidth={2.5}
      />
    </AnimatedPressable>
  )
}

function generateDemoResponse(query: string): string {
  const lowerQuery = query.toLowerCase()

  if (lowerQuery.includes('vnm') || lowerQuery.includes('vinamilk')) {
    return '📊 Phân tích VNM (Vinamilk)\n\nGiá hiện tại: 76,500đ (+2.0%)\n\nNhận định:\n• RSI(14): 58 - Vùng trung tính\n• MACD: Tín hiệu tích cực\n• Hỗ trợ: 74,000 | Kháng cự: 80,000\n\nKhuyến nghị: HOLD\nVNM đang trong xu hướng tích lũy. Cân nhắc mua thêm nếu về vùng hỗ trợ 74,000.'
  }

  if (lowerQuery.includes('thị trường') || lowerQuery.includes('market')) {
    return '📈 Nhận định thị trường\n\nVNINDEX: 1,250.5 (+0.99%)\n\nThị trường đang trong xu hướng tăng ngắn hạn với thanh khoản cải thiện. Nhóm ngân hàng và công nghệ dẫn dắt.\n\nKịch bản:\n• Tích cực: Vượt 1,280 → hướng 1,320\n• Tiêu cực: Mất 1,220 → điều chỉnh về 1,180\n\nChiến lược: Giữ tỷ trọng vừa phải, ưu tiên cổ phiếu có câu chuyện riêng.'
  }

  if (lowerQuery.includes('gợi ý') || lowerQuery.includes('tiềm năng')) {
    return '💡 Cổ phiếu tiềm năng\n\n1. FPT - Hưởng lợi từ AI, chuyển đổi số\n2. VCB - Blue chip ngân hàng, tăng trưởng ổn định\n3. HPG - Phục hồi ngành thép\n4. MWG - Bán lẻ phục hồi\n\n⚠️ Lưu ý: Đây chỉ là gợi ý tham khảo. Bạn nên nghiên cứu thêm trước khi đầu tư.'
  }

  return 'Cảm ơn câu hỏi của bạn! Tôi đang phân tích thông tin liên quan.\n\nBạn có thể hỏi cụ thể hơn về:\n• Một mã cổ phiếu cụ thể (VD: "Phân tích VNM")\n• Nhận định thị trường\n• So sánh các cổ phiếu\n• Giải thích chỉ số kỹ thuật'
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg.primary,
  },
  keyboardAvoid: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },

  // Messages
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing[4],
    paddingBottom: spacing[4],
  },

  // Quick prompts
  quickPrompts: {
    maxHeight: 50,
    marginBottom: spacing[3],
  },
  quickPromptsContent: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },

  // Input - NO DIVIDER
  inputContainer: {
    padding: spacing[4],
    paddingTop: spacing[3],
    // borderTopWidth removed - cleaner look
    backgroundColor: theme.bg.primary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: theme.bg.secondary,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: theme.border.primary,
    paddingLeft: spacing[4],
    paddingRight: spacing[2],
    paddingVertical: spacing[2],
  },
  input: {
    flex: 1,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    maxHeight: 100,
    paddingVertical: spacing[2],
  },
})
