# PHASE 2: Testing Guide - Windows

Hướng dẫn test từng bước PHASE 2 trên Windows.

---

## 🔧 Chuẩn bị môi trường

### 1. Python Dependencies

```bash
# Activate virtual environment
cd apps/ai-service
venv\Scripts\activate

# Install new dependencies for PHASE 2
pip install websockets==12.0
pip install websocket-client==1.7.0
pip install python-socketio==5.11.0
```

### 2. Environment Variables

Thêm vào `apps/ai-service/.env`:

```env
# SSI IDS Streaming Credentials (request từ SSI support)
SSI_PUBLIC_KEY=your-ssi-public-key
SSI_PRIVATE_KEY=your-ssi-private-key
SSI_STREAMING_URL=wss://fc-tradingapi.ssi.com.vn/realtime
```

**⚠️ Lưu ý:** SSI IDS credentials KHÁC với REST API credentials:
- REST API: `SSI_CONSUMER_ID` + `SSI_CONSUMER_SECRET`
- IDS Streaming: `SSI_PUBLIC_KEY` + `SSI_PRIVATE_KEY`

---

## 🧪 BƯỚC 2.1: Test SSI IDS Streaming Client

### Chạy Test Script

```bash
# Từ root directory
python scripts/test_streaming.py
```

### Expected Output

```
╔═══════════════════════════════════════════════════════════════╗
║          SSI IDS Streaming Client - Test Script              ║
╚═══════════════════════════════════════════════════════════════╝

[2024-01-19 09:15:00] INFO - Loading configuration...
[2024-01-19 09:15:00] INFO - ✓ SSI_STREAMING_URL: wss://fc-tradingapi.ssi.com.vn/realtime
[2024-01-19 09:15:00] INFO - ✓ SSI_PUBLIC_KEY configured
[2024-01-19 09:15:00] INFO - ✓ SSI_PRIVATE_KEY configured

[2024-01-19 09:15:01] INFO - Connecting to SSI IDS WebSocket...
[2024-01-19 09:15:02] INFO - ✓ Connected successfully

[2024-01-19 09:15:02] INFO - Authenticating...
[2024-01-19 09:15:03] INFO - ✓ Authentication successful
[2024-01-19 09:15:03] INFO - Session ID: abc123xyz

[2024-01-19 09:15:04] INFO - Subscribing to symbols: VIC, VNM, HPG
[2024-01-19 09:15:05] INFO - ✓ Subscription confirmed

[2024-01-19 09:15:06] INFO - Receiving ticks... (Press Ctrl+C to stop)

[TICK] VIC   | Price: 45,500 | Vol: 100   | Time: 09:15:06 | Chg: +0.22%
[TICK] VNM   | Price: 87,200 | Vol: 200   | Time: 09:15:07 | Chg: -0.11%
[TICK] HPG   | Price: 28,300 | Vol: 500   | Time: 09:15:08 | Chg: +0.35%
[TICK] VIC   | Price: 45,600 | Vol: 150   | Time: 09:15:10 | Chg: +0.44%
[TICK] VNM   | Price: 87,100 | Vol: 300   | Time: 09:15:12 | Chg: -0.23%

────────────────────────────────────────────────────────────────
Ticks received: 5
Uptime: 00:00:12
Status: Connected
────────────────────────────────────────────────────────────────

^C
[2024-01-19 09:15:18] INFO - Shutting down...
[2024-01-19 09:15:18] INFO - Unsubscribing from symbols...
[2024-01-19 09:15:19] INFO - ✓ Unsubscribed
[2024-01-19 09:15:19] INFO - Closing WebSocket connection...
[2024-01-19 09:15:20] INFO - ✓ Connection closed gracefully

╔═══════════════════════════════════════════════════════════════╗
║                    Test Summary                               ║
╚═══════════════════════════════════════════════════════════════╝

✓ Connection successful
✓ Authentication successful
✓ Subscription successful
✓ Received 5 ticks
✓ Graceful shutdown

Test PASSED ✓
```

### Troubleshooting

#### Error: "Connection refused"
```
[ERROR] Failed to connect to SSI IDS WebSocket
[ERROR] ConnectionRefusedError: [Errno 111] Connection refused
```

**Giải pháp:**
1. Check internet connection
2. Verify `SSI_STREAMING_URL` is correct
3. Check if SSI IDS service is running (market hours)
4. Firewall might be blocking WebSocket connections

#### Error: "Authentication failed"
```
[ERROR] Authentication failed
[ERROR] Invalid credentials
```

**Giải pháp:**
1. Verify `SSI_PUBLIC_KEY` and `SSI_PRIVATE_KEY` are correct
2. Check if credentials are activated by SSI
3. Contact SSI support if issue persists

#### Error: "Subscription failed"
```
[WARN] Subscription failed for symbols: VIC, VNM
[ERROR] Invalid symbols or not authorized
```

**Giải pháp:**
1. Check symbol names are correct (uppercase)
2. Verify your account has access to these symbols
3. Try with common symbols: VIC, VNM, HPG, VCB

---

## 🧪 BƯỚC 2.2: Test Tick Data Parser

### Chạy Test Script

```bash
python scripts/test_parser.py
```

### Expected Output

```
╔═══════════════════════════════════════════════════════════════╗
║              Tick Data Parser - Test Script                   ║
╚═══════════════════════════════════════════════════════════════╝

Testing JSON message parsing...

Input (Raw SSI Message):
{
  "sym": "VIC",
  "lastPrice": 45500,
  "lastVolume": 100,
  "time": "09:15:23",
  "change": 100,
  "changePc": 0.22,
  "bidPrice1": 45400,
  "bidVolume1": 1000,
  "askPrice1": 45600,
  "askVolume1": 800
}

Output (Parsed TickData):
TickData(
  symbol='VIC',
  price=45500.0,
  volume=100,
  timestamp=datetime(2024, 1, 19, 9, 15, 23),
  change=100.0,
  change_percent=0.22,
  bid_price=45400.0,
  bid_volume=1000,
  ask_price=45600.0,
  ask_volume=800
)

✓ Symbol parsed correctly: VIC
✓ Price parsed correctly: 45500.0
✓ Volume parsed correctly: 100
✓ Timestamp parsed correctly: 2024-01-19 09:15:23
✓ Bid/Ask parsed correctly

Test PASSED ✓
```

---

## 🧪 BƯỚC 2.3: Test Realtime State Manager

### Chạy Test Script

```bash
python scripts/test_state_manager.py
```

### Expected Output

```
╔═══════════════════════════════════════════════════════════════╗
║           Realtime State Manager - Test Script                ║
╚═══════════════════════════════════════════════════════════════╝

Test 1: Update and Query Single Symbol
  → Updating VIC tick (price=45500, volume=100)
  ✓ Update successful
  → Querying VIC
  ✓ Retrieved tick: VIC @ 45500

Test 2: Update Multiple Symbols
  → Updating VNM (87200), HPG (28300), VCB (92500)
  ✓ All updates successful
  → Query all symbols
  ✓ Retrieved 4 symbols: VIC, VNM, HPG, VCB

Test 3: Thread Safety (Concurrent Updates)
  → Running 100 concurrent updates...
  ✓ No race conditions detected
  ✓ All updates completed successfully

Test 4: Stale Data Cleanup
  → Creating tick with old timestamp (6 minutes ago)
  → Running cleanup...
  ✓ Stale data removed
  ✓ Recent data preserved

Test 5: Subscribe/Unsubscribe Tracking
  → Subscribe to VIC, VNM
  ✓ Subscriptions tracked: VIC, VNM
  → Unsubscribe from VNM
  ✓ Subscriptions updated: VIC

All Tests PASSED ✓
```

---

## 🧪 BƯỚC 2.4: Test WebSocket Endpoint

### Option 1: Python Test Client

```bash
python scripts/test_websocket_client.py
```

**Expected Output:**
```
╔═══════════════════════════════════════════════════════════════╗
║          WebSocket Client - Test Script                      ║
╚═══════════════════════════════════════════════════════════════╝

Connecting to: ws://localhost:8000/api/v1/realtime/ws
✓ Connected successfully

Sending subscribe message...
→ {"action": "subscribe", "symbols": ["VIC", "VNM", "HPG"]}
✓ Subscribe sent

Receiving updates...

[UPDATE] VIC   | Price: 45,500 | Vol: 100   | Time: 09:15:23
[UPDATE] VNM   | Price: 87,200 | Vol: 200   | Time: 09:15:24
[UPDATE] HPG   | Price: 28,300 | Vol: 500   | Time: 09:15:25
[UPDATE] VIC   | Price: 45,600 | Vol: 150   | Time: 09:15:27

Received 4 updates in 10 seconds
Test PASSED ✓
```

### Option 2: Manual Test với websocat (Windows)

**Install websocat:**
```powershell
# Download từ: https://github.com/vi/websocat/releases
# Hoặc dùng Chocolatey:
choco install websocat
```

**Connect to WebSocket:**
```bash
websocat ws://localhost:8000/api/v1/realtime/ws
```

**Send subscribe message:**
```json
{"action": "subscribe", "symbols": ["VIC", "VNM"]}
```

**Receive updates:**
```json
{"type": "tick", "symbol": "VIC", "price": 45500, "volume": 100, "timestamp": "2024-01-19T09:15:23"}
{"type": "tick", "symbol": "VNM", "price": 87200, "volume": 200, "timestamp": "2024-01-19T09:15:24"}
```

### Option 3: Browser Console Test

Mở browser console (F12) và chạy:

```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:8000/api/v1/realtime/ws');

ws.onopen = () => {
  console.log('✓ Connected');

  // Subscribe to symbols
  ws.send(JSON.stringify({
    action: 'subscribe',
    symbols: ['VIC', 'VNM', 'HPG']
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(`[${data.symbol}] ${data.price} | Vol: ${data.volume}`);
};

ws.onerror = (error) => {
  console.error('Error:', error);
};

// Close connection
// ws.close();
```

---

## 📊 Performance Testing

### Load Test với nhiều symbols

```bash
python scripts/test_load.py --symbols 100 --duration 60
```

**Metrics to watch:**
- Ticks per second
- Latency (tick arrival time vs timestamp)
- Memory usage
- CPU usage
- WebSocket connection stability

**Expected Performance:**
- Ticks/sec: 50-200 (depending on market activity)
- Latency: < 100ms
- Memory: < 100MB
- CPU: < 5%

---

## 🐛 Debug Mode

Enable debug logging:

```python
# In test scripts, set:
import logging
logging.basicConfig(level=logging.DEBUG)
```

**Debug output includes:**
- Raw WebSocket messages
- Parse steps
- State updates
- Connection events
- Error stack traces

---

## 📋 Test Checklist

### Bước 2.1 ✓
- [ ] Connect to SSI IDS WebSocket
- [ ] Authenticate successfully
- [ ] Subscribe to symbols
- [ ] Receive tick data
- [ ] Handle reconnection
- [ ] Graceful shutdown

### Bước 2.2 ✓
- [ ] Parse JSON messages
- [ ] Parse binary messages (if applicable)
- [ ] Extract all fields correctly
- [ ] Handle malformed messages
- [ ] Validate data types

### Bước 2.3 ✓
- [ ] Update single symbol
- [ ] Update multiple symbols
- [ ] Query by symbol (O(1))
- [ ] Query all symbols
- [ ] Thread-safe updates
- [ ] Auto-cleanup stale data

### Bước 2.4 ✓
- [ ] WebSocket endpoint accessible
- [ ] Client can connect
- [ ] Subscribe message works
- [ ] Receive realtime updates
- [ ] Handle disconnect/reconnect
- [ ] Multiple clients support

---

## 🔍 Monitoring & Logs

### Log Files

```
apps/ai-service/logs/
├── streaming.log          - Streaming client logs
├── parser.log             - Parser logs
├── state_manager.log      - State manager logs
└── websocket.log          - WebSocket endpoint logs
```

### Health Checks

```bash
# Check streaming status
curl http://localhost:8000/api/v1/realtime/health

# Expected response:
{
  "status": "healthy",
  "connected": true,
  "subscribed_symbols": ["VIC", "VNM", "HPG"],
  "ticks_received": 1234,
  "uptime_seconds": 3600,
  "last_tick_time": "2024-01-19T09:15:23"
}
```

---

## ✅ Success Criteria

### Bước 2.1 PASS nếu:
1. ✅ Kết nối WebSocket thành công
2. ✅ Authentication không bị reject
3. ✅ Subscribe symbols không lỗi
4. ✅ Nhận được ít nhất 1 tick trong 30 giây
5. ✅ Log rõ ràng, không có exception

### Bước 2.2 PASS nếu:
1. ✅ Parse đúng tất cả fields (symbol, price, volume, timestamp)
2. ✅ Handle được cả JSON và binary (nếu có)
3. ✅ Không crash với malformed messages

### Bước 2.3 PASS nếu:
1. ✅ Update và query đúng data
2. ✅ Thread-safe (no race conditions)
3. ✅ Cleanup stale data tự động

### Bước 2.4 PASS nếu:
1. ✅ Client connect được qua WebSocket
2. ✅ Nhận được realtime updates
3. ✅ Multiple clients cùng lúc không conflict

---

**Windows-specific Notes:**
- Sử dụng `venv\Scripts\activate` thay vì `source venv/bin/activate`
- Path separator: `\` thay vì `/`
- Có thể dùng Git Bash hoặc PowerShell
- Nếu dùng PowerShell, có thể cần: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

---

**Prepared by:** Claude
**For:** PHASE 2 Implementation
**Platform:** Windows
**Date:** 2024-01-19
