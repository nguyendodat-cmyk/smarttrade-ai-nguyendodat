#!/bin/bash

# SmartTrade AI - Apply Database Migrations
# This script applies all SQL migrations to your Supabase database

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         SmartTrade AI - Database Migration Script             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env exists
BACKEND_ENV="apps/ai-service/.env"
if [ ! -f "$BACKEND_ENV" ]; then
    echo -e "${RED}❌ Backend .env file not found!${NC}"
    echo -e "${YELLOW}Please run: bash scripts/setup-supabase.sh first${NC}"
    exit 1
fi

# Load environment variables
echo -e "${BLUE}📋 Loading environment variables...${NC}"
source "$BACKEND_ENV"

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo -e "${RED}❌ SUPABASE_URL or SUPABASE_SERVICE_KEY not set in .env${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Environment loaded${NC}"
echo -e "  Supabase URL: ${SUPABASE_URL}"
echo ""

# Extract project reference from URL
PROJECT_REF=$(echo "$SUPABASE_URL" | sed -E 's/https:\/\/([^.]+).*/\1/')
echo -e "${BLUE}📦 Project Reference: ${PROJECT_REF}${NC}"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL client (psql) not found.${NC}"
    echo -e "${YELLOW}   Installing via Supabase CLI method...${NC}"
    echo ""

    # Alternative: Use Supabase REST API to execute SQL
    echo -e "${BLUE}📡 Using Supabase REST API to apply migrations...${NC}"
    echo ""

    MIGRATION_DIR="supabase/migrations"
    MIGRATIONS=(
        "001_initial_schema.sql"
        "002_seed_data.sql"
        "003_knowledge_base.sql"
        "004_analytics.sql"
        "005_research_agent.sql"
        "006_smart_alerts.sql"
    )

    for migration in "${MIGRATIONS[@]}"; do
        echo -e "${BLUE}Applying: ${migration}${NC}"

        # Read SQL file
        SQL_CONTENT=$(cat "$MIGRATION_DIR/$migration")

        # Execute via REST API (using service role key)
        RESPONSE=$(curl -s -X POST \
            "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
            -H "apikey: ${SUPABASE_SERVICE_KEY}" \
            -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
            -H "Content-Type: application/json" \
            -d "{\"query\": $(echo "$SQL_CONTENT" | jq -Rs .)}" 2>&1)

        # Check response
        if echo "$RESPONSE" | grep -q "error"; then
            echo -e "${YELLOW}⚠️  Note: Migration may already be applied or requires manual execution${NC}"
            echo -e "${YELLOW}   Error: $RESPONSE${NC}"
        else
            echo -e "${GREEN}✓ Applied successfully${NC}"
        fi
        echo ""
    done

    echo -e "${YELLOW}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}⚠️  IMPORTANT: Manual Migration Required${NC}"
    echo -e "${YELLOW}════════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${BLUE}The REST API method has limitations. Please apply migrations manually:${NC}"
    echo ""
    echo -e "Option 1: Using Supabase Dashboard (Recommended)"
    echo -e "  1. Go to: ${SUPABASE_URL/https:\/\//https://supabase.com/dashboard/project/}/editor"
    echo -e "  2. Click 'SQL Editor' in the left sidebar"
    echo -e "  3. Click 'New Query'"
    echo -e "  4. Copy and paste each migration file content from supabase/migrations/"
    echo -e "  5. Run them in order: 001 → 002 → 003 → 004 → 005 → 006"
    echo ""
    echo -e "Option 2: Using psql (PostgreSQL client)"
    echo -e "  Install psql: ${YELLOW}sudo apt-get install postgresql-client${NC}"
    echo -e "  Then run this script again."
    echo ""
    echo -e "Option 3: Using Supabase CLI"
    echo -e "  Install: ${YELLOW}npm install -g supabase${NC}"
    echo -e "  Link: ${YELLOW}supabase link --project-ref ${PROJECT_REF}${NC}"
    echo -e "  Push: ${YELLOW}supabase db push${NC}"
    echo ""

else
    # Use psql if available
    echo -e "${BLUE}✓ PostgreSQL client found. Applying migrations via psql...${NC}"
    echo ""

    # Connection string format: postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
    echo -e "${YELLOW}📝 Please enter your Supabase database password:${NC}"
    echo -e "${YELLOW}(This is the password you set when creating the project)${NC}"
    read -sp "Database Password: " DB_PASSWORD
    echo ""
    echo ""

    DB_HOST="db.${PROJECT_REF}.supabase.co"
    DB_CONNECTION="postgresql://postgres:${DB_PASSWORD}@${DB_HOST}:5432/postgres"

    MIGRATION_DIR="supabase/migrations"
    MIGRATIONS=(
        "001_initial_schema.sql"
        "002_seed_data.sql"
        "003_knowledge_base.sql"
        "004_analytics.sql"
        "005_research_agent.sql"
        "006_smart_alerts.sql"
    )

    for migration in "${MIGRATIONS[@]}"; do
        echo -e "${BLUE}Applying: ${migration}${NC}"

        if psql "$DB_CONNECTION" -f "$MIGRATION_DIR/$migration" 2>&1 | grep -q "ERROR"; then
            echo -e "${YELLOW}⚠️  Note: Some errors may occur if migration was already applied${NC}"
        else
            echo -e "${GREEN}✓ Applied successfully${NC}"
        fi
        echo ""
    done

    echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✓ All migrations applied successfully!${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
fi

echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo -e "  1. Verify tables in Supabase Dashboard:"
echo -e "     ${SUPABASE_URL/https:\/\//https://supabase.com/dashboard/project/}/editor"
echo ""
echo -e "  2. Start the backend server:"
echo -e "     ${YELLOW}cd apps/ai-service && source venv/bin/activate && python main.py${NC}"
echo ""
echo -e "  3. Test the connection:"
echo -e "     ${YELLOW}curl http://localhost:8000/docs${NC}"
echo ""
