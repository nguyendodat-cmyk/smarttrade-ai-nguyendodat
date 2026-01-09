import { supabase } from './supabase'
import { sanitizeForSearch, sanitizeSymbol } from '@/lib/sanitize'
import type { Stock, StockRealtime, StockPrice, StockFundamentals, MarketIndex } from '@/types'

export const stockService = {
  // Get all stocks
  async getStocks(options?: {
    exchange?: string
    sector?: string
    search?: string
    limit?: number
  }): Promise<Stock[]> {
    let query = supabase
      .from('stocks')
      .select('*')
      .eq('is_active', true)

    if (options?.exchange) {
      query = query.eq('exchange', options.exchange)
    }

    if (options?.sector) {
      query = query.eq('sector', options.sector)
    }

    if (options?.search) {
      const safeSearch = sanitizeForSearch(options.search)
      if (safeSearch) {
        query = query.or(
          `symbol.ilike.%${safeSearch}%,name.ilike.%${safeSearch}%`
        )
      }
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query.order('symbol')

    if (error) throw error
    return data || []
  },

  // Get single stock
  async getStock(symbol: string): Promise<Stock | null> {
    const { data, error } = await supabase
      .from('stocks')
      .select('*')
      .eq('symbol', symbol)
      .single()

    if (error) throw error
    return data
  },

  // Get realtime data for stocks
  async getRealtimeData(symbols?: string[]): Promise<StockRealtime[]> {
    let query = supabase.from('stock_realtime').select('*')

    if (symbols && symbols.length > 0) {
      query = query.in('symbol', symbols)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  },

  // Get historical prices
  async getHistoricalPrices(
    symbol: string,
    options?: {
      from?: string
      to?: string
      limit?: number
    }
  ): Promise<StockPrice[]> {
    let query = supabase
      .from('stock_prices')
      .select('*')
      .eq('symbol', symbol)
      .order('price_date', { ascending: false })

    if (options?.from) {
      query = query.gte('price_date', options.from)
    }

    if (options?.to) {
      query = query.lte('price_date', options.to)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  },

  // Get fundamentals
  async getFundamentals(symbol: string): Promise<StockFundamentals | null> {
    const { data, error } = await supabase
      .from('stock_fundamentals')
      .select('*')
      .eq('symbol', symbol)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  // Get market indices
  async getMarketIndices(): Promise<MarketIndex[]> {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('market_indices')
      .select('*')
      .eq('index_date', today)

    if (error) throw error
    return data || []
  },

  // Get top movers
  async getTopMovers(
    type: 'gainers' | 'losers' | 'active',
    limit = 10
  ): Promise<StockRealtime[]> {
    let query = supabase.from('stock_realtime').select('*')

    switch (type) {
      case 'gainers':
        query = query
          .gt('change_percent', 0)
          .order('change_percent', { ascending: false })
        break
      case 'losers':
        query = query
          .lt('change_percent', 0)
          .order('change_percent', { ascending: true })
        break
      case 'active':
        query = query.order('total_volume', { ascending: false })
        break
    }

    const { data, error } = await query.limit(limit)

    if (error) throw error
    return data || []
  },

  // Subscribe to realtime updates
  subscribeToStock(symbol: string, callback: (data: StockRealtime) => void) {
    const safeSymbol = sanitizeSymbol(symbol)
    return supabase
      .channel(`stock:${safeSymbol}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stock_realtime',
          filter: `symbol=eq.${safeSymbol}`,
        },
        (payload) => callback(payload.new as StockRealtime)
      )
      .subscribe()
  },

  // Subscribe to multiple stocks
  subscribeToStocks(
    symbols: string[],
    callback: (data: StockRealtime) => void
  ) {
    const safeSymbols = symbols.map(sanitizeSymbol).filter(Boolean)
    if (safeSymbols.length === 0) return null

    return supabase
      .channel('stocks:realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stock_realtime',
          filter: `symbol=in.(${safeSymbols.join(',')})`,
        },
        (payload) => callback(payload.new as StockRealtime)
      )
      .subscribe()
  },

  // Search stocks
  async searchStocks(searchQuery: string, limit = 10): Promise<Stock[]> {
    const safeQuery = sanitizeForSearch(searchQuery)
    if (!safeQuery) {
      return []
    }

    const { data, error } = await supabase
      .from('stocks')
      .select('*')
      .eq('is_active', true)
      .or(`symbol.ilike.%${safeQuery}%,name.ilike.%${safeQuery}%`)
      .limit(limit)

    if (error) throw error
    return data || []
  },
}
