"""
SSI FastConnect Data Client
Handles authentication and REST calls to SSI FC-Data API v2.
Endpoints: DailyOhlc, IntradayOhlc

Docs: https://guide.ssi.com.vn/ssi-products/fastconnect-data/api-specs
SDK ref: https://github.com/SSI-Securities-Corporation/python-fcdata
"""

import logging
import time
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import httpx

logger = logging.getLogger(__name__)


class SSIClient:
    """
    Async client for SSI FastConnect Data API v2.

    Auth flow:
      POST /api/v2/Market/AccessToken  {consumerID, consumerSecret}
      → Bearer token (cached until expiry)

    Data endpoints (GET, Bearer auth):
      /api/v2/Market/DailyOhlc
      /api/v2/Market/IntradayOhlc
    """

    TOKEN_PATH = "api/v2/Market/AccessToken"
    DAILY_OHLC_PATH = "api/v2/Market/DailyOhlc"
    INTRADAY_OHLC_PATH = "api/v2/Market/IntradayOhlc"

    def __init__(
        self,
        base_url: str,
        consumer_id: str,
        consumer_secret: str,
        timeout: float = 15.0,
    ):
        self.base_url = base_url.rstrip("/")
        self.consumer_id = consumer_id
        self.consumer_secret = consumer_secret
        self.timeout = timeout

        # Token cache
        self._access_token: Optional[str] = None
        self._token_expires_at: float = 0.0  # epoch seconds

        self._http = httpx.AsyncClient(timeout=timeout)

    # ------------------------------------------------------------------
    # Auth
    # ------------------------------------------------------------------

    async def _ensure_token(self) -> str:
        """Get or refresh Bearer token."""
        now = time.time()
        if self._access_token and now < self._token_expires_at - 30:
            return self._access_token

        url = f"{self.base_url}/{self.TOKEN_PATH}"
        payload = {
            "consumerID": self.consumer_id,
            "consumerSecret": self.consumer_secret,
        }
        logger.debug("[SSI] Requesting access token...")
        resp = await self._http.post(url, json=payload)
        resp.raise_for_status()
        body = resp.json()

        # SSI returns: {"data": {"accessToken": "...", ...}, "status": 200, ...}
        data = body.get("data") or body
        self._access_token = data.get("accessToken") or data.get("access_token")
        if not self._access_token:
            raise ValueError(f"[SSI] No accessToken in response: {body}")

        # Cache for 23 hours (token validity is typically 24h)
        self._token_expires_at = now + 23 * 3600
        logger.info("[SSI] Access token acquired, cached until %s",
                     datetime.fromtimestamp(self._token_expires_at).isoformat())
        return self._access_token

    def _auth_headers(self, token: str) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

    # ------------------------------------------------------------------
    # Data endpoints
    # ------------------------------------------------------------------

    async def _get(self, path: str, params: Dict[str, Any]) -> Optional[Dict]:
        """Authenticated GET request with dev-mode raw logging."""
        token = await self._ensure_token()
        url = f"{self.base_url}/{path}"
        resp = await self._http.get(url, params=params, headers=self._auth_headers(token))

        # ── DEV LOG: raw response ──────────────────────────────────
        raw = resp.json()
        data_list = (raw.get("data") or [])
        record_count = len(data_list) if isinstance(data_list, list) else "N/A"

        # Timestamp of first & last record (if available)
        ts_info = ""
        if isinstance(data_list, list) and data_list:
            first = data_list[0]
            last = data_list[-1]
            ts_info = (
                f"  first_record: TradingDate={first.get('TradingDate')}, Time={first.get('Time', 'N/A')}\n"
                f"  last_record:  TradingDate={last.get('TradingDate')}, Time={last.get('Time', 'N/A')}"
            )

        logger.info(
            "[SSI][DEV] %s → status=%s, records=%s, http=%d\n%s",
            path, raw.get("status"), record_count, resp.status_code, ts_info,
        )
        logger.debug("[SSI][DEV] Raw response (first 2 records): %s",
                      data_list[:2] if isinstance(data_list, list) else data_list)
        # ───────────────────────────────────────────────────────────

        resp.raise_for_status()
        return raw

    # ------------------------------------------------------------------
    # Public API — called by MarketPollingService
    # ------------------------------------------------------------------

    async def get_daily_ohlc(
        self,
        symbol: str,
        count: int = 50,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Fetch daily OHLC bars from SSI.

        SSI endpoint: GET /api/v2/Market/DailyOhlc
        Params: symbol, fromDate (dd/MM/yyyy), toDate, pageIndex, pageSize, ascending
        Response data fields: Symbol, TradingDate, Open, High, Low, Close, Volume, Value
        """
        today = datetime.now()
        if not to_date:
            to_date = today.strftime("%d/%m/%Y")
        if not from_date:
            from_date = (today - timedelta(days=int(count * 1.6))).strftime("%d/%m/%Y")

        params = {
            "symbol": symbol.upper(),
            "fromDate": from_date,
            "toDate": to_date,
            "pageIndex": 1,
            "pageSize": count,
            "ascending": "false",  # newest first
        }

        raw = await self._get(self.DAILY_OHLC_PATH, params)
        if not raw:
            return []

        rows = raw.get("data") or []
        if not isinstance(rows, list):
            return []

        bars = []
        for r in rows:
            bars.append({
                "timestamp": _parse_trading_date(r.get("TradingDate", "")),
                "open": _safe_float(r.get("Open")),
                "high": _safe_float(r.get("High")),
                "low": _safe_float(r.get("Low")),
                "close": _safe_float(r.get("Close")),
                "volume": _safe_int(r.get("Volume")),
            })
        return bars

    async def get_intraday_ohlc(
        self,
        symbol: str,
        resolution: str = "1",
        count: int = 60,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Fetch intraday OHLC bars from SSI.

        SSI endpoint: GET /api/v2/Market/IntradayOhlc
        Params: symbol, fromDate (dd/MM/yyyy), toDate, pageIndex, pageSize, ascending, resolution
        Response data fields: Symbol, TradingDate, Time, Open, High, Low, Close, Volume, Value

        NOTE: Resolution = minutes (1, 5, 15, 30, 60).
        SSI gói cơ bản chỉ có daily; intraday cần gói nâng cao.
        Nếu gói không hỗ trợ, endpoint trả data=[] hoặc lỗi 403.
        """
        today = datetime.now()
        if not to_date:
            to_date = today.strftime("%d/%m/%Y")
        if not from_date:
            from_date = to_date  # intraday: same day

        params = {
            "symbol": symbol.upper(),
            "fromDate": from_date,
            "toDate": to_date,
            "pageIndex": 1,
            "pageSize": count,
            "ascending": "false",
            "resolution": int(resolution),
        }

        raw = await self._get(self.INTRADAY_OHLC_PATH, params)
        if not raw:
            return []

        rows = raw.get("data") or []
        if not isinstance(rows, list):
            return []

        bars = []
        for r in rows:
            bars.append({
                "timestamp": _parse_intraday_timestamp(
                    r.get("TradingDate", ""), r.get("Time", "")
                ),
                "open": _safe_float(r.get("Open")),
                "high": _safe_float(r.get("High")),
                "low": _safe_float(r.get("Low")),
                "close": _safe_float(r.get("Close")),
                "volume": _safe_int(r.get("Volume")),
            })
        return bars

    async def close(self):
        await self._http.aclose()


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

def _safe_float(val: Any) -> float:
    try:
        return float(val) if val is not None else 0.0
    except (ValueError, TypeError):
        return 0.0


def _safe_int(val: Any) -> int:
    try:
        return int(float(val)) if val is not None else 0
    except (ValueError, TypeError):
        return 0


def _parse_trading_date(s: str) -> datetime:
    """Parse SSI TradingDate string (multiple formats)."""
    for fmt in ("%d/%m/%Y", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(s.strip(), fmt)
        except (ValueError, AttributeError):
            continue
    return datetime.now()


def _parse_intraday_timestamp(trading_date: str, time_str: str) -> datetime:
    """Combine TradingDate + Time into a datetime."""
    dt = _parse_trading_date(trading_date)
    if time_str:
        try:
            parts = time_str.strip().split(":")
            dt = dt.replace(hour=int(parts[0]), minute=int(parts[1]),
                            second=int(parts[2]) if len(parts) > 2 else 0)
        except (ValueError, IndexError):
            pass
    return dt
