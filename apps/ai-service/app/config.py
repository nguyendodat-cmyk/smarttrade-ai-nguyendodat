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
