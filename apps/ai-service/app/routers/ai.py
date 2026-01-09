from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime

from app.models import (
    ChatRequest,
    ChatResponse,
    StockInsightRequest,
    StockInsightResponse,
    PortfolioHealthRequest,
    PortfolioHealthResponse,
    DailyBriefingRequest,
    DailyBriefingResponse,
    APIResponse,
)
from app.services import ai_service

router = APIRouter(prefix="/ai", tags=["AI"])


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat with AI assistant about stock market
    """
    try:
        response = await ai_service.chat(
            message=request.message,
            conversation_id=request.conversation_id,
            context=request.context,
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stock-insight", response_model=StockInsightResponse)
async def get_stock_insight(request: StockInsightRequest):
    """
    Get AI-powered insight for a specific stock
    """
    try:
        response = await ai_service.get_stock_insight(
            symbol=request.symbol.upper(),
            include_technicals=request.include_technicals,
            include_fundamentals=request.include_fundamentals,
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/portfolio-health", response_model=PortfolioHealthResponse)
async def get_portfolio_health(request: PortfolioHealthRequest):
    """
    Analyze portfolio health and get recommendations
    """
    try:
        # In production, fetch holdings from database
        holdings = []  # TODO: Get from Supabase

        response = await ai_service.get_portfolio_health(
            user_id=request.user_id,
            holdings=holdings,
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/daily-briefing", response_model=DailyBriefingResponse)
async def get_daily_briefing(request: DailyBriefingRequest):
    """
    Get personalized daily market briefing
    """
    try:
        response = await ai_service.get_daily_briefing(
            user_id=request.user_id,
            watchlist=request.watchlist,
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    return APIResponse(
        success=True,
        message="AI Service is running",
        data={"timestamp": datetime.now().isoformat()},
    )
