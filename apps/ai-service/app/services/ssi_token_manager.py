"""
SSI Token Manager - Handles JWT authentication with SSI FastConnect API

Features:
- Automatic token fetching from SSI API
- Token caching with expiry tracking
- Auto-refresh before expiration
- Thread-safe token management
"""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional
import httpx

from app.config import settings

logger = logging.getLogger(__name__)


class SSITokenManager:
    """Manages SSI FastConnect API access tokens with automatic refresh"""

    def __init__(self):
        self.access_token: Optional[str] = None
        self.token_expiry: Optional[datetime] = None
        self._lock = asyncio.Lock()
        self.base_url = settings.SSI_BASE_URL
        self.consumer_id = settings.SSI_CONSUMER_ID
        self.consumer_secret = settings.SSI_CONSUMER_SECRET

    async def get_token(self) -> str:
        """
        Get valid access token, fetching new one if necessary

        Returns:
            str: Valid SSI access token

        Raises:
            Exception: If unable to fetch token from SSI API
        """
        async with self._lock:
            # Check if we have a valid cached token
            if self._is_token_valid():
                logger.debug("Using cached SSI token")
                return self.access_token

            # Fetch new token
            logger.info("Fetching new SSI access token")
            await self._fetch_new_token()
            return self.access_token

    def _is_token_valid(self) -> bool:
        """
        Check if current token is valid and not expired

        Returns:
            bool: True if token exists and is still valid
        """
        if not self.access_token or not self.token_expiry:
            return False

        # Refresh 5 minutes before expiry to avoid edge cases
        buffer_time = timedelta(minutes=5)
        return datetime.now() < (self.token_expiry - buffer_time)

    async def _fetch_new_token(self) -> None:
        """
        Fetch new access token from SSI API

        Raises:
            ValueError: If SSI credentials are not configured
            Exception: If API request fails
        """
        if not self.consumer_id or not self.consumer_secret:
            raise ValueError(
                "SSI credentials not configured. Please set SSI_CONSUMER_ID and SSI_CONSUMER_SECRET in .env"
            )

        url = f"{self.base_url}/api/v2/Market/AccessToken"

        payload = {
            "consumerID": self.consumer_id,
            "consumerSecret": self.consumer_secret
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()

                data = response.json()

                # SSI API response format: { "data": { "accessToken": "...", "expiresIn": 3600 } }
                if "data" not in data:
                    raise Exception(f"Unexpected SSI API response format: {data}")

                token_data = data["data"]
                self.access_token = token_data.get("accessToken")
                expires_in = token_data.get("expiresIn", 3600)  # Default 1 hour

                if not self.access_token:
                    raise Exception("No access token in SSI API response")

                # Calculate expiry time
                self.token_expiry = datetime.now() + timedelta(seconds=expires_in)

                logger.info(
                    f"Successfully fetched SSI token (expires in {expires_in}s, at {self.token_expiry})"
                )

        except httpx.HTTPStatusError as e:
            logger.error(f"SSI API authentication failed: {e.response.status_code} - {e.response.text}")
            raise Exception(
                f"SSI API authentication failed: {e.response.status_code}. "
                f"Please check your SSI_CONSUMER_ID and SSI_CONSUMER_SECRET."
            )
        except httpx.RequestError as e:
            logger.error(f"SSI API request error: {e}")
            raise Exception(f"Failed to connect to SSI API: {e}")
        except Exception as e:
            logger.error(f"Unexpected error fetching SSI token: {e}")
            raise

    async def invalidate_token(self) -> None:
        """
        Invalidate current token, forcing refresh on next request
        Useful for handling 401 errors
        """
        async with self._lock:
            logger.info("Invalidating SSI token")
            self.access_token = None
            self.token_expiry = None

    def is_configured(self) -> bool:
        """
        Check if SSI credentials are configured

        Returns:
            bool: True if both consumer_id and consumer_secret are set
        """
        return bool(self.consumer_id and self.consumer_secret)


# Singleton instance
_token_manager: Optional[SSITokenManager] = None


def get_token_manager() -> SSITokenManager:
    """
    Get singleton SSI token manager instance

    Returns:
        SSITokenManager: Global token manager instance
    """
    global _token_manager
    if _token_manager is None:
        _token_manager = SSITokenManager()
    return _token_manager
