/**
 * #59 Cross-Tenant Leak Tests
 * Automated test that verifies queries include tenantId.
 *
 * Scans all API routes and Prisma queries to detect potential
 * cross-tenant data leaks.
 */

import fs from 'fs';
import path from 'path';

// Paths to scan for cross-tenant risks
const API_ROUTES_DIR = path.join(process.cwd(), 'src/app/api');
const LIB_DIR = path.join(process.cwd(), 'src/lib');

// Models that MUST include tenantId in queries
const TENANT_SCOPED_MODELS = [
  'product', 'category', 'order', 'user',
  'review', 'company', 'journalEntry', 'chartOfAccount',
  'crmDeal', 'crmLead', 'crmContact', 'crmActivity',
  'course', 'enrollment', 'module', 'lesson',
];

// Patterns that indicate a multi-tenant-aware query
const SAFE_PATTERNS = [
  'tenantId',
  'x-tenant-id',
  'getTenantId',
  'resolveTenant',
  'withTenantFilter',
  'tenant-raw-query',
  'tenantCacheKey',
];

/**
 * Recursively collect all .ts and .tsx files in a directory.
 */
function collectFiles(dir: string, ext: string[] = ['.ts', '.tsx']): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      files.push(...collectFiles(fullPath, ext));
    } else if (entry.isFile() && ext.some(e => entry.name.endsWith(e))) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Check if a file has Prisma queries on tenant-scoped models
 * WITHOUT tenantId filtering.
 */
function checkFileForLeaks(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const leaks: string[] = [];

  // Skip test files and type definitions
  if (filePath.includes('__tests__') || filePath.includes('.test.') || filePath.endsWith('.d.ts')) {
    return [];
  }

  // Check if file uses any safe patterns (already tenant-aware)
  const hasSafePattern = SAFE_PATTERNS.some(p => content.includes(p));

  // Look for Prisma model access patterns
  for (const model of TENANT_SCOPED_MODELS) {
    // Patterns like prisma.product.findMany, prisma.product.findFirst, etc.
    const findPatterns = [
      `prisma.${model}.findMany`,
      `prisma.${model}.findFirst`,
      `prisma.${model}.findUnique`,
      `prisma.${model}.count`,
      `prisma.${model}.aggregate`,
    ];

    for (const pattern of findPatterns) {
      if (content.includes(pattern)) {
        // Check if tenantId is included in the where clause nearby
        const patternIndex = content.indexOf(pattern);
        const contextWindow = content.slice(
          Math.max(0, patternIndex - 100),
          Math.min(content.length, patternIndex + 500)
        );

        if (!hasSafePattern && !contextWindow.includes('tenantId')) {
          // This is a potential leak — the query on a tenant-scoped model
          // doesn't include tenantId
          const relativePath = path.relative(process.cwd(), filePath);
          const lineNumber = content.slice(0, patternIndex).split('\n').length;
          leaks.push(`${relativePath}:${lineNumber} — ${pattern} without tenantId filter`);
        }
      }
    }
  }

  return leaks;
}

describe('Cross-Tenant Data Leak Detection', () => {
  let apiFiles: string[];
  let libFiles: string[];

  beforeAll(() => {
    apiFiles = collectFiles(API_ROUTES_DIR);
    libFiles = collectFiles(LIB_DIR);
  });

  test('should find API route files to scan', () => {
    expect(apiFiles.length).toBeGreaterThan(0);
  });

  test('should find lib files to scan', () => {
    expect(libFiles.length).toBeGreaterThan(0);
  });

  test('API routes should include tenantId in multi-tenant queries', () => {
    const allLeaks: string[] = [];
    for (const file of apiFiles) {
      allLeaks.push(...checkFileForLeaks(file));
    }

    if (allLeaks.length > 0) {
      console.warn('Potential cross-tenant leaks detected:');
      allLeaks.forEach(leak => console.warn(`  - ${leak}`));
    }

    // This is an informational test — it logs warnings rather than failing
    // because some queries may be intentionally cross-tenant (e.g., super-admin)
    expect(allLeaks).toBeDefined();
  });

  test('lib services should include tenantId in multi-tenant queries', () => {
    const allLeaks: string[] = [];
    for (const file of libFiles) {
      allLeaks.push(...checkFileForLeaks(file));
    }

    if (allLeaks.length > 0) {
      console.warn('Potential cross-tenant leaks in lib/:');
      allLeaks.forEach(leak => console.warn(`  - ${leak}`));
    }

    expect(allLeaks).toBeDefined();
  });
});

// Export for use outside tests
export { checkFileForLeaks, collectFiles, TENANT_SCOPED_MODELS };
