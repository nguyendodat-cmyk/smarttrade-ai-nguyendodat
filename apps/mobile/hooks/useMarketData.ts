import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { marketApi, portfolioApi, tradingApi, aiApi, alertsApi } from '@/lib/api'

// Market data hooks
export function useIndices() {
  return useQuery({
    queryKey: ['indices'],
    queryFn: async () => {
      const response = await marketApi.getIndices()
      return response.data.indices
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}

export function useStocks(params?: { exchange?: string; limit?: number }) {
  return useQuery({
    queryKey: ['stocks', params],
    queryFn: async () => {
      const response = await marketApi.getStocks(params)
      return response.data.stocks
    },
    refetchInterval: 30000,
  })
}

export function useStock(symbol: string) {
  return useQuery({
    queryKey: ['stock', symbol],
    queryFn: async () => {
      const response = await marketApi.getStock(symbol)
      return response.data
    },
    enabled: !!symbol,
    refetchInterval: 10000, // Refetch every 10 seconds for active stock
  })
}

export function useStockChart(symbol: string, interval = '1d', limit = 100) {
  return useQuery({
    queryKey: ['chart', symbol, interval, limit],
    queryFn: async () => {
      const response = await marketApi.getChart(symbol, { interval, limit })
      return response.data
    },
    enabled: !!symbol,
  })
}

// Portfolio hooks
export function usePortfolioSummary() {
  return useQuery({
    queryKey: ['portfolio', 'summary'],
    queryFn: async () => {
      const response = await portfolioApi.getSummary()
      return response.data
    },
  })
}

export function useHoldings() {
  return useQuery({
    queryKey: ['portfolio', 'holdings'],
    queryFn: async () => {
      const response = await portfolioApi.getHoldings()
      return response.data.holdings
    },
  })
}

export function useTransactions(limit = 20, offset = 0) {
  return useQuery({
    queryKey: ['portfolio', 'transactions', limit, offset],
    queryFn: async () => {
      const response = await portfolioApi.getTransactions({ limit, offset })
      return response.data.transactions
    },
  })
}

// Trading hooks
export function useOrders(status?: string) {
  return useQuery({
    queryKey: ['orders', status],
    queryFn: async () => {
      const response = await tradingApi.getOrders({ status })
      return response.data.orders
    },
    refetchInterval: 10000,
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      symbol: string
      side: 'buy' | 'sell'
      type: string
      price: number
      quantity: number
    }) => tradingApi.createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['portfolio'] })
    },
  })
}

export function useCancelOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderId: string) => tradingApi.cancelOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

// AI hooks
export function useAIAnalysis(symbol: string) {
  return useQuery({
    queryKey: ['ai', 'analysis', symbol],
    queryFn: async () => {
      const response = await aiApi.analyze(symbol)
      return response.data
    },
    enabled: !!symbol,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
}

export function useAIChat() {
  return useMutation({
    mutationFn: (data: { message: string; context?: object }) =>
      aiApi.chat(data.message, data.context),
  })
}

// Alert hooks
export function useAlerts() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const response = await alertsApi.getAlerts()
      return response.data.alerts
    },
  })
}

export function useAlertLimits() {
  return useQuery({
    queryKey: ['alerts', 'limits'],
    queryFn: async () => {
      const response = await alertsApi.getLimits()
      return response.data
    },
  })
}

export function useCreateAlert() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      name: string
      symbol: string
      conditions: object[]
      logic_operator: string
    }) => alertsApi.createAlert(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })
}

export function useToggleAlert() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (alertId: string) => alertsApi.toggleAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })
}

export function useDeleteAlert() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (alertId: string) => alertsApi.deleteAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })
}
