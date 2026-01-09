"""
AI Research Synthesizer
Tổng hợp tất cả dữ liệu và tạo báo cáo AI toàn diện
"""

import json
import os
from datetime import datetime
from typing import Optional

from .financial_crawler import financial_crawler
from .news_agent import news_agent

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False


class AIResearchSynthesizer:
    """Tổng hợp tất cả dữ liệu và tạo báo cáo AI"""

    def __init__(self):
        self.client = None
        if OPENAI_AVAILABLE and os.getenv("OPENAI_API_KEY"):
            self.client = OpenAI()

    async def generate_full_report(self, symbol: str) -> dict:
        """Tạo báo cáo nghiên cứu toàn diện cho 1 mã"""
        print(f"🔍 Researching {symbol}...")

        # 1. Thu thập tất cả dữ liệu
        print("  📊 Fetching financial reports...")
        financial_data = await financial_crawler.crawl_financial_report(symbol)
        historical_reports = await financial_crawler.get_historical_reports(symbol, years=2)

        print("  📰 Analyzing news...")
        news_data = await news_agent.research_stock(symbol, days=30)
        news_summary = await news_agent.get_news_summary(symbol, days=30)

        print("  📈 Calculating technicals...")
        technical_data = self._calculate_technical_indicators(symbol)

        # 2. AI Synthesis
        print("  🤖 AI synthesizing report...")
        if self.client:
            report = await self._synthesize_report(
                symbol,
                financial_data,
                historical_reports,
                news_data,
                news_summary,
                technical_data,
            )
        else:
            report = self._generate_demo_report(
                symbol, financial_data, news_summary, technical_data
            )

        return report

    async def _synthesize_report(
        self,
        symbol: str,
        financial_data: dict,
        historical_reports: list,
        news_data: list,
        news_summary: dict,
        technical_data: dict,
    ) -> dict:
        """AI tổng hợp báo cáo"""

        # Prepare context
        context = f"""
## Dữ liệu tài chính {symbol}

### Báo cáo gần nhất:
- Doanh thu: {financial_data.get('income_statement', {}).get('revenue', 'N/A'):,}
- Lợi nhuận: {financial_data.get('income_statement', {}).get('net_profit', 'N/A'):,}
- EPS: {financial_data.get('ratios', {}).get('eps', 'N/A')}

### Chỉ số tài chính:
- ROE: {financial_data.get('ratios', {}).get('roe', 'N/A')}%
- P/E: {financial_data.get('ratios', {}).get('pe', 'N/A')}
- P/B: {financial_data.get('ratios', {}).get('pb', 'N/A')}

### Tin tức gần đây (30 ngày):
- Tổng số tin: {news_summary.get('total_news', 0)}
- Tích cực: {news_summary.get('sentiment_distribution', {}).get('positive', 0)}
- Tiêu cực: {news_summary.get('sentiment_distribution', {}).get('negative', 0)}
- Sentiment trung bình: {news_summary.get('average_sentiment_score', 0):.2f}

Tin quan trọng:
{self._format_important_news(news_summary.get('important_news', []))}

### Phân tích kỹ thuật:
{json.dumps(technical_data, indent=2, ensure_ascii=False)}
"""

        prompt = f"""Bạn là chuyên gia phân tích chứng khoán. Dựa trên dữ liệu sau, tạo báo cáo nghiên cứu cho {symbol}.

{context}

Trả về JSON với cấu trúc:
{{
    "executive_summary": "Tóm tắt điều hành 3-5 câu",

    "financial_analysis": {{
        "health_score": 0-100,
        "analysis": "Phân tích chi tiết tình hình tài chính",
        "highlights": [
            {{"metric": "Doanh thu", "assessment": "positive/negative/neutral", "note": "..."}}
        ],
        "concerns": ["Các điểm cần lưu ý"],
        "strengths": ["Điểm mạnh tài chính"]
    }},

    "technical_analysis": {{
        "score": 0-100,
        "trend": "uptrend" | "downtrend" | "sideways",
        "analysis": "Phân tích kỹ thuật chi tiết",
        "support_levels": [xxx, xxx],
        "resistance_levels": [xxx, xxx]
    }},

    "news_sentiment": {{
        "score": 0-100,
        "overall_sentiment": "positive" | "negative" | "neutral",
        "summary": "Tổng hợp tin tức",
        "key_events": []
    }},

    "ai_recommendation": {{
        "rating": "strong_buy" | "buy" | "hold" | "sell" | "strong_sell",
        "confidence": 0-100,
        "price_targets": {{
            "low": xxx,
            "mid": xxx,
            "high": xxx
        }},
        "time_horizon": "ngắn hạn 1-3 tháng",
        "reasoning": "Lý do cho recommendation"
    }},

    "risks": ["Rủi ro 1", "Rủi ro 2"],
    "opportunities": ["Cơ hội 1", "Cơ hội 2"]
}}"""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "Bạn là chuyên gia phân tích chứng khoán Việt Nam. Phân tích khách quan, dựa trên dữ liệu. Trả về JSON hợp lệ.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                max_tokens=2000,
                response_format={"type": "json_object"},
            )

            report = json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"OpenAI error: {e}")
            report = self._generate_demo_report(symbol, financial_data, news_summary, technical_data)

        # Add metadata
        report["symbol"] = symbol
        report["report_date"] = datetime.now().date().isoformat()
        report["report_type"] = "daily"
        report["data_sources"] = ["financial_reports", "news", "technical"]
        report["created_at"] = datetime.now().isoformat()

        return report

    def _format_important_news(self, news_list: list) -> str:
        """Format important news for prompt"""
        if not news_list:
            return "Không có tin quan trọng"

        result = ""
        for n in news_list[:5]:
            sentiment = n.get("sentiment", "neutral")
            emoji = "🟢" if sentiment == "positive" else "🔴" if sentiment == "negative" else "🟡"
            result += f"\n{emoji} {n.get('title', 'N/A')}"

        return result

    def _calculate_technical_indicators(self, symbol: str) -> dict:
        """Calculate technical indicators (demo data)"""
        import random

        current_price = random.randint(20, 150) * 1000
        ma20 = current_price * random.uniform(0.95, 1.05)
        ma50 = current_price * random.uniform(0.90, 1.10)

        return {
            "current_price": current_price,
            "ma20": round(ma20),
            "ma50": round(ma50),
            "rsi": round(random.uniform(30, 70), 1),
            "macd": round(random.uniform(-2, 2), 2),
            "volume_trend": random.choice(["increasing", "decreasing", "stable"]),
            "price_vs_ma20": "above" if current_price > ma20 else "below",
            "price_vs_ma50": "above" if current_price > ma50 else "below",
            "support_1": round(current_price * 0.95),
            "support_2": round(current_price * 0.90),
            "resistance_1": round(current_price * 1.05),
            "resistance_2": round(current_price * 1.10),
        }

    def _generate_demo_report(
        self,
        symbol: str,
        financial_data: dict,
        news_summary: dict,
        technical_data: dict,
    ) -> dict:
        """Generate demo report when AI is not available"""
        import random

        current_price = technical_data.get("current_price", 50000)
        ratings = ["strong_buy", "buy", "hold", "sell", "strong_sell"]
        rating = random.choices(ratings, weights=[15, 25, 40, 15, 5])[0]

        return {
            "symbol": symbol,
            "report_date": datetime.now().date().isoformat(),
            "report_type": "daily",
            "executive_summary": f"{symbol} hiện đang giao dịch ở mức giá hợp lý với các chỉ số tài chính ổn định. Khuyến nghị {rating.replace('_', ' ')} dựa trên phân tích tổng hợp.",
            "financial_analysis": {
                "health_score": random.randint(50, 85),
                "analysis": "Tình hình tài chính ổn định với doanh thu và lợi nhuận tăng trưởng đều đặn.",
                "highlights": [
                    {"metric": "Doanh thu", "assessment": "positive", "note": "Tăng trưởng ổn định"},
                    {"metric": "ROE", "assessment": "positive", "note": "Cao hơn trung bình ngành"},
                ],
                "concerns": ["Nợ vay tăng", "Chi phí hoạt động cao"],
                "strengths": ["Dòng tiền mạnh", "Thị phần dẫn đầu"],
            },
            "technical_analysis": {
                "score": random.randint(40, 80),
                "trend": random.choice(["uptrend", "downtrend", "sideways"]),
                "analysis": f"Giá hiện tại {technical_data.get('price_vs_ma20', 'N/A')} MA20.",
                "support_levels": [technical_data.get("support_1"), technical_data.get("support_2")],
                "resistance_levels": [technical_data.get("resistance_1"), technical_data.get("resistance_2")],
            },
            "news_sentiment": {
                "score": int((news_summary.get("average_sentiment_score", 0) + 1) * 50),
                "overall_sentiment": "positive" if news_summary.get("average_sentiment_score", 0) > 0.2 else "negative" if news_summary.get("average_sentiment_score", 0) < -0.2 else "neutral",
                "summary": f"Có {news_summary.get('total_news', 0)} tin tức trong 30 ngày qua.",
                "key_events": [],
            },
            "ai_recommendation": {
                "rating": rating,
                "confidence": random.randint(55, 85),
                "price_targets": {
                    "low": round(current_price * 0.9),
                    "mid": round(current_price * 1.1),
                    "high": round(current_price * 1.25),
                },
                "time_horizon": "1-3 tháng",
                "reasoning": f"Dựa trên phân tích tổng hợp tài chính, kỹ thuật và tin tức.",
            },
            "risks": [
                "Biến động thị trường chung",
                "Rủi ro ngành",
                "Áp lực cạnh tranh",
            ],
            "opportunities": [
                "Mở rộng thị trường",
                "Ra mắt sản phẩm mới",
                "Tối ưu chi phí",
            ],
            "data_sources": ["financial_reports", "news", "technical"],
            "created_at": datetime.now().isoformat(),
        }

    async def generate_quick_insight(self, symbol: str) -> dict:
        """Generate quick AI insight for a symbol"""
        financial = await financial_crawler.get_financial_summary(symbol)
        news = await news_agent.get_news_summary(symbol, days=7)
        technical = self._calculate_technical_indicators(symbol)

        # Simple scoring
        financial_score = min(100, max(0, 50 + financial.get("revenue_growth_yoy", 0)))
        news_score = int((news.get("average_sentiment_score", 0) + 1) * 50)
        technical_score = 50 + (10 if technical.get("price_vs_ma20") == "above" else -10)

        overall_score = (financial_score + news_score + technical_score) / 3

        if overall_score >= 70:
            rating = "buy"
        elif overall_score >= 50:
            rating = "hold"
        else:
            rating = "sell"

        return {
            "symbol": symbol,
            "overall_score": round(overall_score),
            "rating": rating,
            "financial_score": round(financial_score),
            "news_score": round(news_score),
            "technical_score": round(technical_score),
            "current_price": technical.get("current_price"),
            "key_highlight": f"{'Tích cực' if overall_score >= 60 else 'Trung lập' if overall_score >= 40 else 'Tiêu cực'} - Score {round(overall_score)}/100",
        }


research_synthesizer = AIResearchSynthesizer()
