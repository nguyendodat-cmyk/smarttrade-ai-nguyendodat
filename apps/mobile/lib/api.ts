import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

// API base URL - change for production
const API_BASE_URL = __DEV__
  ? 'http://localhost:8000/api/v1'
  : 'https://api.smarttrade.ai/api/v1'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Token storage keys
const ACCESS_TOKEN_KEY = 'smarttrade_access_token'
const REFRESH_TOKEN_KEY = 'smarttrade_refresh_token'

// Token management
export async function getAccessToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY)
}

export async function setAccessToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token)
}

export async function getRefreshToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY)
}

export async function setRefreshToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token)
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY)
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY)
}

// Request interceptor - add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = await getRefreshToken()
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          })

          const { access_token, refresh_token } = response.data
          await setAccessToken(access_token)
          await setRefreshToken(refresh_token)

          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return api(originalRequest)
        }
      } catch {
        // Refresh failed - clear tokens and redirect to login
        await clearTokens()
      }
    }

    return Promise.reject(error)
  }
)

// API functions
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (data: { email: string; password: string; full_name: string }) =>
    api.post('/auth/register', data),

  logout: () => api.post('/auth/logout'),

  me: () => api.get('/auth/me'),
}

export const marketApi = {
  getIndices: () => api.get('/market/indices'),

  getStocks: (params?: { exchange?: string; limit?: number }) =>
    api.get('/market/stocks', { params }),

  getStock: (symbol: string) => api.get(`/market/stocks/${symbol}`),

  getQuote: (symbol: string) => api.get(`/market/quote/${symbol}`),

  getChart: (symbol: string, params?: { interval?: string; limit?: number }) =>
    api.get(`/market/chart/${symbol}`, { params }),
}

export const portfolioApi = {
  getSummary: () => api.get('/portfolio/summary'),

  getHoldings: () => api.get('/portfolio/holdings'),

  getTransactions: (params?: { limit?: number; offset?: number }) =>
    api.get('/portfolio/transactions', { params }),
}

export const tradingApi = {
  createOrder: (data: {
    symbol: string
    side: 'buy' | 'sell'
    type: string
    price: number
    quantity: number
  }) => api.post('/trading/orders', data),

  getOrders: (params?: { status?: string }) =>
    api.get('/trading/orders', { params }),

  cancelOrder: (orderId: string) =>
    api.delete(`/trading/orders/${orderId}`),
}

export const aiApi = {
  chat: (message: string, context?: object) =>
    api.post('/ai/chat', { message, context }),

  analyze: (symbol: string) =>
    api.get(`/ai/analyze/${symbol}`),
}

export const alertsApi = {
  getAlerts: () => api.get('/alerts'),

  createAlert: (data: {
    name: string
    symbol: string
    conditions: object[]
    logic_operator: string
  }) => api.post('/alerts', data),

  toggleAlert: (alertId: string) =>
    api.post(`/alerts/${alertId}/toggle`),

  deleteAlert: (alertId: string) =>
    api.delete(`/alerts/${alertId}`),

  getLimits: () => api.get('/alerts/limits'),
}

export default api
