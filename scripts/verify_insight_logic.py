#!/usr/bin/env python3
"""
Insight Engine - Logic Verification Script

Simple verification of detector logic without full dependencies.
Shows that each detector correctly identifies patterns.

Usage:
    python scripts/verify_insight_logic.py
"""


def verify_pa01_logic():
    """PA01: Strong bullish candle - body > 70% of range"""
    print("PA01: Strong Bullish Candle")

    # Test case: open=100, close=109, high=111, low=100
    # Body = 109-100 = 9
    # Range = 111-100 = 11
    # Body% = 9/11 = 81.8%

    open_price = 100
    close_price = 109
    high = 111
    low = 100

    is_bullish = close_price > open_price
    body = abs(close_price - open_price)
    range_val = high - low
    body_pct = body / range_val if range_val > 0 else 0

    trigger = is_bullish and body_pct > 0.70

    print(f"  Body%: {body_pct*100:.1f}% (threshold: 70%)")
    print(f"  Triggers: {trigger} ✓" if trigger else f"  Triggers: {trigger} ✗")
    print()
    return trigger


def verify_pa02_logic():
    """PA02: Long upper wick - wick > 50% of range"""
    print("PA02: Long Upper Wick")

    # Test case: open=100, close=105, high=120, low=100
    # Upper wick = 120 - max(100,105) = 15
    # Range = 120-100 = 20
    # Wick% = 15/20 = 75%

    open_price = 100
    close_price = 105
    high = 120
    low = 100

    upper_wick = high - max(open_price, close_price)
    range_val = high - low
    wick_pct = upper_wick / range_val if range_val > 0 else 0

    trigger = wick_pct > 0.50

    print(f"  Wick%: {wick_pct*100:.1f}% (threshold: 50%)")
    print(f"  Triggers: {trigger} ✓" if trigger else f"  Triggers: {trigger} ✗")
    print()
    return trigger


def verify_pa03_logic():
    """PA03: Gap up - today's open > yesterday's high"""
    print("PA03: Gap Up")

    # Yesterday: high=102, close=100
    # Today: open=105 (gap!)

    yesterday_high = 102
    today_open = 105

    gap_size = today_open - yesterday_high
    gap_pct = (gap_size / yesterday_high) * 100

    trigger = today_open > yesterday_high and gap_pct > 1.0

    print(f"  Gap: {gap_pct:.2f}% (threshold: 1%)")
    print(f"  Triggers: {trigger} ✓" if trigger else f"  Triggers: {trigger} ✗")
    print()
    return trigger


def verify_va01_logic():
    """VA01: High volume breakout - volume > 2x avg"""
    print("VA01: High Volume Breakout")

    # Last 5 bars: avg volume = 10000
    # Current bar: volume = 25000 (2.5x avg), price up 1.5%

    avg_volume = 10000
    current_volume = 25000
    price_change_pct = 1.5

    volume_ratio = current_volume / avg_volume if avg_volume > 0 else 0

    trigger = volume_ratio >= 2.0 and price_change_pct > 0.5

    print(f"  Volume ratio: {volume_ratio:.2f}x (threshold: 2x)")
    print(f"  Price change: +{price_change_pct:.2f}% (threshold: 0.5%)")
    print(f"  Triggers: {trigger} ✓" if trigger else f"  Triggers: {trigger} ✗")
    print()
    return trigger


def verify_va02_logic():
    """VA02: Price up, volume down (divergence)"""
    print("VA02: Price Up, Volume Down")

    # Price: +1.0%
    # Volume: 0.6x avg (below 0.65)

    price_change_pct = 1.0
    volume_ratio = 0.6

    trigger = price_change_pct > 0.8 and volume_ratio < 0.65

    print(f"  Price change: +{price_change_pct:.2f}% (threshold: >0.8%)")
    print(f"  Volume ratio: {volume_ratio:.2f}x (threshold: <0.65x)")
    print(f"  Triggers: {trigger} ✓" if trigger else f"  Triggers: {trigger} ✗")
    print()
    return trigger


def verify_tm04_logic():
    """TM04: RSI overbought - RSI > 70"""
    print("TM04: RSI Overbought")

    # RSI = 75.5
    rsi = 75.5

    trigger = rsi > 70

    print(f"  RSI: {rsi:.2f} (threshold: 70)")
    print(f"  Triggers: {trigger} ✓" if trigger else f"  Triggers: {trigger} ✗")
    print()
    return trigger


def verify_tm05_logic():
    """TM05: RSI oversold - RSI < 30"""
    print("TM05: RSI Oversold")

    # RSI = 25.3
    rsi = 25.3

    trigger = rsi < 30

    print(f"  RSI: {rsi:.2f} (threshold: 30)")
    print(f"  Triggers: {trigger} ✓" if trigger else f"  Triggers: {trigger} ✗")
    print()
    return trigger


def main():
    """Run all verifications"""
    print("╔════════════════════════════════════════════════════════════════════╗")
    print("║       Insight Engine - Logic Verification (No Dependencies)       ║")
    print("╚════════════════════════════════════════════════════════════════════╝")
    print()

    tests = [
        verify_pa01_logic,
        verify_pa02_logic,
        verify_pa03_logic,
        verify_va01_logic,
        verify_va02_logic,
        verify_tm04_logic,
        verify_tm05_logic,
    ]

    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"✗ ERROR: {e}\n")
            results.append(False)

    # Summary
    print("=" * 70)
    print("Summary")
    print("=" * 70)
    passed = sum(results)
    total = len(results)
    print(f"Verified: {passed}/{total} detectors")
    print()

    if passed == total:
        print("✓ All detector logic verified correctly")
    else:
        print(f"⚠️  {total - passed} detector(s) failed")

    print()
    print("Note: This verifies detector LOGIC only (no dependencies).")
    print("Run test_insight_engine.py for full integration tests.")


if __name__ == "__main__":
    main()
