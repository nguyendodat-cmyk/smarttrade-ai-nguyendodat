"""
Research API Router
Endpoints cho AI Research Agent
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional

from app.agents.research_synthesizer import research_synthesizer
from app.agents.financial_crawler import financial_crawler
from app.agents.news_agent import news_agent

router = APIRouter(prefix="/research", tags=["Research"])


@router.get("/report/{symbol}")
async def get_research_report(symbol: str):
    """
    Generate full AI research report for a stock symbol.
    This combines financial data, news analysis, and technical indicators.
    """
    try:
        report = await research_synthesizer.generate_full_report(symbol.upper())
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/quick-insight/{symbol}")
async def get_quick_insight(symbol: str):
    """
    Get quick AI insight for a stock symbol.
    Faster than full report, good for overview.
    """
    try:
        insight = await research_synthesizer.generate_quick_insight(symbol.upper())
        return insight
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/financial/{symbol}")
async def get_financial_data(symbol: str):
    """Get financial data summary for a stock"""
    try:
        data = await financial_crawler.get_financial_summary(symbol.upper())
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/news/{symbol}")
async def get_stock_news(
    symbol: str,
    days: int = Query(7, ge=1, le=90, description="Number of days to look back")
):
    """Get analyzed news for a stock"""
    try:
        news = await news_agent.get_news_summary(symbol.upper(), days)
        return news
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch-research")
async def batch_research(symbols: list[str]):
    """
    Generate quick insights for multiple symbols.
    Useful for watchlist overview.
    """
    results = []

    for symbol in symbols[:10]:  # Limit to 10 symbols
        try:
            insight = await research_synthesizer.generate_quick_insight(symbol.upper())
            results.append(insight)
        except Exception as e:
            results.append({
                "symbol": symbol.upper(),
                "error": str(e),
            })

    return {"results": results}


@router.get("/alerts")
async def get_research_alerts(
    user_id: Optional[str] = None,
    unread_only: bool = False,
    limit: int = Query(20, ge=1, le=100)
):
    """
    Get research alerts for a user.
    In production, this would fetch from database.
    """
    # Demo alerts
    demo_alerts = [
        {
            "id": "1",
            "symbol": "FPT",
            "alert_type": "ai_insight",
            "priority": "high",
            "title": "🤖 AI khuyến nghị MUA MẠNH cho FPT",
            "summary": "Kết quả kinh doanh Q4 vượt kỳ vọng, doanh thu tăng 25%",
            "is_read": False,
            "created_at": "2024-12-25T08:00:00Z",
        },
        {
            "id": "2",
            "symbol": "VNM",
            "alert_type": "news",
            "priority": "medium",
            "title": "📰 VNM công bố kế hoạch mở rộng thị trường",
            "summary": "Vinamilk dự kiến đầu tư 500 tỷ vào dây chuyền sản xuất mới",
            "is_read": False,
            "created_at": "2024-12-25T07:30:00Z",
        },
        {
            "id": "3",
            "symbol": "HPG",
            "alert_type": "technical",
            "priority": "medium",
            "title": "📈 HPG breakout khỏi vùng tích lũy",
            "summary": "RSI vượt 60, volume tăng 50% so với trung bình",
            "is_read": True,
            "created_at": "2024-12-24T16:00:00Z",
        },
    ]

    if unread_only:
        demo_alerts = [a for a in demo_alerts if not a["is_read"]]

    return {
        "alerts": demo_alerts[:limit],
        "total": len(demo_alerts),
        "unread_count": len([a for a in demo_alerts if not a["is_read"]]),
    }


@router.post("/alerts/{alert_id}/read")
async def mark_alert_read(alert_id: str):
    """Mark an alert as read"""
    # In production, this would update the database
    return {"success": True, "alert_id": alert_id}
