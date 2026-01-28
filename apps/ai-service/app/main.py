from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.routers import ai_router, hybrid_ai_router, analytics_router, research_router, alerts_router
from app.services.market_state_manager import MarketStateManager
from app.services.insight_engine import InsightEngine
from app.services.alert_evaluator import get_alert_evaluator

logger = logging.getLogger(__name__)

# Global service instances
state_manager = MarketStateManager(
    rolling_window_1m=settings.STATE_ROLLING_WINDOW_1M,
    rolling_window_daily=settings.STATE_ROLLING_WINDOW_DAILY,
    stale_threshold=settings.STATE_STALE_THRESHOLD,
)

insight_engine = InsightEngine(
    dedup_window_seconds=settings.INSIGHT_DEDUP_WINDOW,
    log_file=settings.INSIGHT_LOG_FILE,
    enabled=settings.INSIGHT_ENGINE_ENABLED,
)

alert_evaluator = get_alert_evaluator(
    cooldown_default=settings.ALERT_COOLDOWN_DEFAULT,
    cooldown_high=settings.ALERT_COOLDOWN_HIGH,
    max_per_user_per_day=settings.ALERT_MAX_PER_USER_PER_DAY,
)

# Wire insight engine → alert evaluator
insight_engine.subscribe(alert_evaluator.evaluate)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting %s...", settings.APP_NAME)
    logger.info("Insight Engine enabled: %s", settings.INSIGHT_ENGINE_ENABLED)
    logger.info("Alert Evaluator: cooldown=%ds, max/day=%d",
                 settings.ALERT_COOLDOWN_DEFAULT, settings.ALERT_MAX_PER_USER_PER_DAY)
    yield
    # Shutdown
    logger.info("Shutting down %s...", settings.APP_NAME)


app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered stock analysis and recommendations for Vietnamese market",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(ai_router, prefix=settings.API_V1_PREFIX)
app.include_router(hybrid_ai_router, prefix=settings.API_V1_PREFIX)  # RAG-enhanced AI
app.include_router(analytics_router, prefix=settings.API_V1_PREFIX)  # Analytics
app.include_router(research_router, prefix=settings.API_V1_PREFIX)  # AI Research Agent
app.include_router(alerts_router, prefix=settings.API_V1_PREFIX)  # Smart Alerts


@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
