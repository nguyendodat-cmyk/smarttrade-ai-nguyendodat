import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { CheckCircle, Clock } from 'lucide-react'

interface HistoryItem {
  id: string
  alert_id: string
  alert_name: string
  symbol: string
  triggered_at: string
  trigger_data: {
    price?: number
    rsi?: number
    volume?: number
    conditions_met: string[]
  }
  notification_sent: boolean
}

async function fetchAlertHistory(): Promise<HistoryItem[]> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  return [
    {
      id: 'hist-001',
      alert_id: 'alert-001',
      alert_name: 'VNM Buy Signal',
      symbol: 'VNM',
      triggered_at: '2024-12-24T14:30:00Z',
      trigger_data: {
        price: 74500,
        rsi: 28.5,
        conditions_met: ['Giá <= 75,000', 'RSI <= 30'],
      },
      notification_sent: true,
    },
    {
      id: 'hist-002',
      alert_id: 'alert-001',
      alert_name: 'VNM Buy Signal',
      symbol: 'VNM',
      triggered_at: '2024-12-23T10:15:00Z',
      trigger_data: {
        price: 73200,
        rsi: 25.3,
        conditions_met: ['Giá <= 75,000', 'RSI <= 30'],
      },
      notification_sent: true,
    },
    {
      id: 'hist-003',
      alert_id: 'alert-003',
      alert_name: 'HPG MACD Cross',
      symbol: 'HPG',
      triggered_at: '2024-12-23T09:15:00Z',
      trigger_data: {
        conditions_met: ['MACD cắt lên Signal'],
      },
      notification_sent: true,
    },
    {
      id: 'hist-004',
      alert_id: 'alert-002',
      alert_name: 'FPT Breakout',
      symbol: 'FPT',
      triggered_at: '2024-12-22T15:45:00Z',
      trigger_data: {
        price: 151200,
        volume: 2500000,
        conditions_met: ['Giá >= 150,000'],
      },
      notification_sent: true,
    },
    {
      id: 'hist-005',
      alert_id: 'alert-001',
      alert_name: 'VNM Buy Signal',
      symbol: 'VNM',
      triggered_at: '2024-12-21T11:00:00Z',
      trigger_data: {
        price: 74800,
        rsi: 29.1,
        conditions_met: ['Giá <= 75,000', 'RSI <= 30'],
      },
      notification_sent: true,
    },
  ]
}

export function AlertHistory() {
  const { data: history, isLoading } = useQuery({
    queryKey: ['alert-history'],
    queryFn: fetchAlertHistory,
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    )
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Clock className="h-12 w-12 text-foreground-muted mb-4" />
          <h3 className="text-lg font-medium mb-2">Chưa có lịch sử</h3>
          <p className="text-foreground-muted text-center">
            Khi alert được trigger, lịch sử sẽ hiển thị ở đây
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {history.map((item) => (
        <Card key={item.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                {/* Header */}
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono font-bold">
                    {item.symbol}
                  </Badge>
                  <span className="font-medium">{item.alert_name}</span>
                </div>

                {/* Conditions Met */}
                <div className="flex flex-wrap gap-2">
                  {item.trigger_data.conditions_met.map((condition, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {condition}
                    </Badge>
                  ))}
                </div>

                {/* Trigger Data */}
                <div className="flex items-center gap-4 text-xs text-foreground-muted">
                  {item.trigger_data.price && (
                    <span>Giá: {item.trigger_data.price.toLocaleString('vi-VN')}</span>
                  )}
                  {item.trigger_data.rsi && (
                    <span>RSI: {item.trigger_data.rsi.toFixed(1)}</span>
                  )}
                  {item.trigger_data.volume && (
                    <span>
                      KL: {(item.trigger_data.volume / 1000000).toFixed(1)}M
                    </span>
                  )}
                </div>

                {/* Timestamp */}
                <div className="flex items-center gap-2 text-xs text-foreground-muted">
                  <Clock className="h-3 w-3" />
                  <span>
                    {formatDistanceToNow(new Date(item.triggered_at), {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </span>
                  <span>•</span>
                  <span>
                    {new Date(item.triggered_at).toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-1 text-success text-xs">
                <CheckCircle className="h-4 w-4" />
                <span>Đã gửi</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
