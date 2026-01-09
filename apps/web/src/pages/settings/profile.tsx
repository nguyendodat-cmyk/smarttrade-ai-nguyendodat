import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Camera, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function ProfileSettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: 'Demo User',
    email: 'demo@smarttrade.vn',
    phone: '0901234567',
    riskTolerance: 'moderate',
    investmentGoal: 'growth',
    experience: 'intermediate',
  })

  const handleSave = async () => {
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 1000))
    setIsLoading(false)
    toast.success('Đã lưu thông tin hồ sơ')
  }

  return (
    <div className="space-y-6">
      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle>Ảnh đại diện</CardTitle>
          <CardDescription>Chọn ảnh để hiển thị trên hồ sơ của bạn</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src="" />
                <AvatarFallback className="text-2xl bg-brand/20 text-brand">
                  {formData.fullName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="outline"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div>
              <Button variant="outline" size="sm">
                Tải ảnh lên
              </Button>
              <p className="text-xs text-foreground-muted mt-2">
                JPG, PNG. Tối đa 2MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin cá nhân</CardTitle>
          <CardDescription>Cập nhật thông tin cơ bản của bạn</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ và tên</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={formData.email} disabled />
            <p className="text-xs text-foreground-muted">
              Email không thể thay đổi
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Investment Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Hồ sơ đầu tư</CardTitle>
          <CardDescription>
            Giúp AI đưa ra khuyến nghị phù hợp với bạn
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Mức độ chấp nhận rủi ro</Label>
            <Select
              value={formData.riskTolerance}
              onValueChange={(v) =>
                setFormData({ ...formData, riskTolerance: v })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conservative">Thận trọng - Ưu tiên bảo toàn vốn</SelectItem>
                <SelectItem value="moderate">Cân bằng - Chấp nhận rủi ro vừa phải</SelectItem>
                <SelectItem value="aggressive">Mạo hiểm - Sẵn sàng rủi ro cao</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Mục tiêu đầu tư</Label>
            <Select
              value={formData.investmentGoal}
              onValueChange={(v) =>
                setFormData({ ...formData, investmentGoal: v })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Thu nhập - Cổ tức ổn định</SelectItem>
                <SelectItem value="growth">Tăng trưởng - Lợi nhuận dài hạn</SelectItem>
                <SelectItem value="trading">Giao dịch - Lợi nhuận ngắn hạn</SelectItem>
                <SelectItem value="preservation">Bảo toàn - An toàn vốn</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Kinh nghiệm đầu tư</Label>
            <Select
              value={formData.experience}
              onValueChange={(v) =>
                setFormData({ ...formData, experience: v })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Mới bắt đầu (0-1 năm)</SelectItem>
                <SelectItem value="intermediate">Trung bình (1-3 năm)</SelectItem>
                <SelectItem value="advanced">Nhiều kinh nghiệm (3-5 năm)</SelectItem>
                <SelectItem value="expert">Chuyên gia (5+ năm)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Lưu thay đổi
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
