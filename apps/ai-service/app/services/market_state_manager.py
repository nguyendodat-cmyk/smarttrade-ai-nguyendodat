"""
Sprint A.2: Market State Manager
Central state storage with rolling window approach.
Stores 1m bars (60 bars = 1h) and daily bars (50 = ~2 months).
Computes snapshots with MA20/MA50/RSI14 on-demand.
"""

import asyncio
import logging
from collections import deque
from typing import Dict, List, Optional, Deque
from datetime import datetime, timedelta

from app.models.insight_models import PriceBar, MarketSnapshot, Timeframe

logger = logging.getLogger(__name__)


class SymbolState:
    """Per-symbol state with rolling windows and session tracking."""

    def __init__(self, symbol: str, max_1m: int = 60, max_daily: int = 50):
        self.symbol = symbol
        self.bars_1m: Deque[PriceBar] = deque(maxlen=max_1m)
        self.bars_daily: Deque[PriceBar] = deque(maxlen=max_daily)
        self.lock = asyncio.Lock()

        # Session tracking
        self.session_date: Optional[str] = None
        self.session_high: float = 0.0
        self.session_low: float = float('inf')
        self.session_volume: int = 0
        self.session_open: float = 0.0

        self.last_updated: Optional[datetime] = None

    def _seen_timestamps_1m(self) -> set:
        return {b.timestamp for b in self.bars_1m}

    def _seen_timestamps_daily(self) -> set:
        return {b.timestamp for b in self.bars_daily}


class MarketStateManager:
    """
    Central state manager for all tracked symbols.
    Thread-safe with per-symbol asyncio.Lock.
    """

    def __init__(
        self,
        rolling_window_1m: int = 60,
        rolling_window_daily: int = 50,
        stale_threshold: int = 300,
    ):
        self.rolling_window_1m = rolling_window_1m
        self.rolling_window_daily = rolling_window_daily
        self.stale_threshold = stale_threshold
        self._states: Dict[str, SymbolState] = {}

    def _get_or_create(self, symbol: str) -> SymbolState:
        if symbol not in self._states:
            self._states[symbol] = SymbolState(
                symbol, self.rolling_window_1m, self.rolling_window_daily
            )
        return self._states[symbol]

    async def update_bars(self, bars: List[PriceBar]):
        """Update state with new bars. Deduplicates by timestamp."""
        for bar in bars:
            state = self._get_or_create(bar.symbol)
            async with state.lock:
                if bar.timeframe == Timeframe.INTRADAY_1M:
                    if bar.timestamp not in state._seen_timestamps_1m():
                        state.bars_1m.append(bar)
                        self._update_session(state, bar)
                elif bar.timeframe == Timeframe.DAILY:
                    if bar.timestamp not in state._seen_timestamps_daily():
                        state.bars_daily.append(bar)
                state.last_updated = datetime.utcnow()

    def _update_session(self, state: SymbolState, bar: PriceBar):
        """Update intraday session high/low/volume."""
        today = bar.timestamp.strftime("%Y-%m-%d")
        if state.session_date != today:
            # New session
            state.session_date = today
            state.session_high = bar.high
            state.session_low = bar.low
            state.session_volume = bar.volume
            state.session_open = bar.open
        else:
            state.session_high = max(state.session_high, bar.high)
            state.session_low = min(state.session_low, bar.low)
            state.session_volume += bar.volume

    async def get_snapshot(self, symbol: str) -> Optional[MarketSnapshot]:
        """Compute snapshot for a symbol."""
        state = self._states.get(symbol.upper() if symbol else symbol)
        if not state:
            return None

        async with state.lock:
            last_bar = state.bars_1m[-1] if state.bars_1m else (
                state.bars_daily[-1] if state.bars_daily else None
            )
            if not last_bar:
                return None

            # Compute prev_close from daily
            prev_close = 0.0
            if len(state.bars_daily) >= 2:
                prev_close = list(state.bars_daily)[-2].close
            elif state.bars_daily:
                prev_close = list(state.bars_daily)[-1].close

            last_price = last_bar.close
            change_pct = ((last_price - prev_close) / prev_close * 100) if prev_close else 0.0

            # Technical indicators from daily bars
            daily_closes = [b.close for b in state.bars_daily]
            ma20 = self._calc_ma(daily_closes, 20)
            ma50 = self._calc_ma(daily_closes, 50)
            rsi14 = self._calc_rsi(daily_closes, 14)

            # Stale detection
            is_stale = False
            if state.last_updated:
                elapsed = (datetime.utcnow() - state.last_updated).total_seconds()
                is_stale = elapsed > self.stale_threshold

            return MarketSnapshot(
                symbol=symbol,
                last_price=last_price,
                open_price=state.session_open,
                high_price=state.session_high,
                low_price=state.session_low if state.session_low != float('inf') else 0.0,
                volume=state.session_volume,
                change_pct=round(change_pct, 2),
                prev_close=prev_close,
                ma20=ma20,
                ma50=ma50,
                rsi14=rsi14,
                last_updated=state.last_updated,
                is_stale=is_stale,
                bar_count_1m=len(state.bars_1m),
                bar_count_daily=len(state.bars_daily),
            )

    async def get_recent_bars(
        self, symbol: str, timeframe: Timeframe, n: int = 20
    ) -> List[PriceBar]:
        """Get most recent n bars for a symbol/timeframe."""
        state = self._states.get(symbol)
        if not state:
            return []

        async with state.lock:
            source = state.bars_1m if timeframe == Timeframe.INTRADAY_1M else state.bars_daily
            bars = list(source)
            return bars[-n:]

    async def get_all_snapshots(self) -> List[MarketSnapshot]:
        """Get snapshots for all tracked symbols."""
        snapshots = []
        for symbol in list(self._states.keys()):
            snap = await self.get_snapshot(symbol)
            if snap:
                snapshots.append(snap)
        return snapshots

    def get_tracked_symbols(self) -> List[str]:
        return list(self._states.keys())

    @staticmethod
    def _calc_ma(closes: List[float], period: int) -> Optional[float]:
        if len(closes) < period:
            return None
        return round(sum(closes[-period:]) / period, 2)

    @staticmethod
    def _calc_rsi(closes: List[float], period: int = 14) -> Optional[float]:
        if len(closes) < period + 1:
            return None
        deltas = [closes[i] - closes[i - 1] for i in range(1, len(closes))]
        recent = deltas[-(period):]
        gains = [d for d in recent if d > 0]
        losses = [-d for d in recent if d < 0]
        avg_gain = sum(gains) / period if gains else 0
        avg_loss = sum(losses) / period if losses else 0
        if avg_loss == 0:
            return 100.0
        rs = avg_gain / avg_loss
        return round(100 - (100 / (1 + rs)), 2)
