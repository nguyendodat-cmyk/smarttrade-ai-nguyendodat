"""
Sprint C.1.1: Pipeline Ops Monitor
Rolling time-window counters for operational visibility.
Aggregates stats from Polling, StateManager, InsightEngine, AlertEvaluator.
"""

import time
from collections import deque
from typing import Deque, Dict, Tuple


class RollingCounter:
    """Counts events within a sliding time window."""

    def __init__(self, window_seconds: int = 300):
        self._window = window_seconds
        self._events: Deque[float] = deque()  # timestamps
        self._total: int = 0

    def record(self):
        now = time.time()
        self._events.append(now)
        self._total += 1

    def count_in_window(self) -> int:
        self._prune()
        return len(self._events)

    @property
    def total(self) -> int:
        return self._total

    def _prune(self):
        cutoff = time.time() - self._window
        while self._events and self._events[0] < cutoff:
            self._events.popleft()


class PipelineMonitor:
    """
    Centralized ops monitor for the insight pipeline.
    Provides a single /pipeline/status snapshot with rolling window stats.
    """

    def __init__(self, window_seconds: int = 300):
        self._window = window_seconds
        self._started_at = time.time()

        # Rolling counters
        self.insights_counter = RollingCounter(window_seconds)
        self.alerts_counter = RollingCounter(window_seconds)
        self.daily_cap_hits_counter = RollingCounter(window_seconds)

    def record_insight(self):
        self.insights_counter.record()

    def record_alert(self):
        self.alerts_counter.record()

    def record_daily_cap_hit(self):
        self.daily_cap_hits_counter.record()

    def register_services(
        self,
        polling_service=None,
        state_manager=None,
        insight_engine=None,
        alert_evaluator=None,
        ai_explain_service=None,
    ):
        """Register service references for status reporting."""
        if polling_service:
            self._polling_service = polling_service
        if state_manager:
            self._state_manager = state_manager
        if insight_engine:
            self._insight_engine = insight_engine
        if alert_evaluator:
            self._alert_evaluator = alert_evaluator
        if ai_explain_service:
            self._ai_explain_service = ai_explain_service

    def get_full_status(
        self,
        polling_service=None,
        state_manager=None,
        insight_engine=None,
        alert_evaluator=None,
        ai_explain_service=None,
    ) -> Dict:
        """Build the complete pipeline status response."""
        # Fall back to registered services if not passed explicitly
        polling_service = polling_service or getattr(self, "_polling_service", None)
        state_manager = state_manager or getattr(self, "_state_manager", None)
        insight_engine = insight_engine or getattr(self, "_insight_engine", None)
        alert_evaluator = alert_evaluator or getattr(self, "_alert_evaluator", None)
        ai_explain_service = ai_explain_service or getattr(self, "_ai_explain_service", None)

        # Polling
        polling_status = {"available": False}
        if polling_service:
            ps = polling_service.get_stats()
            polling_status = {
                "available": True,
                "running": ps.get("running", False),
                "last_poll_at": ps.get("last_poll_at"),
                "symbols_default": ps.get("symbols_default", 0),
                "symbols_watchlist": ps.get("symbols_watchlist", 0),
                "symbols_hot": ps.get("symbols_hot", 0),
                "symbols_tracked": (
                    ps.get("symbols_default", 0)
                    + ps.get("symbols_watchlist", 0)
                    + ps.get("symbols_hot", 0)
                ),
                "polls_total": ps.get("polls_total", 0),
                "polls_error": ps.get("polls_error", 0),
                "intervals": {
                    "default": polling_service.intervals.get("default", 60)
                    if hasattr(polling_service, "intervals") else 60,
                    "watchlist": 30,
                    "hot": 15,
                },
            }

        # State Manager
        state_status = {"available": False}
        if state_manager:
            tracked = state_manager.get_tracked_symbols()
            stale_count = 0
            for sym in tracked:
                st = state_manager._states.get(sym)
                if st and st.last_updated:
                    from datetime import datetime, timedelta
                    elapsed = (datetime.utcnow() - st.last_updated).total_seconds()
                    if elapsed > state_manager.stale_threshold:
                        stale_count += 1
            state_status = {
                "available": True,
                "symbols_in_state": len(tracked),
                "stale_symbols": stale_count,
            }

        # Insight Engine
        insight_status = {"available": False}
        if insight_engine:
            ie_stats = insight_engine.get_stats()
            insight_status = {
                "available": True,
                "insights_last_5m": self.insights_counter.count_in_window(),
                "insights_total": ie_stats.get("insights_detected", 0),
                "insights_deduplicated": ie_stats.get("insights_deduplicated", 0),
                "analyses_run": ie_stats.get("analyses_run", 0),
                "insights_by_code": ie_stats.get("insights_by_code", {}),
            }

        # Alert Evaluator
        alert_status = {"available": False}
        if alert_evaluator:
            ae_stats = alert_evaluator.get_stats()
            alert_status = {
                "available": True,
                "alerts_last_5m": self.alerts_counter.count_in_window(),
                "alerts_today": ae_stats.get("notifications_sent", 0),
                "daily_cap_hits": self.daily_cap_hits_counter.count_in_window(),
                "evaluations": ae_stats.get("evaluations", 0),
                "matches": ae_stats.get("matches", 0),
                "cooldown_skipped": ae_stats.get("cooldown_skipped", 0),
                "daily_limit_skipped": ae_stats.get("daily_limit_skipped", 0),
            }

        # AI Explain
        explain_status = {"available": False}
        if ai_explain_service:
            explain_status = {
                "available": True,
                **ai_explain_service.get_stats(),
            }

        return {
            "uptime_seconds": round(time.time() - self._started_at),
            "window_seconds": self._window,
            "polling": polling_status,
            "state_manager": state_status,
            "insight_engine": insight_status,
            "alert_evaluator": alert_status,
            "ai_explain": explain_status,
        }


# Singleton
_monitor_instance = None


def get_pipeline_monitor(window_seconds: int = 300) -> PipelineMonitor:
    global _monitor_instance
    if _monitor_instance is None:
        _monitor_instance = PipelineMonitor(window_seconds=window_seconds)
    return _monitor_instance
