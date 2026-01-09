export interface User {
  id: string
  email: string
  phone?: string
  full_name: string
  avatar_url?: string

  // KYC
  kyc_status: 'pending' | 'verified' | 'rejected'

  // Investment Profile
  risk_tolerance?: 'conservative' | 'moderate' | 'aggressive'
  investment_goal?: 'growth' | 'income' | 'preservation' | 'speculation'
  experience_level?: 'beginner' | 'intermediate' | 'advanced'

  // Subscription
  subscription_tier: 'free' | 'premium' | 'vip'
  subscription_expires_at?: string

  // Settings
  theme: 'dark' | 'light' | 'auto'
  language: string
  notification_settings: NotificationSettings

  created_at: string
  updated_at: string
}

export interface NotificationSettings {
  price_alerts: boolean
  order_updates: boolean
  ai_insights: boolean
  news: boolean
  email: boolean
  push: boolean
}

export interface TradingAccount {
  id: string
  user_id: string
  account_number: string
  account_type: 'cash' | 'margin'

  cash_balance: number
  buying_power: number
  pending_cash: number

  margin_ratio?: number
  margin_limit?: number
  margin_used?: number

  status: 'active' | 'suspended' | 'closed'
  created_at: string
}
