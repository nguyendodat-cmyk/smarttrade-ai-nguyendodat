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

    # SSI FastConnect
    SSI_CONSUMER_ID: str = ""
    SSI_CONSUMER_SECRET: str = ""
    SSI_BASE_URL: str = "https://fc-data.ssi.com.vn"
    SSI_STREAMING_URL: str = "wss://fc-tradingapi.ssi.com.vn/realtime"

    # SSI IDS Streaming (optional, for PHASE 2)
    SSI_PUBLIC_KEY: str = ""
    SSI_PRIVATE_KEY: str = ""

    # Rate limiting
    RATE_LIMIT_FREE: int = 3  # queries per day for free users
    RATE_LIMIT_PREMIUM: int = 100  # queries per day for premium users

    # Market Polling (Insight Engine)
    POLLING_ENABLED: bool = True
    POLLING_INTERVAL_DEFAULT: int = 60  # seconds - default tier
    POLLING_INTERVAL_WATCHLIST: int = 30  # seconds - watchlist tier
    POLLING_INTERVAL_HOT: int = 15  # seconds - hot symbols (explicit user watch)
    POLLING_BATCH_SIZE: int = 20  # symbols per batch
    POLLING_MAX_SYMBOLS: int = 100  # max total symbols to poll

    # Market State Manager
    STATE_ROLLING_WINDOW_1M: int = 60  # bars (1 hour of 1-min data)
    STATE_ROLLING_WINDOW_DAILY: int = 50  # bars (2 months of daily data)
    STATE_STALE_THRESHOLD: int = 300  # seconds (5 min) - mark data as stale

    # Insight Engine
    INSIGHT_ENGINE_ENABLED: bool = True
    INSIGHT_LOG_TO_DB: bool = True
    INSIGHT_LOG_FILE: str = "logs/insights.jsonl"

    # Alert Evaluator
    ALERT_COOLDOWN_DEFAULT: int = 300  # 5 minutes between same alerts
    ALERT_COOLDOWN_HIGH_SEVERITY: int = 600  # 10 minutes for high severity
    ALERT_MAX_PER_USER_PER_DAY: int = 50  # spam protection

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Allow extra fields in .env without crashing

    def get_cors_origins(self) -> list[str]:
        """Parse CORS_ORIGINS string into list."""
        if not self.CORS_ORIGINS:
            return []
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
