#!/bin/bash

# SmartTrade AI - Supabase Setup Script
# This script helps you setup Supabase and apply all migrations

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          SmartTrade AI - Supabase Setup Script                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env files exist
BACKEND_ENV="apps/ai-service/.env"
FRONTEND_ENV="apps/web/.env.local"

echo -e "${BLUE}📋 Checking environment files...${NC}"

if [ -f "$BACKEND_ENV" ]; then
    echo -e "${YELLOW}⚠️  Backend .env already exists. Backup will be created.${NC}"
    cp "$BACKEND_ENV" "$BACKEND_ENV.backup.$(date +%Y%m%d_%H%M%S)"
fi

if [ -f "$FRONTEND_ENV" ]; then
    echo -e "${YELLOW}⚠️  Frontend .env.local already exists. Backup will be created.${NC}"
    cp "$FRONTEND_ENV" "$FRONTEND_ENV.backup.$(date +%Y%m%d_%H%M%S)"
fi

echo ""
echo -e "${BLUE}🔑 Please provide your Supabase credentials:${NC}"
echo -e "${YELLOW}(Get these from: https://supabase.com/dashboard > Your Project > Settings > API)${NC}"
echo ""

# Prompt for credentials
read -p "Supabase URL (https://xxx.supabase.co): " SUPABASE_URL
read -p "Supabase ANON key: " SUPABASE_ANON_KEY
read -sp "Supabase SERVICE_ROLE key (hidden): " SUPABASE_SERVICE_KEY
echo ""
echo ""

# Optional: OpenAI API Key
read -p "OpenAI API Key (optional, press Enter to skip): " OPENAI_API_KEY
if [ -z "$OPENAI_API_KEY" ]; then
    OPENAI_API_KEY="sk-xxx-replace-me"
fi

# Optional: SSI Credentials
echo ""
echo -e "${BLUE}🏦 SSI FastConnect Credentials (optional):${NC}"
read -p "SSI Consumer ID (press Enter to skip): " SSI_CONSUMER_ID
read -p "SSI Consumer Secret (press Enter to skip): " SSI_CONSUMER_SECRET

if [ -z "$SSI_CONSUMER_ID" ]; then
    SSI_CONSUMER_ID="your-consumer-id"
    SSI_CONSUMER_SECRET="your-consumer-secret"
fi

# Create backend .env
echo ""
echo -e "${BLUE}📝 Creating backend environment file...${NC}"
cat > "$BACKEND_ENV" << EOF
# AI Service Environment Variables
# Generated on $(date)

# App
DEBUG=true

# AI Providers
OPENAI_API_KEY=${OPENAI_API_KEY}
ANTHROPIC_API_KEY=sk-ant-xxx-replace-me

# Supabase
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}

# SSI FastConnect
SSI_CONSUMER_ID=${SSI_CONSUMER_ID}
SSI_CONSUMER_SECRET=${SSI_CONSUMER_SECRET}
SSI_BASE_URL=https://fc-data.ssi.com.vn

# CORS (add your frontend URL in production)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Redis (optional, for caching)
# REDIS_URL=redis://localhost:6379
EOF

echo -e "${GREEN}✓ Backend .env created at: $BACKEND_ENV${NC}"

# Create frontend .env.local
echo ""
echo -e "${BLUE}📝 Creating frontend environment file...${NC}"
cat > "$FRONTEND_ENV" << EOF
# SmartTrade AI - Frontend Environment
# Generated on $(date)

# Supabase Configuration
VITE_SUPABASE_URL=${SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}

# AI Service Configuration
VITE_AI_SERVICE_URL=http://localhost:8000

# API Configuration
VITE_API_URL=http://localhost:3000

# Demo Mode (set to false for production)
VITE_DEMO_MODE=true

# Logging
VITE_LOG_LEVEL=info
VITE_DEBUG=true

# App Info
VITE_APP_NAME=SmartTrade AI
VITE_APP_URL=http://localhost:5173
EOF

echo -e "${GREEN}✓ Frontend .env.local created at: $FRONTEND_ENV${NC}"

# Summary
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                  ✓ Setup Complete!                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo -e "  1. Apply database migrations:"
echo -e "     ${YELLOW}bash scripts/apply-migrations.sh${NC}"
echo ""
echo -e "  2. Start backend server:"
echo -e "     ${YELLOW}cd apps/ai-service && source venv/bin/activate && python main.py${NC}"
echo ""
echo -e "  3. Start frontend server:"
echo -e "     ${YELLOW}cd apps/web && pnpm dev${NC}"
echo ""
echo -e "${BLUE}📁 Files created:${NC}"
echo -e "  • $BACKEND_ENV"
echo -e "  • $FRONTEND_ENV"
echo ""
