import { supabase } from './supabase'
import type { User } from '@/types'

// Helper function
function generateAccountNumber(): string {
  const prefix = '06F'
  const randomPart = Math.random().toString().slice(2, 10)
  return `${prefix}${randomPart}`
}

export const authService = {
  // Sign up with email
  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) throw error

    // Create user profile
    if (data.user) {
      await supabase.from('users').insert({
        id: data.user.id,
        email: data.user.email,
        full_name: fullName,
        subscription_tier: 'free',
        theme: 'dark',
        language: 'vi',
        kyc_status: 'pending',
        notification_settings: {
          price_alerts: true,
          order_updates: true,
          ai_insights: true,
          news: true,
          email: true,
          push: true,
        },
      })

      // Create default trading account
      await supabase.from('trading_accounts').insert({
        user_id: data.user.id,
        account_number: generateAccountNumber(),
        account_type: 'cash',
        cash_balance: 100000000, // 100M VND demo
        buying_power: 100000000,
        pending_cash: 0,
        status: 'active',
      })

      // Create default watchlist
      await supabase.from('watchlists').insert({
        user_id: data.user.id,
        name: 'Mặc định',
        is_default: true,
      })
    }

    return data
  },

  // Sign in with email
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    // Update last login
    if (data.user) {
      await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', data.user.id)
    }

    return data
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Get current session
  async getSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session
  },

  // Get current user profile
  async getCurrentUser(): Promise<User | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    return profile
  },

  // Update user profile
  async updateProfile(userId: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Request password reset
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) throw error
  },

  // Verify OTP (for phone verification)
  async verifyOTP(phone: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    })

    if (error) throw error
    return data
  },

  // Subscribe to auth changes
  onAuthStateChange(callback: (event: string, session: unknown) => void) {
    return supabase.auth.onAuthStateChange(callback)
  },
}
