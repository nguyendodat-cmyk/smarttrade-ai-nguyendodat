import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { ConditionRow, ConditionData } from './condition-row'
import {
  Bell,
  Plus,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'

interface Alert {
  id: string
  name: string
  symbol: string
  is_active: boolean
  logic_operator: string
  check_interval: string
  notification_channels: string[]
  trigger_count: number
  last_triggered_at: string | null
  expires_at: string | null
  conditions: {
    id: string
    indicator: string
    operator: string
    value: number
    value_secondary: number | null
    timeframe: string
  }[]
}

interface AlertBuilderProps {
  alert?: Alert | null
  onClose: () => void
  onSuccess: () => void
}

const DEMO_STOCKS = [
  { symbol: 'VNM', name: 'Vinamilk' },
  { symbol: 'FPT', name: 'FPT Corporation' },
  { symbol: 'VIC', name: 'Vingroup' },
  { symbol: 'HPG', name: 'Hòa Phát' },
  { symbol: 'VCB', name: 'Vietcombank' },
  { symbol: 'TCB', name: 'Techcombank' },
  { symbol: 'MWG', name: 'Mobile World' },
  { symbol: 'MSN', name: 'Masan' },
  { symbol: 'VHM', name: 'Vinhomes' },
  { symbol: 'VRE', name: 'Vincom Retail' },
]

const INTERVALS = [
  { id: '1m', name: '1 phút', description: 'Kiểm tra mỗi phút' },
  { id: '5m', name: '5 phút', description: 'Kiểm tra mỗi 5 phút' },
  { id: '15m', name: '15 phút', description: 'Kiểm tra mỗi 15 phút' },
  { id: '1h', name: '1 giờ', description: 'Kiểm tra mỗi giờ' },
]

const CHANNELS = [
  { id: 'push', name: 'Push Notification', description: 'Thông báo trên điện thoại' },
  { id: 'in_app', name: 'In-App', description: 'Thông báo trong ứng dụng' },
  { id: 'email', name: 'Email', description: 'Gửi email thông báo' },
]

function generateId(): string {
  return `cond-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function AlertBuilder({ alert, onClose, onSuccess }: AlertBuilderProps) {
  const isEditing = !!alert

  // Step management
  const [step, setStep] = useState(1)
  const totalSteps = 4

  // Form state
  const [name, setName] = useState(alert?.name || '')
  const [symbol, setSymbol] = useState(alert?.symbol || '')
  const [symbolSearch, setSymbolSearch] = useState('')
  const [logicOperator, setLogicOperator] = useState<'AND' | 'OR'>(
    (alert?.logic_operator as 'AND' | 'OR') || 'AND'
  )
  const [checkInterval, setCheckInterval] = useState(alert?.check_interval || '5m')
  const [notificationChannels, setNotificationChannels] = useState<string[]>(
    alert?.notification_channels || ['push', 'in_app']
  )
  const [conditions, setConditions] = useState<ConditionData[]>(
    alert?.conditions.map((c) => ({
      id: c.id,
      indicator: c.indicator,
      operator: c.operator,
      value: c.value.toString(),
      value_secondary: c.value_secondary?.toString() || '',
      timeframe: c.timeframe,
    })) || [
      {
        id: generateId(),
        indicator: 'price',
        operator: '>=',
        value: '',
        value_secondary: '',
        timeframe: '1d',
      },
    ]
  )

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Filtered stocks for search
  const filteredStocks = useMemo(() => {
    if (!symbolSearch) return DEMO_STOCKS
    const search = symbolSearch.toLowerCase()
    return DEMO_STOCKS.filter(
      (s) =>
        s.symbol.toLowerCase().includes(search) ||
        s.name.toLowerCase().includes(search)
    )
  }, [symbolSearch])

  const validateStep = (stepNum: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (stepNum === 1) {
      if (!symbol) newErrors.symbol = 'Vui lòng chọn mã cổ phiếu'
      if (!name.trim()) newErrors.name = 'Vui lòng nhập tên alert'
    }

    if (stepNum === 2) {
      conditions.forEach((cond, i) => {
        if (!cond.value) {
          newErrors[`condition_${i}`] = 'Vui lòng nhập giá trị'
        }
        if (cond.indicator === 'ma' && !cond.value_secondary) {
          newErrors[`condition_${i}_secondary`] = 'Vui lòng nhập MA Period 2'
        }
      })
    }

    if (stepNum === 3) {
      if (notificationChannels.length === 0) {
        newErrors.channels = 'Vui lòng chọn ít nhất 1 kênh thông báo'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, totalSteps))
    }
  }

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 1))
  }

  const handleAddCondition = () => {
    if (conditions.length >= 10) {
      toast.error('Tối đa 10 điều kiện')
      return
    }
    setConditions([
      ...conditions,
      {
        id: generateId(),
        indicator: 'price',
        operator: '>=',
        value: '',
        value_secondary: '',
        timeframe: '1d',
      },
    ])
  }

  const handleRemoveCondition = (id: string) => {
    setConditions(conditions.filter((c) => c.id !== id))
  }

  const handleConditionChange = (id: string, updated: ConditionData) => {
    setConditions(conditions.map((c) => (c.id === id ? updated : c)))
  }

  const handleChannelToggle = (channelId: string) => {
    setNotificationChannels((prev) =>
      prev.includes(channelId)
        ? prev.filter((c) => c !== channelId)
        : [...prev, channelId]
    )
  }

  const handleSubmit = async () => {
    if (!validateStep(step)) return

    try {
      // In production: POST/PUT to API
      await new Promise((resolve) => setTimeout(resolve, 500))

      toast.success(isEditing ? 'Đã cập nhật alert' : 'Đã tạo alert mới')
      onSuccess()
    } catch {
      toast.error('Có lỗi xảy ra')
    }
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-brand" />
            {isEditing ? 'Chỉnh sửa Alert' : 'Tạo Alert mới'}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                    s < step
                      ? 'bg-success text-white'
                      : s === step
                        ? 'bg-brand text-white'
                        : 'bg-surface-2 text-foreground-muted'
                  )}
                >
                  {s < step ? <Check className="h-4 w-4" /> : s}
                </div>
                {s < 4 && (
                  <div
                    className={cn(
                      'w-12 h-1 mx-2',
                      s < step ? 'bg-success' : 'bg-surface-2'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-foreground-muted">
            <span>Cổ phiếu</span>
            <span>Điều kiện</span>
            <span>Cài đặt</span>
            <span>Xác nhận</span>
          </div>
        </div>

        <ScrollArea className="max-h-[50vh]">
          <div className="p-6 space-y-4">
            {/* Step 1: Stock Selection */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Mã cổ phiếu</Label>
                  <Input
                    placeholder="Tìm mã cổ phiếu..."
                    value={symbolSearch}
                    onChange={(e) => setSymbolSearch(e.target.value)}
                  />
                  {errors.symbol && (
                    <p className="text-xs text-danger flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.symbol}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {filteredStocks.map((stock) => (
                    <Button
                      key={stock.symbol}
                      variant={symbol === stock.symbol ? 'default' : 'outline'}
                      className="justify-start h-auto py-2"
                      onClick={() => setSymbol(stock.symbol)}
                    >
                      <div className="text-left">
                        <div className="font-bold">{stock.symbol}</div>
                        <div className="text-xs opacity-70">{stock.name}</div>
                      </div>
                    </Button>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>Tên Alert</Label>
                  <Input
                    placeholder="VD: VNM Buy Signal"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  {errors.name && (
                    <p className="text-xs text-danger flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.name}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Conditions */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Điều kiện</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-foreground-muted">Kết hợp:</span>
                    <Select
                      value={logicOperator}
                      onValueChange={(v) => setLogicOperator(v as 'AND' | 'OR')}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AND">AND</SelectItem>
                        <SelectItem value="OR">OR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <p className="text-xs text-foreground-muted">
                  {logicOperator === 'AND'
                    ? 'Tất cả điều kiện phải đúng để trigger alert'
                    : 'Chỉ cần 1 điều kiện đúng để trigger alert'}
                </p>

                <div className="space-y-3">
                  {conditions.map((condition, index) => (
                    <div key={condition.id}>
                      {index > 0 && (
                        <div className="flex items-center justify-center my-2">
                          <Badge variant="secondary">{logicOperator}</Badge>
                        </div>
                      )}
                      <ConditionRow
                        condition={condition}
                        onChange={(updated) =>
                          handleConditionChange(condition.id, updated)
                        }
                        onRemove={() => handleRemoveCondition(condition.id)}
                        canRemove={conditions.length > 1}
                      />
                      {errors[`condition_${index}`] && (
                        <p className="text-xs text-danger mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors[`condition_${index}`]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleAddCondition}
                  disabled={conditions.length >= 10}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm điều kiện
                </Button>
              </div>
            )}

            {/* Step 3: Settings */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>Tần suất kiểm tra</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {INTERVALS.map((interval) => (
                      <Button
                        key={interval.id}
                        variant={checkInterval === interval.id ? 'default' : 'outline'}
                        className="h-auto py-3 justify-start"
                        onClick={() => setCheckInterval(interval.id)}
                      >
                        <div className="text-left">
                          <div className="font-medium">{interval.name}</div>
                          <div className="text-xs opacity-70">{interval.description}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Kênh thông báo</Label>
                  {errors.channels && (
                    <p className="text-xs text-danger flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.channels}
                    </p>
                  )}
                  <div className="space-y-2">
                    {CHANNELS.map((channel) => (
                      <div
                        key={channel.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border"
                      >
                        <Checkbox
                          id={channel.id}
                          checked={notificationChannels.includes(channel.id)}
                          onCheckedChange={() => handleChannelToggle(channel.id)}
                        />
                        <label
                          htmlFor={channel.id}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="font-medium">{channel.name}</div>
                          <div className="text-xs text-foreground-muted">
                            {channel.description}
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-surface-2 space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono font-bold">
                      {symbol}
                    </Badge>
                    <span className="font-medium">{name}</span>
                  </div>

                  <div className="text-sm space-y-1">
                    <p className="text-foreground-muted">Điều kiện:</p>
                    {conditions.map((c, i) => (
                      <p key={c.id}>
                        {i > 0 && (
                          <Badge variant="secondary" className="mr-2">
                            {logicOperator}
                          </Badge>
                        )}
                        <span className="font-mono">
                          {c.indicator} {c.operator} {c.value}
                          {c.value_secondary && ` / ${c.value_secondary}`}
                        </span>
                      </p>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-foreground-muted">
                      Kiểm tra: {INTERVALS.find((i) => i.id === checkInterval)?.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {notificationChannels.map((ch) => (
                      <Badge key={ch} variant="outline" className="capitalize">
                        {ch === 'in_app' ? 'In-App' : ch}
                      </Badge>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-foreground-muted text-center">
                  Alert sẽ được kích hoạt ngay sau khi tạo
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer Buttons */}
        <div className="p-6 pt-0 flex items-center justify-between">
          <Button variant="ghost" onClick={step === 1 ? onClose : handleBack}>
            {step === 1 ? 'Hủy' : (
              <>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Quay lại
              </>
            )}
          </Button>

          {step < totalSteps ? (
            <Button onClick={handleNext}>
              Tiếp theo
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit}>
              <Check className="h-4 w-4 mr-2" />
              {isEditing ? 'Cập nhật' : 'Tạo Alert'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
