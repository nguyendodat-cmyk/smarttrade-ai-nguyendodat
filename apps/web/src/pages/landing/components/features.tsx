import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-6 border-t border-gray-200 dark:border-[#1E1E1E] bg-white dark:bg-[#0A0A0A]">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-xs uppercase tracking-[0.2em] text-orange-500 mb-4">Tính năng</p>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-gray-900 dark:text-white">
            ĐIỀU GÌ LÀM NÊN SỰ KHÁC BIỆT
          </h2>
          <div className="w-24 h-0.5 bg-gray-200 dark:bg-[#1E1E1E] mt-6" />
        </motion.div>

        {/* Feature 01 - Financial Report Intelligence */}
        <motion.div
          className="mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-baseline gap-4 mb-6">
            <span className="text-4xl font-mono text-orange-500">01</span>
            <div className="w-8 h-0.5 bg-orange-500" />
          </div>
          <h3 className="text-2xl md:text-3xl font-semibold mb-2 text-gray-900 dark:text-white">
            PHÂN TÍCH
          </h3>
          <h3 className="text-2xl md:text-3xl font-semibold text-gray-500 dark:text-[#64748B] mb-6">
            BÁO CÁO TÀI CHÍNH
          </h3>
          <p className="text-gray-600 dark:text-[#94A3B8] max-w-xl mb-8">
            AI của chúng tôi đọc và phân tích báo cáo quý chỉ trong vài phút sau khi công bố.
            So sánh sự khác biệt:
          </p>

          {/* Comparison Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-200 dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#1E1E1E] rounded-xl overflow-hidden">
            <div className="bg-gray-50 dark:bg-[#111111] p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-[#64748B] mb-4">
                Chuyên viên phân tích
              </p>
              <div className="space-y-4">
                <div>
                  <p className="text-3xl font-mono text-gray-900 dark:text-white">4-6 giờ</p>
                  <p className="text-sm text-gray-500 dark:text-[#64748B]">để phân tích một báo cáo</p>
                </div>
                <div>
                  <p className="text-3xl font-mono text-gray-900 dark:text-white">5-10 báo cáo</p>
                  <p className="text-sm text-gray-500 dark:text-[#64748B]">tối đa mỗi ngày</p>
                </div>
                <div>
                  <p className="text-lg text-gray-500 dark:text-[#64748B]">Đánh giá chủ quan</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-[#0A0A0A] p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-orange-500 mb-4">
                SmartTrade AI
              </p>
              <div className="space-y-4">
                <div>
                  <p className="text-3xl font-mono text-green-600 dark:text-[#00C853]">&lt; 3 phút</p>
                  <p className="text-sm text-gray-500 dark:text-[#64748B]">phân tích hoàn chỉnh</p>
                </div>
                <div>
                  <p className="text-3xl font-mono text-green-600 dark:text-[#00C853]">TẤT CẢ báo cáo</p>
                  <p className="text-sm text-gray-500 dark:text-[#64748B]">xử lý tức thì</p>
                </div>
                <div>
                  <p className="text-lg text-green-600 dark:text-[#00C853]">Nhất quán dựa trên dữ liệu</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Feature 02 - News Intelligence */}
        <motion.div
          className="mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-baseline gap-4 mb-6">
            <span className="text-4xl font-mono text-orange-500">02</span>
            <div className="w-8 h-0.5 bg-orange-500" />
          </div>
          <h3 className="text-2xl md:text-3xl font-semibold mb-2 text-gray-900 dark:text-white">
            TIN TỨC 24/7
          </h3>
          <h3 className="text-2xl md:text-3xl font-semibold text-gray-500 dark:text-[#64748B] mb-6">
            PHÂN TÍCH THÔNG MINH
          </h3>
          <p className="text-gray-600 dark:text-[#94A3B8] max-w-xl mb-8">
            Mọi tiêu đề được phân tích. Mọi tác động được lượng hóa. Đánh giá cảm xúc thời gian thực
            cho danh mục của bạn.
          </p>

          {/* Live News Feed */}
          <LiveNewsFeed />
        </motion.div>

        {/* Feature 03 - Portfolio Intelligence */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-baseline gap-4 mb-6">
            <span className="text-4xl font-mono text-orange-500">03</span>
            <div className="w-8 h-0.5 bg-orange-500" />
          </div>
          <h3 className="text-2xl md:text-3xl font-semibold mb-2 text-gray-900 dark:text-white">
            PHÂN TÍCH
          </h3>
          <h3 className="text-2xl md:text-3xl font-semibold text-gray-500 dark:text-[#64748B] mb-6">
            DANH MỤC ĐẦU TƯ
          </h3>
          <p className="text-gray-600 dark:text-[#94A3B8] max-w-xl mb-8">
            Phân tích rủi ro danh mục mà các quỹ hedge fund phải trả hàng triệu đô.
            Giờ đây dành cho nhà đầu tư cá nhân.
          </p>

          {/* Portfolio Health Widget */}
          <PortfolioHealthWidget />
        </motion.div>
      </div>
    </section>
  )
}

function LiveNewsFeed() {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (minutesAgo: number) => {
    const time = new Date(currentTime.getTime() - minutesAgo * 60000)
    return time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  }

  const news = [
    {
      time: 2,
      symbol: 'FPT',
      headline: 'Lợi nhuận Q4 vượt kỳ vọng 12%',
      sentiment: 'TÍCH CỰC',
      confidence: 82,
    },
    {
      time: 6,
      symbol: 'HPG',
      headline: 'Giá thép tăng mạnh tại thị trường Trung Quốc',
      sentiment: 'TÍCH CỰC',
      confidence: 65,
    },
    {
      time: 19,
      symbol: 'VNM',
      headline: 'Ra mắt sản phẩm mới trong Q1',
      sentiment: 'TRUNG LẬP',
      confidence: 50,
    },
    {
      time: 32,
      symbol: null,
      headline: 'Ngành ngân hàng đối mặt quy định vốn mới',
      sentiment: 'TIÊU CỰC',
      confidence: 35,
    },
  ]

  return (
    <div className="border border-gray-200 dark:border-[#1E1E1E] bg-gray-50 dark:bg-[#111111] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-[#1E1E1E] bg-white dark:bg-[#0A0A0A]">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-[#64748B]">Tin tức trực tiếp</p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 dark:bg-[#00C853] animate-pulse" />
          <span className="text-xs font-mono text-gray-500 dark:text-[#64748B]">LIVE</span>
        </div>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-[#1E1E1E]">
        {news.map((item, i) => (
          <div key={i} className="px-4 py-3 flex items-start gap-4">
            <span className="text-xs font-mono text-gray-500 dark:text-[#64748B] w-12 flex-shrink-0">
              {formatTime(item.time)}
            </span>
            {item.symbol && (
              <span className="text-xs font-mono text-orange-500 w-10 flex-shrink-0">
                {item.symbol}
              </span>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 dark:text-white truncate">{item.headline}</p>
              <div className="flex items-center gap-3 mt-1">
                <span
                  className={`text-xs font-mono ${
                    item.sentiment === 'TÍCH CỰC'
                      ? 'text-green-600 dark:text-[#00C853]'
                      : item.sentiment === 'TIÊU CỰC'
                        ? 'text-red-600 dark:text-[#FF1744]'
                        : 'text-gray-500 dark:text-[#64748B]'
                  }`}
                >
                  AI: {item.sentiment}
                </span>
                <div className="flex items-center gap-1">
                  <div className="w-20 h-1.5 bg-gray-200 dark:bg-[#1E1E1E] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.sentiment === 'TÍCH CỰC'
                          ? 'bg-green-500 dark:bg-[#00C853]'
                          : item.sentiment === 'TIÊU CỰC'
                            ? 'bg-red-500 dark:bg-[#FF1744]'
                            : 'bg-gray-400 dark:bg-[#64748B]'
                      }`}
                      style={{ width: `${item.confidence}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-gray-500 dark:text-[#64748B]">{item.confidence}%</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PortfolioHealthWidget() {
  return (
    <div className="border border-gray-200 dark:border-[#1E1E1E] bg-gray-50 dark:bg-[#111111] rounded-xl overflow-hidden">
      <div className="px-4 py-2 border-b border-gray-200 dark:border-[#1E1E1E] bg-white dark:bg-[#0A0A0A]">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-[#64748B]">
          Sức khỏe danh mục
        </p>
      </div>
      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Score */}
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 border-4 border-orange-500 rounded-full flex items-center justify-center">
            <div className="text-center">
              <span className="text-3xl font-mono font-semibold text-gray-900 dark:text-white">78</span>
              <span className="text-sm text-gray-500 dark:text-[#64748B] block">/100</span>
            </div>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">ĐIỂM SỐ</p>
            <p className="text-sm text-gray-500 dark:text-[#64748B]">Tốt, nhưng có thể cải thiện</p>
          </div>
        </div>

        {/* Metrics */}
        <div className="space-y-4">
          {[
            { label: 'Đa dạng hóa', value: 78, color: '#FF6B35' },
            { label: 'Cân bằng rủi ro', value: 65, color: '#FFD600' },
            { label: 'Điểm chất lượng', value: 92, color: '#00C853' },
          ].map((metric) => (
            <div key={metric.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500 dark:text-[#64748B]">{metric.label}</span>
                <span className="font-mono text-gray-900 dark:text-white">{metric.value}%</span>
              </div>
              <div className="h-1.5 bg-gray-200 dark:bg-[#1E1E1E] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${metric.value}%`, backgroundColor: metric.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alert */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-[#1E1E1E] bg-orange-50 dark:bg-[#FF6B35]/5">
        <div className="flex items-start gap-3">
          <span className="text-orange-500 text-lg">⚠</span>
          <div>
            <p className="text-sm text-gray-900 dark:text-white">
              <span className="text-orange-500 font-medium">CẢNH BÁO:</span> Quá tập trung vào ngành Ngân hàng (45%)
            </p>
            <p className="text-sm text-gray-500 dark:text-[#64748B] mt-1">
              → AI đề xuất: Giảm vị thế VCB, cân nhắc thêm FPT để đa dạng hóa
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
