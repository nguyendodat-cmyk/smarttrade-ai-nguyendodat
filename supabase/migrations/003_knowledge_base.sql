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
