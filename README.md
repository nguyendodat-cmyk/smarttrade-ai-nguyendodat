<p align="center">
  <img src="docs/assets/logo.png" alt="SmartTrade AI Logo" width="120" />
</p>

<h1 align="center">SmartTrade AI</h1>

<p align="center">
  <strong>AI-Powered Stock Trading Platform for Vietnamese Investors</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#demo">Demo</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#documentation">Docs</a> •
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/FastAPI-0.109-009688?logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?logo=python" alt="Python" />
  <img src="https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License" />
</p>

---

## Overview

SmartTrade AI is a modern, full-stack stock trading platform designed specifically for Vietnamese investors. It combines real-time market data with AI-powered insights to help traders make informed decisions.

### Why SmartTrade AI?

- **AI-First Approach**: Get instant market analysis, stock recommendations, and research reports powered by GPT-4
- **Vietnam Market Focus**: Built specifically for VN-Index, HNX, and UPCOM markets
- **Modern Tech Stack**: React 18, TypeScript, FastAPI, and Supabase for a fast, reliable experience
- **Open Source**: Fully open-source and ready for customization

---

## Features

### 🤖 AI Research Agent
Automated AI research that analyzes financial statements, news, and market sentiment to generate comprehensive stock reports.

### 📊 Smart Alerts System
Create complex alert rules with multiple conditions (price, volume, RSI, MACD, MA, Bollinger Bands) using AND/OR logic.

### 📈 Real-time Market Data
Track VN-Index, HNX-Index, and individual stocks with interactive candlestick charts and technical indicators.

### 💼 Portfolio Management
Monitor your holdings with AI-powered health scores, performance tracking, and allocation analysis.

### 🔍 Stock Screener
Find investment opportunities using advanced filters for fundamentals, technicals, and AI scores.

### 📱 Responsive Design
Fully responsive UI that works seamlessly on desktop, tablet, and mobile devices.

### 🌓 Dark/Light Theme
TradingView-inspired themes with professional color schemes optimized for long trading sessions.

---

## Demo

**Live Demo**: [https://smarttrade-web.onrender.com](https://smarttrade-web.onrender.com)

> Login with demo mode enabled - no account required!

<details>
<summary>📸 Screenshots</summary>

| Dashboard | AI Chat | Research |
|-----------|---------|----------|
| ![Dashboard](docs/assets/screenshot-dashboard.png) | ![AI Chat](docs/assets/screenshot-chat.png) | ![Research](docs/assets/screenshot-research.png) |

</details>

---

## Quick Start

### Prerequisites

- **Node.js** 18+ (recommend 20 LTS)
- **pnpm** 8+ (package manager)
- **Python** 3.11+ (for AI service)

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/nclamvn/smarttrade-ai.git
cd smarttrade-ai

# Install dependencies
pnpm install
```

### 2. Configure Environment

```bash
# Frontend environment
cp apps/web/.env.example apps/web/.env.local

# Backend environment
cp apps/ai-service/.env.example apps/ai-service/.env
```

Edit the `.env` files with your credentials:

| Variable | Description | Get it from |
|----------|-------------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL | [supabase.com](https://supabase.com) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | Supabase Dashboard |
| `OPENAI_API_KEY` | OpenAI API key | [platform.openai.com](https://platform.openai.com) |

### 3. Start Development Servers

```bash
# Terminal 1: Start frontend (port 5173)
pnpm dev:web

# Terminal 2: Start AI service (port 8000)
cd apps/ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 4. Open the App

Navigate to [http://localhost:5173](http://localhost:5173)

---

## Project Structure

```
smarttrade-ai/
├── apps/
│   ├── web/                      # React frontend (Vite + TypeScript)
│   │   ├── src/
│   │   │   ├── components/       # Reusable UI components
│   │   │   ├── pages/            # Route pages
│   │   │   ├── stores/           # Zustand state management
│   │   │   ├── hooks/            # Custom React hooks
│   │   │   ├── services/         # API services
│   │   │   ├── lib/              # Utilities
│   │   │   └── types/            # TypeScript types
│   │   └── e2e/                  # Playwright E2E tests
│   │
│   ├── ai-service/               # Python FastAPI backend
│   │   ├── app/
│   │   │   ├── routers/          # API endpoints
│   │   │   ├── services/         # Business logic
│   │   │   ├── agents/           # AI agents (research, news, etc.)
│   │   │   └── config.py         # Settings
│   │   └── tests/                # Pytest tests
│   │
│   └── mobile/                   # React Native app (Expo)
│
├── supabase/
│   └── migrations/               # Database migrations
│
├── .github/
│   └── workflows/                # CI/CD pipelines
│
├── docker-compose.yml            # Production Docker setup
├── render.yaml                   # Render deployment config
└── pnpm-workspace.yaml           # Monorepo configuration
```

---

## Insight Pipeline (AI Service)

The AI service runs an **insight-driven pipeline** that detects technical signals from Vietnamese stock market data:

```
SSI API → Polling (60s) → State Manager → Insight Engine (10 detectors) → Alert Evaluator → AI Explain (Vietnamese)
```

### Running the AI Service

```bash
cd apps/ai-service
cp .env.example .env  # fill in SSI + Supabase credentials
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1
```

**Important:** Use `--workers 1` only. All pipeline state is in-memory.

### Key Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/alerts/pipeline/status` | Pipeline health + rolling counters |
| `GET /api/v1/alerts/pipeline/recent-notifications` | Recent alert notifications |
| `GET /health` | Health check |

### Environment Variables

See [`apps/ai-service/.env.example`](apps/ai-service/.env.example) for full list. Key variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `POLLING_ENABLED` | `true` | Enable SSI market polling |
| `AI_EXPLAIN_MODE` | `template_only` | `template_only` or `template_llm` |
| `ALERT_WARMUP_SECONDS` | `180` | Suppress alerts after restart |
| `ALERT_COOLDOWN_CACHE_PATH` | `data/cooldown_cache.json` | Cooldown persistence file |

### Running Tests

```bash
# E2E synthetic pipeline test (no external deps needed)
python scripts/test_e2e_pipeline_synthetic.py
```

See [docs/STAGING_RUNBOOK.md](docs/STAGING_RUNBOOK.md) for staging deployment guide.

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| [React 18](https://react.dev) | UI Framework |
| [TypeScript](https://typescriptlang.org) | Type Safety |
| [Vite](https://vitejs.dev) | Build Tool |
| [Tailwind CSS](https://tailwindcss.com) | Styling |
| [Radix UI](https://radix-ui.com) | Accessible Components |
| [TanStack Query](https://tanstack.com/query) | Data Fetching |
| [Zustand](https://zustand-demo.pmnd.rs) | State Management |
| [Recharts](https://recharts.org) | Charts |
| [Lightweight Charts](https://tradingview.github.io/lightweight-charts/) | Trading Charts |

### Backend
| Technology | Purpose |
|------------|---------|
| [FastAPI](https://fastapi.tiangolo.com) | API Framework |
| [Python 3.11+](https://python.org) | Runtime |
| [OpenAI GPT-4](https://openai.com) | AI Analysis |
| [Supabase](https://supabase.com) | Database & Auth |
| [Pydantic](https://pydantic.dev) | Data Validation |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| [Docker](https://docker.com) | Containerization |
| [GitHub Actions](https://github.com/features/actions) | CI/CD |
| [Render](https://render.com) | Hosting |

---

## API Documentation

When running locally, API documentation is available at:

- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/chat` | POST | AI chat assistant |
| `/api/v1/research/report/{symbol}` | GET | AI research report |
| `/api/v1/alerts` | GET/POST | Smart alerts CRUD |
| `/api/v1/analytics/overview` | GET | Analytics dashboard |
| `/health` | GET | Health check |

---

## Development

### Commands

```bash
# Development
pnpm dev:web              # Start frontend dev server
pnpm dev:ai               # Start AI service

# Build
pnpm build                # Build all packages
pnpm --filter web build   # Build frontend only

# Testing
pnpm --filter web test        # Run unit tests
pnpm --filter web e2e         # Run E2E tests
pnpm --filter web test:coverage   # Coverage report

# Code Quality
pnpm --filter web lint        # ESLint
pnpm --filter web typecheck   # TypeScript check
```

### Docker Development

```bash
# Start all services with Docker
docker-compose -f docker-compose.dev.yml up

# Production build
docker-compose up -d
```

### Database Migrations

```bash
# Apply migrations (requires Supabase CLI)
supabase db push

# Create new migration
supabase migration new <migration_name>
```

---

## Deployment

### Render (Recommended)

The project includes `render.yaml` for one-click deployment to Render:

1. Fork this repository
2. Create a new **Blueprint** on [Render](https://render.com)
3. Connect your GitHub repository
4. Add environment variables in Render dashboard
5. Deploy!

### Manual Deployment

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed instructions on deploying to:
- Vercel (Frontend)
- Railway (Backend)
- AWS / GCP / Azure

---

## Contributing

We welcome contributions! Please follow these steps:

### 1. Fork & Clone

```bash
git clone https://github.com/nclamvn/smarttrade-ai.git
cd smarttrade-ai
```

### 2. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

### 3. Make Changes

- Follow the existing code style
- Add tests for new features
- Update documentation as needed

### 4. Commit & Push

```bash
git add .
git commit -m "feat: add your feature description"
git push origin feature/your-feature-name
```

### 5. Open a Pull Request

Create a PR with a clear description of your changes.

### Commit Convention

We follow [Conventional Commits](https://conventionalcommits.org):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Code style (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Tests
- `chore:` Maintenance

---

## Roadmap

### Phase 1: Core Platform ✅
- [x] AI Chat Assistant
- [x] Real-time Market Data
- [x] Portfolio Management
- [x] Stock Screener
- [x] Smart Alerts System
- [x] AI Research Agent

### Phase 2: Real-time Features 🚧
- [ ] WebSocket real-time quotes
- [ ] Push notifications
- [ ] Email alerts
- [ ] Real market data integration (SSI, VNDirect)

### Phase 3: Monetization
- [ ] Premium subscription
- [ ] Payment integration (Stripe, VNPay)
- [ ] Advanced AI features for premium users

### Phase 4: Mobile & Social
- [ ] React Native mobile app
- [ ] Social trading features
- [ ] Copy trading

---

## Support

- **Issues**: [GitHub Issues](https://github.com/nclamvn/smarttrade-ai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/nclamvn/smarttrade-ai/discussions)
- **Email**: support@smarttrade.vn

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 SmartTrade AI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

<p align="center">
  Made with ❤️ in Vietnam
</p>

<p align="center">
  <a href="#smarttrade-ai">Back to top ⬆️</a>
</p>
