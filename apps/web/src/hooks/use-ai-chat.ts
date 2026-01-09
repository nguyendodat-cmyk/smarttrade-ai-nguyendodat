import { useCallback } from 'react'
import { useAIStore } from '@/stores/ai-store'
import {
  generateMarketSummary,
  generateStockAnalysis,
  generateSectorInsights,
  generateChatResponse,
} from '@/lib/ai-prompts'

// Simulate typing delay (50-100ms per word)
function getTypingDelay(text: string): number {
  const words = text.split(' ').length
  const msPerWord = 50 + Math.random() * 50
  return Math.min(words * msPerWord, 3000) // Cap at 3 seconds
}

// Simulate API delay (1-3 seconds)
function getAPIDelay(): number {
  return 1000 + Math.random() * 2000
}

export function useAIChat() {
  const {
    messages,
    isTyping,
    addMessage,
    clearMessages,
    setIsTyping,
  } = useAIStore()

  const sendMessage = useCallback(async (content: string) => {
    // Add user message
    addMessage({ role: 'user', content })

    // Set typing indicator
    setIsTyping(true)

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, getAPIDelay()))

    // Generate response
    const response = generateChatResponse(content)

    // Simulate typing delay
    await new Promise((resolve) => setTimeout(resolve, getTypingDelay(response)))

    // Add AI response
    addMessage({ role: 'assistant', content: response })

    // Clear typing indicator
    setIsTyping(false)
  }, [addMessage, setIsTyping])

  return {
    messages,
    isTyping,
    sendMessage,
    clearMessages,
  }
}

export function useMarketSummary() {
  const {
    marketSummary,
    isLoadingMarketSummary,
    setMarketSummary,
    setIsLoadingMarketSummary,
  } = useAIStore()

  const fetchMarketSummary = useCallback(async () => {
    setIsLoadingMarketSummary(true)

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, getAPIDelay()))

    const summary = generateMarketSummary()
    setMarketSummary(summary)

    setIsLoadingMarketSummary(false)
  }, [setMarketSummary, setIsLoadingMarketSummary])

  const refreshSummary = useCallback(async () => {
    await fetchMarketSummary()
  }, [fetchMarketSummary])

  return {
    marketSummary,
    isLoading: isLoadingMarketSummary,
    fetchMarketSummary,
    refreshSummary,
  }
}

export function useStockAnalysis(symbol: string) {
  const {
    isLoadingStockAnalysis,
    setStockAnalysis,
    getStockAnalysis,
    setIsLoadingStockAnalysis,
  } = useAIStore()

  const analysis = getStockAnalysis(symbol)

  const fetchAnalysis = useCallback(async () => {
    setIsLoadingStockAnalysis(true)

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, getAPIDelay()))

    const newAnalysis = generateStockAnalysis(symbol)
    setStockAnalysis(symbol, newAnalysis)

    setIsLoadingStockAnalysis(false)
  }, [symbol, setStockAnalysis, setIsLoadingStockAnalysis])

  const regenerateAnalysis = useCallback(async () => {
    await fetchAnalysis()
  }, [fetchAnalysis])

  return {
    analysis,
    isLoading: isLoadingStockAnalysis,
    fetchAnalysis,
    regenerateAnalysis,
  }
}

export function useSectorInsights() {
  const {
    sectorInsights,
    isLoadingSectorInsights,
    setSectorInsights,
    setIsLoadingSectorInsights,
  } = useAIStore()

  const fetchSectorInsights = useCallback(async () => {
    setIsLoadingSectorInsights(true)

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, getAPIDelay()))

    const insights = generateSectorInsights()
    setSectorInsights(insights)

    setIsLoadingSectorInsights(false)
  }, [setSectorInsights, setIsLoadingSectorInsights])

  return {
    sectorInsights,
    isLoading: isLoadingSectorInsights,
    fetchSectorInsights,
  }
}
