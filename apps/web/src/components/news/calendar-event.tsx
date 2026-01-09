import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  getEventTypeLabel,
  type CalendarEvent,
} from '@/stores/news-store'
import { getEventIcon } from '@/lib/icons'

interface CalendarEventCardProps {
  event: CalendarEvent
}

// Impact dot component
function ImpactDot({ impact }: { impact: 'high' | 'medium' | 'low' }) {
  const colors = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500',
  }
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${colors[impact]}`}
      title={`Impact: ${impact}`}
    />
  )
}

export function CalendarEventCard({ event }: CalendarEventCardProps) {
  const eventDate = new Date(event.date)
  const dayOfWeek = format(eventDate, 'EEEE', { locale: vi })
  const dateStr = format(eventDate, 'dd/MM', { locale: vi })
  const EventIcon = getEventIcon(event.type)

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] transition-colors">
      {/* Date Column */}
      <div className="w-16 flex-shrink-0 text-center">
        <p className="text-[11px] text-[var(--color-text-muted)] uppercase">
          {dayOfWeek.slice(0, 2)}
        </p>
        <p className="text-[18px] font-bold text-[var(--color-text-primary)]">
          {dateStr}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            {/* Type & Impact */}
            <div className="flex items-center gap-2 mb-1">
              <EventIcon className="h-4 w-4 text-[var(--color-text-secondary)]" />
              <Badge
                variant="secondary"
                className="text-[10px] font-medium bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]"
              >
                {getEventTypeLabel(event.type)}
              </Badge>
              <ImpactDot impact={event.impact} />
            </div>

            {/* Title */}
            <h4 className="text-[14px] font-semibold text-[var(--color-text-primary)] mb-1">
              {event.title}
            </h4>

            {/* Time & Description */}
            {(event.time || event.description) && (
              <p className="text-[12px] text-[var(--color-text-muted)] flex items-center gap-1">
                {event.time && (
                  <>
                    <Clock className="h-3 w-3" />
                    <span>{event.time}</span>
                  </>
                )}
                {event.time && event.description && <span> • </span>}
                {event.description}
              </p>
            )}
          </div>

          {/* Related Symbols */}
          {event.relatedSymbols.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-end">
              {event.relatedSymbols.map((symbol) => (
                <Link
                  key={symbol}
                  to={`/stock/${symbol}`}
                  className="px-2 py-0.5 rounded bg-[var(--color-brand)]/10 text-[11px] font-medium text-[var(--color-brand)] hover:bg-[var(--color-brand)]/20 transition-colors"
                >
                  {symbol}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function CalendarEventCompact({ event }: CalendarEventCardProps) {
  const eventDate = new Date(event.date)
  const dateStr = format(eventDate, 'dd/MM', { locale: vi })
  const EventIcon = getEventIcon(event.type)

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors">
      <ImpactDot impact={event.impact} />
      <div className="w-12 text-[12px] font-mono text-[var(--color-text-muted)]">
        {dateStr}
      </div>
      <div className="flex-1 min-w-0 flex items-center gap-1.5">
        <EventIcon className="h-3.5 w-3.5 text-[var(--color-text-secondary)] flex-shrink-0" />
        <p className="text-[13px] font-medium text-[var(--color-text-primary)] truncate">
          {event.title}
        </p>
      </div>
      {event.relatedSymbols.length > 0 && (
        <div className="flex gap-1">
          {event.relatedSymbols.slice(0, 2).map((symbol) => (
            <Link
              key={symbol}
              to={`/stock/${symbol}`}
              className="px-1.5 py-0.5 rounded bg-[var(--color-brand)]/10 text-[10px] font-medium text-[var(--color-brand)]"
            >
              {symbol}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
