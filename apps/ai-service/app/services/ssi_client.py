"""
SSI Client - REST API wrapper for SSI FastConnect Market Data API

Provides methods for:
- Securities list
- Daily OHLCV data
- Intraday data
- Real-time quotes
- Market indices
"""
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, date
import httpx

from app.config import settings
from app.services.ssi_token_manager import get_token_manager

logger = logging.getLogger(__name__)


class SSIClient:
    """Client for SSI FastConnect Market Data API"""

    def __init__(self):
        self.base_url = settings.SSI_BASE_URL
        self.token_manager = get_token_manager()

    async def _make_request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        json: Optional[Dict[str, Any]] = None,
        retry_on_401: bool = True
    ) -> Dict[str, Any]:
        """
        Make authenticated request to SSI API

        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint path
            params: Query parameters
            json: JSON body
            retry_on_401: Retry once with new token if 401 received

        Returns:
            dict: API response data

        Raises:
            Exception: If request fails
        """
        # Get valid token
        token = await self.token_manager.get_token()

        url = f"{self.base_url}{endpoint}"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.request(
                    method=method,
                    url=url,
                    headers=headers,
                    params=params,
                    json=json
                )

                # Handle 401 - token might be expired
                if response.status_code == 401 and retry_on_401:
                    logger.warning("Received 401 from SSI API, refreshing token and retrying")
                    await self.token_manager.invalidate_token()
                    # Retry once with new token
                    return await self._make_request(method, endpoint, params, json, retry_on_401=False)

                response.raise_for_status()
                return response.json()

        except httpx.HTTPStatusError as e:
            logger.error(f"SSI API error: {e.response.status_code} - {e.response.text}")
            raise Exception(f"SSI API error: {e.response.status_code}")
        except httpx.RequestError as e:
            logger.error(f"SSI API request error: {e}")
            raise Exception(f"Failed to connect to SSI API: {e}")
        except Exception as e:
            logger.error(f"Unexpected error in SSI API request: {e}")
            raise

    # ========================================
    # Securities Data
    # ========================================

    async def get_securities_list(
        self,
        market: Optional[str] = None,
        page_index: int = 1,
        page_size: int = 100
    ) -> Dict[str, Any]:
        """
        Get list of securities

        Args:
            market: Market code (HOSE, HNX, UPCOM) - None for all
            page_index: Page number (1-based)
            page_size: Items per page

        Returns:
            dict: {
                "data": [
                    {
                        "symbol": "VIC",
                        "companyName": "Vingroup",
                        "exchange": "HOSE",
                        ...
                    }
                ],
                "totalCount": 100,
                "pageIndex": 1,
                "pageSize": 100
            }
        """
        params = {
            "pageIndex": page_index,
            "pageSize": page_size
        }

        if market:
            params["market"] = market

        return await self._make_request("GET", "/api/v2/Market/Securities", params=params)

    async def get_security_details(self, symbol: str) -> Dict[str, Any]:
        """
        Get detailed information for a specific security

        Args:
            symbol: Stock symbol (e.g., "VIC", "VNM")

        Returns:
            dict: Security details including company info, exchange, sector, etc.
        """
        return await self._make_request("GET", f"/api/v2/Market/Securities/{symbol}")

    # ========================================
    # OHLCV Data (Historical)
    # ========================================

    async def get_daily_ohlc(
        self,
        symbol: str,
        from_date: date,
        to_date: date,
        page_index: int = 1,
        page_size: int = 100,
        ascending: bool = True
    ) -> Dict[str, Any]:
        """
        Get daily OHLCV data for a symbol

        Args:
            symbol: Stock symbol
            from_date: Start date
            to_date: End date
            page_index: Page number
            page_size: Items per page
            ascending: Sort order by date

        Returns:
            dict: {
                "data": [
                    {
                        "tradingDate": "2024-01-15",
                        "open": 100000,
                        "high": 102000,
                        "low": 99000,
                        "close": 101000,
                        "volume": 1000000,
                        ...
                    }
                ]
            }
        """
        params = {
            "symbol": symbol,
            "fromDate": from_date.strftime("%d/%m/%Y"),
            "toDate": to_date.strftime("%d/%m/%Y"),
            "pageIndex": page_index,
            "pageSize": page_size,
            "ascending": ascending
        }

        return await self._make_request("GET", "/api/v2/Market/DailyOhlc", params=params)

    async def get_intraday_ohlc(
        self,
        symbol: str,
        from_date: date,
        to_date: date,
        page_index: int = 1,
        page_size: int = 100,
        ascending: bool = True
    ) -> Dict[str, Any]:
        """
        Get intraday OHLCV data (1-minute bars)

        Args:
            symbol: Stock symbol
            from_date: Start date
            to_date: End date
            page_index: Page number
            page_size: Items per page
            ascending: Sort order

        Returns:
            dict: Intraday OHLCV bars
        """
        params = {
            "symbol": symbol,
            "fromDate": from_date.strftime("%d/%m/%Y"),
            "toDate": to_date.strftime("%d/%m/%Y"),
            "pageIndex": page_index,
            "pageSize": page_size,
            "ascending": ascending
        }

        return await self._make_request("GET", "/api/v2/Market/IntradayOhlc", params=params)

    # ========================================
    # Market Data & Indices
    # ========================================

    async def get_index_components(self, index_code: str) -> Dict[str, Any]:
        """
        Get constituent stocks of an index

        Args:
            index_code: Index code (e.g., "VNINDEX", "VN30")

        Returns:
            dict: List of stocks in the index with weights
        """
        return await self._make_request("GET", f"/api/v2/Market/IndexComponents/{index_code}")

    async def get_index_list(self) -> Dict[str, Any]:
        """
        Get list of all available indices

        Returns:
            dict: List of indices (VNINDEX, VN30, HNX, etc.)
        """
        return await self._make_request("GET", "/api/v2/Market/IndexList")

    # ========================================
    # Real-time Quotes (REST - for polling)
    # ========================================

    async def get_securities_details_multi(self, symbols: List[str]) -> Dict[str, Any]:
        """
        Get real-time details for multiple securities at once

        Args:
            symbols: List of stock symbols (max ~20-50 per request)

        Returns:
            dict: Current quotes for all symbols
        """
        # SSI API expects comma-separated symbols in query param
        symbols_str = ",".join(symbols)
        params = {"symbols": symbols_str}

        return await self._make_request("GET", "/api/v2/Market/SecuritiesDetails", params=params)

    # ========================================
    # Utility Methods
    # ========================================

    def is_configured(self) -> bool:
        """Check if SSI client is properly configured"""
        return self.token_manager.is_configured()

    async def test_connection(self) -> bool:
        """
        Test SSI API connection and authentication

        Returns:
            bool: True if connection successful
        """
        try:
            # Try to get index list as a simple test
            await self.get_index_list()
            return True
        except Exception as e:
            logger.error(f"SSI connection test failed: {e}")
            return False


# Singleton instance
_ssi_client: Optional[SSIClient] = None


def get_ssi_client() -> SSIClient:
    """
    Get singleton SSI client instance

    Returns:
        SSIClient: Global SSI client instance
    """
    global _ssi_client
    if _ssi_client is None:
        _ssi_client = SSIClient()
    return _ssi_client
