import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { analytics } from '@/services/analytics-service'
import { useAuthStore } from '@/stores/auth-store'

export function useAnalytics() {
  const location = useLocation()
  const { user } = useAuthStore()

  // Initialize analytics and set user ID when logged in
  useEffect(() => {
    analytics.init()
  }, [])

  useEffect(() => {
    if (user?.id) {
      analytics.setUserId(user.id)
    } else {
      analytics.setUserId(null)
    }
  }, [user?.id])

  // Track page views
  useEffect(() => {
    analytics.trackPageView(location.pathname)
  }, [location.pathname])

  return analytics
}

// Re-export analytics for direct usage
export { analytics }
