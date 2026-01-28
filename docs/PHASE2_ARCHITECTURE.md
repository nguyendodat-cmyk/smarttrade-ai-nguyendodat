# PHASE 2: Realtime Market Data Streaming - Architecture

## 🎯 Mục tiêu

Xây dựng pipeline streaming real-time từ SSI IDS → Backend → Frontend để phục vụ:
- Bảng giá realtime
- Biểu đồ realtime
- Alert / Watchlist

---

## 📐 Kiến trúc tổng quát

```
┌─────────────────────────────────────────────────────────────────┐
│                    SSI IDS WebSocket Stream                     │
│         wss://fc-tradingapi.ssi.com.vn/realtime                │
│  Channels: X (ticks), B (bars), I (indices), N (news)          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ WebSocket Connection
                             │ Binary/JSON Messages
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                 SSI IDS Streaming Client                        │
│                 (ssi_streaming_client.py)                       │
│  - WebSocket connection management                              │
│  - Authentication (private key)                                 │
│  - Subscribe/Unsubscribe symbols                                │
│  - Heartbeat/Reconnection                                       │
│  - Message queue                                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Raw Messages
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Tick Data Parser                             │
│                  (tick_data_parser.py)                          │
│  - Parse binary/JSON messages                                   │
│  - Extract: symbol, price, volume, timestamp                    │
│  - Normalize data format                                        │
│  - Validate data integrity                                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Parsed Tick Objects
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              In-Memory Realtime State Manager                   │
│               (realtime_state_manager.py)                       │
│  - Dict[symbol -> TickData]                                     │
│  - Thread-safe updates (asyncio.Lock)                           │
│  - O(1) lookup by symbol                                        │
│  - Auto-cleanup stale data (>5min)                              │
│  - Subscribe/Unsubscribe tracking                               │
└────────────┬───────────────────────────────┬────────────────────┘
             │                               │
             │ Query State                   │ Push Updates
             ▼                               ▼
┌──────────────────────────┐   ┌────────────────────────────────┐
│  WebSocket Endpoint      │   │   Alert Engine (PHASE 3)       │
│  (routers/realtime.py)   │   │   - Subscribe symbols          │
│  GET /api/v1/realtime/ws │   │   - Evaluate on tick           │
│  - Client subscribes     │   │   - Trigger alerts             │
│  - Server pushes updates │   └────────────────────────────────┘
│  - JSON format           │
└──────────┬───────────────┘
           │
           │ WebSocket (JSON)
           ▼
┌──────────────────────────┐
│   Frontend Client        │
│   - Connect to /ws       │
│   - Subscribe symbols    │
│   - Receive tick updates │
│   - Update UI            │
└──────────────────────────┘
```

---

## 📂 Danh sách Files sẽ tạo

### Bước 2.1: SSI IDS Streaming Client

```
apps/ai-service/app/
├── services/
│   └── ssi_streaming_client.py       (NEW) - WebSocket client core
│
└── scripts/
    └── test_streaming.py              (NEW) - Standalone test script
```

**Chức năng:**
- `ssi_streaming_client.py`:
  - Class `SSIStreamingClient`
  - Connect to SSI IDS WebSocket
  - Authenticate with private key
  - Subscribe/Unsubscribe symbols
  - Handle reconnection
  - Message callback system

- `test_streaming.py`:
  - Standalone script để test streaming
  - Không cần start full backend
  - Log rõ ràng từng bước
  - Có thể chạy: `python scripts/test_streaming.py`

### Bước 2.2: Tick Data Parser

```
apps/ai-service/app/
├── models/
│   └── realtime_models.py             (NEW) - Pydantic models cho tick data
│
└── services/
    └── tick_data_parser.py            (NEW) - Parse SSI messages
```

**Chức năng:**
- `realtime_models.py`:
  - `TickData` - Single tick/trade
  - `QuoteTick` - Bid/Ask update
  - `BarTick` - 1-min OHLC bar

- `tick_data_parser.py`:
  - Parse binary messages (if binary format)
  - Parse JSON messages
  - Convert to TickData objects

### Bước 2.3: In-Memory State Manager

```
apps/ai-service/app/
└── services/
    └── realtime_state_manager.py      (NEW) - In-memory state
```

**Chức năng:**
- Dict: `symbol -> TickData`
- Thread-safe updates
- Query methods: `get_tick(symbol)`, `get_all_ticks()`
- Subscribe tracking
- Auto-cleanup stale data

### Bước 2.4: WebSocket Endpoint

```
apps/ai-service/app/
└── routers/
    └── realtime.py                    (NEW) - WebSocket endpoint
```

**Chức năng:**
- `GET /api/v1/realtime/ws` - WebSocket endpoint
- Client subscribe to symbols
- Push updates to clients
- Handle disconnect/reconnect

### Documentation & Testing

```
docs/
├── PHASE2_ARCHITECTURE.md             (THIS FILE)
└── PHASE2_TESTING.md                  (NEW) - Testing guide

scripts/
├── test_streaming.py                  (NEW) - Test Step 2.1
├── test_parser.py                     (NEW) - Test Step 2.2
├── test_state_manager.py              (NEW) - Test Step 2.3
└── test_websocket_client.py           (NEW) - Test Step 2.4
```

---

## 🔄 Data Flow chi tiết

### 1. Connection Flow

```
[Startup]
  → SSIStreamingClient.connect()
  → Send authentication (private key)
  → Receive session confirmation
  → Ready to subscribe
```

### 2. Subscribe Flow

```
[Subscribe to VIC, VNM, HPG]
  → SSIStreamingClient.subscribe(["VIC", "VNM", "HPG"])
  → Send subscribe message to SSI
  → Receive subscription confirmation
  → Start receiving ticks
```

### 3. Tick Update Flow

```
[SSI sends tick for VIC]
  → SSIStreamingClient receives raw message
  → TickDataParser.parse(message) → TickData object
  → RealtimeStateManager.update("VIC", tick_data)
  → Notify all subscribed WebSocket clients
  → Frontend updates UI
```

### 4. Query Flow

```
[Frontend requests current price for VIC]
  → GET /api/v1/realtime/state?symbol=VIC
  → RealtimeStateManager.get_tick("VIC")
  → Return latest TickData
```

---

## 🧪 Testing Strategy

### Bước 2.1 Testing (Streaming Client)

**Test Script:** `python scripts/test_streaming.py`

**Expected Output:**
```
[INFO] Connecting to SSI IDS WebSocket...
[INFO] Connected successfully
[INFO] Authenticating...
[INFO] Authentication successful
[INFO] Subscribing to symbols: VIC, VNM, HPG
[INFO] Subscription confirmed
[INFO] Receiving ticks...
[TICK] VIC | Price: 45500 | Volume: 100 | Time: 2024-01-19 09:15:23
[TICK] VNM | Price: 87200 | Volume: 200 | Time: 2024-01-19 09:15:24
[TICK] HPG | Price: 28300 | Volume: 500 | Time: 2024-01-19 09:15:25
```

**Test Cases:**
- ✅ Connect to WebSocket
- ✅ Authenticate with credentials
- ✅ Subscribe to symbols
- ✅ Receive and log ticks
- ✅ Handle reconnection
- ✅ Graceful shutdown

### Bước 2.2 Testing (Parser)

**Test Script:** `python scripts/test_parser.py`

**Sample Input/Output:**
```python
# Input: SSI raw message (JSON or binary)
raw_message = {
    "sym": "VIC",
    "lastPrice": 45500,
    "lastVolume": 100,
    "time": "09:15:23"
}

# Output: TickData object
tick = TickDataParser.parse(raw_message)
# TickData(
#   symbol="VIC",
#   price=45500,
#   volume=100,
#   timestamp=datetime(2024, 1, 19, 9, 15, 23)
# )
```

### Bước 2.3 Testing (State Manager)

**Test Script:** `python scripts/test_state_manager.py`

**Test Cases:**
```python
manager = RealtimeStateManager()

# Update tick
manager.update("VIC", TickData(symbol="VIC", price=45500, volume=100))

# Query tick
tick = manager.get_tick("VIC")
assert tick.price == 45500

# Get all ticks
all_ticks = manager.get_all_ticks()
assert "VIC" in all_ticks
```

### Bước 2.4 Testing (WebSocket Endpoint)

**Test Tool:** [websocat](https://github.com/vi/websocat) hoặc Python script

**Example:**
```bash
# Windows (with websocat)
websocat ws://localhost:8000/api/v1/realtime/ws

# Send subscribe message
{"action": "subscribe", "symbols": ["VIC", "VNM"]}

# Receive updates
{"type": "tick", "symbol": "VIC", "price": 45500, "volume": 100}
```

---

## 🛠️ Dependencies cần thêm

```python
# requirements.txt additions:
websockets>=12.0          # WebSocket client
websocket-client>=1.7.0   # Alternative WebSocket client
python-socketio>=5.11.0   # If SSI uses Socket.IO
```

---

## 🚀 Deployment Notes

### Development Mode
- Streaming client runs in same process as FastAPI
- Auto-start on app startup
- Auto-subscribe to symbols from active alerts/watchlists

### Production Mode
- Consider separate process for streaming (reliability)
- Use Redis pub/sub for multi-instance communication
- Monitoring & alerting on connection failures

---

## 📋 PHASE 2 Roadmap

| Bước | Deliverable | Test Method | Status |
|------|-------------|-------------|--------|
| 2.1 | SSI IDS Streaming Client | `test_streaming.py` | 🔄 In Progress |
| 2.2 | Tick Data Parser | `test_parser.py` | ⏳ Pending |
| 2.3 | State Manager | `test_state_manager.py` | ⏳ Pending |
| 2.4 | WebSocket Endpoint | WebSocket client test | ⏳ Pending |

---

## 🔐 SSI IDS Authentication

SSI IDS requires different auth than REST API:

**REST API (PHASE 1):**
- Consumer ID + Consumer Secret
- Returns JWT token
- Used for HTTP requests

**IDS Streaming (PHASE 2):**
- Public Key + Private Key (different credentials)
- WebSocket-specific auth
- Need to request from SSI support

**How to get IDS credentials:**
1. Contact SSI support: api@ssi.com.vn
2. Request IDS streaming access
3. Receive Public Key + Private Key
4. Add to `.env`:
   ```
   SSI_PUBLIC_KEY=your-public-key
   SSI_PRIVATE_KEY=your-private-key
   ```

---

## 📞 Next Steps

1. **Bước 2.1:** Implement SSI IDS Streaming Client
2. Create test script
3. Document authentication process
4. Test connection & subscription
5. Move to Bước 2.2 after confirmation

---

**Author:** Claude
**Date:** 2024-01-19
**Status:** Architecture Complete, Implementation Starting
