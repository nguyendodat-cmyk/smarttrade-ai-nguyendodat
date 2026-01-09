import type { SentimentType, StockRating, MarketSummary, StockAnalysis, SectorInsight } from '@/stores/ai-store'

// ============================================
// MOCK MARKET SUMMARIES
// ============================================

const marketSummaryTemplates: Omit<MarketSummary, 'lastUpdated'>[] = [
  {
    sentiment: 'bullish',
    title: 'Thị trường tăng điểm mạnh mẽ',
    summary: 'VN-Index tăng 1.2% với thanh khoản cao kỷ lục trong tháng. Dòng tiền ngoại quay trở lại mạnh mẽ, tập trung vào nhóm ngân hàng và bất động sản.',
    highlights: [
      'VN-Index vượt mốc kháng cự 1,280 điểm',
      'Khối ngoại mua ròng hơn 500 tỷ đồng',
      'Nhóm ngân hàng dẫn dắt với TCB, VCB tăng trần',
      'Thanh khoản đạt 28,000 tỷ đồng',
      'Breadth thị trường tích cực với 320 mã tăng giá',
    ],
  },
  {
    sentiment: 'bearish',
    title: 'Thị trường điều chỉnh giảm',
    summary: 'VN-Index giảm 0.8% do áp lực chốt lời sau chuỗi tăng điểm. Nhóm cổ phiếu vốn hóa lớn bị bán mạnh, thanh khoản giảm rõ rệt.',
    highlights: [
      'VN-Index mất mốc hỗ trợ 1,260 điểm',
      'Khối ngoại bán ròng 320 tỷ đồng',
      'Nhóm bất động sản giảm sâu, VIC -3.5%',
      'Thanh khoản giảm 20% so với phiên trước',
      'Chỉ có 180 mã tăng giá, 450 mã giảm',
    ],
  },
  {
    sentiment: 'neutral',
    title: 'Thị trường đi ngang chờ tín hiệu',
    summary: 'VN-Index biến động hẹp trong biên độ 5 điểm. Nhà đầu tư thận trọng trước các sự kiện vĩ mô quan trọng, thanh khoản ở mức trung bình.',
    highlights: [
      'VN-Index dao động quanh mốc 1,275 điểm',
      'Khối ngoại giao dịch cân bằng',
      'Phân hóa mạnh giữa các nhóm ngành',
      'Thanh khoản đạt 18,000 tỷ đồng',
      'Chờ số liệu lạm phát và quyết định lãi suất',
    ],
  },
]

// ============================================
// STOCK DATA & ANALYSIS TEMPLATES
// ============================================

interface StockInfo {
  symbol: string
  name: string
  sector: string
  description: string
}

const stockDatabase: Record<string, StockInfo> = {
  VNM: {
    symbol: 'VNM',
    name: 'CTCP Sữa Việt Nam',
    sector: 'Thực phẩm & Đồ uống',
    description: 'công ty sữa hàng đầu Việt Nam với thương hiệu Vinamilk nổi tiếng',
  },
  FPT: {
    symbol: 'FPT',
    name: 'CTCP FPT',
    sector: 'Công nghệ',
    description: 'tập đoàn công nghệ lớn nhất Việt Nam với mảng xuất khẩu phần mềm mạnh',
  },
  VIC: {
    symbol: 'VIC',
    name: 'Tập đoàn Vingroup',
    sector: 'Bất động sản',
    description: 'tập đoàn đa ngành hàng đầu với bất động sản, ô tô điện VinFast, và bán lẻ',
  },
  HPG: {
    symbol: 'HPG',
    name: 'CTCP Tập đoàn Hòa Phát',
    sector: 'Thép & Vật liệu',
    description: 'nhà sản xuất thép lớn nhất Việt Nam với năng lực 8 triệu tấn/năm',
  },
  MWG: {
    symbol: 'MWG',
    name: 'CTCP Đầu tư Thế Giới Di Động',
    sector: 'Bán lẻ',
    description: 'chuỗi bán lẻ điện máy và điện thoại lớn nhất Việt Nam',
  },
  TCB: {
    symbol: 'TCB',
    name: 'Ngân hàng TMCP Techcombank',
    sector: 'Ngân hàng',
    description: 'ngân hàng tư nhân hàng đầu với chiến lược số hóa mạnh mẽ',
  },
  VCB: {
    symbol: 'VCB',
    name: 'Ngân hàng TMCP Ngoại thương',
    sector: 'Ngân hàng',
    description: 'ngân hàng nhà nước lớn nhất với nền tảng khách hàng vững chắc',
  },
  VHM: {
    symbol: 'VHM',
    name: 'CTCP Vinhomes',
    sector: 'Bất động sản',
    description: 'nhà phát triển bất động sản cao cấp hàng đầu thuộc Vingroup',
  },
  MSN: {
    symbol: 'MSN',
    name: 'CTCP Tập đoàn Masan',
    sector: 'Hàng tiêu dùng',
    description: 'tập đoàn tiêu dùng - bán lẻ với WinMart và các thương hiệu FMCG mạnh',
  },
  VRE: {
    symbol: 'VRE',
    name: 'CTCP Vincom Retail',
    sector: 'Bán lẻ',
    description: 'nhà vận hành trung tâm thương mại lớn nhất Việt Nam',
  },
}

const prosTemplates = [
  'Vị thế dẫn đầu thị trường với thị phần lớn',
  'Tài chính lành mạnh, dòng tiền ổn định',
  'Ban lãnh đạo có kinh nghiệm và tầm nhìn',
  'Cổ tức đều đặn, hấp dẫn nhà đầu tư dài hạn',
  'Chiến lược mở rộng rõ ràng và khả thi',
  'Công nghệ và đổi mới sáng tạo liên tục',
  'Thương hiệu mạnh được người tiêu dùng tin tưởng',
  'Lợi thế cạnh tranh bền vững trong ngành',
]

const consTemplates = [
  'Định giá cao so với trung bình ngành',
  'Phụ thuộc nhiều vào thị trường nội địa',
  'Chi phí nguyên vật liệu biến động',
  'Cạnh tranh ngày càng gay gắt',
  'Rủi ro từ chính sách và quy định mới',
  'Tốc độ tăng trưởng có dấu hiệu chậm lại',
  'Nợ vay ở mức cao cần theo dõi',
  'Biên lợi nhuận có xu hướng thu hẹp',
]

const ratingDescriptions: Record<StockRating, string> = {
  strong_buy: 'Khuyến nghị MUA MẠNH',
  buy: 'Khuyến nghị MUA',
  hold: 'Khuyến nghị NẮM GIỮ',
  sell: 'Khuyến nghị BÁN',
  strong_sell: 'Khuyến nghị BÁN MẠNH',
}

// ============================================
// SECTOR INSIGHTS TEMPLATES
// ============================================

const sectorInsightsTemplates: Omit<SectorInsight, 'topStocks'>[] = [
  {
    sector: 'Ngân hàng',
    sentiment: 'bullish',
    summary: 'Nhóm ngân hàng đang được hưởng lợi từ tăng trưởng tín dụng cao và room tín dụng được nới. NIM có xu hướng cải thiện khi lãi suất huy động giảm.',
  },
  {
    sector: 'Bất động sản',
    sentiment: 'neutral',
    summary: 'Thị trường BĐS đang trong giai đoạn hồi phục với các chính sách hỗ trợ từ Chính phủ. Tuy nhiên, dòng tiền vẫn còn hạn chế và pháp lý dự án cần thời gian.',
  },
  {
    sector: 'Công nghệ',
    sentiment: 'bullish',
    summary: 'Ngành CNTT tiếp tục tăng trưởng mạnh nhờ nhu cầu chuyển đổi số và xuất khẩu phần mềm. Các công ty lớn như FPT đang mở rộng thị trường quốc tế.',
  },
  {
    sector: 'Thép & Vật liệu',
    sentiment: 'bearish',
    summary: 'Giá thép toàn cầu suy yếu ảnh hưởng đến biên lợi nhuận các doanh nghiệp. Nhu cầu xây dựng chưa phục hồi như kỳ vọng do thị trường BĐS trầm lắng.',
  },
  {
    sector: 'Bán lẻ',
    sentiment: 'neutral',
    summary: 'Sức mua người tiêu dùng cải thiện dần nhưng vẫn thận trọng. Các chuỗi bán lẻ đang tái cấu trúc và tối ưu chi phí hoạt động.',
  },
  {
    sector: 'Thực phẩm & Đồ uống',
    sentiment: 'bullish',
    summary: 'Ngành F&B hưởng lợi từ tăng trưởng tiêu dùng nội địa. Các doanh nghiệp đầu ngành có lợi thế về thương hiệu và kênh phân phối.',
  },
]

// ============================================
// CHAT RESPONSE TEMPLATES
// ============================================

const chatResponses: Record<string, string[]> = {
  market: [
    'Thị trường hôm nay giao dịch khá tích cực với VN-Index tăng nhẹ 0.5%. Thanh khoản đạt mức trung bình với khoảng 20,000 tỷ đồng. Nhóm ngân hàng và công nghệ là điểm sáng của phiên.',
    'Nhìn chung thị trường đang trong xu hướng tích lũy. VN-Index dao động quanh vùng 1,270-1,290 điểm. Nhà đầu tư nên thận trọng và chờ tín hiệu breakout rõ ràng hơn.',
  ],
  portfolio: [
    'Dựa trên danh mục của bạn, tôi thấy bạn đang có tỷ trọng cao ở nhóm ngân hàng và công nghệ - đây là các ngành có triển vọng tích cực. Tuy nhiên, bạn có thể cân nhắc thêm một số mã phòng thủ để cân bằng rủi ro.',
    'Danh mục của bạn có hiệu suất tốt so với VN-Index trong tháng qua. VNM và FPT đang là 2 mã đóng góp nhiều nhất. Bạn nên cân nhắc chốt lời một phần nếu các mã đã tăng trên 20%.',
  ],
  compare: [
    'So sánh hai mã này, tôi thấy mỗi mã có ưu điểm riêng. Về định giá, P/E của mã đầu thấp hơn nhưng tăng trưởng lợi nhuận lại kém hơn. Bạn nên xem xét mục tiêu đầu tư của mình để chọn mã phù hợp.',
  ],
  recommend: [
    'Dựa trên phân tích kỹ thuật và cơ bản, một số mã đáng chú ý tuần này bao gồm: FPT (breakout vùng kháng cự), TCB (đà tăng mạnh), VNM (định giá hấp dẫn). Tuy nhiên, bạn nên tự nghiên cứu kỹ trước khi quyết định.',
    'Tuần này tôi khuyến nghị quan tâm nhóm ngân hàng như VCB, TCB do kỳ vọng room tín dụng được nới rộng. Ngoài ra, MWG cũng là lựa chọn thú vị sau giai đoạn tái cấu trúc.',
  ],
  default: [
    'Tôi có thể giúp bạn phân tích thị trường, cổ phiếu, hoặc danh mục đầu tư. Bạn có thể hỏi tôi về:\n• Tổng quan thị trường hôm nay\n• Phân tích một mã cổ phiếu cụ thể\n• So sánh các cổ phiếu\n• Khuyến nghị đầu tư',
    'Xin chào! Tôi là trợ lý AI của SmartTrade. Tôi có thể giúp bạn:\n• Tóm tắt diễn biến thị trường\n• Phân tích cổ phiếu\n• Đánh giá danh mục đầu tư\n• Đưa ra các gợi ý đầu tư\n\nBạn muốn tìm hiểu về điều gì?',
  ],
}

// ============================================
// GENERATOR FUNCTIONS
// ============================================

export function generateMarketSummary(): MarketSummary {
  const template = marketSummaryTemplates[Math.floor(Math.random() * marketSummaryTemplates.length)]
  return {
    ...template,
    lastUpdated: new Date().toISOString(),
  }
}

export function generateStockAnalysis(symbol: string): StockAnalysis {
  const stock = stockDatabase[symbol] || {
    symbol,
    name: `Công ty ${symbol}`,
    sector: 'Khác',
    description: 'một công ty niêm yết trên sàn HOSE',
  }

  const shuffledPros = [...prosTemplates].sort(() => Math.random() - 0.5)
  const shuffledCons = [...consTemplates].sort(() => Math.random() - 0.5)

  const ratings: StockRating[] = ['strong_buy', 'buy', 'hold', 'sell', 'strong_sell']
  const rating = ratings[Math.floor(Math.random() * 3)] // Favor positive ratings

  const similarSymbols = Object.keys(stockDatabase)
    .filter((s) => s !== symbol)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)

  return {
    symbol,
    overview: `${stock.symbol} (${stock.name}) là ${stock.description}. Công ty hoạt động trong lĩnh vực ${stock.sector} với vị thế cạnh tranh mạnh trên thị trường.`,
    performance: `Trong 3 tháng gần đây, ${stock.symbol} đã ${Math.random() > 0.5 ? 'tăng' : 'giảm'} ${(Math.random() * 15 + 5).toFixed(1)}% so với đầu kỳ. ${Math.random() > 0.5 ? 'Thanh khoản cải thiện đáng kể' : 'Khối lượng giao dịch ổn định'} với trung bình ${(Math.random() * 2 + 0.5).toFixed(1)} triệu cổ phiếu/phiên.`,
    pros: shuffledPros.slice(0, 3),
    cons: shuffledCons.slice(0, 3),
    rating,
    similarStocks: similarSymbols.map((s) => ({
      symbol: s,
      name: stockDatabase[s]?.name || s,
      reason: `Cùng ngành ${stockDatabase[s]?.sector || 'Khác'}`,
    })),
    lastUpdated: new Date().toISOString(),
  }
}

export function generateSectorInsights(): SectorInsight[] {
  const sectorStocks: Record<string, string[]> = {
    'Ngân hàng': ['VCB', 'TCB', 'MBB', 'ACB'],
    'Bất động sản': ['VIC', 'VHM', 'NVL', 'DXG'],
    'Công nghệ': ['FPT', 'CMG', 'FOX'],
    'Thép & Vật liệu': ['HPG', 'HSG', 'NKG'],
    'Bán lẻ': ['MWG', 'VRE', 'PNJ'],
    'Thực phẩm & Đồ uống': ['VNM', 'SAB', 'MCH'],
  }

  return sectorInsightsTemplates.map((template) => ({
    ...template,
    topStocks: sectorStocks[template.sector] || [],
  }))
}

export function generateChatResponse(message: string): string {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes('thị trường') || lowerMessage.includes('market') || lowerMessage.includes('hôm nay')) {
    return chatResponses.market[Math.floor(Math.random() * chatResponses.market.length)]
  }

  if (lowerMessage.includes('portfolio') || lowerMessage.includes('danh mục')) {
    return chatResponses.portfolio[Math.floor(Math.random() * chatResponses.portfolio.length)]
  }

  if (lowerMessage.includes('so sánh') || lowerMessage.includes('compare')) {
    return chatResponses.compare[Math.floor(Math.random() * chatResponses.compare.length)]
  }

  if (lowerMessage.includes('mua') || lowerMessage.includes('khuyến nghị') || lowerMessage.includes('recommend') || lowerMessage.includes('tuần này')) {
    return chatResponses.recommend[Math.floor(Math.random() * chatResponses.recommend.length)]
  }

  // Check for specific stock symbol
  const stockSymbols = Object.keys(stockDatabase)
  const mentionedStock = stockSymbols.find((s) => lowerMessage.includes(s.toLowerCase()))
  if (mentionedStock) {
    const stock = stockDatabase[mentionedStock]
    return `${stock.symbol} (${stock.name}) là ${stock.description}.\n\nĐây là mã thuộc nhóm ${stock.sector}. Để có phân tích chi tiết hơn, bạn có thể truy cập trang chi tiết cổ phiếu và xem tab "AI Analysis".`
  }

  return chatResponses.default[Math.floor(Math.random() * chatResponses.default.length)]
}

export function getRatingColor(rating: StockRating): string {
  switch (rating) {
    case 'strong_buy':
      return 'text-[var(--color-positive)]'
    case 'buy':
      return 'text-[var(--color-positive)]'
    case 'hold':
      return 'text-[var(--color-warning)]'
    case 'sell':
      return 'text-[var(--color-negative)]'
    case 'strong_sell':
      return 'text-[var(--color-negative)]'
  }
}

export function getRatingBgColor(rating: StockRating): string {
  switch (rating) {
    case 'strong_buy':
      return 'bg-[var(--color-positive)]/10'
    case 'buy':
      return 'bg-[var(--color-positive)]/10'
    case 'hold':
      return 'bg-[var(--color-warning)]/10'
    case 'sell':
      return 'bg-[var(--color-negative)]/10'
    case 'strong_sell':
      return 'bg-[var(--color-negative)]/10'
  }
}

export function getRatingLabel(rating: StockRating): string {
  return ratingDescriptions[rating]
}

export function getSentimentColor(sentiment: SentimentType): string {
  switch (sentiment) {
    case 'bullish':
      return 'text-[var(--color-positive)]'
    case 'bearish':
      return 'text-[var(--color-negative)]'
    case 'neutral':
      return 'text-[var(--color-warning)]'
  }
}

export function getSentimentBgColor(sentiment: SentimentType): string {
  switch (sentiment) {
    case 'bullish':
      return 'bg-[var(--color-positive)]/10'
    case 'bearish':
      return 'bg-[var(--color-negative)]/10'
    case 'neutral':
      return 'bg-[var(--color-warning)]/10'
  }
}

export function getSentimentLabel(sentiment: SentimentType): string {
  switch (sentiment) {
    case 'bullish':
      return 'Tích cực'
    case 'bearish':
      return 'Tiêu cực'
    case 'neutral':
      return 'Trung lập'
  }
}

export function getSentimentEmoji(sentiment: SentimentType): string {
  switch (sentiment) {
    case 'bullish':
      return '🟢'
    case 'bearish':
      return '🔴'
    case 'neutral':
      return '🟡'
  }
}
