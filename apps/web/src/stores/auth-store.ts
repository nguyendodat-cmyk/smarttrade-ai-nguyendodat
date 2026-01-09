import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, TradingAccount } from '@/types'
import { authService } from '@/services/auth-service'
import { supabase } from '@/services/supabase'

// Demo mode - set to true to bypass Supabase auth
const DEMO_MODE = true

// Demo user for testing
const DEMO_USER: User = {
  id: 'demo-user-001',
  email: 'demo@smarttrade.ai',
  full_name: 'Demo User',
  phone: '0912345678',
  avatar_url: undefined,
  kyc_status: 'verified',
  risk_tolerance: 'moderate',
  investment_goal: 'growth',
  experience_level: 'intermediate',
  subscription_tier: 'premium',
  theme: 'dark',
  language: 'vi',
  notification_settings: {
    price_alerts: true,
    order_updates: true,
    ai_insights: true,
    news: true,
    email: true,
    push: true,
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const DEMO_ACCOUNT: TradingAccount = {
  id: 'demo-account-001',
  user_id: 'demo-user-001',
  account_number: '058C123456',
  account_type: 'cash',
  cash_balance: 50000000,
  buying_power: 50000000,
  pending_cash: 0,
  status: 'active',
  created_at: new Date().toISOString(),
}

interface AuthState {
  user: User | null
  tradingAccount: TradingAccount | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tradingAccount: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      initialize: async () => {
        try {
          set({ isLoading: true })

          // Demo mode - check if already authenticated from storage
          if (DEMO_MODE) {
            const { isAuthenticated } = get()
            if (isAuthenticated) {
              set({
                user: DEMO_USER,
                tradingAccount: DEMO_ACCOUNT,
                isLoading: false,
              })
            } else {
              set({ isLoading: false })
            }
            return
          }

          const session = await authService.getSession()

          if (session?.user) {
            const user = await authService.getCurrentUser()

            // Get trading account
            const { data: account } = await supabase
              .from('trading_accounts')
              .select('*')
              .eq('user_id', session.user.id)
              .single()

            set({
              user,
              tradingAccount: account,
              isAuthenticated: true,
              isLoading: false,
            })
          } else {
            set({
              user: null,
              tradingAccount: null,
              isAuthenticated: false,
              isLoading: false,
            })
          }
        } catch {
          set({
            error: 'Failed to initialize auth',
            isLoading: false,
          })
        }
      },

      signIn: async (email, password) => {
        try {
          set({ isLoading: true, error: null })

          // Demo mode - accept any credentials
          if (DEMO_MODE) {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 800))

            set({
              user: { ...DEMO_USER, email },
              tradingAccount: DEMO_ACCOUNT,
              isAuthenticated: true,
              isLoading: false,
            })
            return
          }

          await authService.signIn(email, password)
          await get().initialize()
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Sign in failed'
          set({
            error: message,
            isLoading: false,
          })
          throw error
        }
      },

      signUp: async (email, password, fullName) => {
        try {
          set({ isLoading: true, error: null })

          await authService.signUp(email, password, fullName)
          // Note: User needs to verify email before signing in

          set({ isLoading: false })
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Sign up failed'
          set({
            error: message,
            isLoading: false,
          })
          throw error
        }
      },

      signOut: async () => {
        try {
          if (!DEMO_MODE) {
            await authService.signOut()
          }
          set({
            user: null,
            tradingAccount: null,
            isAuthenticated: false,
          })
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Sign out failed'
          set({ error: message })
        }
      },

      updateProfile: async (updates) => {
        const { user } = get()
        if (!user) return

        try {
          const updated = await authService.updateProfile(user.id, updates)
          set({ user: updated })
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Update failed'
          set({ error: message })
          throw error
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
