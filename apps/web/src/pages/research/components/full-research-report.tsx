import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/formatters'
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Target,
  BarChart3,
} from 'lucide-react'

interface FullResearchReportProps {
  symbol: string
  onClose: () => void
}

async function fetchFullReport(symbol: string) {
  // In production: fetch from /api/v1/research/report/{symbol}
  await new Promise((resolve) => setTimeout(resolve, 1500))

  return {
    symbol,
    report_date: new Date().toISOString().split('T')[0],
    executive_summary: `${symbol} đang có triển vọng tích cực với kết quả kinh doanh quý gần nhất vượt kỳ vọng. Doanh thu tăng trưởng 18% YoY và biên lợi nhuận được cải thiện nhờ tối ưu chi phí. Khuyến nghị MUA với mục tiêu giá tăng 15% trong 3 tháng tới.`,

    financial_analysis: {
      health_score: 72,
      analysis:
        'Tình hình tài chính ổn định với doanh thu tăng trưởng đều đặn. ROE 18% cao hơn trung bình ngành. Dòng tiền hoạt động mạnh, đủ khả năng chi trả cổ tức và đầu tư mở rộng.',
      highlights: [
        { metric: 'Doanh thu', assessment: 'positive', note: 'Tăng 18% YoY' },
        { metric: 'Lợi nhuận', assessment: 'positive', note: 'Tăng 22% YoY' },
        { metric: 'ROE', assessment: 'positive', note: '18% - trên TB ngành' },
        { metric: 'Nợ/Vốn', assessment: 'neutral', note: '0.8x - mức an toàn' },
      ],
      concerns: ['Chi phí bán hàng tăng', 'Nợ ngắn hạn cao'],
      strengths: ['Dòng tiền mạnh', 'Thị phần dẫn đầu', 'Quản trị tốt'],
    },

    technical_analysis: {
      score: 65,
      trend: 'uptrend',
      analysis:
        'Giá đang trong xu hướng tăng trung hạn, hiện trên MA20 và MA50. RSI ở mức 58 - vùng trung tính. Volume tích lũy tốt.',
      support_levels: [45000, 42000],
      resistance_levels: [52000, 55000],
    },

    news_sentiment: {
      score: 70,
      overall_sentiment: 'positive',
      summary:
        'Tin tức 30 ngày qua chủ yếu tích cực với các thông tin về kết quả kinh doanh và kế hoạch mở rộng.',
      key_events: [
        { date: '2024-12-20', event: 'Công bố BCTC Q4', impact: 'positive' },
        { date: '2024-12-15', event: 'Ký hợp đồng mới', impact: 'positive' },
      ],
    },

    ai_recommendation: {
      rating: 'buy',
      confidence: 75,
      price_targets: {
        low: 48000,
        mid: 55000,
        high: 62000,
      },
      time_horizon: '1-3 tháng',
      reasoning:
        'Dựa trên tăng trưởng ổn định, định giá hợp lý và momentum tích cực.',
    },

    risks: [
      'Biến động thị trường chung',
      'Cạnh tranh ngành tăng cao',
      'Rủi ro tỷ giá',
    ],
    opportunities: [
      'Mở rộng thị trường quốc tế',
      'Ra mắt sản phẩm mới Q1/2025',
      'M&A tiềm năng',
    ],
  }
}

export function FullResearchReport({
  symbol,
  onClose,
}: FullResearchReportProps) {
  const { data: report, isLoading } = useQuery({
    queryKey: ['research-report', symbol],
    queryFn: () => fetchFullReport(symbol),
  })

  const ratingColors: Record<string, string> = {
    strong_buy: 'bg-success text-white',
    buy: 'bg-success/80 text-white',
    hold: 'bg-warning text-black',
    sell: 'bg-danger/80 text-white',
    strong_sell: 'bg-danger text-white',
  }

  const ratingLabels: Record<string, string> = {
    strong_buy: 'MUA MẠNH',
    buy: 'MUA',
    hold: 'GIỮ',
    sell: 'BÁN',
    strong_sell: 'BÁN MẠNH',
  }

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-brand" />
            AI Research Report: {symbol}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-80px)] px-6 pb-6">
          {isLoading ? (
            <div className="space-y-4 mt-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : report ? (
            <div className="space-y-4 mt-4">
              {/* AI Recommendation */}
              <Card className="border-brand/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Badge
                        className={cn(
                          'text-lg px-3 py-1',
                          ratingColors[report.ai_recommendation.rating]
                        )}
                      >
                        {ratingLabels[report.ai_recommendation.rating]}
                      </Badge>
                      <span className="text-sm text-foreground-muted">
                        Confidence: {report.ai_recommendation.confidence}%
                      </span>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-foreground-muted">Target Price</p>
                      <p className="font-bold">
                        {formatCurrency(report.ai_recommendation.price_targets.mid)}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm">{report.executive_summary}</p>
                </CardContent>
              </Card>

              {/* Price Targets */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Mục tiêu giá
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="text-center">
                      <p className="text-xs text-foreground-muted">Thấp</p>
                      <p className="font-mono font-bold text-danger">
                        {formatCurrency(report.ai_recommendation.price_targets.low)}
                      </p>
                    </div>
                    <div className="flex-1 mx-4 h-2 bg-gradient-to-r from-danger via-warning to-success rounded-full" />
                    <div className="text-center">
                      <p className="text-xs text-foreground-muted">Cao</p>
                      <p className="font-mono font-bold text-success">
                        {formatCurrency(report.ai_recommendation.price_targets.high)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Analysis */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Phân tích tài chính
                    <Badge variant="outline" className="ml-auto">
                      Score: {report.financial_analysis.health_score}/100
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-foreground-secondary">
                    {report.financial_analysis.analysis}
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    {report.financial_analysis.highlights.map((h, i) => (
                      <div
                        key={i}
                        className={cn(
                          'p-2 rounded-lg text-sm',
                          h.assessment === 'positive' && 'bg-success/10',
                          h.assessment === 'negative' && 'bg-danger/10',
                          h.assessment === 'neutral' && 'bg-surface-2'
                        )}
                      >
                        <p className="font-medium">{h.metric}</p>
                        <p className="text-xs text-foreground-muted">{h.note}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Technical Analysis */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Phân tích kỹ thuật
                    <Badge
                      variant="outline"
                      className={cn(
                        'ml-auto',
                        report.technical_analysis.trend === 'uptrend' &&
                          'text-success border-success',
                        report.technical_analysis.trend === 'downtrend' &&
                          'text-danger border-danger'
                      )}
                    >
                      {report.technical_analysis.trend.toUpperCase()}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-foreground-secondary">
                    {report.technical_analysis.analysis}
                  </p>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-foreground-muted mb-1">Hỗ trợ</p>
                      {report.technical_analysis.support_levels.map((level, i) => (
                        <p key={i} className="font-mono text-danger">
                          {formatCurrency(level)}
                        </p>
                      ))}
                    </div>
                    <div>
                      <p className="text-foreground-muted mb-1">Kháng cự</p>
                      {report.technical_analysis.resistance_levels.map(
                        (level, i) => (
                          <p key={i} className="font-mono text-success">
                            {formatCurrency(level)}
                          </p>
                        )
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Risks & Opportunities */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-danger">
                      <AlertTriangle className="h-4 w-4" />
                      Rủi ro
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1 text-sm">
                      {report.risks.map((risk, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-danger">•</span>
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-success">
                      <Lightbulb className="h-4 w-4" />
                      Cơ hội
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1 text-sm">
                      {report.opportunities.map((opp, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-success">•</span>
                          {opp}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Disclaimer */}
              <p className="text-xs text-foreground-muted text-center p-4 bg-surface-2 rounded-lg">
                Báo cáo này được tạo bởi AI và chỉ mang tính chất tham khảo.
                Vui lòng tự nghiên cứu trước khi đầu tư.
              </p>
            </div>
          ) : null}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
