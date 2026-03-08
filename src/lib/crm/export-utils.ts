/**
 * CRM Export Utilities
 * CSV and basic PDF generation for CRM reports.
 */

/**
 * Convert an array of objects to CSV string.
 */
export function toCSV(
  data: Record<string, unknown>[],
  columns?: { key: string; label: string }[],
): string {
  if (data.length === 0) return '';

  const cols = columns || Object.keys(data[0]).map(k => ({ key: k, label: k }));
  const header = cols.map(c => escapeCsvField(c.label)).join(',');

  const rows = data.map(row =>
    cols.map(c => {
      const val = row[c.key];
      if (val === null || val === undefined) return '';
      if (val instanceof Date) return val.toISOString();
      if (typeof val === 'object') return escapeCsvField(JSON.stringify(val));
      return escapeCsvField(String(val));
    }).join(',')
  );

  return [header, ...rows].join('\n');
}

function escapeCsvField(field: string): string {
  // Prevent CSV formula injection: prefix dangerous chars with a single quote
  // Characters =, +, -, @, \t, \r can trigger formula execution in Excel/Sheets
  let safe = field;
  if (/^[=+\-@\t\r]/.test(safe)) {
    safe = `'${safe}`;
  }
  if (safe.includes(',') || safe.includes('"') || safe.includes('\n') || safe.includes("'")) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

/**
 * Generate a CSV download Response for Next.js API routes.
 */
export function csvResponse(
  data: Record<string, unknown>[],
  filename: string,
  columns?: { key: string; label: string }[],
): Response {
  const csv = toCSV(data, columns);
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

/**
 * Format number as currency string.
 */
export function formatCurrency(value: number, currency: string = 'CAD'): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format seconds as duration string.
 */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}
