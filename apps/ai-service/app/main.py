from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.routers import ai_router, hybrid_ai_router, analytics_router, research_router, alerts_router, debug_router
from app.services.market_state_manager import MarketStateManager
from app.services.market_polling_service import MarketPollingService
from app.services.ssi_client import SSIClient
from app.services.insight_engine import InsightEngine
from app.services.alert_evaluator import get_alert_evaluator
from app.services.ai_explain_service import get_ai_explain_service
from app.services.pipeline_monitor import get_pipeline_monitor

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

# SSI FastConnect client (None if credentials not configured)
ssi_client = None
if settings.SSI_CONSUMER_ID and settings.SSI_CONSUMER_SECRET:
    ssi_client = SSIClient(
        base_url=settings.SSI_BASE_URL,
        consumer_id=settings.SSI_CONSUMER_ID,
        consumer_secret=settings.SSI_CONSUMER_SECRET,
    )
    logger.info("SSI client configured: base_url=%s", settings.SSI_BASE_URL)
else:
    logger.warning("SSI credentials not set — polling will return empty bars (synthetic/demo only)")

polling_service = MarketPollingService(
    ssi_client=ssi_client,
    interval_default=settings.POLLING_INTERVAL_DEFAULT,
    interval_watchlist=settings.POLLING_INTERVAL_WATCHLIST,
    interval_hot=settings.POLLING_INTERVAL_HOT,
    batch_size=settings.POLLING_BATCH_SIZE,
)

alert_evaluator = get_alert_evaluator(
    cooldown_default=settings.ALERT_COOLDOWN_DEFAULT,
    cooldown_high=settings.ALERT_COOLDOWN_HIGH,
    max_per_user_per_day=settings.ALERT_MAX_PER_USER_PER_DAY,
    warmup_seconds=settings.ALERT_WARMUP_SECONDS,
    cooldown_cache_path=settings.ALERT_COOLDOWN_CACHE_PATH,
)

ai_explain = get_ai_explain_service()  # LLM only used when AI_EXPLAIN_MODE=template_llm + key present

# Wire insight engine → alert evaluator
insight_engine.subscribe(alert_evaluator.evaluate)

# Wire polling → state manager
polling_service.set_on_bars_update(state_manager.update_bars)

# Register all services with Pipeline Monitor for ops visibility
pipeline_monitor = get_pipeline_monitor()
pipeline_monitor.register_services(
    polling_service=polling_service,
    state_manager=state_manager,
    insight_engine=insight_engine,
    alert_evaluator=alert_evaluator,
    ai_explain_service=ai_explain,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    alert_evaluator.restore_cooldowns()
    logger.info("Starting %s...", settings.APP_NAME)
    logger.info("Insight Engine enabled: %s", settings.INSIGHT_ENGINE_ENABLED)
    logger.info("Alert Evaluator: cooldown=%ds, max/day=%d, warmup=%ds",
                 settings.ALERT_COOLDOWN_DEFAULT, settings.ALERT_MAX_PER_USER_PER_DAY,
                 alert_evaluator.warmup_seconds)
    logger.info("Pipeline Monitor registered: polling=%s state=%s insight=%s alert=%s explain=%s",
                 True, True, True, True, True)
    if settings.POLLING_ENABLED:
        await polling_service.start()
        logger.info("Polling Service started: default=%ds watchlist=%ds hot=%ds",
                     settings.POLLING_INTERVAL_DEFAULT, settings.POLLING_INTERVAL_WATCHLIST,
                     settings.POLLING_INTERVAL_HOT)
    yield
    # Shutdown
    logger.info("Shutting down %s...", settings.APP_NAME)
    alert_evaluator.persist_cooldowns()
    await polling_service.stop()
    if ssi_client:
        await ssi_client.close()


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
if settings.DEBUG_ENDPOINTS_ENABLED:
    app.include_router(debug_router, prefix=settings.API_V1_PREFIX)  # Debug (Ops only)


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
