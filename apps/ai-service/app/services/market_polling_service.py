"""
Sprint A.1: Market Polling Service
Multi-tier polling to replace SSI IDS streaming (on-hold).
Tiers: default=60s, watchlist=30s, hot=15s.
"""

import asyncio
import logging
import time
from typing import Callable, Coroutine, Dict, List, Optional, Set
from datetime import datetime, timedelta
from enum import Enum

from app.models.insight_models import PriceBar, Timeframe

logger = logging.getLogger(__name__)


class PollingTier(str, Enum):
    DEFAULT = "default"      # 60s
    WATCHLIST = "watchlist"  # 30s
    HOT = "hot"              # 15s


class MarketPollingService:
    """
    Multi-tier polling service for market data.
    Fetches intraday (1m) + daily bars from SSI REST API.
    """

    def __init__(
        self,
        ssi_client=None,
        interval_default: int = 60,
        interval_watchlist: int = 30,
        interval_hot: int = 15,
        batch_size: int = 20,
        rate_limit_delay: float = 0.15,
    ):
        self.ssi_client = ssi_client
        self.intervals = {
            PollingTier.DEFAULT: interval_default,
            PollingTier.WATCHLIST: interval_watchlist,
            PollingTier.HOT: interval_hot,
        }
        self.batch_size = batch_size
        self.rate_limit_delay = rate_limit_delay

        # Symbol -> tier mapping
        self._symbol_tiers: Dict[str, PollingTier] = {}
        self._default_symbols: Set[str] = set()
        self._watchlist_symbols: Set[str] = set()
        self._hot_symbols: Set[str] = set()

        # Callbacks
        self._on_bars_update: Optional[Callable] = None

        # State
        self._running = False
        self._tasks: List[asyncio.Task] = []
        self._stats = {
            "polls_total": 0,
            "polls_success": 0,
            "polls_error": 0,
            "bars_fetched": 0,
            "last_poll_at": None,
        }

    def set_on_bars_update(self, callback: Callable[[List[PriceBar]], Coroutine]):
        """Set callback for when new bars are fetched."""
        self._on_bars_update = callback

    def set_symbols(self, symbols: List[str], tier: PollingTier = PollingTier.DEFAULT):
        """Set symbols for a given polling tier."""
        tier_set = {
            PollingTier.DEFAULT: self._default_symbols,
            PollingTier.WATCHLIST: self._watchlist_symbols,
            PollingTier.HOT: self._hot_symbols,
        }[tier]
        tier_set.clear()
        tier_set.update(s.upper() for s in symbols)
        for s in tier_set:
            self._symbol_tiers[s] = tier

    def add_symbol(self, symbol: str, tier: PollingTier = PollingTier.DEFAULT):
        """Add a symbol to a polling tier."""
        symbol = symbol.upper()
        # Remove from other tiers
        self._default_symbols.discard(symbol)
        self._watchlist_symbols.discard(symbol)
        self._hot_symbols.discard(symbol)
        # Add to target tier
        {
            PollingTier.DEFAULT: self._default_symbols,
            PollingTier.WATCHLIST: self._watchlist_symbols,
            PollingTier.HOT: self._hot_symbols,
        }[tier].add(symbol)
        self._symbol_tiers[symbol] = tier

    def remove_symbol(self, symbol: str):
        """Remove a symbol from all tiers."""
        symbol = symbol.upper()
        self._default_symbols.discard(symbol)
        self._watchlist_symbols.discard(symbol)
        self._hot_symbols.discard(symbol)
        self._symbol_tiers.pop(symbol, None)

    async def start(self):
        """Start polling loops for all tiers."""
        if self._running:
            return
        self._running = True
        logger.info("MarketPollingService starting...")

        for tier in PollingTier:
            task = asyncio.create_task(self._poll_loop(tier))
            self._tasks.append(task)

        logger.info("MarketPollingService started with %d tiers", len(self._tasks))

    async def stop(self):
        """Stop all polling loops."""
        self._running = False
        for task in self._tasks:
            task.cancel()
        if self._tasks:
            await asyncio.gather(*self._tasks, return_exceptions=True)
        self._tasks.clear()
        logger.info("MarketPollingService stopped")

    async def _poll_loop(self, tier: PollingTier):
        """Main polling loop for a tier."""
        interval = self.intervals[tier]
        while self._running:
            try:
                symbols = list({
                    PollingTier.DEFAULT: self._default_symbols,
                    PollingTier.WATCHLIST: self._watchlist_symbols,
                    PollingTier.HOT: self._hot_symbols,
                }[tier])

                if symbols:
                    await self._poll_symbols(symbols, tier)

                await asyncio.sleep(interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("Polling error [%s]: %s", tier.value, e)
                await asyncio.sleep(interval)

    async def _poll_symbols(self, symbols: List[str], tier: PollingTier):
        """Fetch bars for a batch of symbols."""
        all_bars: List[PriceBar] = []

        # Process in batches
        for i in range(0, len(symbols), self.batch_size):
            batch = symbols[i:i + self.batch_size]
            for symbol in batch:
                try:
                    bars = await self._fetch_symbol_bars(symbol)
                    all_bars.extend(bars)
                    self._stats["bars_fetched"] += len(bars)
                    # Rate limiting
                    await asyncio.sleep(self.rate_limit_delay)
                except Exception as e:
                    logger.error("Error fetching %s: %s", symbol, e)
                    self._stats["polls_error"] += 1

        self._stats["polls_total"] += 1
        self._stats["polls_success"] += 1
        self._stats["last_poll_at"] = datetime.utcnow().isoformat()

        if all_bars and self._on_bars_update:
            try:
                await self._on_bars_update(all_bars)
            except Exception as e:
                logger.error("Error in on_bars_update callback: %s", e)

    async def _fetch_symbol_bars(self, symbol: str) -> List[PriceBar]:
        """Fetch intraday + daily bars for a symbol from SSI."""
        bars: List[PriceBar] = []

        if not self.ssi_client:
            return bars

        try:
            # Fetch intraday 1m bars
            intraday = await self.ssi_client.get_intraday_ohlc(
                symbol=symbol, resolution="1", count=60
            )
            if intraday:
                for bar_data in intraday:
                    bars.append(PriceBar(
                        symbol=symbol,
                        timeframe=Timeframe.INTRADAY_1M,
                        timestamp=bar_data["timestamp"],
                        open=bar_data["open"],
                        high=bar_data["high"],
                        low=bar_data["low"],
                        close=bar_data["close"],
                        volume=bar_data.get("volume", 0),
                    ))
        except Exception as e:
            logger.error("Error fetching intraday for %s: %s", symbol, e)

        try:
            # Fetch daily bars (50 days for indicators)
            daily = await self.ssi_client.get_daily_ohlc(
                symbol=symbol, count=50
            )
            if daily:
                for bar_data in daily:
                    bars.append(PriceBar(
                        symbol=symbol,
                        timeframe=Timeframe.DAILY,
                        timestamp=bar_data["timestamp"],
                        open=bar_data["open"],
                        high=bar_data["high"],
                        low=bar_data["low"],
                        close=bar_data["close"],
                        volume=bar_data.get("volume", 0),
                    ))
        except Exception as e:
            logger.error("Error fetching daily for %s: %s", symbol, e)

        return bars

    def get_stats(self) -> Dict:
        return {
            **self._stats,
            "symbols_default": len(self._default_symbols),
            "symbols_watchlist": len(self._watchlist_symbols),
            "symbols_hot": len(self._hot_symbols),
            "running": self._running,
        }
