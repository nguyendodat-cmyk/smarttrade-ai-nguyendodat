"""
Debug Router — Read-only endpoints for QA/Ops.
Not intended for end-user access.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/debug", tags=["Debug (Ops)"])


@router.get("/market_state")
async def get_market_state_debug():
    """
    Show current market state per symbol: bar counts and indicator readiness.
    Read-only, does not modify state.
    """
    from app.main import state_manager

    result = {}
    for symbol in state_manager.get_tracked_symbols():
        st = state_manager._states.get(symbol)
        if not st:
            continue

        bars_1m = len(st.bars_1m)
        bars_daily = len(st.bars_daily)

        # Indicator readiness
        indicators = {}

        # MA20: needs >= 20 daily bars
        if bars_daily >= 20:
            indicators["MA20"] = "ready"
        else:
            indicators["MA20"] = f"waiting (need 20, have {bars_daily})"

        # MA50: needs >= 50 daily bars
        if bars_daily >= 50:
            indicators["MA50"] = "ready"
        else:
            indicators["MA50"] = f"waiting (need 50, have {bars_daily})"

        # RSI14: needs >= 15 daily bars
        if bars_daily >= 15:
            indicators["RSI14"] = "ready"
        else:
            indicators["RSI14"] = f"waiting (need 15, have {bars_daily})"

        result[symbol] = {
            "bars_1m": bars_1m,
            "bars_daily": bars_daily,
            "indicators": indicators,
            "last_updated": st.last_updated.isoformat() + "Z" if st.last_updated else None,
        }

    return result
