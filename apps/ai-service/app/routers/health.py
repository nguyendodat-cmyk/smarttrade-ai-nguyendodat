"""
Health Check Router - API health status and dependency checks
"""
from fastapi import APIRouter, HTTPException
from supabase import create_client, Client
from app.config import settings
import httpx

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
@router.get("/")
async def health_check():
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": "1.0.0"
    }


@router.get("/supabase")
async def check_supabase():
    """Check Supabase connection and configuration"""
    try:
        # Validate configuration
        if not settings.SUPABASE_URL:
            raise HTTPException(
                status_code=500,
                detail="SUPABASE_URL not configured in environment"
            )

        if not settings.SUPABASE_SERVICE_KEY:
            raise HTTPException(
                status_code=500,
                detail="SUPABASE_SERVICE_KEY not configured in environment"
            )

        # Create Supabase client
        supabase: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_KEY
        )

        # Test connection by querying a table (profiles should exist after migrations)
        result = supabase.table("profiles").select("id").limit(1).execute()

        return {
            "status": "healthy",
            "supabase_url": settings.SUPABASE_URL,
            "connection": "successful",
            "test_query": "passed",
            "tables_accessible": True
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "status": "unhealthy",
                "error": str(e),
                "supabase_url": settings.SUPABASE_URL if settings.SUPABASE_URL else "not configured"
            }
        )


@router.get("/ssi")
async def check_ssi():
    """Check SSI FastConnect API configuration and connectivity"""
    try:
        if not settings.SSI_CONSUMER_ID or not settings.SSI_CONSUMER_SECRET:
            return {
                "status": "not_configured",
                "message": "SSI credentials not configured (optional for development)",
                "ssi_base_url": settings.SSI_BASE_URL
            }

        # Test SSI API connectivity (without authentication, just check if endpoint is reachable)
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{settings.SSI_BASE_URL}/api/v2/Market/AccessToken")

        # We expect 405 (Method Not Allowed) or 400 (Bad Request) if endpoint exists
        # because GET is not allowed, only POST
        if response.status_code in [400, 405]:
            return {
                "status": "reachable",
                "ssi_base_url": settings.SSI_BASE_URL,
                "credentials_configured": True,
                "note": "SSI API endpoint is reachable. Authentication not tested in health check."
            }

        return {
            "status": "reachable",
            "ssi_base_url": settings.SSI_BASE_URL,
            "credentials_configured": True,
            "http_status": response.status_code
        }

    except httpx.TimeoutException:
        return {
            "status": "timeout",
            "error": "SSI API request timed out",
            "ssi_base_url": settings.SSI_BASE_URL
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "ssi_base_url": settings.SSI_BASE_URL
        }


@router.get("/all")
async def check_all_services():
    """Check all dependencies at once"""
    checks = {}

    # Supabase check
    try:
        supabase: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_KEY
        )
        result = supabase.table("profiles").select("id").limit(1).execute()
        checks["supabase"] = {"status": "healthy"}
    except Exception as e:
        checks["supabase"] = {"status": "unhealthy", "error": str(e)}

    # SSI check
    if settings.SSI_CONSUMER_ID and settings.SSI_CONSUMER_SECRET:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{settings.SSI_BASE_URL}/api/v2/Market/AccessToken")
            checks["ssi"] = {"status": "reachable" if response.status_code in [400, 405] else "unknown"}
        except Exception as e:
            checks["ssi"] = {"status": "error", "error": str(e)}
    else:
        checks["ssi"] = {"status": "not_configured"}

    # OpenAI check
    checks["openai"] = {
        "status": "configured" if settings.OPENAI_API_KEY else "not_configured"
    }

    # Overall status
    overall_healthy = checks["supabase"]["status"] == "healthy"

    return {
        "status": "healthy" if overall_healthy else "degraded",
        "checks": checks
    }
