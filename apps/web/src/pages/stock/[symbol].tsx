import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  ArrowLeft,
  Star,
  TrendingUp,
  TrendingDown,
  Share2,
  Bell,
  ShoppingCart,
  ExternalLink,
  Clock,
  Building2,
  Coins,
  BarChart3,
  Activity,
  PieChart,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CandlestickChart, OHLCData } from '@/components/charts/candlestick-chart'
import { OrderBook, OrderBookLevel } from '@/components/trading/order-book'
import { AIStockInsight } from '@/components/ai/ai-stock-insight'

// Generate mock OHLC data
const generateOHLCData = (days: number, basePrice: number): OHLCData[] => {
  const data: OHLCData[] = []
  let price = basePrice
  const now = new Date()

  for (let i = days; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    const volatility = 0.02
    const change = (Math.random() - 0.5) * 2 * volatility * price
    const open = price
    const close = price + change
    const high = Math.max(open, close) * (1 + Math.random() * 0.01)
    const low = Math.min(open, close) * (1 - Math.random() * 0.01)
    const volume = Math.floor(1000000 + Math.random() * 5000000)

    data.push({
      time: date.toISOString().slice(0, 10),
      open: Math.round(open),
      high: Math.round(high),
      low: Math.round(low),
      close: Math.round(close),
      volume,
    })

    price = close
  }

  return data
}

// Mock stock data
const mockStockData: Record<string, {
  symbol: string
  name: string
  exchange: string
  sector: string
  price: number
  change: number
  changePercent: number
  open: number
  high: number
  low: number
  volume: number
  avgVolume: number
  marketCap: number
  pe: number
  pb: number
  eps: number
  roe: number
  dividend: number
  beta: number
  high52w: number
  low52w: number
  description: string
}> = {
  VNM: {
    symbol: 'VNM',
    name: 'Công ty Cổ phần Sữa Việt Nam',
    exchange: 'HOSE',
    sector: 'Thực phẩm & Đồ uống',
    price: 85200,
    change: 1200,
    changePercent: 1.43,
    open: 84000,
    high: 86000,
    low: 83800,
    volume: 2500000,
    avgVolume: 2100000,
    marketCap: 178000000000000,
    pe: 18.5,
    pb: 4.2,
    eps: 4608,
    roe: 32.4,
    dividend: 3.5,
    beta: 0.85,
    high52w: 92000,
    low52w: 68000,
    description: 'Vinamilk là công ty sản xuất và kinh doanh sữa lớn nhất Việt Nam với thị phần dẫn đầu trong ngành.',
  },
  FPT: {
    symbol: 'FPT',
    name: 'Công ty Cổ phần FPT',
    exchange: 'HOSE',
    sector: 'Công nghệ thông tin',
    price: 92100,
    change: -480,
    changePercent: -0.52,
    open: 92580,
    high: 93000,
    low: 91500,
    volume: 1800000,
    avgVolume: 1500000,
    marketCap: 120000000000000,
    pe: 22.3,
    pb: 5.8,
    eps: 4130,
    roe: 24.1,
    dividend: 2.8,
    beta: 1.12,
    high52w: 98000,
    low52w: 72000,
    description: 'FPT là tập đoàn công nghệ hàng đầu Việt Nam với các mảng chính: công nghệ, viễn thông và giáo dục.',
  },
  VIC: {
    symbol: 'VIC',
    name: 'Tập đoàn Vingroup - CTCP',
    exchange: 'HOSE',
    sector: 'Bất động sản',
    price: 42500,
    change: 900,
    changePercent: 2.16,
    open: 41600,
    high: 42800,
    low: 41500,
    volume: 3200000,
    avgVolume: 2800000,
    marketCap: 145000000000000,
    pe: 45.2,
    pb: 1.8,
    eps: 940,
    roe: 8.5,
    dividend: 0,
    beta: 1.35,
    high52w: 52000,
    low52w: 35000,
    description: 'Vingroup là tập đoàn kinh tế tư nhân lớn nhất Việt Nam với các mảng BĐS, ô tô, bán lẻ và công nghệ.',
  },
}

const generateOrderBook = (basePrice: number): { bids: OrderBookLevel[]; asks: OrderBookLevel[] } => {
  const bids: OrderBookLevel[] = []
  const asks: OrderBookLevel[] = []
  const step = 100

  for (let i = 0; i < 10; i++) {
    bids.push({
      price: basePrice - step * (i + 1),
      volume: Math.floor(50000 + Math.random() * 200000),
      orders: Math.floor(5 + Math.random() * 30),
    })
    asks.push({
      price: basePrice + step * (i + 1),
      volume: Math.floor(50000 + Math.random() * 200000),
      orders: Math.floor(5 + Math.random() * 30),
    })
  }

  return { bids, asks }
}

const mockNews = [
  { id: 1, title: 'Kết quả kinh doanh Q4/2024 vượt kỳ vọng', time: '2 giờ trước', source: 'CafeF' },
  { id: 2, title: 'Ban lãnh đạo mua thêm 500.000 cổ phiếu', time: '1 ngày trước', source: 'VnExpress' },
  { id: 3, title: 'Đạt thỏa thuận hợp tác chiến lược mới', time: '2 ngày trước', source: 'NDH' },
  { id: 4, title: 'Cập nhật khuyến nghị từ các CTCK', time: '3 ngày trước', source: 'SSI' },
]

export function StockDetailPage() {
  const { symbol } = useParams<{ symbol: string }>()
  const [isInWatchlist, setIsInWatchlist] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const stock = mockStockData[symbol?.toUpperCase() || 'VNM'] || mockStockData.VNM
  const chartData = useMemo(() => generateOHLCData(365, stock.price), [stock.symbol])
  const orderBook = useMemo(() => generateOrderBook(stock.price), [stock.price])

  // Simulated realtime price update
  const [currentPrice, setCurrentPrice] = useState(stock.price)
  const [priceChange, setPriceChange] = useState(stock.change)

  useEffect(() => {
    const interval = setInterval(() => {
      const change = (Math.random() - 0.5) * 200
      setCurrentPrice((prev) => Math.round(prev + change))
      setPriceChange((prev) => Math.round(prev + change))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const formatCurrency = (value: number) => {
    if (value >= 1000000000000) return `${(value / 1000000000000).toFixed(1)}T`
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`
    return value.toLocaleString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link to="/market">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{stock.symbol}</h1>
              <Badge variant="outline">{stock.exchange}</Badge>
              <Badge variant="secondary">{stock.sector}</Badge>
            </div>
            <p className="text-foreground-muted">{stock.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsInWatchlist(!isInWatchlist)}
          >
            <Star
              className={cn(
                'h-4 w-4 mr-2',
                isInWatchlist && 'fill-warning text-warning'
              )}
            />
            {isInWatchlist ? 'Đã theo dõi' : 'Theo dõi'}
          </Button>
          <Button variant="outline" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Share2 className="h-4 w-4" />
          </Button>
          <Link to="/trading">
            <Button>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Giao dịch
            </Button>
          </Link>
        </div>
      </div>

      {/* Price Ticker */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6">
              <div>
                <p
                  className={cn(
                    'text-4xl font-mono font-bold',
                    priceChange >= 0 ? 'text-success' : 'text-danger'
                  )}
                >
                  {currentPrice.toLocaleString()}
                </p>
                <div
                  className={cn(
                    'flex items-center gap-2 mt-1',
                    priceChange >= 0 ? 'text-success' : 'text-danger'
                  )}
                >
                  {priceChange >= 0 ? (
                    <TrendingUp className="h-5 w-5" />
                  ) : (
                    <TrendingDown className="h-5 w-5" />
                  )}
                  <span className="font-mono text-lg">
                    {priceChange >= 0 ? '+' : ''}
                    {priceChange.toLocaleString()} (
                    {((priceChange / (currentPrice - priceChange)) * 100).toFixed(2)}%)
                  </span>
                </div>
              </div>

              <div className="h-12 w-px bg-border" />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-foreground-muted">Mở cửa</p>
                  <p className="font-mono font-medium">{stock.open.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-foreground-muted">Cao nhất</p>
                  <p className="font-mono font-medium text-success">{stock.high.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-foreground-muted">Thấp nhất</p>
                  <p className="font-mono font-medium text-danger">{stock.low.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-foreground-muted">Khối lượng</p>
                  <p className="font-mono font-medium">{formatCurrency(stock.volume)}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-foreground-muted">
              <Clock className="h-4 w-4" />
              <span>Cập nhật: {new Date().toLocaleTimeString('vi-VN')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Chart */}
          <Card>
            <CardContent className="pt-4">
              <CandlestickChart data={chartData} height={400} />
            </CardContent>
          </Card>

          {/* Tabs */}
          <Card>
            <CardContent className="pt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                  <TabsTrigger value="fundamentals">Cơ bản</TabsTrigger>
                  <TabsTrigger value="technical">Kỹ thuật</TabsTrigger>
                  <TabsTrigger value="news">Tin tức</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4 space-y-4">
                  {/* Company Info */}
                  <div className="p-4 bg-surface-2 rounded-lg">
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Giới thiệu
                    </h3>
                    <p className="text-sm text-foreground-muted">{stock.description}</p>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-surface-2 rounded-lg">
                      <p className="text-xs text-foreground-muted">Vốn hóa</p>
                      <p className="text-lg font-mono font-bold">{formatCurrency(stock.marketCap)}</p>
                    </div>
                    <div className="p-3 bg-surface-2 rounded-lg">
                      <p className="text-xs text-foreground-muted">P/E</p>
                      <p className="text-lg font-mono font-bold">{stock.pe.toFixed(1)}</p>
                    </div>
                    <div className="p-3 bg-surface-2 rounded-lg">
                      <p className="text-xs text-foreground-muted">ROE</p>
                      <p className="text-lg font-mono font-bold">{stock.roe.toFixed(1)}%</p>
                    </div>
                    <div className="p-3 bg-surface-2 rounded-lg">
                      <p className="text-xs text-foreground-muted">Cổ tức</p>
                      <p className="text-lg font-mono font-bold">{stock.dividend.toFixed(1)}%</p>
                    </div>
                  </div>

                  {/* 52 Week Range */}
                  <div className="p-4 bg-surface-2 rounded-lg">
                    <h3 className="text-sm font-medium mb-3">Biên độ 52 tuần</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-danger">{stock.low52w.toLocaleString()}</span>
                        <span className="font-mono font-medium">{currentPrice.toLocaleString()}</span>
                        <span className="text-success">{stock.high52w.toLocaleString()}</span>
                      </div>
                      <Progress
                        value={((currentPrice - stock.low52w) / (stock.high52w - stock.low52w)) * 100}
                        className="h-2"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="fundamentals" className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h3 className="font-medium flex items-center gap-2">
                        <Coins className="h-4 w-4" />
                        Định giá
                      </h3>
                      <div className="space-y-2">
                        {[
                          { label: 'P/E', value: stock.pe.toFixed(2) },
                          { label: 'P/B', value: stock.pb.toFixed(2) },
                          { label: 'EPS', value: stock.eps.toLocaleString() },
                          { label: 'Beta', value: stock.beta.toFixed(2) },
                        ].map((item) => (
                          <div key={item.label} className="flex justify-between text-sm p-2 bg-surface-2 rounded">
                            <span className="text-foreground-muted">{item.label}</span>
                            <span className="font-mono">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-medium flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Hiệu suất
                      </h3>
                      <div className="space-y-2">
                        {[
                          { label: 'ROE', value: `${stock.roe.toFixed(1)}%` },
                          { label: 'Cổ tức', value: `${stock.dividend.toFixed(1)}%` },
                          { label: 'Vốn hóa', value: formatCurrency(stock.marketCap) },
                          { label: 'KLGD TB', value: formatCurrency(stock.avgVolume) },
                        ].map((item) => (
                          <div key={item.label} className="flex justify-between text-sm p-2 bg-surface-2 rounded">
                            <span className="text-foreground-muted">{item.label}</span>
                            <span className="font-mono">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="technical" className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h3 className="font-medium flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Chỉ báo xu hướng
                      </h3>
                      <div className="space-y-2">
                        {[
                          { label: 'MA20', value: '84,500', signal: 'buy' },
                          { label: 'MA50', value: '82,100', signal: 'buy' },
                          { label: 'MA200', value: '78,900', signal: 'buy' },
                          { label: 'MACD', value: '1,245', signal: 'buy' },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center justify-between text-sm p-2 bg-surface-2 rounded">
                            <span className="text-foreground-muted">{item.label}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono">{item.value}</span>
                              <Badge
                                className={cn(
                                  'text-xs',
                                  item.signal === 'buy' && 'bg-success',
                                  item.signal === 'sell' && 'bg-danger'
                                )}
                              >
                                {item.signal === 'buy' ? 'Mua' : 'Bán'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-medium flex items-center gap-2">
                        <PieChart className="h-4 w-4" />
                        Chỉ báo dao động
                      </h3>
                      <div className="space-y-2">
                        {[
                          { label: 'RSI (14)', value: '58.5', signal: 'neutral' },
                          { label: 'Stoch %K', value: '72.3', signal: 'sell' },
                          { label: 'CCI', value: '125', signal: 'buy' },
                          { label: 'ADX', value: '28.5', signal: 'buy' },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center justify-between text-sm p-2 bg-surface-2 rounded">
                            <span className="text-foreground-muted">{item.label}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono">{item.value}</span>
                              <Badge
                                className={cn(
                                  'text-xs',
                                  item.signal === 'buy' && 'bg-success',
                                  item.signal === 'sell' && 'bg-danger',
                                  item.signal === 'neutral' && 'bg-warning'
                                )}
                              >
                                {item.signal === 'buy' ? 'Mua' : item.signal === 'sell' ? 'Bán' : 'Trung lập'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="news" className="mt-4">
                  <div className="space-y-3">
                    {mockNews.map((news) => (
                      <div
                        key={news.id}
                        className="flex items-start justify-between p-3 bg-surface-2 rounded-lg hover:bg-surface-2/80 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <FileText className="h-4 w-4 mt-1 text-foreground-muted" />
                          <div>
                            <p className="font-medium text-sm">{news.title}</p>
                            <div className="flex items-center gap-2 text-xs text-foreground-muted mt-1">
                              <span>{news.source}</span>
                              <span>•</span>
                              <span>{news.time}</span>
                            </div>
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-foreground-muted" />
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Order Book */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Sổ lệnh</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderBook
                bids={orderBook.bids}
                asks={orderBook.asks}
                lastPrice={currentPrice}
                showHeader={false}
                compact
              />
            </CardContent>
          </Card>

          {/* AI Insights */}
          <AIStockInsight symbol={stock.symbol} />

          {/* Quick Trade */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Giao dịch nhanh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/trading" className="block">
                <Button className="w-full bg-success hover:bg-success/90">
                  Mua {stock.symbol}
                </Button>
              </Link>
              <Link to="/trading" className="block">
                <Button variant="destructive" className="w-full">
                  Bán {stock.symbol}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
