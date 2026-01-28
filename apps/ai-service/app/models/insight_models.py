"""
Insight-Driven Data Models
PriceBar, MarketSnapshot, InsightEvent, and Alert models
for the SmartTrade AI insight pipeline.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


# ============================================
# Enums
# ============================================

class InsightSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

    def __ge__(self, other):
        if not isinstance(other, InsightSeverity):
            return NotImplemented
        order = {self.LOW: 0, self.MEDIUM: 1, self.HIGH: 2, self.CRITICAL: 3}
        return order[self] >= order[other]

    def __gt__(self, other):
        if not isinstance(other, InsightSeverity):
            return NotImplemented
        order = {self.LOW: 0, self.MEDIUM: 1, self.HIGH: 2, self.CRITICAL: 3}
        return order[self] > order[other]

    def __le__(self, other):
        if not isinstance(other, InsightSeverity):
            return NotImplemented
        return not self.__gt__(other)

    def __lt__(self, other):
        if not isinstance(other, InsightSeverity):
            return NotImplemented
        return not self.__ge__(other)


class Timeframe(str, Enum):
    INTRADAY_1M = "intraday_1m"
    DAILY = "daily"


# ============================================
# Price Data Models
# ============================================

class PriceBar(BaseModel):
    symbol: str
    timeframe: Timeframe
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int = 0

    @property
    def range(self) -> float:
        return self.high - self.low

    @property
    def body(self) -> float:
        return abs(self.close - self.open)

    @property
    def is_bullish(self) -> bool:
        return self.close > self.open

    @property
    def upper_wick(self) -> float:
        return self.high - max(self.open, self.close)

    @property
    def lower_wick(self) -> float:
        return min(self.open, self.close) - self.low


class MarketSnapshot(BaseModel):
    symbol: str
    last_price: float = 0.0
    open_price: float = 0.0
    high_price: float = 0.0
    low_price: float = 0.0
    volume: int = 0
    change_pct: float = 0.0
    prev_close: float = 0.0

    # Technical indicators
    ma20: Optional[float] = None
    ma50: Optional[float] = None
    rsi14: Optional[float] = None

    # Meta
    last_updated: Optional[datetime] = None
    is_stale: bool = False
    bar_count_1m: int = 0
    bar_count_daily: int = 0


# ============================================
# Insight Models
# ============================================

class InsightEvent(BaseModel):
    insight_code: str  # e.g. "PA01", "VA01", "TM02"
    symbol: str
    timeframe: Timeframe
    detected_at: datetime = Field(default_factory=datetime.utcnow)
    severity: InsightSeverity
    confidence: float = Field(ge=0.0, le=1.0, default=1.0)
    signals: Dict[str, Any] = Field(default_factory=dict)
    raw_explanation: str = ""
    context: Dict[str, Any] = Field(default_factory=dict)


# ============================================
# Alert Models (Sprint B.1)
# ============================================

class UserAlert(BaseModel):
    """User-defined alert condition from smart_alerts table."""
    id: str
    user_id: str
    name: str
    symbol: str
    insight_codes: Optional[List[str]] = None  # None = match all
    min_severity: Optional[InsightSeverity] = None
    enabled: bool = True
    cooldown_seconds: int = 300  # 5 min default
    created_at: Optional[datetime] = None


class AlertNotification(BaseModel):
    """Notification generated when an insight matches a user alert."""
    id: str = Field(default_factory=lambda: __import__('uuid').uuid4().hex)
    user_id: str
    alert_id: str
    insight_event: InsightEvent
    symbol: str
    insight_code: str
    severity: InsightSeverity
    message: str = ""  # Vietnamese explanation
    sent_at: datetime = Field(default_factory=datetime.utcnow)
    read_at: Optional[datetime] = None
