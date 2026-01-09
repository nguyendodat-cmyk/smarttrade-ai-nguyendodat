from fastapi import APIRouter, Query
from typing import Optional

from app.services.analytics_service import analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/overview")
async def get_overview(range: str = Query("7d", description="Date range: today, 7d, 30d, 90d, 1y")):
    """Get overview metrics for the analytics dashboard"""
    return await analytics_service.get_overview_metrics(range)


@router.get("/user-growth")
async def get_user_growth(range: str = Query("7d")):
    """Get user growth data over time"""
    return await analytics_service.get_user_growth(range)


@router.get("/revenue")
async def get_revenue(range: str = Query("7d")):
    """Get revenue data over time"""
    return await analytics_service.get_revenue_data(range)


@router.get("/ai-usage")
async def get_ai_usage(range: str = Query("7d")):
    """Get AI usage statistics"""
    return await analytics_service.get_ai_usage(range)


@router.get("/feature-usage")
async def get_feature_usage(range: str = Query("7d")):
    """Get feature usage breakdown"""
    return await analytics_service.get_feature_usage(range)


@router.get("/funnel")
async def get_funnel(range: str = Query("7d")):
    """Get conversion funnel data"""
    return await analytics_service.get_funnel_data(range)


@router.get("/top-stocks")
async def get_top_stocks(
    range: str = Query("7d"),
    limit: int = Query(10, ge=1, le=50)
):
    """Get most viewed stocks"""
    return await analytics_service.get_top_stocks(range, limit)


@router.get("/realtime")
async def get_realtime():
    """Get realtime active users"""
    return await analytics_service.get_realtime_stats()


@router.post("/update-duration")
async def update_duration(data: dict):
    """Update pageview duration (called via sendBeacon)"""
    # This endpoint is called via sendBeacon when user leaves page
    # In production, this would update the pageview record
    return {"status": "ok"}
