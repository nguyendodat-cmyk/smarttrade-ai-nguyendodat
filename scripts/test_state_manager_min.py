#!/usr/bin/env python3
"""
Market State Manager - Minimal Test Script

Tests core functionality:
1. Dedupe (same timestamp)
2. Rolling avg 5m
3. RSI14 calculation
4. Session reset
5. Stale detection

Usage:
    python scripts/test_state_manager_min.py
"""

import asyncio
import sys
from pathlib import Path
from datetime import datetime, timedelta

# Add app to path
sys.path.insert(0, str(Path(__file__).parent.parent / "apps" / "ai-service"))

from app.services.market_state_manager import MarketStateManager
from app.models.insight_models import PriceBar


def print_section(title: str):
    """Print section header"""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)


async def test_dedupe():
    """Test 1: Deduplication by timestamp"""
    print_section("Test 1: Deduplication")

    manager = MarketStateManager()

    # Create duplicate bars (same timestamp)
    timestamp = datetime.now()
    bar1 = PriceBar(
        symbol="TEST",
        timestamp=timestamp,
        open=100,
        high=105,
        low=99,
        close=103,
        volume=1000,
        timeframe="1m"
    )

    bar2 = PriceBar(
        symbol="TEST",
        timestamp=timestamp,  # Same timestamp!
        open=100,
        high=106,  # Different data
        low=98,
        close=104,
        volume=2000,
        timeframe="1m"
    )

    # Update with first bar
    await manager.update_bars([bar1])
    bars_after_first = await manager.get_recent_bars("TEST", "1m")
    print(f"After first bar: {len(bars_after_first)} bars")

    # Update with duplicate bar
    await manager.update_bars([bar2])
    bars_after_second = await manager.get_recent_bars("TEST", "1m")
    print(f"After duplicate bar: {len(bars_after_second)} bars")

    if len(bars_after_second) == 1:
        print("✓ PASS: Dedupe works correctly")
        return True
    else:
        print("✗ FAIL: Duplicate bar was not filtered")
        return False


async def test_rolling_avg_5m():
    """Test 2: Rolling 5-minute average"""
    print_section("Test 2: Rolling Average (5 bars)")

    manager = MarketStateManager()
    base_time = datetime.now()

    # Create 10 bars with known prices
    bars = []
    prices = [100, 102, 104, 106, 108, 110, 112, 114, 116, 118]

    for i, price in enumerate(prices):
        bar = PriceBar(
            symbol="TEST",
            timestamp=base_time + timedelta(minutes=i),
            open=price - 1,
            high=price + 1,
            low=price - 2,
            close=price,
            volume=1000,
            timeframe="1m"
        )
        bars.append(bar)

    await manager.update_bars(bars)

    # Get snapshot
    snapshot = await manager.get_snapshot("TEST")

    # Last 5 bars should be: 110, 112, 114, 116, 118
    # Average = (110 + 112 + 114 + 116 + 118) / 5 = 114
    expected_avg = 114.0

    print(f"Last 5 prices: {prices[-5:]}")
    print(f"Expected avg: {expected_avg}")
    print(f"Computed avg: {snapshot.avg_price_5m}")

    if snapshot.avg_price_5m == expected_avg:
        print("✓ PASS: Rolling avg calculated correctly")
        return True
    else:
        print(f"✗ FAIL: Expected {expected_avg}, got {snapshot.avg_price_5m}")
        return False


async def test_rsi14():
    """Test 3: RSI calculation"""
    print_section("Test 3: RSI14 Calculation")

    manager = MarketStateManager()
    base_time = datetime.now()

    # Create trending data (uptrend then downtrend)
    # 20 bars: first 10 up, last 10 down
    bars = []
    for i in range(20):
        if i < 10:
            # Uptrend
            price = 100 + i * 2
        else:
            # Downtrend
            price = 120 - (i - 10) * 2

        bar = PriceBar(
            symbol="TEST",
            timestamp=base_time + timedelta(days=i),
            open=price - 1,
            high=price + 1,
            low=price - 2,
            close=price,
            volume=10000,
            timeframe="1d"
        )
        bars.append(bar)

    await manager.update_bars(bars)
    snapshot = await manager.get_snapshot("TEST")

    print(f"Price trend: Up (100→118), then Down (118→102)")
    print(f"Computed RSI14: {snapshot.rsi14}")

    # After downtrend, RSI should be < 50
    if snapshot.rsi14 is not None and snapshot.rsi14 < 50:
        print("✓ PASS: RSI14 reflects downtrend")
        return True
    else:
        print(f"✗ FAIL: RSI14 should be < 50 after downtrend, got {snapshot.rsi14}")
        return False


async def test_session_reset():
    """Test 4: Session reset on new day"""
    print_section("Test 4: Session Reset")

    manager = MarketStateManager()

    # Day 1 bars
    day1_time = datetime.now().replace(hour=9, minute=0, second=0, microsecond=0)
    bar1 = PriceBar(
        symbol="TEST",
        timestamp=day1_time,
        open=100,
        high=110,
        low=95,
        close=105,
        volume=1000,
        timeframe="1m"
    )

    await manager.update_bars([bar1])
    snapshot1 = await manager.get_snapshot("TEST")

    print(f"Day 1 - Session high: {snapshot1.session_high}, low: {snapshot1.session_low}")

    # Day 2 bars (next day)
    day2_time = day1_time + timedelta(days=1)
    bar2 = PriceBar(
        symbol="TEST",
        timestamp=day2_time,
        open=120,
        high=125,
        low=118,
        close=122,
        volume=2000,
        timeframe="1m"
    )

    await manager.update_bars([bar2])
    snapshot2 = await manager.get_snapshot("TEST")

    print(f"Day 2 - Session high: {snapshot2.session_high}, low: {snapshot2.session_low}")

    # Session should reset - day 2 high should be 125, not 110
    if snapshot2.session_high == 125 and snapshot2.session_low == 118:
        print("✓ PASS: Session reset on new day")
        return True
    else:
        print("✗ FAIL: Session did not reset correctly")
        return False


async def test_stale_detection():
    """Test 5: Stale detection"""
    print_section("Test 5: Stale Detection")

    manager = MarketStateManager()

    # Create bar with old timestamp (6 minutes ago)
    old_time = datetime.now() - timedelta(minutes=6)
    bar = PriceBar(
        symbol="TEST",
        timestamp=old_time,
        open=100,
        high=105,
        low=99,
        close=103,
        volume=1000,
        timeframe="1m"
    )

    await manager.update_bars([bar])

    # Wait a moment for stale check
    await asyncio.sleep(0.1)

    snapshot = await manager.get_snapshot("TEST")

    print(f"Bar timestamp: {old_time}")
    print(f"Current time: {datetime.now()}")
    print(f"Stale flag: {snapshot.stale}")

    if snapshot.stale:
        print("✓ PASS: Stale detection works")
        return True
    else:
        print("✗ FAIL: Data should be marked as stale")
        return False


async def test_ma_computation():
    """Test 6: MA20/MA50 calculation"""
    print_section("Test 6: MA20/MA50 Calculation")

    manager = MarketStateManager()
    base_time = datetime.now()

    # Create 50 bars with steady price increase
    bars = []
    for i in range(50):
        price = 100 + i  # 100, 101, 102, ..., 149
        bar = PriceBar(
            symbol="TEST",
            timestamp=base_time + timedelta(days=i),
            open=price,
            high=price + 1,
            low=price - 1,
            close=price,
            volume=10000,
            timeframe="1d"
        )
        bars.append(bar)

    await manager.update_bars(bars)
    snapshot = await manager.get_snapshot("TEST")

    print(f"Last 50 prices: 100 → 149")
    print(f"MA20: {snapshot.ma20}")
    print(f"MA50: {snapshot.ma50}")

    # MA20 should be higher than MA50 in uptrend
    if snapshot.ma20 and snapshot.ma50 and snapshot.ma20 > snapshot.ma50:
        print("✓ PASS: MA20 > MA50 in uptrend (correct)")
        return True
    else:
        print("✗ FAIL: MA calculation incorrect")
        return False


async def run_all_tests():
    """Run all tests"""
    print("\n╔════════════════════════════════════════════════════════════════╗")
    print("║       Market State Manager - Minimal Test Suite               ║")
    print("╚════════════════════════════════════════════════════════════════╝")

    tests = [
        ("Dedupe", test_dedupe),
        ("Rolling Avg 5m", test_rolling_avg_5m),
        ("RSI14", test_rsi14),
        ("Session Reset", test_session_reset),
        ("Stale Detection", test_stale_detection),
        ("MA20/MA50", test_ma_computation)
    ]

    results = []
    for name, test_func in tests:
        try:
            passed = await test_func()
            results.append((name, passed))
        except Exception as e:
            print(f"\n✗ ERROR in {name}: {e}")
            results.append((name, False))

    # Summary
    print_section("Test Summary")
    passed = sum(1 for _, p in results if p)
    total = len(results)

    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"  {status:8} | {name}")

    print(f"\nTotal: {passed}/{total} tests passed")

    if passed == total:
        print("\n🎉 All tests PASSED ✓")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) FAILED")
        return 1


def main():
    """Main entry point"""
    try:
        exit_code = asyncio.run(run_all_tests())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\nFatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
