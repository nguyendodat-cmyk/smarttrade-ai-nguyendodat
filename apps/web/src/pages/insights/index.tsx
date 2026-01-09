import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChart3,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/layout/page-header'
import { MarketSummaryCard, SectorAnalysis } from '@/components/ai'
import { useMarketSummary } from '@/hooks/use-ai-chat'

type TimeFilter = 'today' | 'week' | 'month'

// Mock top movers data
const topMovers = {
  gainers: [
    { symbol: 'TCB', name: 'Techcombank', change: 6.8, reason: 'Kỳ vọng room tín dụng được nới rộng' },
    { symbol: 'FPT', name: 'FPT Corp', change: 4.2, reason: 'Đơn hàng xuất khẩu phần mềm tăng mạnh' },
    { symbol: 'VNM', name: 'Vinamilk', change: 3.5, reason: 'Báo cáo doanh thu quý vượt kỳ vọng' },
  ],
  losers: [
    { symbol: 'HPG', name: 'Hòa Phát', change: -4.2, reason: 'Giá thép thế giới giảm sâu' },
    { symbol: 'VIC', name: 'Vingroup', change: -3.1, reason: 'Áp lực chốt lời sau đợt tăng' },
    { symbol: 'NVL', name: 'Novaland', change: -2.8, reason: 'Lo ngại về dòng tiền và pháp lý dự án' },
  ],
}

// Mock weekly outlook data
const weeklyOutlook = {
  summary: 'Tuần tới thị trường dự kiến tiếp tục trong xu hướng tích lũy với biên độ 1,260-1,290 điểm. Điểm nhấn chính là các sự kiện vĩ mô và kết quả kinh doanh quý IV.',
  events: [
    { date: 'Thứ 2', event: 'Số liệu PMI tháng 12' },
    { date: 'Thứ 4', event: 'Fed công bố biên bản họp' },
    { date: 'Thứ 6', event: 'Báo cáo việc làm Mỹ' },
  ],
  watchlist: ['TCB', 'FPT', 'VNM', 'MWG', 'VCB'],
}

function TopMoversCard() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-[var(--color-brand)]" />
          Top Movers Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Gainers */}
        <div className="space-y-3">
          <h4 className="text-[12px] font-medium uppercase tracking-wider text-[var(--color-positive)] flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            Tăng mạnh nhất
          </h4>
          <div className="space-y-3">
            {topMovers.gainers.map((stock) => (
              <div
                key={stock.symbol}
                className="p-3 rounded-lg bg-[var(--color-positive)]/5 border border-[var(--color-positive)]/20"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-[var(--color-text-primary)]">
                      {stock.symbol}
                    </span>
                    <span className="text-[12px] text-[var(--color-text-muted)]">
                      {stock.name}
                    </span>
                  </div>
                  <Badge className="bg-[var(--color-positive)]/10 text-[var(--color-positive)] text-[11px] font-mono">
                    <ArrowUpRight className="h-3 w-3 mr-0.5" />
                    +{stock.change}%
                  </Badge>
                </div>
                <p className="text-[12px] text-[var(--color-text-secondary)]">
                  💡 {stock.reason}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Losers */}
        <div className="space-y-3">
          <h4 className="text-[12px] font-medium uppercase tracking-wider text-[var(--color-negative)] flex items-center gap-1.5">
            <TrendingDown className="h-3.5 w-3.5" />
            Giảm mạnh nhất
          </h4>
          <div className="space-y-3">
            {topMovers.losers.map((stock) => (
              <div
                key={stock.symbol}
                className="p-3 rounded-lg bg-[var(--color-negative)]/5 border border-[var(--color-negative)]/20"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-[var(--color-text-primary)]">
                      {stock.symbol}
                    </span>
                    <span className="text-[12px] text-[var(--color-text-muted)]">
                      {stock.name}
                    </span>
                  </div>
                  <Badge className="bg-[var(--color-negative)]/10 text-[var(--color-negative)] text-[11px] font-mono">
                    <ArrowDownRight className="h-3 w-3 mr-0.5" />
                    {stock.change}%
                  </Badge>
                </div>
                <p className="text-[12px] text-[var(--color-text-secondary)]">
                  ⚠️ {stock.reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function WeeklyOutlookCard() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[var(--color-brand)]" />
          Triển vọng tuần tới
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
          {weeklyOutlook.summary}
        </p>

        {/* Key Events */}
        <div className="space-y-2">
          <h4 className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
            Sự kiện quan trọng
          </h4>
          <div className="space-y-2">
            {weeklyOutlook.events.map((event, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-2 rounded-lg bg-[var(--color-bg-secondary)]"
              >
                <span className="text-[11px] font-medium text-[var(--color-brand)] w-16">
                  {event.date}
                </span>
                <span className="text-[12px] text-[var(--color-text-secondary)]">
                  {event.event}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Watchlist */}
        <div className="space-y-2">
          <h4 className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
            Mã cần theo dõi
          </h4>
          <div className="flex flex-wrap gap-2">
            {weeklyOutlook.watchlist.map((symbol) => (
              <Badge
                key={symbol}
                variant="secondary"
                className="text-[11px] font-medium bg-[var(--color-brand)]/10 text-[var(--color-brand)] hover:bg-[var(--color-brand)]/20 cursor-pointer"
              >
                {symbol}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function InsightsPage() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today')
  const { refreshSummary, isLoading } = useMarketSummary()

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="AI Insights"
        description="Phân tích và nhận định thị trường từ AI"
        actions={
          <div className="flex items-center gap-2">
            {/* Time Filter */}
            <div className="flex bg-[var(--color-bg-secondary)] rounded-lg p-1">
              {(['today', 'week', 'month'] as TimeFilter[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter)}
                  className={cn(
                    'px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors',
                    timeFilter === filter
                      ? 'bg-[var(--color-brand)] text-white'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                  )}
                >
                  {filter === 'today' ? 'Hôm nay' : filter === 'week' ? 'Tuần này' : 'Tháng này'}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshSummary}
              disabled={isLoading}
              className="h-8 text-[13px] border-[var(--color-border)]"
            >
              <RefreshCw className={cn('h-3.5 w-3.5 mr-2', isLoading && 'animate-spin')} />
              Làm mới
            </Button>
          </div>
        }
      />

      {/* Hero Section - Market Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MarketSummaryCard />
        </div>
        <WeeklyOutlookCard />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="sectors">
        <TabsList className="bg-[var(--color-bg-secondary)] p-1">
          <TabsTrigger value="sectors" className="text-[12px]">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Phân tích ngành
          </TabsTrigger>
          <TabsTrigger value="movers" className="text-[12px]">
            <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
            Top Movers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sectors" className="mt-6">
          <SectorAnalysis />
        </TabsContent>

        <TabsContent value="movers" className="mt-6">
          <TopMoversCard />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default InsightsPage
