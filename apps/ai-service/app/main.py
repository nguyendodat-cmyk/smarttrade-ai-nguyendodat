from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.routers import ai_router, hybrid_ai_router, analytics_router, research_router, alerts_router
from app.routers.health import router as health_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print(f"Starting {settings.APP_NAME}...")
    yield
    # Shutdown
    print(f"Shutting down {settings.APP_NAME}...")


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
app.include_router(health_router, prefix=settings.API_V1_PREFIX)  # Health checks
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
