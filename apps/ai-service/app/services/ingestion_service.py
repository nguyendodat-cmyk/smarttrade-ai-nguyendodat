"""
Document Ingestion Service
Processes and stores documents in the knowledge base with embeddings
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from supabase import create_client, Client
from .embedding_service import embedding_service
from ..config import settings


class IngestionService:
    def __init__(self):
        self.supabase: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_KEY
        )

    async def ingest_document(
        self,
        title: str,
        content: str,
        source: str,
        symbol: Optional[str] = None,
        category: Optional[str] = None,
        source_url: Optional[str] = None,
        published_at: Optional[datetime] = None,
        chunk_size: int = 500
    ) -> List[str]:
        """Ingest a single document, chunking if necessary"""

        # Compute content hash for deduplication
        content_hash = embedding_service.compute_hash(content)

        # Check if already exists
        existing = self.supabase.table('knowledge_documents')\
            .select('id')\
            .eq('content_hash', content_hash)\
            .execute()

        if existing.data:
            return []  # Already ingested

        # Chunk content
        chunks = embedding_service.chunk_text(content, chunk_size=chunk_size)
        inserted_ids = []

        # If single chunk, no parent needed
        if len(chunks) == 1:
            embedding = await embedding_service.create_embedding(chunks[0])
            result = self.supabase.table('knowledge_documents').insert({
                'title': title,
                'content': chunks[0],
                'source': source,
                'symbol': symbol,
                'category': category,
                'source_url': source_url,
                'content_tokens': len(chunks[0].split()),
                'embedding': embedding,
                'published_at': published_at.isoformat() if published_at else None,
                'content_hash': content_hash,
            }).execute()
            inserted_ids.append(result.data[0]['id'])
        else:
            # Insert parent document first (without embedding)
            parent_result = self.supabase.table('knowledge_documents').insert({
                'title': title,
                'content': content[:1000] + '...',  # Summary
                'source': source,
                'symbol': symbol,
                'category': category,
                'source_url': source_url,
                'content_tokens': len(content.split()),
                'published_at': published_at.isoformat() if published_at else None,
                'content_hash': content_hash,
            }).execute()
            parent_id = parent_result.data[0]['id']
            inserted_ids.append(parent_id)

            # Insert chunks with embeddings
            for i, chunk in enumerate(chunks):
                embedding = await embedding_service.create_embedding(chunk)
                chunk_hash = f"{content_hash}_chunk_{i}"

                result = self.supabase.table('knowledge_documents').insert({
                    'title': f"{title} (Part {i + 1}/{len(chunks)})",
                    'content': chunk,
                    'source': source,
                    'symbol': symbol,
                    'category': category,
                    'chunk_index': i,
                    'parent_id': parent_id,
                    'content_tokens': len(chunk.split()),
                    'embedding': embedding,
                    'published_at': published_at.isoformat() if published_at else None,
                    'content_hash': chunk_hash,
                }).execute()
                inserted_ids.append(result.data[0]['id'])

        return inserted_ids

    async def ingest_news_batch(self, news_items: List[Dict[str, Any]]) -> int:
        """Ingest multiple news articles"""
        count = 0

        for item in news_items:
            try:
                ids = await self.ingest_document(
                    title=item['title'],
                    content=item['content'],
                    source='news',
                    symbol=item.get('symbol'),
                    category=item.get('category'),
                    source_url=item.get('url'),
                    published_at=item.get('published_at'),
                    chunk_size=400  # Smaller chunks for news
                )
                count += len(ids)
            except Exception as e:
                print(f"Error ingesting news: {e}")
                continue

        return count

    async def ingest_research_report(
        self,
        title: str,
        content: str,
        symbol: str,
        analyst: Optional[str] = None,
        source_url: Optional[str] = None,
        published_at: Optional[datetime] = None
    ) -> List[str]:
        """Ingest analyst research report"""
        return await self.ingest_document(
            title=title,
            content=content,
            source='research',
            symbol=symbol,
            category=analyst,  # Use category for analyst name
            source_url=source_url,
            published_at=published_at,
            chunk_size=800  # Larger chunks for research
        )

    async def ingest_regulation(
        self,
        title: str,
        content: str,
        category: str,  # 'SSC', 'HOSE', 'HNX', etc.
        source_url: Optional[str] = None
    ) -> List[str]:
        """Ingest regulation/rule document"""
        return await self.ingest_document(
            title=title,
            content=content,
            source='regulation',
            category=category,
            source_url=source_url,
            chunk_size=600
        )

    async def delete_old_news(self, days: int = 30) -> int:
        """Delete news older than specified days"""
        from datetime import timedelta

        cutoff = datetime.now() - timedelta(days=days)

        result = self.supabase.table('knowledge_documents')\
            .delete()\
            .eq('source', 'news')\
            .lt('published_at', cutoff.isoformat())\
            .execute()

        return len(result.data) if result.data else 0

    async def get_stats(self) -> Dict[str, int]:
        """Get knowledge base statistics"""
        result = self.supabase.table('knowledge_documents')\
            .select('source', count='exact')\
            .execute()

        # Count by source
        stats = {'total': 0, 'news': 0, 'research': 0, 'regulation': 0, 'company': 0}

        for row in result.data or []:
            source = row.get('source', 'other')
            stats[source] = stats.get(source, 0) + 1
            stats['total'] += 1

        return stats


ingestion_service = IngestionService()
