from openai import OpenAI
from datetime import datetime
import json
import re
from typing import Optional

from app.config import settings
from app.models import (
    Sentiment,
    RiskLevel,
    ChatResponse,
    StockInsightResponse,
    PortfolioHealthResponse,
    DailyBriefingResponse,
    AIRecommendation,
    TechnicalAnalysis,
    FundamentalAnalysis,
    PortfolioMetric,
    MarketHighlight,
    StockMovement,
)
from app.utils.prompts import (
    get_chat_prompt,
    get_stock_analysis_prompt,
    get_daily_briefing_prompt,
    get_portfolio_analysis_prompt,
    INTENT_DETECTION_PROMPT,
)


class AIService:
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
        self.model = settings.OPENAI_MODEL

    def _extract_json(self, text: str) -> dict:
        """Extract JSON from AI response text"""
        try:
            # Try direct parse first
            return json.loads(text)
        except:
            pass

        # Try to find JSON in markdown code blocks
        json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
        if json_match:
            try:
                return json.loads(json_match.group(1))
            except:
                pass

        # Try to find JSON object in text
        json_match = re.search(r'\{[\s\S]*\}', text)
        if json_match:
            try:
                return json.loads(json_match.group())
            except:
                pass

        return {}

    def _detect_symbols(self, message: str) -> list[str]:
        """Detect stock symbols mentioned in message"""
        # Common Vietnamese stock symbols pattern
        symbols = re.findall(r'\b([A-Z]{3})\b', message.upper())
        # Filter likely stock symbols (3 letters)
        valid_symbols = [s for s in symbols if len(s) == 3]
        return list(set(valid_symbols))

    async def _call_openai(
        self,
        system_prompt: str,
        user_message: str,
        temperature: float = 0.7,
        max_tokens: int = 1500,
    ) -> str:
        """Make OpenAI API call"""
        if not self.client:
            raise ValueError("OpenAI client not initialized. Check API key.")

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content

    async def chat(
        self,
        message: str,
        conversation_id: Optional[str] = None,
        context: Optional[dict] = None,
    ) -> ChatResponse:
        """Process chat message and return AI response"""

        # Detect mentioned symbols
        symbols = self._detect_symbols(message)

        # Build context string
        context_str = ""
        if context:
            context_str = f"Dữ liệu bổ sung: {json.dumps(context, ensure_ascii=False)}"

        system_prompt = get_chat_prompt(context_str)

        # Demo mode if no API key
        if not self.client:
            return ChatResponse(
                message=f"[Demo Mode] Tôi đã nhận câu hỏi: '{message}'. "
                        f"Để có phản hồi AI thực sự, vui lòng cấu hình OpenAI API key.",
                conversation_id=conversation_id or "demo-conv",
                suggested_actions=["Xem biểu đồ", "Thêm watchlist", "Đặt cảnh báo"],
                related_stocks=symbols,
            )

        try:
            ai_response = await self._call_openai(
                system_prompt=system_prompt,
                user_message=message,
                temperature=0.7,
                max_tokens=1000,
            )

            # Generate suggested actions based on response
            actions = []
            if symbols:
                actions.extend([f"Xem chi tiết {s}" for s in symbols[:2]])
                actions.append("So sánh cổ phiếu")
            else:
                actions = ["Phân tích danh mục", "Xem tin thị trường", "Tìm cổ phiếu"]

            return ChatResponse(
                message=ai_response,
                conversation_id=conversation_id or f"conv-{datetime.now().timestamp():.0f}",
                suggested_actions=actions[:3],
                related_stocks=symbols,
            )
        except Exception as e:
            return ChatResponse(
                message=f"Xin lỗi, đã có lỗi xảy ra: {str(e)}",
                conversation_id=conversation_id or "error",
                suggested_actions=["Thử lại"],
                related_stocks=[],
            )

    async def get_stock_insight(
        self,
        symbol: str,
        include_technicals: bool = True,
        include_fundamentals: bool = True,
    ) -> StockInsightResponse:
        """Generate AI insight for a specific stock"""

        # Mock market data - in production, fetch real data
        market_data = {
            "symbol": symbol,
            "price": 85200,
            "change": 1200,
            "change_percent": 1.43,
            "volume": 2500000,
            "avg_volume_10d": 2000000,
            "high_52w": 92000,
            "low_52w": 72000,
            "pe_ratio": 15.2,
            "pb_ratio": 2.8,
            "eps": 5600,
            "market_cap": "85,000 tỷ",
            "rsi_14": 58,
            "ma_20": 83500,
            "ma_50": 81000,
            "macd": "bullish crossover",
        }

        # Demo mode if no API key
        if not self.client:
            return self._get_demo_stock_insight(symbol, include_technicals, include_fundamentals)

        try:
            prompt = get_stock_analysis_prompt(symbol, market_data)

            ai_response = await self._call_openai(
                system_prompt="Bạn là chuyên gia phân tích cổ phiếu. Trả lời chính xác theo format JSON yêu cầu.",
                user_message=prompt,
                temperature=0.5,
                max_tokens=1500,
            )

            data = self._extract_json(ai_response)

            # Map AI rating to sentiment
            rating = data.get("ai_rating", "hold")
            sentiment_map = {
                "strong_buy": Sentiment.BULLISH,
                "buy": Sentiment.BULLISH,
                "hold": Sentiment.NEUTRAL,
                "sell": Sentiment.BEARISH,
                "strong_sell": Sentiment.BEARISH,
            }

            # Map rating to recommendation type
            rec_type_map = {
                "strong_buy": "buy",
                "buy": "buy",
                "hold": "hold",
                "sell": "sell",
                "strong_sell": "sell",
            }

            return StockInsightResponse(
                symbol=symbol,
                name=f"{symbol} Corporation",
                analysis=data.get("summary", f"Phân tích {symbol}"),
                sentiment=sentiment_map.get(rating, Sentiment.NEUTRAL),
                score=data.get("confidence_score", 65),
                risk_level=RiskLevel(data.get("risk_level", "medium")),
                technicals=TechnicalAnalysis(
                    trend="uptrend" if data.get("technical_score", 50) > 55 else "sideways",
                    support=data.get("stop_loss", 80000),
                    resistance=data.get("target_price_1", 90000),
                    rsi=market_data["rsi_14"],
                    macd_signal="buy" if rating in ["strong_buy", "buy"] else "neutral",
                    volume_trend="increasing" if market_data["volume"] > market_data["avg_volume_10d"] else "stable",
                ) if include_technicals else None,
                fundamentals=FundamentalAnalysis(
                    pe_ratio=market_data["pe_ratio"],
                    pb_ratio=market_data["pb_ratio"],
                    eps=market_data["eps"],
                    revenue_growth=12.5,
                    profit_margin=18.3,
                    debt_to_equity=0.45,
                    valuation="fairly_valued",
                ) if include_fundamentals else None,
                key_points=data.get("bullish_factors", []) + data.get("bearish_factors", []),
                recommendation=AIRecommendation(
                    type=rec_type_map.get(rating, "hold"),
                    symbol=symbol,
                    reason=data.get("summary", "Đánh giá tổng hợp"),
                    confidence=data.get("confidence_score", 65) / 100,
                    target_price=data.get("target_price_1"),
                    stop_loss=data.get("stop_loss"),
                ),
                generated_at=datetime.now(),
            )
        except Exception as e:
            # Fallback to demo response on error
            return self._get_demo_stock_insight(symbol, include_technicals, include_fundamentals)

    def _get_demo_stock_insight(
        self,
        symbol: str,
        include_technicals: bool,
        include_fundamentals: bool,
    ) -> StockInsightResponse:
        """Generate demo stock insight"""
        return StockInsightResponse(
            symbol=symbol,
            name=f"{symbol} Corporation",
            analysis=f"[Demo] Cổ phiếu {symbol} đang trong xu hướng tích cực. "
                    f"Dòng tiền ổn định với khối lượng giao dịch tăng. "
                    f"Khuyến nghị theo dõi và cân nhắc tích lũy.",
            sentiment=Sentiment.BULLISH,
            score=72.5,
            risk_level=RiskLevel.MEDIUM,
            technicals=TechnicalAnalysis(
                trend="uptrend",
                support=82000,
                resistance=88000,
                rsi=58.5,
                macd_signal="buy",
                volume_trend="increasing",
            ) if include_technicals else None,
            fundamentals=FundamentalAnalysis(
                pe_ratio=15.2,
                pb_ratio=2.8,
                eps=5600,
                revenue_growth=12.5,
                profit_margin=18.3,
                debt_to_equity=0.45,
                valuation="fairly_valued",
            ) if include_fundamentals else None,
            key_points=[
                "RSI ở vùng trung tính, chưa quá mua",
                "P/E hợp lý so với trung bình ngành",
                "Dòng tiền từ HĐKD tích cực",
                "Thị phần ổn định",
            ],
            recommendation=AIRecommendation(
                type="buy",
                symbol=symbol,
                reason="Định giá hợp lý với triển vọng tăng trưởng",
                confidence=0.72,
                target_price=88000,
                stop_loss=80000,
            ),
            generated_at=datetime.now(),
        )

    async def get_portfolio_health(
        self,
        user_id: str,
        holdings: list[dict],
    ) -> PortfolioHealthResponse:
        """Analyze portfolio health and provide recommendations"""

        # Use demo holdings if none provided
        if not holdings:
            holdings = [
                {"symbol": "VNM", "quantity": 500, "avg_cost": 82000, "current_price": 85200, "value": 42600000},
                {"symbol": "FPT", "quantity": 300, "avg_cost": 88000, "current_price": 92100, "value": 27630000},
                {"symbol": "VIC", "quantity": 1000, "avg_cost": 45000, "current_price": 42500, "value": 42500000},
                {"symbol": "HPG", "quantity": 2000, "avg_cost": 24000, "current_price": 25800, "value": 51600000},
            ]

        total_value = sum(h.get("value", 0) for h in holdings)
        cash_balance = 45680000

        # Demo mode
        if not self.client:
            return self._get_demo_portfolio_health(holdings, total_value)

        try:
            prompt = get_portfolio_analysis_prompt(holdings, total_value, cash_balance)

            ai_response = await self._call_openai(
                system_prompt="Bạn là chuyên gia quản lý danh mục. Trả lời chính xác theo format JSON.",
                user_message=prompt,
                temperature=0.5,
                max_tokens=1500,
            )

            data = self._extract_json(ai_response)

            return PortfolioHealthResponse(
                overall_score=data.get("health_score", 75),
                risk_level=RiskLevel(data.get("risk_level", "medium")),
                diversification_score=data.get("diversification_score", 68),
                metrics=[
                    PortfolioMetric(
                        name="Đa dạng hóa ngành",
                        value=data.get("diversification_score", 68),
                        status="warning" if data.get("diversification_score", 68) < 70 else "good",
                        description=data.get("concentration_risk", "Cần đa dạng hóa thêm"),
                    ),
                    PortfolioMetric(
                        name="Chất lượng cổ phiếu",
                        value=75,
                        status="good",
                        description="Danh mục chất lượng tốt",
                    ),
                ],
                concerns=data.get("concerns", ["Tập trung cao vào một số mã"]),
                recommendations=[
                    AIRecommendation(
                        type=rec.get("action", "hold"),
                        symbol=rec.get("symbol", ""),
                        reason=rec.get("reason", ""),
                        confidence=0.7,
                    )
                    for rec in data.get("rebalancing_suggestions", [])[:3]
                ],
                generated_at=datetime.now(),
            )
        except Exception as e:
            return self._get_demo_portfolio_health(holdings, total_value)

    def _get_demo_portfolio_health(
        self,
        holdings: list[dict],
        total_value: float,
    ) -> PortfolioHealthResponse:
        """Generate demo portfolio health"""
        return PortfolioHealthResponse(
            overall_score=75.5,
            risk_level=RiskLevel.MEDIUM,
            diversification_score=68.0,
            metrics=[
                PortfolioMetric(
                    name="Đa dạng hóa ngành",
                    value=68.0,
                    status="warning",
                    description="Tập trung nhiều vào ngành Tiêu dùng (35%)",
                ),
                PortfolioMetric(
                    name="Hiệu suất 30 ngày",
                    value=8.5,
                    status="good",
                    description="Vượt VN-Index 3.2%",
                ),
                PortfolioMetric(
                    name="Độ biến động",
                    value=22.5,
                    status="warning",
                    description="Cao hơn mức trung bình 15%",
                ),
            ],
            concerns=[
                "Tập trung cao vào 3 mã chiếm >60% danh mục",
                "Chưa có exposure vào ngành Ngân hàng",
            ],
            recommendations=[
                AIRecommendation(
                    type="buy",
                    symbol="TCB",
                    reason="Tăng exposure ngành Ngân hàng, giảm rủi ro tập trung",
                    confidence=0.75,
                    target_price=35000,
                ),
            ],
            generated_at=datetime.now(),
        )

    async def get_daily_briefing(
        self,
        user_id: str,
        watchlist: Optional[list[str]] = None,
    ) -> DailyBriefingResponse:
        """Generate daily market briefing"""

        # Mock market data
        market_data = {
            "vn_index": {"value": 1245.32, "change": 15.23, "change_percent": 1.24},
            "hnx_index": {"value": 235.45, "change": 2.12, "change_percent": 0.91},
            "total_volume": "850 triệu CP",
            "total_value": "18,500 tỷ đồng",
            "foreign_net": "+125 tỷ",
        }

        portfolio_data = {
            "total_value": 245680000,
            "daily_pnl": 3450000,
            "daily_pnl_percent": 1.43,
        }

        if not watchlist:
            watchlist = ["VNM", "FPT", "VIC"]

        # Demo mode
        if not self.client:
            return self._get_demo_daily_briefing(watchlist)

        try:
            prompt = get_daily_briefing_prompt(market_data, portfolio_data, watchlist)

            ai_response = await self._call_openai(
                system_prompt="Bạn là chuyên gia thị trường. Tạo bản tin theo format JSON.",
                user_message=prompt,
                temperature=0.7,
                max_tokens=2000,
            )

            data = self._extract_json(ai_response)

            sentiment_map = {
                "bullish": Sentiment.BULLISH,
                "bearish": Sentiment.BEARISH,
                "neutral": Sentiment.NEUTRAL,
            }

            return DailyBriefingResponse(
                date=datetime.now(),
                market_summary=data.get("market_summary", "Thị trường giao dịch tích cực."),
                sentiment=sentiment_map.get(data.get("market_outlook", "neutral"), Sentiment.NEUTRAL),
                highlights=[
                    MarketHighlight(
                        title=h.get("title", ""),
                        description=h.get("description", ""),
                        sentiment=sentiment_map.get(h.get("impact", "neutral"), Sentiment.NEUTRAL),
                        impact="medium",
                    )
                    for h in data.get("key_highlights", [])[:3]
                ],
                top_gainers=[
                    StockMovement(
                        symbol="VIC",
                        name="Vingroup",
                        price=43500,
                        change=2900,
                        change_percent=7.14,
                        reason="Kỳ vọng thoái vốn",
                    ),
                ],
                top_losers=[
                    StockMovement(
                        symbol="MWG",
                        name="Mobile World",
                        price=52000,
                        change=-2100,
                        change_percent=-3.88,
                        reason="Kết quả kinh doanh",
                    ),
                ],
                watchlist_alerts=[
                    alert.get("message", "")
                    for alert in data.get("watchlist_updates", [])
                ],
                recommendations=[
                    AIRecommendation(
                        type=rec.get("action", "watch"),
                        symbol=rec.get("symbol", ""),
                        reason=rec.get("reason", ""),
                        confidence=0.7,
                    )
                    for rec in data.get("recommended_actions", [])[:3]
                ],
            )
        except Exception as e:
            return self._get_demo_daily_briefing(watchlist)

    def _get_demo_daily_briefing(
        self,
        watchlist: list[str],
    ) -> DailyBriefingResponse:
        """Generate demo daily briefing"""
        return DailyBriefingResponse(
            date=datetime.now(),
            market_summary="[Demo] Thị trường khởi sắc với thanh khoản tăng. "
                          "VN-Index tăng 1.2% với dòng tiền lan tỏa. "
                          "Nhóm Ngân hàng và Bất động sản dẫn dắt.",
            sentiment=Sentiment.BULLISH,
            highlights=[
                MarketHighlight(
                    title="Dòng tiền ETF tích cực",
                    description="Khối ngoại mua ròng qua ETF phiên thứ 5 liên tiếp",
                    sentiment=Sentiment.BULLISH,
                    impact="medium",
                ),
                MarketHighlight(
                    title="Nhóm BĐS hồi phục",
                    description="Các mã BĐS tăng mạnh sau tin chính sách",
                    sentiment=Sentiment.BULLISH,
                    impact="high",
                ),
            ],
            top_gainers=[
                StockMovement(
                    symbol="VIC",
                    name="Vingroup",
                    price=43500,
                    change=2900,
                    change_percent=7.14,
                    reason="Kỳ vọng thoái vốn Vinfast",
                ),
                StockMovement(
                    symbol="HPG",
                    name="Hoa Phat",
                    price=26200,
                    change=1500,
                    change_percent=6.07,
                    reason="Giá thép tăng trở lại",
                ),
            ],
            top_losers=[
                StockMovement(
                    symbol="MWG",
                    name="Mobile World",
                    price=52000,
                    change=-2100,
                    change_percent=-3.88,
                    reason="Kết quả kinh doanh dưới kỳ vọng",
                ),
            ],
            watchlist_alerts=[
                f"{s}: Đang test vùng kháng cự quan trọng"
                for s in (watchlist or [])[:2]
            ],
            recommendations=[
                AIRecommendation(
                    type="watch",
                    symbol="VCB",
                    reason="Setup đẹp, chờ breakout",
                    confidence=0.7,
                    target_price=98000,
                ),
            ],
        )


# Singleton instance
ai_service = AIService()
