import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Newspaper, ChevronRight } from 'lucide-react'
import { useNewsStore } from '@/stores/news-store'
import { mockNewsArticles } from '@/lib/mock-news-data'
import { NewsCard } from './news-card'

interface NewsWidgetProps {
  limit?: number
}

export function NewsWidget({ limit = 5 }: NewsWidgetProps) {
  const { articles, setArticles } = useNewsStore()

  // Load mock data on mount
  useEffect(() => {
    if (articles.length === 0) {
      setArticles(mockNewsArticles)
    }
  }, [articles.length, setArticles])

  const latestNews = [...articles]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit)

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-[var(--color-brand)]" />
            Tin tức mới nhất
          </CardTitle>
          <Link
            to="/news"
            className="text-[12px] text-[var(--color-brand)] hover:underline flex items-center gap-0.5"
          >
            Xem tất cả
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {articles.length === 0 ? (
          <NewsWidgetSkeleton count={limit} />
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {latestNews.map((article) => (
              <NewsCard key={article.id} article={article} compact />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function NewsWidgetSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2 py-2">
          <Skeleton className="h-3 w-24 bg-[var(--color-bg-tertiary)]" />
          <Skeleton className="h-4 w-full bg-[var(--color-bg-tertiary)]" />
          <Skeleton className="h-3 w-16 bg-[var(--color-bg-tertiary)]" />
        </div>
      ))}
    </div>
  )
}
