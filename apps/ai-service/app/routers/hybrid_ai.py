"""
Hybrid AI Router
API endpoints for the RAG-enhanced AI system
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

from ..services.hybrid_ai_service import hybrid_ai_service
from ..services.ingestion_service import ingestion_service

router = APIRouter(prefix="/ai/v2", tags=["Hybrid AI"])


# Request/Response Models
class HybridChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = None
    user_portfolio: Optional[Dict[str, Any]] = None
    user_id: Optional[str] = None


class HybridChatResponse(BaseModel):
    success: bool
    content: str
    query_type: str
    symbols_analyzed: List[str]
    mentioned_stocks: List[str]
    sources_used: List[str]
    tokens_used: int
    response_time_ms: int
    model: str


class IngestDocumentRequest(BaseModel):
    title: str
    content: str
    source: str  # 'news', 'research', 'regulation', 'company'
    symbol: Optional[str] = None
    category: Optional[str] = None
    source_url: Optional[str] = None
    published_at: Optional[datetime] = None


class IngestBatchRequest(BaseModel):
    documents: List[IngestDocumentRequest]


# Endpoints
@router.post("/chat", response_model=HybridChatResponse)
async def hybrid_chat(request: HybridChatRequest):
    """
    Chat with RAG-enhanced AI assistant

    Features:
    - Query routing to appropriate handlers
    - Real-time market data context
    - RAG from knowledge base (news, research, regulations)
    - Fine-tuned model responses
    """
    try:
        result = await hybrid_ai_service.chat(
            message=request.message,
            conversation_history=request.conversation_history,
            user_portfolio=request.user_portfolio,
            user_id=request.user_id
        )

        return HybridChatResponse(
            success=True,
            **result
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stock-insight/{symbol}")
async def get_stock_insight(symbol: str):
    """
    Get AI insight for a specific stock
    Uses RAG + real-time data for comprehensive analysis
    """
    try:
        result = await hybrid_ai_service.get_stock_insight(
            symbol=symbol.upper()
        )
        return {
            "success": True,
            "symbol": symbol.upper(),
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/daily-briefing")
async def get_daily_briefing():
    """
    Get AI-generated daily market briefing
    """
    try:
        result = await hybrid_ai_service.get_daily_briefing()
        return {
            "success": True,
            "date": datetime.now().strftime("%Y-%m-%d"),
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/portfolio-analysis")
async def analyze_portfolio(portfolio: Dict[str, Any]):
    """
    Analyze user's portfolio with AI
    """
    try:
        result = await hybrid_ai_service.analyze_portfolio(portfolio)
        return {
            "success": True,
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Knowledge Base Management Endpoints
@router.post("/knowledge/ingest")
async def ingest_document(request: IngestDocumentRequest):
    """
    Ingest a document into the knowledge base
    Admin endpoint for adding content
    """
    try:
        ids = await ingestion_service.ingest_document(
            title=request.title,
            content=request.content,
            source=request.source,
            symbol=request.symbol,
            category=request.category,
            source_url=request.source_url,
            published_at=request.published_at
        )
        return {
            "success": True,
            "message": f"Ingested {len(ids)} chunk(s)",
            "document_ids": ids
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/knowledge/ingest-batch")
async def ingest_batch(request: IngestBatchRequest):
    """
    Ingest multiple documents into the knowledge base
    """
    try:
        total = 0
        for doc in request.documents:
            ids = await ingestion_service.ingest_document(
                title=doc.title,
                content=doc.content,
                source=doc.source,
                symbol=doc.symbol,
                category=doc.category,
                source_url=doc.source_url,
                published_at=doc.published_at
            )
            total += len(ids)

        return {
            "success": True,
            "message": f"Ingested {total} total chunks from {len(request.documents)} documents"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/knowledge/stats")
async def get_knowledge_stats():
    """
    Get knowledge base statistics
    """
    try:
        stats = await ingestion_service.get_stats()
        return {
            "success": True,
            "stats": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/knowledge/cleanup")
async def cleanup_old_news(days: int = 30):
    """
    Clean up news older than specified days
    """
    try:
        deleted = await ingestion_service.delete_old_news(days)
        return {
            "success": True,
            "message": f"Deleted {deleted} old news documents"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
