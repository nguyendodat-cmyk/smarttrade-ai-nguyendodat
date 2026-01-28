"""
Sprint B.1: Alert Evaluator
Matches InsightEvents from the Insight Engine to user alert conditions.
Handles cooldown management, daily limits, and notification generation.

Flow:
  InsightEvent → match user alerts → cooldown check → daily limit → create notification → record history
"""

import asyncio
import logging
from typing import Callable, Coroutine, Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from collections import defaultdict

from app.models.insight_models import (
    AlertNotification,
    InsightEvent,
    InsightSeverity,
    UserAlert,
)

logger = logging.getLogger(__name__)

# Vietnamese explanation templates per insight_code
VIETNAMESE_TEMPLATES: Dict[str, str] = {
    "PA01": "Nến tăng mạnh với thân nến chiếm {body_percent:.0%} biên độ, giá đóng cửa tăng {close_change_pct:+.1f}% so với mở cửa. Tín hiệu tăng giá trong ngắn hạn.",
    "PA02": "Nến có bóng trên dài ({upper_wick_percent:.0%} biên độ), bị từ chối tại mức {high:,.0f}. Lực bán mạnh ở vùng giá cao.",
    "PA03": "Gap {direction} {gap_percent:+.1f}% so với phiên trước (đóng cửa {prev_close:,.0f} → mở cửa {today_open:,.0f}). Tín hiệu biến động mạnh.",
    "PA04": "Thất bại breakout: chạm đỉnh 20 phiên ({high_20d:,.0f}) nhưng đóng cửa giảm tại {today_close:,.0f}. Cảnh báo đảo chiều.",
    "VA01": "Breakout với khối lượng cao gấp {volume_ratio:.1f} lần trung bình, giá thay đổi {price_change_pct:+.1f}%. Tín hiệu xác nhận xu hướng.",
    "VA02": "Giá tăng {price_change_pct:+.1f}% nhưng khối lượng chỉ đạt {volume_ratio:.0%} trung bình. Phân kỳ giá-khối lượng, tín hiệu yếu.",
    "VA03": "Khối lượng đạt đỉnh ({volume:,}), nằm trong top 5% của 20 phiên gần nhất. Có thể là tín hiệu đảo chiều hoặc bùng nổ.",
    "TM02": "{cross_type_vi}: MA20 ({ma20:,.0f}) cắt {cross_direction} MA50 ({ma50:,.0f}). Tín hiệu {signal_vi} trung hạn.",
    "TM04": "RSI đạt {rsi14:.1f} (quá mua, >70). Cổ phiếu có thể đã tăng quá nhanh, cân nhắc chốt lời.",
    "TM05": "RSI xuống {rsi14:.1f} (quá bán, <30). Cổ phiếu có thể đã giảm quá sâu, cân nhắc mua vào.",
}


def generate_vietnamese_explanation(event: InsightEvent) -> str:
    """Generate Vietnamese explanation from InsightEvent using templates."""
    template = VIETNAMESE_TEMPLATES.get(event.insight_code)
    if not template:
        return event.raw_explanation

    signals = dict(event.signals)

    # Enrich signals for TM02
    if event.insight_code == "TM02":
        cross_type = signals.get("cross_type", "golden")
        signals["cross_type_vi"] = "Golden Cross" if cross_type == "golden" else "Death Cross"
        signals["cross_direction"] = "lên trên" if cross_type == "golden" else "xuống dưới"
        signals["signal_vi"] = "tăng giá" if cross_type == "golden" else "giảm giá"

    # Enrich for PA03
    if event.insight_code == "PA03":
        gap_pct = signals.get("gap_percent", 0)
        signals["direction"] = "tăng" if gap_pct > 0 else "giảm"

    try:
        return template.format(**signals)
    except (KeyError, ValueError) as e:
        logger.warning("Template format error for %s: %s", event.insight_code, e)
        return event.raw_explanation


class AlertEvaluator:
    """
    Evaluates InsightEvents against user alert conditions.

    Responsibilities:
    - Match insights to user alerts (symbol, insight_codes, severity)
    - Cooldown management (avoid notification spam)
    - Daily limit enforcement (max alerts per user per day)
    - Notification generation with Vietnamese explanations
    - Alert history tracking
    """

    def __init__(
        self,
        cooldown_default: int = 300,      # 5 minutes
        cooldown_high: int = 600,          # 10 minutes for high severity
        max_per_user_per_day: int = 50,
        supabase_client=None,
    ):
        self.cooldown_default = cooldown_default
        self.cooldown_high = cooldown_high
        self.max_per_user_per_day = max_per_user_per_day
        self.supabase = supabase_client

        # In-memory state
        # (user_id, symbol, insight_code) -> last_sent_at
        self._cooldown_cache: Dict[Tuple[str, str, str], datetime] = {}
        # user_id -> count today
        self._daily_counts: Dict[str, int] = defaultdict(int)
        self._daily_counts_date: Optional[str] = None

        # Alert history (in-memory fallback)
        self._history: List[AlertNotification] = []

        # Stats
        self._stats = {
            "evaluations": 0,
            "matches": 0,
            "cooldown_skipped": 0,
            "daily_limit_skipped": 0,
            "notifications_sent": 0,
        }

    async def evaluate(self, event: InsightEvent) -> List[AlertNotification]:
        """
        Evaluate a single InsightEvent against all matching user alerts.
        Returns list of notifications to send.
        """
        self._stats["evaluations"] += 1
        self._reset_daily_if_new_day()

        # Get matching alerts
        alerts = await self._get_matching_alerts(event)
        if not alerts:
            return []

        notifications: List[AlertNotification] = []

        for alert in alerts:
            # Check condition match
            if not self._matches_conditions(alert, event):
                continue
            self._stats["matches"] += 1

            # Check cooldown
            if self._in_cooldown(alert.user_id, event):
                self._stats["cooldown_skipped"] += 1
                continue

            # Check daily limit
            if self._daily_counts[alert.user_id] >= self.max_per_user_per_day:
                self._stats["daily_limit_skipped"] += 1
                continue

            # Generate notification
            message = generate_vietnamese_explanation(event)
            notification = AlertNotification(
                user_id=alert.user_id,
                alert_id=alert.id,
                insight_event=event,
                symbol=event.symbol,
                insight_code=event.insight_code,
                severity=event.severity,
                message=f"[{event.symbol}] {message}",
            )

            notifications.append(notification)

            # Update tracking
            self._set_cooldown(alert.user_id, event)
            self._daily_counts[alert.user_id] += 1
            self._history.append(notification)
            self._stats["notifications_sent"] += 1

            # Record to DB
            await self._record_history(notification)

            logger.info(
                "Alert triggered: user=%s symbol=%s code=%s severity=%s",
                alert.user_id, event.symbol, event.insight_code, event.severity,
            )

        return notifications

    async def evaluate_batch(self, events: List[InsightEvent]) -> List[AlertNotification]:
        """Evaluate multiple InsightEvents."""
        all_notifications = []
        for event in events:
            notifs = await self.evaluate(event)
            all_notifications.extend(notifs)
        return all_notifications

    # ============================================
    # Condition Matching
    # ============================================

    def _matches_conditions(self, alert: UserAlert, event: InsightEvent) -> bool:
        """Check if insight matches alert conditions."""
        # Symbol match
        if alert.symbol.upper() != event.symbol.upper():
            return False

        # Insight code filter
        if alert.insight_codes is not None:
            if event.insight_code not in alert.insight_codes:
                return False

        # Severity threshold
        if alert.min_severity is not None:
            if event.severity < alert.min_severity:
                return False

        return True

    # ============================================
    # Cooldown Management
    # ============================================

    def _in_cooldown(self, user_id: str, event: InsightEvent) -> bool:
        """Check if this alert is in cooldown for this user."""
        key = (user_id, event.symbol, event.insight_code)
        last_sent = self._cooldown_cache.get(key)
        if not last_sent:
            return False

        cooldown = self.cooldown_high if event.severity in (
            InsightSeverity.HIGH, InsightSeverity.CRITICAL
        ) else self.cooldown_default

        return (datetime.utcnow() - last_sent).total_seconds() < cooldown

    def _set_cooldown(self, user_id: str, event: InsightEvent):
        key = (user_id, event.symbol, event.insight_code)
        self._cooldown_cache[key] = datetime.utcnow()

    def _reset_daily_if_new_day(self):
        today = datetime.utcnow().strftime("%Y-%m-%d")
        if self._daily_counts_date != today:
            self._daily_counts.clear()
            self._daily_counts_date = today

    # ============================================
    # Alert Fetching
    # ============================================

    async def _get_matching_alerts(self, event: InsightEvent) -> List[UserAlert]:
        """
        Get user alerts that could match this insight.
        Query: enabled=True AND symbol=event.symbol
        """
        # Try Supabase first
        if self.supabase:
            try:
                result = self.supabase.table("smart_alerts").select(
                    "id, user_id, name, symbol, is_active"
                ).eq("symbol", event.symbol.upper()).eq(
                    "is_active", True
                ).execute()

                if result.data:
                    return [
                        UserAlert(
                            id=row["id"],
                            user_id=row["user_id"],
                            name=row["name"],
                            symbol=row["symbol"],
                            # insight_codes and min_severity would come from
                            # extended schema; for now use defaults (match all)
                            insight_codes=None,
                            min_severity=None,
                            enabled=row["is_active"],
                        )
                        for row in result.data
                    ]
            except Exception as e:
                logger.error("Error fetching alerts from DB: %s", e)

        # Fallback: return empty (no alerts configured)
        return []

    # ============================================
    # History Recording
    # ============================================

    async def _record_history(self, notification: AlertNotification):
        """Record notification to alert history (DB or in-memory)."""
        if self.supabase:
            try:
                self.supabase.table("smart_alert_history").insert({
                    "alert_id": notification.alert_id,
                    "user_id": notification.user_id,
                    "trigger_data": {
                        "insight_code": notification.insight_code,
                        "severity": notification.severity.value,
                        "message": notification.message,
                        "signals": notification.insight_event.signals,
                    },
                    "notification_sent": True,
                    "notification_channels": ["in_app"],
                }).execute()
            except Exception as e:
                logger.error("Error recording alert history: %s", e)

    # ============================================
    # Public API
    # ============================================

    def get_stats(self) -> Dict:
        return dict(self._stats)

    def get_recent_notifications(self, limit: int = 20) -> List[AlertNotification]:
        """Get recent notifications from in-memory history."""
        return self._history[-limit:]

    def clear_cooldowns(self):
        """Clear all cooldowns (for testing)."""
        self._cooldown_cache.clear()


# ============================================
# Singleton
# ============================================

_evaluator_instance: Optional[AlertEvaluator] = None


def get_alert_evaluator(
    supabase_client=None,
    cooldown_default: int = 300,
    cooldown_high: int = 600,
    max_per_user_per_day: int = 50,
) -> AlertEvaluator:
    """Get or create AlertEvaluator singleton."""
    global _evaluator_instance
    if _evaluator_instance is None:
        _evaluator_instance = AlertEvaluator(
            cooldown_default=cooldown_default,
            cooldown_high=cooldown_high,
            max_per_user_per_day=max_per_user_per_day,
            supabase_client=supabase_client,
        )
    return _evaluator_instance
