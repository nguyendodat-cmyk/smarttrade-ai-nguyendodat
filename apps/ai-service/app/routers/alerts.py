"""
Smart Alerts API Router
Endpoints for managing trading alerts with multiple conditions
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid

router = APIRouter(prefix="/alerts", tags=["Smart Alerts"])


# ============================================
# Enums
# ============================================

class Indicator(str, Enum):
    PRICE = "price"
    VOLUME = "volume"
    RSI = "rsi"
    MACD = "macd"
    MA = "ma"
    BB = "bb"
    CHANGE_PERCENT = "change_percent"


class Operator(str, Enum):
    GTE = ">="
    LTE = "<="
    EQ = "="
    GT = ">"
    LT = "<"
    CROSSES_ABOVE = "crosses_above"
    CROSSES_BELOW = "crosses_below"
    TOUCHES_UPPER = "touches_upper"
    TOUCHES_LOWER = "touches_lower"


class LogicOperator(str, Enum):
    AND = "AND"
    OR = "OR"


class CheckInterval(str, Enum):
    ONE_MINUTE = "1m"
    FIVE_MINUTES = "5m"
    FIFTEEN_MINUTES = "15m"
    ONE_HOUR = "1h"


class NotificationChannel(str, Enum):
    PUSH = "push"
    EMAIL = "email"
    IN_APP = "in_app"


# ============================================
# Request/Response Models
# ============================================

class ConditionCreate(BaseModel):
    indicator: Indicator
    operator: Operator
    value: float
    value_secondary: Optional[float] = None
    timeframe: str = "1d"


class ConditionResponse(BaseModel):
    id: str
    indicator: str
    operator: str
    value: float
    value_secondary: Optional[float] = None
    timeframe: str


class AlertCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    symbol: str = Field(..., min_length=1, max_length=10)
    logic_operator: LogicOperator = LogicOperator.AND
    check_interval: CheckInterval = CheckInterval.ONE_MINUTE
    notification_channels: List[NotificationChannel] = [NotificationChannel.PUSH, NotificationChannel.IN_APP]
    conditions: List[ConditionCreate] = Field(..., min_items=1, max_items=10)
    expires_at: Optional[datetime] = None


class AlertUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    is_active: Optional[bool] = None
    logic_operator: Optional[LogicOperator] = None
    check_interval: Optional[CheckInterval] = None
    notification_channels: Optional[List[NotificationChannel]] = None
    conditions: Optional[List[ConditionCreate]] = None
    expires_at: Optional[datetime] = None


class AlertResponse(BaseModel):
    id: str
    user_id: str
    name: str
    symbol: str
    is_active: bool
    logic_operator: str
    check_interval: str
    notification_channels: List[str]
    trigger_count: int
    last_triggered_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    conditions: List[ConditionResponse]
    created_at: datetime
    updated_at: datetime


class AlertHistoryItem(BaseModel):
    id: str
    alert_id: str
    alert_name: str
    symbol: str
    triggered_at: datetime
    trigger_data: dict
    notification_sent: bool


class AlertLimits(BaseModel):
    current_count: int
    max_count: int
    is_premium: bool
    can_create: bool


# ============================================
# Demo Data
# ============================================

DEMO_ALERTS = [
    {
        "id": "alert-001",
        "user_id": "demo-user",
        "name": "VNM Buy Signal",
        "symbol": "VNM",
        "is_active": True,
        "logic_operator": "AND",
        "check_interval": "5m",
        "notification_channels": ["push", "in_app"],
        "trigger_count": 3,
        "last_triggered_at": "2024-12-24T14:30:00Z",
        "expires_at": None,
        "conditions": [
            {"id": "cond-001", "indicator": "price", "operator": "<=", "value": 75000, "value_secondary": None, "timeframe": "1d"},
            {"id": "cond-002", "indicator": "rsi", "operator": "<=", "value": 30, "value_secondary": None, "timeframe": "1d"},
        ],
        "created_at": "2024-12-20T10:00:00Z",
        "updated_at": "2024-12-24T14:30:00Z",
    },
    {
        "id": "alert-002",
        "user_id": "demo-user",
        "name": "FPT Breakout",
        "symbol": "FPT",
        "is_active": True,
        "logic_operator": "OR",
        "check_interval": "1m",
        "notification_channels": ["push", "email", "in_app"],
        "trigger_count": 0,
        "last_triggered_at": None,
        "expires_at": "2025-01-31T23:59:59Z",
        "conditions": [
            {"id": "cond-003", "indicator": "price", "operator": ">=", "value": 150000, "value_secondary": None, "timeframe": "1d"},
            {"id": "cond-004", "indicator": "volume", "operator": ">=", "value": 2000000, "value_secondary": None, "timeframe": "1d"},
        ],
        "created_at": "2024-12-22T08:00:00Z",
        "updated_at": "2024-12-22T08:00:00Z",
    },
    {
        "id": "alert-003",
        "user_id": "demo-user",
        "name": "HPG MACD Cross",
        "symbol": "HPG",
        "is_active": False,
        "logic_operator": "AND",
        "check_interval": "15m",
        "notification_channels": ["in_app"],
        "trigger_count": 5,
        "last_triggered_at": "2024-12-23T09:15:00Z",
        "expires_at": None,
        "conditions": [
            {"id": "cond-005", "indicator": "macd", "operator": "crosses_above", "value": 0, "value_secondary": None, "timeframe": "1d"},
        ],
        "created_at": "2024-12-15T11:00:00Z",
        "updated_at": "2024-12-23T09:15:00Z",
    },
]

DEMO_HISTORY = [
    {
        "id": "hist-001",
        "alert_id": "alert-001",
        "alert_name": "VNM Buy Signal",
        "symbol": "VNM",
        "triggered_at": "2024-12-24T14:30:00Z",
        "trigger_data": {
            "price": 74500,
            "rsi": 28.5,
            "conditions_met": ["price <= 75000", "RSI <= 30"],
        },
        "notification_sent": True,
    },
    {
        "id": "hist-002",
        "alert_id": "alert-001",
        "alert_name": "VNM Buy Signal",
        "symbol": "VNM",
        "triggered_at": "2024-12-23T10:15:00Z",
        "trigger_data": {
            "price": 73200,
            "rsi": 25.3,
            "conditions_met": ["price <= 75000", "RSI <= 30"],
        },
        "notification_sent": True,
    },
    {
        "id": "hist-003",
        "alert_id": "alert-003",
        "alert_name": "HPG MACD Cross",
        "symbol": "HPG",
        "triggered_at": "2024-12-23T09:15:00Z",
        "trigger_data": {
            "macd_line": 0.15,
            "signal_line": 0.08,
            "conditions_met": ["MACD crosses above signal"],
        },
        "notification_sent": True,
    },
]


# ============================================
# Endpoints
# ============================================

@router.get("", response_model=List[AlertResponse])
async def list_alerts(
    user_id: Optional[str] = None,
    symbol: Optional[str] = None,
    is_active: Optional[bool] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """
    List all alerts for a user with optional filters.
    """
    # In production: fetch from Supabase
    # For now: return demo data
    await _simulate_delay()

    alerts = DEMO_ALERTS.copy()

    # Apply filters
    if symbol:
        alerts = [a for a in alerts if a["symbol"].upper() == symbol.upper()]
    if is_active is not None:
        alerts = [a for a in alerts if a["is_active"] == is_active]

    # Pagination
    alerts = alerts[offset : offset + limit]

    return alerts


@router.post("", response_model=AlertResponse, status_code=201)
async def create_alert(alert: AlertCreate, user_id: Optional[str] = None):
    """
    Create a new smart alert with conditions.
    """
    await _simulate_delay()

    # Check limits (demo: always allow)
    # In production: check can_create_alert(user_id, is_premium)

    # Create alert
    now = datetime.utcnow().isoformat() + "Z"
    new_alert = {
        "id": f"alert-{uuid.uuid4().hex[:8]}",
        "user_id": user_id or "demo-user",
        "name": alert.name,
        "symbol": alert.symbol.upper(),
        "is_active": True,
        "logic_operator": alert.logic_operator.value,
        "check_interval": alert.check_interval.value,
        "notification_channels": [c.value for c in alert.notification_channels],
        "trigger_count": 0,
        "last_triggered_at": None,
        "expires_at": alert.expires_at.isoformat() if alert.expires_at else None,
        "conditions": [
            {
                "id": f"cond-{uuid.uuid4().hex[:8]}",
                "indicator": c.indicator.value,
                "operator": c.operator.value,
                "value": c.value,
                "value_secondary": c.value_secondary,
                "timeframe": c.timeframe,
            }
            for c in alert.conditions
        ],
        "created_at": now,
        "updated_at": now,
    }

    return new_alert


@router.get("/limits", response_model=AlertLimits)
async def get_alert_limits(user_id: Optional[str] = None):
    """
    Get user's alert limits (free vs premium).
    """
    await _simulate_delay()

    # In production: check user's subscription status
    is_premium = False
    current_count = len(DEMO_ALERTS)
    max_count = 5 if not is_premium else 9999

    return {
        "current_count": current_count,
        "max_count": max_count,
        "is_premium": is_premium,
        "can_create": current_count < max_count,
    }


@router.get("/history", response_model=List[AlertHistoryItem])
async def get_alert_history(
    user_id: Optional[str] = None,
    alert_id: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
):
    """
    Get alert trigger history.
    """
    await _simulate_delay()

    history = DEMO_HISTORY.copy()

    if alert_id:
        history = [h for h in history if h["alert_id"] == alert_id]

    return history[:limit]


@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(alert_id: str):
    """
    Get a specific alert by ID.
    """
    await _simulate_delay()

    alert = next((a for a in DEMO_ALERTS if a["id"] == alert_id), None)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    return alert


@router.put("/{alert_id}", response_model=AlertResponse)
async def update_alert(alert_id: str, update: AlertUpdate):
    """
    Update an existing alert.
    """
    await _simulate_delay()

    alert = next((a for a in DEMO_ALERTS if a["id"] == alert_id), None)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    # Apply updates
    updated = alert.copy()
    if update.name is not None:
        updated["name"] = update.name
    if update.is_active is not None:
        updated["is_active"] = update.is_active
    if update.logic_operator is not None:
        updated["logic_operator"] = update.logic_operator.value
    if update.check_interval is not None:
        updated["check_interval"] = update.check_interval.value
    if update.notification_channels is not None:
        updated["notification_channels"] = [c.value for c in update.notification_channels]
    if update.conditions is not None:
        updated["conditions"] = [
            {
                "id": f"cond-{uuid.uuid4().hex[:8]}",
                "indicator": c.indicator.value,
                "operator": c.operator.value,
                "value": c.value,
                "value_secondary": c.value_secondary,
                "timeframe": c.timeframe,
            }
            for c in update.conditions
        ]

    updated["updated_at"] = datetime.utcnow().isoformat() + "Z"

    return updated


@router.delete("/{alert_id}", status_code=204)
async def delete_alert(alert_id: str):
    """
    Delete an alert.
    """
    await _simulate_delay()

    alert = next((a for a in DEMO_ALERTS if a["id"] == alert_id), None)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    # In production: delete from Supabase
    return None


@router.post("/{alert_id}/toggle", response_model=AlertResponse)
async def toggle_alert(alert_id: str):
    """
    Toggle alert active status.
    """
    await _simulate_delay()

    alert = next((a for a in DEMO_ALERTS if a["id"] == alert_id), None)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    updated = alert.copy()
    updated["is_active"] = not updated["is_active"]
    updated["updated_at"] = datetime.utcnow().isoformat() + "Z"

    return updated


@router.get("/indicators/info")
async def get_indicators_info():
    """
    Get information about available indicators and their operators.
    """
    return {
        "indicators": [
            {
                "id": "price",
                "name": "Giá",
                "description": "Giá hiện tại của cổ phiếu",
                "operators": [">=", "<=", "=", ">", "<"],
                "value_label": "Giá (VND)",
                "value_type": "number",
            },
            {
                "id": "volume",
                "name": "Khối lượng",
                "description": "Khối lượng giao dịch",
                "operators": [">=", "<=", ">", "<"],
                "value_label": "Khối lượng",
                "value_type": "number",
            },
            {
                "id": "change_percent",
                "name": "% Thay đổi",
                "description": "Phần trăm thay đổi giá",
                "operators": [">=", "<=", ">", "<"],
                "value_label": "Phần trăm (%)",
                "value_type": "number",
            },
            {
                "id": "rsi",
                "name": "RSI",
                "description": "Relative Strength Index (0-100)",
                "operators": [">=", "<=", "crosses_above", "crosses_below"],
                "value_label": "RSI (0-100)",
                "value_type": "number",
                "min": 0,
                "max": 100,
            },
            {
                "id": "macd",
                "name": "MACD",
                "description": "MACD crossover với Signal line",
                "operators": ["crosses_above", "crosses_below"],
                "value_label": "Signal value",
                "value_type": "number",
            },
            {
                "id": "ma",
                "name": "MA Crossover",
                "description": "Moving Average crossover",
                "operators": ["crosses_above", "crosses_below"],
                "value_label": "MA Period",
                "value_type": "number",
                "requires_secondary": True,
                "secondary_label": "MA Period 2",
            },
            {
                "id": "bb",
                "name": "Bollinger Bands",
                "description": "Giá chạm Bollinger Band",
                "operators": ["touches_upper", "touches_lower"],
                "value_label": "Deviation",
                "value_type": "number",
                "default_value": 2,
            },
        ],
        "intervals": [
            {"id": "1m", "name": "1 phút"},
            {"id": "5m", "name": "5 phút"},
            {"id": "15m", "name": "15 phút"},
            {"id": "1h", "name": "1 giờ"},
        ],
        "channels": [
            {"id": "push", "name": "Push Notification"},
            {"id": "email", "name": "Email"},
            {"id": "in_app", "name": "In-App"},
        ],
    }


# ============================================
# Insight Pipeline Status Endpoints
# ============================================

@router.get("/pipeline/status")
async def get_pipeline_status():
    """
    Full pipeline ops status with rolling 5-minute counters.
    Includes: polling, state_manager, insight_engine, alert_evaluator, ai_explain.
    """
    from app.services.pipeline_monitor import get_pipeline_monitor
    from app.services.alert_evaluator import get_alert_evaluator
    from app.services.ai_explain_service import get_ai_explain_service

    monitor = get_pipeline_monitor()
    evaluator = get_alert_evaluator()
    explain = get_ai_explain_service()

    # Try to get optional services (may not be initialized yet)
    polling_service = None
    state_manager = None
    insight_engine = None
    try:
        from app.services.market_polling_service import MarketPollingService
        # These would be set via main.py startup; for now use singletons if available
    except Exception:
        pass

    return monitor.get_full_status(
        polling_service=polling_service,
        state_manager=state_manager,
        insight_engine=insight_engine,
        alert_evaluator=evaluator,
        ai_explain_service=explain,
    )


@router.get("/pipeline/recent-notifications")
async def get_recent_notifications(limit: int = Query(20, ge=1, le=100)):
    """
    Get recent alert notifications (in-memory).
    """
    from app.services.alert_evaluator import get_alert_evaluator

    evaluator = get_alert_evaluator()
    notifications = evaluator.get_recent_notifications(limit=limit)

    return [
        {
            "id": n.id,
            "user_id": n.user_id,
            "symbol": n.symbol,
            "insight_code": n.insight_code,
            "severity": n.severity.value,
            "message": n.message,
            "sent_at": n.sent_at.isoformat(),
        }
        for n in notifications
    ]


# ============================================
# Helper Functions
# ============================================

async def _simulate_delay():
    """Simulate network delay for demo mode."""
    import asyncio
    await asyncio.sleep(0.3)
