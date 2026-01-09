import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardLabel } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Search,
  TrendingUp,
  TrendingDown,
  Filter,
  LayoutGrid,
  List,
  RefreshCw,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { MiniLineChart } from '@/components/charts/mini-line-chart'
import { SectorHeatmap } from '@/components/market/sector-heatmap'
import { StockTable, StockData } from '@/components/market/stock-table'
import { PageHeader } from '@/components/layout/page-header'
import { ChangeBadge, VolumeDisplay } from '@/components/ui/price-display'

// Mock data - In production, fetch from Supabase
const generateChartData = (trend: 'up' | 'down' | 'neutral') => {
  const data = []
  let value = 100
  for (let i = 0; i < 30; i++) {
    const date = new Date()
    date.setDate(date.getDate() - (30 - i)) // Use different days instead of minutes
    const change =
      trend === 'up'
        ? Math.random() * 2 - 0.5
        : trend === 'down'
          ? Math.random() * -2 + 0.5
          : Math.random() * 2 - 1
    value = Math.max(90, Math.min(110, value + change))
    data.push({
      time: date.toISOString().slice(0, 10),
      value,
    })
  }
  return data
}

const mockIndices = [
  {
    name: 'VN-Index',
    value: 1275.32,
    change: 8.45,
    changePercent: 0.67,
    chartData: generateChartData('up'),
  },
  {
    name: 'HNX-Index',
    value: 245.67,
    change: -0.56,
    changePercent: -0.23,
    chartData: generateChartData('down'),
  },
  {
    name: 'VN30',
    value: 1312.45,
    change: 10.78,
    changePercent: 0.83,
    chartData: generateChartData('up'),
  },
  {
    name: 'UPCOM',
    value: 89.23,
    change: 0.12,
    changePercent: 0.13,
    chartData: generateChartData('neutral'),
  },
]

const mockMarketStats = {
  advances: 245,
  declines: 178,
  unchanged: 67,
  totalVolume: 890000000,
  totalValue: 21500000000000,
  foreignBuy: 1250000000000,
  foreignSell: 980000000000,
}

const mockSectors = [
  { name: 'Ngân hàng', code: 'Ngân hàng', change: 1.23, marketCap: 1500 },
  { name: 'Bất động sản', code: 'BĐS', change: 2.45, marketCap: 1200 },
  { name: 'Chứng khoán', code: 'CK', change: -0.87, marketCap: 400 },
  { name: 'Thép', code: 'Thép', change: 3.21, marketCap: 350 },
  { name: 'Bán lẻ', code: 'Bán lẻ', change: -1.54, marketCap: 300 },
  { name: 'Dầu khí', code: 'Dầu khí', change: 0.45, marketCap: 450 },
  { name: 'Thực phẩm', code: 'TP', change: 1.12, marketCap: 380 },
  { name: 'Công nghệ', code: 'CNTT', change: 2.87, marketCap: 280 },
  { name: 'Xây dựng', code: 'XD', change: -0.23, marketCap: 320 },
  { name: 'Điện', code: 'Điện', change: 0.78, marketCap: 290 },
  { name: 'Hóa chất', code: 'Hóa chất', change: -2.15, marketCap: 180 },
  { name: 'Vận tải', code: 'VT', change: 1.65, marketCap: 220 },
]

const mockStocks: StockData[] = [
  { symbol: 'VNM', name: 'CTCP Sữa Việt Nam', price: 85200, change: 1200, changePercent: 1.43, volume: 2500000, value: 213000000000, exchange: 'HOSE', high: 86000, low: 84500, open: 84000, foreignBuy: 120000, foreignSell: 85000 },
  { symbol: 'FPT', name: 'CTCP FPT', price: 92100, change: -480, changePercent: -0.52, volume: 1800000, value: 165780000000, exchange: 'HOSE', high: 93000, low: 91500, open: 92580, foreignBuy: 95000, foreignSell: 110000 },
  { symbol: 'VIC', name: 'Tập đoàn Vingroup', price: 42500, change: 900, changePercent: 2.16, volume: 3200000, value: 136000000000, exchange: 'HOSE', high: 42800, low: 41600, open: 41600, foreignBuy: 250000, foreignSell: 180000 },
  { symbol: 'HPG', name: 'CTCP Tập đoàn Hòa Phát', price: 25800, change: 300, changePercent: 1.18, volume: 5600000, value: 144480000000, exchange: 'HOSE', high: 26100, low: 25500, open: 25500, foreignBuy: 380000, foreignSell: 290000 },
  { symbol: 'VHM', name: 'CTCP Vinhomes', price: 38900, change: -500, changePercent: -1.27, volume: 2100000, value: 81690000000, exchange: 'HOSE', high: 39500, low: 38700, open: 39400, foreignBuy: 150000, foreignSell: 210000 },
  { symbol: 'MSN', name: 'CTCP Tập đoàn Masan', price: 67800, change: 1300, changePercent: 1.95, volume: 1500000, value: 101700000000, exchange: 'HOSE', high: 68200, low: 66500, open: 66500, foreignBuy: 85000, foreignSell: 65000 },
  { symbol: 'VCB', name: 'Ngân hàng Vietcombank', price: 98500, change: 500, changePercent: 0.51, volume: 980000, value: 96530000000, exchange: 'HOSE', high: 99000, low: 98000, open: 98000, foreignBuy: 120000, foreignSell: 95000 },
  { symbol: 'TCB', name: 'Ngân hàng Techcombank', price: 32100, change: -100, changePercent: -0.31, volume: 2800000, value: 89880000000, exchange: 'HOSE', high: 32500, low: 31900, open: 32200, foreignBuy: 180000, foreignSell: 200000 },
  { symbol: 'MWG', name: 'CTCP Thế Giới Di Động', price: 52000, change: -2400, changePercent: -4.41, volume: 1900000, value: 98800000000, exchange: 'HOSE', high: 54400, low: 51800, open: 54400, foreignBuy: 75000, foreignSell: 150000 },
  { symbol: 'VRE', name: 'CTCP Vincom Retail', price: 19200, change: -500, changePercent: -2.54, volume: 2400000, value: 46080000000, exchange: 'HOSE', high: 19700, low: 19100, open: 19700, foreignBuy: 90000, foreignSell: 140000 },
  { symbol: 'PLX', name: 'Tập đoàn Xăng dầu VN', price: 42000, change: -800, changePercent: -1.87, volume: 1200000, value: 50400000000, exchange: 'HOSE', high: 42900, low: 41800, open: 42800, foreignBuy: 45000, foreignSell: 80000 },
  { symbol: 'VJC', name: 'CTCP Vietjet', price: 98800, change: 2300, changePercent: 2.38, volume: 890000, value: 87932000000, exchange: 'HOSE', high: 99200, low: 96500, open: 96500, foreignBuy: 95000, foreignSell: 70000 },
  { symbol: 'GAS', name: 'Tổng công ty Khí VN', price: 75200, change: 1100, changePercent: 1.48, volume: 1100000, value: 82720000000, exchange: 'HOSE', high: 75500, low: 74100, open: 74100, foreignBuy: 110000, foreignSell: 85000 },
  { symbol: 'CTG', name: 'Ngân hàng VietinBank', price: 35400, change: 400, changePercent: 1.14, volume: 3500000, value: 123900000000, exchange: 'HOSE', high: 35600, low: 35000, open: 35000, foreignBuy: 280000, foreignSell: 220000 },
  { symbol: 'BID', name: 'Ngân hàng BIDV', price: 47800, change: 300, changePercent: 0.63, volume: 2200000, value: 105160000000, exchange: 'HOSE', high: 48000, low: 47500, open: 47500, foreignBuy: 160000, foreignSell: 130000 },
  { symbol: 'MBB', name: 'Ngân hàng MB', price: 25200, change: -200, changePercent: -0.79, volume: 4100000, value: 103320000000, exchange: 'HOSE', high: 25500, low: 25100, open: 25400, foreignBuy: 320000, foreignSell: 380000 },
  { symbol: 'ACB', name: 'Ngân hàng ACB', price: 24800, change: 200, changePercent: 0.81, volume: 3800000, value: 94240000000, exchange: 'HOSE', high: 25000, low: 24600, open: 24600, foreignBuy: 290000, foreignSell: 250000 },
  { symbol: 'SSI', name: 'CTCP SSI', price: 32500, change: 800, changePercent: 2.52, volume: 2900000, value: 94250000000, exchange: 'HOSE', high: 32800, low: 31700, open: 31700, foreignBuy: 220000, foreignSell: 150000 },
  { symbol: 'VND', name: 'CTCP VNDirect', price: 18900, change: 600, changePercent: 3.28, volume: 4500000, value: 85050000000, exchange: 'HOSE', high: 19100, low: 18300, open: 18300, foreignBuy: 380000, foreignSell: 280000 },
  { symbol: 'HCM', name: 'CTCP HCMC', price: 28500, change: 700, changePercent: 2.52, volume: 1800000, value: 51300000000, exchange: 'HOSE', high: 28800, low: 27800, open: 27800, foreignBuy: 140000, foreignSell: 95000 },
]

export function MarketPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [activeTab, setActiveTab] = useState('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [watchlist, setWatchlist] = useState<string[]>(['VNM', 'FPT'])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await new Promise((r) => setTimeout(r, 1000))
    setIsRefreshing(false)
  }

  const toggleWatchlist = (symbol: string) => {
    setWatchlist((prev) =>
      prev.includes(symbol)
        ? prev.filter((s) => s !== symbol)
        : [...prev, symbol]
    )
  }

  const filteredStocks = useMemo(() => {
    let result = mockStocks

    if (searchQuery) {
      result = result.filter(
        (stock) =>
          stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stock.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    switch (activeTab) {
      case 'gainers':
        result = result.filter((s) => s.changePercent > 0).sort((a, b) => b.changePercent - a.changePercent)
        break
      case 'losers':
        result = result.filter((s) => s.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent)
        break
      case 'active':
        result = [...result].sort((a, b) => b.volume - a.volume)
        break
    }

    return result
  }, [searchQuery, activeTab])

  const topGainers = useMemo(
    () => [...mockStocks].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5),
    []
  )
  const topLosers = useMemo(
    () => [...mockStocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5),
    []
  )
  const mostActive = useMemo(
    () => [...mockStocks].sort((a, b) => b.volume - a.volume).slice(0, 5),
    []
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Thị trường"
        description={`Cập nhật lúc ${new Date().toLocaleTimeString('vi-VN')}`}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/market/screener">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[13px] border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)]"
              >
                <Filter className="h-3.5 w-3.5 mr-2" />
                Bộ lọc
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8 w-8 p-0 border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)]"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
            </Button>
          </div>
        }
      />

      {/* Market Indices with Charts */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {mockIndices.map((index) => (
          <Card key={index.name} className="overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-[10px] font-medium tracking-[0.1em] uppercase text-[var(--color-text-muted)] mb-1">
                    {index.name}
                  </p>
                  <p className="text-lg font-mono font-semibold tabular-nums text-[var(--color-text-primary)]">
                    {index.value.toLocaleString('vi-VN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div
                  className={cn(
                    'flex items-center gap-1 text-[12px] font-mono font-medium tabular-nums',
                    index.changePercent >= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-negative)]'
                  )}
                >
                  {index.changePercent >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  {index.changePercent >= 0 ? '+' : ''}
                  {index.changePercent.toFixed(2)}%
                </div>
              </div>
              <MiniLineChart
                data={index.chartData}
                color={index.changePercent >= 0 ? 'success' : 'danger'}
                height={40}
              />
              <div className="flex justify-between text-[11px] text-[var(--color-text-muted)] mt-2 font-mono tabular-nums">
                <span>
                  {index.change >= 0 ? '+' : ''}
                  {index.change.toFixed(2)}
                </span>
                <span>Vol: {(mockMarketStats.totalVolume / 1000000).toFixed(0)}M</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Market Statistics */}
      <Card>
        <div className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--color-positive)]" />
                <span className="text-[13px]">
                  <span className="font-semibold text-[var(--color-positive)]">{mockMarketStats.advances}</span>
                  <span className="text-[var(--color-text-muted)] ml-1">Tăng</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--color-negative)]" />
                <span className="text-[13px]">
                  <span className="font-semibold text-[var(--color-negative)]">{mockMarketStats.declines}</span>
                  <span className="text-[var(--color-text-muted)] ml-1">Giảm</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-[13px]">
                  <span className="font-semibold text-amber-500">{mockMarketStats.unchanged}</span>
                  <span className="text-[var(--color-text-muted)] ml-1">Đứng giá</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-6 text-[13px]">
              <div>
                <span className="text-[var(--color-text-muted)]">Tổng GTGD: </span>
                <span className="font-mono font-medium tabular-nums text-[var(--color-text-primary)]">
                  {(mockMarketStats.totalValue / 1000000000000).toFixed(1)}T
                </span>
              </div>
              <div>
                <span className="text-[var(--color-text-muted)]">NN Mua: </span>
                <span className="font-mono font-medium tabular-nums text-[var(--color-positive)]">
                  {(mockMarketStats.foreignBuy / 1000000000).toFixed(0)}B
                </span>
              </div>
              <div>
                <span className="text-[var(--color-text-muted)]">NN Bán: </span>
                <span className="font-mono font-medium tabular-nums text-[var(--color-negative)]">
                  {(mockMarketStats.foreignSell / 1000000000).toFixed(0)}B
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Sector Heatmap */}
      <Card>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <CardLabel>Ngành nghề</CardLabel>
            <span className="text-[10px] font-medium tracking-wide text-[var(--color-text-muted)] px-2 py-1 bg-[var(--color-bg-tertiary)] rounded">
              Theo % thay đổi
            </span>
          </div>
          <SectorHeatmap sectors={mockSectors} />
        </div>
      </Card>

      {/* Quick Stats: Top Movers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Top Gainers */}
        <Card>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-[var(--color-positive)]" />
              <CardLabel>Tăng mạnh nhất</CardLabel>
            </div>
            <div className="space-y-1.5">
              {topGainers.map((stock, i) => (
                <Link
                  key={stock.symbol}
                  to={`/stock/${stock.symbol}`}
                  className="flex items-center justify-between py-2 px-2.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[var(--color-text-muted)] w-4 font-mono">{i + 1}</span>
                    <span className="text-[13px] font-medium text-[var(--color-text-primary)]">{stock.symbol}</span>
                  </div>
                  <ChangeBadge percent={stock.changePercent} size="sm" />
                </Link>
              ))}
            </div>
          </div>
        </Card>

        {/* Top Losers */}
        <Card>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="h-4 w-4 text-[var(--color-negative)]" />
              <CardLabel>Giảm mạnh nhất</CardLabel>
            </div>
            <div className="space-y-1.5">
              {topLosers.map((stock, i) => (
                <Link
                  key={stock.symbol}
                  to={`/stock/${stock.symbol}`}
                  className="flex items-center justify-between py-2 px-2.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[var(--color-text-muted)] w-4 font-mono">{i + 1}</span>
                    <span className="text-[13px] font-medium text-[var(--color-text-primary)]">{stock.symbol}</span>
                  </div>
                  <ChangeBadge percent={stock.changePercent} size="sm" />
                </Link>
              ))}
            </div>
          </div>
        </Card>

        {/* Most Active */}
        <Card>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4 text-[var(--color-brand)]" />
              <CardLabel>Khối lượng lớn</CardLabel>
            </div>
            <div className="space-y-1.5">
              {mostActive.map((stock, i) => (
                <Link
                  key={stock.symbol}
                  to={`/stock/${stock.symbol}`}
                  className="flex items-center justify-between py-2 px-2.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[var(--color-text-muted)] w-4 font-mono">{i + 1}</span>
                    <span className="text-[13px] font-medium text-[var(--color-text-primary)]">{stock.symbol}</span>
                  </div>
                  <VolumeDisplay value={stock.volume} size="sm" />
                </Link>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Stock Table */}
      <Card>
        <div className="p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <CardLabel>Bảng giá</CardLabel>
            <div className="flex items-center gap-3">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
                <Input
                  placeholder="Tìm mã CK..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-[13px] bg-[var(--color-bg-secondary)] border-[var(--color-border)]"
                />
              </div>
              <div className="flex items-center border border-[var(--color-border)] rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn(
                    'h-9 rounded-none',
                    viewMode === 'table' && 'bg-[var(--color-bg-tertiary)]'
                  )}
                  onClick={() => setViewMode('table')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn(
                    'h-9 rounded-none',
                    viewMode === 'grid' && 'bg-[var(--color-bg-tertiary)]'
                  )}
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 bg-[var(--color-bg-secondary)] p-1">
              <TabsTrigger value="all" className="text-[12px]">Tất cả</TabsTrigger>
              <TabsTrigger value="gainers" className="text-[12px]">
                <TrendingUp className="h-3 w-3 mr-1" />
                Tăng giá
              </TabsTrigger>
              <TabsTrigger value="losers" className="text-[12px]">
                <TrendingDown className="h-3 w-3 mr-1" />
                Giảm giá
              </TabsTrigger>
              <TabsTrigger value="active" className="text-[12px]">Khối lượng</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              <StockTable
                stocks={filteredStocks}
                pageSize={10}
                onAddToWatchlist={toggleWatchlist}
                watchlist={watchlist}
              />
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  )
}
