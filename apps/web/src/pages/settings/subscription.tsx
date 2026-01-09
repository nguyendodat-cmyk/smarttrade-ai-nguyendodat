import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Crown,
  Check,
  Zap,
  CreditCard,
  Calendar,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PremiumUpgradeModal } from '@/components/ai/premium-upgrade-modal'
import { getRemainingQueries } from '@/services/ai-service'

const mockBillingHistory = [
  { id: '1', date: '2024-12-01', description: 'Gói Premium - Tháng', amount: 199000, status: 'paid' },
  { id: '2', date: '2024-11-01', description: 'Gói Premium - Tháng', amount: 199000, status: 'paid' },
  { id: '3', date: '2024-10-01', description: 'Gói Premium - Tháng', amount: 199000, status: 'paid' },
]

const freeFeatures = [
  { name: 'Xem thị trường real-time', included: true },
  { name: 'Giao dịch cơ bản', included: true },
  { name: 'AI Chat (10 lượt/ngày)', included: true },
  { name: 'AI Insights cơ bản', included: true },
  { name: 'Phân tích kỹ thuật nâng cao', included: false },
  { name: 'AI không giới hạn', included: false },
  { name: 'Cảnh báo giá real-time', included: false },
  { name: 'Portfolio Health AI', included: false },
]

const premiumFeatures = [
  { name: 'Tất cả tính năng Free', included: true },
  { name: 'AI Chat không giới hạn', included: true },
  { name: 'Phân tích kỹ thuật nâng cao', included: true },
  { name: 'AI Insights chi tiết', included: true },
  { name: 'Cảnh báo giá real-time', included: true },
  { name: 'Portfolio Health AI', included: true },
  { name: 'Báo cáo đầu tư hàng tuần', included: true },
  { name: 'Hỗ trợ ưu tiên', included: true },
]

export function SubscriptionSettingsPage() {
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const isPremium = false // Mock - would come from auth store
  const remainingQueries = getRemainingQueries()

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card className={cn(isPremium && 'border-brand bg-brand/5')}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isPremium ? (
                <div className="p-2 rounded-lg bg-brand">
                  <Crown className="h-5 w-5 text-white" />
                </div>
              ) : (
                <div className="p-2 rounded-lg bg-surface-2">
                  <Zap className="h-5 w-5 text-foreground-muted" />
                </div>
              )}
              <div>
                <CardTitle>
                  Gói {isPremium ? 'Premium' : 'Free'}
                </CardTitle>
                <CardDescription>
                  {isPremium
                    ? 'Bạn đang sử dụng gói cao cấp'
                    : 'Nâng cấp để mở khóa tất cả tính năng'}
                </CardDescription>
              </div>
            </div>
            <Badge
              className={cn(
                isPremium ? 'bg-brand' : 'bg-surface-2 text-foreground-muted'
              )}
            >
              {isPremium ? 'Premium' : 'Free'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {!isPremium && (
            <>
              {/* Usage Stats */}
              <div className="p-4 bg-surface-2 rounded-lg mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-foreground-muted">
                    AI Queries hôm nay
                  </span>
                  <span className="text-sm font-medium">
                    {10 - remainingQueries}/10
                  </span>
                </div>
                <Progress value={((10 - remainingQueries) / 10) * 100} className="h-2" />
                <p className="text-xs text-foreground-muted mt-2">
                  Còn {remainingQueries} lượt. Reset vào 00:00 mỗi ngày.
                </p>
              </div>

              <Button
                className="w-full bg-brand hover:bg-brand/90"
                onClick={() => setShowPremiumModal(true)}
              >
                <Crown className="h-4 w-4 mr-2" />
                Nâng cấp Premium
              </Button>
            </>
          )}

          {isPremium && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground-muted">Ngày bắt đầu</span>
                <span>01/12/2024</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground-muted">Ngày gia hạn</span>
                <span>01/01/2025</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground-muted">Phương thức thanh toán</span>
                <span className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  **** 4242
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feature Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Free Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Free
            </CardTitle>
            <CardDescription>Dành cho người mới bắt đầu</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold mb-4">0đ</p>
            <div className="space-y-2">
              {freeFeatures.map((feature) => (
                <div
                  key={feature.name}
                  className="flex items-center gap-2 text-sm"
                >
                  {feature.included ? (
                    <Check className="h-4 w-4 text-success shrink-0" />
                  ) : (
                    <span className="h-4 w-4 text-foreground-muted shrink-0">—</span>
                  )}
                  <span
                    className={cn(
                      !feature.included && 'text-foreground-muted'
                    )}
                  >
                    {feature.name}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Premium Plan */}
        <Card className="border-brand relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-brand text-white text-xs px-3 py-1 rounded-bl-lg">
            Phổ biến
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-brand" />
              Premium
            </CardTitle>
            <CardDescription>Tất cả tính năng AI</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold mb-4">
              199,000đ<span className="text-sm font-normal text-foreground-muted">/tháng</span>
            </p>
            <div className="space-y-2">
              {premiumFeatures.map((feature) => (
                <div
                  key={feature.name}
                  className="flex items-center gap-2 text-sm"
                >
                  <Check className="h-4 w-4 text-success shrink-0" />
                  <span>{feature.name}</span>
                </div>
              ))}
            </div>
            {!isPremium && (
              <Button
                className="w-full mt-4 bg-brand hover:bg-brand/90"
                onClick={() => setShowPremiumModal(true)}
              >
                Nâng cấp ngay
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Billing History */}
      {isPremium && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-foreground-muted" />
              <div>
                <CardTitle>Lịch sử thanh toán</CardTitle>
                <CardDescription>Các giao dịch gần đây</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockBillingHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-surface-2 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-sm">{item.description}</p>
                    <p className="text-xs text-foreground-muted">
                      {new Date(item.date).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-medium">
                      {item.amount.toLocaleString()}đ
                    </p>
                    <Badge variant="outline" className="text-success border-success text-xs">
                      Đã thanh toán
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancel Subscription */}
      {isPremium && (
        <Card className="border-danger/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-danger shrink-0" />
              <div>
                <p className="font-medium">Hủy gói Premium</p>
                <p className="text-sm text-foreground-muted mt-1">
                  Bạn vẫn có thể sử dụng Premium đến hết ngày 01/01/2025.
                  Sau đó tài khoản sẽ chuyển về gói Free.
                </p>
                <Button variant="outline" size="sm" className="mt-3 text-danger border-danger hover:bg-danger/10">
                  Hủy gói Premium
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <PremiumUpgradeModal
        open={showPremiumModal}
        onOpenChange={setShowPremiumModal}
      />
    </div>
  )
}
