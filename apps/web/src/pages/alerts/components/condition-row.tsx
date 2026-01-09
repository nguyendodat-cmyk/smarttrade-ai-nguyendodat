import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X } from 'lucide-react'

export interface ConditionData {
  id: string
  indicator: string
  operator: string
  value: string
  value_secondary: string
  timeframe: string
}

interface ConditionRowProps {
  condition: ConditionData
  onChange: (condition: ConditionData) => void
  onRemove: () => void
  canRemove: boolean
}

const indicators = [
  { id: 'price', name: 'Giá', operators: ['>=', '<=', '=', '>', '<'] },
  { id: 'volume', name: 'Khối lượng', operators: ['>=', '<=', '>', '<'] },
  { id: 'change_percent', name: '% Thay đổi', operators: ['>=', '<=', '>', '<'] },
  { id: 'rsi', name: 'RSI', operators: ['>=', '<=', 'crosses_above', 'crosses_below'] },
  { id: 'macd', name: 'MACD', operators: ['crosses_above', 'crosses_below'] },
  { id: 'ma', name: 'MA Crossover', operators: ['crosses_above', 'crosses_below'] },
  { id: 'bb', name: 'Bollinger Bands', operators: ['touches_upper', 'touches_lower'] },
]

const operatorLabels: Record<string, string> = {
  '>=': '>= (lớn hơn hoặc bằng)',
  '<=': '<= (nhỏ hơn hoặc bằng)',
  '=': '= (bằng)',
  '>': '> (lớn hơn)',
  '<': '< (nhỏ hơn)',
  crosses_above: 'Cắt lên',
  crosses_below: 'Cắt xuống',
  touches_upper: 'Chạm band trên',
  touches_lower: 'Chạm band dưới',
}

const valuePlaceholders: Record<string, string> = {
  price: 'VD: 85000',
  volume: 'VD: 1000000',
  change_percent: 'VD: 3',
  rsi: 'VD: 30',
  macd: 'VD: 0',
  ma: 'MA ngắn (VD: 20)',
  bb: 'Độ lệch (VD: 2)',
}

const valueLabels: Record<string, string> = {
  price: 'Giá (VND)',
  volume: 'Khối lượng',
  change_percent: 'Phần trăm (%)',
  rsi: 'RSI (0-100)',
  macd: 'Signal value',
  ma: 'MA Period 1',
  bb: 'Deviation',
}

export function ConditionRow({
  condition,
  onChange,
  onRemove,
  canRemove,
}: ConditionRowProps) {
  const selectedIndicator = indicators.find((i) => i.id === condition.indicator)
  const availableOperators = selectedIndicator?.operators || []
  const needsSecondaryValue = condition.indicator === 'ma'

  const handleIndicatorChange = (value: string) => {
    const indicator = indicators.find((i) => i.id === value)
    const defaultOperator = indicator?.operators[0] || '>='

    onChange({
      ...condition,
      indicator: value,
      operator: defaultOperator,
      value: '',
      value_secondary: '',
    })
  }

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-2">
      <div className="flex-1 grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          {/* Indicator Select */}
          <div className="space-y-1">
            <label className="text-xs text-foreground-muted">Chỉ báo</label>
            <Select
              value={condition.indicator}
              onValueChange={handleIndicatorChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn chỉ báo" />
              </SelectTrigger>
              <SelectContent>
                {indicators.map((indicator) => (
                  <SelectItem key={indicator.id} value={indicator.id}>
                    {indicator.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Operator Select */}
          <div className="space-y-1">
            <label className="text-xs text-foreground-muted">Điều kiện</label>
            <Select
              value={condition.operator}
              onValueChange={(value) => onChange({ ...condition, operator: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn điều kiện" />
              </SelectTrigger>
              <SelectContent>
                {availableOperators.map((op) => (
                  <SelectItem key={op} value={op}>
                    {operatorLabels[op] || op}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className={needsSecondaryValue ? 'grid grid-cols-2 gap-3' : ''}>
          {/* Primary Value Input */}
          <div className="space-y-1">
            <label className="text-xs text-foreground-muted">
              {valueLabels[condition.indicator] || 'Giá trị'}
            </label>
            <Input
              type="number"
              value={condition.value}
              onChange={(e) => onChange({ ...condition, value: e.target.value })}
              placeholder={valuePlaceholders[condition.indicator] || 'Nhập giá trị'}
            />
          </div>

          {/* Secondary Value Input (for MA crossover) */}
          {needsSecondaryValue && (
            <div className="space-y-1">
              <label className="text-xs text-foreground-muted">MA Period 2</label>
              <Input
                type="number"
                value={condition.value_secondary}
                onChange={(e) =>
                  onChange({ ...condition, value_secondary: e.target.value })
                }
                placeholder="VD: 50"
              />
            </div>
          )}
        </div>
      </div>

      {/* Remove Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        disabled={!canRemove}
        className="shrink-0 mt-6"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
