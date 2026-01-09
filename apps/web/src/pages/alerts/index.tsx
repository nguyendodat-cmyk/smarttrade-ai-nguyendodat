import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/layout/page-header'
import { Bell, Plus, History } from 'lucide-react'
import { AlertCard } from './components/alert-card'
import { AlertBuilder } from './components/alert-builder'
import { AlertHistory } from './components/alert-history'
import { AlertLimitBanner } from './components/alert-limit-banner'

interface Alert {
  id: string
  user_id: string
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

interface Condition {
  id: string
  indicator: string
  operator: string
  value: number
  value_secondary: number | null
  timeframe: string
}

interface AlertLimits {
  current_count: number
  max_count: number
  is_premium: boolean
  can_create: boolean
}

async function fetchAlerts(): Promise<Alert[]> {
  // In production: fetch from API
  // const response = await fetch('/api/v1/alerts')
  // return response.json()

  await new Promise((resolve) => setTimeout(resolve, 500))

  return [
    {
      id: 'alert-001',
      user_id: 'demo-user',
      name: 'VNM Buy Signal',
      symbol: 'VNM',
      is_active: true,
      logic_operator: 'AND',
      check_interval: '5m',
      notification_channels: ['push', 'in_app'],
      trigger_count: 3,
      last_triggered_at: '2024-12-24T14:30:00Z',
      expires_at: null,
      conditions: [
        { id: 'cond-001', indicator: 'price', operator: '<=', value: 75000, value_secondary: null, timeframe: '1d' },
        { id: 'cond-002', indicator: 'rsi', operator: '<=', value: 30, value_secondary: null, timeframe: '1d' },
      ],
      created_at: '2024-12-20T10:00:00Z',
      updated_at: '2024-12-24T14:30:00Z',
    },
    {
      id: 'alert-002',
      user_id: 'demo-user',
      name: 'FPT Breakout',
      symbol: 'FPT',
      is_active: true,
      logic_operator: 'OR',
      check_interval: '1m',
      notification_channels: ['push', 'email', 'in_app'],
      trigger_count: 0,
      last_triggered_at: null,
      expires_at: '2025-01-31T23:59:59Z',
      conditions: [
        { id: 'cond-003', indicator: 'price', operator: '>=', value: 150000, value_secondary: null, timeframe: '1d' },
        { id: 'cond-004', indicator: 'volume', operator: '>=', value: 2000000, value_secondary: null, timeframe: '1d' },
      ],
      created_at: '2024-12-22T08:00:00Z',
      updated_at: '2024-12-22T08:00:00Z',
    },
    {
      id: 'alert-003',
      user_id: 'demo-user',
      name: 'HPG MACD Cross',
      symbol: 'HPG',
      is_active: false,
      logic_operator: 'AND',
      check_interval: '15m',
      notification_channels: ['in_app'],
      trigger_count: 5,
      last_triggered_at: '2024-12-23T09:15:00Z',
      expires_at: null,
      conditions: [
        { id: 'cond-005', indicator: 'macd', operator: 'crosses_above', value: 0, value_secondary: null, timeframe: '1d' },
      ],
      created_at: '2024-12-15T11:00:00Z',
      updated_at: '2024-12-23T09:15:00Z',
    },
  ]
}

async function fetchLimits(): Promise<AlertLimits> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return {
    current_count: 3,
    max_count: 5,
    is_premium: false,
    can_create: true,
  }
}

async function deleteAlert(_alertId: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  // In production: DELETE /api/v1/alerts/{alertId}
}

export function SmartAlertsPage() {
  const [activeTab, setActiveTab] = useState('alerts')
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null)

  const queryClient = useQueryClient()

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['smart-alerts'],
    queryFn: fetchAlerts,
  })

  const { data: limits } = useQuery({
    queryKey: ['smart-alerts-limits'],
    queryFn: fetchLimits,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-alerts'] })
      queryClient.invalidateQueries({ queryKey: ['smart-alerts-limits'] })
    },
  })

  const handleCreateAlert = () => {
    setEditingAlert(null)
    setShowBuilder(true)
  }

  const handleEditAlert = (alert: Alert) => {
    setEditingAlert(alert)
    setShowBuilder(true)
  }

  const handleToggleAlert = (_alertId: string) => {
    // For demo: just refetch to simulate toggle
    queryClient.invalidateQueries({ queryKey: ['smart-alerts'] })
  }

  const handleDeleteAlert = (alertId: string) => {
    if (confirm('Bạn có chắc muốn xóa alert này?')) {
      deleteMutation.mutate(alertId)
    }
  }

  const handleBuilderClose = () => {
    setShowBuilder(false)
    setEditingAlert(null)
  }

  const handleAlertCreated = () => {
    setShowBuilder(false)
    setEditingAlert(null)
    queryClient.invalidateQueries({ queryKey: ['smart-alerts'] })
    queryClient.invalidateQueries({ queryKey: ['smart-alerts-limits'] })
  }

  const activeAlerts = alerts?.filter((a) => a.is_active) || []
  const inactiveAlerts = alerts?.filter((a) => !a.is_active) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Smart Alerts"
        description="Nhận thông báo khi cổ phiếu đạt điều kiện bạn đặt ra"
        actions={
          <Button
            onClick={handleCreateAlert}
            disabled={limits && !limits.can_create}
            size="sm"
            className="h-8 text-[13px] bg-[var(--color-brand)] hover:bg-[var(--color-brand)]/90"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Tạo Alert
          </Button>
        }
      />

      {/* Limit Banner */}
      {limits && (
        <AlertLimitBanner
          currentCount={limits.current_count}
          maxCount={limits.max_count}
          isPremium={limits.is_premium}
        />
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[var(--color-bg-secondary)] p-1">
          <TabsTrigger value="alerts" className="text-[12px] flex items-center gap-1.5">
            <Bell className="h-3.5 w-3.5" />
            Alerts
            {alerts && alerts.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-[var(--color-brand)]/10 text-[var(--color-brand)]">
                {alerts.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="text-[12px] flex items-center gap-1.5">
            <History className="h-3.5 w-3.5" />
            Lịch sử
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="mt-6">
          {alertsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl bg-[var(--color-bg-tertiary)]" />
              ))}
            </div>
          ) : alerts && alerts.length > 0 ? (
            <div className="space-y-6">
              {/* Active Alerts */}
              {activeAlerts.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-[14px] font-semibold flex items-center gap-2 text-[var(--color-text-primary)]">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-positive)]" />
                    Đang hoạt động ({activeAlerts.length})
                  </h2>
                  <div className="grid gap-4">
                    {activeAlerts.map((alert) => (
                      <AlertCard
                        key={alert.id}
                        alert={alert}
                        onToggle={() => handleToggleAlert(alert.id)}
                        onEdit={() => handleEditAlert(alert)}
                        onDelete={() => handleDeleteAlert(alert.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Inactive Alerts */}
              {inactiveAlerts.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-[14px] font-semibold flex items-center gap-2 text-[var(--color-text-muted)]">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-text-muted)]" />
                    Đã tắt ({inactiveAlerts.length})
                  </h2>
                  <div className="grid gap-4 opacity-60">
                    {inactiveAlerts.map((alert) => (
                      <AlertCard
                        key={alert.id}
                        alert={alert}
                        onToggle={() => handleToggleAlert(alert.id)}
                        onEdit={() => handleEditAlert(alert)}
                        onDelete={() => handleDeleteAlert(alert.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 rounded-xl border bg-[var(--color-surface)] border-[var(--color-border)]">
              <Bell className="h-12 w-12 text-[var(--color-text-muted)] mb-4" />
              <h3 className="text-[15px] font-medium text-[var(--color-text-primary)] mb-2">
                Chưa có alert nào
              </h3>
              <p className="text-[13px] text-[var(--color-text-muted)] text-center mb-4">
                Tạo alert để nhận thông báo khi cổ phiếu đạt điều kiện bạn đặt ra
              </p>
              <Button
                onClick={handleCreateAlert}
                size="sm"
                className="h-8 text-[13px] bg-[var(--color-brand)] hover:bg-[var(--color-brand)]/90"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Tạo Alert đầu tiên
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <AlertHistory />
        </TabsContent>
      </Tabs>

      {/* Alert Builder Dialog */}
      {showBuilder && (
        <AlertBuilder
          alert={editingAlert}
          onClose={handleBuilderClose}
          onSuccess={handleAlertCreated}
        />
      )}
    </div>
  )
}

export default SmartAlertsPage
