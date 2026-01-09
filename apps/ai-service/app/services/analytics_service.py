from datetime import datetime, timedelta
from typing import Optional
import os

try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    Client = None


class AnalyticsService:
    def __init__(self):
        self.supabase: Optional[Client] = None
        if SUPABASE_AVAILABLE:
            url = os.getenv("SUPABASE_URL", "")
            key = os.getenv("SUPABASE_SERVICE_KEY", "")
            if url and key:
                self.supabase = create_client(url, key)

    def _get_date_range(self, range_str: str) -> tuple[datetime, datetime]:
        now = datetime.now()

        ranges = {
            'today': timedelta(days=1),
            '7d': timedelta(days=7),
            '30d': timedelta(days=30),
            '90d': timedelta(days=90),
            '1y': timedelta(days=365),
        }

        delta = ranges.get(range_str, timedelta(days=7))
        start_date = now - delta

        return start_date, now

    async def get_overview_metrics(self, range_str: str) -> dict:
        """Get overview metrics for dashboard"""
        start_date, end_date = self._get_date_range(range_str)
        prev_start = start_date - (end_date - start_date)

        # If no supabase, return demo data
        if not self.supabase:
            return self._demo_overview_metrics()

        try:
            # Current period
            current = self.supabase.table('analytics_daily_metrics')\
                .select('*')\
                .gte('metric_date', start_date.date().isoformat())\
                .lte('metric_date', end_date.date().isoformat())\
                .execute()

            # Previous period for comparison
            previous = self.supabase.table('analytics_daily_metrics')\
                .select('*')\
                .gte('metric_date', prev_start.date().isoformat())\
                .lt('metric_date', start_date.date().isoformat())\
                .execute()

            current_data = current.data or []
            previous_data = previous.data or []

            def sum_metric(data, key):
                return sum(d.get(key, 0) for d in data)

            def calc_change(current_val, prev_val):
                if prev_val == 0:
                    return 100 if current_val > 0 else 0
                return ((current_val - prev_val) / prev_val) * 100

            total_users = sum_metric(current_data, 'active_users')
            prev_users = sum_metric(previous_data, 'active_users')

            revenue = sum_metric(current_data, 'revenue_vnd')
            prev_revenue = sum_metric(previous_data, 'revenue_vnd')

            ai_queries = sum_metric(current_data, 'ai_queries')
            prev_ai = sum_metric(previous_data, 'ai_queries')

            orders = sum_metric(current_data, 'orders_placed')
            prev_orders = sum_metric(previous_data, 'orders_placed')

            return {
                'totalUsers': total_users,
                'usersChange': calc_change(total_users, prev_users),
                'revenue': revenue,
                'revenueChange': calc_change(revenue, prev_revenue),
                'aiQueries': ai_queries,
                'aiChange': calc_change(ai_queries, prev_ai),
                'orders': orders,
                'ordersChange': calc_change(orders, prev_orders),
            }
        except Exception as e:
            print(f"Error fetching overview metrics: {e}")
            return self._demo_overview_metrics()

    async def get_user_growth(self, range_str: str) -> list[dict]:
        """Get user growth data over time"""
        start_date, end_date = self._get_date_range(range_str)

        if not self.supabase:
            return self._demo_user_growth(range_str)

        try:
            result = self.supabase.table('analytics_daily_metrics')\
                .select('metric_date, total_users, new_users, active_users')\
                .gte('metric_date', start_date.date().isoformat())\
                .lte('metric_date', end_date.date().isoformat())\
                .order('metric_date')\
                .execute()

            return [
                {
                    'date': d['metric_date'],
                    'totalUsers': d['total_users'],
                    'newUsers': d['new_users'],
                    'activeUsers': d['active_users'],
                }
                for d in (result.data or [])
            ]
        except Exception as e:
            print(f"Error fetching user growth: {e}")
            return self._demo_user_growth(range_str)

    async def get_revenue_data(self, range_str: str) -> list[dict]:
        """Get revenue data over time"""
        start_date, end_date = self._get_date_range(range_str)

        if not self.supabase:
            return self._demo_revenue_data(range_str)

        try:
            result = self.supabase.table('analytics_daily_metrics')\
                .select('metric_date, revenue_vnd, new_subscriptions')\
                .gte('metric_date', start_date.date().isoformat())\
                .lte('metric_date', end_date.date().isoformat())\
                .order('metric_date')\
                .execute()

            return [
                {
                    'date': d['metric_date'],
                    'revenue': d['revenue_vnd'],
                    'subscriptions': d['new_subscriptions'],
                }
                for d in (result.data or [])
            ]
        except Exception as e:
            print(f"Error fetching revenue data: {e}")
            return self._demo_revenue_data(range_str)

    async def get_ai_usage(self, range_str: str) -> dict:
        """Get AI usage statistics"""
        if not self.supabase:
            return self._demo_ai_usage(range_str)

        # Return demo data for now
        return self._demo_ai_usage(range_str)

    async def get_feature_usage(self, range_str: str) -> list[dict]:
        """Get feature usage breakdown"""
        start_date, end_date = self._get_date_range(range_str)

        if not self.supabase:
            return self._demo_feature_usage()

        try:
            result = self.supabase.table('analytics_feature_usage')\
                .select('feature_name, usage_count, unique_users, avg_duration_seconds')\
                .gte('usage_date', start_date.date().isoformat())\
                .lte('usage_date', end_date.date().isoformat())\
                .execute()

            # Aggregate by feature
            features = {}
            for d in (result.data or []):
                name = d['feature_name']
                if name not in features:
                    features[name] = {
                        'name': name,
                        'usageCount': 0,
                        'uniqueUsers': 0,
                        'avgDuration': 0,
                    }
                features[name]['usageCount'] += d['usage_count']
                features[name]['uniqueUsers'] += d['unique_users']

            # Sort by usage count
            sorted_features = sorted(
                features.values(),
                key=lambda x: x['usageCount'],
                reverse=True
            )

            # Calculate percentages
            total = sum(f['usageCount'] for f in sorted_features)
            for f in sorted_features:
                f['percentage'] = (f['usageCount'] / total * 100) if total > 0 else 0

            return sorted_features
        except Exception as e:
            print(f"Error fetching feature usage: {e}")
            return self._demo_feature_usage()

    async def get_funnel_data(self, range_str: str) -> list[dict]:
        """Get conversion funnel data"""
        start_date, end_date = self._get_date_range(range_str)

        if not self.supabase:
            return self._demo_funnel_data()

        try:
            result = self.supabase.table('analytics_funnel')\
                .select('*')\
                .gte('funnel_date', start_date.date().isoformat())\
                .lte('funnel_date', end_date.date().isoformat())\
                .execute()

            data = result.data or []

            # Aggregate
            totals = {
                'visitors': sum(d.get('visitors', 0) for d in data),
                'signups': sum(d.get('signups', 0) for d in data),
                'first_trade': sum(d.get('first_trade', 0) for d in data),
                'first_ai_query': sum(d.get('first_ai_query', 0) for d in data),
                'free_to_premium': sum(d.get('free_to_premium', 0) for d in data),
            }

            visitors = totals['visitors'] or 1

            return [
                {'name': 'Visitors', 'count': totals['visitors'], 'rate': 100},
                {'name': 'Signups', 'count': totals['signups'], 'rate': (totals['signups'] / visitors) * 100},
                {'name': 'First Trade', 'count': totals['first_trade'], 'rate': (totals['first_trade'] / max(1, totals['signups'])) * 100},
                {'name': 'AI User', 'count': totals['first_ai_query'], 'rate': (totals['first_ai_query'] / max(1, totals['signups'])) * 100},
                {'name': 'Premium', 'count': totals['free_to_premium'], 'rate': (totals['free_to_premium'] / max(1, totals['signups'])) * 100},
            ]
        except Exception as e:
            print(f"Error fetching funnel data: {e}")
            return self._demo_funnel_data()

    async def get_top_stocks(self, range_str: str, limit: int = 10) -> list[dict]:
        """Get most viewed stocks"""
        if not self.supabase:
            return self._demo_top_stocks()

        # Return demo data for now
        return self._demo_top_stocks()

    async def get_realtime_stats(self) -> dict:
        """Get realtime active users"""
        # Return demo data for now
        return {
            'activeUsers': 42,
            'recentPages': ['/dashboard', '/market', '/ai-chat'],
        }

    # Demo data methods
    def _demo_overview_metrics(self) -> dict:
        return {
            'totalUsers': 12450,
            'usersChange': 15.2,
            'revenue': 245500000,
            'revenueChange': 23.1,
            'aiQueries': 89230,
            'aiChange': 45.8,
            'orders': 3420,
            'ordersChange': 12.5,
        }

    def _demo_user_growth(self, range_str: str) -> list[dict]:
        import random
        days = {'today': 24, '7d': 7, '30d': 30, '90d': 90, '1y': 365}.get(range_str, 7)
        base_date = datetime.now()
        data = []

        for i in range(days - 1, -1, -1):
            date = base_date - timedelta(days=i)
            data.append({
                'date': date.strftime('%d/%m') if range_str != 'today' else f'{date.hour}:00',
                'totalUsers': 10000 + random.randint(0, 3000) + (days - i) * 50,
                'newUsers': 100 + random.randint(0, 200),
                'premiumUsers': 800 + random.randint(0, 500) + (days - i) * 10,
            })

        return data

    def _demo_revenue_data(self, range_str: str) -> list[dict]:
        import random
        days = {'today': 24, '7d': 7, '30d': 30, '90d': 90, '1y': 365}.get(range_str, 7)
        base_date = datetime.now()
        data = []

        for i in range(days - 1, -1, -1):
            date = base_date - timedelta(days=i)
            subs = 5000000 + random.randint(0, 10000000)
            trans = 2000000 + random.randint(0, 5000000)
            data.append({
                'date': date.strftime('%d/%m') if range_str != 'today' else f'{date.hour}:00',
                'subscriptions': subs,
                'transactions': trans,
                'total': subs + trans,
            })

        return data

    def _demo_ai_usage(self, range_str: str) -> dict:
        import random
        days = {'today': 24, '7d': 7, '30d': 30, '90d': 90, '1y': 365}.get(range_str, 7)
        base_date = datetime.now()
        timeline = []

        for i in range(days - 1, -1, -1):
            date = base_date - timedelta(days=i)
            timeline.append({
                'date': date.strftime('%d/%m') if range_str != 'today' else f'{date.hour}:00',
                'chatMessages': 500 + random.randint(0, 1000),
                'stockInsights': 300 + random.randint(0, 500),
                'portfolioHealth': 100 + random.randint(0, 200),
                'dailyBriefing': 200 + random.randint(0, 300),
            })

        breakdown = [
            {'name': 'AI Chat', 'value': 45, 'color': '#6366F1'},
            {'name': 'Stock Insights', 'value': 28, 'color': '#10B981'},
            {'name': 'Portfolio Health', 'value': 18, 'color': '#F59E0B'},
            {'name': 'Daily Briefing', 'value': 9, 'color': '#EC4899'},
        ]

        return {'timeline': timeline, 'breakdown': breakdown}

    def _demo_feature_usage(self) -> list[dict]:
        return [
            {'name': 'AI Chat', 'usageCount': 45230, 'uniqueUsers': 8420, 'avgDuration': 180, 'percentage': 45},
            {'name': 'Stock Detail', 'usageCount': 28150, 'uniqueUsers': 9200, 'avgDuration': 120, 'percentage': 28},
            {'name': 'Trading', 'usageCount': 18340, 'uniqueUsers': 3450, 'avgDuration': 240, 'percentage': 18},
            {'name': 'Portfolio', 'usageCount': 9120, 'uniqueUsers': 4200, 'avgDuration': 90, 'percentage': 9},
        ]

    def _demo_funnel_data(self) -> list[dict]:
        return [
            {'name': 'Visitors', 'count': 100000, 'rate': 100},
            {'name': 'Signups', 'count': 12450, 'rate': 12.45},
            {'name': 'Activated', 'count': 8200, 'rate': 65.86},
            {'name': 'First Trade', 'count': 4100, 'rate': 50},
            {'name': 'Premium', 'count': 1230, 'rate': 30},
        ]

    def _demo_top_stocks(self) -> list[dict]:
        return [
            {'symbol': 'VNM', 'name': 'Vinamilk', 'views': 12450, 'trades': 890, 'change': 2.35},
            {'symbol': 'FPT', 'name': 'FPT Corp', 'views': 10230, 'trades': 1240, 'change': 3.12},
            {'symbol': 'VIC', 'name': 'Vingroup', 'views': 9870, 'trades': 560, 'change': -1.45},
            {'symbol': 'HPG', 'name': 'Hòa Phát', 'views': 8540, 'trades': 2100, 'change': 4.21},
            {'symbol': 'MWG', 'name': 'Mobile World', 'views': 7620, 'trades': 780, 'change': -2.18},
        ]


analytics_service = AnalyticsService()
