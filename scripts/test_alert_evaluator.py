#!/usr/bin/env python3
"""
Test script for Sprint B.1: Alert Evaluator
Tests condition matching, cooldown, daily limits, Vietnamese templates.
Run: python scripts/test_alert_evaluator.py
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta

# Direct file loading to avoid __init__.py pulling in unrelated deps (openai, etc.)
import importlib.util

AI_SERVICE_DIR = os.path.join(os.path.dirname(__file__), "..", "apps", "ai-service")

def _load_module(name: str, filepath: str):
    spec = importlib.util.spec_from_file_location(name, filepath)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod

# Load models first (dependency)
insight_models = _load_module(
    "app.models.insight_models",
    os.path.join(AI_SERVICE_DIR, "app", "models", "insight_models.py"),
)
InsightEvent = insight_models.InsightEvent
InsightSeverity = insight_models.InsightSeverity
Timeframe = insight_models.Timeframe
UserAlert = insight_models.UserAlert
AlertNotification = insight_models.AlertNotification

# Load alert_evaluator
alert_evaluator_mod = _load_module(
    "app.services.alert_evaluator",
    os.path.join(AI_SERVICE_DIR, "app", "services", "alert_evaluator.py"),
)
AlertEvaluator = alert_evaluator_mod.AlertEvaluator
generate_vietnamese_explanation = alert_evaluator_mod.generate_vietnamese_explanation

PASSED = 0
FAILED = 0


def check(name: str, condition: bool, detail: str = ""):
    global PASSED, FAILED
    if condition:
        PASSED += 1
        print(f"  ✓ {name}")
    else:
        FAILED += 1
        print(f"  ✗ {name} - {detail}")


def make_event(
    code: str = "PA01",
    symbol: str = "VIC",
    severity: InsightSeverity = InsightSeverity.MEDIUM,
    signals: dict = None,
) -> InsightEvent:
    return InsightEvent(
        insight_code=code,
        symbol=symbol,
        timeframe=Timeframe.INTRADAY_1M,
        severity=severity,
        signals=signals or {"body_percent": 0.85, "close_change_pct": 1.2, "range": 500},
        raw_explanation="Test insight",
    )


def make_alert(
    user_id: str = "user-1",
    symbol: str = "VIC",
    insight_codes=None,
    min_severity=None,
) -> UserAlert:
    return UserAlert(
        id="alert-001",
        user_id=user_id,
        name="Test Alert",
        symbol=symbol,
        insight_codes=insight_codes,
        min_severity=min_severity,
    )


async def test_condition_matching():
    print("\n=== Test: Condition Matching ===")
    evaluator = AlertEvaluator()

    alert = make_alert(symbol="VIC")
    event = make_event(symbol="VIC", code="PA01")

    # Symbol match
    check("Symbol match", evaluator._matches_conditions(alert, event))

    # Symbol mismatch
    event_other = make_event(symbol="FPT")
    check("Symbol mismatch", not evaluator._matches_conditions(alert, event_other))

    # Insight code filter - match
    alert_codes = make_alert(insight_codes=["PA01", "PA02"])
    check("Code filter match", evaluator._matches_conditions(alert_codes, event))

    # Insight code filter - no match
    alert_codes2 = make_alert(insight_codes=["VA01", "VA02"])
    check("Code filter no match", not evaluator._matches_conditions(alert_codes2, event))

    # Severity threshold - pass
    alert_sev = make_alert(min_severity=InsightSeverity.MEDIUM)
    event_high = make_event(severity=InsightSeverity.HIGH)
    check("Severity >= threshold", evaluator._matches_conditions(alert_sev, event_high))

    # Severity threshold - fail
    event_low = make_event(severity=InsightSeverity.LOW)
    check("Severity < threshold", not evaluator._matches_conditions(alert_sev, event_low))

    # None insight_codes = match all
    alert_all = make_alert(insight_codes=None)
    check("None codes = all", evaluator._matches_conditions(alert_all, event))


async def test_cooldown():
    print("\n=== Test: Cooldown Management ===")
    evaluator = AlertEvaluator(cooldown_default=60, cooldown_high=120)

    event = make_event(severity=InsightSeverity.MEDIUM)

    # Not in cooldown initially
    check("No cooldown initially", not evaluator._in_cooldown("user-1", event))

    # Set cooldown
    evaluator._set_cooldown("user-1", event)
    check("In cooldown after set", evaluator._in_cooldown("user-1", event))

    # Different user not in cooldown
    check("Different user no cooldown", not evaluator._in_cooldown("user-2", event))

    # Clear cooldowns
    evaluator.clear_cooldowns()
    check("After clear, no cooldown", not evaluator._in_cooldown("user-1", event))


async def test_daily_limit():
    print("\n=== Test: Daily Limit ===")
    evaluator = AlertEvaluator(max_per_user_per_day=3)
    evaluator._reset_daily_if_new_day()

    # Simulate reaching limit
    evaluator._daily_counts["user-1"] = 3
    check("At limit", evaluator._daily_counts["user-1"] >= evaluator.max_per_user_per_day)

    evaluator._daily_counts["user-2"] = 1
    check("Under limit", evaluator._daily_counts["user-2"] < evaluator.max_per_user_per_day)


async def test_vietnamese_templates():
    print("\n=== Test: Vietnamese Templates ===")

    # PA01
    event_pa01 = make_event(
        code="PA01",
        signals={"body_percent": 0.85, "close_change_pct": 1.2, "range": 500},
    )
    msg = generate_vietnamese_explanation(event_pa01)
    check("PA01 template", "thân nến" in msg and "85%" in msg, msg[:60])

    # TM04
    event_tm04 = make_event(code="TM04", signals={"rsi14": 75.3})
    msg = generate_vietnamese_explanation(event_tm04)
    check("TM04 template", "quá mua" in msg and "75.3" in msg, msg[:60])

    # TM05
    event_tm05 = make_event(code="TM05", signals={"rsi14": 22.1})
    msg = generate_vietnamese_explanation(event_tm05)
    check("TM05 template", "quá bán" in msg, msg[:60])

    # TM02 golden cross
    event_tm02 = make_event(
        code="TM02",
        signals={"ma20": 50000, "ma50": 48000, "cross_type": "golden"},
    )
    msg = generate_vietnamese_explanation(event_tm02)
    check("TM02 golden cross", "Golden Cross" in msg, msg[:60])

    # PA03 gap
    event_pa03 = make_event(
        code="PA03",
        signals={"gap_percent": 2.5, "prev_close": 48000, "today_open": 49200},
    )
    msg = generate_vietnamese_explanation(event_pa03)
    check("PA03 gap template", "Gap" in msg and "tăng" in msg, msg[:60])

    # Unknown code falls back to raw_explanation
    event_unknown = InsightEvent(
        insight_code="XX99",
        symbol="VIC",
        timeframe=Timeframe.DAILY,
        severity=InsightSeverity.LOW,
        raw_explanation="Fallback text",
    )
    msg = generate_vietnamese_explanation(event_unknown)
    check("Unknown code fallback", msg == "Fallback text", msg)


async def test_stats():
    print("\n=== Test: Stats Tracking ===")
    evaluator = AlertEvaluator()
    stats = evaluator.get_stats()
    check("Stats has evaluations", "evaluations" in stats)
    check("Stats has notifications_sent", "notifications_sent" in stats)
    check("Initial evaluations = 0", stats["evaluations"] == 0)


async def main():
    print("=" * 60)
    print("Sprint B.1: Alert Evaluator - Test Suite")
    print("=" * 60)

    await test_condition_matching()
    await test_cooldown()
    await test_daily_limit()
    await test_vietnamese_templates()
    await test_stats()

    print("\n" + "=" * 60)
    print(f"Results: {PASSED} passed, {FAILED} failed, {PASSED + FAILED} total")
    print("=" * 60)

    if FAILED > 0:
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
