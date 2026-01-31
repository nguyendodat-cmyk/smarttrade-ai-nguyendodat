from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App settings
    APP_NAME: str = "SmartTrade AI Service"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    # CORS - stored as comma-separated string, parsed in main.py
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:5174,http://localhost:3000"

    # AI Providers
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    AI_MODEL: str = "gpt-4o-mini"
    CLAUDE_MODEL: str = "claude-3-opus-20240229"

    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_KEY: str = ""

    # Redis (optional for caching)
    REDIS_URL: str = "redis://localhost:6379"

    # Rate limiting
    RATE_LIMIT_FREE: int = 3  # queries per day for free users
    RATE_LIMIT_PREMIUM: int = 100  # queries per day for premium users

    # SSI FastConnect
    SSI_BASE_URL: str = "https://fc-data.ssi.com.vn"
    SSI_CONSUMER_ID: str = ""
    SSI_CONSUMER_SECRET: str = ""

    # Polling Service (Sprint A.1)
    POLLING_ENABLED: bool = True
    POLLING_INTERVAL_DEFAULT: int = 60
    POLLING_INTERVAL_WATCHLIST: int = 30
    POLLING_INTERVAL_HOT: int = 15
    POLLING_BATCH_SIZE: int = 20

    # State Manager (Sprint A.2)
    STATE_ROLLING_WINDOW_1M: int = 60
    STATE_ROLLING_WINDOW_DAILY: int = 50
    STATE_STALE_THRESHOLD: int = 300

    # Insight Engine (Sprint A.3)
    INSIGHT_ENGINE_ENABLED: bool = True
    INSIGHT_DEDUP_WINDOW: int = 300
    INSIGHT_LOG_FILE: str = "logs/insights.jsonl"

    # Alert Evaluator (Sprint B.1)
    ALERT_COOLDOWN_DEFAULT: int = 300
    ALERT_COOLDOWN_HIGH: int = 600
    ALERT_MAX_PER_USER_PER_DAY: int = 50
    ALERT_WARMUP_SECONDS: int = 180
    ALERT_COOLDOWN_CACHE_PATH: str = "data/cooldown_cache.json"

    # AI Explain (Sprint B.2)
    AI_EXPLAIN_MODE: str = "template_only"  # "template_only" | "template_llm"

    # Debug endpoints (disabled by default for safety)
    DEBUG_ENDPOINTS_ENABLED: bool = False

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

    def get_cors_origins(self) -> list[str]:
        """Parse CORS_ORIGINS string into list."""
        if not self.CORS_ORIGINS:
            return []
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
