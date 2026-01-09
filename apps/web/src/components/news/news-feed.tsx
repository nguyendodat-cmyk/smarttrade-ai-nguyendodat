import { useEffect } from 'react'
import { ChevronLeft, ChevronRight, Newspaper } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useNewsStore } from '@/stores/news-store'
import { mockNewsArticles } from '@/lib/mock-news-data'
import { NewsCard } from './news-card'
import { NewsFilters } from './news-filters'

interface NewsFeedProps {
  showFilters?: boolean
}

export function NewsFeed({ showFilters = true }: NewsFeedProps) {
  const {
    articles,
    setArticles,
    currentPage,
    setCurrentPage,
    getPaginatedArticles,
    getTotalPages,
    getFilteredArticles,
  } = useNewsStore()

  // Load mock data on mount
  useEffect(() => {
    if (articles.length === 0) {
      setArticles(mockNewsArticles)
    }
  }, [articles.length, setArticles])

  const paginatedArticles = getPaginatedArticles()
  const totalPages = getTotalPages()
  const filteredCount = getFilteredArticles().length

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      {showFilters && <NewsFilters />}

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-[var(--color-text-muted)]">
          Hiển thị {paginatedArticles.length} / {filteredCount} tin tức
        </p>
      </div>

      {/* Articles List */}
      {paginatedArticles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <Newspaper className="h-12 w-12 text-[var(--color-text-muted)] mb-4" />
          <h3 className="text-[15px] font-medium text-[var(--color-text-primary)] mb-2">
            Không tìm thấy tin tức
          </h3>
          <p className="text-[13px] text-[var(--color-text-muted)] text-center">
            Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedArticles.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="h-9 px-3 text-[13px] border-[var(--color-border)]"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Trước
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Show first, last, current, and adjacent pages
              if (
                page === 1 ||
                page === totalPages ||
                Math.abs(page - currentPage) <= 1
              ) {
                return (
                  <Button
                    key={page}
                    variant={page === currentPage ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      'h-9 w-9 p-0 text-[13px]',
                      page === currentPage
                        ? 'bg-[var(--color-brand)] hover:bg-[var(--color-brand)]/90'
                        : 'border-[var(--color-border)]'
                    )}
                  >
                    {page}
                  </Button>
                )
              } else if (
                (page === 2 && currentPage > 3) ||
                (page === totalPages - 1 && currentPage < totalPages - 2)
              ) {
                return (
                  <span key={page} className="text-[var(--color-text-muted)] px-1">
                    ...
                  </span>
                )
              }
              return null
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="h-9 px-3 text-[13px] border-[var(--color-border)]"
          >
            Sau
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  )
}

export function NewsFeedSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1 bg-[var(--color-bg-tertiary)]" />
        <Skeleton className="h-10 w-28 bg-[var(--color-bg-tertiary)]" />
        <Skeleton className="h-10 w-24 bg-[var(--color-bg-tertiary)]" />
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4 p-4 rounded-xl border border-[var(--color-border)]">
          <Skeleton className="w-[120px] h-[90px] rounded-lg bg-[var(--color-bg-tertiary)]" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32 bg-[var(--color-bg-tertiary)]" />
            <Skeleton className="h-5 w-full bg-[var(--color-bg-tertiary)]" />
            <Skeleton className="h-4 w-3/4 bg-[var(--color-bg-tertiary)]" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-12 bg-[var(--color-bg-tertiary)]" />
              <Skeleton className="h-6 w-12 bg-[var(--color-bg-tertiary)]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
