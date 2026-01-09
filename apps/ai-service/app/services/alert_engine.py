"""
Alert Engine Service
Handles checking alert conditions against real-time market data
and triggering notifications when conditions are met.
"""

from typing import Dict, List, Optional, Any
from datetime import datetime
from dataclasses import dataclass
import asyncio
import logging

logger = logging.getLogger(__name__)


@dataclass
class MarketData:
    """Real-time market data for a symbol."""
    symbol: str
    price: float
    volume: int
    change_percent: float
    high: float
    low: float
    open: float
    timestamp: datetime


@dataclass
class TechnicalIndicators:
    """Technical indicators for a symbol."""
    symbol: str
    rsi: float
    macd_line: float
    macd_signal: float
    macd_histogram: float
    ma_20: float
    ma_50: float
    ma_200: float
    bb_upper: float
    bb_middle: float
    bb_lower: float
    previous_rsi: Optional[float] = None
    previous_macd_line: Optional[float] = None
    previous_price: Optional[float] = None


class AlertEngine:
    """
    Engine for evaluating smart alert conditions.
    """

    def __init__(self, supabase_client=None):
        self.supabase = supabase_client
        self._market_data_cache: Dict[str, MarketData] = {}
        self._technical_cache: Dict[str, TechnicalIndicators] = {}

    async def check_all_alerts(self, interval: str) -> List[Dict]:
        """
        Check all active alerts for a given interval.

        Args:
            interval: Check interval ('1m', '5m', '15m', '1h')

        Returns:
            List of triggered alerts with their data
        """
        triggered_alerts = []

        try:
            # Get active alerts for this interval
            alerts = await self._get_active_alerts(interval)

            if not alerts:
                return []

            # Group alerts by symbol for efficient data fetching
            symbols = list(set(a['symbol'] for a in alerts))

            # Fetch market data for all symbols
            await self._fetch_market_data(symbols)
            await self._fetch_technical_indicators(symbols)

            # Check each alert
            for alert in alerts:
                try:
                    result = await self.check_alert(alert)
                    if result['triggered']:
                        triggered_alerts.append(result)
                        await self._record_trigger(alert, result['trigger_data'])
                except Exception as e:
                    logger.error(f"Error checking alert {alert['id']}: {e}")

        except Exception as e:
            logger.error(f"Error in check_all_alerts: {e}")

        return triggered_alerts

    async def check_alert(self, alert: Dict) -> Dict:
        """
        Check if an alert's conditions are met.

        Args:
            alert: Alert configuration with conditions

        Returns:
            Dict with 'triggered' bool and 'trigger_data' if triggered
        """
        symbol = alert['symbol']
        conditions = alert.get('conditions', [])
        logic_operator = alert.get('logic_operator', 'AND')

        if not conditions:
            return {'triggered': False}

        # Get market data
        market_data = self._market_data_cache.get(symbol)
        technical = self._technical_cache.get(symbol)

        if not market_data:
            logger.warning(f"No market data for {symbol}")
            return {'triggered': False}

        # Evaluate each condition
        results = []
        conditions_met = []

        for condition in conditions:
            is_met, description = await self._evaluate_condition(
                condition, market_data, technical
            )
            results.append(is_met)
            if is_met:
                conditions_met.append(description)

        # Apply logic operator
        if logic_operator == 'AND':
            triggered = all(results)
        else:  # OR
            triggered = any(results)

        if triggered:
            trigger_data = self._build_trigger_data(
                alert, market_data, technical, conditions_met
            )
            return {
                'triggered': True,
                'alert': alert,
                'trigger_data': trigger_data
            }

        return {'triggered': False}

    async def _evaluate_condition(
        self,
        condition: Dict,
        market: MarketData,
        technical: Optional[TechnicalIndicators]
    ) -> tuple[bool, str]:
        """
        Evaluate a single condition.

        Returns:
            Tuple of (is_met, description)
        """
        indicator = condition['indicator']
        operator = condition['operator']
        value = condition['value']
        value_secondary = condition.get('value_secondary')

        # Get current value based on indicator
        current_value = None
        previous_value = None

        if indicator == 'price':
            current_value = market.price
            description = f"Giá {operator} {value:,.0f}"

        elif indicator == 'volume':
            current_value = market.volume
            description = f"Khối lượng {operator} {value:,.0f}"

        elif indicator == 'change_percent':
            current_value = market.change_percent
            description = f"% Thay đổi {operator} {value:.2f}%"

        elif indicator == 'rsi' and technical:
            current_value = technical.rsi
            previous_value = technical.previous_rsi
            description = f"RSI {operator} {value}"

        elif indicator == 'macd' and technical:
            current_value = technical.macd_line - technical.macd_signal
            previous_value = (
                (technical.previous_macd_line - technical.macd_signal)
                if technical.previous_macd_line else None
            )
            description = f"MACD {operator} Signal"

        elif indicator == 'ma' and technical:
            # MA crossover: value is short MA period, value_secondary is long MA period
            short_ma = self._get_ma_value(technical, value)
            long_ma = self._get_ma_value(technical, value_secondary)
            if short_ma and long_ma:
                current_value = short_ma - long_ma
                previous_value = None  # Would need historical data
                description = f"MA({int(value)}) {operator} MA({int(value_secondary)})"
            else:
                return False, ""

        elif indicator == 'bb' and technical:
            current_value = market.price
            if operator == 'touches_upper':
                return (
                    market.price >= technical.bb_upper * 0.995,
                    f"Giá chạm BB Upper ({technical.bb_upper:,.0f})"
                )
            elif operator == 'touches_lower':
                return (
                    market.price <= technical.bb_lower * 1.005,
                    f"Giá chạm BB Lower ({technical.bb_lower:,.0f})"
                )

        else:
            logger.warning(f"Unknown indicator: {indicator}")
            return False, ""

        # Evaluate based on operator
        if current_value is None:
            return False, ""

        is_met = self._compare(current_value, previous_value, operator, value)

        return is_met, description

    def _compare(
        self,
        current: float,
        previous: Optional[float],
        operator: str,
        target: float
    ) -> bool:
        """Compare values based on operator."""
        if operator == '>=':
            return current >= target
        elif operator == '<=':
            return current <= target
        elif operator == '=':
            return abs(current - target) < 0.01  # Small tolerance
        elif operator == '>':
            return current > target
        elif operator == '<':
            return current < target
        elif operator == 'crosses_above':
            if previous is None:
                return current > target
            return previous <= target < current
        elif operator == 'crosses_below':
            if previous is None:
                return current < target
            return previous >= target > current
        else:
            return False

    def _get_ma_value(self, technical: TechnicalIndicators, period: float) -> Optional[float]:
        """Get MA value by period."""
        period = int(period)
        if period == 20:
            return technical.ma_20
        elif period == 50:
            return technical.ma_50
        elif period == 200:
            return technical.ma_200
        return None

    def _build_trigger_data(
        self,
        alert: Dict,
        market: MarketData,
        technical: Optional[TechnicalIndicators],
        conditions_met: List[str]
    ) -> Dict:
        """Build trigger data snapshot."""
        data = {
            'price': market.price,
            'volume': market.volume,
            'change_percent': market.change_percent,
            'conditions_met': conditions_met,
            'triggered_at': datetime.utcnow().isoformat(),
        }

        if technical:
            data['rsi'] = technical.rsi
            data['macd_line'] = technical.macd_line
            data['macd_signal'] = technical.macd_signal

        return data

    async def _get_active_alerts(self, interval: str) -> List[Dict]:
        """Get active alerts for the given interval."""
        # In production: fetch from Supabase
        # For demo: return empty (would need database connection)

        if self.supabase:
            try:
                result = await self.supabase.rpc(
                    'get_active_alerts_by_interval',
                    {'p_interval': interval}
                ).execute()

                if result.data:
                    # Fetch conditions for each alert
                    alert_ids = [a['id'] for a in result.data]
                    conditions_result = await self.supabase.table(
                        'smart_alert_conditions'
                    ).select('*').in_('alert_id', alert_ids).execute()

                    # Group conditions by alert_id
                    conditions_by_alert = {}
                    for c in conditions_result.data:
                        alert_id = c['alert_id']
                        if alert_id not in conditions_by_alert:
                            conditions_by_alert[alert_id] = []
                        conditions_by_alert[alert_id].append(c)

                    # Attach conditions to alerts
                    for alert in result.data:
                        alert['conditions'] = conditions_by_alert.get(alert['id'], [])

                    return result.data

            except Exception as e:
                logger.error(f"Error fetching alerts: {e}")

        return []

    async def _fetch_market_data(self, symbols: List[str]):
        """Fetch real-time market data for symbols."""
        # In production: fetch from market data provider or database
        # For demo: generate sample data

        for symbol in symbols:
            self._market_data_cache[symbol] = MarketData(
                symbol=symbol,
                price=self._generate_demo_price(symbol),
                volume=self._generate_demo_volume(),
                change_percent=self._generate_demo_change(),
                high=0,
                low=0,
                open=0,
                timestamp=datetime.utcnow()
            )

    async def _fetch_technical_indicators(self, symbols: List[str]):
        """Fetch technical indicators for symbols."""
        # In production: calculate from historical data or fetch from service
        # For demo: generate sample data

        for symbol in symbols:
            price = self._market_data_cache.get(symbol)
            if price:
                self._technical_cache[symbol] = TechnicalIndicators(
                    symbol=symbol,
                    rsi=self._generate_demo_rsi(),
                    macd_line=0.5,
                    macd_signal=0.3,
                    macd_histogram=0.2,
                    ma_20=price.price * 0.98,
                    ma_50=price.price * 0.95,
                    ma_200=price.price * 0.90,
                    bb_upper=price.price * 1.05,
                    bb_middle=price.price,
                    bb_lower=price.price * 0.95,
                )

    async def _record_trigger(self, alert: Dict, trigger_data: Dict):
        """Record alert trigger in database."""
        if self.supabase:
            try:
                await self.supabase.rpc(
                    'record_alert_trigger',
                    {
                        'p_alert_id': alert['id'],
                        'p_trigger_data': trigger_data,
                        'p_channels': alert.get('notification_channels', ['in_app'])
                    }
                ).execute()
            except Exception as e:
                logger.error(f"Error recording trigger: {e}")

    # Demo data generators
    def _generate_demo_price(self, symbol: str) -> float:
        """Generate demo price based on symbol."""
        prices = {
            'VNM': 75000,
            'FPT': 140000,
            'VIC': 42000,
            'HPG': 28000,
            'VCB': 95000,
            'TCB': 48000,
            'MWG': 52000,
            'MSN': 85000,
        }
        import random
        base = prices.get(symbol, 50000)
        return base * (1 + random.uniform(-0.03, 0.03))

    def _generate_demo_volume(self) -> int:
        import random
        return random.randint(500000, 5000000)

    def _generate_demo_change(self) -> float:
        import random
        return random.uniform(-3, 3)

    def _generate_demo_rsi(self) -> float:
        import random
        return random.uniform(20, 80)


# Singleton instance
_engine_instance: Optional[AlertEngine] = None


def get_alert_engine(supabase_client=None) -> AlertEngine:
    """Get or create AlertEngine instance."""
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = AlertEngine(supabase_client)
    return _engine_instance
