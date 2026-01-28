# Insight Engine

## Overview

The Insight Engine is the core pattern detection system for SmartTrade AI. It analyzes market data from the State Manager and outputs structured `InsightEvent` objects representing meaningful market patterns.

## Architecture

```
Market Polling Service
    ↓
Market State Manager (rolling bars + snapshots)
    ↓
Insight Engine (10 detectors) ← YOU ARE HERE
    ↓
Alert Evaluator (matches insights to user conditions)
    ↓
AI Explain Service (generates Vietnamese explanations)
```

## Features

- **10 Deterministic Detectors**: No AI/ML, pure rule-based pattern detection
- **Three Categories**:
  - PA (Price Action): PA01-PA04
  - VA (Volume Analysis): VA01-VA03
  - TM (Technical/Momentum): TM02, TM04-TM05
- **Deduplication**: Prevents duplicate insights within 5-minute window
- **Logging**: JSONL file output for Alert Evaluator
- **Callbacks**: Subscribe to insights in real-time
- **Thread-safe**: Async/await throughout

## 10 Insights v1

### Price Action (PA)

#### PA01: Strong Bullish Candle
- **Detect**: Body > 70% of range, bullish close
- **Severity**: Medium (>70%), High (>85%)
- **Signals**: `body_percent`, `close_change_pct`, `range`

#### PA02: Long Upper Wick
- **Detect**: Upper wick > 50% of range (rejection pattern)
- **Severity**: Medium (>50%), High (>70%)
- **Signals**: `wick_percent`, `wick_size`, `high`, `close`

#### PA03: Gap Up/Down
- **Detect**: Open > yesterday's high (gap up) OR open < yesterday's low (gap down)
- **Severity**: Medium (>1%), High (>2%)
- **Timeframe**: Daily only
- **Signals**: `gap_type`, `gap_size`, `gap_percent`

#### PA04: Failed Breakout
- **Detect**: Touched N-day high but closed below threshold
- **Parameters**: N=20 days, threshold=1%
- **Severity**: Medium
- **Timeframe**: Daily only
- **Signals**: `n_day_high`, `today_high`, `today_close`, `rejection_percent`

### Volume Analysis (VA)

#### VA01: High Volume Breakout
- **Detect**: Volume > 2x average (5-bar window) AND price change > 0.5%
- **Severity**: Medium (2-3x), High (>3x)
- **Signals**: `volume_ratio`, `last_volume`, `avg_volume_5bar`, `price_change_pct`

#### VA02: Price Up, Volume Down
- **Detect**: Price +0.8%+ BUT volume < 0.65x average (divergence)
- **Severity**: Medium (potential weakness signal)
- **Signals**: `price_change_pct`, `volume_ratio`

#### VA03: Volume Climax
- **Detect**: Current volume in top 5% of last 20 bars
- **Severity**: Medium
- **Signals**: `volume`, `volume_rank`, `volume_ratio_to_avg`

### Technical/Momentum (TM)

#### TM02: MA Cross
- **Detect**: MA20 crosses MA50 (golden cross = bullish, death cross = bearish)
- **Severity**: High (significant signal)
- **Timeframe**: Daily only
- **Signals**: `cross_type`, `ma20`, `ma50`, `ma20_prev`, `ma50_prev`

#### TM04: RSI Overbought
- **Detect**: RSI14 > 70
- **Severity**: Medium (70-80), High (>80)
- **Timeframe**: Daily only
- **Signals**: `rsi14`, `threshold`

#### TM05: RSI Oversold
- **Detect**: RSI14 < 30
- **Severity**: Medium (20-30), High (<20)
- **Timeframe**: Daily only
- **Signals**: `rsi14`, `threshold`

## Usage

### Basic Usage

```python
from app.services.insight_engine import get_insight_engine
from app.services.market_state_manager import get_state_manager

# Get services
engine = get_insight_engine()
state_manager = get_state_manager()

# Analyze a symbol
snapshot = await state_manager.get_snapshot("VIC")
bars_1m = await state_manager.get_recent_bars("VIC", "1m", 60)
bars_daily = await state_manager.get_recent_bars("VIC", "1d", 50)

insights = await engine.analyze_symbol(
    "VIC",
    snapshot,
    bars_1m,
    bars_daily
)

# Process insights
for insight in insights:
    print(f"{insight.insight_code}: {insight.raw_explanation}")
```

### Analyze All Symbols

```python
# Analyze all symbols with data in State Manager
insights = await engine.analyze_all_symbols()
```

### Subscribe to Insights

```python
async def on_insight(insight: InsightEvent):
    print(f"New insight: {insight.insight_code} for {insight.symbol}")
    # Send to Alert Evaluator, etc.

engine = InsightEngine(on_insight=on_insight)
```

### Get Statistics

```python
stats = engine.get_stats()
print(f"Total insights: {stats['insights_detected']}")
print(f"By code: {stats['insights_by_code']}")
```

## InsightEvent Structure

```python
{
    "insight_code": "VA02",
    "symbol": "FPT",
    "timeframe": "intraday_1m",
    "detected_at": "2024-01-19T09:15:00",
    "severity": "medium",
    "confidence": 1.0,
    "signals": {
        "price_change_pct": 1.2,
        "volume_ratio": 0.65,
    },
    "raw_explanation": "Price +1.2% but volume 35% below avg",
    "context": {
        "avg_volume_5m": 10000,
        "last_volume": 6500
    }
}
```

## Configuration

In `.env` or `app/config.py`:

```bash
# Insight Engine
INSIGHT_ENGINE_ENABLED=True
INSIGHT_LOG_TO_DB=True
INSIGHT_LOG_FILE=logs/insights.jsonl
```

## Logging

Insights are logged to `logs/insights.jsonl` in JSONL format:

```json
{"timestamp": "2024-01-19T09:15:00", "insight": {...}}
{"timestamp": "2024-01-19T09:16:00", "insight": {...}}
```

Each line is a complete JSON object that can be parsed independently.

## Testing

Run the test suite:

```bash
# Install dependencies first
cd apps/ai-service
pip install -r requirements.txt

# Run tests
python scripts/test_insight_engine.py
```

The test suite validates all 10 detectors with synthetic data.

## Integration with Polling Service

The Insight Engine is called automatically when new market data arrives:

```python
# In market_polling_service.py callback
async def on_bars_update(bars: List[PriceBar]):
    # Update state
    await state_manager.update_bars(bars)

    # Analyze for insights
    for bar in bars:
        snapshot = await state_manager.get_snapshot(bar.symbol)
        bars_1m = await state_manager.get_recent_bars(bar.symbol, "1m", 60)
        bars_daily = await state_manager.get_recent_bars(bar.symbol, "1d", 50)

        insights = await engine.analyze_symbol(
            bar.symbol,
            snapshot,
            bars_1m,
            bars_daily
        )
```

## Deduplication

The engine automatically deduplicates insights:
- **Window**: 5 minutes (300 seconds)
- **Key**: `(symbol, insight_code)`
- **Behavior**: Same insight for same symbol within window is skipped

Clear cache manually:
```python
engine.clear_cache()
```

## Performance

- **Detector execution**: Parallel async/await
- **Per-symbol analysis**: ~10ms (all 10 detectors)
- **100 symbols**: ~1 second
- **Memory**: Minimal (dedup cache only stores timestamps)

## Future Enhancements (v2)

- Machine learning detectors (sentiment, pattern recognition)
- Custom user-defined insights
- Backtesting framework
- Real-time streaming integration (when SSI IDS available)
- Insight correlation analysis
- Probability scoring (vs deterministic)

## Dependencies

- `pydantic`: Data validation
- `asyncio`: Async/await
- Standard library: `logging`, `json`, `datetime`, `collections`

## See Also

- `docs/INSIGHT_ARCHITECTURE.md` - Complete architecture specification
- `apps/ai-service/app/models/insight_models.py` - Data models
- `apps/ai-service/app/services/market_state_manager.py` - Data source
- `scripts/test_insight_engine.py` - Test suite
