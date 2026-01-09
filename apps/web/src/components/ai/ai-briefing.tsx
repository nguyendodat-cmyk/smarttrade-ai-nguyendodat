import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sparkles,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  RefreshCw,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { aiService, DailyBriefingResponse } from '@/services/ai-service'

interface AIBriefingProps {
  watchlist?: string[]
}

export function AIBriefing({ watchlist }: AIBriefingProps) {
  const [briefing, setBriefing] = useState<DailyBriefingResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBriefing = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await aiService.getDailyBriefing('demo-user', watchlist)
      setBriefing(data)
    } catch (err) {
      console.error('Failed to fetch briefing:', err)
      setError('Không thể tải bản tin AI')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBriefing()
  }, [])

  const getSentimentLabel = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return 'Tích cực'
      case 'bearish':
        return 'Tiêu cực'
      default:
        return 'Trung lập'
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return 'bg-success'
      case 'bearish':
        return 'bg-danger'
      default:
        return 'bg-warning'
    }
  }

  if (isLoading) {
    return (
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand/5 via-transparent to-transparent pointer-events-none" />
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-danger/5 via-transparent to-transparent pointer-events-none" />
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-8 w-8 text-danger mx-auto mb-3" />
          <p className="text-foreground-muted mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchBriefing}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Thử lại
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!briefing) return null

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-brand/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-3 right-3 flex items-center gap-2">
        <Badge variant="outline" className="bg-brand/10 border-brand/30 text-brand">
          <Zap className="h-3 w-3 mr-1" />
          AI Insights
        </Badge>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-brand/10">
            <Sparkles className="h-5 w-5 text-brand" />
          </div>
          <div>
            <CardTitle className="text-lg">Daily Briefing</CardTitle>
            <p className="text-sm text-foreground-muted">
              {new Date().toLocaleDateString('vi-VN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Market Summary */}
        <div className="flex items-start gap-3">
          <Badge className={cn('shrink-0', getSentimentColor(briefing.sentiment))}>
            {getSentimentLabel(briefing.sentiment)}
          </Badge>
          <p className="text-sm leading-relaxed">{briefing.market_summary}</p>
        </div>

        {/* Highlights */}
        {briefing.highlights && briefing.highlights.length > 0 && (
          <div className="space-y-2">
            {briefing.highlights.map((item, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-start gap-2 p-2 rounded-lg text-sm',
                  item.sentiment === 'bullish' && 'bg-success/5 text-success',
                  item.sentiment === 'neutral' && 'bg-warning/5 text-warning',
                  item.sentiment === 'bearish' && 'bg-danger/5 text-danger'
                )}
              >
                {item.sentiment === 'bullish' && (
                  <TrendingUp className="h-4 w-4 shrink-0 mt-0.5" />
                )}
                {item.sentiment === 'neutral' && (
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                )}
                {item.sentiment === 'bearish' && (
                  <TrendingDown className="h-4 w-4 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-medium">{item.title}</span>
                  {item.description && (
                    <span className="text-foreground-muted"> - {item.description}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Watchlist Alerts */}
        {briefing.watchlist_alerts && briefing.watchlist_alerts.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground-muted">Cảnh báo Watchlist</p>
            {briefing.watchlist_alerts.map((alert, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-2 rounded-lg bg-surface-2 text-sm"
              >
                <AlertCircle className="h-3.5 w-3.5 text-warning shrink-0" />
                <span>{alert}</span>
              </div>
            ))}
          </div>
        )}

        {/* Top Movers */}
        {(briefing.top_gainers?.length > 0 || briefing.top_losers?.length > 0) && (
          <div className="grid grid-cols-2 gap-3">
            {/* Gainers */}
            <div>
              <p className="text-xs font-medium text-success mb-1.5 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Top tăng
              </p>
              <div className="space-y-1">
                {briefing.top_gainers.slice(0, 2).map((stock) => (
                  <Link key={stock.symbol} to={`/market/${stock.symbol}`}>
                    <div className="flex justify-between p-1.5 rounded bg-success/5 hover:bg-success/10 text-xs">
                      <span className="font-medium">{stock.symbol}</span>
                      <span className="text-success">
                        +{stock.change_percent.toFixed(2)}%
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Losers */}
            <div>
              <p className="text-xs font-medium text-danger mb-1.5 flex items-center gap-1">
                <TrendingDown className="h-3 w-3" />
                Top giảm
              </p>
              <div className="space-y-1">
                {briefing.top_losers.slice(0, 2).map((stock) => (
                  <Link key={stock.symbol} to={`/market/${stock.symbol}`}>
                    <div className="flex justify-between p-1.5 rounded bg-danger/5 hover:bg-danger/10 text-xs">
                      <span className="font-medium">{stock.symbol}</span>
                      <span className="text-danger">
                        {stock.change_percent.toFixed(2)}%
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Link to="/ai-chat">
            <Button variant="link" className="p-0 h-auto text-sm">
              Hỏi AI thêm
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchBriefing}
            className="text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Làm mới
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
