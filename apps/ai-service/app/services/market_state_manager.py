"""
Market State Manager - In-memory state storage with rolling bars

Manages market state for symbols with:
- Rolling windows (60x 1m bars, 50 daily bars)
- Computed snapshots (deltas, session stats, technical indicators)
- Deduplication by (symbol, timeframe, timestamp)
- Stale detection
- Thread-safe operations

Contract:
- Input: PriceBar from polling service
- Output: MarketSnapshot + recent bars for Insight Engine
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from collections import deque

from app.config import settings
from app.models.insight_models import PriceBar, MarketSnapshot

logger = logging.getLogger(__name__)


class SymbolState:
    """State storage for a single symbol"""

    def __init__(self, symbol: str):
        self.symbol = symbol
        self.lock = asyncio.Lock()

        # Rolling bars storage
        self.bars_1m: deque[PriceBar] = deque(maxlen=settings.STATE_ROLLING_WINDOW_1M)
        self.bars_daily: deque[PriceBar] = deque(maxlen=settings.STATE_ROLLING_WINDOW_DAILY)

        # Last update timestamps (for stale detection)
        self.last_update_1m: Optional[datetime] = None
        self.last_update_daily: Optional[datetime] = None

        # Session tracking (reset daily)
        self.session_high: Optional[float] = None
        self.session_low: Optional[float] = None
        self.session_volume: int = 0
        self.session_start_time: Optional[datetime] = None

        # Cache
        self._snapshot_cache: Optional[MarketSnapshot] = None
        self._snapshot_cache_time: Optional[datetime] = None

    def is_stale(self, timeframe: str = "1m") -> bool:
        """Check if data is stale (no updates > threshold)"""
        last_update = self.last_update_1m if timeframe == "1m" else self.last_update_daily
        if not last_update:
            return True

        elapsed = (datetime.now() - last_update).total_seconds()
        return elapsed > settings.STATE_STALE_THRESHOLD

    def should_reset_session(self, bar_time: datetime) -> bool:
        """Check if session should reset (new trading day)"""
        if not self.session_start_time:
            return True

        # Reset if bar is from a different day
        return bar_time.date() != self.session_start_time.date()


class MarketStateManager:
    """
    In-memory state manager for market data

    Features:
    - Rolling window storage (1m bars + daily bars)
    - Deduplication by (symbol, timeframe, timestamp)
    - Computed snapshots with deltas & technical indicators
    - Stale detection
    - Thread-safe per-symbol locking
    """

    def __init__(self):
        self.states: Dict[str, SymbolState] = {}
        self.global_lock = asyncio.Lock()

    async def _get_or_create_state(self, symbol: str) -> SymbolState:
        """Get or create state for a symbol (thread-safe)"""
        symbol = symbol.upper()

        if symbol not in self.states:
            async with self.global_lock:
                # Double-check after acquiring lock
                if symbol not in self.states:
                    self.states[symbol] = SymbolState(symbol)
                    logger.debug(f"Created state for {symbol}")

        return self.states[symbol]

    async def update_bars(self, bars: List[PriceBar]):
        """
        Update state with new bars (from polling service)

        Args:
            bars: List of PriceBars (can be mixed timeframes)

        Features:
        - Deduplication by (symbol, timeframe, timestamp)
        - Idempotent updates (safe to send same bar multiple times)
        """
        if not bars:
            return

        # Group bars by symbol and timeframe
        grouped: Dict[Tuple[str, str], List[PriceBar]] = {}
        for bar in bars:
            key = (bar.symbol.upper(), bar.timeframe)
            if key not in grouped:
                grouped[key] = []
            grouped[key].append(bar)

        # Update each symbol
        for (symbol, timeframe), symbol_bars in grouped.items():
            state = await self._get_or_create_state(symbol)
            async with state.lock:
                await self._update_symbol_bars(state, symbol_bars, timeframe)

    async def _update_symbol_bars(
        self,
        state: SymbolState,
        bars: List[PriceBar],
        timeframe: str
    ):
        """
        Update bars for a symbol (called within lock)

        Handles:
        - Deduplication
        - Session reset
        - Rolling window updates
        """
        # Sort bars by timestamp
        bars = sorted(bars, key=lambda b: b.timestamp)

        # Select target deque
        if timeframe == "1m":
            target_deque = state.bars_1m
            last_update_attr = "last_update_1m"
        elif timeframe == "1d":
            target_deque = state.bars_daily
            last_update_attr = "last_update_daily"
        else:
            logger.warning(f"Unknown timeframe: {timeframe}")
            return

        for bar in bars:
            # Dedupe: skip if already have this exact timestamp
            if target_deque and target_deque[-1].timestamp == bar.timestamp:
                logger.debug(f"Dedupe: skipping duplicate bar {bar.symbol} @ {bar.timestamp}")
                continue

            # Session reset (for 1m bars)
            if timeframe == "1m" and state.should_reset_session(bar.timestamp):
                logger.info(f"Resetting session for {bar.symbol} (new day: {bar.timestamp.date()})")
                state.session_high = bar.high
                state.session_low = bar.low
                state.session_volume = bar.volume
                state.session_start_time = bar.timestamp
            elif timeframe == "1m":
                # Update session stats
                if state.session_high is None or bar.high > state.session_high:
                    state.session_high = bar.high
                if state.session_low is None or bar.low < state.session_low:
                    state.session_low = bar.low
                state.session_volume += bar.volume

            # Add to deque (auto-evicts oldest if maxlen reached)
            target_deque.append(bar)
            setattr(state, last_update_attr, datetime.now())

        # Invalidate snapshot cache
        state._snapshot_cache = None

    def _compute_ma(self, bars: List[PriceBar], period: int) -> Optional[float]:
        """Compute simple moving average"""
        if len(bars) < period:
            return None

        closes = [bar.close for bar in bars[-period:]]
        return sum(closes) / period

    def _compute_rsi(self, bars: List[PriceBar], period: int = 14) -> Optional[float]:
        """
        Compute RSI (Relative Strength Index)

        Args:
            bars: Daily bars (need at least period+1)
            period: RSI period (default 14)

        Returns:
            RSI value (0-100) or None if not enough data
        """
        if len(bars) < period + 1:
            return None

        # Calculate price changes
        changes = []
        for i in range(1, len(bars)):
            change = bars[i].close - bars[i - 1].close
            changes.append(change)

        # Separate gains and losses
        recent_changes = changes[-(period):]
        gains = [c if c > 0 else 0 for c in recent_changes]
        losses = [abs(c) if c < 0 else 0 for c in recent_changes]

        # Average gain and loss
        avg_gain = sum(gains) / period
        avg_loss = sum(losses) / period

        if avg_loss == 0:
            return 100.0  # No losses = max RSI

        # RSI calculation
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))

        return round(rsi, 2)

    def _compute_n_day_high(self, bars: List[PriceBar], n: int) -> Optional[float]:
        """Compute N-day high"""
        if len(bars) < n:
            return None
        return max(bar.high for bar in bars[-n:])

    def _compute_n_day_low(self, bars: List[PriceBar], n: int) -> Optional[float]:
        """Compute N-day low"""
        if len(bars) < n:
            return None
        return min(bar.low for bar in bars[-n:])

    async def get_snapshot(self, symbol: str) -> Optional[MarketSnapshot]:
        """
        Get computed snapshot for a symbol

        Returns:
            MarketSnapshot with all computed metrics or None if no data
        """
        symbol = symbol.upper()
        if symbol not in self.states:
            return None

        state = self.states[symbol]
        async with state.lock:
            return self._compute_snapshot(state)

    def _compute_snapshot(self, state: SymbolState) -> Optional[MarketSnapshot]:
        """
        Compute snapshot from state (called within lock)

        Returns:
            MarketSnapshot or None if not enough data
        """
        # Need at least 1 bar
        if not state.bars_1m:
            return None

        # Latest bar
        latest_bar = state.bars_1m[-1]

        # Deltas (vs previous bar)
        price_change = 0.0
        price_change_percent = 0.0
        volume_change_percent = 0.0

        if len(state.bars_1m) >= 2:
            prev_bar = state.bars_1m[-2]
            price_change = latest_bar.close - prev_bar.close
            if prev_bar.close > 0:
                price_change_percent = (price_change / prev_bar.close) * 100
            if prev_bar.volume > 0:
                volume_change_percent = ((latest_bar.volume - prev_bar.volume) / prev_bar.volume) * 100

        # Rolling 5-min stats (last 5 bars)
        window_5m = list(state.bars_1m)[-5:]
        avg_price_5m = None
        avg_volume_5m = None
        high_5m = None
        low_5m = None

        if window_5m:
            avg_price_5m = sum(b.close for b in window_5m) / len(window_5m)
            avg_volume_5m = sum(b.volume for b in window_5m) / len(window_5m)
            high_5m = max(b.high for b in window_5m)
            low_5m = min(b.low for b in window_5m)

        # Daily context
        prev_close = None
        daily_high = None
        daily_low = None
        daily_volume = None

        if state.bars_daily:
            latest_daily = state.bars_daily[-1]
            daily_high = latest_daily.high
            daily_low = latest_daily.low
            daily_volume = latest_daily.volume

            if len(state.bars_daily) >= 2:
                prev_close = state.bars_daily[-2].close

        # Technical indicators (from daily bars)
        ma20 = self._compute_ma(list(state.bars_daily), 20)
        ma50 = self._compute_ma(list(state.bars_daily), 50)
        rsi14 = self._compute_rsi(list(state.bars_daily), 14)

        # Build snapshot
        snapshot = MarketSnapshot(
            symbol=state.symbol,
            last_price=latest_bar.close,
            last_volume=latest_bar.volume,
            last_updated=latest_bar.timestamp,
            price_change=price_change,
            price_change_percent=round(price_change_percent, 2),
            volume_change_percent=round(volume_change_percent, 2),
            session_high=state.session_high or latest_bar.high,
            session_low=state.session_low or latest_bar.low,
            session_volume=state.session_volume or latest_bar.volume,
            session_start_time=state.session_start_time or latest_bar.timestamp,
            avg_price_5m=round(avg_price_5m, 2) if avg_price_5m else None,
            avg_volume_5m=round(avg_volume_5m, 2) if avg_volume_5m else None,
            high_5m=high_5m,
            low_5m=low_5m,
            prev_close=prev_close,
            daily_high=daily_high,
            daily_low=daily_low,
            daily_volume=daily_volume,
            ma20=round(ma20, 2) if ma20 else None,
            ma50=round(ma50, 2) if ma50 else None,
            rsi14=rsi14,
            stale=state.is_stale("1m"),
            bars_count_1m=len(state.bars_1m),
            bars_count_daily=len(state.bars_daily)
        )

        # Cache snapshot
        state._snapshot_cache = snapshot
        state._snapshot_cache_time = datetime.now()

        return snapshot

    async def get_recent_bars(
        self,
        symbol: str,
        timeframe: str = "1m",
        n: int = 60
    ) -> List[PriceBar]:
        """
        Get recent N bars for a symbol

        Args:
            symbol: Stock symbol
            timeframe: "1m" or "1d"
            n: Number of bars to return (from most recent)

        Returns:
            List of PriceBars (oldest to newest)
        """
        symbol = symbol.upper()
        if symbol not in self.states:
            return []

        state = self.states[symbol]
        async with state.lock:
            if timeframe == "1m":
                bars = list(state.bars_1m)[-n:]
            elif timeframe == "1d":
                bars = list(state.bars_daily)[-n:]
            else:
                logger.warning(f"Unknown timeframe: {timeframe}")
                return []

            return bars

    async def get_all_snapshots(self) -> List[MarketSnapshot]:
        """
        Get snapshots for all symbols

        Returns:
            List of MarketSnapshots
        """
        snapshots = []
        for symbol in list(self.states.keys()):
            snapshot = await self.get_snapshot(symbol)
            if snapshot:
                snapshots.append(snapshot)
        return snapshots

    def get_symbols(self) -> List[str]:
        """Get list of all tracked symbols"""
        return list(self.states.keys())

    def get_status(self) -> Dict:
        """Get service status"""
        total_symbols = len(self.states)
        stale_symbols = sum(1 for s in self.states.values() if s.is_stale("1m"))

        return {
            "total_symbols": total_symbols,
            "stale_symbols": stale_symbols,
            "healthy_symbols": total_symbols - stale_symbols,
            "symbols": self.get_symbols()
        }


# Singleton instance
_state_manager: Optional[MarketStateManager] = None


def get_state_manager() -> MarketStateManager:
    """
    Get singleton state manager instance

    Returns:
        MarketStateManager: Global state manager
    """
    global _state_manager
    if _state_manager is None:
        _state_manager = MarketStateManager()
    return _state_manager
