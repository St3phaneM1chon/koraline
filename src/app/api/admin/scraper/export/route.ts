export const dynamic = 'force-dynamic';

/**
 * Google Maps Scraper — CSV Export
 * POST /api/admin/scraper/export
 *
 * Accepts pre-scraped results array OR scrape params.
 * If results are provided, exports directly (instant).
 * If only query params, re-scrapes (slow, legacy support).
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { apiError } from '@/lib/api-response';
import { generateCSV } from '@/lib/csv-export';

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

const HEADERS_I18N: Record<string, string[]> = {
  fr: ['Nom', 'Adresse', 'Ville', 'Province', 'Code Postal', 'Pays', 'T\u00e9l\u00e9phone', 'Email', 'Site Web', 'Note Google', 'Avis Google', 'Cat\u00e9gorie', 'Latitude', 'Longitude', 'Lien Google Maps'],
  en: ['Name', 'Address', 'City', 'Province', 'Postal Code', 'Country', 'Phone', 'Email', 'Website', 'Google Rating', 'Google Reviews', 'Category', 'Latitude', 'Longitude', 'Google Maps Link'],
  es: ['Nombre', 'Direcci\u00f3n', 'Ciudad', 'Provincia', 'C\u00f3digo Postal', 'Pa\u00eds', 'Tel\u00e9fono', 'Email', 'Sitio Web', 'Nota Google', 'Rese\u00f1as Google', 'Categor\u00eda', 'Latitud', 'Longitud', 'Enlace Google Maps'],
  de: ['Name', 'Adresse', 'Stadt', 'Provinz', 'Postleitzahl', 'Land', 'Telefon', 'Email', 'Webseite', 'Google-Bewertung', 'Google-Bewertungen', 'Kategorie', 'Breitengrad', 'L\u00e4ngengrad', 'Google Maps Link'],
  pt: ['Nome', 'Endere\u00e7o', 'Cidade', 'Prov\u00edncia', 'CEP', 'Pa\u00eds', 'Telefone', 'Email', 'Site', 'Nota Google', 'Avalia\u00e7\u00f5es Google', 'Categoria', 'Latitude', 'Longitude', 'Link Google Maps'],
};

function getHeaders(locale?: string): string[] {
  if (locale && HEADERS_I18N[locale]) return HEADERS_I18N[locale];
  return HEADERS_I18N.fr;
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
    return apiError('Invalid input', 'VALIDATION_ERROR', { status: 400, details: parsed.error.flatten(), request });
  }

  try {
    const results = parsed.data.results;
    const csvHeaders = getHeaders(parsed.data.locale);

    const rows = results.map((place) => [
      place.name,
      place.address || '',
      place.city || '',
      place.province || '',
      place.postalCode || '',
      place.country || '',
      place.phone || '',
      place.email || '',
      place.website || '',
      place.googleRating != null ? String(place.googleRating) : '',
      place.googleReviewCount != null ? String(place.googleReviewCount) : '',
      place.category || '',
      place.latitude != null ? String(place.latitude) : '',
      place.longitude != null ? String(place.longitude) : '',
      place.googleMapsUrl || '',
    ]);

    const csv = generateCSV(csvHeaders, rows);
    const today = new Date().toISOString().slice(0, 10);

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="google-maps-export-${today}.csv"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Export failed';
    return apiError('Google Maps export failed', 'EXTERNAL_SERVICE_ERROR', { status: 502, details: message, request });
  }
}, { rateLimit: 10 });
