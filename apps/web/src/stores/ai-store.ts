import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Types
export type SentimentType = 'bullish' | 'bearish' | 'neutral'
export type StockRating = 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface MarketSummary {
  sentiment: SentimentType
  title: string
  summary: string
  highlights: string[]
  lastUpdated: string
}

export interface StockAnalysis {
  symbol: string
  overview: string
  performance: string
  pros: string[]
  cons: string[]
  rating: StockRating
  similarStocks: { symbol: string; name: string; reason: string }[]
  lastUpdated: string
}

export interface SectorInsight {
  sector: string
  sentiment: SentimentType
  summary: string
  topStocks: string[]
}

interface AIState {
  // Chat
  messages: ChatMessage[]
  isTyping: boolean
  isChatOpen: boolean

  // Market Summary
  marketSummary: MarketSummary | null
  isLoadingMarketSummary: boolean

  // Stock Analysis Cache
  stockAnalysisCache: Record<string, StockAnalysis>
  isLoadingStockAnalysis: boolean

  // Sector Insights
  sectorInsights: SectorInsight[]
  isLoadingSectorInsights: boolean

  // Actions - Chat
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  clearMessages: () => void
  setIsTyping: (isTyping: boolean) => void
  toggleChat: () => void
  openChat: () => void
  closeChat: () => void

  // Actions - Market Summary
  setMarketSummary: (summary: MarketSummary) => void
  setIsLoadingMarketSummary: (isLoading: boolean) => void

  // Actions - Stock Analysis
  setStockAnalysis: (symbol: string, analysis: StockAnalysis) => void
  getStockAnalysis: (symbol: string) => StockAnalysis | null
  setIsLoadingStockAnalysis: (isLoading: boolean) => void

  // Actions - Sector Insights
  setSectorInsights: (insights: SectorInsight[]) => void
  setIsLoadingSectorInsights: (isLoading: boolean) => void
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      // Initial state
      messages: [],
      isTyping: false,
      isChatOpen: false,
      marketSummary: null,
      isLoadingMarketSummary: false,
      stockAnalysisCache: {},
      isLoadingStockAnalysis: false,
      sectorInsights: [],
      isLoadingSectorInsights: false,

      // Chat Actions
      addMessage: (message) => {
        const newMessage: ChatMessage = {
          ...message,
          id: generateId(),
          timestamp: new Date().toISOString(),
        }
        set((state) => ({
          messages: [...state.messages, newMessage],
        }))
      },

      clearMessages: () => {
        set({ messages: [] })
      },

      setIsTyping: (isTyping) => {
        set({ isTyping })
      },

      toggleChat: () => {
        set((state) => ({ isChatOpen: !state.isChatOpen }))
      },

      openChat: () => {
        set({ isChatOpen: true })
      },

      closeChat: () => {
        set({ isChatOpen: false })
      },

      // Market Summary Actions
      setMarketSummary: (summary) => {
        set({ marketSummary: summary })
      },

      setIsLoadingMarketSummary: (isLoading) => {
        set({ isLoadingMarketSummary: isLoading })
      },

      // Stock Analysis Actions
      setStockAnalysis: (symbol, analysis) => {
        set((state) => ({
          stockAnalysisCache: {
            ...state.stockAnalysisCache,
            [symbol]: analysis,
          },
        }))
      },

      getStockAnalysis: (symbol) => {
        return get().stockAnalysisCache[symbol] || null
      },

      setIsLoadingStockAnalysis: (isLoading) => {
        set({ isLoadingStockAnalysis: isLoading })
      },

      // Sector Insights Actions
      setSectorInsights: (insights) => {
        set({ sectorInsights: insights })
      },

      setIsLoadingSectorInsights: (isLoading) => {
        set({ isLoadingSectorInsights: isLoading })
      },
    }),
    {
      name: 'ai-storage',
      partialize: (state) => ({
        messages: state.messages.slice(-50), // Keep last 50 messages
        stockAnalysisCache: state.stockAnalysisCache,
      }),
    }
  )
)
