# Insight Catalog v1 – 10 Detectors

## Tổng quan

Insight Engine chạy 10 detectors song song cho mỗi symbol. Mỗi detector là **deterministic** (không dùng AI/ML), dựa trên rules cố định với thresholds đã định.

Deduplication: 5 phút per `(symbol, insight_code)`.

---

## Price Action (PA)

### PA01 – Strong Bullish Candle
- **Rule:** `body / range > 0.70` AND `is_bullish = true`
- **Data:** `bars_1m[-5:]` (5 nến 1 phút gần nhất)
- **Severity:** Medium (>70%) / High (>85%)
- **Signals:** `body_percent`, `close_change_pct`, `range`
- **Output mẫu:** _"Nến tăng mạnh với thân nến chiếm 85% biên độ, giá đóng cửa tăng +1.2% so với mở cửa."_
- **⚠️ Known:** Chưa có `min_bars` guard — nếu chỉ có 1 bar vẫn chạy.

### PA02 – Upper Wick Rejection
- **Rule:** `upper_wick / range > 0.50`
- **Data:** `bars_1m[-5:]`
- **Severity:** Medium (>50%) / High (>65%)
- **Signals:** `upper_wick_percent`, `high`, `close`
- **Output mẫu:** _"Nến có bóng trên dài (55% biên độ), bị từ chối tại mức 120,000."_
- **⚠️ Known:** Chưa có `min_bars` guard.

### PA03 – Gap Up/Down
- **Rule:** `|today.open - prev.close| / prev.close > 1%`
- **Data:** `bars_daily[-2:]` (cần ≥ 2 bars daily)
- **Severity:** Medium (>1%) / High (>2%)
- **Signals:** `gap_percent`, `prev_close`, `today_open`
- **Output mẫu:** _"Gap tăng +2.1% so với phiên trước."_

### PA04 – Failed Breakout
- **Rule:** `today.high >= max(19 ngày trước)` AND `today.close < today.open`
- **Data:** `bars_daily[-20:]` (cần ≥ 20 bars)
- **Severity:** Medium
- **Signals:** `high_20d`, `today_high`, `today_close`
- **Output mẫu:** _"Thất bại breakout: chạm đỉnh 20 phiên nhưng đóng cửa giảm."_

---

## Volume Analysis (VA)

### VA01 – High Volume Breakout
- **Rule:** `today.volume / avg_vol_19d > 2.0` AND `|price_change| > 0.5%`
- **Data:** `bars_daily[-20:]` (cần ≥ 20 bars)
- **Severity:** Medium (>2x) / High (>3x)
- **Signals:** `volume_ratio`, `price_change_pct`, `volume`
- **Output mẫu:** _"Breakout với khối lượng cao gấp 2.5 lần trung bình."_

### VA02 – Price Up Volume Down (Divergence)
- **Rule:** `price_change > 0.8%` AND `vol_ratio < 0.65`
- **Data:** `bars_daily[-20:]` (cần ≥ 20 bars)
- **Severity:** Medium
- **Signals:** `price_change_pct`, `volume_ratio`
- **Output mẫu:** _"Giá tăng +1.2% nhưng khối lượng chỉ đạt 55% trung bình."_

### VA03 – Volume Climax
- **Rule:** `today.volume >= percentile_95(20 bars)`
- **Data:** `bars_daily[-20:]` (cần ≥ 20 bars)
- **Severity:** Medium
- **Signals:** `volume`, `threshold_95pct`
- **⚠️ Known:** Với 20 bars, `int(20 * 0.95) = 19` → thực tế là top 1 (bar cao nhất), không phải top 5%. Cần ≥ 40 bars để top 5% có ý nghĩa thống kê. Chấp nhận cho v1 — heuristic.

---

## Technical / Momentum (TM)

### TM02 – MA Cross (Golden / Death)
- **Rule:** `prev_ma20 ≤ prev_ma50` AND `ma20 > ma50` (golden), hoặc ngược lại (death)
- **Data:** `bars_daily[-51:]` (cần ≥ 51 bars)
- **Severity:** High
- **Signals:** `ma20`, `ma50`, `cross_type`
- **Output mẫu:** _"Golden Cross: MA20 cắt lên trên MA50. Tín hiệu tăng giá trung hạn."_
- **⚠️ Known:** Chỉ detect "event" (lúc cắt), không detect "state" (đang ở trên/dưới). Sau restart, nếu MA đã cross trước đó thì không phát hiện lại.

### TM04 – RSI Overbought
- **Rule:** `rsi14 > 70`
- **Data:** Snapshot RSI (cần ≥ 15 bars daily)
- **Severity:** Medium (>70) / High (>80)
- **Signals:** `rsi14`
- **Output mẫu:** _"RSI đạt 75.3 (quá mua, >70). Cân nhắc chốt lời."_
- **⚠️ Known:** RSI tính bằng SMA, không phải Wilder's EMA. Kết quả hơi khác TradingView.

### TM05 – RSI Oversold
- **Rule:** `rsi14 < 30`
- **Data:** Snapshot RSI (cần ≥ 15 bars daily)
- **Severity:** Medium (<30) / High (<20)
- **Signals:** `rsi14`
- **Output mẫu:** _"RSI xuống 22.1 (quá bán, <30). Cân nhắc mua vào."_

---

## Threshold Summary

| Code | Key Threshold | Hardcoded | Cần calibrate? |
|------|--------------|-----------|----------------|
| PA01 | body > 70% range | Có | Nên backtest với data VN |
| PA02 | wick > 50% range | Có | Chấp nhận |
| PA03 | gap > 1% | Có | OK cho HOSE (±7% band) |
| PA04 | 20-day high | Có | OK |
| VA01 | vol > 2x avg | Có | Nên backtest |
| VA02 | price +0.8%, vol < 0.65x | Có | Nên backtest |
| VA03 | top 5% (heuristic) | Có | Cần ≥40 bars |
| TM02 | MA20/MA50 cross | N/A | OK |
| TM04 | RSI > 70 | Có | Standard |
| TM05 | RSI < 30 | Có | Standard |
