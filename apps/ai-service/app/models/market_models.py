"""
Market Data Models - Pydantic schemas for SSI market data API
"""
from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, Field


# ========================================
# Securities Models
# ========================================

class SecurityInfo(BaseModel):
    """Stock/security information"""
    symbol: str = Field(..., description="Stock symbol")
    company_name: Optional[str] = Field(None, description="Company name", alias="companyName")
    exchange: Optional[str] = Field(None, description="Exchange (HOSE, HNX, UPCOM)")
    sector: Optional[str] = Field(None, description="Industry sector")
    industry: Optional[str] = Field(None, description="Industry classification")

    class Config:
        populate_by_name = True


class SecuritiesListResponse(BaseModel):
    """Response for securities list endpoint"""
    data: List[SecurityInfo]
    total_count: int = Field(..., alias="totalCount")
    page_index: int = Field(..., alias="pageIndex")
    page_size: int = Field(..., alias="pageSize")

    class Config:
        populate_by_name = True


# ========================================
# OHLCV Models
# ========================================

class OHLCBar(BaseModel):
    """Single OHLC candlestick bar"""
    trading_date: str = Field(..., description="Trading date", alias="tradingDate")
    open: float = Field(..., description="Open price")
    high: float = Field(..., description="High price")
    low: float = Field(..., description="Low price")
    close: float = Field(..., description="Close price")
    volume: int = Field(..., description="Trading volume")
    value: Optional[float] = Field(None, description="Trading value")

    class Config:
        populate_by_name = True


class OHLCVRequest(BaseModel):
    """Request parameters for OHLCV data"""
    symbol: str = Field(..., description="Stock symbol (e.g., VIC)")
    from_date: date = Field(..., description="Start date")
    to_date: date = Field(..., description="End date")
    page_index: int = Field(1, ge=1, description="Page number (1-based)")
    page_size: int = Field(100, ge=1, le=500, description="Items per page")
    ascending: bool = Field(True, description="Sort order by date")


class OHLCVResponse(BaseModel):
    """Response with OHLCV data"""
    data: List[OHLCBar]
    total_count: Optional[int] = Field(None, alias="totalCount")
    page_index: Optional[int] = Field(None, alias="pageIndex")
    page_size: Optional[int] = Field(None, alias="pageSize")

    class Config:
        populate_by_name = True


# ========================================
# Real-time Quote Models
# ========================================

class QuoteData(BaseModel):
    """Real-time quote data for a stock"""
    symbol: str
    exchange: Optional[str] = None
    last_price: Optional[float] = Field(None, alias="lastPrice")
    last_volume: Optional[int] = Field(None, alias="lastVolume")
    change: Optional[float] = Field(None, description="Price change")
    change_percent: Optional[float] = Field(None, alias="changePercent")
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    volume: Optional[int] = None
    value: Optional[float] = None
    best_bid_price: Optional[float] = Field(None, alias="bestBidPrice")
    best_bid_volume: Optional[int] = Field(None, alias="bestBidVolume")
    best_ask_price: Optional[float] = Field(None, alias="bestAskPrice")
    best_ask_volume: Optional[int] = Field(None, alias="bestAskVolume")
    ceiling_price: Optional[float] = Field(None, alias="ceilingPrice")
    floor_price: Optional[float] = Field(None, alias="floorPrice")
    reference_price: Optional[float] = Field(None, alias="referencePrice")

    class Config:
        populate_by_name = True


class MultiQuoteResponse(BaseModel):
    """Response for multiple quotes"""
    data: List[QuoteData]


# ========================================
# Index Models
# ========================================

class IndexInfo(BaseModel):
    """Market index information"""
    index_code: str = Field(..., alias="indexCode")
    index_name: Optional[str] = Field(None, alias="indexName")
    index_value: Optional[float] = Field(None, alias="indexValue")
    change: Optional[float] = None
    change_percent: Optional[float] = Field(None, alias="changePercent")
    total_volume: Optional[int] = Field(None, alias="totalVolume")
    total_value: Optional[float] = Field(None, alias="totalValue")

    class Config:
        populate_by_name = True


class IndexListResponse(BaseModel):
    """Response for index list"""
    data: List[IndexInfo]


class IndexComponent(BaseModel):
    """Stock component in an index"""
    symbol: str
    weight: Optional[float] = Field(None, description="Weight in index (%)")
    company_name: Optional[str] = Field(None, alias="companyName")

    class Config:
        populate_by_name = True


class IndexComponentsResponse(BaseModel):
    """Response for index components"""
    index_code: str = Field(..., alias="indexCode")
    data: List[IndexComponent]

    class Config:
        populate_by_name = True


# ========================================
# Request Models for API Endpoints
# ========================================

class SecuritiesListRequest(BaseModel):
    """Request parameters for securities list"""
    market: Optional[str] = Field(None, description="Market filter (HOSE, HNX, UPCOM)")
    page_index: int = Field(1, ge=1, description="Page number")
    page_size: int = Field(100, ge=1, le=500, description="Items per page")


class MultiQuoteRequest(BaseModel):
    """Request for multiple stock quotes"""
    symbols: List[str] = Field(..., description="List of stock symbols", max_length=50)


# ========================================
# Health Check Response
# ========================================

class SSIHealthResponse(BaseModel):
    """SSI API health check response"""
    status: str = Field(..., description="Connection status")
    configured: bool = Field(..., description="Whether SSI credentials are configured")
    base_url: str = Field(..., description="SSI API base URL")
    message: Optional[str] = Field(None, description="Additional information")
