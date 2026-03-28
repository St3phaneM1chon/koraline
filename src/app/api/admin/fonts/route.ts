export const dynamic = 'force-dynamic';

/**
 * G26 — Custom Fonts CRUD API
 * GET  — List uploaded fonts + active primary/secondary
 * POST — Add a new font
 * PUT  — Set a font as primary or secondary (updates BrandKit)
 * DELETE — Remove a font
 *
 * Fonts are stored as JSON in BrandKit.guidelines (customFonts sub-key)
 * or as a dedicated customFonts field added to BrandKit.
 *
 * Since we avoid schema migration for a quick-win, we store in SiteSettings.statsJson
 * as a JSON field that already exists and accepts arbitrary JSON.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

interface CustomFont {
  name: string;
  url: string;
  weight: string;
  style: string;
}

interface FontsData {
  fonts: CustomFont[];
  primary: string | null;
  secondary: string | null;
}

/**
 * Read the current fonts data from SiteSettings.statsJson.
 * We use a sub-key "customFonts" within the JSON.
 */
async function getFontsData(): Promise<FontsData> {
  const settings = await prisma.siteSettings.findFirst({
    where: { id: 'default' },
    select: { statsJson: true },
  });

  if (settings?.statsJson) {
    try {
      const parsed = typeof settings.statsJson === 'string'
        ? JSON.parse(settings.statsJson)
        : settings.statsJson;
      if (parsed?.customFonts) {
        return parsed.customFonts as FontsData;
      }
    } catch {
      // Invalid JSON — start fresh
    }
  }

  return { fonts: [], primary: null, secondary: null };
}

/**
 * Save fonts data into SiteSettings.statsJson under "customFonts" key.
 * Preserves existing statsJson data.
 */
async function saveFontsData(fontsData: FontsData): Promise<void> {
  const settings = await prisma.siteSettings.findFirst({
    where: { id: 'default' },
    select: { statsJson: true },
  });

  let existingJson: Record<string, unknown> = {};
  if (settings?.statsJson) {
    try {
      existingJson = typeof settings.statsJson === 'string'
        ? JSON.parse(settings.statsJson)
        : (settings.statsJson as Record<string, unknown>);
    } catch {
      existingJson = {};
    }
  }

  existingJson.customFonts = fontsData;

  await prisma.siteSettings.upsert({
    where: { id: 'default' },
    update: { statsJson: JSON.stringify(existingJson) },
    create: { id: 'default', statsJson: JSON.stringify(existingJson) },
  });
}

// GET — List fonts + active primary/secondary
export const GET = withAdminGuard(async () => {
  try {
    const data = await getFontsData();
    return NextResponse.json(data);
  } catch (error) {
    logger.error('[Fonts API] GET error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Failed to load fonts' }, { status: 500 });
  }
});

// POST — Add a new font
export const POST = withAdminGuard(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const font = body.font as CustomFont | undefined;

    if (!font?.name || !font?.url) {
      return NextResponse.json({ error: 'Font name and url are required' }, { status: 400 });
    }

    // Validate name length
    if (font.name.length > 100) {
      return NextResponse.json({ error: 'Font name too long' }, { status: 400 });
    }

    // Validate URL is a data URL (base64 encoded font)
    if (!font.url.startsWith('data:font/') && !font.url.startsWith('data:application/')) {
      return NextResponse.json({ error: 'Invalid font data URL' }, { status: 400 });
    }

    // Max 2MB check on data URL
    if (font.url.length > 3 * 1024 * 1024) {
      return NextResponse.json({ error: 'Font file too large (max 2MB)' }, { status: 400 });
    }

    const data = await getFontsData();

    // Prevent duplicate names
    if (data.fonts.some((f) => f.name.toLowerCase() === font.name.toLowerCase())) {
      return NextResponse.json({ error: 'Font with this name already exists' }, { status: 409 });
    }

    // Max 10 fonts
    if (data.fonts.length >= 10) {
      return NextResponse.json({ error: 'Maximum 10 custom fonts allowed' }, { status: 400 });
    }

    data.fonts.push({
      name: font.name,
      url: font.url,
      weight: font.weight || '400',
      style: font.style || 'normal',
    });

    await saveFontsData(data);
    logger.info('[Fonts API] Font added', { name: font.name });
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    logger.error('[Fonts API] POST error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Failed to add font' }, { status: 500 });
  }
});

// PUT — Set font as primary or secondary (also updates BrandKit)
export const PUT = withAdminGuard(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { fontName, role } = body as { fontName: string; role: 'primary' | 'secondary' };

    if (!fontName || !role || !['primary', 'secondary'].includes(role)) {
      return NextResponse.json({ error: 'fontName and role (primary|secondary) required' }, { status: 400 });
    }

    const data = await getFontsData();

    if (!data.fonts.some((f) => f.name === fontName)) {
      return NextResponse.json({ error: 'Font not found' }, { status: 404 });
    }

    if (role === 'primary') {
      data.primary = fontName;
    } else {
      data.secondary = fontName;
    }

    await saveFontsData(data);

    // Also update BrandKit font references
    try {
      const brandKit = await prisma.brandKit.findFirst({ where: { isActive: true } });
      if (brandKit) {
        await prisma.brandKit.update({
          where: { id: brandKit.id },
          data: role === 'primary' ? { fontHeading: fontName } : { fontBody: fontName },
        });
      }
    } catch {
      // BrandKit update is optional — don't fail the request
    }

    logger.info('[Fonts API] Font role set', { fontName, role });
    return NextResponse.json(data);
  } catch (error) {
    logger.error('[Fonts API] PUT error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Failed to update font' }, { status: 500 });
  }
});

// DELETE — Remove a font
export const DELETE = withAdminGuard(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { fontName } = body as { fontName: string };

    if (!fontName) {
      return NextResponse.json({ error: 'fontName is required' }, { status: 400 });
    }

    const data = await getFontsData();
    const idx = data.fonts.findIndex((f) => f.name === fontName);

    if (idx === -1) {
      return NextResponse.json({ error: 'Font not found' }, { status: 404 });
    }

    data.fonts.splice(idx, 1);

    // Clear primary/secondary if the deleted font was active
    if (data.primary === fontName) data.primary = null;
    if (data.secondary === fontName) data.secondary = null;

    await saveFontsData(data);
    logger.info('[Fonts API] Font deleted', { fontName });
    return NextResponse.json(data);
  } catch (error) {
    logger.error('[Fonts API] DELETE error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Failed to delete font' }, { status: 500 });
  }
});
