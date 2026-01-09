import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/formatters'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
  MoreVertical,
  Edit,
  Trash2,
  Bell,
  Clock,
  TrendingUp,
  Activity,
} from 'lucide-react'

interface Condition {
  id: string
  indicator: string
  operator: string
  value: number
  value_secondary: number | null
  timeframe: string
}

interface Alert {
  id: string
  name: string
  symbol: string
  is_active: boolean
  logic_operator: string
  check_interval: string
  notification_channels: string[]
  trigger_count: number
  last_triggered_at: string | null
  expires_at: string | null
  conditions: Condition[]
  created_at: string
  updated_at: string
}

interface AlertCardProps {
  alert: Alert
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}

const indicatorLabels: Record<string, string> = {
  price: 'Giá',
  volume: 'KL',
  rsi: 'RSI',
  macd: 'MACD',
  ma: 'MA',
  bb: 'BB',
  change_percent: '%',
}

const operatorLabels: Record<string, string> = {
  '>=': '>=',
  '<=': '<=',
  '=': '=',
  '>': '>',
  '<': '<',
  crosses_above: 'cắt lên',
  crosses_below: 'cắt xuống',
  touches_upper: 'chạm trên',
  touches_lower: 'chạm dưới',
}

const intervalLabels: Record<string, string> = {
  '1m': '1 phút',
  '5m': '5 phút',
  '15m': '15 phút',
  '1h': '1 giờ',
}

function formatConditionValue(condition: Condition): string {
  const indicator = indicatorLabels[condition.indicator] || condition.indicator
  const operator = operatorLabels[condition.operator] || condition.operator

  let value = ''
  if (condition.indicator === 'price') {
    value = formatCurrency(condition.value)
  } else if (condition.indicator === 'volume') {
    value = condition.value >= 1000000
      ? `${(condition.value / 1000000).toFixed(1)}M`
      : `${(condition.value / 1000).toFixed(0)}K`
  } else if (condition.indicator === 'ma' && condition.value_secondary) {
    return `MA(${condition.value}) ${operator} MA(${condition.value_secondary})`
  } else {
    value = condition.value.toString()
  }

  return `${indicator} ${operator} ${value}`
}

export function AlertCard({ alert, onToggle, onEdit, onDelete }: AlertCardProps) {
  const conditionsText = alert.conditions
    .map(formatConditionValue)
    .join(` ${alert.logic_operator} `)

  return (
    <div
      className={cn(
        'p-4 rounded-xl border bg-[var(--color-surface)] transition-all',
        alert.is_active
          ? 'border-[var(--color-border)]'
          : 'border-[var(--color-border)]/50'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: Alert Info */}
        <div className="flex-1 space-y-3">
          {/* Header */}
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 text-[11px] font-bold font-mono rounded bg-[var(--color-brand)]/10 text-[var(--color-brand)]">
              {alert.symbol}
            </span>
            <span className="text-[13px] font-medium text-[var(--color-text-primary)]">
              {alert.name}
            </span>
            <span
              className={cn(
                'px-2 py-0.5 text-[10px] font-medium rounded',
                alert.is_active
                  ? 'bg-[var(--color-positive)]/10 text-[var(--color-positive)]'
                  : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]'
              )}
            >
              {alert.is_active ? 'Đang bật' : 'Đã tắt'}
            </span>
          </div>

          {/* Conditions */}
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
            <span className="text-[12px] text-[var(--color-text-secondary)]">
              {conditionsText}
            </span>
          </div>

          {/* Meta Info */}
          <div className="flex items-center gap-4 text-[10px] text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {intervalLabels[alert.check_interval]}
            </span>

            <span className="flex items-center gap-1">
              <Bell className="h-3 w-3" />
              {alert.trigger_count} lần triggered
            </span>

            {alert.last_triggered_at && (
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {formatDistanceToNow(new Date(alert.last_triggered_at), {
                  addSuffix: true,
                  locale: vi,
                })}
              </span>
            )}

            {alert.expires_at && (
              <span className="px-1.5 py-0.5 text-[10px] rounded border border-[var(--color-border)] text-[var(--color-text-muted)]">
                Hết hạn: {new Date(alert.expires_at).toLocaleDateString('vi-VN')}
              </span>
            )}
          </div>

          {/* Notification Channels */}
          <div className="flex items-center gap-2">
            {alert.notification_channels.map((channel) => (
              <span
                key={channel}
                className="px-1.5 py-0.5 text-[10px] rounded border border-[var(--color-border)] text-[var(--color-text-muted)] capitalize"
              >
                {channel === 'in_app' ? 'In-App' : channel}
              </span>
            ))}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Switch
            checked={alert.is_active}
            onCheckedChange={onToggle}
            aria-label="Toggle alert"
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[var(--color-surface)] border-[var(--color-border)]">
              <DropdownMenuItem onClick={onEdit} className="text-[13px]">
                <Edit className="h-3.5 w-3.5 mr-2" />
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDelete}
                className="text-[13px] text-[var(--color-negative)] focus:text-[var(--color-negative)]"
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
