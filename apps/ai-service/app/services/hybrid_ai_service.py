"""
Hybrid AI Service
Orchestrates RAG + Fine-tuned model for intelligent responses
"""

from openai import OpenAI
from typing import Optional, List, Dict, Any
import time
import re

from .query_router import query_router
from .context_builder import context_builder
from .retrieval_service import retrieval_service
from ..utils.prompts import QueryType, get_system_prompt
from ..config import settings

client = OpenAI(api_key=settings.OPENAI_API_KEY)


class HybridAIService:
    """Main AI service combining RAG with fine-tuned model"""

    # Use fine-tuned model if available, fallback to base
    MODEL = settings.OPENAI_MODEL
    FALLBACK_MODEL = "gpt-4o-mini"

    async def chat(
        self,
        message: str,
        conversation_history: Optional[List[Dict]] = None,
        user_portfolio: Optional[Dict] = None,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Main chat endpoint with hybrid AI

        Args:
            message: User's message
            conversation_history: Previous messages in conversation
            user_portfolio: User's portfolio data if available
            user_id: User ID for tracking

        Returns:
            Dict with response content and metadata
        """
        start_time = time.time()

        # 1. Route query to determine intent
        query_type, extracted = query_router.route(message)
        symbols = extracted.get('symbols', [])

        # 2. Build context based on query type
        context = await self._build_context_for_type(
            query_type,
            message,
            symbols,
            user_portfolio
        )

        # 3. Get appropriate system prompt
        system_prompt = get_system_prompt(query_type)

        # 4. Build messages array
        messages = [{"role": "system", "content": system_prompt}]

        # Add context as system message if available
        if context:
            messages.append({
                "role": "system",
                "content": f"### Dữ liệu tham khảo:\n\n{context}"
            })

        # Add conversation history (last 6 messages = 3 exchanges)
        if conversation_history:
            messages.extend(conversation_history[-6:])

        # Add user message
        messages.append({"role": "user", "content": message})

        # 5. Call model
        try:
            response = client.chat.completions.create(
                model=self.MODEL,
                messages=messages,
                temperature=0.7,
                max_tokens=1500,
            )
        except Exception as e:
            # Fallback to base model
            response = client.chat.completions.create(
                model=self.FALLBACK_MODEL,
                messages=messages,
                temperature=0.7,
                max_tokens=1500,
            )

        assistant_message = response.choices[0].message.content
        elapsed_ms = int((time.time() - start_time) * 1000)

        # 6. Extract metadata
        mentioned_stocks = self._extract_stock_symbols(assistant_message)

        return {
            "content": assistant_message,
            "query_type": query_type.value,
            "symbols_analyzed": symbols,
            "mentioned_stocks": mentioned_stocks,
            "sources_used": self._get_sources_used(query_type),
            "tokens_used": response.usage.total_tokens,
            "response_time_ms": elapsed_ms,
            "model": response.model,
        }

    async def _build_context_for_type(
        self,
        query_type: QueryType,
        query: str,
        symbols: List[str],
        portfolio: Optional[Dict]
    ) -> str:
        """Build appropriate context based on query type"""

        symbol = symbols[0] if symbols else None
        context_reqs = query_router.get_required_context(query_type)

        if query_type == QueryType.STOCK_ANALYSIS:
            return await context_builder.build_context(
                query,
                symbol=symbol,
                include_realtime=True,
                include_news=True,
                include_research=True,
                include_fundamentals=True
            )

        elif query_type == QueryType.MARKET_OVERVIEW:
            return await context_builder.build_context(
                query,
                include_realtime=True,
                include_news=True,
                include_research=False,
                include_fundamentals=False
            )

        elif query_type == QueryType.NEWS_QUERY:
            docs = await retrieval_service.search(
                query,
                top_k=5,
                source_filter='news',
                symbol_filter=symbol
            )
            return self._format_documents(docs)

        elif query_type == QueryType.REGULATION_QUERY:
            docs = await retrieval_service.search(
                query,
                top_k=3,
                source_filter='regulation'
            )
            return self._format_documents(docs)

        elif query_type == QueryType.PORTFOLIO_QUERY:
            ctx = await context_builder.build_portfolio_context(portfolio or {})
            market_ctx = await context_builder._get_market_context()
            return f"{ctx}\n\n{market_ctx}"

        elif query_type == QueryType.COMPARISON:
            return await context_builder.build_comparison_context(symbols[:2])

        # GENERAL_QA - minimal context
        return ""

    def _format_documents(self, docs: List[Dict]) -> str:
        """Format retrieved documents for context"""
        if not docs:
            return "Không tìm thấy thông tin liên quan trong cơ sở dữ liệu."

        result = "## Thông tin tìm được\n\n"
        for doc in docs:
            result += f"### {doc.get('title', 'Không tiêu đề')}\n"
            result += f"*Nguồn: {doc.get('source')} | Độ liên quan: {doc.get('similarity', 0):.0%}*\n\n"
            result += f"{doc.get('content', '')[:600]}\n\n---\n\n"
        return result

    def _extract_stock_symbols(self, text: str) -> List[str]:
        """Extract valid stock symbols from response"""
        symbols = re.findall(r'\b([A-Z]{3})\b', text)
        # Filter to likely valid symbols
        valid = [s for s in set(symbols) if s in query_router.KNOWN_SYMBOLS]
        return valid

    def _get_sources_used(self, query_type: QueryType) -> List[str]:
        """Return list of data sources used"""
        sources_map = {
            QueryType.STOCK_ANALYSIS: ['realtime', 'news', 'research', 'fundamentals'],
            QueryType.MARKET_OVERVIEW: ['realtime', 'news', 'indices'],
            QueryType.NEWS_QUERY: ['news'],
            QueryType.REGULATION_QUERY: ['regulation'],
            QueryType.PORTFOLIO_QUERY: ['realtime', 'portfolio', 'fundamentals'],
            QueryType.COMPARISON: ['realtime', 'research', 'fundamentals'],
            QueryType.GENERAL_QA: ['knowledge_base'],
        }
        return sources_map.get(query_type, [])

    async def get_stock_insight(
        self,
        symbol: str,
        insight_type: str = "full"
    ) -> Dict[str, Any]:
        """Get AI insight for a specific stock"""

        query = f"Phân tích chi tiết cổ phiếu {symbol}"
        return await self.chat(query, user_id=None)

    async def get_daily_briefing(self) -> Dict[str, Any]:
        """Generate daily market briefing"""

        query = "Tổng hợp thị trường chứng khoán Việt Nam hôm nay, bao gồm VN-Index, thanh khoản, khối ngoại và các điểm nhấn đáng chú ý"
        return await self.chat(query, user_id=None)

    async def analyze_portfolio(
        self,
        portfolio: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze user's portfolio with AI"""

        query = "Phân tích danh mục đầu tư của tôi, đánh giá rủi ro và đưa ra khuyến nghị"
        return await self.chat(
            query,
            user_portfolio=portfolio,
            user_id=None
        )


hybrid_ai_service = HybridAIService()
