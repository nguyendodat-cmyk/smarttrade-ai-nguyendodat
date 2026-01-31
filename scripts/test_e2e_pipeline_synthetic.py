#!/usr/bin/env python3
"""
Sprint C.3: E2E Synthetic Pipeline Test
Generates synthetic bars for 3 symbols, feeds through full pipeline:
  StateManager → InsightEngine → AlertEvaluator → AIExplain
Asserts:
  - PA01, VA02, TM04 trigger correctly
  - Cooldown blocks duplicate alerts
  - Warm-up suppresses alerts during startup window
  - PipelineMonitor counters > 0
"""

import asyncio
import sys
import os
import types
import importlib.util

# ---------------------------------------------------------------------------
# Bootstrap: stub missing deps and load modules from source
# ---------------------------------------------------------------------------

BASE = os.path.join(os.path.dirname(__file__), "..", "apps", "ai-service")
sys.path.insert(0, BASE)

# Stub heavy optional deps that aren't needed for unit logic
for mod_name in [
    "openai", "anthropic", "supabase", "redis", "tiktoken",
    "fastapi", "fastapi.middleware.cors", "uvicorn",
    "httpx",
]:
    stub = types.ModuleType(mod_name)
    # Add common class stubs
    class _Stub:
        def __init__(self, *a, **kw): pass
        def __call__(self, *a, **kw): return self
        def __getattr__(self, name): return _Stub()
    for attr in ["OpenAI", "AsyncOpenAI", "Anthropic", "AsyncAnthropic",
                 "FastAPI", "APIRouter", "CORSMiddleware", "Client"]:
        setattr(stub, attr, _Stub)
    sys.modules[mod_name] = stub

from datetime import datetime, timedelta
from app.models.insight_models import (
    PriceBar, MarketSnapshot, InsightEvent, InsightSeverity,
    Timeframe, UserAlert, AlertNotification,
)
from app.services.market_state_manager import MarketStateManager
from app.services.insight_engine import InsightEngine
from app.services.ai_explain_service import AIExplainService
from app.services.pipeline_monitor import PipelineMonitor, RollingCounter

# Reset singletons so tests start fresh
import app.services.alert_evaluator as ae_mod
ae_mod._evaluator_instance = None
import app.services.pipeline_monitor as pm_mod
pm_mod._monitor_instance = None
import app.services.ai_explain_service as aie_mod
aie_mod._instance = None

from app.services.alert_evaluator import AlertEvaluator

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

passed = 0
failed = 0

def check(name: str, condition: bool, detail: str = ""):
    global passed, failed
    if condition:
        passed += 1
        print(f"  ✓ {name}")
    else:
        failed += 1
        print(f"  ✗ {name} — {detail}")


def make_bar(symbol, tf, ts, o, h, l, c, vol=100_000):
    return PriceBar(
        symbol=symbol, timeframe=tf, timestamp=ts,
        open=o, high=h, low=l, close=c, volume=vol,
    )


def gen_daily_bars(symbol, n=30, base_price=25.0, base_vol=500_000):
    """Generate n daily bars with slight uptrend."""
    bars = []
    price = base_price
    now = datetime.utcnow()
    for i in range(n):
        ts = now - timedelta(days=n - i)
        o = price
        c = price + 0.1  # slight uptick
        h = max(o, c) + 0.05
        l = min(o, c) - 0.05
        bars.append(make_bar(symbol, Timeframe.DAILY, ts, o, h, l, c, base_vol))
        price = c
    return bars


def gen_1m_bars_pa01(symbol, n=10, base_price=26.0):
    """Generate 1m bars where last bar is strongly bullish (body >80% range)."""
    bars = []
    now = datetime.utcnow()
    for i in range(n - 1):
        ts = now - timedelta(minutes=n - i)
        bars.append(make_bar(symbol, Timeframe.INTRADAY_1M, ts,
                             base_price, base_price + 0.05, base_price - 0.05, base_price + 0.02))
    # Last bar: strong bullish — body ~90% of range
    ts = now - timedelta(minutes=1)
    o, c = base_price, base_price + 1.0
    h = c + 0.05  # tiny upper wick
    l = o - 0.05   # tiny lower wick
    bars.append(make_bar(symbol, Timeframe.INTRADAY_1M, ts, o, h, l, c))
    return bars


# ---------------------------------------------------------------------------
# Test class with mock alerts (bypass Supabase)
# ---------------------------------------------------------------------------

class TestAlertEvaluator(AlertEvaluator):
    """AlertEvaluator with injected mock alerts instead of DB."""

    def __init__(self, mock_alerts, **kwargs):
        super().__init__(**kwargs)
        self._mock_alerts = mock_alerts

    async def _get_matching_alerts(self, event):
        return [a for a in self._mock_alerts if a.symbol.upper() == event.symbol.upper() and a.enabled]


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

async def test_pa01_triggers():
    """PA01 should fire for strongly bullish candle."""
    print("\n[Test 1] PA01 — Strong Bullish Candle")

    sm = MarketStateManager()
    engine = InsightEngine(dedup_window_seconds=1, log_file=None)

    # Feed data
    daily = gen_daily_bars("VNM", 30)
    bars_1m = gen_1m_bars_pa01("VNM")
    await sm.update_bars(daily + bars_1m)

    snap = await sm.get_snapshot("VNM")
    b1m = await sm.get_recent_bars("VNM", Timeframe.INTRADAY_1M, 60)
    bd = await sm.get_recent_bars("VNM", Timeframe.DAILY, 50)

    insights = await engine.analyze_symbol("VNM", snap, b1m, bd)
    pa01 = [i for i in insights if i.insight_code == "PA01"]
    check("PA01 triggered", len(pa01) >= 1, f"got {len(pa01)} PA01 insights")
    if pa01:
        check("PA01 body_percent > 0.70", pa01[0].signals.get("body_percent", 0) > 0.70)


async def test_va02_triggers():
    """VA02: price up but volume down divergence."""
    print("\n[Test 2] VA02 — Price Up Volume Down")

    sm = MarketStateManager()
    engine = InsightEngine(dedup_window_seconds=1, log_file=None)

    now = datetime.utcnow()
    bars = []
    # 19 days with normal volume
    for i in range(19):
        ts = now - timedelta(days=20 - i)
        bars.append(make_bar("FPT", Timeframe.DAILY, ts, 80, 81, 79, 80.5, vol=1_000_000))
    # Day 20: price up +1.5% but volume only 40% of avg
    ts = now - timedelta(days=1)
    bars.append(make_bar("FPT", Timeframe.DAILY, ts, 80, 82.5, 79.5, 81.5, vol=400_000))

    await sm.update_bars(bars)
    snap = await sm.get_snapshot("FPT")
    bd = await sm.get_recent_bars("FPT", Timeframe.DAILY, 50)

    insights = await engine.analyze_symbol("FPT", snap, [], bd)
    va02 = [i for i in insights if i.insight_code == "VA02"]
    check("VA02 triggered", len(va02) >= 1, f"got {len(va02)} VA02 insights")


async def test_tm04_triggers():
    """TM04: RSI overbought (>70)."""
    print("\n[Test 3] TM04 — RSI Overbought")

    sm = MarketStateManager()
    engine = InsightEngine(dedup_window_seconds=1, log_file=None)

    now = datetime.utcnow()
    bars = []
    # Generate 20 daily bars with strong uptrend to push RSI > 70
    price = 50.0
    for i in range(20):
        ts = now - timedelta(days=20 - i)
        o = price
        c = price + 1.5  # strong daily gains
        bars.append(make_bar("HPG", Timeframe.DAILY, ts, o, c + 0.2, o - 0.1, c, vol=800_000))
        price = c

    await sm.update_bars(bars)
    snap = await sm.get_snapshot("HPG")
    check("RSI14 computed > 70", snap.rsi14 is not None and snap.rsi14 > 70,
          f"rsi14={snap.rsi14}")

    bd = await sm.get_recent_bars("HPG", Timeframe.DAILY, 50)
    insights = await engine.analyze_symbol("HPG", snap, [], bd)
    tm04 = [i for i in insights if i.insight_code == "TM04"]
    check("TM04 triggered", len(tm04) >= 1, f"got {len(tm04)} TM04 insights")


async def test_warmup_suppresses():
    """Warm-up period should suppress all alerts."""
    print("\n[Test 4] Warm-up Suppression")

    mock_alerts = [
        UserAlert(id="a1", user_id="u1", name="Test", symbol="VNM", enabled=True),
    ]
    evaluator = TestAlertEvaluator(
        mock_alerts=mock_alerts,
        warmup_seconds=9999,  # very long → always in warmup
        cooldown_default=10,
        cooldown_high=10,
    )
    event = InsightEvent(
        insight_code="PA01", symbol="VNM", timeframe=Timeframe.INTRADAY_1M,
        severity=InsightSeverity.HIGH, signals={"body_percent": 0.85},
    )
    result = await evaluator.evaluate(event)
    check("No notifications during warmup", len(result) == 0, f"got {len(result)}")
    check("warmup_suppressed counter > 0", evaluator.get_stats()["warmup_suppressed"] > 0)


async def test_cooldown_blocks():
    """Second identical alert should be blocked by cooldown."""
    print("\n[Test 5] Cooldown Blocking")

    mock_alerts = [
        UserAlert(id="a1", user_id="u1", name="Test", symbol="VNM", enabled=True),
    ]
    evaluator = TestAlertEvaluator(
        mock_alerts=mock_alerts,
        warmup_seconds=0,  # no warmup
        cooldown_default=300,
        cooldown_high=600,
    )
    event = InsightEvent(
        insight_code="PA01", symbol="VNM", timeframe=Timeframe.INTRADAY_1M,
        severity=InsightSeverity.MEDIUM, signals={"body_percent": 0.85},
    )

    # First eval → should produce notification
    r1 = await evaluator.evaluate(event)
    check("First alert passes", len(r1) == 1, f"got {len(r1)}")

    # Second eval → should be blocked by cooldown
    r2 = await evaluator.evaluate(event)
    check("Second alert blocked by cooldown", len(r2) == 0, f"got {len(r2)}")
    check("cooldown_skipped counter > 0", evaluator.get_stats()["cooldown_skipped"] > 0)


async def test_ai_explain_vietnamese():
    """AIExplainService should produce Vietnamese text for known codes."""
    print("\n[Test 6] AI Explain — Vietnamese Templates")

    explain = AIExplainService()
    event = InsightEvent(
        insight_code="PA01", symbol="VNM", timeframe=Timeframe.INTRADAY_1M,
        severity=InsightSeverity.HIGH,
        signals={"body_percent": 0.85, "close_change_pct": 2.1, "range": 1.0},
    )
    msg = await explain.explain(event)
    check("Vietnamese output non-empty", len(msg) > 10, f"len={len(msg)}")
    check("Contains Vietnamese keyword", any(w in msg for w in ["nến", "tăng", "VNM"]),
          f"msg={msg[:80]}")


async def test_pipeline_monitor_counters():
    """PipelineMonitor rolling counters should reflect recorded events."""
    print("\n[Test 7] Pipeline Monitor Counters")

    monitor = PipelineMonitor(window_seconds=300)
    for _ in range(5):
        monitor.record_insight()
    for _ in range(3):
        monitor.record_alert()
    monitor.record_daily_cap_hit()

    check("insights_last_5m == 5", monitor.insights_counter.count_in_window() == 5)
    check("alerts_last_5m == 3", monitor.alerts_counter.count_in_window() == 3)
    check("cap_hits_last_5m == 1", monitor.daily_cap_hits_counter.count_in_window() == 1)


async def test_full_pipeline_e2e():
    """Full pipeline: StateManager → InsightEngine → AlertEvaluator → AIExplain."""
    print("\n[Test 8] Full Pipeline E2E (VNM + FPT + HPG)")

    monitor = PipelineMonitor(window_seconds=300)

    # Services
    sm = MarketStateManager()
    engine = InsightEngine(dedup_window_seconds=1, log_file=None)

    mock_alerts = [
        UserAlert(id="a1", user_id="u1", name="VNM Alert", symbol="VNM", enabled=True),
        UserAlert(id="a2", user_id="u1", name="FPT Alert", symbol="FPT", enabled=True),
        UserAlert(id="a3", user_id="u1", name="HPG Alert", symbol="HPG", enabled=True),
    ]
    evaluator = TestAlertEvaluator(
        mock_alerts=mock_alerts,
        warmup_seconds=0,
        cooldown_default=300,
        cooldown_high=600,
    )
    explain = AIExplainService()

    # Wire subscriber
    collected_notifications = []

    async def on_insight(event: InsightEvent):
        monitor.record_insight()
        notifs = await evaluator.evaluate(event)
        for n in notifs:
            monitor.record_alert()
            collected_notifications.append(n)

    engine.subscribe(on_insight)

    # --- Feed VNM (PA01) ---
    daily_vnm = gen_daily_bars("VNM", 30)
    bars_1m_vnm = gen_1m_bars_pa01("VNM")
    await sm.update_bars(daily_vnm + bars_1m_vnm)

    snap = await sm.get_snapshot("VNM")
    b1m = await sm.get_recent_bars("VNM", Timeframe.INTRADAY_1M, 60)
    bd = await sm.get_recent_bars("VNM", Timeframe.DAILY, 50)
    await engine.analyze_symbol("VNM", snap, b1m, bd)

    # --- Feed FPT (VA02) ---
    now = datetime.utcnow()
    fpt_bars = []
    for i in range(19):
        ts = now - timedelta(days=20 - i)
        fpt_bars.append(make_bar("FPT", Timeframe.DAILY, ts, 80, 81, 79, 80.5, vol=1_000_000))
    fpt_bars.append(make_bar("FPT", Timeframe.DAILY, now - timedelta(days=1), 80, 82.5, 79.5, 81.5, vol=400_000))
    await sm.update_bars(fpt_bars)

    snap_fpt = await sm.get_snapshot("FPT")
    bd_fpt = await sm.get_recent_bars("FPT", Timeframe.DAILY, 50)
    await engine.analyze_symbol("FPT", snap_fpt, [], bd_fpt)

    # --- Feed HPG (TM04) ---
    hpg_bars = []
    price = 50.0
    for i in range(20):
        ts = now - timedelta(days=20 - i)
        o = price
        c = price + 1.5
        hpg_bars.append(make_bar("HPG", Timeframe.DAILY, ts, o, c + 0.2, o - 0.1, c, vol=800_000))
        price = c

    await sm.update_bars(hpg_bars)
    snap_hpg = await sm.get_snapshot("HPG")
    bd_hpg = await sm.get_recent_bars("HPG", Timeframe.DAILY, 50)
    await engine.analyze_symbol("HPG", snap_hpg, [], bd_hpg)

    # Register for status
    monitor.register_services(
        state_manager=sm, insight_engine=engine,
        alert_evaluator=evaluator, ai_explain_service=explain,
    )

    # Assertions
    codes_triggered = {n.insight_code for n in collected_notifications}
    check("PA01 in notifications", "PA01" in codes_triggered, f"codes={codes_triggered}")
    check("VA02 in notifications", "VA02" in codes_triggered, f"codes={codes_triggered}")
    check("TM04 in notifications", "TM04" in codes_triggered, f"codes={codes_triggered}")
    check("insights_last_5m > 0", monitor.insights_counter.count_in_window() > 0)
    check("alerts_last_5m > 0", monitor.alerts_counter.count_in_window() > 0)

    # Print sample pipeline/status
    status = monitor.get_full_status()
    print("\n  === Sample /pipeline/status ===")
    import json
    print("  " + json.dumps(status, indent=2, default=str).replace("\n", "\n  "))

    # Vietnamese explanation check
    for n in collected_notifications:
        check(f"Notification {n.insight_code} has Vietnamese msg",
              len(n.message) > 10 and n.symbol in n.message)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

async def main():
    global passed, failed
    print("=" * 60)
    print("Sprint C.3: E2E Synthetic Pipeline Test")
    print("=" * 60)

    await test_pa01_triggers()
    await test_va02_triggers()
    await test_tm04_triggers()
    await test_warmup_suppresses()
    await test_cooldown_blocks()
    await test_ai_explain_vietnamese()
    await test_pipeline_monitor_counters()
    await test_full_pipeline_e2e()

    print("\n" + "=" * 60)
    total = passed + failed
    print(f"Results: {passed}/{total} passed, {failed} failed")
    print("=" * 60)
    return failed == 0


if __name__ == "__main__":
    ok = asyncio.run(main())
    sys.exit(0 if ok else 1)
