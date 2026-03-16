export const dynamic = 'force-dynamic';

/**
 * Google Maps Scraper — Excel Export
 * POST /api/admin/scraper/export-excel
 *
 * Accepts pre-scraped results array OR scrape params.
 * If results are provided, exports directly (instant).
 * If only query params, re-scrapes (slow, legacy support).
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { apiError } from '@/lib/api-response';
import ExcelJS from 'exceljs';

const placeSchema = z.object({
  name: z.string(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  province: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  googleRating: z.number().nullable().optional(),
  googleReviewCount: z.number().nullable().optional(),
  category: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  openingHours: z.array(z.string()).nullable().optional(),
  googleMapsUrl: z.string().nullable().optional(),
});

const exportSchema = z.object({
  results: z.array(placeSchema).min(1, 'Results are required for export'),
  locale: z.string().max(5).optional(),
});

const COLUMN_DEFS = [
  { key: 'name', width: 30 },
  { key: 'address', width: 40 },
  { key: 'city', width: 20 },
  { key: 'province', width: 10 },
  { key: 'postalCode', width: 12 },
  { key: 'country', width: 10 },
  { key: 'phone', width: 18 },
  { key: 'email', width: 30 },
  { key: 'website', width: 35 },
  { key: 'googleRating', width: 12 },
  { key: 'googleReviewCount', width: 12 },
  { key: 'category', width: 25 },
  { key: 'latitude', width: 14 },
  { key: 'longitude', width: 14 },
  { key: 'googleMapsUrl', width: 50 },
];

const HEADERS_I18N: Record<string, string[]> = {
  fr: ['Nom', 'Adresse', 'Ville', 'Province', 'Code Postal', 'Pays', 'T\u00e9l\u00e9phone', 'Email', 'Site Web', 'Note Google', 'Avis Google', 'Cat\u00e9gorie', 'Latitude', 'Longitude', 'Lien Google Maps'],
  en: ['Name', 'Address', 'City', 'Province', 'Postal Code', 'Country', 'Phone', 'Email', 'Website', 'Google Rating', 'Google Reviews', 'Category', 'Latitude', 'Longitude', 'Google Maps Link'],
  es: ['Nombre', 'Direcci\u00f3n', 'Ciudad', 'Provincia', 'C\u00f3digo Postal', 'Pa\u00eds', 'Tel\u00e9fono', 'Email', 'Sitio Web', 'Nota Google', 'Rese\u00f1as Google', 'Categor\u00eda', 'Latitud', 'Longitud', 'Enlace Google Maps'],
  de: ['Name', 'Adresse', 'Stadt', 'Provinz', 'Postleitzahl', 'Land', 'Telefon', 'Email', 'Webseite', 'Google-Bewertung', 'Google-Bewertungen', 'Kategorie', 'Breitengrad', 'L\u00e4ngengrad', 'Google Maps Link'],
  pt: ['Nome', 'Endere\u00e7o', 'Cidade', 'Prov\u00edncia', 'CEP', 'Pa\u00eds', 'Telefone', 'Email', 'Site', 'Nota Google', 'Avalia\u00e7\u00f5es Google', 'Categoria', 'Latitude', 'Longitude', 'Link Google Maps'],
};

function getColumns(locale?: string) {
  const headers = (locale && HEADERS_I18N[locale]) ? HEADERS_I18N[locale] : HEADERS_I18N.fr;
  return COLUMN_DEFS.map((def, i) => ({ ...def, header: headers[i] }));
}

export const POST = withAdminGuard(async (request: NextRequest) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid JSON body', 'VALIDATION_ERROR', { status: 400, request });
  }

  const parsed = exportSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('Invalid input', 'VALIDATION_ERROR', { status: 400, request });
  }

  try {
    const results = parsed.data.results;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'BioCycle Peptides - LeadEngine';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Google Maps', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    sheet.columns = getColumns(parsed.data.locale);

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    for (const place of results) {
      sheet.addRow({
        name: place.name,
        address: place.address || '',
        city: place.city || '',
        province: place.province || '',
        postalCode: place.postalCode || '',
        country: place.country || '',
        phone: place.phone || '',
        email: place.email || '',
        website: place.website || '',
        googleRating: place.googleRating,
        googleReviewCount: place.googleReviewCount,
        category: place.category || '',
        latitude: place.latitude,
        longitude: place.longitude,
        googleMapsUrl: place.googleMapsUrl || '',
      });
    }

    sheet.autoFilter = {
      from: 'A1',
      to: `O${results.length + 1}`,
    };

    const buffer = await workbook.xlsx.writeBuffer();
    const today = new Date().toISOString().slice(0, 10);

    return new Response(buffer as ArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="google-maps-export-${today}.xlsx"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Export failed';
    return apiError('Google Maps export failed', 'EXTERNAL_SERVICE_ERROR', { status: 502, details: message, request });
  }
}, { rateLimit: 10 });
