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
