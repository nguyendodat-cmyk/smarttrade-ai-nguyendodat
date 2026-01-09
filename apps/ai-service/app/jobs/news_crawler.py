"""
News Crawler for SmartTrade AI Knowledge Base
Automatically fetches and ingests news from Vietnamese financial sources
"""

import asyncio
import re
from datetime import datetime
from typing import List, Dict, Optional
import httpx
from bs4 import BeautifulSoup

# Known Vietnamese stock symbols for extraction
KNOWN_SYMBOLS = {
    'VNM', 'FPT', 'VIC', 'VHM', 'VCB', 'TCB', 'VPB', 'MBB', 'HPG', 'MWG',
    'VRE', 'SAB', 'MSN', 'GAS', 'PLX', 'VJC', 'BID', 'CTG', 'ACB', 'STB',
    'SSI', 'VND', 'HCM', 'SHS', 'VCI', 'BSI', 'AGR', 'CTS', 'TVS', 'VDS',
    'REE', 'PNJ', 'DGW', 'FRT', 'MIG', 'PVD', 'PVS', 'DPM', 'DCM', 'PHR',
    'GMD', 'VSC', 'HAH', 'VOS', 'MVN', 'VTP', 'HVN', 'ACV', 'NCT', 'SCS',
    'NVL', 'PDR', 'KDH', 'DXG', 'HDG', 'KBC', 'IJC', 'SZC', 'CEO', 'LDG',
}


class NewsCrawler:
    """Crawls financial news from Vietnamese sources"""

    # News sources configuration
    SOURCES = [
        {
            'name': 'CafeF',
            'base_url': 'https://cafef.vn',
            'list_url': 'https://cafef.vn/chung-khoan.chn',
            'article_selector': '.tlitem',
            'title_selector': 'h3 a',
            'link_selector': 'h3 a',
            'content_selector': '.detail-content',
        },
        {
            'name': 'VnExpress',
            'base_url': 'https://vnexpress.net',
            'list_url': 'https://vnexpress.net/kinh-doanh/chung-khoan',
            'article_selector': 'article.item-news',
            'title_selector': 'h3.title-news a',
            'link_selector': 'h3.title-news a',
            'content_selector': 'article.fck_detail',
        },
    ]

    def __init__(self):
        self.client = httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,
            headers={
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
        )

    async def crawl_all(self) -> List[Dict]:
        """Crawl all configured news sources"""
        all_news = []

        for source in self.SOURCES:
            try:
                news = await self.crawl_source(source)
                all_news.extend(news)
                print(f"✅ Crawled {len(news)} articles from {source['name']}")
            except Exception as e:
                print(f"❌ Error crawling {source['name']}: {e}")

        return all_news

    async def crawl_source(self, source: Dict) -> List[Dict]:
        """Crawl a single news source"""
        news_items = []

        try:
            # Fetch list page
            response = await self.client.get(source['list_url'])
            response.raise_for_status()

            soup = BeautifulSoup(response.text, 'html.parser')
            articles = soup.select(source['article_selector'])[:15]  # Top 15

            for article in articles:
                try:
                    # Extract title and link
                    title_elem = article.select_one(source['title_selector'])
                    if not title_elem:
                        continue

                    title = title_elem.get_text().strip()
                    link = title_elem.get('href', '')

                    # Make absolute URL
                    if link and not link.startswith('http'):
                        link = source['base_url'] + link

                    if not link:
                        continue

                    # Fetch article content
                    content = await self.fetch_article_content(
                        link,
                        source['content_selector']
                    )

                    if not content or len(content) < 100:
                        continue

                    # Extract stock symbols
                    symbols = self.extract_symbols(title + ' ' + content)
                    primary_symbol = symbols[0] if symbols else None

                    news_items.append({
                        'title': title,
                        'content': content,
                        'url': link,
                        'source_name': source['name'],
                        'symbol': primary_symbol,
                        'symbols_mentioned': symbols,
                        'published_at': datetime.now(),
                    })

                except Exception as e:
                    print(f"  Error processing article: {e}")
                    continue

        except Exception as e:
            print(f"Error fetching {source['list_url']}: {e}")

        return news_items

    async def fetch_article_content(
        self,
        url: str,
        content_selector: str
    ) -> Optional[str]:
        """Fetch full article content"""
        try:
            response = await self.client.get(url)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, 'html.parser')

            # Try specific selector first
            content_elem = soup.select_one(content_selector)
            if content_elem:
                # Remove script and style tags
                for tag in content_elem.find_all(['script', 'style', 'iframe']):
                    tag.decompose()
                return content_elem.get_text(separator='\n').strip()

            # Fallback selectors
            fallback_selectors = [
                '.fck_detail',
                '.detail-content',
                '.article-content',
                '.post-content',
                'article',
            ]

            for selector in fallback_selectors:
                elem = soup.select_one(selector)
                if elem:
                    for tag in elem.find_all(['script', 'style', 'iframe']):
                        tag.decompose()
                    return elem.get_text(separator='\n').strip()

            return None

        except Exception as e:
            print(f"Error fetching article {url}: {e}")
            return None

    def extract_symbols(self, text: str) -> List[str]:
        """Extract stock symbols from text"""
        # Find all 3-letter uppercase words
        potential_symbols = re.findall(r'\b([A-Z]{3})\b', text)

        # Filter to known symbols
        valid_symbols = [s for s in potential_symbols if s in KNOWN_SYMBOLS]

        # Return unique symbols, preserving order
        seen = set()
        unique = []
        for s in valid_symbols:
            if s not in seen:
                seen.add(s)
                unique.append(s)

        return unique

    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()


# Singleton instance
news_crawler = NewsCrawler()


async def run_crawler_job():
    """Run crawler job - can be called from scheduler"""
    from ..services.ingestion_service import ingestion_service

    print(f"\n{'='*50}")
    print(f"Starting news crawl at {datetime.now()}")
    print(f"{'='*50}\n")

    try:
        # Crawl news
        news_items = await news_crawler.crawl_all()
        print(f"\nTotal articles fetched: {len(news_items)}")

        # Ingest into knowledge base
        if news_items:
            count = await ingestion_service.ingest_news_batch(news_items)
            print(f"Ingested {count} chunks into knowledge base")

    except Exception as e:
        print(f"Error in crawler job: {e}")

    print(f"\n{'='*50}")
    print(f"Crawl completed at {datetime.now()}")
    print(f"{'='*50}\n")


# CLI entry point
if __name__ == "__main__":
    asyncio.run(run_crawler_job())
