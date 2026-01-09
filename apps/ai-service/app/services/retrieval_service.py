"""
Retrieval Service for RAG
Searches the knowledge base using vector similarity
"""

from typing import List, Optional, Dict, Any
from supabase import create_client, Client
from .embedding_service import embedding_service
from ..config import settings


class RetrievalService:
    def __init__(self):
        self.supabase: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_KEY
        )

    async def search(
        self,
        query: str,
        top_k: int = 5,
        source_filter: Optional[str] = None,
        symbol_filter: Optional[str] = None,
        category_filter: Optional[str] = None,
        min_similarity: float = 0.7
    ) -> List[Dict[str, Any]]:
        """Search for relevant documents using vector similarity"""

        # Create query embedding
        query_embedding = await embedding_service.create_embedding(query)

        # Search using pgvector function
        result = self.supabase.rpc('search_knowledge', {
            'query_embedding': query_embedding,
            'match_count': top_k,
            'filter_source': source_filter,
            'filter_symbol': symbol_filter,
            'filter_category': category_filter,
            'min_similarity': min_similarity,
        }).execute()

        return result.data if result.data else []

    async def hybrid_search(
        self,
        query: str,
        top_k: int = 5,
        source_filter: Optional[str] = None,
        symbol_filter: Optional[str] = None,
        vector_weight: float = 0.7,
        keyword_weight: float = 0.3
    ) -> List[Dict[str, Any]]:
        """Hybrid search combining vector similarity and keyword matching"""

        query_embedding = await embedding_service.create_embedding(query)

        result = self.supabase.rpc('hybrid_search_knowledge', {
            'query_embedding': query_embedding,
            'query_text': query,
            'match_count': top_k,
            'filter_source': source_filter,
            'filter_symbol': symbol_filter,
            'vector_weight': vector_weight,
            'keyword_weight': keyword_weight,
        }).execute()

        return result.data if result.data else []

    async def search_multi_query(
        self,
        queries: List[str],
        top_k: int = 3,
        source_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Search with multiple queries and deduplicate results"""
        all_docs = []
        seen_ids = set()

        for query in queries:
            docs = await self.search(
                query,
                top_k=top_k,
                source_filter=source_filter
            )
            for doc in docs:
                if doc['id'] not in seen_ids:
                    all_docs.append(doc)
                    seen_ids.add(doc['id'])

        # Sort by similarity
        all_docs.sort(key=lambda x: x.get('similarity', 0), reverse=True)

        return all_docs[:top_k * 2]

    async def get_recent_news(
        self,
        symbol: Optional[str] = None,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Get recent news articles"""
        query = self.supabase.table('knowledge_documents')\
            .select('id, title, content, source, symbol, published_at')\
            .eq('source', 'news')\
            .order('published_at', desc=True)\
            .limit(limit)

        if symbol:
            query = query.eq('symbol', symbol)

        result = query.execute()
        return result.data if result.data else []

    async def get_research_reports(
        self,
        symbol: str,
        limit: int = 3
    ) -> List[Dict[str, Any]]:
        """Get research reports for a stock"""
        result = self.supabase.table('knowledge_documents')\
            .select('id, title, content, source, published_at')\
            .eq('source', 'research')\
            .eq('symbol', symbol)\
            .order('published_at', desc=True)\
            .limit(limit)\
            .execute()

        return result.data if result.data else []


retrieval_service = RetrievalService()
