import { useEffect } from 'react'
import { Bookmark } from 'lucide-react'
import { useNewsStore } from '@/stores/news-store'
import { mockNewsArticles } from '@/lib/mock-news-data'
import { NewsCard } from './news-card'

export function SavedArticles() {
  const { articles, setArticles, getSavedArticles } = useNewsStore()

  // Load mock data on mount
  useEffect(() => {
    if (articles.length === 0) {
      setArticles(mockNewsArticles)
    }
  }, [articles.length, setArticles])

  const savedArticles = getSavedArticles()

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-[var(--color-text-muted)]">
          {savedArticles.length} bài viết đã lưu
        </p>
      </div>

      {/* Saved Articles List */}
      {savedArticles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <Bookmark className="h-12 w-12 text-[var(--color-text-muted)] mb-4" />
          <h3 className="text-[15px] font-medium text-[var(--color-text-primary)] mb-2">
            Chưa có bài viết nào được lưu
          </h3>
          <p className="text-[13px] text-[var(--color-text-muted)] text-center max-w-sm">
            Nhấn vào biểu tượng bookmark trên các bài viết để lưu lại và đọc sau
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {savedArticles.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  )
}
