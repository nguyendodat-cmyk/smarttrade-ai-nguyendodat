# 🗄️ Database Migration Guide

Quick guide to apply Supabase migrations for SmartTrade AI.

---

## Method 1: Supabase Dashboard SQL Editor (Recommended - Fastest)

### Step 1: Open SQL Editor

1. Go to your Supabase Dashboard
2. Click **"SQL Editor"** in left sidebar
3. Click **"New Query"**

### Step 2: Copy Migration SQL

Open the file: `supabase/combined_migration.sql`

Or use this command to show it:
```bash
cat supabase/combined_migration.sql
```

### Step 3: Run Migration

1. Copy ALL content from `combined_migration.sql`
2. Paste into SQL Editor
3. Click **"Run"** button (▶️)
4. Wait ~5-10 seconds for completion

### Step 4: Verify

After running, you should see:
- ✅ Success message
- Green checkmark

Click **"Table Editor"** to see all tables created:
- `profiles`
- `stocks`
- `smart_alerts`
- `stock_prices`
- `market_indices`
- And 15+ more tables...

---

## Method 2: Using psql (If you have PostgreSQL client)

### Step 1: Get Database Password

This is the password you set when creating the Supabase project.

### Step 2: Get Connection Details

From Supabase Dashboard → Settings → Database:
- Host: `db.YOUR-PROJECT-REF.supabase.co`
- Port: `5432`
- Database: `postgres`
- User: `postgres`

### Step 3: Run Migrations

```bash
# Connection string format
export DB_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Apply all migrations
cat supabase/migrations/*.sql | psql $DB_URL
```

---

## Method 3: Using Supabase CLI (Advanced)

### Install Supabase CLI

```bash
npm install -g supabase
```

### Link Project

```bash
supabase link --project-ref YOUR-PROJECT-REF
```

You'll need:
- Project Reference (from Dashboard URL)
- Database Password

### Push Migrations

```bash
supabase db push
```

---

## 🧪 Verify Migration Success

After applying migrations, run test script:

```bash
cd apps/ai-service

# Install dependencies first (if not already)
pip install -r requirements.txt

# Run test
python ../../scripts/test-supabase.py
```

**Expected output:**
```
✓ Supabase client created successfully
✓ All tables exist and are accessible!
✓ Found 50 stocks (showing first 5)
✓ Found 3 market indices
✅ Supabase Connection Test Complete!
```

---

## 📊 What Gets Created

The migrations create:

### Migration 001: Core Schema
- User profiles & authentication
- Stock data tables (stocks, stock_prices, stock_history, stock_fundamentals)
- Market indices
- Watchlists & portfolios
- Trading accounts
- Notification settings

### Migration 002: Seed Data
- 50+ Vietnamese stocks (VIC, VNM, HPG, etc.)
- Market indices (VN-Index, HNX, UPCOM)
- Sample historical data

### Migration 003: Knowledge Base
- Documents & document chunks
- Vector embeddings for RAG
- Full-text search

### Migration 004: Analytics
- Page views tracking
- Event tracking
- Daily metrics
- Feature usage stats

### Migration 005: Research Agent
- Financial reports
- Stock news with sentiment
- AI research reports
- Research alerts

### Migration 006: Smart Alerts
- Alert rules with conditions
- Alert history
- Support for 7+ technical indicators

**Total:** 20+ tables, indexes, RLS policies, and functions

---

## ❗ Troubleshooting

### "Error: relation already exists"

This is normal if you've run migrations before. You can:
1. Ignore the errors (tables already exist)
2. Or reset database (⚠️ deletes all data):
   ```sql
   -- In SQL Editor, run:
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   -- Then re-run migrations
   ```

### "Permission denied"

Make sure you're using **service_role** key in backend, not anon key.

### Tables not showing up

1. Refresh Supabase Dashboard
2. Check SQL Editor for error messages
3. Ensure entire migration SQL was pasted (1600+ lines)

---

## ✅ Next Steps After Migration

1. **Test Connection:**
   ```bash
   python scripts/test-supabase.py
   ```

2. **Start Backend:**
   ```bash
   cd apps/ai-service
   python -m uvicorn app.main:app --reload --port 8000
   ```

3. **Test Health Endpoint:**
   ```bash
   curl http://localhost:8000/api/v1/health/supabase
   ```

4. **Start Frontend:**
   ```bash
   cd apps/web
   pnpm dev
   ```

5. **Test Login:**
   - Go to http://localhost:5173/login
   - Try registering a new account
   - Check Supabase Dashboard → Authentication → Users

---

**Done! Your database is ready.** 🎉
