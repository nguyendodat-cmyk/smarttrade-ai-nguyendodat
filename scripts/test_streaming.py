#!/usr/bin/env python3
"""
SSI IDS Streaming Client - Standalone Test Script

Tests SSI WebSocket streaming connection, authentication, and data reception.

Usage:
    python scripts/test_streaming.py

Requirements:
    - SSI_PUBLIC_KEY and SSI_PRIVATE_KEY in .env
    - Internet connection
    - SSI IDS service running (during market hours for live data)
"""

import asyncio
import sys
import logging
from pathlib import Path
from datetime import datetime

# Add app to path
sys.path.insert(0, str(Path(__file__).parent.parent / "apps" / "ai-service"))

try:
    from app.services.ssi_streaming_client import SSIStreamingClient
    from app.config import settings
    from dotenv import load_dotenv
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Please install dependencies: pip install -r apps/ai-service/requirements.txt")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


class TestStats:
    """Track test statistics"""
    def __init__(self):
        self.ticks_received = 0
        self.errors = 0
        self.start_time = datetime.now()
        self.symbols_seen = set()

    def record_tick(self, symbol: str):
        self.ticks_received += 1
        self.symbols_seen.add(symbol)

    def record_error(self):
        self.errors += 1

    def get_summary(self):
        uptime = (datetime.now() - self.start_time).total_seconds()
        return {
            "ticks_received": self.ticks_received,
            "unique_symbols": len(self.symbols_seen),
            "errors": self.errors,
            "uptime_seconds": int(uptime),
            "ticks_per_second": round(self.ticks_received / uptime, 2) if uptime > 0 else 0
        }


stats = TestStats()


# Callbacks
async def on_message(message: dict):
    """Handle incoming messages from SSI"""
    try:
        # Parse message type
        msg_type = message.get("type", "unknown")

        if msg_type == "tick" or msg_type == "trade":
            # Tick/trade data
            symbol = message.get("sym") or message.get("symbol")
            price = message.get("lastPrice") or message.get("price")
            volume = message.get("lastVolume") or message.get("volume")
            timestamp = message.get("time") or message.get("timestamp")

            if symbol and price:
                stats.record_tick(symbol)

                # Format output
                change = message.get("changePc", 0)
                change_sign = "+" if change >= 0 else ""
                print(
                    f"[TICK] {symbol:6} | "
                    f"Price: {price:>8,.0f} | "
                    f"Vol: {volume:>6} | "
                    f"Time: {timestamp} | "
                    f"Chg: {change_sign}{change:.2f}%"
                )

        elif msg_type == "bar":
            # 1-minute bar data
            symbol = message.get("sym") or message.get("symbol")
            print(f"[BAR] {symbol} | OHLC: {message.get('open')}/{message.get('high')}/{message.get('low')}/{message.get('close')}")

        elif msg_type == "pong" or msg_type == "heartbeat":
            # Heartbeat response - don't print
            pass

        else:
            # Other message types
            logger.debug(f"Received {msg_type}: {message}")

    except Exception as e:
        logger.error(f"Error handling message: {e}")
        stats.record_error()


async def on_error(error: Exception):
    """Handle errors"""
    logger.error(f"Stream error: {error}")
    stats.record_error()


async def on_connect():
    """Handle connection"""
    logger.info("✓ Stream connected and ready")


async def on_disconnect():
    """Handle disconnection"""
    logger.warning("Stream disconnected")


def print_header():
    """Print test header"""
    print("╔═══════════════════════════════════════════════════════════════╗")
    print("║          SSI IDS Streaming Client - Test Script              ║")
    print("╚═══════════════════════════════════════════════════════════════╝")
    print()


def print_config():
    """Print configuration"""
    logger.info("Loading configuration...")

    # Load .env
    env_path = Path(__file__).parent.parent / "apps" / "ai-service" / ".env"
    if env_path.exists():
        load_dotenv(env_path)
        logger.info(f"✓ Loaded .env from: {env_path}")
    else:
        logger.warning(f"⚠️  .env file not found at: {env_path}")

    # Check config
    logger.info(f"✓ SSI_STREAMING_URL: {settings.SSI_STREAMING_URL}")

    if settings.SSI_PUBLIC_KEY:
        logger.info(f"✓ SSI_PUBLIC_KEY configured ({len(settings.SSI_PUBLIC_KEY)} chars)")
    else:
        logger.error("❌ SSI_PUBLIC_KEY not configured")

    if settings.SSI_PRIVATE_KEY:
        logger.info(f"✓ SSI_PRIVATE_KEY configured ({len(settings.SSI_PRIVATE_KEY)} chars)")
    else:
        logger.error("❌ SSI_PRIVATE_KEY not configured")

    if not settings.SSI_PUBLIC_KEY or not settings.SSI_PRIVATE_KEY:
        print()
        print("⚠️  SSI IDS credentials not configured!")
        print()
        print("To get SSI IDS streaming credentials:")
        print("  1. Contact SSI support: api@ssi.com.vn")
        print("  2. Request IDS streaming access")
        print("  3. Receive Public Key + Private Key")
        print("  4. Add to apps/ai-service/.env:")
        print("     SSI_PUBLIC_KEY=your-public-key")
        print("     SSI_PRIVATE_KEY=your-private-key")
        print()
        return False

    print()
    return True


async def run_test():
    """Run streaming test"""

    # Print header
    print_header()

    # Check config
    if not print_config():
        return

    # Test symbols
    test_symbols = ["VIC", "VNM", "HPG", "VCB", "TCB"]

    logger.info(f"Test symbols: {', '.join(test_symbols)}")
    print()

    # Create client with callbacks
    client = SSIStreamingClient(
        on_message=on_message,
        on_error=on_error,
        on_connect=on_connect,
        on_disconnect=on_disconnect
    )

    try:
        # Connect
        logger.info("Connecting to SSI IDS WebSocket...")
        await client.connect()

        # Subscribe
        logger.info(f"Subscribing to {len(test_symbols)} symbols...")
        await client.subscribe(test_symbols, channel="X")  # X = ticks/trades
        print()

        # Receive ticks
        logger.info("Receiving ticks... (Press Ctrl+C to stop)")
        print()

        # Print status every 10 seconds
        while client.connected:
            await asyncio.sleep(10)

            # Print separator and stats
            print("─" * 64)
            summary = stats.get_summary()
            print(f"Ticks received: {summary['ticks_received']}")
            print(f"Unique symbols: {summary['unique_symbols']}")
            print(f"Uptime: {summary['uptime_seconds']}s")
            print(f"Ticks/sec: {summary['ticks_per_second']}")

            # Print client status
            status = client.get_status()
            print(f"Status: {'Connected' if status['connected'] else 'Disconnected'}")
            print("─" * 64)
            print()

    except KeyboardInterrupt:
        print()
        logger.info("Shutting down...")

    except Exception as e:
        logger.error(f"Test error: {e}", exc_info=True)

    finally:
        # Disconnect
        if client.connected:
            logger.info("Disconnecting...")
            await client.disconnect()

        # Print summary
        print()
        print("╔═══════════════════════════════════════════════════════════════╗")
        print("║                    Test Summary                               ║")
        print("╚═══════════════════════════════════════════════════════════════╝")
        print()

        summary = stats.get_summary()
        print(f"  Ticks received: {summary['ticks_received']}")
        print(f"  Unique symbols: {summary['unique_symbols']}")
        print(f"  Errors: {summary['errors']}")
        print(f"  Uptime: {summary['uptime_seconds']}s")
        print(f"  Avg ticks/sec: {summary['ticks_per_second']}")
        print()

        # Test result
        if summary['ticks_received'] > 0 and summary['errors'] == 0:
            print("✓ Test PASSED")
        elif summary['ticks_received'] > 0:
            print("⚠️  Test PASSED with errors")
        else:
            print("❌ Test FAILED - No ticks received")
        print()


def main():
    """Main entry point"""
    try:
        asyncio.run(run_test())
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
