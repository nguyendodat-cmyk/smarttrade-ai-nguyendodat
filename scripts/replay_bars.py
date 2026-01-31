#!/usr/bin/env python3
"""
AI-3: Replay historical bar data through the insight pipeline.

Usage:
    python scripts/replay_bars.py --csv data/sample_bars.csv
    python scripts/replay_bars.py --json data/sample_bars.json
    python scripts/replay_bars.py --demo          # built-in demo data

Purpose:
    - Demo the pipeline without SSI API or live market
    - Test insight detection logic with known data
    - Present pipeline behavior to stakeholders

WARNING:
    - Offline tool only. Do NOT run in production.
    - Does not affect the live pipeline state.
    - Must be invoked manually by dev/operator.
"""

import argparse
import asyncio
import csv
import json
import os
import sys
import types

# ---------------------------------------------------------------------------
# Bootstrap
# ---------------------------------------------------------------------------

BASE = os.path.join(os.path.dirname(__file__), "..", "apps", "ai-service")
sys.path.insert(0, BASE)

# Stub optional deps
for mod_name in [
    "openai", "anthropic", "supabase", "redis", "tiktoken",
    "fastapi", "fastapi.middleware.cors", "uvicorn", "httpx",
]:
    stub = types.ModuleType(mod_name)
    class _Stub:
        def __init__(self, *a, **kw): pass
        def __call__(self, *a, **kw): return self
        def __getattr__(self, name): return _Stub()
    for attr in ["OpenAI", "AsyncOpenAI", "Anthropic", "AsyncAnthropic",
                 "FastAPI", "APIRouter", "CORSMiddleware", "Client"]:
        setattr(stub, attr, _Stub)
    sys.modules[mod_name] = stub

from datetime import datetime, timedelta
from app.models.insight_models import PriceBar, Timeframe, InsightEvent
from app.services.market_state_manager import MarketStateManager
from app.services.insight_engine import InsightEngine
from app.services.ai_explain_service import AIExplainService

# ---------------------------------------------------------------------------
# Data loaders
# ---------------------------------------------------------------------------

def load_csv(path: str) -> list[PriceBar]:
    """
    Load bars from CSV. Expected columns:
        symbol, timeframe, timestamp, open, high, low, close, volume
    timeframe: "1m" or "daily"
    timestamp: ISO format (e.g. 2025-01-15T09:30:00)
    """
    bars = []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            tf = Timeframe.INTRADAY_1M if row["timeframe"].strip() == "1m" else Timeframe.DAILY
            bars.append(PriceBar(
                symbol=row["symbol"].strip().upper(),
                timeframe=tf,
                timestamp=datetime.fromisoformat(row["timestamp"].strip()),
                open=float(row["open"]),
                high=float(row["high"]),
                low=float(row["low"]),
                close=float(row["close"]),
                volume=int(float(row.get("volume", 0))),
            ))
    return bars


def load_json(path: str) -> list[PriceBar]:
    """
    Load bars from JSON. Each entry: same fields as CSV.
    """
    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    bars = []
    for row in data:
        tf = Timeframe.INTRADAY_1M if row["timeframe"] == "1m" else Timeframe.DAILY
        bars.append(PriceBar(
            symbol=row["symbol"].upper(),
            timeframe=tf,
            timestamp=datetime.fromisoformat(row["timestamp"]),
            open=float(row["open"]),
            high=float(row["high"]),
            low=float(row["low"]),
            close=float(row["close"]),
            volume=int(row.get("volume", 0)),
        ))
    return bars


def generate_demo_bars() -> list[PriceBar]:
    """Built-in demo: FPT daily (30 bars with uptrend) + VNM 1m (10 bars with strong candle)."""
    bars = []
    now = datetime.utcnow()

    # FPT: 30 daily bars, gradual uptrend + volume spike on last day
    price = 120.0
    for i in range(30):
        ts = now - timedelta(days=30 - i)
        o = price
        c = price + 0.8
        h = max(o, c) + 0.3
        l = min(o, c) - 0.2
        vol = 500_000 if i < 29 else 2_500_000  # spike on last bar
        bars.append(PriceBar(
            symbol="FPT", timeframe=Timeframe.DAILY, timestamp=ts,
            open=o, high=h, low=l, close=c, volume=vol,
        ))
        price = c

    # VNM: 10 x 1m bars, last bar = strong bullish
    base = 75.0
    for i in range(9):
        ts = now - timedelta(minutes=10 - i)
        bars.append(PriceBar(
            symbol="VNM", timeframe=Timeframe.INTRADAY_1M, timestamp=ts,
            open=base, high=base + 0.1, low=base - 0.1, close=base + 0.05, volume=50_000,
        ))
    # Strong bullish candle
    ts = now - timedelta(minutes=1)
    bars.append(PriceBar(
        symbol="VNM", timeframe=Timeframe.INTRADAY_1M, timestamp=ts,
        open=75.0, high=76.1, low=74.95, close=76.0, volume=120_000,
    ))

    # HPG: 20 daily bars, strong uptrend → RSI overbought
    price = 28.0
    for i in range(20):
        ts = now - timedelta(days=20 - i)
        o = price
        c = price + 1.2
        bars.append(PriceBar(
            symbol="HPG", timeframe=Timeframe.DAILY, timestamp=ts,
            open=o, high=c + 0.3, low=o - 0.1, close=c, volume=700_000,
        ))
        price = c

    return bars


# ---------------------------------------------------------------------------
# Replay engine
# ---------------------------------------------------------------------------

async def replay(bars: list[PriceBar], verbose: bool = True):
    """Feed bars into StateManager → InsightEngine → AIExplain, print results."""
    sm = MarketStateManager()
    engine = InsightEngine(dedup_window_seconds=1, log_file=None)
    explain = AIExplainService()

    # Group bars by symbol for ordered feeding
    symbols = sorted(set(b.symbol for b in bars))

    if verbose:
        print(f"\nLoaded {len(bars)} bars for {len(symbols)} symbols: {', '.join(symbols)}")
        print("=" * 60)

    # Feed all bars
    await sm.update_bars(bars)

    total_insights = 0

    for symbol in symbols:
        snap = await sm.get_snapshot(symbol)
        if not snap:
            if verbose:
                print(f"\n[{symbol}] No snapshot available (no bars)")
            continue

        bars_1m = await sm.get_recent_bars(symbol, Timeframe.INTRADAY_1M, 60)
        bars_daily = await sm.get_recent_bars(symbol, Timeframe.DAILY, 50)

        if verbose:
            print(f"\n[{symbol}] bars_1m={len(bars_1m)}, bars_daily={len(bars_daily)}, "
                  f"last_price={snap.last_price:.2f}, "
                  f"MA20={'%.2f' % snap.ma20 if snap.ma20 else 'N/A'}, "
                  f"MA50={'%.2f' % snap.ma50 if snap.ma50 else 'N/A'}, "
                  f"RSI14={'%.1f' % snap.rsi14 if snap.rsi14 else 'N/A'}")

        insights = await engine.analyze_symbol(symbol, snap, bars_1m, bars_daily)
        total_insights += len(insights)

        if not insights:
            if verbose:
                print(f"  (no insights detected)")
            continue

        for event in insights:
            msg = await explain.explain(event)
            if verbose:
                print(f"  [{event.insight_code}] severity={event.severity.value}")
                print(f"    signals: {event.signals}")
                print(f"    explain: {msg}")

    if verbose:
        print("\n" + "=" * 60)
        print(f"Total: {total_insights} insight(s) detected across {len(symbols)} symbol(s)")
        print("=" * 60)

    return total_insights


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Replay historical bars through SmartTrade insight pipeline",
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--csv", help="Path to CSV file with OHLCV bars")
    group.add_argument("--json", help="Path to JSON file with OHLCV bars")
    group.add_argument("--demo", action="store_true", help="Use built-in demo data (FPT + VNM + HPG)")
    parser.add_argument("--quiet", action="store_true", help="Suppress detailed output")

    args = parser.parse_args()

    if args.csv:
        bars = load_csv(args.csv)
    elif args.json:
        bars = load_json(args.json)
    else:
        bars = generate_demo_bars()

    count = asyncio.run(replay(bars, verbose=not args.quiet))
    sys.exit(0 if count > 0 else 1)


if __name__ == "__main__":
    main()
