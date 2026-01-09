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
