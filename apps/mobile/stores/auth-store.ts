import { create } from 'zustand'
import { authApi, setAccessToken, setRefreshToken, clearTokens } from '@/lib/api'

interface User {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  is_premium: boolean
  created_at: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (data: { email: string; password: string; full_name: string }) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authApi.login(email, password)
      const { access_token, refresh_token, user } = response.data

      await setAccessToken(access_token)
      await setRefreshToken(refresh_token)

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Đăng nhập thất bại',
        isLoading: false,
      })
      throw error
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authApi.register(data)
      const { access_token, refresh_token, user } = response.data

      await setAccessToken(access_token)
      await setRefreshToken(refresh_token)

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Đăng ký thất bại',
        isLoading: false,
      })
      throw error
    }
  },

  logout: async () => {
    try {
      await authApi.logout()
    } catch {
      // Ignore logout API errors
    } finally {
      await clearTokens()
      set({
        user: null,
        isAuthenticated: false,
        error: null,
      })
    }
  },

  checkAuth: async () => {
    set({ isLoading: true })
    try {
      const response = await authApi.me()
      set({
        user: response.data,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch {
      await clearTokens()
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  },

  clearError: () => set({ error: null }),
}))

export default useAuthStore
