import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, ChevronRight } from 'lucide-react'
import { useNewsStore } from '@/stores/news-store'
import { mockCalendarEvents } from '@/lib/mock-news-data'
import { CalendarEventCompact } from './calendar-event'

interface UpcomingEventsWidgetProps {
  limit?: number
}

export function UpcomingEventsWidget({ limit = 5 }: UpcomingEventsWidgetProps) {
  const { events, setEvents } = useNewsStore()

  // Load mock data on mount
  useEffect(() => {
    if (events.length === 0) {
      setEvents(mockCalendarEvents)
    }
  }, [events.length, setEvents])

  const now = new Date()
  const upcomingEvents = [...events]
    .filter((e) => new Date(e.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, limit)

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[var(--color-brand)]" />
            Sự kiện sắp tới
          </CardTitle>
          <Link
            to="/news?tab=calendar"
            className="text-[12px] text-[var(--color-brand)] hover:underline flex items-center gap-0.5"
          >
            Xem tất cả
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {events.length === 0 ? (
          <UpcomingEventsWidgetSkeleton count={limit} />
        ) : upcomingEvents.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-[13px] text-[var(--color-text-muted)]">
              Không có sự kiện nào sắp tới
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {upcomingEvents.map((event) => (
              <CalendarEventCompact key={event.id} event={event} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function UpcomingEventsWidgetSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <Skeleton className="h-4 w-4 rounded-full bg-[var(--color-bg-tertiary)]" />
          <Skeleton className="h-3 w-12 bg-[var(--color-bg-tertiary)]" />
          <Skeleton className="h-4 flex-1 bg-[var(--color-bg-tertiary)]" />
        </div>
      ))}
    </div>
  )
}
