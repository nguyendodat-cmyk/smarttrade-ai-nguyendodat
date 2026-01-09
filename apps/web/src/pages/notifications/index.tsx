import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Bell,
  CheckCheck,
  TrendingUp,
  ShoppingCart,
  Sparkles,
  Newspaper,
  AlertCircle,
  Settings,
  Trash2,
  MoreHorizontal,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

interface Notification {
  id: string
  type: 'order_filled' | 'order_rejected' | 'price_alert' | 'ai_insight' | 'news' | 'system'
  title: string
  description: string
  read: boolean
  timestamp: Date
  actionUrl?: string
  metadata?: Record<string, unknown>
}

// Mock notifications
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'order_filled',
    title: 'Lệnh mua VNM đã khớp',
    description: 'Đã mua 500 cổ phiếu VNM với giá 85,200đ',
    read: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    actionUrl: '/trading/orders',
  },
  {
    id: '2',
    type: 'price_alert',
    title: 'Cảnh báo giá FPT',
    description: 'FPT đã vượt ngưỡng 92,000đ mà bạn đặt',
    read: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    actionUrl: '/market/FPT',
  },
  {
    id: '3',
    type: 'ai_insight',
    title: 'AI Insight mới cho VIC',
    description: 'Phát hiện tín hiệu tích cực cho VIC, xem phân tích chi tiết',
    read: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    actionUrl: '/market/VIC',
  },
  {
    id: '4',
    type: 'order_rejected',
    title: 'Lệnh bán HPG bị từ chối',
    description: 'Không đủ số dư cổ phiếu để thực hiện lệnh',
    read: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    actionUrl: '/trading/orders',
  },
  {
    id: '5',
    type: 'news',
    title: 'Tin tức quan trọng',
    description: 'NHNN công bố chính sách tiền tệ mới, tác động đến thị trường',
    read: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
  },
  {
    id: '6',
    type: 'ai_insight',
    title: 'Daily Briefing sẵn sàng',
    description: 'Bản tin AI hàng ngày của bạn đã được chuẩn bị',
    read: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
    actionUrl: '/dashboard',
  },
  {
    id: '7',
    type: 'system',
    title: 'Nâng cấp hệ thống',
    description: 'Hệ thống sẽ bảo trì vào 22:00 - 23:00 ngày 25/12',
    read: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
  {
    id: '8',
    type: 'price_alert',
    title: 'Cảnh báo giá MWG',
    description: 'MWG đã giảm dưới ngưỡng 50,000đ',
    read: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    actionUrl: '/market/MWG',
  },
]

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'order_filled':
      return <ShoppingCart className="h-4 w-4 text-success" />
    case 'order_rejected':
      return <AlertCircle className="h-4 w-4 text-danger" />
    case 'price_alert':
      return <TrendingUp className="h-4 w-4 text-warning" />
    case 'ai_insight':
      return <Sparkles className="h-4 w-4 text-brand" />
    case 'news':
      return <Newspaper className="h-4 w-4 text-foreground-muted" />
    case 'system':
      return <Settings className="h-4 w-4 text-foreground-muted" />
    default:
      return <Bell className="h-4 w-4" />
  }
}

const getNotificationBg = (type: Notification['type']) => {
  switch (type) {
    case 'order_filled':
      return 'bg-success/10'
    case 'order_rejected':
      return 'bg-danger/10'
    case 'price_alert':
      return 'bg-warning/10'
    case 'ai_insight':
      return 'bg-brand/10'
    default:
      return 'bg-surface-2'
  }
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotifications)
  const [activeTab, setActiveTab] = useState('all')

  const unreadCount = notifications.filter((n) => !n.read).length

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'all') return true
    if (activeTab === 'unread') return !n.read
    if (activeTab === 'orders') return n.type === 'order_filled' || n.type === 'order_rejected'
    if (activeTab === 'price') return n.type === 'price_alert'
    if (activeTab === 'ai') return n.type === 'ai_insight'
    if (activeTab === 'news') return n.type === 'news' || n.type === 'system'
    return true
  })

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-brand/10">
            <Bell className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Thông báo</h1>
            <p className="text-sm text-foreground-muted">
              {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Không có thông báo mới'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Đánh dấu tất cả đã đọc
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={clearAll}>
                <Trash2 className="h-4 w-4 mr-2" />
                Xóa tất cả
              </DropdownMenuItem>
              <Link to="/settings/notifications">
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Cài đặt thông báo
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-border px-4">
              <TabsList className="h-12 bg-transparent">
                <TabsTrigger value="all" className="data-[state=active]:bg-transparent">
                  Tất cả
                  {notifications.length > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {notifications.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="unread" className="data-[state=active]:bg-transparent">
                  Chưa đọc
                  {unreadCount > 0 && (
                    <Badge className="ml-2 text-xs bg-brand">
                      {unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="orders" className="data-[state=active]:bg-transparent">
                  Lệnh
                </TabsTrigger>
                <TabsTrigger value="price" className="data-[state=active]:bg-transparent">
                  Giá
                </TabsTrigger>
                <TabsTrigger value="ai" className="data-[state=active]:bg-transparent">
                  AI
                </TabsTrigger>
                <TabsTrigger value="news" className="data-[state=active]:bg-transparent">
                  Tin tức
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="mt-0">
              {filteredNotifications.length === 0 ? (
                <div className="py-16 text-center">
                  <Bell className="h-12 w-12 text-foreground-muted mx-auto mb-4 opacity-50" />
                  <p className="text-foreground-muted">Không có thông báo nào</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        'flex items-start gap-4 p-4 hover:bg-surface-2 transition-colors cursor-pointer',
                        !notification.read && 'bg-brand/5'
                      )}
                      onClick={() => {
                        markAsRead(notification.id)
                        if (notification.actionUrl) {
                          window.location.href = notification.actionUrl
                        }
                      }}
                    >
                      {/* Icon */}
                      <div
                        className={cn(
                          'p-2 rounded-lg shrink-0',
                          getNotificationBg(notification.type)
                        )}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className={cn('font-medium', !notification.read && 'text-foreground')}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-foreground-muted mt-0.5">
                              {notification.description}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-brand shrink-0 mt-2" />
                          )}
                        </div>
                        <p className="text-xs text-foreground-muted mt-2">
                          {formatDistanceToNow(notification.timestamp, {
                            addSuffix: true,
                            locale: vi,
                          })}
                        </p>
                      </div>

                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!notification.read && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                markAsRead(notification.id)
                              }}
                            >
                              <CheckCheck className="h-4 w-4 mr-2" />
                              Đánh dấu đã đọc
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotification(notification.id)
                            }}
                            className="text-danger"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
