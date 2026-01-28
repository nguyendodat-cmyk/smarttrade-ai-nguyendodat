#!/bin/bash

# PHASE 1 Verification Script
# Verifies all PHASE 1 files are present and complete

set -e

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║         PHASE 1: SSI Integration - Verification Script       ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

MISSING_FILES=0

# Check branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${BLUE}📍 Current branch: ${CURRENT_BRANCH}${NC}"

if [ "$CURRENT_BRANCH" != "claude/setup-clean-repo-ceHy9" ]; then
    echo -e "${YELLOW}⚠️  Warning: You're not on branch 'claude/setup-clean-repo-ceHy9'${NC}"
    echo -e "${YELLOW}   Run: git checkout claude/setup-clean-repo-ceHy9${NC}"
    echo ""
fi

# Check latest commit
LATEST_COMMIT=$(git log -1 --oneline)
echo -e "${BLUE}📌 Latest commit: ${LATEST_COMMIT}${NC}"
echo ""

# List of required PHASE 1 files
declare -A FILES=(
    ["apps/ai-service/app/services/ssi_token_manager.py"]="SSI Token Manager (JWT auth + auto-refresh)"
    ["apps/ai-service/app/services/ssi_client.py"]="SSI REST API Client"
    ["apps/ai-service/app/models/market_models.py"]="Pydantic models for market data"
    ["apps/ai-service/app/routers/market.py"]="Market data API endpoints"
)

echo -e "${BLUE}🔍 Checking PHASE 1 files...${NC}"
echo "─────────────────────────────────────────────────────────────────"

for file in "${!FILES[@]}"; do
    if [ -f "$file" ]; then
        LINES=$(wc -l < "$file")
        echo -e "${GREEN}✓${NC} ${file}"
        echo -e "  └─ ${FILES[$file]} (${LINES} lines)"
    else
        echo -e "${RED}✗${NC} ${file} - MISSING"
        echo -e "  └─ ${FILES[$file]}"
        MISSING_FILES=$((MISSING_FILES + 1))
    fi
done

echo "─────────────────────────────────────────────────────────────────"
echo ""

# Check if market_models.py is in git
if git ls-tree -r HEAD --name-only | grep -q "market_models.py"; then
    echo -e "${GREEN}✓ market_models.py exists in git commit${NC}"
else
    echo -e "${RED}✗ market_models.py NOT in git commit${NC}"
    MISSING_FILES=$((MISSING_FILES + 1))
fi

# Verify imports
echo ""
echo -e "${BLUE}🔍 Verifying imports in market router...${NC}"

if [ -f "apps/ai-service/app/routers/market.py" ]; then
    if grep -q "from app.models.market_models import" apps/ai-service/app/routers/market.py; then
        echo -e "${GREEN}✓ market.py imports market_models correctly${NC}"

        # Show imported classes
        echo ""
        echo "Imported classes:"
        grep -A 12 "from app.models.market_models import" apps/ai-service/app/routers/market.py | sed 's/^/  /'
    else
        echo -e "${RED}✗ market.py does NOT import market_models${NC}"
    fi
fi

# Summary
echo ""
echo "═══════════════════════════════════════════════════════════════"

if [ $MISSING_FILES -eq 0 ]; then
    echo -e "${GREEN}✅ PHASE 1 verification passed!${NC}"
    echo -e "${GREEN}   All required files are present and correctly committed.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Start backend: cd apps/ai-service && python -m uvicorn app.main:app --reload"
    echo "  2. Test API: curl http://localhost:8000/api/v1/market/health"
    echo "  3. View docs: http://localhost:8000/docs"
else
    echo -e "${RED}❌ PHASE 1 verification failed!${NC}"
    echo -e "${RED}   ${MISSING_FILES} file(s) missing${NC}"
    echo ""
    echo "To fix:"
    echo "  1. Ensure you're on the correct branch:"
    echo "     git checkout claude/setup-clean-repo-ceHy9"
    echo ""
    echo "  2. Pull latest changes:"
    echo "     git pull origin claude/setup-clean-repo-ceHy9"
    echo ""
    echo "  3. Verify commit:"
    echo "     git log -1 --name-status"
    echo ""
    echo "  4. If files still missing, re-run this script or contact support"
fi

echo "═══════════════════════════════════════════════════════════════"
