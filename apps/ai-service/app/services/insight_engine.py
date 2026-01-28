"""
Insight Engine - Market Pattern Detection

Detects 10 deterministic market insights from state snapshots and bars.
Each detector outputs InsightEvent with signals and explanation.

Pattern categories:
- PA (Price Action): PA01-PA04
- VA (Volume Analysis): VA01-VA03
- TM (Technical/Momentum): TM02, TM04-TM05

Architecture:
- Receives MarketSnapshot + recent bars from State Manager
- Runs all detectors in parallel
- Outputs InsightEvent list
- Logs to file/DB for Alert Evaluator
"""

import asyncio
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any, Callable
from pathlib import Path
import json

from app.models.insight_models import (
    InsightEvent,
    InsightSeverity,
    Timeframe,
    MarketSnapshot,
    PriceBar
)
from app.services.market_state_manager import get_state_manager
from app.config import settings

logger = logging.getLogger(__name__)


# ========================================
# Price Action Detectors (PA)
# ========================================

async def detect_pa01_strong_bullish_candle(
    symbol: str,
    snapshot: MarketSnapshot,
    bars_1m: List[PriceBar]
) -> Optional[InsightEvent]:
    """
    PA01: Strong bullish candle

    Detect: Body > 70% of range, bullish close
    Severity: Medium if > 70%, High if > 85%
    """
    if not bars_1m:
        return None

    last_bar = bars_1m[-1]

    # Check if bullish
    if not last_bar.is_bullish:
        return None

    # Check body percentage
    body_pct = last_bar.body_percent
    if body_pct < 0.70:
        return None

    # Calculate price change percentage
    price_change_pct = ((last_bar.close - last_bar.open) / last_bar.open) * 100

    # Determine severity
    severity = InsightSeverity.HIGH if body_pct >= 0.85 else InsightSeverity.MEDIUM

    return InsightEvent(
        insight_code="PA01",
        symbol=symbol,
        timeframe=Timeframe.INTRADAY_1M,
        detected_at=datetime.now(),
        severity=severity,
        confidence=1.0,
        signals={
            "body_percent": round(body_pct, 3),
            "close_change_pct": round(price_change_pct, 2),
            "range": last_bar.range,
            "close": last_bar.close
        },
        raw_explanation=f"Strong bullish candle: body {body_pct*100:.1f}% of range, +{price_change_pct:.2f}% gain",
        context={
            "open": last_bar.open,
            "high": last_bar.high,
            "low": last_bar.low,
            "close": last_bar.close,
            "timestamp": last_bar.timestamp.isoformat()
        }
    )


async def detect_pa02_long_upper_wick(
    symbol: str,
    snapshot: MarketSnapshot,
    bars_1m: List[PriceBar]
) -> Optional[InsightEvent]:
    """
    PA02: Long upper wick (rejection pattern)

    Detect: Upper wick > 50% of range
    Severity: Medium if > 50%, High if > 70%
    """
    if not bars_1m:
        return None

    last_bar = bars_1m[-1]

    if last_bar.range == 0:
        return None

    # Calculate upper wick as percentage of range
    wick_pct = last_bar.upper_wick / last_bar.range

    if wick_pct < 0.50:
        return None

    # Determine severity
    severity = InsightSeverity.HIGH if wick_pct >= 0.70 else InsightSeverity.MEDIUM

    return InsightEvent(
        insight_code="PA02",
        symbol=symbol,
        timeframe=Timeframe.INTRADAY_1M,
        detected_at=datetime.now(),
        severity=severity,
        confidence=1.0,
        signals={
            "wick_percent": round(wick_pct, 3),
            "wick_size": round(last_bar.upper_wick, 2),
            "range": round(last_bar.range, 2),
            "high": last_bar.high,
            "close": last_bar.close
        },
        raw_explanation=f"Long upper wick: {wick_pct*100:.1f}% of range (rejection pattern)",
        context={
            "high": last_bar.high,
            "close_body": max(last_bar.open, last_bar.close),
            "timestamp": last_bar.timestamp.isoformat()
        }
    )


async def detect_pa03_gap_up_down(
    symbol: str,
    snapshot: MarketSnapshot,
    bars_daily: List[PriceBar]
) -> Optional[InsightEvent]:
    """
    PA03: Gap up/down (daily)

    Detect: Today's open > yesterday's high (gap up)
            OR today's open < yesterday's low (gap down)
    Severity: Medium if gap > 1%, High if gap > 2%
    """
    if len(bars_daily) < 2:
        return None

    prev_bar = bars_daily[-2]
    today_bar = bars_daily[-1]

    # Gap up
    if today_bar.open > prev_bar.high:
        gap_size = today_bar.open - prev_bar.high
        gap_pct = (gap_size / prev_bar.high) * 100

        if gap_pct < 1.0:
            return None

        severity = InsightSeverity.HIGH if gap_pct >= 2.0 else InsightSeverity.MEDIUM

        return InsightEvent(
            insight_code="PA03",
            symbol=symbol,
            timeframe=Timeframe.DAILY,
            detected_at=datetime.now(),
            severity=severity,
            confidence=1.0,
            signals={
                "gap_type": "up",
                "gap_size": round(gap_size, 2),
                "gap_percent": round(gap_pct, 2),
                "today_open": today_bar.open,
                "prev_high": prev_bar.high
            },
            raw_explanation=f"Gap up: {gap_pct:.2f}% above yesterday's high",
            context={
                "yesterday_high": prev_bar.high,
                "today_open": today_bar.open,
                "timestamp": today_bar.timestamp.isoformat()
            }
        )

    # Gap down
    elif today_bar.open < prev_bar.low:
        gap_size = prev_bar.low - today_bar.open
        gap_pct = (gap_size / prev_bar.low) * 100

        if gap_pct < 1.0:
            return None

        severity = InsightSeverity.HIGH if gap_pct >= 2.0 else InsightSeverity.MEDIUM

        return InsightEvent(
            insight_code="PA03",
            symbol=symbol,
            timeframe=Timeframe.DAILY,
            detected_at=datetime.now(),
            severity=severity,
            confidence=1.0,
            signals={
                "gap_type": "down",
                "gap_size": round(gap_size, 2),
                "gap_percent": round(gap_pct, 2),
                "today_open": today_bar.open,
                "prev_low": prev_bar.low
            },
            raw_explanation=f"Gap down: {gap_pct:.2f}% below yesterday's low",
            context={
                "yesterday_low": prev_bar.low,
                "today_open": today_bar.open,
                "timestamp": today_bar.timestamp.isoformat()
            }
        )

    return None


async def detect_pa04_failed_breakout(
    symbol: str,
    snapshot: MarketSnapshot,
    bars_daily: List[PriceBar]
) -> Optional[InsightEvent]:
    """
    PA04: Failed breakout (touched N-day high but closed below)

    Detect: Today's high >= N-day high BUT close < N-day high - threshold
    Uses N=20 days, threshold = 1%
    Severity: Medium
    """
    N_DAYS = 20
    THRESHOLD_PCT = 0.01

    if len(bars_daily) < N_DAYS + 1:
        return None

    # Get last N days (excluding today)
    prev_n_bars = bars_daily[-(N_DAYS+1):-1]
    today_bar = bars_daily[-1]

    # Find N-day high
    n_day_high = max(bar.high for bar in prev_n_bars)

    # Check if touched or exceeded N-day high
    if today_bar.high < n_day_high:
        return None

    # Check if closed below threshold
    threshold = n_day_high * (1 - THRESHOLD_PCT)
    if today_bar.close >= threshold:
        return None

    # Calculate rejection amount
    rejection_size = today_bar.high - today_bar.close
    rejection_pct = (rejection_size / today_bar.high) * 100

    return InsightEvent(
        insight_code="PA04",
        symbol=symbol,
        timeframe=Timeframe.DAILY,
        detected_at=datetime.now(),
        severity=InsightSeverity.MEDIUM,
        confidence=1.0,
        signals={
            "n_day_high": round(n_day_high, 2),
            "today_high": round(today_bar.high, 2),
            "today_close": round(today_bar.close, 2),
            "rejection_size": round(rejection_size, 2),
            "rejection_percent": round(rejection_pct, 2),
            "n_days": N_DAYS
        },
        raw_explanation=f"Failed breakout: touched {N_DAYS}-day high but closed {rejection_pct:.2f}% below",
        context={
            "n_day_high": n_day_high,
            "today_high": today_bar.high,
            "today_close": today_bar.close,
            "timestamp": today_bar.timestamp.isoformat()
        }
    )


# ========================================
# Volume Analysis Detectors (VA)
# ========================================

async def detect_va01_high_volume_breakout(
    symbol: str,
    snapshot: MarketSnapshot,
    bars_1m: List[PriceBar]
) -> Optional[InsightEvent]:
    """
    VA01: High volume breakout

    Detect: Volume > 2x average (5-bar window) AND price change > 0.5%
    Severity: Medium if 2-3x avg, High if > 3x avg
    """
    if not bars_1m or len(bars_1m) < 5:
        return None

    last_bar = bars_1m[-1]
    prev_5_bars = bars_1m[-6:-1]  # Previous 5 bars before last

    # Calculate average volume
    avg_volume = sum(bar.volume for bar in prev_5_bars) / len(prev_5_bars)

    if avg_volume == 0:
        return None

    volume_ratio = last_bar.volume / avg_volume

    # Check if volume > 2x average
    if volume_ratio < 2.0:
        return None

    # Check if significant price change
    if len(bars_1m) >= 2:
        prev_close = bars_1m[-2].close
        price_change_pct = abs((last_bar.close - prev_close) / prev_close) * 100
    else:
        price_change_pct = abs((last_bar.close - last_bar.open) / last_bar.open) * 100

    if price_change_pct < 0.5:
        return None

    # Determine severity
    severity = InsightSeverity.HIGH if volume_ratio >= 3.0 else InsightSeverity.MEDIUM

    return InsightEvent(
        insight_code="VA01",
        symbol=symbol,
        timeframe=Timeframe.INTRADAY_1M,
        detected_at=datetime.now(),
        severity=severity,
        confidence=1.0,
        signals={
            "volume_ratio": round(volume_ratio, 2),
            "last_volume": last_bar.volume,
            "avg_volume_5bar": round(avg_volume, 0),
            "price_change_pct": round(price_change_pct, 2)
        },
        raw_explanation=f"High volume breakout: {volume_ratio:.2f}x avg volume, price {price_change_pct:+.2f}%",
        context={
            "avg_volume": avg_volume,
            "last_volume": last_bar.volume,
            "timestamp": last_bar.timestamp.isoformat()
        }
    )


async def detect_va02_price_up_volume_down(
    symbol: str,
    snapshot: MarketSnapshot,
    bars_1m: List[PriceBar]
) -> Optional[InsightEvent]:
    """
    VA02: Price up, volume down (divergence)

    Detect: Price change > +0.8% BUT volume < 0.65x average
    Severity: Medium (potential weakness)
    """
    if not bars_1m or len(bars_1m) < 5:
        return None

    last_bar = bars_1m[-1]
    prev_5_bars = bars_1m[-6:-1]

    # Calculate average volume
    avg_volume = sum(bar.volume for bar in prev_5_bars) / len(prev_5_bars)

    if avg_volume == 0:
        return None

    volume_ratio = last_bar.volume / avg_volume

    # Check if volume significantly below average
    if volume_ratio >= 0.65:
        return None

    # Check if price up significantly
    if len(bars_1m) >= 2:
        prev_close = bars_1m[-2].close
        price_change_pct = ((last_bar.close - prev_close) / prev_close) * 100
    else:
        price_change_pct = ((last_bar.close - last_bar.open) / last_bar.open) * 100

    if price_change_pct < 0.8:
        return None

    return InsightEvent(
        insight_code="VA02",
        symbol=symbol,
        timeframe=Timeframe.INTRADAY_1M,
        detected_at=datetime.now(),
        severity=InsightSeverity.MEDIUM,
        confidence=1.0,
        signals={
            "price_change_pct": round(price_change_pct, 2),
            "volume_ratio": round(volume_ratio, 2),
            "last_volume": last_bar.volume,
            "avg_volume_5bar": round(avg_volume, 0)
        },
        raw_explanation=f"Price +{price_change_pct:.2f}% but volume {volume_ratio*100:.0f}% of avg (divergence)",
        context={
            "avg_volume": avg_volume,
            "last_volume": last_bar.volume,
            "price_change": price_change_pct,
            "timestamp": last_bar.timestamp.isoformat()
        }
    )


async def detect_va03_volume_climax(
    symbol: str,
    snapshot: MarketSnapshot,
    bars_1m: List[PriceBar]
) -> Optional[InsightEvent]:
    """
    VA03: Volume climax (top 20 bars)

    Detect: Current volume in top 5% of last 20 bars
    Severity: Medium
    """
    MIN_BARS = 20

    if len(bars_1m) < MIN_BARS:
        return None

    last_bar = bars_1m[-1]
    last_20_bars = bars_1m[-MIN_BARS:]

    # Sort volumes to find top 5%
    sorted_volumes = sorted([bar.volume for bar in last_20_bars], reverse=True)
    top_5_percent_index = max(0, int(MIN_BARS * 0.05) - 1)  # Top 1 bar for 20 bars
    threshold_volume = sorted_volumes[top_5_percent_index]

    # Check if current volume is in top 5%
    if last_bar.volume < threshold_volume:
        return None

    # Calculate percentile rank
    rank = sorted_volumes.index(last_bar.volume) + 1

    # Average volume for context
    avg_volume = sum(bar.volume for bar in last_20_bars) / MIN_BARS
    volume_ratio = last_bar.volume / avg_volume if avg_volume > 0 else 0

    return InsightEvent(
        insight_code="VA03",
        symbol=symbol,
        timeframe=Timeframe.INTRADAY_1M,
        detected_at=datetime.now(),
        severity=InsightSeverity.MEDIUM,
        confidence=1.0,
        signals={
            "volume": last_bar.volume,
            "volume_rank": rank,
            "total_bars": MIN_BARS,
            "volume_ratio_to_avg": round(volume_ratio, 2),
            "avg_volume": round(avg_volume, 0)
        },
        raw_explanation=f"Volume climax: rank #{rank}/{MIN_BARS} bars ({volume_ratio:.2f}x avg)",
        context={
            "volume": last_bar.volume,
            "avg_volume": avg_volume,
            "timestamp": last_bar.timestamp.isoformat()
        }
    )


# ========================================
# Technical/Momentum Detectors (TM)
# ========================================

async def detect_tm02_ma_cross(
    symbol: str,
    snapshot: MarketSnapshot,
    bars_daily: List[PriceBar]
) -> Optional[InsightEvent]:
    """
    TM02: MA20/MA50 cross (golden/death cross)

    Detect: MA20 crosses above MA50 (golden) or below (death)
    Check last 2 days to detect fresh cross
    Severity: High (significant signal)
    """
    MIN_BARS = 51  # Need 50 for MA50 + 1 for previous

    if len(bars_daily) < MIN_BARS:
        return None

    # We need to check if there was a cross between yesterday and today
    # Calculate MA20 and MA50 for today and yesterday

    def calc_ma(bars: List[PriceBar], period: int) -> float:
        if len(bars) < period:
            return 0
        closes = [bar.close for bar in bars[-period:]]
        return sum(closes) / period

    # Today's MAs
    ma20_today = calc_ma(bars_daily, 20)
    ma50_today = calc_ma(bars_daily, 50)

    # Yesterday's MAs (use bars up to -1)
    bars_yesterday = bars_daily[:-1]
    ma20_yesterday = calc_ma(bars_yesterday, 20)
    ma50_yesterday = calc_ma(bars_yesterday, 50)

    if ma20_today == 0 or ma50_today == 0 or ma20_yesterday == 0 or ma50_yesterday == 0:
        return None

    # Check for golden cross (MA20 crosses above MA50)
    if ma20_yesterday <= ma50_yesterday and ma20_today > ma50_today:
        return InsightEvent(
            insight_code="TM02",
            symbol=symbol,
            timeframe=Timeframe.DAILY,
            detected_at=datetime.now(),
            severity=InsightSeverity.HIGH,
            confidence=1.0,
            signals={
                "cross_type": "golden",
                "ma20": round(ma20_today, 2),
                "ma50": round(ma50_today, 2),
                "ma20_prev": round(ma20_yesterday, 2),
                "ma50_prev": round(ma50_yesterday, 2)
            },
            raw_explanation=f"Golden cross: MA20 ({ma20_today:.2f}) crossed above MA50 ({ma50_today:.2f})",
            context={
                "ma20": ma20_today,
                "ma50": ma50_today,
                "timestamp": bars_daily[-1].timestamp.isoformat()
            }
        )

    # Check for death cross (MA20 crosses below MA50)
    elif ma20_yesterday >= ma50_yesterday and ma20_today < ma50_today:
        return InsightEvent(
            insight_code="TM02",
            symbol=symbol,
            timeframe=Timeframe.DAILY,
            detected_at=datetime.now(),
            severity=InsightSeverity.HIGH,
            confidence=1.0,
            signals={
                "cross_type": "death",
                "ma20": round(ma20_today, 2),
                "ma50": round(ma50_today, 2),
                "ma20_prev": round(ma20_yesterday, 2),
                "ma50_prev": round(ma50_yesterday, 2)
            },
            raw_explanation=f"Death cross: MA20 ({ma20_today:.2f}) crossed below MA50 ({ma50_today:.2f})",
            context={
                "ma20": ma20_today,
                "ma50": ma50_today,
                "timestamp": bars_daily[-1].timestamp.isoformat()
            }
        )

    return None


async def detect_tm04_rsi_overbought(
    symbol: str,
    snapshot: MarketSnapshot,
    bars_daily: List[PriceBar]
) -> Optional[InsightEvent]:
    """
    TM04: RSI overbought

    Detect: RSI14 > 70
    Severity: Medium if 70-80, High if > 80
    """
    if snapshot.rsi14 is None:
        return None

    if snapshot.rsi14 <= 70:
        return None

    # Determine severity
    severity = InsightSeverity.HIGH if snapshot.rsi14 > 80 else InsightSeverity.MEDIUM

    return InsightEvent(
        insight_code="TM04",
        symbol=symbol,
        timeframe=Timeframe.DAILY,
        detected_at=datetime.now(),
        severity=severity,
        confidence=1.0,
        signals={
            "rsi14": round(snapshot.rsi14, 2),
            "threshold": 70,
            "last_price": snapshot.last_price
        },
        raw_explanation=f"RSI overbought: {snapshot.rsi14:.2f} (> 70)",
        context={
            "rsi14": snapshot.rsi14,
            "ma20": snapshot.ma20,
            "ma50": snapshot.ma50
        }
    )


async def detect_tm05_rsi_oversold(
    symbol: str,
    snapshot: MarketSnapshot,
    bars_daily: List[PriceBar]
) -> Optional[InsightEvent]:
    """
    TM05: RSI oversold

    Detect: RSI14 < 30
    Severity: Medium if 20-30, High if < 20
    """
    if snapshot.rsi14 is None:
        return None

    if snapshot.rsi14 >= 30:
        return None

    # Determine severity
    severity = InsightSeverity.HIGH if snapshot.rsi14 < 20 else InsightSeverity.MEDIUM

    return InsightEvent(
        insight_code="TM05",
        symbol=symbol,
        timeframe=Timeframe.DAILY,
        detected_at=datetime.now(),
        severity=severity,
        confidence=1.0,
        signals={
            "rsi14": round(snapshot.rsi14, 2),
            "threshold": 30,
            "last_price": snapshot.last_price
        },
        raw_explanation=f"RSI oversold: {snapshot.rsi14:.2f} (< 30)",
        context={
            "rsi14": snapshot.rsi14,
            "ma20": snapshot.ma20,
            "ma50": snapshot.ma50
        }
    )


# ========================================
# Insight Engine Orchestrator
# ========================================

class InsightEngine:
    """
    Insight Engine - Orchestrates all insight detectors

    Features:
    - Runs all 10 detectors for each symbol update
    - Logs InsightEvents to file/DB
    - Emits events to subscribers (Alert Evaluator)
    - Deduplicates recent insights (same insight within cooldown period)
    """

    # All detector functions
    DETECTORS = [
        detect_pa01_strong_bullish_candle,
        detect_pa02_long_upper_wick,
        detect_pa03_gap_up_down,
        detect_pa04_failed_breakout,
        detect_va01_high_volume_breakout,
        detect_va02_price_up_volume_down,
        detect_va03_volume_climax,
        detect_tm02_ma_cross,
        detect_tm04_rsi_overbought,
        detect_tm05_rsi_oversold,
    ]

    def __init__(
        self,
        on_insight: Optional[Callable[[InsightEvent], None]] = None,
        log_to_file: bool = True,
        log_to_db: bool = False
    ):
        """
        Initialize Insight Engine

        Args:
            on_insight: Callback when insight is detected (for Alert Evaluator)
            log_to_file: Log insights to JSONL file
            log_to_db: Log insights to database (future)
        """
        self.state_manager = get_state_manager()
        self.on_insight = on_insight
        self.log_to_file = log_to_file
        self.log_to_db = log_to_db

        # Statistics
        self.stats = {
            "insights_detected": 0,
            "insights_by_code": {},
            "last_detection_time": None,
            "symbols_analyzed": 0
        }

        # Setup logging file
        if self.log_to_file:
            self.log_file_path = Path(settings.INSIGHT_LOG_FILE)
            self.log_file_path.parent.mkdir(parents=True, exist_ok=True)

        # Recent insights cache for deduplication
        # Key: (symbol, insight_code), Value: timestamp
        self.recent_insights: Dict[tuple, datetime] = {}
        self.dedup_window_seconds = 300  # 5 minutes

        logger.info("✓ Insight Engine initialized")

    async def analyze_symbol(
        self,
        symbol: str,
        snapshot: MarketSnapshot,
        bars_1m: List[PriceBar],
        bars_daily: List[PriceBar]
    ) -> List[InsightEvent]:
        """
        Run all detectors for a symbol

        Args:
            symbol: Stock symbol
            snapshot: Current market snapshot
            bars_1m: Recent 1-minute bars
            bars_daily: Recent daily bars

        Returns:
            List of detected InsightEvents
        """
        insights: List[InsightEvent] = []

        # Run all detectors in parallel
        tasks = [
            detector(symbol, snapshot, bars_1m if detector.__name__.startswith('detect_pa0') or detector.__name__.startswith('detect_va') else bars_daily)
            for detector in self.DETECTORS
        ]

        # Wait for all detectors
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Collect insights (filter out None and exceptions)
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Detector {self.DETECTORS[i].__name__} failed: {result}")
                continue

            if result is not None:
                # Check deduplication
                key = (result.symbol, result.insight_code)
                if key in self.recent_insights:
                    elapsed = (datetime.now() - self.recent_insights[key]).total_seconds()
                    if elapsed < self.dedup_window_seconds:
                        logger.debug(f"Dedupe: skipping {result.insight_code} for {result.symbol} (seen {elapsed:.0f}s ago)")
                        continue

                # New insight
                insights.append(result)
                self.recent_insights[key] = datetime.now()

                # Update stats
                self.stats["insights_detected"] += 1
                if result.insight_code not in self.stats["insights_by_code"]:
                    self.stats["insights_by_code"][result.insight_code] = 0
                self.stats["insights_by_code"][result.insight_code] += 1

        # Log insights
        if insights:
            self.stats["last_detection_time"] = datetime.now()
            await self._log_insights(insights)

            # Emit to subscribers
            if self.on_insight:
                for insight in insights:
                    try:
                        if asyncio.iscoroutinefunction(self.on_insight):
                            await self.on_insight(insight)
                        else:
                            self.on_insight(insight)
                    except Exception as e:
                        logger.error(f"Error calling on_insight callback: {e}")

        return insights

    async def analyze_all_symbols(self) -> List[InsightEvent]:
        """
        Analyze all symbols in State Manager

        Returns:
            List of all detected insights
        """
        all_insights: List[InsightEvent] = []

        # Get all snapshots
        snapshots = await self.state_manager.get_all_snapshots()

        logger.info(f"Analyzing {len(snapshots)} symbols...")

        for snapshot in snapshots:
            try:
                # Get bars
                bars_1m = await self.state_manager.get_recent_bars(snapshot.symbol, "1m", 60)
                bars_daily = await self.state_manager.get_recent_bars(snapshot.symbol, "1d", 50)

                # Analyze
                insights = await self.analyze_symbol(
                    snapshot.symbol,
                    snapshot,
                    bars_1m,
                    bars_daily
                )

                all_insights.extend(insights)
                self.stats["symbols_analyzed"] += 1

            except Exception as e:
                logger.error(f"Error analyzing {snapshot.symbol}: {e}")

        logger.info(f"✓ Analysis complete: {len(all_insights)} insights detected")
        return all_insights

    async def _log_insights(self, insights: List[InsightEvent]):
        """Log insights to file/DB"""

        # Log to file (JSONL)
        if self.log_to_file:
            try:
                with open(self.log_file_path, 'a') as f:
                    for insight in insights:
                        log_entry = {
                            "timestamp": datetime.now().isoformat(),
                            "insight": insight.model_dump(mode='json')
                        }
                        f.write(json.dumps(log_entry) + '\n')
            except Exception as e:
                logger.error(f"Error writing to insight log file: {e}")

        # Log to DB (future implementation)
        if self.log_to_db:
            # TODO: Insert into Supabase insights table
            pass

        # Log summary
        for insight in insights:
            logger.info(
                f"[INSIGHT] {insight.insight_code} | {insight.symbol} | "
                f"{insight.severity.value} | {insight.raw_explanation}"
            )

    def get_stats(self) -> Dict[str, Any]:
        """Get engine statistics"""
        return {
            **self.stats,
            "dedup_cache_size": len(self.recent_insights),
            "last_detection_time": self.stats["last_detection_time"].isoformat() if self.stats["last_detection_time"] else None
        }

    def clear_cache(self):
        """Clear deduplication cache"""
        self.recent_insights.clear()
        logger.info("Insight deduplication cache cleared")


# ========================================
# Singleton Instance
# ========================================

_insight_engine: Optional[InsightEngine] = None


def get_insight_engine() -> InsightEngine:
    """
    Get singleton Insight Engine instance

    Returns:
        InsightEngine: Global insight engine
    """
    global _insight_engine
    if _insight_engine is None:
        _insight_engine = InsightEngine(
            log_to_file=settings.INSIGHT_ENGINE_ENABLED and settings.INSIGHT_LOG_FILE is not None,
            log_to_db=settings.INSIGHT_LOG_TO_DB
        )
    return _insight_engine
