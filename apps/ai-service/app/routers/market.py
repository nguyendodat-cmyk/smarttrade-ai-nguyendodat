from fastapi import APIRouter

router = APIRouter(prefix="/market", tags=["market"])

@router.get("/health")
async def market_health():
    # Tạm thời trả OK để xác nhận router đã mount đúng
    return {"status": "ok", "service": "market"}
