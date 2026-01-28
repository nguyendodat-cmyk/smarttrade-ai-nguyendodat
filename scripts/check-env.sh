#!/bin/bash

# SmartTrade AI - Environment Configuration Checker
# Checks if .env files exist and are properly configured

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║      SmartTrade AI - Environment Configuration Checker        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check backend .env
BACKEND_ENV="apps/ai-service/.env"
BACKEND_EXAMPLE="apps/ai-service/.env.example"

echo -e "${BLUE}📋 Checking Backend Configuration...${NC}"

if [ -f "$BACKEND_ENV" ]; then
    echo -e "${GREEN}✓ Backend .env file exists${NC}"

    # Check required variables
    source "$BACKEND_ENV"

    if [ -z "$SUPABASE_URL" ]; then
        echo -e "${RED}  ❌ SUPABASE_URL is not set${NC}"
    else
        echo -e "${GREEN}  ✓ SUPABASE_URL: ${SUPABASE_URL}${NC}"
    fi

    if [ -z "$SUPABASE_SERVICE_KEY" ]; then
        echo -e "${RED}  ❌ SUPABASE_SERVICE_KEY is not set${NC}"
    else
        echo -e "${GREEN}  ✓ SUPABASE_SERVICE_KEY: ${SUPABASE_SERVICE_KEY:0:20}...${NC}"
    fi

    if [ -z "$SUPABASE_ANON_KEY" ]; then
        echo -e "${YELLOW}  ⚠️  SUPABASE_ANON_KEY is not set (optional)${NC}"
    else
        echo -e "${GREEN}  ✓ SUPABASE_ANON_KEY configured${NC}"
    fi

    if [ -z "$SSI_CONSUMER_ID" ] || [ "$SSI_CONSUMER_ID" = "your-consumer-id" ]; then
        echo -e "${YELLOW}  ⚠️  SSI_CONSUMER_ID is not configured (optional for now)${NC}"
    else
        echo -e "${GREEN}  ✓ SSI_CONSUMER_ID configured${NC}"
    fi

    if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" = "sk-xxx-replace-me" ]; then
        echo -e "${YELLOW}  ⚠️  OPENAI_API_KEY is not configured (optional)${NC}"
    else
        echo -e "${GREEN}  ✓ OPENAI_API_KEY configured${NC}"
    fi
else
    echo -e "${RED}❌ Backend .env file not found at: $BACKEND_ENV${NC}"
    echo -e "${YELLOW}   Creating from template...${NC}"

    if [ -f "$BACKEND_EXAMPLE" ]; then
        cp "$BACKEND_EXAMPLE" "$BACKEND_ENV"
        echo -e "${GREEN}   ✓ Created $BACKEND_ENV${NC}"
        echo -e "${YELLOW}   ⚠️  Please edit $BACKEND_ENV and add your credentials${NC}"
    else
        echo -e "${RED}   ❌ Template file not found: $BACKEND_EXAMPLE${NC}"
    fi
fi

echo ""

# Check frontend .env
FRONTEND_ENV="apps/web/.env.local"
FRONTEND_EXAMPLE="apps/web/.env.example"

echo -e "${BLUE}📋 Checking Frontend Configuration...${NC}"

if [ -f "$FRONTEND_ENV" ]; then
    echo -e "${GREEN}✓ Frontend .env.local file exists${NC}"

    # Check required variables
    source "$FRONTEND_ENV"

    if [ -z "$VITE_SUPABASE_URL" ]; then
        echo -e "${RED}  ❌ VITE_SUPABASE_URL is not set${NC}"
    else
        echo -e "${GREEN}  ✓ VITE_SUPABASE_URL: ${VITE_SUPABASE_URL}${NC}"
    fi

    if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
        echo -e "${RED}  ❌ VITE_SUPABASE_ANON_KEY is not set${NC}"
    else
        echo -e "${GREEN}  ✓ VITE_SUPABASE_ANON_KEY configured${NC}"
    fi

    if [ -z "$VITE_AI_SERVICE_URL" ]; then
        echo -e "${YELLOW}  ⚠️  VITE_AI_SERVICE_URL not set (using default)${NC}"
    else
        echo -e "${GREEN}  ✓ VITE_AI_SERVICE_URL: ${VITE_AI_SERVICE_URL}${NC}"
    fi
else
    echo -e "${RED}❌ Frontend .env.local file not found at: $FRONTEND_ENV${NC}"
    echo -e "${YELLOW}   Creating from template...${NC}"

    if [ -f "$FRONTEND_EXAMPLE" ]; then
        cp "$FRONTEND_EXAMPLE" "$FRONTEND_ENV"
        echo -e "${GREEN}   ✓ Created $FRONTEND_ENV${NC}"
        echo -e "${YELLOW}   ⚠️  Please edit $FRONTEND_ENV and add your Supabase URL and keys${NC}"
    else
        echo -e "${RED}   ❌ Template file not found: $FRONTEND_EXAMPLE${NC}"
    fi
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    Configuration Summary                      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Summary
BACKEND_OK=false
FRONTEND_OK=false

if [ -f "$BACKEND_ENV" ]; then
    source "$BACKEND_ENV"
    if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_KEY" ]; then
        BACKEND_OK=true
    fi
fi

if [ -f "$FRONTEND_ENV" ]; then
    source "$FRONTEND_ENV"
    if [ -n "$VITE_SUPABASE_URL" ] && [ -n "$VITE_SUPABASE_ANON_KEY" ]; then
        FRONTEND_OK=true
    fi
fi

if [ "$BACKEND_OK" = true ] && [ "$FRONTEND_OK" = true ]; then
    echo -e "${GREEN}✅ Configuration looks good!${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo -e "  1. Apply database migrations:"
    echo -e "     ${YELLOW}See instructions in SETUP_GUIDE.md${NC}"
    echo ""
    echo -e "  2. Test Supabase connection:"
    echo -e "     ${YELLOW}cd apps/ai-service${NC}"
    echo -e "     ${YELLOW}pip install -r requirements.txt${NC}"
    echo -e "     ${YELLOW}python ../../scripts/test-supabase.py${NC}"
    echo ""
    echo -e "  3. Start the backend:"
    echo -e "     ${YELLOW}python -m uvicorn app.main:app --reload --port 8000${NC}"
    echo ""
    echo -e "  4. Start the frontend:"
    echo -e "     ${YELLOW}cd apps/web && pnpm dev${NC}"
else
    echo -e "${YELLOW}⚠️  Configuration incomplete${NC}"
    echo ""
    if [ "$BACKEND_OK" = false ]; then
        echo -e "${RED}  Backend: Missing or incomplete configuration${NC}"
        echo -e "    → Edit: ${BACKEND_ENV}"
    fi
    if [ "$FRONTEND_OK" = false ]; then
        echo -e "${RED}  Frontend: Missing or incomplete configuration${NC}"
        echo -e "    → Edit: ${FRONTEND_ENV}"
    fi
    echo ""
    echo -e "${BLUE}💡 Tip: Run ${YELLOW}bash scripts/setup-supabase.sh${NC}${BLUE} for guided setup${NC}"
fi

echo ""
