export const dynamic = 'force-dynamic';

import { withAdminGuard } from '@/lib/admin-api-guard';
import { apiSuccess, apiError } from '@/lib/api-response';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';

// Product types are stored in a JSON config file for simplicity.
// No Prisma model needed — this is a lightweight config store.
const CONFIG_DIR = process.env.NODE_ENV === 'production'
  ? '/tmp/peptide-config'
  : path.join(process.cwd(), 'data');
const CONFIG_FILE = path.join(CONFIG_DIR, 'product-types.json');

interface ProductType {
  value: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
}

// Default product types (generic, not peptide-specific)
const DEFAULT_PRODUCT_TYPES: ProductType[] = [
  { value: 'PHYSICAL', label: 'Produit physique', sortOrder: 1, isActive: true },
  { value: 'DIGITAL', label: 'Produit numérique', sortOrder: 2, isActive: true },
  { value: 'SERVICE', label: 'Service', sortOrder: 3, isActive: true },
  { value: 'SUBSCRIPTION', label: 'Abonnement', sortOrder: 4, isActive: true },
  { value: 'COURSE', label: 'Formation', sortOrder: 5, isActive: true },
  { value: 'EVENT', label: 'Événement', sortOrder: 6, isActive: true },
  { value: 'GIFT_CARD', label: 'Carte-cadeau', sortOrder: 7, isActive: true },
  { value: 'ACCESSORY', label: 'Accessoire', sortOrder: 8, isActive: true },
  { value: 'BUNDLE', label: 'Bundle', sortOrder: 9, isActive: true },
];

async function readProductTypes(): Promise<ProductType[]> {
  try {
    const content = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    // File doesn't exist yet — return defaults
    return DEFAULT_PRODUCT_TYPES;
  }
}

async function writeProductTypes(types: ProductType[]): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  await fs.writeFile(CONFIG_FILE, JSON.stringify(types, null, 2), 'utf-8');
}

// GET /api/admin/product-types — List all product types
export const GET = withAdminGuard(async (request) => {
  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get('active') !== 'false';

  let types = await readProductTypes();
  if (activeOnly) {
    types = types.filter(t => t.isActive);
  }
  types.sort((a, b) => a.sortOrder - b.sortOrder);

  return apiSuccess(types, { request });
});

const createSchema = z.object({
  value: z.string().min(1).max(50).regex(/^[A-Z0-9_]+$/, 'Value must be UPPER_SNAKE_CASE'),
  label: z.string().min(1).max(100),
  sortOrder: z.number().int().min(0).optional(),
});

// POST /api/admin/product-types — Create a new product type
export const POST = withAdminGuard(async (request) => {
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('Validation error', 400, { details: parsed.error.flatten().fieldErrors });
  }

  const { value, label, sortOrder } = parsed.data;
  const types = await readProductTypes();

  // Check uniqueness
  if (types.some(t => t.value === value)) {
    return apiError('Ce type existe déjà', 409);
  }

  const finalSort = sortOrder ?? types.length + 1;
  const newType: ProductType = { value, label, sortOrder: finalSort, isActive: true };
  types.push(newType);

  await writeProductTypes(types);

  return apiSuccess(newType, { request, status: 201 });
}, { requiredPermission: 'manage_products' });

const updateSchema = z.object({
  label: z.string().min(1).max(100).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// PUT /api/admin/product-types — Update a product type (by value in query param)
export const PUT = withAdminGuard(async (request) => {
  const { searchParams } = new URL(request.url);
  const value = searchParams.get('value');
  if (!value) {
    return apiError('Missing value query parameter', 400);
  }

  const types = await readProductTypes();
  const idx = types.findIndex(t => t.value === value);
  if (idx === -1) {
    return apiError('Product type not found', 404);
  }

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('Validation error', 400, { details: parsed.error.flatten().fieldErrors });
  }

  types[idx] = { ...types[idx], ...parsed.data };
  await writeProductTypes(types);

  return apiSuccess(types[idx], { request });
}, { requiredPermission: 'manage_products' });

// DELETE /api/admin/product-types — Delete a product type (by value in query param)
export const DELETE = withAdminGuard(async (request) => {
  const { searchParams } = new URL(request.url);
  const value = searchParams.get('value');
  if (!value) {
    return apiError('Missing value query parameter', 400);
  }

  const types = await readProductTypes();
  const idx = types.findIndex(t => t.value === value);
  if (idx === -1) {
    return apiError('Product type not found', 404);
  }

  types.splice(idx, 1);
  await writeProductTypes(types);

  return apiSuccess({ deleted: true }, { request });
}, { requiredPermission: 'manage_products' });
