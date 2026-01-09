"""
Context Builder for RAG
Builds comprehensive context from multiple sources for AI responses
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from .retrieval_service import retrieval_service
from ..config import settings


class ContextBuilder:
    MAX_CONTEXT_TOKENS = 4000

    async def build_context(
        self,
        query: str,
        symbol: Optional[str] = None,
        include_realtime: bool = True,
        include_news: bool = True,
        include_research: bool = True,
        include_fundamentals: bool = True
    ) -> str:
        """Build comprehensive context for AI response"""

        context_parts = []

        # 1. Real-time market data
        if include_realtime:
            market_context = await self._get_market_context(symbol)
            if market_context:
                context_parts.append(market_context)

        # 2. Stock-specific data
        if symbol and include_fundamentals:
            stock_context = await self._get_stock_context(symbol)
            if stock_context:
                context_parts.append(stock_context)

        # 3. RAG: Relevant documents
        if include_news or include_research:
            rag_context = await self._get_rag_context(
                query,
                symbol,
                include_news,
                include_research
            )
            if rag_context:
                context_parts.append(rag_context)

        return "\n\n---\n\n".join(context_parts)

    async def _get_market_context(self, symbol: Optional[str] = None) -> str:
        """Get real-time market data context"""

        # Mock data - replace with actual market data API
        now = datetime.now().strftime('%H:%M %d/%m/%Y')

        context = f"""## Dữ liệu Thị trường (Cập nhật: {now})

### Chỉ số chính
| Chỉ số | Điểm | Thay đổi | % |
|--------|------|----------|---|
| VN-Index | 1,245.67 | +8.32 | +0.67% |
| HNX-Index | 234.56 | +1.23 | +0.53% |
| VN30 | 1,298.45 | +9.87 | +0.77% |

### Thanh khoản
- KLGD: 589.2 triệu cp
- GTGD: 14,235 tỷ đồng
- Khối ngoại: Mua ròng 125 tỷ

### Top tăng/giảm
| Top Tăng | % | Top Giảm | % |
|----------|---|----------|---|
| FPT | +4.2% | HPG | -2.1% |
| VNM | +3.1% | SSI | -1.8% |
| TCB | +2.8% | VND | -1.5% |
"""
        return context

    async def _get_stock_context(self, symbol: str) -> str:
        """Get specific stock data context"""

        # Mock data - replace with actual stock data
        context = f"""## Thông tin {symbol}

### Giá hiện tại
- **Giá:** 85,200đ (+2.3%)
- **Khối lượng:** 1,234,500 cp
- **Giá trị GD:** 105.2 tỷ
- **KLNN:** Mua 45,000 / Bán 32,000

### Vùng giá
- Trần: 91,100đ
- Sàn: 79,300đ
- TC: 85,200đ

### Chỉ số cơ bản
| Chỉ số | Giá trị | Ngành |
|--------|---------|-------|
| P/E | 18.5 | 22.0 |
| P/B | 4.2 | 3.8 |
| ROE | 28.5% | 18.2% |
| EPS | 4,610đ | - |
| Vốn hóa | 165,200 tỷ | - |

### Chỉ báo kỹ thuật
| Chỉ báo | Giá trị | Tín hiệu |
|---------|---------|----------|
| RSI(14) | 58 | Trung tính |
| MACD | +0.85 | Bullish |
| MA20 | 83,500 | Giá trên MA |
| MA50 | 81,200 | Giá trên MA |
"""
        return context

    async def _get_rag_context(
        self,
        query: str,
        symbol: Optional[str],
        include_news: bool,
        include_research: bool
    ) -> str:
        """Get relevant documents from knowledge base"""

        documents = []

        # Search news
        if include_news:
            news_docs = await retrieval_service.search(
                query,
                top_k=3,
                source_filter='news',
                symbol_filter=symbol,
                min_similarity=0.65
            )
            documents.extend(news_docs)

        # Search research
        if include_research:
            research_docs = await retrieval_service.search(
                query,
                top_k=2,
                source_filter='research',
                symbol_filter=symbol,
                min_similarity=0.65
            )
            documents.extend(research_docs)

        if not documents:
            return ""

        # Sort by relevance and take top 5
        documents.sort(key=lambda x: x.get('similarity', 0), reverse=True)
        documents = documents[:5]

        context = "## Thông tin liên quan\n\n"

        for doc in documents:
            similarity = doc.get('similarity', 0)
            source_label = {
                'news': 'Tin tức',
                'research': 'Nghiên cứu',
                'regulation': 'Quy định',
                'company': 'Công ty'
            }.get(doc.get('source'), doc.get('source'))

            published = ""
            if doc.get('published_at'):
                try:
                    pub_date = datetime.fromisoformat(doc['published_at'].replace('Z', '+00:00'))
                    published = f" | {pub_date.strftime('%d/%m/%Y')}"
                except:
                    pass

            content_preview = doc.get('content', '')[:500]
            if len(doc.get('content', '')) > 500:
                content_preview += '...'

            context += f"""### {doc.get('title', 'Không có tiêu đề')}
*{source_label}{published} | Độ liên quan: {similarity:.0%}*

{content_preview}

---
"""

        return context

    async def build_comparison_context(
        self,
        symbols: List[str]
    ) -> str:
        """Build context for stock comparison"""

        contexts = []

        for symbol in symbols[:3]:  # Max 3 stocks
            ctx = await self._get_stock_context(symbol)
            contexts.append(ctx)

        return "\n\n===\n\n".join(contexts)

    async def build_portfolio_context(
        self,
        portfolio: Dict[str, Any]
    ) -> str:
        """Build context for portfolio analysis"""

        if not portfolio or not portfolio.get('holdings'):
            return ""

        holdings = portfolio.get('holdings', [])

        context = """## Danh mục của bạn

### Tổng quan
| Chỉ số | Giá trị |
|--------|---------|
"""
        context += f"| Tổng giá trị | {portfolio.get('total_value', 0):,.0f}đ |\n"
        context += f"| Lãi/Lỗ | {portfolio.get('total_pnl', 0):,.0f}đ ({portfolio.get('total_pnl_pct', 0):.2f}%) |\n"
        context += f"| Số mã | {len(holdings)} |\n"

        context += "\n### Chi tiết nắm giữ\n"
        context += "| Mã | SL | Giá TB | Giá TT | Lãi/Lỗ |\n"
        context += "|-----|-----|--------|--------|--------|\n"

        for h in holdings[:10]:  # Top 10
            pnl_sign = "+" if h.get('pnl', 0) >= 0 else ""
            context += f"| {h.get('symbol')} | {h.get('quantity'):,} | {h.get('avg_price'):,.0f} | {h.get('current_price'):,.0f} | {pnl_sign}{h.get('pnl_pct', 0):.1f}% |\n"

        return context


context_builder = ContextBuilder()
