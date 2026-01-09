import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Types
export type NewsCategory = 'market' | 'company' | 'macro' | 'crypto' | 'international'
export type NewsSource = 'CafeF' | 'VnExpress' | 'Vietstock' | 'Reuters' | 'Bloomberg'
export type EventType = 'earnings' | 'economic' | 'dividend' | 'ipo'
export type EventImpact = 'high' | 'medium' | 'low'
export type SortOrder = 'newest' | 'oldest'
export type TimeFilter = 'week' | 'month' | 'all'

export interface NewsArticle {
  id: string
  title: string
  summary: string
  source: NewsSource
  sourceUrl: string
  imageUrl?: string
  category: NewsCategory
  relatedSymbols: string[]
  publishedAt: string
}

export interface CalendarEvent {
  id: string
  title: string
  type: EventType
  date: string
  time?: string
  impact: EventImpact
  relatedSymbols: string[]
  description?: string
}

interface NewsFilters {
  search: string
  categories: NewsCategory[]
  sources: NewsSource[]
  sortOrder: SortOrder
}

interface EventFilters {
  timeFilter: TimeFilter
  types: EventType[]
}

interface NewsState {
  // Articles
  articles: NewsArticle[]

  // Events
  events: CalendarEvent[]

  // Saved
  savedArticleIds: string[]

  // Filters
  newsFilters: NewsFilters
  eventFilters: EventFilters

  // Pagination
  currentPage: number
  itemsPerPage: number

  // Actions - Articles
  setArticles: (articles: NewsArticle[]) => void

  // Actions - Events
  setEvents: (events: CalendarEvent[]) => void

  // Actions - Saved
  toggleSaveArticle: (id: string) => void
  isArticleSaved: (id: string) => boolean
  getSavedArticles: () => NewsArticle[]

  // Actions - News Filters
  setSearchQuery: (query: string) => void
  toggleCategory: (category: NewsCategory) => void
  toggleSource: (source: NewsSource) => void
  setSortOrder: (order: SortOrder) => void
  clearNewsFilters: () => void

  // Actions - Event Filters
  setTimeFilter: (filter: TimeFilter) => void
  toggleEventType: (type: EventType) => void
  clearEventFilters: () => void

  // Actions - Pagination
  setCurrentPage: (page: number) => void

  // Computed
  getFilteredArticles: () => NewsArticle[]
  getFilteredEvents: () => CalendarEvent[]
  getTotalPages: () => number
  getPaginatedArticles: () => NewsArticle[]
}

const defaultNewsFilters: NewsFilters = {
  search: '',
  categories: [],
  sources: [],
  sortOrder: 'newest',
}

const defaultEventFilters: EventFilters = {
  timeFilter: 'month',
  types: [],
}

export const useNewsStore = create<NewsState>()(
  persist(
    (set, get) => ({
      articles: [],
      events: [],
      savedArticleIds: [],
      newsFilters: defaultNewsFilters,
      eventFilters: defaultEventFilters,
      currentPage: 1,
      itemsPerPage: 10,

      // Articles
      setArticles: (articles) => set({ articles }),

      // Events
      setEvents: (events) => set({ events }),

      // Saved
      toggleSaveArticle: (id) => {
        set((state) => ({
          savedArticleIds: state.savedArticleIds.includes(id)
            ? state.savedArticleIds.filter((savedId) => savedId !== id)
            : [...state.savedArticleIds, id],
        }))
      },

      isArticleSaved: (id) => {
        return get().savedArticleIds.includes(id)
      },

      getSavedArticles: () => {
        const { articles, savedArticleIds } = get()
        return articles.filter((a) => savedArticleIds.includes(a.id))
      },

      // News Filters
      setSearchQuery: (query) => {
        set((state) => ({
          newsFilters: { ...state.newsFilters, search: query },
          currentPage: 1,
        }))
      },

      toggleCategory: (category) => {
        set((state) => {
          const categories = state.newsFilters.categories.includes(category)
            ? state.newsFilters.categories.filter((c) => c !== category)
            : [...state.newsFilters.categories, category]
          return {
            newsFilters: { ...state.newsFilters, categories },
            currentPage: 1,
          }
        })
      },

      toggleSource: (source) => {
        set((state) => {
          const sources = state.newsFilters.sources.includes(source)
            ? state.newsFilters.sources.filter((s) => s !== source)
            : [...state.newsFilters.sources, source]
          return {
            newsFilters: { ...state.newsFilters, sources },
            currentPage: 1,
          }
        })
      },

      setSortOrder: (order) => {
        set((state) => ({
          newsFilters: { ...state.newsFilters, sortOrder: order },
        }))
      },

      clearNewsFilters: () => {
        set({ newsFilters: defaultNewsFilters, currentPage: 1 })
      },

      // Event Filters
      setTimeFilter: (filter) => {
        set((state) => ({
          eventFilters: { ...state.eventFilters, timeFilter: filter },
        }))
      },

      toggleEventType: (type) => {
        set((state) => {
          const types = state.eventFilters.types.includes(type)
            ? state.eventFilters.types.filter((t) => t !== type)
            : [...state.eventFilters.types, type]
          return {
            eventFilters: { ...state.eventFilters, types },
          }
        })
      },

      clearEventFilters: () => {
        set({ eventFilters: defaultEventFilters })
      },

      // Pagination
      setCurrentPage: (page) => set({ currentPage: page }),

      // Computed - Filtered Articles
      getFilteredArticles: () => {
        const { articles, newsFilters } = get()
        let filtered = [...articles]

        // Search
        if (newsFilters.search) {
          const searchLower = newsFilters.search.toLowerCase()
          filtered = filtered.filter(
            (a) =>
              a.title.toLowerCase().includes(searchLower) ||
              a.summary.toLowerCase().includes(searchLower)
          )
        }

        // Categories
        if (newsFilters.categories.length > 0) {
          filtered = filtered.filter((a) =>
            newsFilters.categories.includes(a.category)
          )
        }

        // Sources
        if (newsFilters.sources.length > 0) {
          filtered = filtered.filter((a) =>
            newsFilters.sources.includes(a.source)
          )
        }

        // Sort
        filtered.sort((a, b) => {
          const dateA = new Date(a.publishedAt).getTime()
          const dateB = new Date(b.publishedAt).getTime()
          return newsFilters.sortOrder === 'newest' ? dateB - dateA : dateA - dateB
        })

        return filtered
      },

      // Computed - Filtered Events
      getFilteredEvents: () => {
        const { events, eventFilters } = get()
        const now = new Date()
        let filtered = [...events]

        // Time filter
        if (eventFilters.timeFilter === 'week') {
          const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter((e) => {
            const eventDate = new Date(e.date)
            return eventDate >= now && eventDate <= weekFromNow
          })
        } else if (eventFilters.timeFilter === 'month') {
          const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter((e) => {
            const eventDate = new Date(e.date)
            return eventDate >= now && eventDate <= monthFromNow
          })
        }

        // Event types
        if (eventFilters.types.length > 0) {
          filtered = filtered.filter((e) => eventFilters.types.includes(e.type))
        }

        // Sort by date
        filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        return filtered
      },

      // Computed - Pagination
      getTotalPages: () => {
        const { itemsPerPage, getFilteredArticles } = get()
        return Math.ceil(getFilteredArticles().length / itemsPerPage)
      },

      getPaginatedArticles: () => {
        const { currentPage, itemsPerPage, getFilteredArticles } = get()
        const filtered = getFilteredArticles()
        const start = (currentPage - 1) * itemsPerPage
        return filtered.slice(start, start + itemsPerPage)
      },
    }),
    {
      name: 'news-storage',
      partialize: (state) => ({
        savedArticleIds: state.savedArticleIds,
      }),
    }
  )
)

// Helper functions
export function getCategoryLabel(category: NewsCategory): string {
  const labels: Record<NewsCategory, string> = {
    market: 'Thị trường',
    company: 'Doanh nghiệp',
    macro: 'Vĩ mô',
    crypto: 'Crypto',
    international: 'Quốc tế',
  }
  return labels[category]
}

export function getCategoryColor(category: NewsCategory): string {
  const colors: Record<NewsCategory, string> = {
    market: 'bg-blue-500/10 text-blue-500',
    company: 'bg-green-500/10 text-green-500',
    macro: 'bg-purple-500/10 text-purple-500',
    crypto: 'bg-orange-500/10 text-orange-500',
    international: 'bg-slate-500/10 text-slate-500',
  }
  return colors[category]
}

export function getEventTypeId(type: EventType): string {
  return type
}

export function getEventTypeLabel(type: EventType): string {
  const labels: Record<EventType, string> = {
    earnings: 'KQKD',
    economic: 'Kinh tế',
    dividend: 'Cổ tức',
    ipo: 'IPO',
  }
  return labels[type]
}

export function getImpactColor(impact: EventImpact): string {
  const colors: Record<EventImpact, string> = {
    high: 'text-red-500',
    medium: 'text-yellow-500',
    low: 'text-green-500',
  }
  return colors[impact]
}

export function getImpactLevel(impact: EventImpact): EventImpact {
  return impact
}
