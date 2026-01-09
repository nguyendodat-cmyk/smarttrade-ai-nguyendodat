"""
Embedding Service for RAG
Creates vector embeddings using OpenAI's text-embedding-3-small model
"""

from openai import OpenAI
from typing import List, Optional
import hashlib
from ..config import settings

client = OpenAI(api_key=settings.OPENAI_API_KEY)


class EmbeddingService:
    MODEL = "text-embedding-3-small"
    DIMENSIONS = 1536
    MAX_TOKENS = 8191  # Model limit

    async def create_embedding(self, text: str) -> List[float]:
        """Create embedding for a single text"""
        # Truncate if too long
        text = self._truncate_text(text)

        response = client.embeddings.create(
            model=self.MODEL,
            input=text,
            dimensions=self.DIMENSIONS
        )
        return response.data[0].embedding

    async def create_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Create embeddings for multiple texts (batch)"""
        # Truncate each text
        texts = [self._truncate_text(t) for t in texts]

        response = client.embeddings.create(
            model=self.MODEL,
            input=texts,
            dimensions=self.DIMENSIONS
        )
        return [item.embedding for item in response.data]

    def _truncate_text(self, text: str, max_chars: int = 30000) -> str:
        """Truncate text to fit within token limits"""
        if len(text) > max_chars:
            return text[:max_chars]
        return text

    def chunk_text(
        self,
        text: str,
        chunk_size: int = 500,
        overlap: int = 50
    ) -> List[str]:
        """Split text into overlapping chunks for better retrieval"""
        words = text.split()
        chunks = []

        for i in range(0, len(words), chunk_size - overlap):
            chunk = ' '.join(words[i:i + chunk_size])
            if chunk.strip():
                chunks.append(chunk)

        return chunks

    def chunk_by_paragraphs(
        self,
        text: str,
        max_chunk_size: int = 1000
    ) -> List[str]:
        """Split by paragraphs, merging small ones"""
        paragraphs = text.split('\n\n')
        chunks = []
        current_chunk = ""

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            if len(current_chunk) + len(para) < max_chunk_size:
                current_chunk += "\n\n" + para if current_chunk else para
            else:
                if current_chunk:
                    chunks.append(current_chunk)
                current_chunk = para

        if current_chunk:
            chunks.append(current_chunk)

        return chunks

    @staticmethod
    def compute_hash(text: str) -> str:
        """Compute content hash for deduplication"""
        return hashlib.md5(text.encode()).hexdigest()


embedding_service = EmbeddingService()
