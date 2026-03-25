#!/bin/bash
# =============================================================================
# MEGA AUDIT LMS — Script automatise
# Usage: bash scripts/mega-audit-lms.sh [section]
# Sections: services, routes, pages, components, schema, build, all
# =============================================================================

set -e
cd "$(dirname "$0")/.."

AUDIT_DIR="audit"
FINDINGS_DIR="$AUDIT_DIR/findings"
TIMESTAMP=$(date +%Y-%m-%d_%H%M)

mkdir -p "$FINDINGS_DIR/services" "$FINDINGS_DIR/routes" "$FINDINGS_DIR/pages" "$FINDINGS_DIR/components" "$FINDINGS_DIR/schema"

echo "=== MEGA AUDIT LMS — $TIMESTAMP ==="
echo ""

# ── Phase 1: Outils automatiques ──
echo "--- Phase 1: Automated tools ---"

# TypeScript type check
echo "[1/4] TypeScript check..."
npx tsc --noEmit --project tsconfig.json 2>&1 | grep "error TS" > "$AUDIT_DIR/type-errors-$TIMESTAMP.txt" || true
TYPE_ERRORS=$(wc -l < "$AUDIT_DIR/type-errors-$TIMESTAMP.txt" | tr -d ' ')
echo "  Type errors: $TYPE_ERRORS"

# ESLint (LMS files only)
echo "[2/4] ESLint check..."
npx eslint src/lib/lms/ src/app/api/lms/ src/app/api/admin/lms/ src/components/lms/ \
  --ext .ts,.tsx --format json > "$AUDIT_DIR/eslint-$TIMESTAMP.json" 2>/dev/null || true
LINT_ERRORS=$(python3 -c "import json; data=json.load(open('$AUDIT_DIR/eslint-$TIMESTAMP.json')); print(sum(len(f.get('messages',[])) for f in data))" 2>/dev/null || echo "0")
echo "  ESLint findings: $LINT_ERRORS"

# Prisma validation
echo "[3/4] Prisma validate..."
npx prisma validate 2>&1 | tail -1

# Build check
echo "[4/4] Build check..."
NODE_OPTIONS='--max-old-space-size=8192' npm run build > /dev/null 2>&1 && echo "  Build: PASS" || echo "  Build: FAIL"

# ── Phase 2: Count inventory ──
echo ""
echo "--- Phase 2: Inventory ---"
echo "  Prisma models: $(grep -c '^model ' prisma/schema/lms.prisma)"
echo "  API routes: $(find src/app/api/lms src/app/api/admin/lms -name 'route.ts' 2>/dev/null | wc -l | tr -d ' ')"
echo "  Admin pages: $(find src/app/admin/formation -name 'page.tsx' 2>/dev/null | wc -l | tr -d ' ')"
echo "  Student pages: $(find src/app/\(shop\)/learn -name 'page.tsx' 2>/dev/null | wc -l | tr -d ' ')"
echo "  Components: $(find src/components/lms -name '*.tsx' 2>/dev/null | wc -l | tr -d ' ')"
echo "  Services: $(find src/lib/lms -name '*.ts' 2>/dev/null | wc -l | tr -d ' ')"
echo "  Service LOC: $(cat src/lib/lms/*.ts 2>/dev/null | wc -l | tr -d ' ')"

# ── Phase 3: Existing findings summary ──
echo ""
echo "--- Phase 3: Existing findings ---"
for f in "$FINDINGS_DIR"/services/*.md; do
  if [ -f "$f" ]; then
    name=$(basename "$f" .md)
    p0=$(grep -c "### P0:" "$f" 2>/dev/null || echo 0)
    p1=$(grep -c "### P1:" "$f" 2>/dev/null || echo 0)
    p2=$(grep -c "### P2:" "$f" 2>/dev/null || echo 0)
    p3=$(grep -c "### P3:" "$f" 2>/dev/null || echo 0)
    total=$((p0 + p1 + p2 + p3))
    echo "  $name: $total findings (P0:$p0 P1:$p1 P2:$p2 P3:$p3)"
  fi
done

TOTAL_P0=$(grep -rch "### P0:" "$FINDINGS_DIR" 2>/dev/null | paste -sd+ - | bc 2>/dev/null || echo 0)
TOTAL_P1=$(grep -rch "### P1:" "$FINDINGS_DIR" 2>/dev/null | paste -sd+ - | bc 2>/dev/null || echo 0)
TOTAL_P2=$(grep -rch "### P2:" "$FINDINGS_DIR" 2>/dev/null | paste -sd+ - | bc 2>/dev/null || echo 0)
TOTAL_P3=$(grep -rch "### P3:" "$FINDINGS_DIR" 2>/dev/null | paste -sd+ - | bc 2>/dev/null || echo 0)
TOTAL=$((TOTAL_P0 + TOTAL_P1 + TOTAL_P2 + TOTAL_P3))

echo ""
echo "=== SUMMARY ==="
echo "  Total findings: $TOTAL"
echo "  P0 (critical): $TOTAL_P0"
echo "  P1 (high):     $TOTAL_P1"
echo "  P2 (medium):   $TOTAL_P2"
echo "  P3 (low):      $TOTAL_P3"
echo "  Type errors:   $TYPE_ERRORS"
echo "  Lint findings: $LINT_ERRORS"
echo "  Build:         $(NODE_OPTIONS='--max-old-space-size=8192' npm run build > /dev/null 2>&1 && echo PASS || echo FAIL)"
echo ""
echo "=== END AUDIT — $TIMESTAMP ==="
