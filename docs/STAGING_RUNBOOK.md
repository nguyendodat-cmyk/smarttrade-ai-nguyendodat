# Staging Runbook

## Prerequisites

- Python 3.11+
- `pip install -r apps/ai-service/requirements.txt`
- Copy `apps/ai-service/.env.example` to `apps/ai-service/.env` and fill in values

## 1. Minimal Staging Config

```env
POLLING_ENABLED=true
POLLING_INTERVAL_DEFAULT=60
POLLING_BATCH_SIZE=20
AI_EXPLAIN_MODE=template_only
ALERT_WARMUP_SECONDS=180
ALERT_COOLDOWN_CACHE_PATH=data/cooldown_cache.json
```

**Important:**
- Keep watchlist small: <= 20 symbols in staging
- Use `AI_EXPLAIN_MODE=template_only` (no LLM dependency)
- Single worker only (`uvicorn --workers 1`). All state is in-memory.

## 2. Smoke Test (No SSI Key Required)

```bash
# Run synthetic E2E test
python scripts/test_e2e_pipeline_synthetic.py
# Expected: 27/27 pass

# Start server
cd apps/ai-service
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1

# Check pipeline status
curl http://localhost:8000/api/v1/alerts/pipeline/status | python -m json.tool

# Verify warm-up countdown
# warmup_remaining_s should decrease from 180 to 0
curl http://localhost:8000/api/v1/alerts/pipeline/status | jq '.alert_evaluator'
```

## 3. Smoke Test with SSI Key

```bash
# Ensure .env has valid SSI_CONSUMER_ID + SSI_CONSUMER_SECRET
# Start server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1

# Wait 2-3 polling cycles (~2-3 min)
# Then check:
curl http://localhost:8000/api/v1/alerts/pipeline/status | python -m json.tool
```

**Verify:**
- `last_poll_at` updates every ~60s
- `symbols_in_state` > 0
- `insights_last_5m` fluctuates (may be 0 if market closed)
- `alerts_last_5m` reasonable (not spamming)

## 4. Restart Safety

On restart:
1. Cooldown cache auto-restores from `data/cooldown_cache.json`
2. Warm-up suppresses all alerts for first 180s (configurable)
3. State (bars) rebuilds from next polling cycle

## 5. Known Limitations

- **Single worker only**: Do not use `--workers > 1`
- **RSI uses SMA** (not Wilder's EMA) — minor numerical difference
- **VA03 heuristic**: Top 5% volume threshold may need tuning per market
- **No WebSocket**: Polling-based only in v1
