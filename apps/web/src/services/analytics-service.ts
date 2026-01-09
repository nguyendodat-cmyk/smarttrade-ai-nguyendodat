import { supabase } from './supabase'

type EventCategory = 'trading' | 'ai' | 'navigation' | 'engagement' | 'conversion'

class AnalyticsService {
  private sessionId: string
  private userId: string | null = null
  private pageStartTime: number = Date.now()
  private currentPageviewId: string | null = null
  private isInitialized = false

  constructor() {
    this.sessionId = this.getOrCreateSessionId()
  }

  init() {
    if (this.isInitialized) return
    this.isInitialized = true
    this.initPageTracking()
  }

  private getOrCreateSessionId(): string {
    if (typeof window === 'undefined') return ''

    let sessionId = sessionStorage.getItem('analytics_session_id')
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      sessionStorage.setItem('analytics_session_id', sessionId)
    }
    return sessionId
  }

  setUserId(userId: string | null) {
    this.userId = userId
  }

  private initPageTracking() {
    if (typeof document === 'undefined') return

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.trackPageDuration()
      }
    })

    // Track before unload
    window.addEventListener('beforeunload', () => {
      this.trackPageDuration()
    })
  }

  private async trackPageDuration() {
    const duration = Math.round((Date.now() - this.pageStartTime) / 1000)
    if (duration > 0 && duration < 3600 && this.currentPageviewId) {
      // Update the pageview with duration using sendBeacon for reliability
      const data = JSON.stringify({
        duration_seconds: duration,
        pageview_id: this.currentPageviewId,
      })

      if (navigator.sendBeacon) {
        // Use sendBeacon for more reliable tracking on page exit
        navigator.sendBeacon('/api/analytics/update-duration', data)
      }
    }
  }

  private getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    if (typeof navigator === 'undefined') return 'desktop'

    const ua = navigator.userAgent
    if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet'
    if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile'
    return 'desktop'
  }

  // Track page view
  async trackPageView(path: string, title?: string) {
    this.pageStartTime = Date.now()

    const deviceType = this.getDeviceType()

    try {
      const { data, error } = await supabase
        .from('analytics_pageviews')
        .insert({
          user_id: this.userId,
          session_id: this.sessionId,
          page_path: path,
          page_title: title || (typeof document !== 'undefined' ? document.title : ''),
          referrer: typeof document !== 'undefined' ? document.referrer : '',
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          device_type: deviceType,
        })
        .select('id')
        .single()

      if (!error && data) {
        this.currentPageviewId = data.id
      }
    } catch (err) {
      console.error('Failed to track pageview:', err)
    }
  }

  // Track custom event
  async trackEvent(
    eventName: string,
    category: EventCategory,
    properties?: Record<string, unknown>
  ) {
    try {
      await supabase.from('analytics_events').insert({
        user_id: this.userId,
        session_id: this.sessionId,
        event_name: eventName,
        event_category: category,
        event_properties: properties || {},
        page_path: typeof window !== 'undefined' ? window.location.pathname : '',
      })
    } catch (err) {
      console.error('Failed to track event:', err)
    }
  }

  // Predefined events
  async trackSignup(method: string) {
    await this.trackEvent('signup', 'conversion', { method })
  }

  async trackLogin(method: string) {
    await this.trackEvent('login', 'engagement', { method })
  }

  async trackOrderPlaced(order: { symbol: string; side: string; value: number }) {
    await this.trackEvent('order_placed', 'trading', order)
  }

  async trackAIQuery(queryType: string) {
    await this.trackEvent('ai_query', 'ai', { query_type: queryType })
  }

  async trackAIChat(messageCount: number) {
    await this.trackEvent('ai_chat', 'ai', { message_count: messageCount })
  }

  async trackStockView(symbol: string) {
    await this.trackEvent('stock_view', 'engagement', { symbol })
  }

  async trackPremiumUpgrade(plan: string) {
    await this.trackEvent('premium_upgrade', 'conversion', { plan })
  }

  async trackFeatureUse(feature: string) {
    await this.trackEvent('feature_use', 'engagement', { feature })
  }

  async trackSearch(query: string, resultsCount: number) {
    await this.trackEvent('search', 'navigation', { query, results_count: resultsCount })
  }

  async trackWatchlistAdd(symbol: string) {
    await this.trackEvent('watchlist_add', 'engagement', { symbol })
  }

  async trackPriceAlertCreate(symbol: string, condition: string) {
    await this.trackEvent('price_alert_create', 'engagement', { symbol, condition })
  }
}

export const analytics = new AnalyticsService()
