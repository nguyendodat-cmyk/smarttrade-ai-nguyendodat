import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Key,
  Smartphone,
  Monitor,
  LogOut,
  Loader2,
  Check,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'

const mockSessions = [
  {
    id: '1',
    device: 'Chrome on MacOS',
    location: 'Ho Chi Minh, Vietnam',
    lastActive: 'Đang hoạt động',
    current: true,
  },
  {
    id: '2',
    device: 'Safari on iPhone',
    location: 'Ho Chi Minh, Vietnam',
    lastActive: '2 giờ trước',
    current: false,
  },
  {
    id: '3',
    device: 'Firefox on Windows',
    location: 'Hanoi, Vietnam',
    lastActive: '3 ngày trước',
    current: false,
  },
]

export function SecuritySettingsPage() {
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  })

  const handleChangePassword = async () => {
    if (passwordData.new !== passwordData.confirm) {
      toast.error('Mật khẩu mới không khớp')
      return
    }
    if (passwordData.new.length < 8) {
      toast.error('Mật khẩu mới phải có ít nhất 8 ký tự')
      return
    }

    setIsChangingPassword(true)
    await new Promise((r) => setTimeout(r, 1000))
    setIsChangingPassword(false)
    setPasswordData({ current: '', new: '', confirm: '' })
    toast.success('Đã đổi mật khẩu thành công')
  }

  const handleToggle2FA = () => {
    setTwoFactorEnabled(!twoFactorEnabled)
    toast.success(
      twoFactorEnabled
        ? 'Đã tắt xác thực 2 lớp'
        : 'Đã bật xác thực 2 lớp'
    )
  }

  const handleLogoutAll = () => {
    toast.success('Đã đăng xuất tất cả thiết bị khác')
  }

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-foreground-muted" />
            <div>
              <CardTitle>Đổi mật khẩu</CardTitle>
              <CardDescription>
                Cập nhật mật khẩu để bảo vệ tài khoản
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current">Mật khẩu hiện tại</Label>
            <Input
              id="current"
              type="password"
              value={passwordData.current}
              onChange={(e) =>
                setPasswordData({ ...passwordData, current: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new">Mật khẩu mới</Label>
              <Input
                id="new"
                type="password"
                value={passwordData.new}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, new: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Xác nhận mật khẩu mới</Label>
              <Input
                id="confirm"
                type="password"
                value={passwordData.confirm}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirm: e.target.value })
                }
              />
            </div>
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={isChangingPassword || !passwordData.current || !passwordData.new}
          >
            {isChangingPassword ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              'Đổi mật khẩu'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Two-Factor Auth */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-foreground-muted" />
            <div>
              <CardTitle>Xác thực 2 lớp (2FA)</CardTitle>
              <CardDescription>
                Bảo vệ tài khoản với lớp bảo mật bổ sung
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-surface-2 rounded-lg">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  twoFactorEnabled ? 'bg-success/10' : 'bg-warning/10'
                }`}
              >
                {twoFactorEnabled ? (
                  <Check className="h-5 w-5 text-success" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-warning" />
                )}
              </div>
              <div>
                <p className="font-medium">
                  {twoFactorEnabled ? 'Đã bật' : 'Chưa bật'}
                </p>
                <p className="text-sm text-foreground-muted">
                  {twoFactorEnabled
                    ? 'Tài khoản của bạn được bảo vệ 2 lớp'
                    : 'Bật để tăng cường bảo mật'}
                </p>
              </div>
            </div>
            <Switch checked={twoFactorEnabled} onCheckedChange={handleToggle2FA} />
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-foreground-muted" />
              <div>
                <CardTitle>Phiên đăng nhập</CardTitle>
                <CardDescription>
                  Quản lý các thiết bị đang đăng nhập
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogoutAll}>
              <LogOut className="h-4 w-4 mr-2" />
              Đăng xuất tất cả
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 bg-surface-2 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Monitor className="h-5 w-5 text-foreground-muted" />
                  <div>
                    <p className="font-medium text-sm">{session.device}</p>
                    <p className="text-xs text-foreground-muted">
                      {session.location}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {session.current ? (
                    <Badge className="bg-success">Thiết bị này</Badge>
                  ) : (
                    <>
                      <span className="text-xs text-foreground-muted">
                        {session.lastActive}
                      </span>
                      <Button variant="ghost" size="sm">
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
