import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Bookmark, ExternalLink, ImageOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  useNewsStore,
  getCategoryLabel,
  getCategoryColor,
  type NewsArticle,
} from '@/stores/news-store'

interface NewsCardProps {
  article: NewsArticle
  compact?: boolean
}

export function NewsCard({ article, compact = false }: NewsCardProps) {
  const { toggleSaveArticle, isArticleSaved } = useNewsStore()
  const isSaved = isArticleSaved(article.id)

  const timeAgo = formatDistanceToNow(new Date(article.publishedAt), {
    addSuffix: true,
    locale: vi,
  })

  const handleOpenSource = () => {
    window.open(article.sourceUrl, '_blank', 'noopener,noreferrer')
  }

  if (compact) {
    return (
      <div
        onClick={handleOpenSource}
        className="flex items-start gap-3 p-3 rounded-lg hover:bg-[var(--color-bg-secondary)] cursor-pointer transition-colors group"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="secondary"
              className={cn('text-[9px] font-medium px-1.5 py-0', getCategoryColor(article.category))}
            >
              {getCategoryLabel(article.category)}
            </Badge>
            <span className="text-[10px] text-[var(--color-text-muted)]">
              {article.source}
            </span>
          </div>
          <p className="text-[13px] font-medium text-[var(--color-text-primary)] line-clamp-2 group-hover:text-[var(--color-brand)]">
            {article.title}
          </p>
          <span className="text-[11px] text-[var(--color-text-muted)] mt-1">
            {timeAgo}
          </span>
        </div>
        <ExternalLink className="h-3.5 w-3.5 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
      </div>
    )
  }

  return (
    <div className="flex gap-4 p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] transition-colors group">
      {/* Thumbnail */}
      <div className="w-[120px] h-[90px] rounded-lg bg-[var(--color-bg-secondary)] overflow-hidden flex-shrink-0">
        {article.imageUrl ? (
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              target.parentElement?.classList.add('flex', 'items-center', 'justify-center')
              const icon = document.createElement('div')
              icon.innerHTML = `<svg class="h-8 w-8 text-[var(--color-text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>`
              target.parentElement?.appendChild(icon)
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff className="h-8 w-8 text-[var(--color-text-muted)]" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1.5">
          <Badge
            variant="secondary"
            className={cn('text-[10px] font-medium', getCategoryColor(article.category))}
          >
            {getCategoryLabel(article.category)}
          </Badge>
          <span className="text-[11px] text-[var(--color-text-muted)]">
            {article.source}
          </span>
          <span className="text-[11px] text-[var(--color-text-muted)]">•</span>
          <span className="text-[11px] text-[var(--color-text-muted)]">{timeAgo}</span>
        </div>

        {/* Title */}
        <h3
          onClick={handleOpenSource}
          className="text-[14px] font-semibold text-[var(--color-text-primary)] line-clamp-2 cursor-pointer hover:text-[var(--color-brand)] transition-colors mb-1"
        >
          {article.title}
        </h3>

        {/* Summary */}
        <p className="text-[12px] text-[var(--color-text-secondary)] line-clamp-2 mb-2">
          {article.summary}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto">
          {/* Related Symbols */}
          <div className="flex items-center gap-1.5">
            {article.relatedSymbols.slice(0, 3).map((symbol) => (
              <Link
                key={symbol}
                to={`/stock/${symbol}`}
                onClick={(e) => e.stopPropagation()}
                className="px-2 py-0.5 rounded bg-[var(--color-bg-secondary)] text-[11px] font-medium text-[var(--color-brand)] hover:bg-[var(--color-brand)]/10 transition-colors"
              >
                {symbol}
              </Link>
            ))}
            {article.relatedSymbols.length > 3 && (
              <span className="text-[11px] text-[var(--color-text-muted)]">
                +{article.relatedSymbols.length - 3}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                toggleSaveArticle(article.id)
              }}
              className={cn(
                'h-8 w-8',
                isSaved
                  ? 'text-[var(--color-brand)]'
                  : 'text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100'
              )}
            >
              <Bookmark className={cn('h-4 w-4', isSaved && 'fill-current')} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleOpenSource}
              className="h-8 w-8 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
