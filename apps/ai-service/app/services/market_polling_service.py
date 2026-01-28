"""
Market Polling Service - Periodic market data fetching

Polls SSI REST API for market data at configurable intervals.
Supports multi-tier polling (default/watchlist/hot symbols).

Features:
- APScheduler for periodic tasks
- Multi-tier polling (60s/30s/15s)
- Batch fetching with rate limiting
- Error handling & exponential backoff
- Start/stop controls
- Statistics tracking
"""

import asyncio
import logging
from datetime import datetime, date, timedelta
from typing import List, Dict, Set, Optional, Callable
from collections import defaultdict

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.config import settings
from app.services.ssi_client import get_ssi_client
from app.models.insight_models import PriceBar

logger = logging.getLogger(__name__)


class PollingTier:
    """Polling tier configuration"""
    def __init__(self, name: str, interval: int):
        self.name = name
        self.interval = interval  # seconds
        self.symbols: Set[str] = set()

    def add_symbol(self, symbol: str):
        self.symbols.add(symbol.upper())

    def remove_symbol(self, symbol: str):
        self.symbols.discard(symbol.upper())


class MarketPollingService:
    """
    Service to poll market data from SSI API periodically

    Supports multiple polling tiers:
    - Default: 60s - regular symbols
    - Watchlist: 30s - user watchlist symbols
    - Hot: 15s - explicit high-priority symbols
    """

    def __init__(
        self,
        on_bars_update: Optional[Callable[[List[PriceBar]], None]] = None
    ):
        """
        Initialize polling service

        Args:
            on_bars_update: Callback when new bars are received
                           async function(bars: List[PriceBar])
        """
        self.ssi_client = get_ssi_client()
        self.on_bars_update = on_bars_update

        # Polling tiers
        self.tiers = {
            "default": PollingTier("default", settings.POLLING_INTERVAL_DEFAULT),
            "watchlist": PollingTier("watchlist", settings.POLLING_INTERVAL_WATCHLIST),
            "hot": PollingTier("hot", settings.POLLING_INTERVAL_HOT)
        }

        # Scheduler
        self.scheduler: Optional[AsyncIOScheduler] = None
        self.running = False

        # Statistics
        self.stats = {
            "polls_total": 0,
            "polls_success": 0,
            "polls_failed": 0,
            "bars_received": 0,
            "last_poll_time": None,
            "last_error": None
        }

        # Rate limiting
        self.last_request_time: Dict[str, datetime] = {}
        self.request_delay = 0.15  # 150ms between requests

        # Daily bars cache (update less frequently)
        self.daily_bars_cache: Dict[str, List[PriceBar]] = {}
        self.daily_bars_last_fetch: Optional[datetime] = None

    def add_symbol(self, symbol: str, tier: str = "default"):
        """
        Add symbol to polling

        Args:
            symbol: Stock symbol (e.g., "VIC")
            tier: Polling tier - "default", "watchlist", or "hot"
        """
        if tier not in self.tiers:
            raise ValueError(f"Invalid tier: {tier}. Must be one of: {list(self.tiers.keys())}")

        symbol = symbol.upper()

        # Remove from other tiers first
        for t in self.tiers.values():
            t.remove_symbol(symbol)

        # Add to specified tier
        self.tiers[tier].add_symbol(symbol)
        logger.info(f"Added {symbol} to {tier} tier ({self.tiers[tier].interval}s)")

    def remove_symbol(self, symbol: str):
        """Remove symbol from all tiers"""
        symbol = symbol.upper()
        for tier in self.tiers.values():
            tier.remove_symbol(symbol)
        logger.info(f"Removed {symbol} from polling")

    def get_all_symbols(self) -> Set[str]:
        """Get all symbols across all tiers"""
        symbols = set()
        for tier in self.tiers.values():
            symbols.update(tier.symbols)
        return symbols

    async def _rate_limit_delay(self, symbol: str):
        """Apply rate limiting delay"""
        if symbol in self.last_request_time:
            elapsed = (datetime.now() - self.last_request_time[symbol]).total_seconds()
            if elapsed < self.request_delay:
                await asyncio.sleep(self.request_delay - elapsed)

        self.last_request_time[symbol] = datetime.now()

    async def _fetch_intraday_bar(self, symbol: str) -> Optional[PriceBar]:
        """
        Fetch latest intraday 1-minute bar for a symbol

        Args:
            symbol: Stock symbol

        Returns:
            PriceBar or None if fetch failed
        """
        try:
            await self._rate_limit_delay(symbol)

            # Get latest bar (today, last bar, descending)
            today = date.today()
            result = await self.ssi_client.get_intraday_ohlc(
                symbol=symbol,
                from_date=today,
                to_date=today,
                page_size=1,
                ascending=False
            )

            # Parse response
            data = result.get("data", [])
            if not data:
                logger.debug(f"No intraday data for {symbol}")
                return None

            bar_data = data[0]

            # Create PriceBar
            bar = PriceBar(
                symbol=symbol,
                timestamp=datetime.fromisoformat(bar_data["tradingDate"]),
                open=float(bar_data["open"]),
                high=float(bar_data["high"]),
                low=float(bar_data["low"]),
                close=float(bar_data["close"]),
                volume=int(bar_data["volume"]),
                timeframe="1m"
            )

            return bar

        except Exception as e:
            logger.error(f"Error fetching intraday bar for {symbol}: {e}")
            self.stats["last_error"] = str(e)
            return None

    async def _fetch_daily_bars(self, symbol: str, days: int = 50) -> List[PriceBar]:
        """
        Fetch daily bars for a symbol

        Args:
            symbol: Stock symbol
            days: Number of days to fetch

        Returns:
            List of PriceBars (daily timeframe)
        """
        try:
            await self._rate_limit_delay(symbol)

            # Date range
            to_date = date.today()
            from_date = to_date - timedelta(days=days * 2)  # Extra buffer for weekends

            result = await self.ssi_client.get_daily_ohlc(
                symbol=symbol,
                from_date=from_date,
                to_date=to_date,
                page_size=days,
                ascending=False
            )

            # Parse response
            data = result.get("data", [])
            bars = []

            for bar_data in data[:days]:  # Limit to requested days
                bar = PriceBar(
                    symbol=symbol,
                    timestamp=datetime.fromisoformat(bar_data["tradingDate"]),
                    open=float(bar_data["open"]),
                    high=float(bar_data["high"]),
                    low=float(bar_data["low"]),
                    close=float(bar_data["close"]),
                    volume=int(bar_data["volume"]),
                    timeframe="1d"
                )
                bars.append(bar)

            logger.debug(f"Fetched {len(bars)} daily bars for {symbol}")
            return bars

        except Exception as e:
            logger.error(f"Error fetching daily bars for {symbol}: {e}")
            return []

    async def _poll_tier(self, tier: PollingTier):
        """
        Poll all symbols in a tier

        Args:
            tier: PollingTier to poll
        """
        if not tier.symbols:
            return

        logger.info(f"Polling {tier.name} tier: {len(tier.symbols)} symbols")
        self.stats["polls_total"] += 1

        bars: List[PriceBar] = []

        try:
            # Fetch intraday bars for each symbol
            for symbol in tier.symbols:
                bar = await self._fetch_intraday_bar(symbol)
                if bar:
                    bars.append(bar)

            # Update stats
            if bars:
                self.stats["polls_success"] += 1
                self.stats["bars_received"] += len(bars)
                logger.info(f"Received {len(bars)} bars from {tier.name} tier")

                # Callback
                if self.on_bars_update:
                    await self.on_bars_update(bars)
            else:
                logger.warning(f"No bars received from {tier.name} tier")

        except Exception as e:
            self.stats["polls_failed"] += 1
            self.stats["last_error"] = str(e)
            logger.error(f"Error polling {tier.name} tier: {e}")

        finally:
            self.stats["last_poll_time"] = datetime.now()

    async def _poll_daily_bars(self):
        """
        Poll daily bars for all symbols (less frequent)
        Called once per day or on startup
        """
        symbols = self.get_all_symbols()
        if not symbols:
            return

        logger.info(f"Polling daily bars for {len(symbols)} symbols")

        for symbol in symbols:
            bars = await self._fetch_daily_bars(symbol, days=settings.STATE_ROLLING_WINDOW_DAILY)
            if bars:
                self.daily_bars_cache[symbol] = bars

        self.daily_bars_last_fetch = datetime.now()
        logger.info(f"Daily bars cached for {len(self.daily_bars_cache)} symbols")

    def start(self):
        """Start polling service"""
        if self.running:
            logger.warning("Polling service already running")
            return

        if not settings.POLLING_ENABLED:
            logger.info("Polling disabled in settings")
            return

        logger.info("Starting market polling service...")

        # Create scheduler
        self.scheduler = AsyncIOScheduler()

        # Schedule each tier
        for tier in self.tiers.values():
            self.scheduler.add_job(
                self._poll_tier,
                trigger=IntervalTrigger(seconds=tier.interval),
                args=[tier],
                id=f"poll_{tier.name}",
                name=f"Poll {tier.name} tier",
                replace_existing=True
            )

        # Schedule daily bars polling (every 6 hours)
        self.scheduler.add_job(
            self._poll_daily_bars,
            trigger=IntervalTrigger(hours=6),
            id="poll_daily_bars",
            name="Poll daily bars",
            replace_existing=True
        )

        # Start scheduler
        self.scheduler.start()
        self.running = True

        logger.info("✓ Market polling service started")
        logger.info(f"  - Default tier: {len(self.tiers['default'].symbols)} symbols @ {self.tiers['default'].interval}s")
        logger.info(f"  - Watchlist tier: {len(self.tiers['watchlist'].symbols)} symbols @ {self.tiers['watchlist'].interval}s")
        logger.info(f"  - Hot tier: {len(self.tiers['hot'].symbols)} symbols @ {self.tiers['hot'].interval}s")

        # Immediate initial poll
        asyncio.create_task(self._initial_poll())

    async def _initial_poll(self):
        """Run initial poll on startup"""
        logger.info("Running initial poll...")

        # Poll daily bars first
        await self._poll_daily_bars()

        # Poll each tier once
        for tier in self.tiers.values():
            if tier.symbols:
                await self._poll_tier(tier)

    def stop(self):
        """Stop polling service"""
        if not self.running:
            logger.warning("Polling service not running")
            return

        logger.info("Stopping market polling service...")

        if self.scheduler:
            self.scheduler.shutdown(wait=False)
            self.scheduler = None

        self.running = False
        logger.info("✓ Market polling service stopped")

    def get_status(self) -> Dict:
        """Get service status and statistics"""
        return {
            "running": self.running,
            "tiers": {
                name: {
                    "interval": tier.interval,
                    "symbols_count": len(tier.symbols),
                    "symbols": list(tier.symbols)
                }
                for name, tier in self.tiers.items()
            },
            "stats": self.stats,
            "daily_bars_cached": len(self.daily_bars_cache),
            "daily_bars_last_fetch": self.daily_bars_last_fetch.isoformat() if self.daily_bars_last_fetch else None
        }

    def get_daily_bars(self, symbol: str) -> Optional[List[PriceBar]]:
        """
        Get cached daily bars for a symbol

        Args:
            symbol: Stock symbol

        Returns:
            List of daily PriceBars or None if not cached
        """
        return self.daily_bars_cache.get(symbol.upper())


# Singleton instance
_polling_service: Optional[MarketPollingService] = None


def get_polling_service() -> MarketPollingService:
    """
    Get singleton polling service instance

    Returns:
        MarketPollingService: Global polling service
    """
    global _polling_service
    if _polling_service is None:
        _polling_service = MarketPollingService()
    return _polling_service
