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
-- SmartTrade AI - Seed Data
-- Migration: 002_seed_data

-- ============================================
-- SEED MARKET INDICES
-- ============================================

INSERT INTO public.market_indices (symbol, name, value, change, change_percent, volume, value_traded) VALUES
('VNINDEX', 'VN-Index', 1245.67, 12.35, 1.00, 850000000, 18500000000000),
('VN30', 'VN30', 1298.45, 15.20, 1.18, 420000000, 12300000000000),
('HNX', 'HNX-Index', 234.56, -1.23, -0.52, 125000000, 2100000000000)
ON CONFLICT (symbol) DO UPDATE SET
    value = EXCLUDED.value,
    change = EXCLUDED.change,
    change_percent = EXCLUDED.change_percent,
    volume = EXCLUDED.volume,
    value_traded = EXCLUDED.value_traded,
    updated_at = NOW();

-- ============================================
-- SEED STOCKS (Top Vietnamese Stocks)
-- ============================================

INSERT INTO public.stocks (symbol, name, exchange, industry, sector, market_cap, listed_shares, is_active) VALUES
-- Blue chips
('VNM', 'CTCP Sữa Việt Nam', 'HOSE', 'Thực phẩm & Đồ uống', 'Tiêu dùng', 177000000000000, 2089955040, true),
('VIC', 'Tập đoàn Vingroup', 'HOSE', 'Bất động sản', 'Bất động sản', 145000000000000, 3892629192, true),
('VHM', 'CTCP Vinhomes', 'HOSE', 'Bất động sản', 'Bất động sản', 135000000000000, 3457000000, true),
('VCB', 'NH TMCP Ngoại Thương Việt Nam', 'HOSE', 'Ngân hàng', 'Tài chính', 450000000000000, 4732598234, true),
('BID', 'NH TMCP Đầu tư và Phát triển Việt Nam', 'HOSE', 'Ngân hàng', 'Tài chính', 180000000000000, 5071308000, true),
('CTG', 'NH TMCP Công Thương Việt Nam', 'HOSE', 'Ngân hàng', 'Tài chính', 160000000000000, 4812000000, true),
('HPG', 'CTCP Tập đoàn Hòa Phát', 'HOSE', 'Thép', 'Công nghiệp', 145000000000000, 5831612000, true),
('FPT', 'CTCP FPT', 'HOSE', 'Công nghệ', 'Công nghệ', 120000000000000, 1156000000, true),
('MWG', 'CTCP Đầu tư Thế Giới Di Động', 'HOSE', 'Bán lẻ', 'Tiêu dùng', 75000000000000, 1455000000, true),
('MSN', 'CTCP Tập đoàn Masan', 'HOSE', 'Thực phẩm & Đồ uống', 'Tiêu dùng', 115000000000000, 1175000000, true),
('VRE', 'CTCP Vincom Retail', 'HOSE', 'Bất động sản', 'Bất động sản', 45000000000000, 2343000000, true),
('SAB', 'Tổng CTCP Bia - Rượu - NGK Sài Gòn', 'HOSE', 'Thực phẩm & Đồ uống', 'Tiêu dùng', 95000000000000, 641000000, true),
('TCB', 'NH TMCP Kỹ Thương Việt Nam', 'HOSE', 'Ngân hàng', 'Tài chính', 140000000000000, 3534000000, true),
('MBB', 'NH TMCP Quân Đội', 'HOSE', 'Ngân hàng', 'Tài chính', 135000000000000, 4900000000, true),
('VPB', 'NH TMCP Việt Nam Thịnh Vượng', 'HOSE', 'Ngân hàng', 'Tài chính', 150000000000000, 6789000000, true),
('ACB', 'NH TMCP Á Châu', 'HOSE', 'Ngân hàng', 'Tài chính', 85000000000000, 3500000000, true),
('GAS', 'Tổng CTCP Khí Việt Nam', 'HOSE', 'Dầu khí', 'Năng lượng', 160000000000000, 1913000000, true),
('PLX', 'Tập đoàn Xăng Dầu Việt Nam', 'HOSE', 'Dầu khí', 'Năng lượng', 55000000000000, 1311000000, true),
('POW', 'Tổng CTCP Điện lực Dầu khí Việt Nam', 'HOSE', 'Điện', 'Năng lượng', 28000000000000, 2343000000, true),
('VJC', 'CTCP Hàng không Vietjet', 'HOSE', 'Hàng không', 'Dịch vụ', 55000000000000, 541000000, true),
('STB', 'NH TMCP Sài Gòn Thương Tín', 'HOSE', 'Ngân hàng', 'Tài chính', 45000000000000, 1890000000, true),
('SSI', 'CTCP Chứng khoán SSI', 'HOSE', 'Chứng khoán', 'Tài chính', 25000000000000, 1500000000, true),
('VND', 'CTCP Chứng khoán VNDirect', 'HOSE', 'Chứng khoán', 'Tài chính', 18000000000000, 1234000000, true),
('HDB', 'NH TMCP Phát triển TP.HCM', 'HOSE', 'Ngân hàng', 'Tài chính', 75000000000000, 2450000000, true),
('TPB', 'NH TMCP Tiên Phong', 'HOSE', 'Ngân hàng', 'Tài chính', 42000000000000, 2150000000, true),
('NVL', 'CTCP Tập đoàn Đầu tư Địa ốc No Va', 'HOSE', 'Bất động sản', 'Bất động sản', 35000000000000, 1900000000, true),
('PDR', 'CTCP Phát Đạt', 'HOSE', 'Bất động sản', 'Bất động sản', 15000000000000, 678000000, true),
('DXG', 'CTCP Tập đoàn Đất Xanh', 'HOSE', 'Bất động sản', 'Bất động sản', 12000000000000, 890000000, true),
('REE', 'CTCP Cơ Điện Lạnh', 'HOSE', 'Điện', 'Công nghiệp', 18000000000000, 311000000, true),
('GVR', 'Tập đoàn Công nghiệp Cao su Việt Nam', 'HOSE', 'Cao su', 'Công nghiệp', 32000000000000, 4000000000, true)
ON CONFLICT (symbol) DO UPDATE SET
    name = EXCLUDED.name,
    exchange = EXCLUDED.exchange,
    industry = EXCLUDED.industry,
    sector = EXCLUDED.sector,
    market_cap = EXCLUDED.market_cap,
    listed_shares = EXCLUDED.listed_shares,
    updated_at = NOW();

-- ============================================
-- SEED STOCK PRICES
-- ============================================

INSERT INTO public.stock_prices (symbol, price, open, high, low, close, prev_close, change, change_percent, volume, value) VALUES
('VNM', 85200, 84500, 85800, 84200, 85200, 84000, 1200, 1.43, 2500000, 213000000000),
('VIC', 42500, 41800, 43200, 41500, 42500, 41600, 900, 2.16, 3200000, 136000000000),
('VHM', 38900, 38500, 39400, 38200, 38900, 39400, -500, -1.27, 2100000, 81690000000),
('VCB', 95200, 94500, 95800, 94200, 95200, 94800, 400, 0.42, 1800000, 171360000000),
('BID', 46800, 46200, 47100, 46000, 46800, 46500, 300, 0.65, 1500000, 70200000000),
('CTG', 33500, 33200, 33800, 33000, 33500, 33400, 100, 0.30, 2200000, 73700000000),
('HPG', 25800, 25200, 26100, 25000, 25800, 25500, 300, 1.18, 5600000, 144480000000),
('FPT', 92100, 91500, 93000, 91200, 92100, 91600, 500, 0.55, 1800000, 165780000000),
('MWG', 52000, 53200, 53500, 51800, 52000, 54100, -2100, -3.88, 2800000, 145600000000),
('MSN', 67800, 66500, 68200, 66200, 67800, 66600, 1200, 1.80, 1500000, 101700000000),
('VRE', 19200, 19000, 19500, 18900, 19200, 19100, 100, 0.52, 1200000, 23040000000),
('SAB', 148000, 147500, 149000, 147000, 148000, 147800, 200, 0.14, 450000, 66600000000),
('TCB', 39500, 39200, 39900, 39000, 39500, 39300, 200, 0.51, 2400000, 94800000000),
('MBB', 27500, 27200, 27800, 27000, 27500, 27300, 200, 0.73, 3200000, 88000000000),
('VPB', 22000, 21800, 22300, 21600, 22000, 21900, 100, 0.46, 4500000, 99000000000),
('ACB', 24200, 24000, 24500, 23800, 24200, 24100, 100, 0.41, 2800000, 67760000000),
('GAS', 83500, 82800, 84000, 82500, 83500, 83200, 300, 0.36, 1100000, 91850000000),
('PLX', 42000, 41800, 42300, 41600, 42000, 42100, -100, -0.24, 890000, 37380000000),
('POW', 12000, 11900, 12200, 11800, 12000, 11950, 50, 0.42, 3500000, 42000000000),
('VJC', 102000, 101500, 103000, 101000, 102000, 101800, 200, 0.20, 650000, 66300000000),
('STB', 23800, 23500, 24100, 23400, 23800, 23700, 100, 0.42, 1800000, 42840000000),
('SSI', 16500, 16300, 16700, 16200, 16500, 16400, 100, 0.61, 4200000, 69300000000),
('VND', 14500, 14300, 14700, 14200, 14500, 14450, 50, 0.35, 3800000, 55100000000),
('HDB', 30500, 30200, 30800, 30000, 30500, 30400, 100, 0.33, 1600000, 48800000000),
('TPB', 19500, 19300, 19700, 19200, 19500, 19400, 100, 0.52, 2100000, 40950000000),
('NVL', 18500, 18200, 18800, 18000, 18500, 18300, 200, 1.09, 2500000, 46250000000),
('PDR', 22000, 21800, 22300, 21600, 22000, 21800, 200, 0.92, 1800000, 39600000000),
('DXG', 13500, 13300, 13700, 13200, 13500, 13400, 100, 0.75, 2200000, 29700000000),
('REE', 58000, 57500, 58500, 57200, 58000, 57800, 200, 0.35, 750000, 43500000000),
('GVR', 8000, 7900, 8100, 7850, 8000, 7950, 50, 0.63, 5500000, 44000000000)
ON CONFLICT (symbol) DO UPDATE SET
    price = EXCLUDED.price,
    open = EXCLUDED.open,
    high = EXCLUDED.high,
    low = EXCLUDED.low,
    close = EXCLUDED.close,
    prev_close = EXCLUDED.prev_close,
    change = EXCLUDED.change,
    change_percent = EXCLUDED.change_percent,
    volume = EXCLUDED.volume,
    value = EXCLUDED.value,
    updated_at = NOW();
-- =============================================
-- Knowledge Base for RAG (Retrieval-Augmented Generation)
-- =============================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Knowledge documents table with vector embeddings
CREATE TABLE knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Metadata
    title TEXT NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('news', 'research', 'regulation', 'company', 'tutorial')),
    source_url TEXT,
    symbol TEXT,  -- Related stock symbol if any
    category TEXT,  -- Sub-category for filtering

    -- Content
    content TEXT NOT NULL,
    content_tokens INTEGER DEFAULT 0,
    chunk_index INTEGER DEFAULT 0,  -- For multi-chunk documents
    parent_id UUID REFERENCES knowledge_documents(id),  -- Link chunks to parent

    -- Vector embedding (1536 dimensions for text-embedding-3-small)
    embedding vector(1536),

    -- Timestamps
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Deduplication
    content_hash TEXT UNIQUE
);

-- Index for fast similarity search (IVFFlat for large datasets)
CREATE INDEX idx_knowledge_embedding ON knowledge_documents
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Index for filtering
CREATE INDEX idx_knowledge_source ON knowledge_documents (source);
CREATE INDEX idx_knowledge_symbol ON knowledge_documents (symbol);
CREATE INDEX idx_knowledge_published ON knowledge_documents (published_at DESC);
CREATE INDEX idx_knowledge_category ON knowledge_documents (category);

-- Search function using cosine similarity
CREATE OR REPLACE FUNCTION search_knowledge(
    query_embedding vector(1536),
    match_count INT DEFAULT 5,
    filter_source TEXT DEFAULT NULL,
    filter_symbol TEXT DEFAULT NULL,
    filter_category TEXT DEFAULT NULL,
    min_similarity FLOAT DEFAULT 0.7
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    source TEXT,
    symbol TEXT,
    category TEXT,
    published_at TIMESTAMPTZ,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        kd.id,
        kd.title,
        kd.content,
        kd.source,
        kd.symbol,
        kd.category,
        kd.published_at,
        1 - (kd.embedding <=> query_embedding) AS similarity
    FROM knowledge_documents kd
    WHERE
        (filter_source IS NULL OR kd.source = filter_source)
        AND (filter_symbol IS NULL OR kd.symbol = filter_symbol)
        AND (filter_category IS NULL OR kd.category = filter_category)
        AND (1 - (kd.embedding <=> query_embedding)) >= min_similarity
    ORDER BY kd.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Hybrid search: combine vector similarity with keyword matching
CREATE OR REPLACE FUNCTION hybrid_search_knowledge(
    query_embedding vector(1536),
    query_text TEXT,
    match_count INT DEFAULT 5,
    filter_source TEXT DEFAULT NULL,
    filter_symbol TEXT DEFAULT NULL,
    vector_weight FLOAT DEFAULT 0.7,
    keyword_weight FLOAT DEFAULT 0.3
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    source TEXT,
    symbol TEXT,
    similarity FLOAT,
    keyword_rank FLOAT,
    combined_score FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        kd.id,
        kd.title,
        kd.content,
        kd.source,
        kd.symbol,
        (1 - (kd.embedding <=> query_embedding)) AS similarity,
        ts_rank(to_tsvector('simple', kd.content), plainto_tsquery('simple', query_text)) AS keyword_rank,
        (
            vector_weight * (1 - (kd.embedding <=> query_embedding)) +
            keyword_weight * ts_rank(to_tsvector('simple', kd.content), plainto_tsquery('simple', query_text))
        ) AS combined_score
    FROM knowledge_documents kd
    WHERE
        (filter_source IS NULL OR kd.source = filter_source)
        AND (filter_symbol IS NULL OR kd.symbol = filter_symbol)
    ORDER BY combined_score DESC
    LIMIT match_count;
END;
$$;

-- AI Chat history for context
CREATE TABLE ai_chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,

    -- Metadata
    query_type TEXT,  -- 'stock_analysis', 'market_overview', etc.
    symbols_mentioned TEXT[],
    sources_used TEXT[],
    tokens_used INTEGER,
    response_time_ms INTEGER,

    -- Feedback
    feedback TEXT CHECK (feedback IN ('positive', 'negative')),
    feedback_comment TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_sessions_user ON ai_chat_sessions (user_id, created_at DESC);
CREATE INDEX idx_chat_messages_session ON ai_chat_messages (session_id, created_at);

-- Daily AI Briefing cache
CREATE TABLE ai_daily_briefings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    briefing_date DATE NOT NULL UNIQUE,
    content JSONB NOT NULL,
    -- Structure: { market_summary, top_movers, sector_analysis, key_events, outlook }
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_briefing_date ON ai_daily_briefings (briefing_date DESC);

-- Track AI usage for rate limiting
CREATE TABLE ai_usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    usage_date DATE DEFAULT CURRENT_DATE,
    query_count INTEGER DEFAULT 0,
    tokens_used INTEGER DEFAULT 0,
    UNIQUE(user_id, usage_date)
);

CREATE INDEX idx_ai_usage_user_date ON ai_usage_tracking (user_id, usage_date);

-- Function to check and increment usage
CREATE OR REPLACE FUNCTION check_ai_usage(
    p_user_id UUID,
    p_is_premium BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER;
    v_limit INTEGER;
BEGIN
    -- Set limit based on subscription
    v_limit := CASE WHEN p_is_premium THEN 1000 ELSE 10 END;

    -- Get or create today's usage
    INSERT INTO ai_usage_tracking (user_id, usage_date, query_count)
    VALUES (p_user_id, CURRENT_DATE, 0)
    ON CONFLICT (user_id, usage_date) DO NOTHING;

    -- Check current count
    SELECT query_count INTO v_count
    FROM ai_usage_tracking
    WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;

    -- Return whether under limit
    RETURN v_count < v_limit;
END;
$$;

-- RLS Policies
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_tracking ENABLE ROW LEVEL SECURITY;

-- Knowledge documents are public read
CREATE POLICY "Knowledge documents are viewable by all" ON knowledge_documents
    FOR SELECT USING (true);

-- Chat sessions belong to users
CREATE POLICY "Users can view own chat sessions" ON ai_chat_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat sessions" ON ai_chat_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat sessions" ON ai_chat_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Chat messages belong to session owners
CREATE POLICY "Users can view messages in own sessions" ON ai_chat_messages
    FOR SELECT USING (
        session_id IN (SELECT id FROM ai_chat_sessions WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can create messages in own sessions" ON ai_chat_messages
    FOR INSERT WITH CHECK (
        session_id IN (SELECT id FROM ai_chat_sessions WHERE user_id = auth.uid())
    );

-- Usage tracking
CREATE POLICY "Users can view own usage" ON ai_usage_tracking
    FOR SELECT USING (auth.uid() = user_id);
-- SmartTrade AI - Analytics Schema
-- Migration: 004_analytics

-- ============================================
-- ANALYTICS TABLES
-- ============================================

-- Page views tracking
CREATE TABLE public.analytics_pageviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    session_id TEXT NOT NULL,
    page_path TEXT NOT NULL,
    page_title TEXT,
    referrer TEXT,
    user_agent TEXT,
    device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
    country TEXT,
    city TEXT,
    duration_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User events tracking
CREATE TABLE public.analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    session_id TEXT NOT NULL,
    event_name TEXT NOT NULL,
    event_category TEXT CHECK (event_category IN ('trading', 'ai', 'navigation', 'engagement', 'conversion')),
    event_properties JSONB DEFAULT '{}',
    page_path TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily aggregated metrics
CREATE TABLE public.analytics_daily_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_date DATE NOT NULL,

    -- User metrics
    total_users INTEGER DEFAULT 0,
    new_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    returning_users INTEGER DEFAULT 0,

    -- Session metrics
    total_sessions INTEGER DEFAULT 0,
    avg_session_duration INTEGER DEFAULT 0,
    bounce_rate DECIMAL(5,2) DEFAULT 0,

    -- Revenue metrics
    new_subscriptions INTEGER DEFAULT 0,
    churned_subscriptions INTEGER DEFAULT 0,
    revenue_vnd BIGINT DEFAULT 0,

    -- AI metrics
    ai_queries INTEGER DEFAULT 0,
    ai_chat_messages INTEGER DEFAULT 0,
    ai_insights_viewed INTEGER DEFAULT 0,

    -- Trading metrics
    orders_placed INTEGER DEFAULT 0,
    orders_value_vnd BIGINT DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(metric_date)
);

-- Feature usage tracking
CREATE TABLE public.analytics_feature_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usage_date DATE NOT NULL,
    feature_name TEXT NOT NULL,
    usage_count INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    avg_duration_seconds INTEGER DEFAULT 0,

    UNIQUE(usage_date, feature_name)
);

-- Conversion funnel
CREATE TABLE public.analytics_funnel (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funnel_date DATE NOT NULL,

    -- Acquisition
    visitors INTEGER DEFAULT 0,
    signups INTEGER DEFAULT 0,

    -- Activation
    first_trade INTEGER DEFAULT 0,
    first_ai_query INTEGER DEFAULT 0,

    -- Conversion
    free_to_premium INTEGER DEFAULT 0,

    -- Retention
    day1_retention DECIMAL(5,2) DEFAULT 0,
    day7_retention DECIMAL(5,2) DEFAULT 0,
    day30_retention DECIMAL(5,2) DEFAULT 0,

    UNIQUE(funnel_date)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_pageviews_created ON public.analytics_pageviews(created_at DESC);
CREATE INDEX idx_pageviews_user ON public.analytics_pageviews(user_id);
CREATE INDEX idx_pageviews_session ON public.analytics_pageviews(session_id);
CREATE INDEX idx_pageviews_path ON public.analytics_pageviews(page_path);

CREATE INDEX idx_events_created ON public.analytics_events(created_at DESC);
CREATE INDEX idx_events_name ON public.analytics_events(event_name);
CREATE INDEX idx_events_category ON public.analytics_events(event_category);
CREATE INDEX idx_events_user ON public.analytics_events(user_id);
CREATE INDEX idx_events_session ON public.analytics_events(session_id);

CREATE INDEX idx_daily_date ON public.analytics_daily_metrics(metric_date DESC);
CREATE INDEX idx_feature_date ON public.analytics_feature_usage(usage_date DESC);
CREATE INDEX idx_funnel_date ON public.analytics_funnel(funnel_date DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.analytics_pageviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_funnel ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts for tracking (service role can read all)
CREATE POLICY "Allow anonymous pageview inserts" ON public.analytics_pageviews
    FOR INSERT TO PUBLIC WITH CHECK (true);

CREATE POLICY "Allow anonymous event inserts" ON public.analytics_events
    FOR INSERT TO PUBLIC WITH CHECK (true);

-- Admin read policies (using service role or admin role)
CREATE POLICY "Service role can read pageviews" ON public.analytics_pageviews
    FOR SELECT TO service_role USING (true);

CREATE POLICY "Service role can read events" ON public.analytics_events
    FOR SELECT TO service_role USING (true);

CREATE POLICY "Service role can manage daily metrics" ON public.analytics_daily_metrics
    FOR ALL TO service_role USING (true);

CREATE POLICY "Service role can manage feature usage" ON public.analytics_feature_usage
    FOR ALL TO service_role USING (true);

CREATE POLICY "Service role can manage funnel" ON public.analytics_funnel
    FOR ALL TO service_role USING (true);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to aggregate daily metrics
CREATE OR REPLACE FUNCTION public.aggregate_daily_analytics(target_date DATE)
RETURNS void AS $$
DECLARE
    v_total_users INTEGER;
    v_new_users INTEGER;
    v_active_users INTEGER;
    v_total_sessions INTEGER;
    v_ai_queries INTEGER;
    v_orders_placed INTEGER;
BEGIN
    -- Get total users
    SELECT COUNT(*) INTO v_total_users
    FROM public.profiles;

    -- Get new users for the date
    SELECT COUNT(*) INTO v_new_users
    FROM public.profiles
    WHERE created_at::date = target_date;

    -- Get active users (users with pageviews on the date)
    SELECT COUNT(DISTINCT user_id) INTO v_active_users
    FROM public.analytics_pageviews
    WHERE created_at::date = target_date
    AND user_id IS NOT NULL;

    -- Get total sessions
    SELECT COUNT(DISTINCT session_id) INTO v_total_sessions
    FROM public.analytics_pageviews
    WHERE created_at::date = target_date;

    -- Get AI queries
    SELECT COUNT(*) INTO v_ai_queries
    FROM public.ai_queries
    WHERE created_at::date = target_date;

    -- Get orders placed
    SELECT COUNT(*) INTO v_orders_placed
    FROM public.orders
    WHERE placed_at::date = target_date;

    -- Upsert daily metrics
    INSERT INTO public.analytics_daily_metrics (
        metric_date,
        total_users,
        new_users,
        active_users,
        total_sessions,
        ai_queries,
        orders_placed
    ) VALUES (
        target_date,
        v_total_users,
        v_new_users,
        v_active_users,
        v_total_sessions,
        v_ai_queries,
        v_orders_placed
    )
    ON CONFLICT (metric_date) DO UPDATE SET
        total_users = EXCLUDED.total_users,
        new_users = EXCLUDED.new_users,
        active_users = EXCLUDED.active_users,
        total_sessions = EXCLUDED.total_sessions,
        ai_queries = EXCLUDED.ai_queries,
        orders_placed = EXCLUDED.orders_placed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update feature usage
CREATE OR REPLACE FUNCTION public.update_feature_usage(
    p_date DATE,
    p_feature TEXT,
    p_user_id UUID
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.analytics_feature_usage (
        usage_date,
        feature_name,
        usage_count,
        unique_users
    ) VALUES (
        p_date,
        p_feature,
        1,
        1
    )
    ON CONFLICT (usage_date, feature_name) DO UPDATE SET
        usage_count = analytics_feature_usage.usage_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================

-- Enable realtime for pageviews (for admin dashboard)
ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics_pageviews;
ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics_events;
-- SmartTrade AI - Research Agent Schema
-- Migration: 005_research_agent

-- ============================================
-- FINANCIAL REPORTS
-- ============================================

-- Báo cáo tài chính theo quý/năm
CREATE TABLE public.financial_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT NOT NULL REFERENCES public.stocks(symbol) ON DELETE CASCADE,
    report_type TEXT NOT NULL CHECK (report_type IN ('Q1', 'Q2', 'Q3', 'Q4', 'annual')),
    fiscal_year INTEGER NOT NULL,
    fiscal_quarter INTEGER,

    -- Income Statement
    revenue BIGINT,
    gross_profit BIGINT,
    operating_profit BIGINT,
    net_profit BIGINT,
    eps DECIMAL(10,2),

    -- Balance Sheet
    total_assets BIGINT,
    total_liabilities BIGINT,
    total_equity BIGINT,
    cash_and_equivalents BIGINT,
    short_term_debt BIGINT,
    long_term_debt BIGINT,

    -- Cash Flow
    operating_cash_flow BIGINT,
    investing_cash_flow BIGINT,
    financing_cash_flow BIGINT,
    free_cash_flow BIGINT,

    -- Ratios
    gross_margin DECIMAL(5,2),
    operating_margin DECIMAL(5,2),
    net_margin DECIMAL(5,2),
    roe DECIMAL(5,2),
    roa DECIMAL(5,2),
    debt_to_equity DECIMAL(5,2),
    current_ratio DECIMAL(5,2),

    -- Metadata
    source_url TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(symbol, fiscal_year, report_type)
);

-- ============================================
-- STOCK NEWS
-- ============================================

CREATE TABLE public.stock_news (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT NOT NULL REFERENCES public.stocks(symbol) ON DELETE CASCADE,

    title TEXT NOT NULL,
    summary TEXT,
    content TEXT,
    source TEXT NOT NULL,
    source_url TEXT,

    -- AI Analysis
    sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral')),
    sentiment_score DECIMAL(3,2),
    importance TEXT CHECK (importance IN ('high', 'medium', 'low')),
    category TEXT CHECK (category IN ('earnings', 'merger', 'management', 'industry', 'product', 'legal', 'dividend', 'other')),

    -- AI Generated
    ai_summary TEXT,
    ai_impact_analysis TEXT,

    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AI RESEARCH REPORTS
-- ============================================

CREATE TABLE public.ai_research_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT NOT NULL REFERENCES public.stocks(symbol) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    report_type TEXT NOT NULL CHECK (report_type IN ('daily', 'weekly', 'earnings', 'alert')),

    -- AI Generated Content
    executive_summary TEXT,

    -- Financial Analysis
    financial_health_score INTEGER CHECK (financial_health_score >= 0 AND financial_health_score <= 100),
    financial_analysis TEXT,
    financial_highlights JSONB DEFAULT '[]',

    -- Technical Analysis
    technical_score INTEGER CHECK (technical_score >= 0 AND technical_score <= 100),
    technical_analysis TEXT,
    trend TEXT CHECK (trend IN ('uptrend', 'downtrend', 'sideways')),
    support_levels DECIMAL[] DEFAULT '{}',
    resistance_levels DECIMAL[] DEFAULT '{}',

    -- News & Sentiment
    sentiment_score INTEGER CHECK (sentiment_score >= 0 AND sentiment_score <= 100),
    overall_sentiment TEXT CHECK (overall_sentiment IN ('positive', 'negative', 'neutral')),
    news_summary TEXT,
    key_events JSONB DEFAULT '[]',

    -- AI Recommendation
    ai_rating TEXT CHECK (ai_rating IN ('strong_buy', 'buy', 'hold', 'sell', 'strong_sell')),
    confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),

    price_target_low DECIMAL(12,2),
    price_target_mid DECIMAL(12,2),
    price_target_high DECIMAL(12,2),

    risk_factors TEXT[] DEFAULT '{}',
    opportunities TEXT[] DEFAULT '{}',

    -- Comparison
    vs_previous_report JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(symbol, report_date, report_type)
);

-- ============================================
-- WATCHLIST RESEARCH SETTINGS
-- ============================================

ALTER TABLE public.watchlist_items
ADD COLUMN IF NOT EXISTS auto_research BOOLEAN DEFAULT true;

ALTER TABLE public.watchlist_items
ADD COLUMN IF NOT EXISTS alert_on_news BOOLEAN DEFAULT true;

ALTER TABLE public.watchlist_items
ADD COLUMN IF NOT EXISTS alert_on_earnings BOOLEAN DEFAULT true;

ALTER TABLE public.watchlist_items
ADD COLUMN IF NOT EXISTS alert_on_price_target BOOLEAN DEFAULT true;

-- ============================================
-- RESEARCH ALERTS
-- ============================================

CREATE TABLE public.research_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL REFERENCES public.stocks(symbol) ON DELETE CASCADE,

    alert_type TEXT NOT NULL CHECK (alert_type IN ('news', 'earnings', 'technical', 'ai_insight', 'price_target')),
    priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),

    title TEXT NOT NULL,
    summary TEXT,
    full_content TEXT,

    source_type TEXT,
    source_id UUID,

    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_financial_reports_symbol ON public.financial_reports(symbol);
CREATE INDEX idx_financial_reports_year ON public.financial_reports(fiscal_year DESC);
CREATE INDEX idx_stock_news_symbol ON public.stock_news(symbol, published_at DESC);
CREATE INDEX idx_stock_news_sentiment ON public.stock_news(sentiment);
CREATE INDEX idx_stock_news_importance ON public.stock_news(importance);
CREATE INDEX idx_research_reports_symbol ON public.ai_research_reports(symbol, report_date DESC);
CREATE INDEX idx_research_reports_rating ON public.ai_research_reports(ai_rating);
CREATE INDEX idx_research_alerts_user ON public.research_alerts(user_id, created_at DESC);
CREATE INDEX idx_research_alerts_unread ON public.research_alerts(user_id, is_read) WHERE is_read = false;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.financial_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_research_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_alerts ENABLE ROW LEVEL SECURITY;

-- Public read for financial data
CREATE POLICY "Anyone can read financial reports" ON public.financial_reports
    FOR SELECT TO PUBLIC USING (true);

CREATE POLICY "Anyone can read stock news" ON public.stock_news
    FOR SELECT TO PUBLIC USING (true);

CREATE POLICY "Anyone can read research reports" ON public.ai_research_reports
    FOR SELECT TO PUBLIC USING (true);

-- Service role can manage all
CREATE POLICY "Service role can manage financial reports" ON public.financial_reports
    FOR ALL TO service_role USING (true);

CREATE POLICY "Service role can manage stock news" ON public.stock_news
    FOR ALL TO service_role USING (true);

CREATE POLICY "Service role can manage research reports" ON public.ai_research_reports
    FOR ALL TO service_role USING (true);

-- Users can only see their own alerts
CREATE POLICY "Users can view own research alerts" ON public.research_alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own research alerts" ON public.research_alerts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage research alerts" ON public.research_alerts
    FOR ALL TO service_role USING (true);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get latest research report for a symbol
CREATE OR REPLACE FUNCTION public.get_latest_research(p_symbol TEXT)
RETURNS SETOF public.ai_research_reports AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.ai_research_reports
    WHERE symbol = p_symbol
    ORDER BY report_date DESC, created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Get financial metrics comparison (QoQ, YoY)
CREATE OR REPLACE FUNCTION public.get_financial_comparison(
    p_symbol TEXT,
    p_year INTEGER,
    p_quarter TEXT
)
RETURNS TABLE (
    metric TEXT,
    current_value BIGINT,
    prev_quarter_value BIGINT,
    prev_year_value BIGINT,
    qoq_change DECIMAL,
    yoy_change DECIMAL
) AS $$
BEGIN
    -- Implementation for financial comparison
    -- This is a placeholder - full implementation would compare metrics
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Mark alert as read
CREATE OR REPLACE FUNCTION public.mark_alert_read(p_alert_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.research_alerts
    SET is_read = true, read_at = NOW()
    WHERE id = p_alert_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get unread alerts count for user
CREATE OR REPLACE FUNCTION public.get_unread_alerts_count()
RETURNS INTEGER AS $$
DECLARE
    count INTEGER;
BEGIN
    SELECT COUNT(*)::INTEGER INTO count
    FROM public.research_alerts
    WHERE user_id = auth.uid() AND is_read = false;

    RETURN count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Migration: Smart Alerts System
-- Description: Tables for configurable trading alerts with multiple conditions
-- Author: AI Assistant
-- Date: 2024-12-25

-- ============================================
-- Table: smart_alerts (Main alert rules)
-- ============================================
CREATE TABLE IF NOT EXISTS public.smart_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    logic_operator TEXT DEFAULT 'AND' CHECK (logic_operator IN ('AND', 'OR')),
    check_interval TEXT DEFAULT '1m' CHECK (check_interval IN ('1m', '5m', '15m', '1h')),
    notification_channels TEXT[] DEFAULT ARRAY['push', 'in_app'],
    trigger_count INTEGER DEFAULT 0,
    last_triggered_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: smart_alert_conditions
-- ============================================
CREATE TABLE IF NOT EXISTS public.smart_alert_conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id UUID NOT NULL REFERENCES public.smart_alerts(id) ON DELETE CASCADE,
    indicator TEXT NOT NULL CHECK (indicator IN ('price', 'volume', 'rsi', 'macd', 'ma', 'bb', 'change_percent')),
    operator TEXT NOT NULL CHECK (operator IN ('>=', '<=', '=', '>', '<', 'crosses_above', 'crosses_below', 'touches_upper', 'touches_lower')),
    value DECIMAL(18, 4) NOT NULL,
    value_secondary DECIMAL(18, 4),
    timeframe TEXT DEFAULT '1d' CHECK (timeframe IN ('1m', '5m', '15m', '1h', '4h', '1d')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: smart_alert_history (Triggered alerts log)
-- ============================================
CREATE TABLE IF NOT EXISTS public.smart_alert_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id UUID NOT NULL REFERENCES public.smart_alerts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    trigger_data JSONB,
    notification_sent BOOLEAN DEFAULT false,
    notification_channels TEXT[]
);

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_smart_alerts_user_active
    ON public.smart_alerts(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_smart_alerts_symbol
    ON public.smart_alerts(symbol);

CREATE INDEX IF NOT EXISTS idx_smart_alerts_interval
    ON public.smart_alerts(check_interval) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_smart_alert_conditions_alert
    ON public.smart_alert_conditions(alert_id);

CREATE INDEX IF NOT EXISTS idx_smart_alert_history_user
    ON public.smart_alert_history(user_id, triggered_at DESC);

CREATE INDEX IF NOT EXISTS idx_smart_alert_history_alert
    ON public.smart_alert_history(alert_id, triggered_at DESC);

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE public.smart_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_alert_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_alert_history ENABLE ROW LEVEL SECURITY;

-- Policies for smart_alerts
CREATE POLICY "Users can view own alerts"
    ON public.smart_alerts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own alerts"
    ON public.smart_alerts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
    ON public.smart_alerts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts"
    ON public.smart_alerts FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for smart_alert_conditions
CREATE POLICY "Users can view own conditions"
    ON public.smart_alert_conditions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.smart_alerts
            WHERE id = alert_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create own conditions"
    ON public.smart_alert_conditions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.smart_alerts
            WHERE id = alert_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own conditions"
    ON public.smart_alert_conditions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.smart_alerts
            WHERE id = alert_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own conditions"
    ON public.smart_alert_conditions FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.smart_alerts
            WHERE id = alert_id AND user_id = auth.uid()
        )
    );

-- Policies for smart_alert_history
CREATE POLICY "Users can view own history"
    ON public.smart_alert_history FOR SELECT
    USING (auth.uid() = user_id);

-- Service role can insert history (for backend)
CREATE POLICY "Service can insert history"
    ON public.smart_alert_history FOR INSERT
    WITH CHECK (true);

-- ============================================
-- Trigger for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_smart_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_smart_alerts_updated_at
    BEFORE UPDATE ON public.smart_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_smart_alerts_updated_at();

-- ============================================
-- Helper Functions
-- ============================================

-- Function: Get user's alert count (for limit checking)
CREATE OR REPLACE FUNCTION get_user_alert_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.smart_alerts
        WHERE user_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if user can create alert (limit check)
CREATE OR REPLACE FUNCTION can_create_alert(p_user_id UUID, p_is_premium BOOLEAN DEFAULT false)
RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
    max_alerts INTEGER;
BEGIN
    current_count := get_user_alert_count(p_user_id);
    max_alerts := CASE WHEN p_is_premium THEN 9999 ELSE 5 END;
    RETURN current_count < max_alerts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get alerts by interval (for scheduler)
CREATE OR REPLACE FUNCTION get_active_alerts_by_interval(p_interval TEXT)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    name TEXT,
    symbol TEXT,
    logic_operator TEXT,
    notification_channels TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        a.user_id,
        a.name,
        a.symbol,
        a.logic_operator,
        a.notification_channels
    FROM public.smart_alerts a
    WHERE a.is_active = true
      AND a.check_interval = p_interval
      AND (a.expires_at IS NULL OR a.expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Record alert trigger
CREATE OR REPLACE FUNCTION record_alert_trigger(
    p_alert_id UUID,
    p_trigger_data JSONB,
    p_channels TEXT[]
)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_history_id UUID;
BEGIN
    -- Get user_id from alert
    SELECT user_id INTO v_user_id
    FROM public.smart_alerts
    WHERE id = p_alert_id;

    -- Insert history record
    INSERT INTO public.smart_alert_history (
        alert_id, user_id, trigger_data, notification_channels, notification_sent
    ) VALUES (
        p_alert_id, v_user_id, p_trigger_data, p_channels, true
    )
    RETURNING id INTO v_history_id;

    -- Update alert trigger count
    UPDATE public.smart_alerts
    SET trigger_count = trigger_count + 1,
        last_triggered_at = NOW()
    WHERE id = p_alert_id;

    RETURN v_history_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Add notification_settings column if needed
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'notification_settings'
        AND column_name = 'smart_alerts'
    ) THEN
        ALTER TABLE public.notification_settings
        ADD COLUMN smart_alerts BOOLEAN DEFAULT true;
    END IF;
END $$;

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE public.smart_alerts IS 'User-defined trading alerts with multiple conditions';
COMMENT ON TABLE public.smart_alert_conditions IS 'Individual conditions for each smart alert';
COMMENT ON TABLE public.smart_alert_history IS 'Log of triggered alerts';
COMMENT ON COLUMN public.smart_alerts.logic_operator IS 'How conditions are combined: AND (all must match) or OR (any can match)';
COMMENT ON COLUMN public.smart_alerts.check_interval IS 'How often to check: 1m, 5m, 15m, 1h';
COMMENT ON COLUMN public.smart_alert_conditions.indicator IS 'Technical indicator: price, volume, rsi, macd, ma, bb, change_percent';
COMMENT ON COLUMN public.smart_alert_conditions.operator IS 'Comparison: >=, <=, =, >, <, crosses_above, crosses_below';
COMMENT ON COLUMN public.smart_alert_conditions.value_secondary IS 'Secondary value for indicators like MA period';
