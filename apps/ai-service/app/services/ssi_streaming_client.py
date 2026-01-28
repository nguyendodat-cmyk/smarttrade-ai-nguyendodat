"""
SSI IDS Streaming Client - WebSocket client for SSI FastConnect IDS

Handles real-time market data streaming from SSI IDS (Integrated Data Service).

Features:
- WebSocket connection management
- Authentication with SSI credentials
- Subscribe/Unsubscribe to symbols/channels
- Automatic reconnection on disconnect
- Message callback system
- Heartbeat/ping-pong
- Thread-safe operations

Channels:
- X: Real-time ticks (trades)
- B: Real-time 1-minute bars
- I: Index data
- N: News

Usage:
    client = SSIStreamingClient()
    await client.connect()
    await client.subscribe(["VIC", "VNM", "HPG"], channel="X")
    # Messages will be received via callback
    await client.disconnect()
"""

import asyncio
import logging
import json
from typing import Optional, List, Callable, Dict, Any
from datetime import datetime
import websockets
from websockets.client import WebSocketClientProtocol

from app.config import settings

logger = logging.getLogger(__name__)


class SSIStreamingClient:
    """WebSocket client for SSI FastConnect IDS streaming"""

    def __init__(
        self,
        url: Optional[str] = None,
        public_key: Optional[str] = None,
        private_key: Optional[str] = None,
        on_message: Optional[Callable] = None,
        on_error: Optional[Callable] = None,
        on_connect: Optional[Callable] = None,
        on_disconnect: Optional[Callable] = None
    ):
        """
        Initialize SSI streaming client

        Args:
            url: WebSocket URL (default from settings)
            public_key: SSI public key (default from settings)
            private_key: SSI private key (default from settings)
            on_message: Callback for messages - async function(message: dict)
            on_error: Callback for errors - async function(error: Exception)
            on_connect: Callback on connection - async function()
            on_disconnect: Callback on disconnect - async function()
        """
        self.url = url or settings.SSI_STREAMING_URL
        self.public_key = public_key or settings.SSI_PUBLIC_KEY
        self.private_key = private_key or settings.SSI_PRIVATE_KEY

        # Callbacks
        self.on_message_callback = on_message
        self.on_error_callback = on_error
        self.on_connect_callback = on_connect
        self.on_disconnect_callback = on_disconnect

        # Connection state
        self.ws: Optional[WebSocketClientProtocol] = None
        self.connected = False
        self.authenticated = False
        self.session_id: Optional[str] = None

        # Subscriptions tracking
        self.subscribed_symbols: Dict[str, List[str]] = {}  # channel -> [symbols]

        # Reconnection settings
        self.auto_reconnect = True
        self.reconnect_delay = 5  # seconds
        self.max_reconnect_attempts = 10
        self.reconnect_attempts = 0

        # Tasks
        self._receive_task: Optional[asyncio.Task] = None
        self._heartbeat_task: Optional[asyncio.Task] = None

        # Stats
        self.messages_received = 0
        self.connect_time: Optional[datetime] = None

    def is_configured(self) -> bool:
        """Check if SSI streaming credentials are configured"""
        return bool(self.public_key and self.private_key and self.url)

    async def connect(self) -> bool:
        """
        Connect to SSI IDS WebSocket

        Returns:
            bool: True if connection successful

        Raises:
            Exception: If connection fails and auto_reconnect is False
        """
        if self.connected:
            logger.warning("Already connected to SSI IDS")
            return True

        if not self.is_configured():
            raise ValueError(
                "SSI streaming not configured. Please set SSI_PUBLIC_KEY, "
                "SSI_PRIVATE_KEY, and SSI_STREAMING_URL in .env"
            )

        try:
            logger.info(f"Connecting to SSI IDS WebSocket: {self.url}")

            # Connect to WebSocket
            self.ws = await websockets.connect(
                self.url,
                ping_interval=20,  # Send ping every 20s
                ping_timeout=10,   # Wait 10s for pong
                close_timeout=10
            )

            self.connected = True
            self.connect_time = datetime.now()
            self.reconnect_attempts = 0

            logger.info("✓ Connected to SSI IDS WebSocket")

            # Authenticate
            auth_success = await self._authenticate()
            if not auth_success:
                await self.disconnect()
                raise Exception("Authentication failed")

            # Start background tasks
            self._receive_task = asyncio.create_task(self._receive_loop())
            self._heartbeat_task = asyncio.create_task(self._heartbeat_loop())

            # Call connect callback
            if self.on_connect_callback:
                await self.on_connect_callback()

            return True

        except Exception as e:
            logger.error(f"Failed to connect to SSI IDS: {e}")
            self.connected = False
            self.authenticated = False

            # Auto-reconnect if enabled
            if self.auto_reconnect and self.reconnect_attempts < self.max_reconnect_attempts:
                self.reconnect_attempts += 1
                logger.info(
                    f"Reconnecting in {self.reconnect_delay}s "
                    f"(attempt {self.reconnect_attempts}/{self.max_reconnect_attempts})..."
                )
                await asyncio.sleep(self.reconnect_delay)
                return await self.connect()
            else:
                raise

    async def _authenticate(self) -> bool:
        """
        Authenticate with SSI IDS using public/private key

        Returns:
            bool: True if authentication successful

        Note:
            This is a placeholder implementation. The actual SSI IDS
            authentication protocol needs to be implemented based on
            SSI documentation.
        """
        try:
            logger.info("Authenticating with SSI IDS...")

            # TODO: Replace with actual SSI authentication protocol
            # This is a placeholder - actual format depends on SSI IDS spec

            auth_message = {
                "type": "authenticate",
                "publicKey": self.public_key,
                "privateKey": self.private_key,
                "timestamp": datetime.now().isoformat()
            }

            await self.ws.send(json.dumps(auth_message))

            # Wait for authentication response
            # TODO: Parse actual SSI auth response
            response = await asyncio.wait_for(self.ws.recv(), timeout=10)
            response_data = json.loads(response) if isinstance(response, str) else response

            # Check authentication success
            # TODO: Check actual SSI response format
            if response_data.get("status") == "authenticated":
                self.authenticated = True
                self.session_id = response_data.get("sessionId")
                logger.info(f"✓ Authentication successful (Session: {self.session_id})")
                return True
            else:
                logger.error(f"Authentication failed: {response_data}")
                return False

        except asyncio.TimeoutError:
            logger.error("Authentication timeout - no response from SSI")
            return False
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            return False

    async def subscribe(self, symbols: List[str], channel: str = "X") -> bool:
        """
        Subscribe to symbols on a specific channel

        Args:
            symbols: List of stock symbols (e.g., ["VIC", "VNM", "HPG"])
            channel: Channel type - "X" (ticks), "B" (bars), "I" (index), "N" (news)

        Returns:
            bool: True if subscription successful
        """
        if not self.connected or not self.authenticated:
            raise Exception("Not connected or authenticated. Call connect() first.")

        try:
            # Normalize symbols to uppercase
            symbols = [s.upper() for s in symbols]

            logger.info(f"Subscribing to {len(symbols)} symbols on channel {channel}: {symbols}")

            # TODO: Replace with actual SSI subscribe protocol
            # This is a placeholder - actual format depends on SSI IDS spec

            subscribe_message = {
                "type": "subscribe",
                "channel": channel,
                "symbols": symbols
            }

            await self.ws.send(json.dumps(subscribe_message))

            # Track subscriptions
            if channel not in self.subscribed_symbols:
                self.subscribed_symbols[channel] = []
            self.subscribed_symbols[channel].extend(symbols)
            self.subscribed_symbols[channel] = list(set(self.subscribed_symbols[channel]))  # Remove duplicates

            logger.info(f"✓ Subscribed to {len(symbols)} symbols on channel {channel}")
            return True

        except Exception as e:
            logger.error(f"Subscribe error: {e}")
            return False

    async def unsubscribe(self, symbols: List[str], channel: str = "X") -> bool:
        """
        Unsubscribe from symbols on a specific channel

        Args:
            symbols: List of stock symbols
            channel: Channel type

        Returns:
            bool: True if unsubscribe successful
        """
        if not self.connected:
            logger.warning("Not connected, cannot unsubscribe")
            return False

        try:
            symbols = [s.upper() for s in symbols]

            logger.info(f"Unsubscribing from {len(symbols)} symbols on channel {channel}")

            # TODO: Replace with actual SSI unsubscribe protocol
            unsubscribe_message = {
                "type": "unsubscribe",
                "channel": channel,
                "symbols": symbols
            }

            await self.ws.send(json.dumps(unsubscribe_message))

            # Remove from tracking
            if channel in self.subscribed_symbols:
                for symbol in symbols:
                    if symbol in self.subscribed_symbols[channel]:
                        self.subscribed_symbols[channel].remove(symbol)

            logger.info(f"✓ Unsubscribed from {len(symbols)} symbols")
            return True

        except Exception as e:
            logger.error(f"Unsubscribe error: {e}")
            return False

    async def _receive_loop(self):
        """Background task to receive and process messages"""
        try:
            async for message in self.ws:
                try:
                    self.messages_received += 1

                    # Parse message (JSON or binary)
                    if isinstance(message, str):
                        data = json.loads(message)
                    else:
                        # TODO: Handle binary messages if SSI uses binary protocol
                        data = message

                    # Call message callback
                    if self.on_message_callback:
                        await self.on_message_callback(data)

                except json.JSONDecodeError as e:
                    logger.error(f"JSON decode error: {e}")
                except Exception as e:
                    logger.error(f"Error processing message: {e}")
                    if self.on_error_callback:
                        await self.on_error_callback(e)

        except websockets.ConnectionClosed:
            logger.warning("WebSocket connection closed")
            self.connected = False
            self.authenticated = False

            # Call disconnect callback
            if self.on_disconnect_callback:
                await self.on_disconnect_callback()

            # Auto-reconnect
            if self.auto_reconnect:
                logger.info("Attempting to reconnect...")
                await self.connect()

        except Exception as e:
            logger.error(f"Receive loop error: {e}")
            if self.on_error_callback:
                await self.on_error_callback(e)

    async def _heartbeat_loop(self):
        """Send periodic heartbeat/ping to keep connection alive"""
        try:
            while self.connected:
                await asyncio.sleep(30)  # Every 30 seconds

                if self.connected and self.ws:
                    # TODO: Send actual SSI heartbeat message if required
                    # Some APIs require custom heartbeat, others use WebSocket ping/pong
                    heartbeat_message = {
                        "type": "ping",
                        "timestamp": datetime.now().isoformat()
                    }
                    try:
                        await self.ws.send(json.dumps(heartbeat_message))
                        logger.debug("Heartbeat sent")
                    except Exception as e:
                        logger.error(f"Heartbeat error: {e}")
                        break

        except asyncio.CancelledError:
            logger.debug("Heartbeat loop cancelled")
        except Exception as e:
            logger.error(f"Heartbeat loop error: {e}")

    async def disconnect(self):
        """Gracefully disconnect from SSI IDS"""
        logger.info("Disconnecting from SSI IDS...")

        # Cancel background tasks
        if self._receive_task:
            self._receive_task.cancel()
        if self._heartbeat_task:
            self._heartbeat_task.cancel()

        # Unsubscribe from all symbols
        for channel, symbols in self.subscribed_symbols.items():
            if symbols:
                await self.unsubscribe(symbols, channel)

        # Close WebSocket
        if self.ws:
            await self.ws.close()

        self.connected = False
        self.authenticated = False
        self.session_id = None

        logger.info("✓ Disconnected from SSI IDS")

    def get_status(self) -> Dict[str, Any]:
        """Get current client status"""
        uptime = None
        if self.connect_time:
            uptime = (datetime.now() - self.connect_time).total_seconds()

        return {
            "connected": self.connected,
            "authenticated": self.authenticated,
            "session_id": self.session_id,
            "subscribed_symbols": self.subscribed_symbols,
            "messages_received": self.messages_received,
            "uptime_seconds": uptime,
            "reconnect_attempts": self.reconnect_attempts
        }


# Singleton instance
_streaming_client: Optional[SSIStreamingClient] = None


def get_streaming_client() -> SSIStreamingClient:
    """
    Get singleton SSI streaming client instance

    Returns:
        SSIStreamingClient: Global streaming client instance
    """
    global _streaming_client
    if _streaming_client is None:
        _streaming_client = SSIStreamingClient()
    return _streaming_client
