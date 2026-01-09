/**
 * AI Service Client
 * Connects to the AI Service backend for chat, insights, briefings
 */

const AI_API_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000'
const API_PREFIX = '/api/v1/ai'

// Types
export interface ChatRequest {
  message: string
  conversation_id?: string
  context?: Record<string, unknown>
}

export interface ChatResponse {
  message: string
  conversation_id: string
  suggested_actions: string[]
  related_stocks: string[]
}

export interface StockInsightRequest {
  symbol: string
  include_technicals?: boolean
  include_fundamentals?: boolean
}

export interface TechnicalAnalysis {
  trend: 'uptrend' | 'downtrend' | 'sideways'
  support: number
  resistance: number
  rsi: number
  macd_signal: 'buy' | 'sell' | 'neutral'
  volume_trend: 'increasing' | 'decreasing' | 'stable'
}

export interface FundamentalAnalysis {
  pe_ratio: number | null
  pb_ratio: number | null
  eps: number | null
  revenue_growth: number | null
  profit_margin: number | null
  debt_to_equity: number | null
  valuation: 'undervalued' | 'fairly_valued' | 'overvalued'
}

export interface AIRecommendation {
  type: 'buy' | 'sell' | 'hold' | 'watch'
  symbol: string
  reason: string
  confidence: number
  target_price?: number
  stop_loss?: number
}

export interface StockInsightResponse {
  symbol: string
  name: string
  analysis: string
  sentiment: 'bullish' | 'bearish' | 'neutral'
  score: number
  risk_level: 'low' | 'medium' | 'high'
  technicals?: TechnicalAnalysis
  fundamentals?: FundamentalAnalysis
  key_points: string[]
  recommendation: AIRecommendation
  generated_at: string
}

export interface MarketHighlight {
  title: string
  description: string
  sentiment: 'bullish' | 'bearish' | 'neutral'
  impact: 'high' | 'medium' | 'low'
}

export interface StockMovement {
  symbol: string
  name: string
  price: number
  change: number
  change_percent: number
  reason?: string
}

export interface DailyBriefingResponse {
  date: string
  market_summary: string
  sentiment: 'bullish' | 'bearish' | 'neutral'
  highlights: MarketHighlight[]
  top_gainers: StockMovement[]
  top_losers: StockMovement[]
  watchlist_alerts: string[]
  recommendations: AIRecommendation[]
}

export interface PortfolioMetric {
  name: string
  value: number
  status: 'good' | 'warning' | 'danger'
  description: string
}

export interface PortfolioHealthResponse {
  overall_score: number
  risk_level: 'low' | 'medium' | 'high'
  diversification_score: number
  metrics: PortfolioMetric[]
  concerns: string[]
  recommendations: AIRecommendation[]
  generated_at: string
}

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const cache = new Map<string, { data: unknown; timestamp: number }>()

// Demo data fallbacks
const DEMO_BRIEFING: DailyBriefingResponse = {
  date: new Date().toISOString(),
  market_summary: 'VNINDEX tăng nhẹ 0.8% trong phiên giao dịch hôm nay, thanh khoản cải thiện với hơn 800 triệu cổ phiếu được giao dịch. Nhóm ngân hàng và bất động sản dẫn dắt thị trường với VCB, TCB tăng trần. Khối ngoại mua ròng 150 tỷ đồng.',
  sentiment: 'bullish',
  highlights: [
    { title: 'VCB tăng trần', description: 'Kết quả kinh doanh Q4 vượt kỳ vọng', sentiment: 'bullish', impact: 'high' },
    { title: 'FPT đạt đỉnh mới', description: 'Hợp đồng AI với đối tác Nhật Bản', sentiment: 'bullish', impact: 'medium' },
    { title: 'HPG điều chỉnh', description: 'Giá thép giảm nhẹ trên thị trường quốc tế', sentiment: 'bearish', impact: 'medium' },
  ],
  top_gainers: [
    { symbol: 'VCB', name: 'Vietcombank', price: 95000, change: 6650, change_percent: 7.0 },
    { symbol: 'FPT', name: 'FPT Corp', price: 125000, change: 5000, change_percent: 4.17 },
    { symbol: 'TCB', name: 'Techcombank', price: 48500, change: 1700, change_percent: 3.63 },
  ],
  top_losers: [
    { symbol: 'HPG', name: 'Hoa Phat', price: 25500, change: -800, change_percent: -3.04 },
    { symbol: 'SSI', name: 'SSI Securities', price: 32000, change: -500, change_percent: -1.54 },
  ],
  watchlist_alerts: [
    'VNM đang tiến gần vùng hỗ trợ 72,000đ',
    'MWG RSI đã vượt ngưỡng 70, cần theo dõi',
  ],
  recommendations: [
    { type: 'buy', symbol: 'FPT', reason: 'Xu hướng tăng mạnh, hỗ trợ bởi tin tốt về AI', confidence: 0.85 },
    { type: 'hold', symbol: 'VNM', reason: 'Đợi xác nhận vùng hỗ trợ', confidence: 0.7 },
  ],
}

const DEMO_PORTFOLIO_HEALTH: PortfolioHealthResponse = {
  overall_score: 72,
  risk_level: 'medium',
  diversification_score: 68,
  metrics: [
    { name: 'Đa dạng hóa', value: 68, status: 'warning', description: 'Tập trung nhiều vào ngành ngân hàng' },
    { name: 'Rủi ro biến động', value: 75, status: 'good', description: 'Biến động ở mức chấp nhận được' },
    { name: 'Hiệu suất', value: 82, status: 'good', description: 'Đánh bại VNINDEX 3% YTD' },
    { name: 'Thanh khoản', value: 90, status: 'good', description: 'Tất cả cổ phiếu có thanh khoản cao' },
  ],
  concerns: [
    'Danh mục tập trung 45% vào ngành ngân hàng',
    'Thiếu vị thế phòng thủ khi thị trường điều chỉnh',
  ],
  recommendations: [
    { type: 'buy', symbol: 'VNM', reason: 'Thêm cổ phiếu phòng thủ để cân bằng danh mục', confidence: 0.75 },
    { type: 'sell', symbol: 'VCB', reason: 'Chốt lời một phần sau khi tăng 7%', confidence: 0.65 },
  ],
  generated_at: new Date().toISOString(),
}

const DEMO_STOCK_INSIGHT: StockInsightResponse = {
  symbol: 'VNM',
  name: 'Vinamilk',
  analysis: 'VNM đang trong giai đoạn tích lũy với vùng hỗ trợ mạnh tại 72,000đ. RSI ở mức 45 cho thấy không quá mua hay quá bán. Khối lượng giao dịch ổn định. Kết quả kinh doanh quý gần nhất tăng trưởng 8% YoY.',
  sentiment: 'neutral',
  score: 65,
  risk_level: 'low',
  technicals: {
    trend: 'sideways',
    support: 72000,
    resistance: 80000,
    rsi: 45,
    macd_signal: 'neutral',
    volume_trend: 'stable',
  },
  fundamentals: {
    pe_ratio: 18.5,
    pb_ratio: 4.2,
    eps: 4100,
    revenue_growth: 8.2,
    profit_margin: 15.3,
    debt_to_equity: 0.25,
    valuation: 'fairly_valued',
  },
  key_points: [
    'Doanh thu tăng trưởng ổn định 8% YoY',
    'Thị phần sữa nước dẫn đầu với 55%',
    'Mở rộng thị trường xuất khẩu',
    'Chi trả cổ tức đều đặn',
  ],
  recommendation: {
    type: 'hold',
    symbol: 'VNM',
    reason: 'Đợi xác nhận vùng hỗ trợ trước khi mua thêm',
    confidence: 0.72,
    target_price: 82000,
    stop_loss: 70000,
  },
  generated_at: new Date().toISOString(),
}

function getCached<T>(key: string): T | null {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T
  }
  cache.delete(key)
  return null
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() })
}

// Usage tracking for premium gating
const USAGE_KEY = 'ai_usage'
const DAILY_LIMIT_FREE = 10

export function getUsageCount(): number {
  const stored = localStorage.getItem(USAGE_KEY)
  if (!stored) return 0

  const { count, date } = JSON.parse(stored)
  const today = new Date().toDateString()

  if (date !== today) {
    localStorage.setItem(USAGE_KEY, JSON.stringify({ count: 0, date: today }))
    return 0
  }

  return count
}

export function incrementUsage(): number {
  const today = new Date().toDateString()
  const current = getUsageCount()
  const newCount = current + 1

  localStorage.setItem(USAGE_KEY, JSON.stringify({ count: newCount, date: today }))
  return newCount
}

export function getRemainingQueries(): number {
  return Math.max(0, DAILY_LIMIT_FREE - getUsageCount())
}

export function hasReachedLimit(): boolean {
  // Demo mode bypass
  if (import.meta.env.VITE_DEMO_MODE === 'true') {
    return false
  }
  return getUsageCount() >= DAILY_LIMIT_FREE
}

// API calls with error handling and retry
async function apiCall<T>(
  endpoint: string,
  options: RequestInit,
  retries = 1
): Promise<T> {
  const url = `${AI_API_URL}${API_PREFIX}${endpoint}`

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.detail || `API error: ${response.status}`)
      }

      return response.json()
    } catch (error) {
      if (attempt === retries) {
        throw error
      }
      // Wait before retry
      await new Promise((r) => setTimeout(r, 1000))
    }
  }

  throw new Error('API call failed after retries')
}

// AI Service methods
export const aiService = {
  /**
   * Send chat message to AI
   */
  async chat(
    message: string,
    conversationId?: string,
    context?: Record<string, unknown>
  ): Promise<ChatResponse> {
    incrementUsage()

    return apiCall<ChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
        context,
      }),
    })
  },

  /**
   * Get AI insight for a stock
   */
  async getStockInsight(
    symbol: string,
    options?: { includeTechnicals?: boolean; includeFundamentals?: boolean }
  ): Promise<StockInsightResponse> {
    const cacheKey = `insight-${symbol}`
    const cached = getCached<StockInsightResponse>(cacheKey)
    if (cached) return cached

    try {
      incrementUsage()
      const response = await apiCall<StockInsightResponse>('/stock-insight', {
        method: 'POST',
        body: JSON.stringify({
          symbol: symbol.toUpperCase(),
          include_technicals: options?.includeTechnicals ?? true,
          include_fundamentals: options?.includeFundamentals ?? true,
        }),
      })
      setCache(cacheKey, response)
      return response
    } catch {
      // Return demo data with modified symbol
      console.log('Using demo stock insight data for', symbol)
      const demoData = { ...DEMO_STOCK_INSIGHT, symbol: symbol.toUpperCase() }
      setCache(cacheKey, demoData)
      return demoData
    }
  },

  /**
   * Get daily market briefing
   */
  async getDailyBriefing(
    userId?: string,
    watchlist?: string[]
  ): Promise<DailyBriefingResponse> {
    const cacheKey = 'daily-briefing'
    const cached = getCached<DailyBriefingResponse>(cacheKey)
    if (cached) return cached

    try {
      incrementUsage()
      const response = await apiCall<DailyBriefingResponse>('/daily-briefing', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId || 'demo-user',
          watchlist,
        }),
      })
      setCache(cacheKey, response)
      return response
    } catch {
      // Return demo data on API failure
      console.log('Using demo briefing data')
      setCache(cacheKey, DEMO_BRIEFING)
      return DEMO_BRIEFING
    }
  },

  /**
   * Get portfolio health analysis
   */
  async getPortfolioHealth(
    userId: string,
    holdings?: Array<{
      symbol: string
      quantity: number
      avg_cost: number
      current_price: number
      value: number
    }>
  ): Promise<PortfolioHealthResponse> {
    const cacheKey = `portfolio-health-${userId}`
    const cached = getCached<PortfolioHealthResponse>(cacheKey)
    if (cached) return cached

    try {
      incrementUsage()
      const response = await apiCall<PortfolioHealthResponse>('/portfolio-health', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          holdings,
        }),
      })
      setCache(cacheKey, response)
      return response
    } catch {
      // Return demo data on API failure
      console.log('Using demo portfolio health data')
      setCache(cacheKey, DEMO_PORTFOLIO_HEALTH)
      return DEMO_PORTFOLIO_HEALTH
    }
  },

  /**
   * Check if AI service is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${AI_API_URL}/health`, {
        method: 'GET',
      })
      return response.ok
    } catch {
      return false
    }
  },

  /**
   * Clear all cached responses
   */
  clearCache(): void {
    cache.clear()
  },
}

export default aiService
