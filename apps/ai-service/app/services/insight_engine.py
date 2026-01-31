"""
Sprint A.3: Insight Engine v1
10 deterministic insight detectors (PA/VA/TM).
Async parallel execution with deduplication (5-min window).
"""

import asyncio
import json
import logging
from typing import Callable, Coroutine, Dict, List, Optional, Set, Tuple
from datetime import datetime, timedelta
from pathlib import Path

from app.models.insight_models import (
    InsightEvent, InsightSeverity, MarketSnapshot, PriceBar, Timeframe
)

logger = logging.getLogger(__name__)


class InsightEngine:
    """
    Core insight detection engine.
    Runs 10 detectors in parallel for each symbol.
    Deduplicates insights within a 5-minute window.
    """

    def __init__(
        self,
        dedup_window_seconds: int = 300,
        log_file: Optional[str] = "logs/insights.jsonl",
        enabled: bool = True,
    ):
        self.enabled = enabled
        self.dedup_window = timedelta(seconds=dedup_window_seconds)
        self.log_file = log_file

        # Dedup: (symbol, insight_code) -> last_detected_at
        self._dedup_cache: Dict[Tuple[str, str], datetime] = {}

        # Callbacks
        self._subscribers: List[Callable[[InsightEvent], Coroutine]] = []

        # Stats
        self._stats = {
            "analyses_run": 0,
            "insights_detected": 0,
            "insights_deduplicated": 0,
            "insights_by_code": {},
        }

        # Ensure log dir
        if self.log_file:
            Path(self.log_file).parent.mkdir(parents=True, exist_ok=True)

    def subscribe(self, callback: Callable[[InsightEvent], Coroutine]):
        """Subscribe to insight events."""
        self._subscribers.append(callback)

    async def analyze_symbol(
        self,
        symbol: str,
        snapshot: MarketSnapshot,
        bars_1m: List[PriceBar],
        bars_daily: List[PriceBar],
    ) -> List[InsightEvent]:
        """Run all 10 detectors on a symbol. Returns deduplicated insights."""
        if not self.enabled:
            return []

        self._stats["analyses_run"] += 1

        detectors = [
            self._detect_pa01_strong_bullish,
            self._detect_pa02_upper_wick_rejection,
            self._detect_pa03_gap,
            self._detect_pa04_failed_breakout,
            self._detect_va01_high_volume_breakout,
            self._detect_va02_price_up_vol_down,
            self._detect_va03_volume_climax,
            self._detect_tm02_ma_cross,
            self._detect_tm04_rsi_overbought,
            self._detect_tm05_rsi_oversold,
        ]

        # Run all detectors in parallel
        tasks = [d(symbol, snapshot, bars_1m, bars_daily) for d in detectors]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        insights: List[InsightEvent] = []
        for result in results:
            if isinstance(result, Exception):
                logger.error("Detector error for %s: %s", symbol, result)
                continue
            if result:
                for event in result:
                    if self._dedup_check(event):
                        insights.append(event)
                        self._stats["insights_detected"] += 1
                        code = event.insight_code
                        self._stats["insights_by_code"][code] = (
                            self._stats["insights_by_code"].get(code, 0) + 1
                        )
                        await self._log_insight(event)
                        self._record_to_monitor()
                        await self._notify_subscribers(event)

        return insights

    async def analyze_all_symbols(
        self, state_manager
    ) -> List[InsightEvent]:
        """Analyze all symbols in the state manager."""
        all_insights = []
        for symbol in state_manager.get_tracked_symbols():
            snapshot = await state_manager.get_snapshot(symbol)
            if not snapshot or snapshot.is_stale:
                continue
            bars_1m = await state_manager.get_recent_bars(symbol, Timeframe.INTRADAY_1M, 60)
            bars_daily = await state_manager.get_recent_bars(symbol, Timeframe.DAILY, 50)
            insights = await self.analyze_symbol(symbol, snapshot, bars_1m, bars_daily)
            all_insights.extend(insights)
        return all_insights

    def get_stats(self) -> Dict:
        return dict(self._stats)

    # ============================================
    # Deduplication
    # ============================================

    def _dedup_check(self, event: InsightEvent) -> bool:
        """Returns True if this insight is NOT a duplicate."""
        key = (event.symbol, event.insight_code)
        now = datetime.utcnow()
        last = self._dedup_cache.get(key)
        if last and (now - last) < self.dedup_window:
            self._stats["insights_deduplicated"] += 1
            return False
        self._dedup_cache[key] = now
        return True

    # ============================================
    # Logging & Notification
    # ============================================

    _monitor_error_logged = False

    def _record_to_monitor(self):
        """Record insight to PipelineMonitor rolling counter."""
        try:
            from app.services.pipeline_monitor import get_pipeline_monitor
            get_pipeline_monitor().record_insight()
        except Exception as e:
            if not InsightEngine._monitor_error_logged:
                logger.debug("PipelineMonitor not available for insight recording: %s", e)
                InsightEngine._monitor_error_logged = True

    async def _log_insight(self, event: InsightEvent):
        if self.log_file:
            try:
                with open(self.log_file, "a") as f:
                    f.write(event.model_dump_json() + "\n")
            except Exception as e:
                logger.error("Failed to log insight: %s", e)

    async def _notify_subscribers(self, event: InsightEvent):
        for cb in self._subscribers:
            try:
                await cb(event)
            except Exception as e:
                logger.error("Subscriber error: %s", e)

    # ============================================
    # Detectors: Price Action (PA)
    # ============================================

    async def _detect_pa01_strong_bullish(
        self, symbol: str, snap: MarketSnapshot,
        bars_1m: List[PriceBar], bars_daily: List[PriceBar]
    ) -> List[InsightEvent]:
        """PA01: Strong bullish candle (body >70% of range)."""
        if len(bars_1m) < 5:
            return []
        events = []
        for bar in bars_1m[-5:]:  # Check last 5 bars
            if bar.range == 0:
                continue
            body_pct = bar.body / bar.range
            if bar.is_bullish and body_pct > 0.70:
                change_pct = ((bar.close - bar.open) / bar.open * 100) if bar.open else 0
                severity = InsightSeverity.HIGH if body_pct > 0.85 else InsightSeverity.MEDIUM
                events.append(InsightEvent(
                    insight_code="PA01",
                    symbol=symbol,
                    timeframe=Timeframe.INTRADAY_1M,
                    severity=severity,
                    signals={"body_percent": round(body_pct, 2), "close_change_pct": round(change_pct, 2), "range": bar.range},
                    raw_explanation=f"Strong bullish candle: body {body_pct:.0%} of range, {change_pct:+.1f}% gain",
                ))
                break  # One per analysis
        return events

    async def _detect_pa02_upper_wick_rejection(
        self, symbol: str, snap: MarketSnapshot,
        bars_1m: List[PriceBar], bars_daily: List[PriceBar]
    ) -> List[InsightEvent]:
        """PA02: Long upper wick (rejection >50% of range)."""
        if len(bars_1m) < 5:
            return []
        events = []
        for bar in bars_1m[-5:]:
            if bar.range == 0:
                continue
            wick_pct = bar.upper_wick / bar.range
            if wick_pct > 0.50:
                severity = InsightSeverity.HIGH if wick_pct > 0.65 else InsightSeverity.MEDIUM
                events.append(InsightEvent(
                    insight_code="PA02",
                    symbol=symbol,
                    timeframe=Timeframe.INTRADAY_1M,
                    severity=severity,
                    signals={"upper_wick_percent": round(wick_pct, 2), "high": bar.high, "close": bar.close},
                    raw_explanation=f"Upper wick rejection: {wick_pct:.0%} of range, rejected at {bar.high}",
                ))
                break
        return events

    async def _detect_pa03_gap(
        self, symbol: str, snap: MarketSnapshot,
        bars_1m: List[PriceBar], bars_daily: List[PriceBar]
    ) -> List[InsightEvent]:
        """PA03: Gap up/down (daily, >1% gap)."""
        if len(bars_daily) < 2:
            return []
        today = bars_daily[-1]
        prev = bars_daily[-2]
        gap_pct = ((today.open - prev.close) / prev.close * 100) if prev.close else 0

        if abs(gap_pct) > 1.0:
            direction = "up" if gap_pct > 0 else "down"
            severity = InsightSeverity.HIGH if abs(gap_pct) > 2.0 else InsightSeverity.MEDIUM
            return [InsightEvent(
                insight_code="PA03",
                symbol=symbol,
                timeframe=Timeframe.DAILY,
                severity=severity,
                signals={"gap_percent": round(gap_pct, 2), "prev_close": prev.close, "today_open": today.open},
                raw_explanation=f"Gap {direction}: {gap_pct:+.1f}% (prev close {prev.close} → open {today.open})",
            )]
        return []

    async def _detect_pa04_failed_breakout(
        self, symbol: str, snap: MarketSnapshot,
        bars_1m: List[PriceBar], bars_daily: List[PriceBar]
    ) -> List[InsightEvent]:
        """PA04: Failed breakout (touches 20-day high but closes lower)."""
        if len(bars_daily) < 20:
            return []
        recent_20 = bars_daily[-20:]
        high_20 = max(b.high for b in recent_20[:-1])  # Exclude today
        today = recent_20[-1]

        if today.high >= high_20 and today.close < today.open:
            return [InsightEvent(
                insight_code="PA04",
                symbol=symbol,
                timeframe=Timeframe.DAILY,
                severity=InsightSeverity.MEDIUM,
                signals={"high_20d": high_20, "today_high": today.high, "today_close": today.close},
                raw_explanation=f"Failed breakout: hit 20d high {high_20} but closed at {today.close}",
            )]
        return []

    # ============================================
    # Detectors: Volume Analysis (VA)
    # ============================================

    async def _detect_va01_high_volume_breakout(
        self, symbol: str, snap: MarketSnapshot,
        bars_1m: List[PriceBar], bars_daily: List[PriceBar]
    ) -> List[InsightEvent]:
        """VA01: High volume breakout (>2x avg + price move >0.5%)."""
        if len(bars_daily) < 20:
            return []
        vols = [b.volume for b in bars_daily[-20:]]
        avg_vol = sum(vols[:-1]) / max(len(vols) - 1, 1)
        today = bars_daily[-1]
        vol_ratio = today.volume / avg_vol if avg_vol > 0 else 0
        price_change = ((today.close - today.open) / today.open * 100) if today.open else 0

        if vol_ratio > 2.0 and abs(price_change) > 0.5:
            severity = InsightSeverity.HIGH if vol_ratio > 3.0 else InsightSeverity.MEDIUM
            return [InsightEvent(
                insight_code="VA01",
                symbol=symbol,
                timeframe=Timeframe.DAILY,
                severity=severity,
                signals={"volume_ratio": round(vol_ratio, 2), "price_change_pct": round(price_change, 2), "volume": today.volume},
                raw_explanation=f"High volume breakout: {vol_ratio:.1f}x avg volume, price {price_change:+.1f}%",
            )]
        return []

    async def _detect_va02_price_up_vol_down(
        self, symbol: str, snap: MarketSnapshot,
        bars_1m: List[PriceBar], bars_daily: List[PriceBar]
    ) -> List[InsightEvent]:
        """VA02: Price up but volume down (divergence)."""
        if len(bars_daily) < 20:
            return []
        today = bars_daily[-1]
        vols = [b.volume for b in bars_daily[-20:]]
        avg_vol = sum(vols[:-1]) / max(len(vols) - 1, 1)
        price_change = ((today.close - today.open) / today.open * 100) if today.open else 0
        vol_ratio = today.volume / avg_vol if avg_vol > 0 else 1

        if price_change > 0.8 and vol_ratio < 0.65:
            return [InsightEvent(
                insight_code="VA02",
                symbol=symbol,
                timeframe=Timeframe.DAILY,
                severity=InsightSeverity.MEDIUM,
                signals={"price_change_pct": round(price_change, 2), "volume_ratio": round(vol_ratio, 2)},
                raw_explanation=f"Price up {price_change:+.1f}% but volume only {vol_ratio:.0%} of average",
            )]
        return []

    async def _detect_va03_volume_climax(
        self, symbol: str, snap: MarketSnapshot,
        bars_1m: List[PriceBar], bars_daily: List[PriceBar]
    ) -> List[InsightEvent]:
        """VA03: Volume climax (top 5% of last 20 bars)."""
        if len(bars_daily) < 20:
            return []
        today = bars_daily[-1]
        sorted_vols = sorted(b.volume for b in bars_daily[-20:])
        threshold = sorted_vols[int(len(sorted_vols) * 0.95)] if len(sorted_vols) >= 20 else sorted_vols[-1]

        if today.volume >= threshold:
            return [InsightEvent(
                insight_code="VA03",
                symbol=symbol,
                timeframe=Timeframe.DAILY,
                severity=InsightSeverity.MEDIUM,
                signals={"volume": today.volume, "threshold_95pct": threshold},
                raw_explanation=f"Volume climax: {today.volume:,} (top 5% of 20-day range)",
            )]
        return []

    # ============================================
    # Detectors: Technical/Momentum (TM)
    # ============================================

    async def _detect_tm02_ma_cross(
        self, symbol: str, snap: MarketSnapshot,
        bars_1m: List[PriceBar], bars_daily: List[PriceBar]
    ) -> List[InsightEvent]:
        """TM02: MA20/MA50 cross (golden/death cross)."""
        if not snap.ma20 or not snap.ma50:
            return []
        # Need previous values too
        if len(bars_daily) < 51:
            return []
        prev_closes = [b.close for b in bars_daily]
        prev_ma20 = sum(prev_closes[-21:-1]) / 20
        prev_ma50 = sum(prev_closes[-51:-1]) / 50 if len(prev_closes) >= 51 else None

        if prev_ma50 is None:
            return []

        # Golden cross: MA20 crosses above MA50
        if prev_ma20 <= prev_ma50 and snap.ma20 > snap.ma50:
            return [InsightEvent(
                insight_code="TM02",
                symbol=symbol,
                timeframe=Timeframe.DAILY,
                severity=InsightSeverity.HIGH,
                signals={"ma20": snap.ma20, "ma50": snap.ma50, "cross_type": "golden"},
                raw_explanation=f"Golden cross: MA20 ({snap.ma20:.0f}) crossed above MA50 ({snap.ma50:.0f})",
            )]
        # Death cross: MA20 crosses below MA50
        if prev_ma20 >= prev_ma50 and snap.ma20 < snap.ma50:
            return [InsightEvent(
                insight_code="TM02",
                symbol=symbol,
                timeframe=Timeframe.DAILY,
                severity=InsightSeverity.HIGH,
                signals={"ma20": snap.ma20, "ma50": snap.ma50, "cross_type": "death"},
                raw_explanation=f"Death cross: MA20 ({snap.ma20:.0f}) crossed below MA50 ({snap.ma50:.0f})",
            )]
        return []

    async def _detect_tm04_rsi_overbought(
        self, symbol: str, snap: MarketSnapshot,
        bars_1m: List[PriceBar], bars_daily: List[PriceBar]
    ) -> List[InsightEvent]:
        """TM04: RSI > 70 (overbought)."""
        if snap.rsi14 is None or snap.rsi14 <= 70:
            return []
        severity = InsightSeverity.HIGH if snap.rsi14 > 80 else InsightSeverity.MEDIUM
        return [InsightEvent(
            insight_code="TM04",
            symbol=symbol,
            timeframe=Timeframe.DAILY,
            severity=severity,
            signals={"rsi14": snap.rsi14},
            raw_explanation=f"RSI overbought: {snap.rsi14:.1f} (>70)",
        )]

    async def _detect_tm05_rsi_oversold(
        self, symbol: str, snap: MarketSnapshot,
        bars_1m: List[PriceBar], bars_daily: List[PriceBar]
    ) -> List[InsightEvent]:
        """TM05: RSI < 30 (oversold)."""
        if snap.rsi14 is None or snap.rsi14 >= 30:
            return []
        severity = InsightSeverity.HIGH if snap.rsi14 < 20 else InsightSeverity.MEDIUM
        return [InsightEvent(
            insight_code="TM05",
            symbol=symbol,
            timeframe=Timeframe.DAILY,
            severity=severity,
            signals={"rsi14": snap.rsi14},
            raw_explanation=f"RSI oversold: {snap.rsi14:.1f} (<30)",
        )]
