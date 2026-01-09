import { create } from 'zustand'
import type { Order, OrderFormData } from '@/types'

interface TradingState {
  pendingOrders: Order[]
  orderHistory: Order[]
  currentOrder: OrderFormData | null
  isPlacingOrder: boolean

  // Actions
  setPendingOrders: (orders: Order[]) => void
  setOrderHistory: (orders: Order[]) => void
  addOrder: (order: Order) => void
  updateOrder: (orderId: string, updates: Partial<Order>) => void
  removeOrder: (orderId: string) => void
  setCurrentOrder: (order: OrderFormData | null) => void
  setPlacingOrder: (placing: boolean) => void
}

export const useTradingStore = create<TradingState>((set) => ({
  pendingOrders: [],
  orderHistory: [],
  currentOrder: null,
  isPlacingOrder: false,

  setPendingOrders: (orders) => set({ pendingOrders: orders }),

  setOrderHistory: (orders) => set({ orderHistory: orders }),

  addOrder: (order) =>
    set((state) => ({
      pendingOrders: [order, ...state.pendingOrders],
    })),

  updateOrder: (orderId, updates) =>
    set((state) => ({
      pendingOrders: state.pendingOrders.map((order) =>
        order.id === orderId ? { ...order, ...updates } : order
      ),
    })),

  removeOrder: (orderId) =>
    set((state) => ({
      pendingOrders: state.pendingOrders.filter((order) => order.id !== orderId),
    })),

  setCurrentOrder: (order) => set({ currentOrder: order }),

  setPlacingOrder: (placing) => set({ isPlacingOrder: placing }),
}))
