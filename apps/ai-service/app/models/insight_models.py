"""
Insight Engine Data Models

Models for market insights, state snapshots, and analysis.
"""
from datetime import datetime
from typing import Dict, Any, Optional, List
from enum import Enum
from pydantic import BaseModel, Field


# ========================================
# Enums
# ========================================

class InsightSeverity(str, Enum):
    """Severity level of an insight"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Timeframe(str, Enum):
    """Timeframe for analysis"""
    INTRADAY_1M = "intraday_1m"
    INTRADAY_5M = "intraday_5m"
    DAILY = "daily"
    WEEKLY = "weekly"


# ========================================
# Price Data
# ========================================

class PriceBar(BaseModel):
    """Single OHLCV bar"""
    symbol: str
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int
    timeframe: str = "1m"  # "1m" or "1d"

    @property
    def body(self) -> float:
        """Body size (absolute)"""
        return abs(self.close - self.open)

    @property
    def range(self) -> float:
        """Total range (high - low)"""
        return self.high - self.low

    @property
    def upper_wick(self) -> float:
        """Upper wick size"""
        return self.high - max(self.open, self.close)

    @property
    def lower_wick(self) -> float:
        """Lower wick size"""
        return min(self.open, self.close) - self.low

    @property
    def is_bullish(self) -> bool:
        """Is this a bullish (green) candle"""
        return self.close > self.open

    @property
    def body_percent(self) -> float:
        """Body as percentage of range"""
        if self.range == 0:
            return 0
        return self.body / self.range


# ========================================
# Market State
# ========================================

class MarketSnapshot(BaseModel):
    """
    Snapshot of current market state for a symbol
    Computed from rolling bars and daily data
    """
    symbol: str
    last_price: float
    last_volume: int
    last_updated: datetime

    # Deltas (vs previous bar)
    price_change: float = 0
    price_change_percent: float = 0
    volume_change_percent: float = 0

    # Session stats (intraday)
    session_high: float
    session_low: float
    session_volume: int
    session_start_time: datetime

    # Rolling stats (5-min window from 1m bars)
    avg_price_5m: Optional[float] = None
    avg_volume_5m: Optional[float] = None
    high_5m: Optional[float] = None
    low_5m: Optional[float] = None

    # Daily context (from daily bars)
    prev_close: Optional[float] = None  # Yesterday close
    daily_high: Optional[float] = None
    daily_low: Optional[float] = None
    daily_volume: Optional[int] = None

    # Technical indicators (from daily bars)
    ma20: Optional[float] = None
    ma50: Optional[float] = None
    rsi14: Optional[float] = None

    # Metadata
    stale: bool = False  # True if no update > 5 min
    bars_count_1m: int = 0  # How many 1m bars we have
    bars_count_daily: int = 0  # How many daily bars we have

    class Config:
        json_schema_extra = {
            "example": {
                "symbol": "VIC",
                "last_price": 45500,
                "last_volume": 1000,
                "last_updated": "2024-01-19T09:15:00",
                "price_change": 100,
                "price_change_percent": 0.22,
                "session_high": 45800,
                "session_low": 45200,
                "ma20": 45300,
                "ma50": 45100,
                "rsi14": 65.5
            }
        }


# ========================================
# Insights
# ========================================

class InsightEvent(BaseModel):
    """
    Core output from Insight Engine
    Represents a meaningful market event/pattern detected
    """
    # Identity
    insight_code: str = Field(..., description="Insight code (e.g., PA01, VA02, TM04)")
    symbol: str
    timeframe: Timeframe
    detected_at: datetime

    # Severity & confidence
    severity: InsightSeverity
    confidence: float = Field(1.0, ge=0.0, le=1.0, description="Confidence score (0-1)")

    # Signals (numeric data supporting the insight)
    signals: Dict[str, Any] = Field(
        ...,
        description="Numeric signals that triggered this insight"
    )
    # Examples:
    # PA01: {"body_percent": 0.85, "close_change_pct": 1.2}
    # VA02: {"price_change_pct": 1.2, "volume_ratio": 0.65}
    # TM04: {"rsi": 75.3, "prev_rsi": 68.2}

    # Explanations
    raw_explanation: str = Field(
        ...,
        description="Short English explanation for debug/logging"
    )

    # Context (for AI explain service)
    context: Optional[Dict[str, Any]] = Field(
        None,
        description="Additional context for AI explanation"
    )

    # Metadata
    created_at: datetime = Field(default_factory=datetime.now)

    class Config:
        json_schema_extra = {
            "example": {
                "insight_code": "VA02",
                "symbol": "FPT",
                "timeframe": "intraday_1m",
                "detected_at": "2024-01-19T09:15:00",
                "severity": "medium",
                "confidence": 1.0,
                "signals": {
                    "price_change_pct": 1.2,
                    "volume_ratio": 0.65,
                    "window": "5m"
                },
                "raw_explanation": "Price +1.2% but volume 35% below avg",
                "context": {
                    "avg_volume_5m": 10000,
                    "last_volume": 6500
                }
            }
        }


class InsightEventList(BaseModel):
    """List of insight events with metadata"""
    events: List[InsightEvent]
    total: int
    symbol: Optional[str] = None
    timeframe: Optional[Timeframe] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None


# ========================================
# Alert Models (extends existing)
# ========================================

class AlertConditionInsight(BaseModel):
    """
    Alert condition based on insights
    Extends existing smart_alerts schema
    """
    insight_codes: List[str] = Field(
        ...,
        description="List of insight codes to match (e.g., ['PA01', 'VA01'])"
    )
    min_severity: InsightSeverity = InsightSeverity.MEDIUM
    symbols: Optional[List[str]] = Field(
        None,
        description="Filter by symbols, None = all watchlist"
    )


# ========================================
# Response Models for API
# ========================================

class InsightResponse(BaseModel):
    """API response for insights"""
    success: bool
    data: Optional[InsightEvent] = None
    error: Optional[str] = None


class InsightListResponse(BaseModel):
    """API response for list of insights"""
    success: bool
    data: Optional[InsightEventList] = None
    error: Optional[str] = None


class SnapshotResponse(BaseModel):
    """API response for market snapshot"""
    success: bool
    data: Optional[MarketSnapshot] = None
    error: Optional[str] = None
