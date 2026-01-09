import { useEffect } from 'react'
import { Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  useNewsStore,
  getEventTypeLabel,
  type EventType,
  type TimeFilter,
} from '@/stores/news-store'
import { mockCalendarEvents } from '@/lib/mock-news-data'
import { CalendarEventCard } from './calendar-event'
import { getEventIcon } from '@/lib/icons'

const TIME_FILTERS: { value: TimeFilter; label: string }[] = [
  { value: 'week', label: 'Tuần này' },
  { value: 'month', label: 'Tháng này' },
  { value: 'all', label: 'Tất cả' },
]

const EVENT_TYPES: EventType[] = ['earnings', 'economic', 'dividend', 'ipo']

export function EconomicCalendar() {
  const {
    events,
    setEvents,
    eventFilters,
    setTimeFilter,
    toggleEventType,
    clearEventFilters,
    getFilteredEvents,
  } = useNewsStore()

  // Load mock data on mount
  useEffect(() => {
    if (events.length === 0) {
      setEvents(mockCalendarEvents)
    }
  }, [events.length, setEvents])

  const filteredEvents = getFilteredEvents()
  const hasTypeFilters = eventFilters.types.length > 0

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Time Filter */}
        <div className="flex bg-[var(--color-bg-secondary)] rounded-lg p-1">
          {TIME_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setTimeFilter(filter.value)}
              className={cn(
                'px-4 py-2 text-[13px] font-medium rounded-md transition-colors',
                eventFilters.timeFilter === filter.value
                  ? 'bg-[var(--color-brand)] text-white'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Event Type Filter */}
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPES.map((type) => {
            const Icon = getEventIcon(type)
            return (
              <Button
                key={type}
                variant="outline"
                size="sm"
                onClick={() => toggleEventType(type)}
                className={cn(
                  'h-9 text-[12px] border-[var(--color-border)]',
                  eventFilters.types.includes(type) &&
                    'border-[var(--color-brand)] bg-[var(--color-brand)]/10 text-[var(--color-brand)]'
                )}
              >
                <Icon className="h-3.5 w-3.5 mr-1.5" />
                {getEventTypeLabel(type)}
              </Button>
            )
          })}

          {hasTypeFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearEventFilters}
              className="h-9 text-[12px] text-[var(--color-text-muted)] hover:text-[var(--color-negative)]"
            >
              Xóa bộ lọc
            </Button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-[var(--color-text-muted)]">
          {filteredEvents.length} sự kiện
        </p>
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <Calendar className="h-12 w-12 text-[var(--color-text-muted)] mb-4" />
          <h3 className="text-[15px] font-medium text-[var(--color-text-primary)] mb-2">
            Không có sự kiện nào
          </h3>
          <p className="text-[13px] text-[var(--color-text-muted)] text-center">
            Thử thay đổi bộ lọc thời gian hoặc loại sự kiện
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((event) => (
            <CalendarEventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  )
}
