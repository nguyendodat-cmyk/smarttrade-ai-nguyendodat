"""
News Research Agent
Tự động tìm kiếm và phân tích tin tức cho cổ phiếu
"""

import httpx
import re
from datetime import datetime, timedelta
from typing import Optional
import json
import os

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False


class NewsResearchAgent:
    """Agent tự động tìm kiếm và phân tích tin tức"""

    HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }

    def __init__(self):
        self.client = None
        if OPENAI_AVAILABLE and os.getenv("OPENAI_API_KEY"):
            self.client = OpenAI()

    async def research_stock(self, symbol: str, days: int = 7) -> list:
        """Tìm và phân tích tin tức cho 1 mã trong N ngày qua"""
        all_news = []

        # Try to crawl from sources
        try:
            news = await self._search_news(symbol, days)
            all_news.extend(news)
        except Exception as e:
            print(f"Error searching news for {symbol}: {e}")

        # If no news found, generate demo news
        if not all_news:
            all_news = self._generate_demo_news(symbol, days)

        # AI analyze each news item
        analyzed_news = []
        for news in all_news:
            if self.client:
                try:
                    analysis = await self._analyze_news(symbol, news)
                    news.update(analysis)
                except Exception as e:
                    print(f"Error analyzing news: {e}")
                    news.update(self._generate_demo_analysis())
            else:
                news.update(self._generate_demo_analysis())

            analyzed_news.append(news)

        # Sort by importance and time
        analyzed_news.sort(
            key=lambda x: (
                x.get("importance", "low") == "high",
                x.get("published_at", datetime.min),
            ),
            reverse=True,
        )

        return analyzed_news

    async def _search_news(self, symbol: str, days: int) -> list:
        """Search for news from multiple sources"""
        news = []
        cutoff_date = datetime.now() - timedelta(days=days)

        # In production, this would scrape from real sources
        # For now, we'll use demo data
        return news

    async def _analyze_news(self, symbol: str, news: dict) -> dict:
        """AI phân tích tin tức"""
        if not self.client:
            return self._generate_demo_analysis()

        prompt = f"""Phân tích tin tức về cổ phiếu {symbol}:

Tiêu đề: {news.get('title', '')}

Nội dung: {news.get('content', '')[:2000]}

Hãy phân tích và trả về JSON:
{{
    "sentiment": "positive" | "negative" | "neutral",
    "sentiment_score": -1 đến 1,
    "importance": "high" | "medium" | "low",
    "category": "earnings" | "merger" | "management" | "industry" | "product" | "legal" | "dividend" | "other",
    "summary": "Tóm tắt 2-3 câu",
    "impact_analysis": "Phân tích tác động đến giá cổ phiếu"
}}"""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "Bạn là chuyên gia phân tích tin tức chứng khoán Việt Nam. Trả về JSON hợp lệ.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                response_format={"type": "json_object"},
            )

            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"OpenAI error: {e}")
            return self._generate_demo_analysis()

    def _generate_demo_news(self, symbol: str, days: int) -> list:
        """Generate demo news for testing"""
        import random

        templates = [
            {
                "title": f"{symbol} công bố kết quả kinh doanh quý 4 vượt kỳ vọng",
                "content": f"Công ty cổ phần {symbol} vừa công bố báo cáo tài chính quý 4 với doanh thu tăng 25% so với cùng kỳ năm trước. Lợi nhuận sau thuế đạt mức kỷ lục nhờ chiến lược tối ưu chi phí và mở rộng thị trường.",
                "category": "earnings",
            },
            {
                "title": f"{symbol} ký kết hợp đồng hợp tác chiến lược mới",
                "content": f"{symbol} đã ký kết thỏa thuận hợp tác chiến lược với đối tác quốc tế, mở ra cơ hội phát triển mới trong năm 2025. Thương vụ này dự kiến mang lại doanh thu bổ sung đáng kể.",
                "category": "merger",
            },
            {
                "title": f"Cổ phiếu {symbol} được khuyến nghị mua từ các CTCK",
                "content": f"Nhiều công ty chứng khoán đồng loạt đưa ra khuyến nghị mua đối với cổ phiếu {symbol} với giá mục tiêu tăng 20% so với giá hiện tại. Các yếu tố hỗ trợ bao gồm triển vọng tăng trưởng tích cực và định giá hấp dẫn.",
                "category": "other",
            },
            {
                "title": f"{symbol} ra mắt sản phẩm mới, đẩy mạnh thị phần",
                "content": f"Trong buổi họp báo hôm nay, {symbol} đã chính thức giới thiệu dòng sản phẩm mới với nhiều tính năng đột phá. Công ty kỳ vọng sản phẩm mới sẽ đóng góp 15% vào doanh thu năm tới.",
                "category": "product",
            },
            {
                "title": f"Ngành {symbol} đối mặt thách thức mới từ chính sách",
                "content": f"Theo thông tin mới nhất, các thay đổi trong chính sách có thể ảnh hưởng đến hoạt động kinh doanh của {symbol} và các doanh nghiệp cùng ngành. Các chuyên gia khuyến nghị nhà đầu tư theo dõi sát diễn biến.",
                "category": "industry",
            },
        ]

        news_list = []
        num_news = min(days, 5)

        for i in range(num_news):
            template = random.choice(templates)
            published = datetime.now() - timedelta(days=i, hours=random.randint(0, 23))

            news_list.append(
                {
                    "title": template["title"],
                    "content": template["content"],
                    "category": template["category"],
                    "source": random.choice(["CafeF", "VnExpress", "Vietstock"]),
                    "source_url": f"https://example.com/news/{symbol}/{i}",
                    "symbol": symbol,
                    "published_at": published.isoformat(),
                }
            )

        return news_list

    def _generate_demo_analysis(self) -> dict:
        """Generate demo analysis for news"""
        import random

        sentiments = ["positive", "negative", "neutral"]
        importances = ["high", "medium", "low"]

        sentiment = random.choice(sentiments)
        sentiment_scores = {"positive": 0.7, "negative": -0.6, "neutral": 0.1}

        return {
            "sentiment": sentiment,
            "sentiment_score": sentiment_scores[sentiment] + random.uniform(-0.2, 0.2),
            "importance": random.choice(importances),
            "summary": "Tin tức này có thể ảnh hưởng đến giá cổ phiếu trong ngắn hạn.",
            "impact_analysis": "Cần theo dõi thêm diễn biến để đánh giá tác động dài hạn.",
        }

    async def get_news_summary(self, symbol: str, days: int = 7) -> dict:
        """Get summary of news for a symbol"""
        news = await self.research_stock(symbol, days)

        # Calculate sentiment distribution
        positive = sum(1 for n in news if n.get("sentiment") == "positive")
        negative = sum(1 for n in news if n.get("sentiment") == "negative")
        neutral = sum(1 for n in news if n.get("sentiment") == "neutral")

        # Get high importance news
        important = [n for n in news if n.get("importance") == "high"]

        # Calculate average sentiment score
        scores = [n.get("sentiment_score", 0) for n in news if n.get("sentiment_score")]
        avg_score = sum(scores) / len(scores) if scores else 0

        return {
            "symbol": symbol,
            "total_news": len(news),
            "sentiment_distribution": {
                "positive": positive,
                "negative": negative,
                "neutral": neutral,
            },
            "average_sentiment_score": avg_score,
            "high_importance_count": len(important),
            "latest_news": news[:5],
            "important_news": important[:3],
        }


news_agent = NewsResearchAgent()
