import { Search, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import {
  useNewsStore,
  getCategoryLabel,
  type NewsCategory,
  type NewsSource,
} from '@/stores/news-store'

const ALL_CATEGORIES: NewsCategory[] = ['market', 'company', 'macro', 'crypto', 'international']
const ALL_SOURCES: NewsSource[] = ['CafeF', 'VnExpress', 'Vietstock', 'Reuters', 'Bloomberg']

export function NewsFilters() {
  const {
    newsFilters,
    setSearchQuery,
    toggleCategory,
    toggleSource,
    setSortOrder,
    clearNewsFilters,
  } = useNewsStore()

  const hasActiveFilters =
    newsFilters.search ||
    newsFilters.categories.length > 0 ||
    newsFilters.sources.length > 0

  return (
    <div className="space-y-3">
      {/* Search & Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
          <Input
            value={newsFilters.search}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm tin tức..."
            className="pl-10 h-10 text-[14px] bg-[var(--color-bg-secondary)] border-[var(--color-border)]"
          />
          {newsFilters.search && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex gap-2">
          {/* Category Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'h-10 text-[13px] border-[var(--color-border)]',
                  newsFilters.categories.length > 0 && 'border-[var(--color-brand)] text-[var(--color-brand)]'
                )}
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Danh mục
                {newsFilters.categories.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px] bg-[var(--color-brand)]/10 text-[var(--color-brand)]">
                    {newsFilters.categories.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-[var(--color-surface)] border-[var(--color-border)]">
              <DropdownMenuLabel className="text-[12px]">Chọn danh mục</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ALL_CATEGORIES.map((category) => (
                <DropdownMenuCheckboxItem
                  key={category}
                  checked={newsFilters.categories.includes(category)}
                  onCheckedChange={() => toggleCategory(category)}
                  className="text-[13px]"
                >
                  {getCategoryLabel(category)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Source Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'h-10 text-[13px] border-[var(--color-border)]',
                  newsFilters.sources.length > 0 && 'border-[var(--color-brand)] text-[var(--color-brand)]'
                )}
              >
                Nguồn
                {newsFilters.sources.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px] bg-[var(--color-brand)]/10 text-[var(--color-brand)]">
                    {newsFilters.sources.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-[var(--color-surface)] border-[var(--color-border)]">
              <DropdownMenuLabel className="text-[12px]">Chọn nguồn tin</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ALL_SOURCES.map((source) => (
                <DropdownMenuCheckboxItem
                  key={source}
                  checked={newsFilters.sources.includes(source)}
                  onCheckedChange={() => toggleSource(source)}
                  className="text-[13px]"
                >
                  {source}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-10 text-[13px] border-[var(--color-border)]"
              >
                <ArrowUpDown className="h-4 w-4 mr-2" />
                {newsFilters.sortOrder === 'newest' ? 'Mới nhất' : 'Cũ nhất'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 bg-[var(--color-surface)] border-[var(--color-border)]">
              <DropdownMenuCheckboxItem
                checked={newsFilters.sortOrder === 'newest'}
                onCheckedChange={() => setSortOrder('newest')}
                className="text-[13px]"
              >
                Mới nhất
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={newsFilters.sortOrder === 'oldest'}
                onCheckedChange={() => setSortOrder('oldest')}
                className="text-[13px]"
              >
                Cũ nhất
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Active Filters Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {newsFilters.search && (
            <Badge
              variant="secondary"
              className="text-[11px] bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] gap-1 cursor-pointer hover:bg-[var(--color-bg-tertiary)]"
              onClick={() => setSearchQuery('')}
            >
              Tìm: "{newsFilters.search}"
              <X className="h-3 w-3" />
            </Badge>
          )}

          {newsFilters.categories.map((category) => (
            <Badge
              key={category}
              variant="secondary"
              className="text-[11px] bg-[var(--color-brand)]/10 text-[var(--color-brand)] gap-1 cursor-pointer hover:bg-[var(--color-brand)]/20"
              onClick={() => toggleCategory(category)}
            >
              {getCategoryLabel(category)}
              <X className="h-3 w-3" />
            </Badge>
          ))}

          {newsFilters.sources.map((source) => (
            <Badge
              key={source}
              variant="secondary"
              className="text-[11px] bg-purple-500/10 text-purple-500 gap-1 cursor-pointer hover:bg-purple-500/20"
              onClick={() => toggleSource(source)}
            >
              {source}
              <X className="h-3 w-3" />
            </Badge>
          ))}

          <button
            onClick={clearNewsFilters}
            className="text-[12px] text-[var(--color-text-muted)] hover:text-[var(--color-negative)] transition-colors"
          >
            Xóa tất cả
          </button>
        </div>
      )}
    </div>
  )
}
