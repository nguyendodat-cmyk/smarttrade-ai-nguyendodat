# Deployment Guide

This guide covers deploying SmartTrade AI to production.

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Vercel      │────▶│   AI Service    │────▶│    Supabase     │
│   (React App)   │     │   (Railway)     │     │   (Database)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                      │                       │
         └──────────────────────┴───────────────────────┘
                            OpenAI API
```

## Prerequisites

- GitHub account
- Vercel account
- Railway account (or other Python hosting)
- Supabase project
- OpenAI API key

## 1. Supabase Setup

### Create Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key

### Run Migrations
```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-id

# Run migrations
supabase db push
```

### Enable Auth
1. Go to Authentication → Providers
2. Enable Email auth
3. Configure email templates (optional)

## 2. Deploy AI Service (Railway)

### Option A: Railway Dashboard
1. Go to [railway.app](https://railway.app)
2. Create new project → Deploy from GitHub
3. Select `apps/ai-service` directory
4. Add environment variables:
   - `OPENAI_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_KEY`

### Option B: Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
cd apps/ai-service
railway init

# Deploy
railway up
```

### Get Service URL
After deployment, note the Railway service URL (e.g., `https://ai-service-xxx.railway.app`)

## 3. Deploy Web App (Vercel)

### Option A: Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Import GitHub repository
3. Configure:
   - **Root Directory**: `apps/web`
   - **Build Command**: `pnpm build`
   - **Output Directory**: `dist`
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_AI_SERVICE_URL` (Railway URL from step 2)

### Option B: Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd apps/web
vercel --prod
```

## 4. GitHub Actions Setup

Add these secrets to your GitHub repository:

| Secret | Description |
|--------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_AI_SERVICE_URL` | Railway service URL |
| `OPENAI_API_KEY` | OpenAI API key |
| `VERCEL_TOKEN` | Vercel personal token |
| `VERCEL_ORG_ID` | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |
| `RAILWAY_TOKEN` | Railway API token |

### Get Vercel IDs
```bash
# In apps/web directory after first Vercel deploy
cat .vercel/project.json
```

## 5. Docker Deployment (Alternative)

### Build Images
```bash
# Build web
docker build -t smarttrade-web ./apps/web \
  --build-arg VITE_SUPABASE_URL=xxx \
  --build-arg VITE_SUPABASE_ANON_KEY=xxx \
  --build-arg VITE_AI_SERVICE_URL=xxx

# Build AI service
docker build -t smarttrade-ai ./apps/ai-service
```

### Run with Docker Compose
```bash
# Copy environment file
cp .env.example .env
# Edit .env with production values

# Start services
docker-compose up -d
```

### Push to Container Registry
```bash
# GitHub Container Registry
docker tag smarttrade-web ghcr.io/your-org/smarttrade-web:latest
docker push ghcr.io/your-org/smarttrade-web:latest
```

## 6. Domain Setup

### Vercel
1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS:
   - A record: `76.76.19.19`
   - Or CNAME: `cname.vercel-dns.com`

### SSL
Vercel automatically provisions SSL certificates.

## 7. Monitoring Setup

### Sentry (Error Tracking)
1. Create Sentry project
2. Add `VITE_SENTRY_DSN` to environment
3. Errors will be tracked automatically

### PostHog (Analytics)
1. Create PostHog project
2. Add `VITE_POSTHOG_KEY` to environment
3. Events will be tracked automatically

## 8. Performance Checklist

- [ ] Enable Vercel Edge caching
- [ ] Configure CDN for static assets
- [ ] Enable gzip compression (nginx config)
- [ ] Set up database connection pooling
- [ ] Configure rate limiting on AI endpoints
- [ ] Set up health check endpoints

## 9. Security Checklist

- [ ] All secrets in environment variables
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (Supabase handles this)
- [ ] XSS prevention (React handles this)
- [ ] HTTPS only

## Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
pnpm clean
pnpm install
pnpm build
```

### AI Service Not Responding
- Check Railway logs: `railway logs`
- Verify OPENAI_API_KEY is set
- Check health endpoint: `curl https://your-service.railway.app/health`

### Database Connection Issues
- Verify Supabase project is active
- Check connection string format
- Ensure IP allowlist includes deployment IPs

## Rollback

### Vercel
```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback
```

### Railway
Use Railway dashboard to redeploy previous version.

---

For additional help, contact the development team.
