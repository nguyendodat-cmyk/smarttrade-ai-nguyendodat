from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
from enum import Enum


# Enums
class AIInsightType(str, Enum):
    DAILY_BRIEFING = "daily_briefing"
    STOCK_INSIGHT = "stock_insight"
    PORTFOLIO_HEALTH = "portfolio_health"
    CHAT = "chat"


class Sentiment(str, Enum):
    BULLISH = "bullish"
    BEARISH = "bearish"
    NEUTRAL = "neutral"


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


# Request Models
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    conversation_id: Optional[str] = None
    context: Optional[dict] = None


class StockInsightRequest(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=10)
    include_technicals: bool = True
    include_fundamentals: bool = True
    include_news: bool = True


class PortfolioHealthRequest(BaseModel):
    user_id: str
    include_recommendations: bool = True


class DailyBriefingRequest(BaseModel):
    user_id: str
    watchlist: Optional[list[str]] = None


# Response Models
class MarketHighlight(BaseModel):
    title: str
    description: str
    sentiment: Sentiment
    impact: Literal["high", "medium", "low"]


class StockMovement(BaseModel):
    symbol: str
    name: str
    price: float
    change: float
    change_percent: float
    reason: Optional[str] = None


class AIRecommendation(BaseModel):
    type: Literal["buy", "sell", "hold", "watch"]
    symbol: str
    reason: str
    confidence: float = Field(..., ge=0, le=1)
    target_price: Optional[float] = None
    stop_loss: Optional[float] = None


class DailyBriefingResponse(BaseModel):
    date: datetime
    market_summary: str
    sentiment: Sentiment
    highlights: list[MarketHighlight]
    top_gainers: list[StockMovement]
    top_losers: list[StockMovement]
    watchlist_alerts: list[str]
    recommendations: list[AIRecommendation]


class TechnicalAnalysis(BaseModel):
    trend: Literal["uptrend", "downtrend", "sideways"]
    support: float
    resistance: float
    rsi: float
    macd_signal: Literal["buy", "sell", "neutral"]
    volume_trend: Literal["increasing", "decreasing", "stable"]


class FundamentalAnalysis(BaseModel):
    pe_ratio: Optional[float]
    pb_ratio: Optional[float]
    eps: Optional[float]
    revenue_growth: Optional[float]
    profit_margin: Optional[float]
    debt_to_equity: Optional[float]
    valuation: Literal["undervalued", "fairly_valued", "overvalued"]


class StockInsightResponse(BaseModel):
    symbol: str
    name: str
    analysis: str
    sentiment: Sentiment
    score: float = Field(..., ge=0, le=100)
    risk_level: RiskLevel
    technicals: Optional[TechnicalAnalysis] = None
    fundamentals: Optional[FundamentalAnalysis] = None
    key_points: list[str]
    recommendation: AIRecommendation
    generated_at: datetime


class PortfolioMetric(BaseModel):
    name: str
    value: float
    status: Literal["good", "warning", "danger"]
    description: str


class PortfolioHealthResponse(BaseModel):
    overall_score: float = Field(..., ge=0, le=100)
    risk_level: RiskLevel
    diversification_score: float
    metrics: list[PortfolioMetric]
    concerns: list[str]
    recommendations: list[AIRecommendation]
    generated_at: datetime


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str
    timestamp: datetime


class ChatResponse(BaseModel):
    message: str
    conversation_id: str
    suggested_actions: list[str] = []
    related_stocks: list[str] = []


# API Response wrapper
class APIResponse(BaseModel):
    success: bool = True
    data: Optional[dict] = None
    error: Optional[str] = None
    message: Optional[str] = None
