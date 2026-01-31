# SmartTrade AI – Product Overview

## SmartTrade AI là gì?

SmartTrade AI là **AI Assistant phân tích kỹ thuật thị trường chứng khoán Việt Nam** theo hướng **insight-driven** — tự động phát hiện tín hiệu kỹ thuật từ dữ liệu giá và khối lượng, rồi thông báo cho người dùng bằng tiếng Việt.

**Core value:** Người dùng không cần ngồi nhìn bảng giá cả ngày. Hệ thống tự phát hiện và giải thích tín hiệu đáng chú ý.

## SmartTrade AI KHÔNG phải là gì?

| Không phải | Lý do |
|------------|-------|
| Fundamental analysis tool | Không phân tích báo cáo tài chính, P/E, EPS |
| Trading bot / auto-trade | Không tự đặt lệnh |
| Real-time price ticker | Không stream giá liên tục (polling 60s) |
| Alert engine đơn thuần | Insight Engine là core, alert chỉ là delivery layer |
| Dự đoán giá / forecast | Chỉ detect patterns, không predict |

## Kiến trúc tổng quan

```
SSI REST API → Polling (60s) → State Manager → Insight Engine (10 detectors)
                                                      ↓
                                              Alert Evaluator (match user rules)
                                                      ↓
                                              AI Explain (Vietnamese output)
                                                      ↓
                                              User Notification
```

## Stack

- **Backend:** FastAPI (Python 3.11+)
- **Frontend:** React + Vite
- **Database:** Supabase (PostgreSQL + Auth)
- **Data source:** SSI FastConnect API (REST, polling-based)
- **AI:** Template-based Vietnamese explanations + LLM fallback (OpenAI)

## Trạng thái hiện tại (v1)

- 10 insight detectors (Price Action, Volume, Technical)
- Alert evaluator với cooldown + daily limit
- Vietnamese explanations cho mọi insight
- Pipeline status monitoring
- **Chưa có:** SSI IDS streaming (on-hold, chờ API key), Redis cache, email notifications

## Đối tượng sử dụng

Nhà đầu tư cá nhân Việt Nam muốn theo dõi tín hiệu kỹ thuật tự động mà không cần chuyên môn sâu về phân tích kỹ thuật.
