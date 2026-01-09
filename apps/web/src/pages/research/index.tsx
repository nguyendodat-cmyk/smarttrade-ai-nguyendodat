import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/layout/page-header'
import {
  TrendingUp,
  FileText,
  Bell,
  RefreshCw,
  Newspaper,
  BarChart3,
} from 'lucide-react'
import { ResearchAlerts } from './components/research-alerts'
import { StockResearchCard } from './components/stock-research-card'
import { FullResearchReport } from './components/full-research-report'
import { QuickStatCard } from './components/quick-stat-card'

// Demo watchlist symbols
const DEMO_WATCHLIST = ['FPT', 'VNM', 'VCB', 'HPG', 'MWG', 'VIC']

async function fetchWatchlistResearch(): Promise<any[]> {
  // In production, this would fetch from /api/v1/research/batch-research
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return DEMO_WATCHLIST.map((symbol) => ({
    symbol,
    ai_rating: ['strong_buy', 'buy', 'hold', 'sell'][Math.floor(Math.random() * 4)],
    confidence_score: 55 + Math.floor(Math.random() * 35),
    financial_health_score: 50 + Math.floor(Math.random() * 40),
    technical_score: 40 + Math.floor(Math.random() * 50),
    sentiment_score: 40 + Math.floor(Math.random() * 50),
    executive_summary: `${symbol} đang có triển vọng tích cực với các chỉ số tài chính ổn định. Khuyến nghị theo dõi sát.`,
    current_price: 30000 + Math.floor(Math.random() * 100000),
    price_target_mid: 35000 + Math.floor(Math.random() * 120000),
    risks: ['Rủi ro thị trường', 'Cạnh tranh ngành'],
    opportunities: ['Mở rộng thị trường', 'Sản phẩm mới'],
    report_date: new Date().toISOString().split('T')[0],
  }))
}

async function fetchResearchAlerts(): Promise<any[]> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  return [
    {
      id: '1',
      symbol: 'FPT',
      alert_type: 'ai_insight',
      priority: 'high',
      title: 'AI khuyến nghị MUA MẠNH cho FPT',
      summary: 'Kết quả kinh doanh Q4 vượt kỳ vọng, doanh thu tăng 25%',
      is_read: false,
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      symbol: 'VNM',
      alert_type: 'news',
      priority: 'medium',
      title: 'VNM công bố kế hoạch mở rộng thị trường',
      summary: 'Vinamilk dự kiến đầu tư 500 tỷ vào dây chuyền sản xuất mới',
      is_read: false,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '3',
      symbol: 'HPG',
      alert_type: 'technical',
      priority: 'medium',
      title: 'HPG breakout khỏi vùng tích lũy',
      summary: 'RSI vượt 60, volume tăng 50% so với trung bình',
      is_read: true,
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ]
}

export function ResearchDashboard() {
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)

  const {
    data: watchlistResearch,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['watchlist-research'],
    queryFn: fetchWatchlistResearch,
  })

  const { data: alerts } = useQuery({
    queryKey: ['research-alerts'],
    queryFn: fetchResearchAlerts,
  })

  const buyRecommendations =
    watchlistResearch?.filter((r) =>
      ['buy', 'strong_buy'].includes(r.ai_rating)
    ).length || 0

  const unreadAlerts = alerts?.filter((a) => !a.is_read).length || 0

  const todayReports =
    watchlistResearch?.filter(
      (r) => r.report_date === new Date().toISOString().split('T')[0]
    ).length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="AI Research Center"
        description="Phân tích AI tự động cho danh sách theo dõi của bạn"
        actions={
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="h-8 text-[13px] border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)]"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-2" />
            Cập nhật
          </Button>
        }
      />

      {/* Alerts Banner */}
      {alerts && alerts.length > 0 && <ResearchAlerts alerts={alerts} />}

      {/* Main Content */}
      <Tabs defaultValue="overview">
        <TabsList className="bg-[var(--color-bg-secondary)] p-1">
          <TabsTrigger value="overview" className="text-[12px]">
            <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
            Tổng quan
          </TabsTrigger>
          <TabsTrigger value="reports" className="text-[12px]">
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Báo cáo chi tiết
          </TabsTrigger>
          <TabsTrigger value="news" className="text-[12px]">
            <Newspaper className="h-3.5 w-3.5 mr-1.5" />
            Tin tức & Sự kiện
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <QuickStatCard
              title="Mã theo dõi"
              value={watchlistResearch?.length || 0}
              icon={TrendingUp}
            />
            <QuickStatCard
              title="Khuyến nghị MUA"
              value={buyRecommendations}
              icon={TrendingUp}
              color="text-success"
            />
            <QuickStatCard
              title="Cảnh báo mới"
              value={unreadAlerts}
              icon={Bell}
              color="text-warning"
            />
            <QuickStatCard
              title="Báo cáo hôm nay"
              value={todayReports}
              icon={FileText}
            />
          </div>

          {/* Stock Cards Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border bg-[var(--color-surface)] border-[var(--color-border)]"
                >
                  <Skeleton className="h-6 w-20 mb-3 bg-[var(--color-bg-tertiary)]" />
                  <Skeleton className="h-4 w-full mb-2 bg-[var(--color-bg-tertiary)]" />
                  <Skeleton className="h-4 w-3/4 bg-[var(--color-bg-tertiary)]" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {watchlistResearch?.map((research) => (
                <StockResearchCard
                  key={research.symbol}
                  research={research}
                  onClick={() => setSelectedSymbol(research.symbol)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          {selectedSymbol ? (
            <FullResearchReport
              symbol={selectedSymbol}
              onClose={() => setSelectedSymbol(null)}
            />
          ) : (
            <div className="p-12 rounded-xl border bg-[var(--color-surface)] border-[var(--color-border)] text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-[var(--color-text-muted)] opacity-50" />
              <p className="text-[13px] text-[var(--color-text-muted)]">
                Chọn một mã từ tab Tổng quan để xem báo cáo chi tiết
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="news" className="mt-4">
          <div className="rounded-xl border bg-[var(--color-surface)] border-[var(--color-border)]">
            <div className="p-4 border-b border-[var(--color-border)]">
              <h3 className="text-[14px] font-semibold text-[var(--color-text-primary)]">
                Tin tức & Sự kiện
              </h3>
            </div>
            <div className="p-4">
              <p className="text-[13px] text-[var(--color-text-muted)]">
                Tin tức được thu thập và phân tích tự động cho các mã trong
                watchlist.
              </p>
              {/* News list would go here */}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Full Report Modal */}
      {selectedSymbol && (
        <FullResearchReport
          symbol={selectedSymbol}
          onClose={() => setSelectedSymbol(null)}
        />
      )}
    </div>
  )
}

export default ResearchDashboard
