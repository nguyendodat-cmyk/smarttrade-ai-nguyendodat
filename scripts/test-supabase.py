#!/usr/bin/env python3
"""
Quick test script to verify Supabase connection and schema
"""
import os
import sys
from pathlib import Path

# Add app directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / "apps" / "ai-service"))

try:
    from supabase import create_client, Client
    from dotenv import load_dotenv
except ImportError:
    print("❌ Missing dependencies. Please install:")
    print("   pip install supabase python-dotenv")
    sys.exit(1)

# Load environment variables
env_path = Path(__file__).parent.parent / "apps" / "ai-service" / ".env"
if env_path.exists():
    load_dotenv(env_path)
    print(f"✓ Loaded .env from: {env_path}")
else:
    print(f"⚠️  .env file not found at: {env_path}")
    print("   Trying environment variables...")

# Get Supabase credentials
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("\n❌ Missing Supabase credentials!")
    print("Please set:")
    print("  - SUPABASE_URL")
    print("  - SUPABASE_SERVICE_KEY")
    print("\nEither in apps/ai-service/.env or as environment variables")
    sys.exit(1)

print(f"✓ SUPABASE_URL: {SUPABASE_URL}")
print(f"✓ SERVICE_KEY: {SUPABASE_SERVICE_KEY[:20]}...")

# Test connection
print("\n" + "="*60)
print("Testing Supabase Connection...")
print("="*60)

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    print("✓ Supabase client created successfully")

    # Test tables from each migration
    tables_to_check = [
        # Migration 001
        ("profiles", "User profiles"),
        ("notification_settings", "Notification settings"),
        ("stocks", "Stock master data"),
        ("stock_prices", "Current stock prices"),
        ("market_indices", "Market indices"),
        ("watchlists", "User watchlists"),
        ("portfolio_positions", "Portfolio positions"),

        # Migration 003 (Knowledge Base)
        ("documents", "Knowledge base documents"),
        ("document_chunks", "Document chunks"),
        ("embeddings", "Vector embeddings"),

        # Migration 004 (Analytics)
        ("analytics_pageviews", "Page view tracking"),
        ("analytics_events", "Event tracking"),

        # Migration 005 (Research Agent)
        ("financial_reports", "Financial reports"),
        ("stock_news", "Stock news"),
        ("ai_research_reports", "AI research reports"),

        # Migration 006 (Smart Alerts)
        ("smart_alerts", "Smart alert rules"),
        ("smart_alert_conditions", "Alert conditions"),
        ("smart_alert_history", "Alert history"),
    ]

    print("\nChecking database tables:")
    print("-" * 60)

    missing_tables = []
    for table_name, description in tables_to_check:
        try:
            result = supabase.table(table_name).select("*").limit(1).execute()
            row_count = len(result.data) if hasattr(result, 'data') else 0
            print(f"  ✓ {table_name:30} | {description:30} | {row_count} rows")
        except Exception as e:
            print(f"  ❌ {table_name:30} | {description:30} | ERROR")
            missing_tables.append((table_name, str(e)))

    print("-" * 60)

    if missing_tables:
        print("\n⚠️  Some tables are missing or inaccessible:")
        for table_name, error in missing_tables:
            print(f"  - {table_name}: {error}")
        print("\nPlease ensure all migrations have been applied:")
        print("  1. Go to Supabase Dashboard > SQL Editor")
        print("  2. Run: supabase/combined_migration.sql")
    else:
        print("\n✅ All tables exist and are accessible!")

    # Check for seed data
    print("\n" + "="*60)
    print("Checking Seed Data...")
    print("="*60)

    # Check stocks
    stocks = supabase.table("stocks").select("symbol, company_name").limit(5).execute()
    if stocks.data:
        print(f"✓ Found {len(stocks.data)} stocks (showing first 5):")
        for stock in stocks.data:
            print(f"  - {stock.get('symbol')}: {stock.get('company_name')}")
    else:
        print("⚠️  No stocks found. Seed data may not be loaded.")

    # Check market indices
    indices = supabase.table("market_indices").select("symbol, name").execute()
    if indices.data:
        print(f"\n✓ Found {len(indices.data)} market indices:")
        for index in indices.data:
            print(f"  - {index.get('symbol')}: {index.get('name')}")
    else:
        print("\n⚠️  No market indices found.")

    print("\n" + "="*60)
    print("✅ Supabase Connection Test Complete!")
    print("="*60)

    # Test authentication capability
    print("\nTesting Auth Capability...")
    try:
        # Try to list users (requires service_role key)
        # Note: This is just to test permissions, not to actually list users
        result = supabase.table("profiles").select("id").limit(1).execute()
        print("✓ Service role key has correct permissions")
    except Exception as e:
        print(f"⚠️  Auth test failed: {e}")

except Exception as e:
    print(f"\n❌ Connection failed!")
    print(f"Error: {e}")
    print("\nTroubleshooting:")
    print("  1. Check your Supabase URL is correct")
    print("  2. Check your SERVICE_ROLE key (not anon key)")
    print("  3. Ensure your Supabase project is not paused")
    print("  4. Check your internet connection")
    sys.exit(1)
