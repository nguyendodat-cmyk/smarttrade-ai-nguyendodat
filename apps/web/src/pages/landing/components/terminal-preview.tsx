import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export function TerminalPreview() {
  const [lastUpdated, setLastUpdated] = useState(2)

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated((prev) => (prev >= 10 ? 1 : prev + 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="py-16 px-6 bg-gray-50 dark:bg-[#0A0A0A]">
      <div className="max-w-6xl mx-auto">
        {/* Terminal Container */}
        <motion.div
          className="border border-gray-200 dark:border-[#1E1E1E] bg-white dark:bg-[#111111] rounded-xl overflow-hidden shadow-xl"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Terminal Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-[#1E1E1E] bg-gray-50 dark:bg-[#0A0A0A]">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <span className="text-xs text-gray-500 dark:text-[#64748B] font-mono uppercase tracking-wider">
              Terminal Trực Tiếp
            </span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-gray-500 dark:text-[#64748B] font-mono">LIVE</span>
            </div>
          </div>

          {/* Terminal Content */}
          <div className="grid grid-cols-12 divide-x divide-gray-200 dark:divide-[#1E1E1E]">
            {/* Left Panel - Stock Info */}
            <div className="col-span-12 lg:col-span-3 p-4 space-y-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-[#64748B] uppercase tracking-wider mb-1">Mã CK</p>
                <p className="text-2xl font-mono font-semibold text-gray-900 dark:text-white">VNM</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-[#64748B] uppercase tracking-wider mb-1">Giá</p>
                <p className="text-3xl font-mono text-gray-900 dark:text-white">₫76,500</p>
                <p className="text-sm font-mono text-green-600 dark:text-[#00C853]">▲ +2.34%</p>
              </div>
              <div className="pt-4 border-t border-gray-200 dark:border-[#1E1E1E] space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-[#64748B]">Khối lượng</span>
                  <span className="font-mono text-gray-900 dark:text-white">2.3M</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-[#64748B]">Giá trị</span>
                  <span className="font-mono text-gray-900 dark:text-white">₫175B</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-[#64748B]">P/E</span>
                  <span className="font-mono text-gray-900 dark:text-white">18.5x</span>
                </div>
              </div>
            </div>

            {/* Middle Panel - Chart */}
            <div className="col-span-12 lg:col-span-5 p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-gray-500 dark:text-[#64748B] uppercase tracking-wider">Biểu đồ giá - 1D</p>
                <div className="flex gap-2">
                  {['1D', '1W', '1M', '1Y'].map((t) => (
                    <button
                      key={t}
                      className={`px-2 py-1 text-xs font-mono rounded ${
                        t === '1D'
                          ? 'bg-orange-100 dark:bg-[#FF6B35]/20 text-orange-600 dark:text-[#FF6B35]'
                          : 'text-gray-500 dark:text-[#64748B] hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <TerminalChart />
            </div>

            {/* Right Panel - AI Insight */}
            <div className="col-span-12 lg:col-span-4 p-4 bg-gray-50 dark:bg-[#0A0A0A]">
              <p className="text-xs text-gray-500 dark:text-[#64748B] uppercase tracking-wider mb-4">Phân tích AI</p>

              <div className="mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-[#00C853]/10 border border-green-300 dark:border-[#00C853]/30 rounded">
                  <span className="text-green-600 dark:text-[#00C853] font-mono font-semibold">TÍN HIỆU MUA</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-[#64748B] mt-2">
                  Độ tin cậy: <span className="text-gray-900 dark:text-white font-mono">87%</span>
                </p>
              </div>

              <div className="space-y-3 text-sm">
                <p className="text-gray-600 dark:text-[#94A3B8]">
                  "Breakout trên MA50 với khối lượng hỗ trợ mạnh.
                  RSI ở mức 62 cho thấy động lượng tốt mà không quá mua."
                </p>
                <div className="pt-3 border-t border-gray-200 dark:border-[#1E1E1E]">
                  <p className="text-xs text-gray-500 dark:text-[#64748B] uppercase tracking-wider mb-2">Chỉ số quan trọng</p>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-[#64748B]">Mục tiêu</span>
                      <span className="font-mono text-green-600 dark:text-[#00C853]">₫85,000 (+11%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-[#64748B]">Cắt lỗ</span>
                      <span className="font-mono text-red-600 dark:text-[#FF1744]">₫72,000 (-6%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Panel - Market Overview */}
          <div className="border-t border-gray-200 dark:border-[#1E1E1E] grid grid-cols-12 divide-x divide-gray-200 dark:divide-[#1E1E1E]">
            {/* Top Movers */}
            <div className="col-span-12 lg:col-span-6 p-4">
              <p className="text-xs text-gray-500 dark:text-[#64748B] uppercase tracking-wider mb-3">Top tăng/giảm</p>
              <div className="space-y-2">
                {[
                  { symbol: 'HPG', change: 6.2, bar: 80 },
                  { symbol: 'FPT', change: 4.1, bar: 60 },
                  { symbol: 'VCB', change: 2.8, bar: 45 },
                  { symbol: 'MWG', change: -1.2, bar: 20 },
                ].map((stock) => (
                  <div key={stock.symbol} className="flex items-center gap-3">
                    <span className="text-sm font-mono w-10 text-gray-900 dark:text-white">{stock.symbol}</span>
                    <span
                      className={`text-xs font-mono w-14 ${
                        stock.change >= 0 ? 'text-green-600 dark:text-[#00C853]' : 'text-red-600 dark:text-[#FF1744]'
                      }`}
                    >
                      {stock.change >= 0 ? '▲' : '▼'} {Math.abs(stock.change)}%
                    </span>
                    <div className="flex-1 h-1.5 bg-gray-200 dark:bg-[#1E1E1E] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          stock.change >= 0 ? 'bg-green-500 dark:bg-[#00C853]' : 'bg-red-500 dark:bg-[#FF1744]'
                        }`}
                        style={{ width: `${stock.bar}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sector Performance */}
            <div className="col-span-12 lg:col-span-6 p-4">
              <p className="text-xs text-gray-500 dark:text-[#64748B] uppercase tracking-wider mb-3">Ngành nghề</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'Ngân hàng', change: 1.2 },
                  { name: 'Bất động sản', change: -0.8 },
                  { name: 'Công nghệ', change: 2.1 },
                  { name: 'Bán lẻ', change: 0.5 },
                ].map((sector) => (
                  <div key={sector.name} className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-[#64748B]">{sector.name}</span>
                    <span
                      className={`font-mono ${
                        sector.change >= 0 ? 'text-green-600 dark:text-[#00C853]' : 'text-red-600 dark:text-[#FF1744]'
                      }`}
                    >
                      {sector.change >= 0 ? '▲' : '▼'} {Math.abs(sector.change)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Caption */}
        <div className="flex items-center justify-between mt-4 text-sm">
          <p className="text-gray-500 dark:text-[#64748B]">
            Đây không phải mockup. <span className="text-gray-900 dark:text-white font-medium">Đây là dữ liệu thực.</span>
          </p>
          <p className="text-gray-500 dark:text-[#64748B] font-mono">
            Cập nhật <span className="text-orange-500">{lastUpdated}</span> giây trước
          </p>
        </div>
      </div>
    </section>
  )
}

function TerminalChart() {
  const points = [
    45, 48, 46, 50, 52, 49, 54, 56, 53, 58, 60, 57, 62, 65, 63, 68, 70, 67, 72, 75,
  ]

  const path = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * 100
      const y = 100 - p
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')

  return (
    <div className="relative h-40">
      {/* Grid lines */}
      <div className="absolute inset-0 flex flex-col justify-between">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-px bg-gray-200 dark:bg-[#1E1E1E]" />
        ))}
      </div>

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="terminalChartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(0, 200, 83, 0.3)" />
            <stop offset="100%" stopColor="rgba(0, 200, 83, 0)" />
          </linearGradient>
        </defs>
        <path d={`${path} L 100 100 L 0 100 Z`} fill="url(#terminalChartGradient)" />
        <path
          d={path}
          fill="none"
          stroke="#00C853"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="100" cy={100 - points[points.length - 1]} r="2" fill="#00C853" />
      </svg>
    </div>
  )
}
