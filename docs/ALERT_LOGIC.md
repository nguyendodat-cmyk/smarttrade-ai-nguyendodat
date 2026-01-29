# Alert Logic – Cooldown, Severity & User Relevance

## Flow tổng quan

```
InsightEvent (từ Insight Engine)
    ↓
1. Query smart_alerts WHERE symbol = insight.symbol AND is_active = true
    ↓
2. Condition match: symbol + insight_codes filter + severity threshold
    ↓
3. Cooldown check: per (user_id, symbol, insight_code)
    ↓
4. Daily limit check: per user_id
    ↓
5. Generate Vietnamese explanation (AI Explain Service)
    ↓
6. Create AlertNotification → record to smart_alert_history
```

## Condition Matching

Mỗi `UserAlert` có 3 filter:

| Field | Ý nghĩa | Default |
|-------|---------|---------|
| `symbol` | Mã CK (bắt buộc match) | Required |
| `insight_codes` | Danh sách codes cho phép, VD: `["PA01", "TM04"]` | `null` = match all |
| `min_severity` | Ngưỡng tối thiểu: low/medium/high/critical | `null` = match all |

Logic:
```python
match = (
    alert.symbol == event.symbol
    AND (alert.insight_codes is None OR event.insight_code in alert.insight_codes)
    AND (alert.min_severity is None OR event.severity >= alert.min_severity)
)
```

## Cooldown

Mục đích: Tránh spam cùng 1 loại insight cho cùng 1 user.

| Severity | Cooldown |
|----------|----------|
| Low / Medium | 300s (5 phút) |
| High / Critical | 600s (10 phút) |

Key cooldown: `(user_id, symbol, insight_code)`.

Ví dụ: User A watch VIC, PA01 trigger lúc 09:15 → alert bắn. PA01 trigger lại 09:18 → cooldown chặn. PA01 trigger 09:21 → alert bắn (5 phút đã hết).

**Lưu ý:** Cooldown lưu in-memory. Sau restart, cooldown bị reset → có thể bắn duplicate. Đây là known limitation, sẽ fix bằng warm-up delay (Sprint C.2).

## Daily Limit

| Config | Giá trị |
|--------|---------|
| `ALERT_MAX_PER_USER_PER_DAY` | 50 |

- Reset mỗi ngày UTC (00:00 UTC)
- Khi user hit cap: alert bị chặn + log warning
- Counter lưu in-memory, reset khi restart

## Deduplication (2 lớp)

| Lớp | Scope | Window | Vị trí |
|-----|-------|--------|--------|
| Insight Engine | `(symbol, insight_code)` | 5 phút | Trước khi sinh InsightEvent |
| Alert Evaluator | `(user_id, symbol, insight_code)` | 5-10 phút | Trước khi bắn alert |

Worst case per code per symbol: **12 insights/giờ**, **12 alerts/giờ/user**.

## Severity Levels

| Level | Ý nghĩa | Ví dụ |
|-------|---------|-------|
| `low` | Thông tin tham khảo | (chưa dùng trong v1) |
| `medium` | Tín hiệu đáng chú ý | PA01 body 75%, VA02 divergence |
| `high` | Tín hiệu mạnh | PA01 body >85%, TM02 MA cross, RSI >80 |
| `critical` | Cảnh báo khẩn | (chưa dùng trong v1) |

## Vietnamese Explanation

Mỗi insight code có template tiếng Việt cố định. Template chỉ substitute signals numeric — không bịa thêm data.

Fallback chain:
1. Template tiếng Việt (nhanh, deterministic)
2. LLM call (nếu template fail hoặc code không biết)
3. `raw_explanation` (English, last resort)

## Database Schema

```sql
-- User alert rules
smart_alerts (id, user_id, name, symbol, is_active, ...)

-- Alert conditions (per alert)
smart_alert_conditions (id, alert_id, indicator, operator, value, ...)

-- Trigger history
smart_alert_history (id, alert_id, user_id, triggered_at, trigger_data, notification_sent, ...)
```
