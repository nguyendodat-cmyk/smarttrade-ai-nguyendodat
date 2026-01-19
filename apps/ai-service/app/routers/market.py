"""
Market Data Router - API endpoints for SSI market data

Endpoints:
- GET /market/securities - List all securities
- GET /market/securities/{symbol} - Get security details
- GET /market/ohlc/daily - Daily OHLCV data
- GET /market/ohlc/intraday - Intraday OHLCV data
- POST /market/quotes - Real-time quotes for multiple symbols
- GET /market/indices - List all indices
- GET /market/indices/{index_code}/components - Index constituents
- GET /market/health - SSI API health check
"""
import logging
from datetime import date
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query

from app.services.ssi_client import get_ssi_client
from app.models.market_models import (
    SecuritiesListRequest,
    SecuritiesListResponse,
    SecurityInfo,
    OHLCVRequest,
    OHLCVResponse,
    MultiQuoteRequest,
    MultiQuoteResponse,
    IndexListResponse,
    IndexComponentsResponse,
    SSIHealthResponse
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/market", tags=["market"])


# ========================================
# Health Check
# ========================================

@router.get("/health", response_model=SSIHealthResponse)
async def check_ssi_health():
    """Check SSI API connection and configuration"""
    ssi_client = get_ssi_client()

    if not ssi_client.is_configured():
        return SSIHealthResponse(
            status="not_configured",
            configured=False,
            base_url=ssi_client.base_url,
            message="SSI credentials not configured. Set SSI_CONSUMER_ID and SSI_CONSUMER_SECRET in .env"
        )

    try:
        # Test connection
        is_connected = await ssi_client.test_connection()

        if is_connected:
            return SSIHealthResponse(
                status="healthy",
                configured=True,
                base_url=ssi_client.base_url,
                message="SSI API connection successful"
            )
        else:
            return SSIHealthResponse(
                status="unhealthy",
                configured=True,
                base_url=ssi_client.base_url,
                message="SSI API connection failed"
            )
    except Exception as e:
        logger.error(f"SSI health check failed: {e}")
        return SSIHealthResponse(
            status="error",
            configured=True,
            base_url=ssi_client.base_url,
            message=f"Error: {str(e)}"
        )


# ========================================
# Securities Endpoints
# ========================================

@router.get("/securities")
async def get_securities(
    market: Optional[str] = Query(None, description="Market filter (HOSE, HNX, UPCOM)"),
    page_index: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(100, ge=1, le=500, description="Items per page")
):
    """
    Get list of all securities/stocks

    Returns paginated list of stocks with company info, exchange, sector, etc.
    """
    ssi_client = get_ssi_client()

    if not ssi_client.is_configured():
        raise HTTPException(
            status_code=503,
            detail="SSI API not configured. Please set SSI credentials in environment."
        )

    try:
        result = await ssi_client.get_securities_list(
            market=market,
            page_index=page_index,
            page_size=page_size
        )
        return result
    except Exception as e:
        logger.error(f"Error fetching securities: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch securities: {str(e)}")


@router.get("/securities/{symbol}")
async def get_security_details(symbol: str):
    """
    Get detailed information for a specific security

    Args:
        symbol: Stock symbol (e.g., VIC, VNM, HPG)

    Returns:
        Detailed security information
    """
    ssi_client = get_ssi_client()

    if not ssi_client.is_configured():
        raise HTTPException(status_code=503, detail="SSI API not configured")

    try:
        result = await ssi_client.get_security_details(symbol.upper())
        return result
    except Exception as e:
        logger.error(f"Error fetching security {symbol}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch security details: {str(e)}")


# ========================================
# OHLCV Data Endpoints
# ========================================

@router.get("/ohlc/daily")
async def get_daily_ohlc(
    symbol: str = Query(..., description="Stock symbol"),
    from_date: date = Query(..., description="Start date (YYYY-MM-DD)"),
    to_date: date = Query(..., description="End date (YYYY-MM-DD)"),
    page_index: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(100, ge=1, le=500, description="Items per page"),
    ascending: bool = Query(True, description="Sort by date ascending")
):
    """
    Get daily OHLCV (candlestick) data for a stock

    Returns:
        Historical daily price data with open, high, low, close, volume
    """
    ssi_client = get_ssi_client()

    if not ssi_client.is_configured():
        raise HTTPException(status_code=503, detail="SSI API not configured")

    try:
        result = await ssi_client.get_daily_ohlc(
            symbol=symbol.upper(),
            from_date=from_date,
            to_date=to_date,
            page_index=page_index,
            page_size=page_size,
            ascending=ascending
        )
        return result
    except Exception as e:
        logger.error(f"Error fetching daily OHLC for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch OHLC data: {str(e)}")


@router.get("/ohlc/intraday")
async def get_intraday_ohlc(
    symbol: str = Query(..., description="Stock symbol"),
    from_date: date = Query(..., description="Start date (YYYY-MM-DD)"),
    to_date: date = Query(..., description="End date (YYYY-MM-DD)"),
    page_index: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(100, ge=1, le=500, description="Items per page"),
    ascending: bool = Query(True, description="Sort by time ascending")
):
    """
    Get intraday OHLCV data (1-minute bars)

    Returns:
        Intraday price data with 1-minute resolution
    """
    ssi_client = get_ssi_client()

    if not ssi_client.is_configured():
        raise HTTPException(status_code=503, detail="SSI API not configured")

    try:
        result = await ssi_client.get_intraday_ohlc(
            symbol=symbol.upper(),
            from_date=from_date,
            to_date=to_date,
            page_index=page_index,
            page_size=page_size,
            ascending=ascending
        )
        return result
    except Exception as e:
        logger.error(f"Error fetching intraday OHLC for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch intraday data: {str(e)}")


# ========================================
# Real-time Quotes
# ========================================

@router.post("/quotes")
async def get_multiple_quotes(request: MultiQuoteRequest):
    """
    Get real-time quotes for multiple stocks at once

    Request body:
        {
            "symbols": ["VIC", "VNM", "HPG"]
        }

    Returns:
        Current quotes including last price, bid/ask, volume, etc.
    """
    ssi_client = get_ssi_client()

    if not ssi_client.is_configured():
        raise HTTPException(status_code=503, detail="SSI API not configured")

    try:
        # Convert to uppercase
        symbols = [s.upper() for s in request.symbols]

        result = await ssi_client.get_securities_details_multi(symbols)
        return result
    except Exception as e:
        logger.error(f"Error fetching quotes: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch quotes: {str(e)}")


# ========================================
# Market Indices
# ========================================

@router.get("/indices")
async def get_indices():
    """
    Get list of all market indices

    Returns:
        List of indices (VNINDEX, VN30, HNX, etc.) with current values
    """
    ssi_client = get_ssi_client()

    if not ssi_client.is_configured():
        raise HTTPException(status_code=503, detail="SSI API not configured")

    try:
        result = await ssi_client.get_index_list()
        return result
    except Exception as e:
        logger.error(f"Error fetching indices: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch indices: {str(e)}")


@router.get("/indices/{index_code}/components")
async def get_index_components(index_code: str):
    """
    Get constituent stocks of an index

    Args:
        index_code: Index code (e.g., VNINDEX, VN30, HNX)

    Returns:
        List of stocks in the index with weights
    """
    ssi_client = get_ssi_client()

    if not ssi_client.is_configured():
        raise HTTPException(status_code=503, detail="SSI API not configured")

    try:
        result = await ssi_client.get_index_components(index_code.upper())
        return result
    except Exception as e:
        logger.error(f"Error fetching index components for {index_code}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch index components: {str(e)}")
