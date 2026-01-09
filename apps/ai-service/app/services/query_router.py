"""
Query Router for Hybrid AI
Classifies user queries and routes to appropriate handlers
"""

from typing import Tuple, Dict, List
import re

from ..utils.prompts import QueryType


class QueryRouter:
    """Routes queries to appropriate AI handlers based on intent"""

    # Vietnamese stock symbols pattern (3 uppercase letters)
    SYMBOL_PATTERN = r'\b([A-Z]{3})\b'

    # Common Vietnamese stock symbols for validation
    KNOWN_SYMBOLS = {
        'VNM', 'FPT', 'VIC', 'VHM', 'VCB', 'TCB', 'VPB', 'MBB', 'HPG', 'MWG',
        'VRE', 'SAB', 'MSN', 'GAS', 'PLX', 'VJC', 'BID', 'CTG', 'ACB', 'STB',
        'SSI', 'VND', 'HCM', 'SHS', 'VCI', 'BSI', 'AGR', 'CTS', 'TVS', 'VDS',
        'REE', 'PNJ', 'DGW', 'FRT', 'MIG', 'PVD', 'PVS', 'DPM', 'DCM', 'PHR',
        'GMD', 'VSC', 'HAH', 'VOS', 'MVN', 'VTP', 'HVN', 'ACV', 'NCT', 'SCS',
        'HSG', 'NKG', 'TLH', 'SMC', 'POM', 'DTL', 'VGS', 'TVN', 'NVL', 'PDR',
        'KDH', 'DXG', 'HDG', 'KBC', 'IJC', 'SZC', 'CEO', 'LDG', 'CMG', 'ELC',
    }

    # Query classification patterns
    PATTERNS = {
        QueryType.STOCK_ANALYSIS: [
            r'phân tích\s+(?:cổ phiếu\s+)?([A-Z]{3})',
            r'đánh giá\s+(?:cổ phiếu\s+)?([A-Z]{3})',
            r'nhận định\s+([A-Z]{3})',
            r'([A-Z]{3})\s+(?:thế nào|ra sao|như thế nào)',
            r'nên\s+(?:mua|bán)\s+([A-Z]{3})',
            r'xu hướng\s+([A-Z]{3})',
            r'target\s+([A-Z]{3})',
            r'([A-Z]{3})\s+có\s+(?:nên|đáng)',
        ],
        QueryType.COMPARISON: [
            r'so sánh\s+([A-Z]{3})\s+(?:và|với|vs)\s+([A-Z]{3})',
            r'([A-Z]{3})\s+vs\s+([A-Z]{3})',
            r'chọn\s+([A-Z]{3})\s+hay\s+([A-Z]{3})',
            r'([A-Z]{3})\s+hay\s+([A-Z]{3})\s+tốt hơn',
        ],
        QueryType.MARKET_OVERVIEW: [
            r'thị trường\s+(?:hôm nay|tuần này|tháng này)',
            r'thị trường.*(?:thế nào|ra sao)',
            r'vn[\-\s]?index',
            r'tổng quan\s+thị trường',
            r'nhận định\s+(?:phiên|thị trường)',
            r'thị trường\s+(?:sẽ|đang)',
            r'phiên\s+(?:sáng|chiều)',
        ],
        QueryType.NEWS_QUERY: [
            r'tin tức\s+(?:về\s+)?([A-Z]{3})?',
            r'tin\s+(?:mới|nóng)',
            r'có gì\s+mới',
            r'có\s+tin\s+(?:gì|nào)',
            r'sự kiện\s+(?:nào|gì)',
        ],
        QueryType.REGULATION_QUERY: [
            r'quy định\s+',
            r'luật\s+chứng khoán',
            r'margin\s+là gì',
            r't\+\d',
            r'room\s+(?:ngoại|khối ngoại)',
            r'cổ tức\s+(?:là gì|như thế nào)',
        ],
        QueryType.PORTFOLIO_QUERY: [
            r'danh mục\s+(?:của tôi|tôi)',
            r'portfolio\s+(?:của tôi|tôi)',
            r'(?:tôi|mình)\s+(?:đang|nên)\s+(?:nắm|giữ)',
            r'phân bổ\s+danh mục',
            r'rebalance',
        ],
    }

    def route(self, query: str) -> Tuple[QueryType, Dict]:
        """
        Classify query and extract relevant entities

        Returns:
            Tuple of (QueryType, dict with extracted info)
        """
        query_lower = query.lower()
        extracted = {
            'symbols': [],
            'original_query': query,
        }

        # First, extract ALL valid symbols from the query
        all_symbols = re.findall(self.SYMBOL_PATTERN, query)
        valid_symbols = list(dict.fromkeys(
            s for s in all_symbols if self._is_valid_symbol(s)
        ))
        extracted['symbols'] = valid_symbols

        # Check patterns in priority order (non-symbol patterns first)
        priority_order = [
            QueryType.MARKET_OVERVIEW,  # Check market queries first
            QueryType.NEWS_QUERY,
            QueryType.REGULATION_QUERY,
            QueryType.PORTFOLIO_QUERY,
            QueryType.COMPARISON,
            QueryType.STOCK_ANALYSIS,
        ]

        for query_type in priority_order:
            patterns = self.PATTERNS.get(query_type, [])
            for pattern in patterns:
                match = re.search(pattern, query, re.IGNORECASE)
                if match:
                    return query_type, extracted

        # No pattern matched, check for symbol mentions
        if valid_symbols:
            # If single symbol mentioned, likely stock analysis
            if len(valid_symbols) == 1:
                return QueryType.STOCK_ANALYSIS, extracted
            # Multiple symbols might be comparison
            elif len(valid_symbols) >= 2:
                return QueryType.COMPARISON, extracted

        # Default to general QA
        return QueryType.GENERAL_QA, extracted

    # Common Vietnamese words that look like stock symbols
    FALSE_POSITIVES = {
        'NAY', 'SAO', 'CHO', 'CON', 'ANH', 'BAO', 'CAO', 'DEN', 'DOI',
        'HAY', 'HOI', 'LAM', 'MOI', 'NEN', 'NHU', 'PHI', 'RAO', 'SAU',
        'TIN', 'TOT', 'VAO', 'VOI', 'XEM', 'YEU', 'BAT', 'COI', 'DAU',
        'DEX', 'GIA', 'GOI', 'HOM', 'KHI', 'LAI', 'LUA', 'MAU', 'MUA',
        'NAO', 'NHA', 'NOI', 'ONG', 'QUA', 'RAT', 'SAP', 'TAO', 'THE',
        'TRA', 'TRO', 'TUY', 'UNG', 'VAY', 'VUA', 'XAU', 'RSI', 'ROE',
        'ROA', 'EPS', 'NIM', 'NPL', 'CPI', 'GDP', 'USD', 'VND', 'EUR',
    }

    def _is_valid_symbol(self, symbol: str) -> bool:
        """Check if symbol is a valid Vietnamese stock code"""
        if len(symbol) != 3:
            return False
        if not symbol.isalpha():
            return False
        if not symbol.isupper():
            return False
        # Exclude false positives
        if symbol in self.FALSE_POSITIVES:
            return False
        # Only accept known symbols
        return symbol in self.KNOWN_SYMBOLS

    def get_required_context(self, query_type: QueryType) -> Dict[str, bool]:
        """Get required context sources for each query type"""
        context_map = {
            QueryType.STOCK_ANALYSIS: {
                'realtime': True,
                'fundamentals': True,
                'news': True,
                'research': True,
            },
            QueryType.MARKET_OVERVIEW: {
                'realtime': True,
                'fundamentals': False,
                'news': True,
                'research': False,
            },
            QueryType.NEWS_QUERY: {
                'realtime': False,
                'fundamentals': False,
                'news': True,
                'research': False,
            },
            QueryType.REGULATION_QUERY: {
                'realtime': False,
                'fundamentals': False,
                'news': False,
                'research': False,
            },
            QueryType.PORTFOLIO_QUERY: {
                'realtime': True,
                'fundamentals': True,
                'news': False,
                'research': False,
            },
            QueryType.COMPARISON: {
                'realtime': True,
                'fundamentals': True,
                'news': False,
                'research': True,
            },
            QueryType.GENERAL_QA: {
                'realtime': False,
                'fundamentals': False,
                'news': False,
                'research': False,
            },
        }
        return context_map.get(query_type, {})


query_router = QueryRouter()
