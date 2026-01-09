import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { Crown, AlertCircle } from 'lucide-react'

interface AlertLimitBannerProps {
  currentCount: number
  maxCount: number
  isPremium: boolean
}

export function AlertLimitBanner({
  currentCount,
  maxCount,
  isPremium,
}: AlertLimitBannerProps) {
  const percentage = (currentCount / maxCount) * 100
  const isNearLimit = percentage >= 80
  const isAtLimit = currentCount >= maxCount

  if (isPremium) {
    return (
      <div className="p-4 rounded-xl border bg-[var(--color-brand)]/5 border-[var(--color-brand)]/30">
        <div className="flex items-center gap-3">
          <Crown className="h-5 w-5 text-[var(--color-brand)]" />
          <div className="flex-1">
            <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
              Premium Account
            </p>
            <p className="text-[11px] text-[var(--color-text-muted)]">
              Unlimited alerts • {currentCount} alerts đang hoạt động
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'p-4 rounded-xl border',
        isAtLimit
          ? 'bg-[var(--color-negative)]/5 border-[var(--color-negative)]/30'
          : isNearLimit
            ? 'bg-[var(--color-warning)]/5 border-[var(--color-warning)]/30'
            : 'bg-[var(--color-surface)] border-[var(--color-border)]'
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isAtLimit && <AlertCircle className="h-4 w-4 text-[var(--color-negative)]" />}
              <span className="text-[13px] font-medium text-[var(--color-text-primary)]">
                {isAtLimit
                  ? 'Đã đạt giới hạn alerts'
                  : `${currentCount}/${maxCount} alerts`}
              </span>
            </div>
            <span
              className={cn(
                'text-[11px]',
                isAtLimit
                  ? 'text-[var(--color-negative)]'
                  : isNearLimit
                    ? 'text-[var(--color-warning)]'
                    : 'text-[var(--color-text-muted)]'
              )}
            >
              {isAtLimit
                ? 'Nâng cấp để thêm alerts'
                : `Còn ${maxCount - currentCount} slots`}
            </span>
          </div>

          <Progress
            value={percentage}
            className={cn(
              'h-1.5',
              isAtLimit && '[&>div]:bg-[var(--color-negative)]',
              isNearLimit && !isAtLimit && '[&>div]:bg-[var(--color-warning)]'
            )}
          />

          <p className="text-[10px] text-[var(--color-text-muted)]">
            Tài khoản Free: Tối đa {maxCount} alerts
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="shrink-0 h-8 text-[12px] border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)]"
        >
          <Crown className="h-3.5 w-3.5 mr-1.5 text-[var(--color-brand)]" />
          Nâng cấp
        </Button>
      </div>
    </div>
  )
}
