#!/bin/bash
# Check Prisma schema drift between local and production (Railway)
# Usage: ./scripts/check-schema-drift.sh
#
# Prerequisites:
# - Railway CLI installed: npm i -g @railway/cli
# - Logged in: railway login
# - Linked to project: railway link
#
# This script:
# 1. Validates the local Prisma schema
# 2. Introspects the production database to a temp schema
# 3. Compares local vs production schemas
# 4. Reports any drift found
#
# Exit codes:
#   0 = schemas in sync
#   1 = drift detected or error

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TEMP_DIR=$(mktemp -d)

cleanup() {
  rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

echo "🔍 Checking schema drift between local and production..."
echo ""

# Step 1: Validate local schema
echo "1/4 Validating local schema..."
cd "$PROJECT_DIR"
npx prisma validate
echo "✅ Local schema valid"
echo ""

# Step 2: Copy schema to temp for introspection
echo "2/4 Preparing introspection workspace..."
cp prisma/schema.prisma "$TEMP_DIR/schema.prisma"
# Also copy any multi-file schema if using prisma schema folder
if [ -d "prisma/schema" ]; then
  cp -r prisma/schema "$TEMP_DIR/schema"
fi
echo "✅ Workspace ready"
echo ""

# Step 3: Introspect production database
echo "3/4 Introspecting production database..."
if ! command -v railway &> /dev/null; then
  echo "❌ Railway CLI not found. Install with: npm i -g @railway/cli"
  exit 1
fi

# Pull the production schema via introspection
railway run npx prisma db pull --schema="$TEMP_DIR/schema.prisma" 2>/dev/null || {
  echo "❌ Failed to introspect production database."
  echo "   Make sure you're logged in (railway login) and linked (railway link)."
  exit 1
}
echo "✅ Production schema introspected"
echo ""

# Step 4: Compare schemas
echo "4/4 Comparing schemas..."
echo ""

LOCAL_SCHEMA="prisma/schema.prisma"
PROD_SCHEMA="$TEMP_DIR/schema.prisma"

if diff -q "$LOCAL_SCHEMA" "$PROD_SCHEMA" > /dev/null 2>&1; then
  echo "✅ No drift detected — local schema matches production."
  exit 0
else
  echo "⚠️  Schema drift detected!"
  echo ""
  echo "Differences (local vs production):"
  echo "─────────────────────────────────────"
  diff --unified=3 "$LOCAL_SCHEMA" "$PROD_SCHEMA" || true
  echo "─────────────────────────────────────"
  echo ""
  echo "To sync production, run:"
  echo "  ./scripts/sync-prod-schema.sh"
  echo ""
  echo "To review changes safely first:"
  echo "  railway run npx prisma db push --dry-run"
  exit 1
fi
