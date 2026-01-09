-- SmartTrade AI - Initial Database Schema
-- Migration: 001_initial_schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'enterprise')),
    ai_queries_today INTEGER DEFAULT 0,
    ai_queries_reset_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification settings
CREATE TABLE public.notification_settings (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    price_alerts BOOLEAN DEFAULT true,
    order_updates BOOLEAN DEFAULT true,
    ai_insights BOOLEAN DEFAULT true,
    market_news BOOLEAN DEFAULT false,
    email_enabled BOOLEAN DEFAULT true,
    push_enabled BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRADING ACCOUNTS
-- ============================================

CREATE TABLE public.trading_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    broker TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_name TEXT,
    is_default BOOLEAN DEFAULT false,
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    last_synced_at TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'disconnected', 'pending')),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, broker, account_number)
);

-- ============================================
-- STOCKS & MARKET DATA
-- ============================================

-- Stock master data
CREATE TABLE public.stocks (
    symbol TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    exchange TEXT NOT NULL CHECK (exchange IN ('HOSE', 'HNX', 'UPCOM')),
    industry TEXT,
    sector TEXT,
    market_cap BIGINT,
    listed_shares BIGINT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Real-time price data (updated frequently)
CREATE TABLE public.stock_prices (
    symbol TEXT PRIMARY KEY REFERENCES public.stocks(symbol) ON DELETE CASCADE,
    price DECIMAL(12, 2) NOT NULL,
    open DECIMAL(12, 2),
    high DECIMAL(12, 2),
    low DECIMAL(12, 2),
    close DECIMAL(12, 2),
    prev_close DECIMAL(12, 2),
    change DECIMAL(12, 2),
    change_percent DECIMAL(6, 2),
    volume BIGINT,
    value BIGINT,
    foreign_buy BIGINT DEFAULT 0,
    foreign_sell BIGINT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Historical price data
CREATE TABLE public.stock_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT NOT NULL REFERENCES public.stocks(symbol) ON DELETE CASCADE,
    date DATE NOT NULL,
    open DECIMAL(12, 2),
    high DECIMAL(12, 2),
    low DECIMAL(12, 2),
    close DECIMAL(12, 2),
    volume BIGINT,
    value BIGINT,

    UNIQUE(symbol, date)
);

-- Market indices
CREATE TABLE public.market_indices (
    symbol TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    value DECIMAL(12, 2) NOT NULL,
    change DECIMAL(12, 2),
    change_percent DECIMAL(6, 2),
    volume BIGINT,
    value_traded BIGINT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WATCHLIST
-- ============================================

CREATE TABLE public.watchlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Mặc định',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, name)
);

CREATE TABLE public.watchlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    watchlist_id UUID NOT NULL REFERENCES public.watchlists(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL REFERENCES public.stocks(symbol) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    target_price DECIMAL(12, 2),
    stop_loss DECIMAL(12, 2),

    UNIQUE(watchlist_id, symbol)
);

-- ============================================
-- PORTFOLIO & HOLDINGS
-- ============================================

CREATE TABLE public.holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.trading_accounts(id) ON DELETE SET NULL,
    symbol TEXT NOT NULL REFERENCES public.stocks(symbol) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    avg_cost DECIMAL(12, 2) NOT NULL,
    current_price DECIMAL(12, 2),
    market_value DECIMAL(15, 2),
    unrealized_pl DECIMAL(15, 2),
    unrealized_pl_percent DECIMAL(8, 2),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, account_id, symbol)
);

-- Portfolio snapshots (for historical tracking)
CREATE TABLE public.portfolio_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_value DECIMAL(15, 2) NOT NULL,
    cash_balance DECIMAL(15, 2),
    stock_value DECIMAL(15, 2),
    daily_pl DECIMAL(15, 2),
    daily_pl_percent DECIMAL(8, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, date)
);

-- ============================================
-- ORDERS
-- ============================================

CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.trading_accounts(id) ON DELETE SET NULL,
    symbol TEXT NOT NULL REFERENCES public.stocks(symbol) ON DELETE CASCADE,
    side TEXT NOT NULL CHECK (side IN ('BUY', 'SELL')),
    type TEXT NOT NULL CHECK (type IN ('LO', 'MP', 'ATO', 'ATC', 'MTL', 'MOK', 'MAK')),
    quantity INTEGER NOT NULL,
    price DECIMAL(12, 2),
    filled_quantity INTEGER DEFAULT 0,
    avg_filled_price DECIMAL(12, 2),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'open', 'partial', 'filled', 'cancelled', 'rejected')),
    reject_reason TEXT,
    broker_order_id TEXT,
    placed_at TIMESTAMPTZ DEFAULT NOW(),
    filled_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AI FEATURES
-- ============================================

-- AI query history (for rate limiting and analytics)
CREATE TABLE public.ai_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    query_type TEXT NOT NULL CHECK (query_type IN ('chat', 'stock_insight', 'portfolio_health', 'daily_briefing')),
    input TEXT,
    output TEXT,
    tokens_used INTEGER,
    model TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI chat conversations
CREATE TABLE public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.ai_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Price alerts
CREATE TABLE public.price_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL REFERENCES public.stocks(symbol) ON DELETE CASCADE,
    condition TEXT NOT NULL CHECK (condition IN ('above', 'below', 'percent_up', 'percent_down')),
    target_value DECIMAL(12, 2) NOT NULL,
    is_triggered BOOLEAN DEFAULT false,
    triggered_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_holdings_user_id ON public.holdings(user_id);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_symbol ON public.orders(symbol);
CREATE INDEX idx_stock_history_symbol_date ON public.stock_history(symbol, date DESC);
CREATE INDEX idx_ai_queries_user_date ON public.ai_queries(user_id, created_at DESC);
CREATE INDEX idx_price_alerts_user ON public.price_alerts(user_id, is_active);
CREATE INDEX idx_watchlist_items_watchlist ON public.watchlist_items(watchlist_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Notification settings policies
CREATE POLICY "Users can view own notification settings" ON public.notification_settings
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notification settings" ON public.notification_settings
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notification settings" ON public.notification_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trading accounts policies
CREATE POLICY "Users can manage own trading accounts" ON public.trading_accounts
    FOR ALL USING (auth.uid() = user_id);

-- Watchlists policies
CREATE POLICY "Users can manage own watchlists" ON public.watchlists
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own watchlist items" ON public.watchlist_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.watchlists
            WHERE id = watchlist_items.watchlist_id
            AND user_id = auth.uid()
        )
    );

-- Holdings policies
CREATE POLICY "Users can manage own holdings" ON public.holdings
    FOR ALL USING (auth.uid() = user_id);

-- Portfolio snapshots policies
CREATE POLICY "Users can view own portfolio snapshots" ON public.portfolio_snapshots
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own portfolio snapshots" ON public.portfolio_snapshots
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Orders policies
CREATE POLICY "Users can manage own orders" ON public.orders
    FOR ALL USING (auth.uid() = user_id);

-- AI queries policies
CREATE POLICY "Users can view own AI queries" ON public.ai_queries
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own AI queries" ON public.ai_queries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- AI conversations policies
CREATE POLICY "Users can manage own AI conversations" ON public.ai_conversations
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own AI messages" ON public.ai_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.ai_conversations
            WHERE id = ai_messages.conversation_id
            AND user_id = auth.uid()
        )
    );

-- Price alerts policies
CREATE POLICY "Users can manage own price alerts" ON public.price_alerts
    FOR ALL USING (auth.uid() = user_id);

-- Public read for stocks and market data
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_indices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read stocks" ON public.stocks FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "Anyone can read stock prices" ON public.stock_prices FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "Anyone can read market indices" ON public.market_indices FOR SELECT TO PUBLIC USING (true);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stocks_updated_at
    BEFORE UPDATE ON public.stocks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_conversations_updated_at
    BEFORE UPDATE ON public.ai_conversations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');

    INSERT INTO public.notification_settings (user_id)
    VALUES (NEW.id);

    INSERT INTO public.watchlists (user_id, name, is_default)
    VALUES (NEW.id, 'Mặc định', true);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Reset AI query count daily
CREATE OR REPLACE FUNCTION public.reset_ai_queries_if_needed()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.ai_queries_reset_at::date < CURRENT_DATE THEN
        NEW.ai_queries_today = 0;
        NEW.ai_queries_reset_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_ai_queries_reset
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.reset_ai_queries_if_needed();
