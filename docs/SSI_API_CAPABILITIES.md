# SSI Market Data Integration - API Capabilities

## 📊 PHASE 1: REST API (COMPLETED)

### ✅ Available Endpoints

#### 1. Securities List
- **Endpoint:** `GET /api/v1/market/securities`
- **Purpose:** Get list of all stocks with company info
- **Parameters:**
  - `market` (optional): HOSE, HNX, or UPCOM
  - `page_index`, `page_size`: Pagination
- **Use Case:** Populate stock search, build symbol database

#### 2. Security Details
- **Endpoint:** `GET /api/v1/market/securities/{symbol}`
- **Purpose:** Get detailed information for a specific stock
- **Returns:** Company name, exchange, sector, industry
- **Use Case:** Stock profile page, company information

#### 3. Daily OHLCV (Historical)
- **Endpoint:** `GET /api/v1/market/ohlc/daily`
- **Purpose:** Historical daily candlestick data
- **Parameters:**
  - `symbol`: Stock symbol (e.g., VIC)
  - `from_date`, `to_date`: Date range
  - `page_index`, `page_size`: Pagination
- **Returns:** open, high, low, close, volume for each trading day
- **Use Case:** Daily charts, historical analysis, backtesting
- **Data Freshness:** End-of-day data (T+0 after market close ~15:30)

#### 4. Intraday OHLCV (Historical)
- **Endpoint:** `GET /api/v1/market/ohlc/intraday`
- **Purpose:** 1-minute OHLCV bars
- **Parameters:** Same as daily
- **Returns:** 1-minute bars with OHLCV
- **Use Case:** Intraday charts, short-term analysis
- **Data Freshness:** Historical intraday bars (not real-time)
- **Limitation:** Only available for recent dates (typically last 5-10 trading days)

#### 5. Market Indices
- **Endpoint:** `GET /api/v1/market/indices`
- **Purpose:** Get all market indices (VNINDEX, VN30, HNX, etc.)
- **Returns:** Index values, change, volume
- **Use Case:** Market overview, index tracking

#### 6. Index Components
- **Endpoint:** `GET /api/v1/market/indices/{code}/components`
- **Purpose:** Get stocks in an index (e.g., VN30 constituents)
- **Returns:** List of symbols with weights
- **Use Case:** Index composition, basket analysis

### ❌ NOT Available in PHASE 1

#### Real-time Quotes/Ticks
- **Why:** SSI REST API does not provide real-time quote snapshots
- **SSI Limitation:** `/api/v2/Market/SecuritiesDetails` returns ALL 3529 securities, not filtered by symbols
- **Workaround (PHASE 1):**
  - Use latest intraday bar from `/ohlc/intraday` (delayed by 1-5 minutes)
  - Use latest daily close from `/ohlc/daily` (for end-of-day prices)
- **Proper Solution:** PHASE 2 (IDS Streaming)

#### Bid/Ask Spread
- Not available via REST API
- Requires real-time streaming (PHASE 2)

#### Order Book Depth
- Not available via REST API
- Requires streaming data

---

## 🔴 PHASE 2: IDS Streaming (PLANNED)

### Real-time Data via WebSocket

SSI FastConnect provides **IDS (Integrated Data Service)** streaming via WebSocket for true real-time data.

#### Capabilities

1. **Real-time Price Ticks**
   - Last price, last volume
   - Bid/Ask prices (best 3 levels)
   - Real-time updates on every trade

2. **Real-time OHLC Bars**
   - Channel B: Real-time 1-minute bars
   - Updated as trades occur

3. **Order Book**
   - Top 3 bid/ask levels
   - Depth visualization

4. **Market Statistics**
   - Total volume, total value
   - Ceiling/floor prices
   - Reference price

### Architecture (PHASE 2)

```
┌─────────────────┐
│ SSI IDS Stream  │  wss://fc-tradingapi.ssi.com.vn/realtime
└────────┬────────┘
         │ WebSocket
         ▼
┌─────────────────┐
│ Streaming       │  Subscribe to symbols (e.g., VIC, VNM, HPG)
│ Client Manager  │  Handle reconnection, heartbeat
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ In-Memory       │  Store latest tick for each symbol
│ State Manager   │  O(1) lookup by symbol
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ WebSocket/SSE   │  Push to connected frontend clients
│ to Frontend     │  Subscribe by watchlist
└─────────────────┘
```

### Implementation Plan

1. **SSI IDS Client** (`ssi_streaming_client.py`)
   - WebSocket connection management
   - Authentication with private key
   - Subscribe to channels (X: ticks, B: bars)
   - Parse binary/JSON messages

2. **Realtime State Manager** (`realtime_state_manager.py`)
   - In-memory dict: `symbol -> TickData`
   - Thread-safe updates
   - Cleanup stale data (>5min)

3. **Frontend WebSocket Endpoint** (`routers/realtime.py`)
   - `GET /api/v1/realtime/ws` - WebSocket connection
   - Client subscribes to symbols
   - Server pushes updates from state manager

4. **Alert Engine Integration**
   - Subscribe to symbols from active alerts
   - Evaluate conditions on every tick
   - Trigger notifications via DB + WebSocket

### Data Flow

```
SSI IDS Stream
  → Parse tick (symbol, price, volume, time)
  → Update in-memory state
  → Push to subscribed frontend clients
  → Evaluate alert conditions
  → Trigger alerts if met
```

---

## 📋 Summary: What to Use When

| Use Case | PHASE 1 Solution | PHASE 2 Solution |
|----------|------------------|------------------|
| Historical daily charts | ✅ `/ohlc/daily` | ✅ (same) |
| Intraday charts (5min+) | ✅ `/ohlc/intraday` | ✅ (same) |
| Real-time price ticker | ❌ Not available | ✅ IDS streaming |
| Live watchlist | ❌ Poll `/ohlc/intraday` (slow) | ✅ WebSocket push |
| Price alerts | ❌ Poll every 1-5min | ✅ Real-time evaluation |
| Bid/Ask spread | ❌ Not available | ✅ IDS streaming |
| Order book depth | ❌ Not available | ✅ IDS streaming |

---

## 🧪 Testing PHASE 1

### 1. Get Daily OHLCV for VIC (last 30 days)
```bash
curl "http://localhost:8000/api/v1/market/ohlc/daily?symbol=VIC&from_date=2024-01-01&to_date=2024-01-31"
```

### 2. Get Intraday bars for VNM (today)
```bash
curl "http://localhost:8000/api/v1/market/ohlc/intraday?symbol=VNM&from_date=2024-01-19&to_date=2024-01-19&page_size=50"
```

### 3. Get HOSE securities list
```bash
curl "http://localhost:8000/api/v1/market/securities?market=HOSE&page_size=20"
```

### 4. Get VN30 components
```bash
curl "http://localhost:8000/api/v1/market/indices/VN30/components"
```

---

## 🚧 Known Limitations (PHASE 1)

1. **No real-time quotes** - Use intraday bars as workaround (1-5 min delay)
2. **Intraday data limited** - Only recent 5-10 trading days available
3. **Pagination required** - Large date ranges need multiple requests
4. **Rate limits** - SSI may throttle excessive requests
5. **Market hours only** - Data only updates during trading hours (9:00-15:00 VN time)

---

## ✅ When to Use PHASE 1 vs PHASE 2

**Use PHASE 1 (REST) for:**
- Historical analysis
- Backtesting strategies
- Daily/weekly charts
- Stock screening (end-of-day data)
- Portfolio performance (historical)

**Use PHASE 2 (Streaming) for:**
- Live trading dashboard
- Real-time watchlist
- Price alerts
- Intraday scalping
- Market monitoring during trading hours
- Order book analysis

---

**Status:** PHASE 1 ✅ Complete | PHASE 2 🚧 Planned
