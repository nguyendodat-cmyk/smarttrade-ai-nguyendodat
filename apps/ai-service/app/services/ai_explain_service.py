"""
Sprint B.2: AI Explain Service
Generates Vietnamese explanations for InsightEvents.

Strategy:
1. Template-based: Fast, deterministic Vietnamese explanations per insight_code
2. LLM fallback: For complex multi-signal contexts or unknown codes

Each insight_code (PA01-PA04, VA01-VA03, TM02/TM04/TM05) has a Vietnamese template
that substitutes signal values for a human-readable explanation.
"""

import logging
from typing import Dict, Optional

from app.models.insight_models import InsightEvent

logger = logging.getLogger(__name__)

# ============================================
# Vietnamese Templates per Insight Code
# ============================================

VIETNAMESE_TEMPLATES: Dict[str, str] = {
    # Price Action
    "PA01": (
        "Nến tăng mạnh với thân nến chiếm {body_percent:.0%} biên độ, "
        "giá đóng cửa tăng {close_change_pct:+.1f}% so với mở cửa. "
        "Động lượng tăng đáng chú ý trong ngắn hạn."
    ),
    "PA02": (
        "Nến có bóng trên dài ({upper_wick_percent:.0%} biên độ), "
        "bị từ chối tại mức {high:,.0f}. "
        "Áp lực bán xuất hiện ở vùng giá cao."
    ),
    "PA03": (
        "Gap {direction} {gap_percent:+.1f}% so với phiên trước "
        "(đóng cửa {prev_close:,.0f} → mở cửa {today_open:,.0f}). "
        "Biến động giá đáng chú ý, cần theo dõi thêm."
    ),
    "PA04": (
        "Thất bại breakout: chạm đỉnh 20 phiên ({high_20d:,.0f}) "
        "nhưng đóng cửa giảm tại {today_close:,.0f}. "
        "Cần thận trọng với biến động vùng đỉnh."
    ),
    # Volume Analysis
    "VA01": (
        "Khối lượng cao gấp {volume_ratio:.1f} lần trung bình kèm "
        "giá thay đổi {price_change_pct:+.1f}%. "
        "Dòng tiền đang tham gia mạnh."
    ),
    "VA02": (
        "Giá tăng {price_change_pct:+.1f}% nhưng khối lượng chỉ đạt "
        "{volume_ratio:.0%} trung bình. "
        "Phân kỳ giá-khối lượng, động lượng chưa được xác nhận."
    ),
    "VA03": (
        "Khối lượng đạt đỉnh ({volume:,}), nằm trong top 5% của 20 phiên gần nhất. "
        "Dòng tiền bất thường, cần theo dõi diễn biến tiếp theo."
    ),
    # Technical / Momentum
    "TM02": (
        "{cross_type_vi}: MA20 ({ma20:,.0f}) cắt {cross_direction} MA50 ({ma50:,.0f}). "
        "Tín hiệu kỹ thuật {signal_vi} trung hạn."
    ),
    "TM04": (
        "RSI đạt {rsi14:.1f} (vùng quá mua, >70). "
        "Có thể xuất hiện áp lực chốt lời, cần thận trọng với biến động."
    ),
    "TM05": (
        "RSI xuống {rsi14:.1f} (vùng quá bán, <30). "
        "Áp lực bán có thể đã cạn kiệt, cần theo dõi tín hiệu phục hồi."
    ),
}

# Severity descriptions in Vietnamese
SEVERITY_VI: Dict[str, str] = {
    "low": "Thấp",
    "medium": "Trung bình",
    "high": "Cao",
    "critical": "Nghiêm trọng",
}


def _enrich_signals(insight_code: str, signals: Dict) -> Dict:
    """Add derived fields needed by templates."""
    enriched = dict(signals)

    if insight_code == "TM02":
        cross_type = enriched.get("cross_type", "golden")
        enriched["cross_type_vi"] = "Golden Cross" if cross_type == "golden" else "Death Cross"
        enriched["cross_direction"] = "lên trên" if cross_type == "golden" else "xuống dưới"
        enriched["signal_vi"] = "tăng giá" if cross_type == "golden" else "giảm giá"

    if insight_code == "PA03":
        gap_pct = enriched.get("gap_percent", 0)
        enriched["direction"] = "tăng" if gap_pct > 0 else "giảm"

    return enriched


class AIExplainService:
    """
    Generates Vietnamese explanations for InsightEvents.

    Primary: Template-based substitution (fast, deterministic).
    Fallback: LLM call for unknown codes or template failures.
    """

    def __init__(self, llm_client=None, llm_model: str = "gpt-4o-mini", mode: str = "template_only"):
        self._llm_client = llm_client if mode == "template_llm" else None
        self._llm_model = llm_model
        self._mode = mode
        self._stats = {
            "template_success": 0,
            "template_fallback_raw": 0,
            "llm_calls": 0,
            "llm_errors": 0,
        }

    async def explain(self, event: InsightEvent) -> str:
        """
        Generate a Vietnamese explanation for an InsightEvent.

        Returns a human-readable Vietnamese string describing the insight.
        """
        # Try template first
        result = self._explain_template(event)
        if result is not None:
            self._stats["template_success"] += 1
            return result

        # Try LLM fallback
        if self._llm_client:
            llm_result = await self._explain_llm(event)
            if llm_result:
                return llm_result

        # Final fallback: raw explanation
        self._stats["template_fallback_raw"] += 1
        return event.raw_explanation or f"[{event.insight_code}] {event.symbol}"

    def explain_sync(self, event: InsightEvent) -> str:
        """Synchronous template-only explanation (no LLM)."""
        result = self._explain_template(event)
        if result is not None:
            self._stats["template_success"] += 1
            return result
        self._stats["template_fallback_raw"] += 1
        return event.raw_explanation or f"[{event.insight_code}] {event.symbol}"

    def _explain_template(self, event: InsightEvent) -> Optional[str]:
        """Try to generate explanation from template."""
        template = VIETNAMESE_TEMPLATES.get(event.insight_code)
        if not template:
            return None

        signals = _enrich_signals(event.insight_code, dict(event.signals))

        try:
            return template.format(**signals)
        except (KeyError, ValueError, IndexError) as e:
            logger.warning(
                "Template format error for %s (%s): %s",
                event.insight_code, event.symbol, e,
            )
            return None

    async def _explain_llm(self, event: InsightEvent) -> Optional[str]:
        """LLM fallback for complex or unknown insight codes."""
        self._stats["llm_calls"] += 1

        severity_vi = SEVERITY_VI.get(event.severity.value, event.severity.value)
        prompt = (
            f"Bạn là hệ thống mô tả tín hiệu kỹ thuật chứng khoán Việt Nam.\n"
            f"Hãy mô tả ngắn gọn (2-3 câu, tiếng Việt) tín hiệu sau. "
            f"Không đưa ra khuyến nghị mua/bán.\n\n"
            f"Mã: {event.symbol}\n"
            f"Loại tín hiệu: {event.insight_code}\n"
            f"Mức độ: {severity_vi}\n"
            f"Dữ liệu: {event.signals}\n"
            f"Mô tả gốc: {event.raw_explanation}\n\n"
            f"Trả lời ngắn gọn, dễ hiểu cho nhà đầu tư cá nhân."
        )

        try:
            response = await self._llm_client.chat.completions.create(
                model=self._llm_model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=200,
                temperature=0.3,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            self._stats["llm_errors"] += 1
            logger.error("LLM explain error for %s: %s", event.insight_code, e)
            return None

    def get_stats(self) -> Dict:
        return dict(self._stats)


# ============================================
# Singleton
# ============================================

_instance: Optional[AIExplainService] = None


def get_ai_explain_service(llm_client=None, llm_model: str = "gpt-4o-mini") -> AIExplainService:
    """Get or create AIExplainService singleton."""
    global _instance
    if _instance is None:
        _instance = AIExplainService(llm_client=llm_client, llm_model=llm_model)
    return _instance
