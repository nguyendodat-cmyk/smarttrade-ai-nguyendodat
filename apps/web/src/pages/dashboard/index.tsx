import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardLabel, CardValue } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ChevronRight,
  Star,
  BarChart3,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency, formatPercent } from '@/lib/formatters'
import { useAuthStore } from '@/stores/auth-store'
import { AIBriefing } from '@/components/ai/ai-briefing'
import { AIPortfolioHealth } from '@/components/ai/ai-portfolio-health'
import { PageHeader } from '@/components/layout/page-header'

// Mock data - In production, fetch from Supabase
const mockPortfolio = {
  totalValue: 245680000,
  cashBalance: 45680000,
  stockValue: 200000000,
  change: 12450000,
  changePercent: 5.34,
  dailyPL: 3450000,
  dailyPLPercent: 1.43,
}

// Mock holdings for Portfolio Health
const mockHoldings = [
  { symbol: 'VNM', quantity: 1000, avg_cost: 82000, current_price: 85200, value: 85200000 },
  { symbol: 'FPT', quantity: 500, avg_cost: 88000, current_price: 92100, value: 46050000 },
  { symbol: 'VIC', quantity: 800, avg_cost: 40000, current_price: 42500, value: 34000000 },
  { symbol: 'HPG', quantity: 1500, avg_cost: 24000, current_price: 25800, value: 38700000 },
]

const mockWatchlist = [
  { symbol: 'VNM', name: 'Vinamilk', price: 85200, change: 1200, changePercent: 1.43 },
  { symbol: 'FPT', name: 'FPT Corp', price: 92100, change: -480, changePercent: -0.52 },
  { symbol: 'VIC', name: 'Vingroup', price: 42500, change: 900, changePercent: 2.16 },
  { symbol: 'HPG', name: 'Hoa Phat', price: 25800, change: 300, changePercent: 1.18 },
]

const mockIndices = [
  { symbol: 'VNINDEX', name: 'VN-Index', value: 1275.32, change: 8.25, changePercent: 0.65 },
  { symbol: 'HNX', name: 'HNX-Index', value: 245.67, change: -0.57, changePercent: -0.23 },
  { symbol: 'VN30', name: 'VN30', value: 1312.45, change: 10.72, changePercent: 0.82 },
]

const mockTopGainers = [
  { symbol: 'VIC', price: 43500, changePercent: 6.95 },
  { symbol: 'HPG', price: 26200, changePercent: 5.24 },
  { symbol: 'VNM', price: 85200, changePercent: 3.12 },
]

const mockTopLosers = [
  { symbol: 'MWG', price: 52000, changePercent: -4.58 },
  { symbol: 'VRE', price: 19200, changePercent: -2.54 },
  { symbol: 'PLX', price: 42000, changePercent: -1.88 },
]

// Watchlist for AI Briefing
const userWatchlist = ['VNM', 'FPT', 'VIC', 'HPG']

export function DashboardPage() {
  const { user } = useAuthStore()
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date())
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await new Promise((r) => setTimeout(r, 1000))
    setLastUpdate(new Date())
    setIsRefreshing(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={`Xin chào, ${user?.full_name?.split(' ').pop() || 'Trader'}!`}
        description={`Cập nhật lúc ${lastUpdate.toLocaleTimeString('vi-VN')}`}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 text-[13px] border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)]"
          >
            <RefreshCw className={cn('h-3.5 w-3.5 mr-2', isRefreshing && 'animate-spin')} />
            Làm mới
          </Button>
        }
      />

      {/* AI Daily Briefing */}
      <AIBriefing watchlist={userWatchlist} />

      {/* Portfolio Summary & Health Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Portfolio Value */}
        <Card className="lg:col-span-2">
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-[var(--color-text-muted)]" />
                <CardLabel>Tổng tài sản</CardLabel>
              </div>
              <Link to="/portfolio">
                <Button variant="ghost" size="sm" className="h-7 text-[12px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]">
                  Chi tiết <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <CardValue>
                  {formatCurrency(mockPortfolio.totalValue)}
                </CardValue>
                <div
                  className={cn(
                    'flex items-center gap-1.5 mt-2',
                    mockPortfolio.dailyPLPercent >= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-negative)]'
                  )}
                >
                  {mockPortfolio.dailyPLPercent >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  <span className="font-mono text-[12px] font-medium tabular-nums">
                    {mockPortfolio.dailyPLPercent >= 0 ? '+' : ''}
                    {formatCurrency(mockPortfolio.dailyPL)} ({formatPercent(mockPortfolio.dailyPLPercent)})
                  </span>
                  <span className="text-[var(--color-text-muted)] text-[11px]">hôm nay</span>
                </div>
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between text-[13px]">
                  <span className="text-[var(--color-text-tertiary)]">Cổ phiếu</span>
                  <span className="font-mono tabular-nums text-[var(--color-text-primary)]">{formatCurrency(mockPortfolio.stockValue)}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[var(--color-text-tertiary)]">Tiền mặt</span>
                  <span className="font-mono tabular-nums text-[var(--color-text-primary)]">{formatCurrency(mockPortfolio.cashBalance)}</span>
                </div>
                <div className="flex justify-between text-[13px] pt-2.5 border-t border-[var(--color-border-subtle)]">
                  <span className="text-[var(--color-text-tertiary)]">Lãi/Lỗ tuần</span>
                  <span className={cn('font-mono font-medium tabular-nums', mockPortfolio.changePercent >= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-negative)]')}>
                    {mockPortfolio.changePercent >= 0 ? '+' : ''}{formatPercent(mockPortfolio.changePercent)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* AI Portfolio Health */}
        <AIPortfolioHealth userId="demo-user" holdings={mockHoldings} />
      </div>

      {/* Market Overview */}
      <Card>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[var(--color-text-muted)]" />
              <CardLabel>Thị trường</CardLabel>
            </div>
            <Link to="/market">
              <Button variant="ghost" size="sm" className="h-7 text-[12px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]">
                Xem thêm <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {mockIndices.map((index) => (
              <div
                key={index.symbol}
                className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-center"
              >
                <p className="text-[10px] font-medium tracking-wider uppercase text-[var(--color-text-muted)] mb-2">{index.name}</p>
                <p className="text-lg font-mono font-semibold tabular-nums text-[var(--color-text-primary)]">
                  {index.value.toLocaleString('vi-VN', { minimumFractionDigits: 2 })}
                </p>
                <div
                  className={cn(
                    'flex items-center justify-center gap-1 text-[12px] font-mono font-medium mt-1',
                    index.changePercent >= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-negative)]'
                  )}
                >
                  {index.changePercent >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {index.changePercent >= 0 ? '+' : ''}
                  {index.changePercent.toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Watchlist & Top Movers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Watchlist */}
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-[var(--color-brand)] fill-[var(--color-brand)]" />
                <CardLabel>Watchlist</CardLabel>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]">
                  {mockWatchlist.length}
                </span>
              </div>
              <Link to="/watchlist">
                <Button variant="ghost" size="sm" className="h-7 text-[12px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]">
                  Tất cả <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="space-y-1.5">
              {mockWatchlist.map((stock) => (
                <div
                  key={stock.symbol}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] border border-transparent hover:border-[var(--color-border)] transition-all cursor-pointer"
                >
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">{stock.symbol}</p>
                    <p className="text-[11px] text-[var(--color-text-muted)]">{stock.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[13px] font-medium tabular-nums text-[var(--color-text-primary)]">
                      {stock.price.toLocaleString()}
                    </p>
                    <p
                      className={cn(
                        'text-[11px] font-mono font-medium tabular-nums',
                        stock.changePercent >= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-negative)]'
                      )}
                    >
                      {stock.changePercent >= 0 ? '+' : ''}
                      {stock.changePercent.toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Top Movers */}
        <Card>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-[var(--color-text-muted)]" />
              <CardLabel>Top biến động</CardLabel>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* Top Gainers */}
              <div>
                <p className="text-[11px] font-medium text-[var(--color-positive)] mb-2.5 flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Tăng mạnh
                </p>
                <div className="space-y-1.5">
                  {mockTopGainers.map((stock) => (
                    <div
                      key={stock.symbol}
                      className="flex items-center justify-between py-2 px-2.5 rounded-lg bg-[var(--color-positive)]/5 border border-[var(--color-positive)]/10"
                    >
                      <span className="text-[13px] font-medium text-[var(--color-text-primary)]">{stock.symbol}</span>
                      <span className="text-[12px] font-mono font-medium tabular-nums text-[var(--color-positive)]">
                        +{stock.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Losers */}
              <div>
                <p className="text-[11px] font-medium text-[var(--color-negative)] mb-2.5 flex items-center gap-1">
                  <TrendingDown className="h-3.5 w-3.5" />
                  Giảm mạnh
                </p>
                <div className="space-y-1.5">
                  {mockTopLosers.map((stock) => (
                    <div
                      key={stock.symbol}
                      className="flex items-center justify-between py-2 px-2.5 rounded-lg bg-[var(--color-negative)]/5 border border-[var(--color-negative)]/10"
                    >
                      <span className="text-[13px] font-medium text-[var(--color-text-primary)]">{stock.symbol}</span>
                      <span className="text-[12px] font-mono font-medium tabular-nums text-[var(--color-negative)]">
                        {stock.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
