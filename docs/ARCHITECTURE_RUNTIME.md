# Architecture & Runtime Behavior

## Pipeline Runtime

```
┌─────────────────────────────────────────────────────────┐
│                    SSI REST API                         │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Market Polling Service                                 │
│  • Tiers: default=60s, watchlist=30s, hot=15s           │
│  • Rate limit: 150ms giữa requests                     │
│  • Batch size: 20 symbols/batch                         │
│  • Output: List[PriceBar] → callback on_bars_update()   │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Market State Manager                                   │
│  • Rolling windows: 60×1m + 50×daily (in-memory deque)  │
│  • Dedup by timestamp                                   │
│  • Session tracking: daily high/low/volume reset        │
│  • Snapshot: computed view (MA20, MA50, RSI14)          │
│  • Stale detection: > 300s no update                    │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Insight Engine (10 detectors)                          │
│  • Async parallel execution                             │
│  • Dedup: 5 min per (symbol, insight_code)              │
│  • Log: JSONL → logs/insights.jsonl                     │
│  • Callback: notify subscribers (Alert Evaluator)       │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Alert Evaluator                                        │
│  • Match insight → user alerts (DB query)               │
│  • Cooldown: 5min (default) / 10min (high severity)     │
│  • Daily cap: 50/user/day                               │
│  • Output: AlertNotification with Vietnamese message    │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  AI Explain Service                                     │
│  • Template-based Vietnamese (10 templates)             │
│  • LLM fallback (OpenAI)                                │
│  • Raw explanation fallback                             │
└─────────────────────────────────────────────────────────┘
```

## In-Memory State

**Tất cả state chính đều in-memory.** Không dùng Redis trong v1.

| Component | State | Mất khi restart |
|-----------|-------|-----------------|
| State Manager | Rolling bars (deque) | ✅ Mất toàn bộ |
| Insight Engine | Dedup cache | ✅ Mất |
| Alert Evaluator | Cooldown cache | ✅ Mất |
| Alert Evaluator | Daily count | ✅ Mất (reset về 0) |
| Alert Evaluator | Notification history | ✅ Mất (DB có backup) |
| Pipeline Monitor | Rolling counters | ✅ Mất |

## Restart Behavior

### Sequence sau restart:
1. App start → services khởi tạo (state rỗng)
2. Polling bắt đầu → fetch bars từ SSI
3. State Manager nhận bars → build rolling windows
4. Insight Engine chạy analyze → có thể detect insights ngay

### Rủi ro cụ thể:

**1. False insights do thiếu history**

| Detector | Min data cần | Có guard? |
|----------|-------------|-----------|
| PA01, PA02 | 5 bars 1m | ❌ KHÔNG — chạy trên bất kỳ số bar nào |
| PA03 | 2 bars daily | ✅ Guard |
| PA04 | 20 bars daily | ✅ Guard |
| VA01-VA03 | 20 bars daily | ✅ Guard |
| TM02 | 51 bars daily | ✅ Guard |
| TM04, TM05 | 15 bars daily | ✅ Guard (RSI returns None) |

→ PA01/PA02 có thể fire trên 1-2 bars. Rủi ro thấp nhưng cần fix (Sprint C.2).

**2. Alert spam sau restart**
- Cooldown cache bị reset → alert có thể bắn lại cho insight đã bắn trước restart
- Fix planned: warm-up delay 3-5 phút sau startup (Sprint C.2)

**3. Daily count reset**
- Daily count trở về 0 → user có thể nhận thêm alerts ngoài cap
- Fix planned: persist to DB hoặc warm-up delay

## Known Technical Limitations (v1)

| # | Limitation | Impact | Severity |
|---|-----------|--------|----------|
| 1 | RSI dùng SMA thay vì Wilder's EMA | Giá trị RSI hơi khác TradingView | Low |
| 2 | VA03 top 5% với 20 bars = top 1 | Heuristic, không chính xác thống kê | Low |
| 3 | Thresholds hardcode, chưa backtest | Có thể không optimal cho thị trường VN | Medium |
| 4 | 1 DB query per InsightEvent per user | Chậm nếu >200 symbols | Medium |
| 5 | TM02 chỉ detect event, không detect state | User mới không biết cross đang active | Low |
| 6 | Cooldown/state in-memory | Mất khi restart | Medium |

Tất cả đều là **trade-off có ý thức** cho v1. Sẽ fix khi có user feedback thực tế.

## Deployment: Single Worker Requirement

**Production v1 PHẢI chạy single worker** cho pipeline process (polling + insight + alert).

Lý do: Tất cả state (deque, cooldown cache, dedup cache, rolling counters) đều in-memory, không share giữa workers.

```bash
# Đúng: 1 worker cho pipeline
uvicorn app.main:app --workers 1

# SAI: nhiều workers sẽ gây split state, duplicate alerts
uvicorn app.main:app --workers 4  # KHÔNG dùng cho v1
```

Nếu cần scale API read-only (GET endpoints) riêng, tách thành:
- 1 process "pipeline worker" (polling + insight + alert)
- N process "api-only" (chỉ serve GET, không chạy pipeline)

Multi-worker requires Redis shared state — chưa implement trong v1.

## Config Reference

```env
# Polling
POLLING_ENABLED=True
POLLING_INTERVAL_DEFAULT=60
POLLING_INTERVAL_WATCHLIST=30
POLLING_INTERVAL_HOT=15
POLLING_BATCH_SIZE=20

# State Manager
STATE_ROLLING_WINDOW_1M=60
STATE_ROLLING_WINDOW_DAILY=50
STATE_STALE_THRESHOLD=300

# Insight Engine
INSIGHT_ENGINE_ENABLED=True
INSIGHT_DEDUP_WINDOW=300
INSIGHT_LOG_FILE=logs/insights.jsonl

# Alert Evaluator
ALERT_COOLDOWN_DEFAULT=300
ALERT_COOLDOWN_HIGH=600
ALERT_MAX_PER_USER_PER_DAY=50
```

## Monitoring

Endpoint: `GET /api/v1/alerts/pipeline/status`

Trả về trạng thái toàn bộ pipeline với rolling 5-phút counters:
- `polling`: running, last_poll_at, symbols count
- `state_manager`: symbols in state, stale count
- `insight_engine`: insights total + last 5m
- `alert_evaluator`: alerts today + last 5m, daily cap hits
- `ai_explain`: template success/fallback counts
