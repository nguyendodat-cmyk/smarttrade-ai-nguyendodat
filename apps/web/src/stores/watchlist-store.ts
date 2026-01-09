import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Types
export interface WatchlistStock {
  symbol: string
  name: string
  exchange: string
  sector: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap: number
  pe: number
  high52w: number
  low52w: number
  sparklineData: number[]
  addedAt: string
  notes?: string
}

export interface Watchlist {
  id: string
  name: string
  color: string
  stocks: WatchlistStock[]
  createdAt: string
  updatedAt: string
}

interface WatchlistState {
  watchlists: Watchlist[]
  activeWatchlistId: string | null

  // Actions
  createWatchlist: (name: string, color?: string) => void
  deleteWatchlist: (id: string) => void
  renameWatchlist: (id: string, name: string) => void
  setWatchlistColor: (id: string, color: string) => void
  setActiveWatchlist: (id: string) => void

  addStock: (watchlistId: string, stock: Omit<WatchlistStock, 'addedAt'>) => void
  removeStock: (watchlistId: string, symbol: string) => void
  updateStockNote: (watchlistId: string, symbol: string, note: string) => void
  moveStock: (fromWatchlistId: string, toWatchlistId: string, symbol: string) => void

  getActiveWatchlist: () => Watchlist | null
}

// Predefined colors for watchlists
export const WATCHLIST_COLORS = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
]

// Generate mock sparkline data
const generateSparkline = (basePrice: number): number[] => {
  const data: number[] = []
  let price = basePrice * 0.95
  for (let i = 0; i < 20; i++) {
    price = price + (Math.random() - 0.5) * basePrice * 0.02
    data.push(Math.round(price))
  }
  return data
}

// Initial mock data
const initialWatchlists: Watchlist[] = [
  {
    id: 'default',
    name: 'Danh sách chính',
    color: '#3b82f6',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stocks: [
      {
        symbol: 'VNM',
        name: 'Công ty CP Sữa Việt Nam',
        exchange: 'HOSE',
        sector: 'Thực phẩm',
        price: 85200,
        change: 1200,
        changePercent: 1.43,
        volume: 2500000,
        marketCap: 178000000000000,
        pe: 18.5,
        high52w: 92000,
        low52w: 68000,
        sparklineData: generateSparkline(85200),
        addedAt: new Date().toISOString(),
      },
      {
        symbol: 'FPT',
        name: 'Công ty CP FPT',
        exchange: 'HOSE',
        sector: 'Công nghệ',
        price: 92100,
        change: -480,
        changePercent: -0.52,
        volume: 1800000,
        marketCap: 120000000000000,
        pe: 22.3,
        high52w: 98000,
        low52w: 72000,
        sparklineData: generateSparkline(92100),
        addedAt: new Date().toISOString(),
      },
      {
        symbol: 'VIC',
        name: 'Tập đoàn Vingroup',
        exchange: 'HOSE',
        sector: 'Bất động sản',
        price: 42500,
        change: 900,
        changePercent: 2.16,
        volume: 3200000,
        marketCap: 145000000000000,
        pe: 45.2,
        high52w: 52000,
        low52w: 35000,
        sparklineData: generateSparkline(42500),
        addedAt: new Date().toISOString(),
      },
      {
        symbol: 'HPG',
        name: 'Tập đoàn Hòa Phát',
        exchange: 'HOSE',
        sector: 'Thép',
        price: 25800,
        change: 200,
        changePercent: 0.78,
        volume: 5600000,
        marketCap: 142000000000000,
        pe: 12.4,
        high52w: 32000,
        low52w: 21000,
        sparklineData: generateSparkline(25800),
        addedAt: new Date().toISOString(),
      },
      {
        symbol: 'VHM',
        name: 'Công ty CP Vinhomes',
        exchange: 'HOSE',
        sector: 'Bất động sản',
        price: 38900,
        change: -480,
        changePercent: -1.23,
        volume: 2100000,
        marketCap: 130000000000000,
        pe: 8.9,
        high52w: 48000,
        low52w: 32000,
        sparklineData: generateSparkline(38900),
        addedAt: new Date().toISOString(),
      },
      {
        symbol: 'MSN',
        name: 'Tập đoàn Masan',
        exchange: 'HOSE',
        sector: 'Tiêu dùng',
        price: 67800,
        change: 1280,
        changePercent: 1.89,
        volume: 1500000,
        marketCap: 80000000000000,
        pe: 35.6,
        high52w: 85000,
        low52w: 55000,
        sparklineData: generateSparkline(67800),
        addedAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'tech',
    name: 'Công nghệ',
    color: '#8b5cf6',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stocks: [
      {
        symbol: 'FPT',
        name: 'Công ty CP FPT',
        exchange: 'HOSE',
        sector: 'Công nghệ',
        price: 92100,
        change: -480,
        changePercent: -0.52,
        volume: 1800000,
        marketCap: 120000000000000,
        pe: 22.3,
        high52w: 98000,
        low52w: 72000,
        sparklineData: generateSparkline(92100),
        addedAt: new Date().toISOString(),
      },
      {
        symbol: 'CMG',
        name: 'Công ty CP CMC',
        exchange: 'HOSE',
        sector: 'Công nghệ',
        price: 45600,
        change: 800,
        changePercent: 1.78,
        volume: 320000,
        marketCap: 12000000000000,
        pe: 15.2,
        high52w: 52000,
        low52w: 35000,
        sparklineData: generateSparkline(45600),
        addedAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'banking',
    name: 'Ngân hàng',
    color: '#22c55e',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stocks: [
      {
        symbol: 'VCB',
        name: 'Ngân hàng Vietcombank',
        exchange: 'HOSE',
        sector: 'Ngân hàng',
        price: 89500,
        change: 1500,
        changePercent: 1.70,
        volume: 1200000,
        marketCap: 420000000000000,
        pe: 14.8,
        high52w: 98000,
        low52w: 75000,
        sparklineData: generateSparkline(89500),
        addedAt: new Date().toISOString(),
      },
      {
        symbol: 'TCB',
        name: 'Ngân hàng Techcombank',
        exchange: 'HOSE',
        sector: 'Ngân hàng',
        price: 24800,
        change: -200,
        changePercent: -0.80,
        volume: 2800000,
        marketCap: 87000000000000,
        pe: 6.5,
        high52w: 32000,
        low52w: 20000,
        sparklineData: generateSparkline(24800),
        addedAt: new Date().toISOString(),
      },
      {
        symbol: 'MBB',
        name: 'Ngân hàng MB',
        exchange: 'HOSE',
        sector: 'Ngân hàng',
        price: 19200,
        change: 300,
        changePercent: 1.59,
        volume: 4500000,
        marketCap: 95000000000000,
        pe: 5.2,
        high52w: 25000,
        low52w: 16000,
        sparklineData: generateSparkline(19200),
        addedAt: new Date().toISOString(),
      },
    ],
  },
]

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      watchlists: initialWatchlists,
      activeWatchlistId: 'default',

      createWatchlist: (name, color) => {
        const id = `watchlist-${Date.now()}`
        const newWatchlist: Watchlist = {
          id,
          name,
          color: color || WATCHLIST_COLORS[get().watchlists.length % WATCHLIST_COLORS.length],
          stocks: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({
          watchlists: [...state.watchlists, newWatchlist],
          activeWatchlistId: id,
        }))
      },

      deleteWatchlist: (id) => {
        set((state) => {
          const newWatchlists = state.watchlists.filter((w) => w.id !== id)
          return {
            watchlists: newWatchlists,
            activeWatchlistId:
              state.activeWatchlistId === id
                ? newWatchlists[0]?.id || null
                : state.activeWatchlistId,
          }
        })
      },

      renameWatchlist: (id, name) => {
        set((state) => ({
          watchlists: state.watchlists.map((w) =>
            w.id === id ? { ...w, name, updatedAt: new Date().toISOString() } : w
          ),
        }))
      },

      setWatchlistColor: (id, color) => {
        set((state) => ({
          watchlists: state.watchlists.map((w) =>
            w.id === id ? { ...w, color, updatedAt: new Date().toISOString() } : w
          ),
        }))
      },

      setActiveWatchlist: (id) => {
        set({ activeWatchlistId: id })
      },

      addStock: (watchlistId, stock) => {
        set((state) => ({
          watchlists: state.watchlists.map((w) => {
            if (w.id !== watchlistId) return w
            // Check if stock already exists
            if (w.stocks.some((s) => s.symbol === stock.symbol)) return w
            return {
              ...w,
              stocks: [...w.stocks, { ...stock, addedAt: new Date().toISOString() }],
              updatedAt: new Date().toISOString(),
            }
          }),
        }))
      },

      removeStock: (watchlistId, symbol) => {
        set((state) => ({
          watchlists: state.watchlists.map((w) => {
            if (w.id !== watchlistId) return w
            return {
              ...w,
              stocks: w.stocks.filter((s) => s.symbol !== symbol),
              updatedAt: new Date().toISOString(),
            }
          }),
        }))
      },

      updateStockNote: (watchlistId, symbol, note) => {
        set((state) => ({
          watchlists: state.watchlists.map((w) => {
            if (w.id !== watchlistId) return w
            return {
              ...w,
              stocks: w.stocks.map((s) =>
                s.symbol === symbol ? { ...s, notes: note } : s
              ),
              updatedAt: new Date().toISOString(),
            }
          }),
        }))
      },

      moveStock: (fromWatchlistId, toWatchlistId, symbol) => {
        const state = get()
        const fromWatchlist = state.watchlists.find((w) => w.id === fromWatchlistId)
        const stock = fromWatchlist?.stocks.find((s) => s.symbol === symbol)
        if (!stock) return

        set((state) => ({
          watchlists: state.watchlists.map((w) => {
            if (w.id === fromWatchlistId) {
              return {
                ...w,
                stocks: w.stocks.filter((s) => s.symbol !== symbol),
                updatedAt: new Date().toISOString(),
              }
            }
            if (w.id === toWatchlistId) {
              // Don't add if already exists
              if (w.stocks.some((s) => s.symbol === symbol)) return w
              return {
                ...w,
                stocks: [...w.stocks, stock],
                updatedAt: new Date().toISOString(),
              }
            }
            return w
          }),
        }))
      },

      getActiveWatchlist: () => {
        const state = get()
        return state.watchlists.find((w) => w.id === state.activeWatchlistId) || null
      },
    }),
    {
      name: 'watchlist-storage',
    }
  )
)
