# 🚀 SmartTrade AI - Setup Guide

Hướng dẫn setup từ đầu cho SmartTrade AI (Supabase + SSI FastConnect)

---

## 📋 Yêu cầu

- Node.js 18+ và pnpm
- Python 3.11+
- Tài khoản Supabase (miễn phí)
- SSI FastConnect credentials (consumer_id + consumer_secret)

---

## ⚡ Quick Start (3 bước)

### Bước 1: Tạo Supabase Project

1. Truy cập: https://supabase.com/dashboard
2. Đăng nhập/đăng ký (GitHub hoặc email)
3. Click **"New Project"**
4. Điền thông tin:
   - **Name**: `smarttrade-ai` (hoặc tên bạn muốn)
   - **Database Password**: Tạo mật khẩu mạnh (lưu lại để dùng sau)
   - **Region**: **Singapore** (gần Việt Nam nhất, latency thấp)
   - **Pricing Plan**: **Free**
5. Click **"Create new project"** (chờ 2-3 phút)

### Bước 2: Lấy Credentials

Sau khi project được tạo xong:

1. Vào **Settings** (icon ⚙️ bên trái) → **API**
2. Copy 3 giá trị sau:

   ```
   Project URL: https://xxxxxxxxxxxxx.supabase.co
   anon public key: eyJhbGc...
   service_role key: eyJhbGc... (click "Reveal" để xem)
   ```

### Bước 3: Chạy Setup Script

```bash
# Chạy script tự động
bash scripts/setup-supabase.sh
```

Script sẽ hỏi bạn nhập:
- Supabase URL
- Supabase anon key
- Supabase service_role key
- OpenAI API key (optional)
- SSI credentials (optional, có thể thêm sau)

---

## 🗄️ Apply Database Migrations

### Cách 1: Qua Supabase Dashboard (Khuyến nghị - Đơn giản nhất)

1. Vào Supabase Dashboard của bạn
2. Click **"SQL Editor"** ở sidebar bên trái
3. Click **"New Query"**
4. Copy toàn bộ nội dung file: `supabase/combined_migration.sql`
5. Paste vào SQL Editor
6. Click **"Run"** (▶️)
7. Chờ vài giây, sẽ thấy thông báo success

**Kiểm tra:**
- Click **"Table Editor"** → bạn sẽ thấy các tables: `profiles`, `stocks`, `smart_alerts`, etc.

### Cách 2: Qua Script (Nếu có psql hoặc Supabase CLI)

```bash
bash scripts/apply-migrations.sh
```

---

## 🔧 Cấu hình SSI FastConnect

Nếu chưa có SSI credentials khi chạy setup script, bạn có thể thêm sau:

### Lấy SSI Credentials

1. Đăng ký tài khoản SSI: https://www.ssi.com.vn/
2. Đăng ký SSI FastConnect API:
   - Liên hệ: api@ssi.com.vn hoặc hotline SSI
   - Yêu cầu: consumer_id và consumer_secret cho môi trường sandbox/production
3. Nhận credentials qua email

### Thêm vào .env

Mở file `apps/ai-service/.env` và cập nhật:

```bash
SSI_CONSUMER_ID=your-actual-consumer-id
SSI_CONSUMER_SECRET=your-actual-consumer-secret
SSI_BASE_URL=https://fc-data.ssi.com.vn
```

---

## 🏃 Chạy Ứng Dụng

### Backend (AI Service)

```bash
cd apps/ai-service

# Tạo virtual environment (lần đầu)
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # Linux/Mac
# hoặc
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Chạy server
python main.py
```

Backend sẽ chạy tại: http://localhost:8000

Kiểm tra API docs: http://localhost:8000/docs

### Frontend (Web App)

```bash
cd apps/web

# Install dependencies (lần đầu)
pnpm install

# Chạy dev server
pnpm dev
```

Frontend sẽ chạy tại: http://localhost:5173

---

## ✅ Kiểm Tra Hoạt Động

### 1. Kiểm tra Backend

```bash
# Health check
curl http://localhost:8000/health

# Test Supabase connection (sẽ có trong PHASE 1)
curl http://localhost:8000/api/v1/health/supabase
```

### 2. Kiểm tra Frontend

- Mở trình duyệt: http://localhost:5173
- Bạn sẽ thấy trang Landing Page của SmartTrade
- Click "Dashboard" hoặc "Get Started"
- Do `VITE_DEMO_MODE=true`, bạn sẽ vào được dashboard mà không cần login

### 3. Kiểm tra Database

- Vào Supabase Dashboard → Table Editor
- Kiểm tra các tables:
  - `profiles`
  - `stocks` (có ~50 stocks mẫu từ seed data)
  - `smart_alerts`
  - `stock_prices`
  - `market_indices`

---

## 🔍 Troubleshooting

### Lỗi: "supabase_url is required"

**Nguyên nhân:** Backend không đọc được .env file

**Giải pháp:**
1. Kiểm tra file `apps/ai-service/.env` đã tồn tại
2. Kiểm tra `SUPABASE_URL` đã được set đúng
3. Restart backend server

### Lỗi: "Failed to connect to Supabase"

**Nguyên nhân:** Sai credentials hoặc network issue

**Giải pháp:**
1. Kiểm tra lại `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` trong .env
2. Kiểm tra internet connection
3. Kiểm tra Supabase project status (vào dashboard xem có bị paused không)

### Lỗi: Migration failed

**Giải pháp:**
1. Dùng Supabase Dashboard SQL Editor (cách 1 ở trên)
2. Nếu gặp lỗi "already exists", có nghĩa migration đã được apply rồi → bỏ qua

### Frontend không kết nối được backend

**Kiểm tra:**
1. Backend có đang chạy không? (`curl http://localhost:8000/health`)
2. Kiểm tra `VITE_AI_SERVICE_URL` trong `apps/web/.env.local`
3. Kiểm tra CORS settings trong `apps/ai-service/.env`

---

## 📁 Cấu Trúc Files Quan Trọng

```
smarttrade-ai-nguyendodat/
├── apps/
│   ├── ai-service/
│   │   ├── .env                 ← Backend config (TỰ ĐỘNG TẠO)
│   │   ├── .env.example         ← Template
│   │   ├── main.py              ← Backend entry point
│   │   └── requirements.txt
│   └── web/
│       ├── .env.local           ← Frontend config (TỰ ĐỘNG TẠO)
│       ├── .env.example         ← Template
│       └── package.json
├── supabase/
│   ├── migrations/              ← 6 migration files riêng biệt
│   └── combined_migration.sql   ← Tất cả migrations gộp lại (TỰ ĐỘNG TẠO)
├── scripts/
│   ├── setup-supabase.sh        ← Setup script chính
│   └── apply-migrations.sh      ← Migration script
└── SETUP_GUIDE.md              ← File này
```

---

## 🎯 Roadmap Tiếp Theo

Sau khi setup xong PHASE 0, các bước tiếp theo:

- ✅ **PHASE 0**: Setup Supabase + Environment (HOÀN THÀNH)
- ⏭️ **PHASE 1**: Build SSI REST API Integration
  - SSI Token Manager (auth + refresh)
  - REST endpoints (OHLCV, market data)
- ⏭️ **PHASE 2**: Build Realtime Streaming (SSI IDS)
  - Streaming client
  - WebSocket cho frontend
- ⏭️ **PHASE 3**: Alert Engine Background Scheduler
  - APScheduler
  - Realtime alert evaluation
- ⏭️ **PHASE 4**: Frontend Realtime Updates
  - WebSocket integration
  - Live price board

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề, kiểm tra:

1. **Backend Logs**: Terminal đang chạy `python main.py`
2. **Frontend Logs**: Browser Console (F12)
3. **Supabase Logs**: Dashboard → Logs → API Logs

---

**Chúc bạn setup thành công! 🎉**

Sau khi hoàn thành PHASE 0, hãy thông báo để tôi tiếp tục PHASE 1: Build SSI Integration.
