# SmartTrade AI - Insight-Driven Architecture (Polling-Based)

## 🎯 Product Vision

**SmartTrade is an AI-powered stock analysis assistant that:**
- Detects meaningful market insights automatically
- Explains insights in Vietnamese with context
- Sends timely alerts based on user preferences
- Is NOT a realtime tick monitor or simple price alert system

---

## 📐 Revised Architecture (Insight-Centric)

```
┌─────────────────────────────────────────────────────────────┐
│           SSI REST API (PHASE 1 - AVAILABLE)                │
│  /market/ohlc/intraday - 1-minute bars                      │
│  /market/ohlc/daily - Daily OHLCV                           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ Poll every 60s (default)
                 │ 30s for watchlist, 15s for hot symbols
                 ▼
┌─────────────────────────────────────────────────────────────┐
│             Market Polling Service                          │
│          (market_polling_service.py)                        │
│  - APScheduler: 60s/30s/15s tiers                           │
│  - Fetch intraday + daily bars                              │
│  - Quota management & throttling                            │
│  - Error handling & backoff                                 │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ New bars (1m intraday + daily)
                 ▼
┌─────────────────────────────────────────────────────────────┐
│           Market State Manager                              │
│         (market_state_manager.py)                           │
│  - Rolling window: 60 bars (1h intraday)                    │
│  - Daily bars: 20-50 bars (for MA/RSI)                      │
│  - Computed metrics: session high/low, avg volume           │
│  - Stale detection: flag if no update > 5min                │
│  - Query: get_recent_bars(), get_snapshot()                 │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ On state update
                 ▼
┌─────────────────────────────────────────────────────────────┐
│          🔥 INSIGHT ENGINE v1 (CORE)                        │
│            (insight_engine.py)                              │
│  Detects 10 deterministic insights:                         │
│  - PA01: Strong bullish candle                              │
│  - PA02: Long upper wick                                    │
│  - PA03: Gap up/down (daily)                                │
│  - PA04: Failed breakout (N-day high)                       │
│  - VA01: High volume breakout                               │
│  - VA02: Price up, volume down (divergence)                 │
│  - VA03: Volume climax (top 20)                             │
│  - TM02: MA20/MA50 cross                                    │
│  - TM04: RSI overbought (>70)                               │
│  - TM05: RSI oversold (<30)                                 │
│                                                             │
│  Output: InsightEvent (code, signals, severity, context)    │
└───────┬─────────────────────────┬───────────────────────────┘
        │                         │
        │ InsightEvents           │ InsightEvents
        ▼                         ▼
┌──────────────────┐   ┌────────────────────────────────────┐
│ Alert Evaluator  │   │   AI Explain Service               │
│ (alert_evaluator │   │   (ai_explain_service.py)          │
│  .py)            │   │   - Receives InsightEvent          │
│  - Match insight │   │   - Templates by insight_code      │
│  - User cond.    │   │   - Vietnamese explanation         │
│  - Cooldown      │   │   - Risk note                      │
│  - Notify        │   │   - Call LLM if needed (optional)  │
└──────────────────┘   └────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────┐
│  Database & Notifications                                    │
│  - insight_events (log all insights)                         │
│  - smart_alerts (user conditions)                            │
│  - smart_alert_history (triggered alerts with explanation)   │
└──────────────────────────────────────────────────────────────┘
```

---

## 🧬 Data Models

### 1. PriceBar (from polling)

```python
class PriceBar(BaseModel):
    """Single OHLCV bar"""
    symbol: str
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int
    timeframe: str  # "1m" or "1d"
```

### 2. MarketSnapshot (computed from state)

```python
class MarketSnapshot(BaseModel):
    """Snapshot of current market state for a symbol"""
    symbol: str
    last_price: float
    last_volume: int
    last_updated: datetime

    # Deltas (vs previous bar)
    price_change: float
    price_change_percent: float
    volume_change_percent: float

    # Session stats (intraday)
    session_high: float
    session_low: float
    session_volume: int
    session_start_time: datetime

    # Rolling stats (5-min window from 1m bars)
    avg_price_5m: float
    avg_volume_5m: float
    high_5m: float
    low_5m: float

    # Daily context (from daily bars)
    prev_close: float  # Yesterday close
    daily_high: float
    daily_low: float
    daily_volume: int

    # Technical (from daily bars, if enough data)
    ma20: Optional[float] = None
    ma50: Optional[float] = None
    rsi14: Optional[float] = None

    # Metadata
    stale: bool = False  # True if no update > 5 min
    bars_count_1m: int = 0  # How many 1m bars we have
    bars_count_daily: int = 0  # How many daily bars we have
```

### 3. InsightEvent (output from Insight Engine)

```python
class InsightSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class InsightEvent(BaseModel):
    """
    Core output from Insight Engine
    Represents a meaningful market event/pattern detected
    """
    # Identity
    insight_code: str  # e.g., "PA01", "VA02", "TM04"
    symbol: str
    timeframe: str  # "intraday_1m" or "daily"
    detected_at: datetime

    # Severity & confidence
    severity: InsightSeverity
    confidence: float = 1.0  # 0.0-1.0, for ML-based insights later

    # Signals (numeric data supporting the insight)
    signals: Dict[str, Any]
    # Examples:
    # PA01: {"body_percent": 0.85, "close_change": 1.2}
    # VA02: {"price_change_pct": 1.2, "volume_ratio": 0.65}
    # TM04: {"rsi": 75.3, "prev_rsi": 68.2}

    # Explanations
    raw_explanation: str  # Short English explanation for debug
    # e.g., "Price rising but volume below rolling average"

    # Context (for AI explain service)
    context: Optional[Dict[str, Any]] = None
    # e.g., {"session_high": 45800, "prev_close": 45000}

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
```

---

## 🔍 Insight Engine v1 - 10 Insights Specification

### Price Action (PA)

#### PA01: Strong Bullish Candle
**Detect:**
- Body > 70% of total range
- Close > Open (green)
- Price change > 0.5%

**Signals:**
```python
{
    "body_percent": 0.85,
    "close_change_pct": 1.2,
    "range": 500
}
```

**Severity:** MEDIUM (>1%), HIGH (>2%)

---

#### PA02: Long Upper Wick (Rejection)
**Detect:**
- Upper wick > 50% of total range
- Body < 30% of range
- High is session high or near

**Signals:**
```python
{
    "upper_wick_percent": 0.65,
    "body_percent": 0.25,
    "near_session_high": true
}
```

**Severity:** MEDIUM

---

#### PA03: Gap Up/Down (Daily)
**Detect:**
- Today's open vs yesterday's close
- Gap > 1% (MEDIUM), > 2% (HIGH)

**Signals:**
```python
{
    "gap_percent": 1.5,
    "gap_type": "up",  # or "down"
    "prev_close": 45000,
    "today_open": 45675
}
```

**Severity:** Based on gap size

---

#### PA04: Failed Breakout
**Detect:**
- Price touched N-day high (N=5, 10, 20)
- But closed below high - threshold (e.g., 0.5%)

**Signals:**
```python
{
    "n_day_high": 46000,
    "high_touched": 45950,
    "close": 45400,
    "close_below_pct": 1.3,
    "n_days": 20
}
```

**Severity:** MEDIUM

---

### Volume Analysis (VA)

#### VA01: High Volume Breakout
**Detect:**
- Volume > 2x avg volume (20-bar)
- Price change > 0.8%
- Direction: up or down

**Signals:**
```python
{
    "volume_ratio": 2.5,  # vs avg
    "price_change_pct": 1.5,
    "direction": "up",
    "avg_volume_20": 10000
}
```

**Severity:** HIGH

---

#### VA02: Price Up, Volume Down (Divergence)
**Detect:**
- Price change > 0.5% (up)
- Volume < 80% avg

**Signals:**
```python
{
    "price_change_pct": 1.2,
    "volume_ratio": 0.65,
    "window": "5m"
}
```

**Severity:** MEDIUM

---

#### VA03: Volume Climax (Top 20)
**Detect:**
- Volume ranks in top 20 bars (rolling 60)
- Associated with sharp price move

**Signals:**
```python
{
    "volume_rank": 3,  # 3rd highest in 60 bars
    "volume": 50000,
    "price_change_pct": 2.1
}
```

**Severity:** HIGH

---

### Technical Momentum (TM)

#### TM02: MA20/MA50 Cross
**Detect:**
- MA20 crosses MA50 (golden/death cross)
- Need at least 50 daily bars

**Signals:**
```python
{
    "cross_type": "golden",  # or "death"
    "ma20": 45500,
    "ma50": 45200,
    "cross_date": "2024-01-19"
}
```

**Severity:** HIGH

---

#### TM04: RSI Overbought
**Detect:**
- RSI > 70
- Need at least 14 daily bars

**Signals:**
```python
{
    "rsi": 75.3,
    "prev_rsi": 68.2,
    "threshold": 70
}
```

**Severity:** MEDIUM (70-80), HIGH (>80)

---

#### TM05: RSI Oversold
**Detect:**
- RSI < 30

**Signals:**
```python
{
    "rsi": 25.7,
    "prev_rsi": 32.1,
    "threshold": 30
}
```

**Severity:** MEDIUM (20-30), HIGH (<20)

---

## 🔄 Data Flow (Step by Step)

### 1. Polling Cycle (every 60s)

```
[09:15:00] Polling Service triggers
  → Fetch intraday bars for ["VIC", "VNM", "HPG", ...]
  → For each symbol:
      SSI API: GET /market/ohlc/intraday?symbol=VIC&from_date=today&to_date=today&page_size=1&ascending=false
      → Returns latest 1m bar
  → Also fetch daily bars periodically (every 10 minutes or on market open)
      SSI API: GET /market/ohlc/daily?symbol=VIC&from_date=20d_ago&to_date=today
```

### 2. State Update

```
[09:15:01] Market State Manager receives bars
  → Update rolling window:
      intraday_bars_1m.append(new_bar)
      if len > 60: deque.popleft()
  → Update daily bars (if new day)
  → Compute snapshot:
      - Last price, volume
      - Deltas vs previous
      - Session high/low
      - 5m rolling avg
      - MA20, MA50, RSI14 (from daily bars)
```

### 3. Insight Detection

```
[09:15:02] Insight Engine evaluates
  → For each insight detector (PA01-TM05):
      detector.detect(symbol, snapshot, recent_bars)
      → If conditions met:
          Create InsightEvent
          Log to insight_events
          Emit to subscribers
```

### 4. Alert Evaluation

```
[09:15:03] Alert Evaluator receives InsightEvents
  → For each event:
      Query user alert conditions (smart_alerts table)
      → Match: insight_code, symbol, severity
      → Check cooldown (last trigger < 5min ago?)
      → If match & not in cooldown:
          Create alert record
          Call AI Explain Service
          Send notification
```

### 5. AI Explanation

```
[09:15:04] AI Explain Service
  → Input: InsightEvent
  → Template lookup by insight_code:
      VA02 → "Giá tăng nhưng khối lượng yếu - cần thận trọng"
  → Fill template with signals
  → Optional: Call LLM for context enrichment
  → Output: Vietnamese explanation + risk note
```

---

## 📊 Sprint Breakdown (Revised)

### Sprint A: Core Foundation (12-15h)

**A.1: Market Polling Service** (3-4h)
- APScheduler integration
- Multi-tier polling (60s/30s/15s)
- Fetch intraday + daily bars
- Quota management
- Error handling

**A.2: Market State Manager** (4-5h)
- Rolling window storage (deque)
- Snapshot computation
- Technical indicators (MA, RSI)
- Stale detection
- Query interface

**A.3: Insight Engine v1** (5-6h)
- 10 insight detectors (PA01-PA04, VA01-VA03, TM02, TM04-TM05)
- InsightEvent creation
- Logging to DB/file
- Emit system

**Deliverables:**
```
apps/ai-service/app/services/
├── market_polling_service.py
├── market_state_manager.py
└── insight_engine.py

apps/ai-service/app/models/
└── insight_models.py
```

---

### Sprint B: Intelligence Layer (6-8h)

**B.1: Alert Evaluator** (3-4h)
- Match insights to user conditions
- Cooldown mechanism
- Alert history logging
- Notification dispatch

**B.2: AI Explain Service** (3-4h)
- Template system by insight_code
- Vietnamese explanation generation
- Risk note logic
- Optional LLM enrichment

**Deliverables:**
```
apps/ai-service/app/services/
├── alert_evaluator.py
└── ai_explain_service.py

apps/ai-service/app/templates/
└── insight_templates.py
```

---

### Sprint C: Polish (3-4h)

**C.1: Documentation**
- Architecture updates
- API documentation
- Insight catalog

**C.2: Testing**
- Unit tests for each insight
- Integration tests
- Test scripts

---

## 🎯 Configuration

### Default Settings (config.py)

```python
# Polling
POLLING_ENABLED: bool = True
POLLING_INTERVAL_DEFAULT: int = 60  # seconds
POLLING_INTERVAL_WATCHLIST: int = 30
POLLING_INTERVAL_HOT: int = 15
POLLING_BATCH_SIZE: int = 20

# State Manager
STATE_ROLLING_WINDOW_1M: int = 60  # bars (1 hour)
STATE_ROLLING_WINDOW_DAILY: int = 50  # bars (2 months)
STATE_STALE_THRESHOLD: int = 300  # seconds (5 min)

# Insight Engine
INSIGHT_ENGINE_ENABLED: bool = True
INSIGHT_LOG_TO_DB: bool = True
INSIGHT_LOG_FILE: str = "logs/insights.jsonl"

# Alert Evaluator
ALERT_COOLDOWN_DEFAULT: int = 300  # 5 minutes
ALERT_COOLDOWN_HIGH_SEVERITY: int = 600  # 10 minutes
ALERT_MAX_PER_USER_PER_DAY: int = 50
```

---

## 📁 File Structure

```
apps/ai-service/app/
├── models/
│   ├── insight_models.py          (NEW) - InsightEvent, MarketSnapshot
│   └── market_models.py           (existing)
├── services/
│   ├── market_polling_service.py  (NEW)
│   ├── market_state_manager.py    (NEW)
│   ├── insight_engine.py          (NEW)
│   ├── alert_evaluator.py         (NEW)
│   ├── ai_explain_service.py      (NEW)
│   ├── ssi_client.py              (existing)
│   └── ssi_token_manager.py       (existing)
├── templates/
│   └── insight_templates.py       (NEW) - Vietnamese templates
└── main.py                        (update lifespan to start polling)

scripts/
├── test_polling.py                (NEW)
├── test_insight_engine.py         (NEW)
└── test_alert_flow.py             (NEW)

docs/
├── INSIGHT_ARCHITECTURE.md        (THIS FILE)
├── INSIGHT_CATALOG.md             (NEW) - Catalog of 10 insights
└── POLLING_ARCHITECTURE.md        (UPDATE)
```

---

## ✅ Success Criteria

### Sprint A Complete When:
- ✅ Polling service runs every 60s and fetches latest bars
- ✅ State manager stores 60 bars (1h) + 50 daily bars
- ✅ Snapshot includes MA20, MA50, RSI14
- ✅ Insight engine detects all 10 insights correctly
- ✅ InsightEvents logged to DB/file

### Sprint B Complete When:
- ✅ Alert evaluator matches insights to user conditions
- ✅ Cooldown prevents spam
- ✅ AI Explain service generates Vietnamese explanations
- ✅ End-to-end: polling → insight → alert → explain

### Sprint C Complete When:
- ✅ Documentation complete
- ✅ Test coverage >80% for insights
- ✅ Test scripts runnable on Windows

---

**Status:** Architecture Revised - Ready for Implementation
**Next:** Sprint A.1 - Market Polling Service
