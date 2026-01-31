"""
Test script for AI Explain Service (Sprint B.2).
Tests Vietnamese template generation for all 10 insight codes.
No external dependencies required.
"""

import sys
import os
import importlib

# Add ai-service to path
_ai_service_path = os.path.join(os.path.dirname(__file__), "..", "apps", "ai-service")
sys.path.insert(0, _ai_service_path)

# Stub out heavy deps with proper mock modules
import types
for mod_name in ["openai", "anthropic", "supabase", "httpx", "apscheduler",
                 "apscheduler.schedulers", "apscheduler.schedulers.asyncio",
                 "apscheduler.triggers", "apscheduler.triggers.interval"]:
    if mod_name not in sys.modules:
        stub = types.ModuleType(mod_name)
        # Add common class stubs
        stub.OpenAI = type("OpenAI", (), {})
        stub.AsyncOpenAI = type("AsyncOpenAI", (), {})
        stub.Anthropic = type("Anthropic", (), {})
        stub.AsyncClient = type("AsyncClient", (), {})
        stub.Client = type("Client", (), {})
        stub.create_client = lambda *a, **k: None
        sys.modules[mod_name] = stub

# Prevent services/__init__.py from importing everything
sys.modules["app.services"] = types.ModuleType("app.services")

import asyncio
from datetime import datetime

from app.models.insight_models import InsightEvent, InsightSeverity, Timeframe

# Direct import of the module
import importlib.util
_spec = importlib.util.spec_from_file_location(
    "ai_explain_service",
    os.path.join(_ai_service_path, "app", "services", "ai_explain_service.py"),
)
_mod = importlib.util.module_from_spec(_spec)
sys.modules["app.services.ai_explain_service"] = _mod
_spec.loader.exec_module(_mod)
AIExplainService = _mod.AIExplainService
get_ai_explain_service = _mod.get_ai_explain_service


def make_event(code: str, symbol: str, signals: dict, severity: str = "medium") -> InsightEvent:
    return InsightEvent(
        insight_code=code,
        symbol=symbol,
        timeframe=Timeframe.INTRADAY_1M,
        detected_at=datetime(2024, 1, 19, 9, 15),
        severity=InsightSeverity(severity),
        confidence=1.0,
        signals=signals,
        raw_explanation=f"Raw: {code} for {symbol}",
    )


async def test_all_templates():
    """Test Vietnamese template generation for all insight codes."""
    svc = AIExplainService()  # No LLM client

    test_cases = [
        ("PA01", "VIC", {"body_percent": 0.85, "close_change_pct": 1.2, "range": 500}),
        ("PA02", "FPT", {"upper_wick_percent": 0.55, "high": 120000}),
        ("PA03", "VNM", {"gap_percent": 2.1, "prev_close": 70000, "today_open": 71470}),
        ("PA04", "HPG", {"high_20d": 30000, "today_close": 28500}),
        ("VA01", "SSI", {"volume_ratio": 2.5, "price_change_pct": 1.8}),
        ("VA02", "MWG", {"price_change_pct": 1.2, "volume_ratio": 0.55}),
        ("VA03", "VIC", {"volume": 5000000}),
        ("TM02", "FPT", {"cross_type": "golden", "ma20": 115000, "ma50": 112000}),
        ("TM04", "VNM", {"rsi14": 75.3}),
        ("TM05", "HPG", {"rsi14": 22.1}),
    ]

    passed = 0
    failed = 0

    for code, symbol, signals in test_cases:
        event = make_event(code, symbol, signals)
        result = await svc.explain(event)

        # Should NOT be the raw explanation (template should work)
        if result == event.raw_explanation:
            print(f"  FAIL {code}: Got raw fallback instead of template")
            failed += 1
        else:
            print(f"  OK   {code}: {result[:80]}...")
            passed += 1

    return passed, failed


async def test_unknown_code_fallback():
    """Unknown insight code should fall back to raw_explanation."""
    svc = AIExplainService()
    event = make_event("XX99", "VIC", {"foo": 1})
    result = await svc.explain(event)
    if result == event.raw_explanation:
        print("  OK   Unknown code falls back to raw_explanation")
        return 1, 0
    else:
        print(f"  FAIL Expected raw fallback, got: {result}")
        return 0, 1


async def test_template_error_fallback():
    """Missing signals should fall back to raw_explanation."""
    svc = AIExplainService()
    event = make_event("PA01", "VIC", {})  # Missing required signals
    result = await svc.explain(event)
    if result == event.raw_explanation:
        print("  OK   Missing signals falls back to raw_explanation")
        return 1, 0
    else:
        print(f"  FAIL Expected raw fallback, got: {result}")
        return 0, 1


async def test_death_cross():
    """TM02 with death cross should produce correct Vietnamese."""
    svc = AIExplainService()
    event = make_event("TM02", "HPG", {"cross_type": "death", "ma20": 28000, "ma50": 30000})
    result = await svc.explain(event)
    if "Death Cross" in result and "xuống dưới" in result:
        print(f"  OK   Death Cross: {result[:80]}...")
        return 1, 0
    else:
        print(f"  FAIL Death Cross: {result}")
        return 0, 1


async def test_gap_down():
    """PA03 with negative gap should say 'giảm'."""
    svc = AIExplainService()
    event = make_event("PA03", "VNM", {"gap_percent": -1.5, "prev_close": 70000, "today_open": 68950})
    result = await svc.explain(event)
    if "giảm" in result:
        print(f"  OK   Gap down: {result[:80]}...")
        return 1, 0
    else:
        print(f"  FAIL Gap down: {result}")
        return 0, 1


async def test_singleton():
    """Singleton should return same instance."""
    a = get_ai_explain_service()
    b = get_ai_explain_service()
    if a is b:
        print("  OK   Singleton returns same instance")
        return 1, 0
    else:
        print("  FAIL Singleton returns different instances")
        return 0, 1


async def test_stats():
    """Stats should track template successes."""
    svc = AIExplainService()
    event = make_event("TM04", "VIC", {"rsi14": 72.0})
    await svc.explain(event)
    stats = svc.get_stats()
    if stats["template_success"] >= 1:
        print(f"  OK   Stats tracked: {stats}")
        return 1, 0
    else:
        print(f"  FAIL Stats: {stats}")
        return 0, 1


async def main():
    total_pass = 0
    total_fail = 0

    tests = [
        ("Template generation (10 codes)", test_all_templates),
        ("Unknown code fallback", test_unknown_code_fallback),
        ("Template error fallback", test_template_error_fallback),
        ("Death Cross (TM02)", test_death_cross),
        ("Gap down (PA03)", test_gap_down),
        ("Singleton pattern", test_singleton),
        ("Stats tracking", test_stats),
    ]

    for name, test_fn in tests:
        print(f"\n[TEST] {name}")
        p, f = await test_fn()
        total_pass += p
        total_fail += f

    print(f"\n{'='*50}")
    print(f"Results: {total_pass} passed, {total_fail} failed")
    if total_fail == 0:
        print("ALL TESTS PASSED")
    else:
        print("SOME TESTS FAILED")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
