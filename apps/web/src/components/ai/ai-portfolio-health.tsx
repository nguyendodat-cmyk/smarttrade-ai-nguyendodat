import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  Shield,
  PieChart,
  Target,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { aiService, PortfolioHealthResponse } from '@/services/ai-service'

interface AIPortfolioHealthProps {
  userId: string
  holdings?: Array<{
    symbol: string
    quantity: number
    avg_cost: number
    current_price: number
    value: number
  }>
}

export function AIPortfolioHealth({ userId, holdings }: AIPortfolioHealthProps) {
  const [health, setHealth] = useState<PortfolioHealthResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHealth = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await aiService.getPortfolioHealth(userId, holdings)
      setHealth(data)
    } catch (err) {
      console.error('Failed to fetch portfolio health:', err)
      setError('Không thể tải phân tích portfolio')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchHealth()
  }, [userId])

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success'
    if (score >= 60) return 'text-warning'
    return 'text-danger'
  }

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'low':
        return (
          <Badge variant="outline" className="text-success border-success">
            <Shield className="h-3 w-3 mr-1" />
            Rủi ro thấp
          </Badge>
        )
      case 'high':
        return (
          <Badge variant="outline" className="text-danger border-danger">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Rủi ro cao
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-warning border-warning">
            <Activity className="h-3 w-3 mr-1" />
            Rủi ro TB
          </Badge>
        )
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-success" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />
      case 'danger':
        return <AlertCircle className="h-4 w-4 text-danger" />
      default:
        return <Activity className="h-4 w-4 text-foreground-muted" />
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
          <Skeleton className="h-24 w-24 rounded-full mx-auto" />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
          </div>
          <Skeleton className="h-20 rounded-lg" />
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
          <Button variant="outline" size="sm" onClick={fetchHealth}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Thử lại
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!health) return null

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-brand/5 via-transparent to-transparent pointer-events-none" />

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand/10">
              <Activity className="h-5 w-5 text-brand" />
            </div>
            <div>
              <CardTitle className="text-lg">Portfolio Health</CardTitle>
              <p className="text-sm text-foreground-muted">
                AI phân tích danh mục
              </p>
            </div>
          </div>
          {getRiskBadge(health.risk_level)}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Health Score Gauge */}
        <div className="flex flex-col items-center py-4">
          <div className="relative w-32 h-32">
            {/* Background circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-surface-2"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${(health.overall_score / 100) * 352} 352`}
                strokeLinecap="round"
                className={cn(
                  'transition-all duration-1000',
                  getScoreColor(health.overall_score)
                )}
              />
            </svg>
            {/* Score text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn('text-3xl font-bold', getScoreColor(health.overall_score))}>
                {health.overall_score}
              </span>
              <span className="text-xs text-foreground-muted">/ 100</span>
            </div>
          </div>
          <p className="text-sm text-foreground-muted mt-2">
            {health.overall_score >= 80 ? 'Danh mục khỏe mạnh' :
             health.overall_score >= 60 ? 'Cần cải thiện' :
             'Cần điều chỉnh ngay'}
          </p>
        </div>

        {/* Component Scores */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-surface-2 rounded-lg text-center">
            <PieChart className="h-4 w-4 mx-auto mb-1 text-foreground-muted" />
            <p className="text-xs text-foreground-muted">Đa dạng hóa</p>
            <p className={cn('text-lg font-bold', getScoreColor(health.diversification_score))}>
              {health.diversification_score}%
            </p>
          </div>
          {health.metrics.slice(0, 2).map((metric) => (
            <div key={metric.name} className="p-3 bg-surface-2 rounded-lg text-center">
              {getStatusIcon(metric.status)}
              <p className="text-xs text-foreground-muted mt-1">{metric.name}</p>
              <p className={cn(
                'text-lg font-bold',
                metric.status === 'good' && 'text-success',
                metric.status === 'warning' && 'text-warning',
                metric.status === 'danger' && 'text-danger'
              )}>
                {metric.value}%
              </p>
            </div>
          ))}
        </div>

        {/* Concerns */}
        {health.concerns && health.concerns.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Cần lưu ý
            </p>
            <div className="space-y-1.5">
              {health.concerns.slice(0, 3).map((concern, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-2 bg-warning/5 rounded-lg text-sm"
                >
                  <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                  <span className="text-warning">{concern}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Recommendations */}
        {health.recommendations && health.recommendations.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-brand" />
              Khuyến nghị AI
            </p>
            <div className="space-y-2">
              {health.recommendations.slice(0, 2).map((rec, i) => (
                <div
                  key={i}
                  className={cn(
                    'p-3 rounded-lg border',
                    rec.type === 'buy' && 'bg-success/5 border-success/20',
                    rec.type === 'sell' && 'bg-danger/5 border-danger/20',
                    rec.type === 'hold' && 'bg-warning/5 border-warning/20',
                    rec.type === 'watch' && 'bg-surface-2 border-border'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={cn(
                          'text-xs',
                          rec.type === 'buy' && 'bg-success',
                          rec.type === 'sell' && 'bg-danger',
                          rec.type === 'hold' && 'bg-warning',
                          rec.type === 'watch' && 'bg-surface-3'
                        )}
                      >
                        {rec.type === 'buy' ? 'MUA' :
                         rec.type === 'sell' ? 'BÁN' :
                         rec.type === 'hold' ? 'GIỮ' : 'THEO DÕI'}
                      </Badge>
                      <span className="font-medium">{rec.symbol}</span>
                    </div>
                    <span className="text-xs text-foreground-muted">
                      {rec.confidence}% tin cậy
                    </span>
                  </div>
                  <p className="text-xs text-foreground-muted">{rec.reason}</p>
                  {rec.type === 'buy' && (
                    <Link to="/trading">
                      <Button size="sm" className="w-full mt-2 bg-success hover:bg-success/90">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Mua ngay
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <Link to="/portfolio">
            <Button variant="link" className="p-0 h-auto text-sm">
              <Zap className="h-4 w-4 mr-1" />
              Xem chi tiết
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={fetchHealth}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Làm mới
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
