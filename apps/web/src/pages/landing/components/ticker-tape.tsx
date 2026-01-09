import { useEffect, useState } from 'react'

interface TickerItem {
  symbol: string
  price: string
  change: number
  changePercent: number
}

const initialTickers: TickerItem[] = [
  { symbol: 'VN-INDEX', price: '1,245.32', change: 12.45, changePercent: 1.01 },
  { symbol: 'HNX', price: '234.56', change: -2.34, changePercent: -0.99 },
  { symbol: 'VNM', price: '76,500', change: 1750, changePercent: 2.34 },
  { symbol: 'FPT', price: '142,800', change: 2800, changePercent: 2.0 },
  { symbol: 'VCB', price: '92,300', change: -500, changePercent: -0.54 },
  { symbol: 'HPG', price: '28,450', change: 1650, changePercent: 6.15 },
  { symbol: 'MWG', price: '54,200', change: -800, changePercent: -1.45 },
  { symbol: 'VIC', price: '42,100', change: 350, changePercent: 0.84 },
]

export function TickerTape() {
  const [tickers, setTickers] = useState(initialTickers)
  const [updatedIndex, setUpdatedIndex] = useState<number | null>(null)

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * tickers.length)
      setTickers((prev) =>
        prev.map((ticker, i) => {
          if (i === randomIndex) {
            const changeAmount = (Math.random() - 0.5) * 100
            const newChange = ticker.change + changeAmount
            const basePrice = parseFloat(ticker.price.replace(/,/g, ''))
            const newPercent = (newChange / basePrice) * 100
            return {
              ...ticker,
              change: Math.round(newChange * 100) / 100,
              changePercent: Math.round(newPercent * 100) / 100,
            }
          }
          return ticker
        })
      )
      setUpdatedIndex(randomIndex)
      setTimeout(() => setUpdatedIndex(null), 500)
    }, 3000)

    return () => clearInterval(interval)
  }, [tickers.length])

  return (
    <div className="border-b border-gray-200 dark:border-[#1E1E1E] bg-gray-50 dark:bg-[#0A0A0A] overflow-hidden">
      <div className="flex animate-ticker">
        {/* Duplicate for seamless loop */}
        {[...tickers, ...tickers].map((ticker, index) => (
          <div
            key={`${ticker.symbol}-${index}`}
            className={`flex items-center gap-3 px-6 py-2 border-r border-gray-200 dark:border-[#1E1E1E] whitespace-nowrap transition-colors duration-300 ${
              updatedIndex === index % tickers.length ? 'bg-gray-100 dark:bg-white/5' : ''
            }`}
          >
            <span className="text-xs font-medium text-gray-500 dark:text-white/60 uppercase tracking-wider">
              {ticker.symbol}
            </span>
            <span className="text-sm font-mono text-gray-900 dark:text-white">{ticker.price}</span>
            <span
              className={`text-xs font-mono ${
                ticker.change >= 0 ? 'text-green-600 dark:text-[#00C853]' : 'text-red-600 dark:text-[#FF1744]'
              }`}
            >
              {ticker.change >= 0 ? '▲' : '▼'} {ticker.change >= 0 ? '+' : ''}
              {ticker.changePercent.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker 40s linear infinite;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}
