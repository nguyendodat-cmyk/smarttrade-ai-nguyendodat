import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  ShieldAlert,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  CheckCircle,
  XCircle,
  Zap,
} from 'lucide-react'
import { formatCurrency } from '@/lib/formatters'
import { aiService, StockInsightResponse } from '@/services/ai-service'

interface AIStockInsightProps {
  symbol: string
}

export function AIStockInsight({ symbol }: AIStockInsightProps) {
  const [insight, setInsight] = useState<StockInsightResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInsight = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await aiService.getStockInsight(symbol)
      setInsight(data)
    } catch (err) {
      console.error('Failed to fetch insight:', err)
      setError('Không thể tải phân tích AI')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (symbol) {
      fetchInsight()
    }
  }, [symbol])

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return (
          <Badge className="bg-success">
            <TrendingUp className="h-3 w-3 mr-1" />
            Tích cực
          </Badge>
        )
      case 'bearish':
        return (
          <Badge className="bg-danger">
            <TrendingDown className="h-3 w-3 mr-1" />
            Tiêu cực
          </Badge>
        )
      default:
        return (
          <Badge className="bg-warning">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Trung lập
          </Badge>
        )
    }
  }

  const getRecommendationBadge = (type: string) => {
    switch (type) {
      case 'buy':
        return (
          <Badge className="bg-success text-lg px-4 py-2">
            <TrendingUp className="h-4 w-4 mr-2" />
            MUA
          </Badge>
        )
      case 'sell':
        return (
          <Badge className="bg-danger text-lg px-4 py-2">
            <TrendingDown className="h-4 w-4 mr-2" />
            BÁN
          </Badge>
        )
      default:
        return (
          <Badge className="bg-warning text-lg px-4 py-2">
            <AlertTriangle className="h-4 w-4 mr-2" />
            GIỮ
          </Badge>
        )
    }
  }

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'low':
        return (
          <Badge variant="outline" className="text-success border-success">
            Rủi ro thấp
          </Badge>
        )
      case 'high':
        return (
          <Badge variant="outline" className="text-danger border-danger">
            Rủi ro cao
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-warning border-warning">
            Rủi ro TB
          </Badge>
        )
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-6 w-40" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-8 w-8 text-danger mx-auto mb-3" />
          <p className="text-foreground-muted mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchInsight}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Thử lại
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!insight) return null

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-brand/5 via-transparent to-transparent pointer-events-none" />

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-brand/10">
              <Sparkles className="h-5 w-5 text-brand" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Phân tích {symbol}</CardTitle>
              <p className="text-xs text-foreground-muted">
                Powered by SmartTrade AI
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getSentimentBadge(insight.sentiment)}
            {getRiskBadge(insight.risk_level)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Recommendation */}
        <div className="flex items-center justify-between p-4 bg-surface-2 rounded-xl">
          <div>
            <p className="text-sm text-foreground-muted mb-1">Khuyến nghị AI</p>
            {getRecommendationBadge(insight.recommendation.type)}
          </div>
          <div className="text-right">
            <p className="text-sm text-foreground-muted mb-1">Độ tin cậy</p>
            <div className="flex items-center gap-2">
              <Progress
                value={insight.score}
                className="w-24 h-2"
              />
              <span className="text-lg font-bold text-brand">
                {insight.score.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Analysis Summary */}
        <div>
          <p className="text-sm leading-relaxed">{insight.analysis}</p>
        </div>

        {/* Price Targets */}
        {(insight.recommendation.target_price || insight.recommendation.stop_loss) && (
          <div className="grid grid-cols-2 gap-4">
            {insight.recommendation.target_price && (
              <div className="p-3 bg-success/5 rounded-lg border border-success/20">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="h-4 w-4 text-success" />
                  <span className="text-xs text-foreground-muted">Mục tiêu</span>
                </div>
                <p className="text-lg font-bold font-mono text-success">
                  {formatCurrency(insight.recommendation.target_price)}
                </p>
              </div>
            )}
            {insight.recommendation.stop_loss && (
              <div className="p-3 bg-danger/5 rounded-lg border border-danger/20">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldAlert className="h-4 w-4 text-danger" />
                  <span className="text-xs text-foreground-muted">Cắt lỗ</span>
                </div>
                <p className="text-lg font-bold font-mono text-danger">
                  {formatCurrency(insight.recommendation.stop_loss)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Key Points */}
        {insight.key_points && insight.key_points.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Điểm chính</p>
            <div className="space-y-1.5">
              {insight.key_points.slice(0, 4).map((point, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-sm"
                >
                  {i < 2 ? (
                    <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
                  )}
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Technical & Fundamental Scores */}
        {(insight.technicals || insight.fundamentals) && (
          <div className="grid grid-cols-3 gap-3">
            {insight.technicals && (
              <div className="p-3 bg-surface-2 rounded-lg text-center">
                <p className="text-xs text-foreground-muted mb-1">Kỹ thuật</p>
                <p className="text-lg font-bold">
                  {insight.technicals.trend === 'uptrend' ? (
                    <span className="text-success">Tích cực</span>
                  ) : insight.technicals.trend === 'downtrend' ? (
                    <span className="text-danger">Tiêu cực</span>
                  ) : (
                    <span className="text-warning">Trung lập</span>
                  )}
                </p>
                <p className="text-xs text-foreground-muted">
                  RSI: {insight.technicals.rsi.toFixed(1)}
                </p>
              </div>
            )}
            {insight.fundamentals && (
              <>
                <div className="p-3 bg-surface-2 rounded-lg text-center">
                  <p className="text-xs text-foreground-muted mb-1">P/E</p>
                  <p className="text-lg font-bold font-mono">
                    {insight.fundamentals.pe_ratio?.toFixed(1) || 'N/A'}
                  </p>
                  <p className="text-xs text-foreground-muted">
                    {insight.fundamentals.valuation === 'undervalued'
                      ? 'Rẻ'
                      : insight.fundamentals.valuation === 'overvalued'
                        ? 'Đắt'
                        : 'Hợp lý'}
                  </p>
                </div>
                <div className="p-3 bg-surface-2 rounded-lg text-center">
                  <p className="text-xs text-foreground-muted mb-1">P/B</p>
                  <p className="text-lg font-bold font-mono">
                    {insight.fundamentals.pb_ratio?.toFixed(1) || 'N/A'}
                  </p>
                  <p className="text-xs text-foreground-muted">
                    Tăng trưởng: {insight.fundamentals.revenue_growth?.toFixed(1)}%
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <Link to="/ai-chat">
            <Button variant="link" className="p-0 h-auto text-sm">
              <Zap className="h-4 w-4 mr-1" />
              Hỏi AI thêm về {symbol}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={fetchInsight}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Làm mới
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
