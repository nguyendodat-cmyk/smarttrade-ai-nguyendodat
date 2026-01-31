from .ai import router as ai_router
from .hybrid_ai import router as hybrid_ai_router
from .analytics import router as analytics_router
from .research import router as research_router
from .alerts import router as alerts_router
from .debug import router as debug_router

__all__ = ["ai_router", "hybrid_ai_router", "analytics_router", "research_router", "alerts_router", "debug_router"]
