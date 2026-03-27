#!/bin/bash
# Sync Prisma schema to production Railway database
# Usage: ./scripts/sync-prod-schema.sh
#
# Prerequisites:
# - Railway CLI installed: npm i -g @railway/cli
# - Logged in: railway login
# - Linked to project: railway link
#
# This script:
# 1. Validates the Prisma schema locally
# 2. Generates the Prisma client
# 3. Runs prisma db push against the Railway database
# 4. Reports success/failure

set -e

echo "🔄 Syncing Prisma schema to production..."
echo ""

# Step 1: Validate schema
echo "1/3 Validating schema..."
npx prisma validate
echo "✅ Schema valid"
echo ""

# Step 2: Generate client
echo "2/3 Generating Prisma client..."
npx prisma generate
echo "✅ Client generated"
echo ""

# Step 3: Push to production
echo "3/3 Pushing schema to Railway database..."
echo "⚠️  This will modify the production database!"
echo ""

# Use Railway's environment to get DATABASE_URL
if command -v railway &> /dev/null; then
  railway run npx prisma db push --accept-data-loss
  echo ""
  echo "✅ Production database schema synced!"
else
  echo "❌ Railway CLI not found. Install with: npm i -g @railway/cli"
  echo ""
  echo "Alternative: Set DATABASE_URL manually and run:"
  echo "  DATABASE_URL='postgresql://...' npx prisma db push --accept-data-loss"
  exit 1
fi
