import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/layout/page-header'
import { Newspaper, Calendar, Bookmark } from 'lucide-react'
import { NewsFeed } from '@/components/news/news-feed'
import { EconomicCalendar } from '@/components/news/economic-calendar'
import { SavedArticles } from '@/components/news/saved-articles'
import { useNewsStore } from '@/stores/news-store'

type TabValue = 'news' | 'calendar' | 'saved'

export function NewsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab') as TabValue | null
  const [activeTab, setActiveTab] = useState<TabValue>(
    tabParam && ['news', 'calendar', 'saved'].includes(tabParam) ? tabParam : 'news'
  )

  const { savedArticleIds } = useNewsStore()

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    const tab = value as TabValue
    setActiveTab(tab)
    if (tab === 'news') {
      setSearchParams({})
    } else {
      setSearchParams({ tab })
    }
  }

  // Sync with URL on mount and URL changes
  useEffect(() => {
    if (tabParam && ['news', 'calendar', 'saved'].includes(tabParam)) {
      setActiveTab(tabParam)
    } else if (!tabParam) {
      setActiveTab('news')
    }
  }, [tabParam])

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Tin tức & Nghiên cứu"
        description="Cập nhật tin tức thị trường, lịch kinh tế và bài viết đã lưu"
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="bg-[var(--color-bg-secondary)] p-1">
          <TabsTrigger value="news" className="text-[12px] flex items-center gap-1.5">
            <Newspaper className="h-3.5 w-3.5" />
            Tin tức
          </TabsTrigger>
          <TabsTrigger value="calendar" className="text-[12px] flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Lịch kinh tế
          </TabsTrigger>
          <TabsTrigger value="saved" className="text-[12px] flex items-center gap-1.5">
            <Bookmark className="h-3.5 w-3.5" />
            Đã lưu
            {savedArticleIds.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-[var(--color-brand)]/10 text-[var(--color-brand)]">
                {savedArticleIds.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="news" className="mt-6">
          <NewsFeed showFilters />
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <EconomicCalendar />
        </TabsContent>

        <TabsContent value="saved" className="mt-6">
          <SavedArticles />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default NewsPage
