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
