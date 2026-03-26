export const dynamic = 'force-dynamic';

/**
 * Admin Email Attachments API
 * POST - Upload file attachments for email composition
 *
 * Accepts multipart/form-data with one or more files.
 * Returns base64-encoded file data for inclusion in email send payload.
 *
 * Constraints:
 * - Max 10MB per file
 * - Max 25MB total across all files
 * - Allowed types: pdf, doc, docx, xls, xlsx, csv, png, jpg, jpeg, gif
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminGuard } from '@/lib/admin-api-guard';
import { logger } from '@/lib/logger';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB per file
const MAX_TOTAL_SIZE = 25 * 1024 * 1024; // 25 MB total

const ALLOWED_EXTENSIONS = new Set([
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv',
  'png', 'jpg', 'jpeg', 'gif',
]);

const MIME_MAP: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
};

// Magic bytes for file type verification
const MAGIC_BYTES: Record<string, { offset: number; bytes: number[] }[]> = {
  pdf: [{ offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] }], // %PDF
  png: [{ offset: 0, bytes: [0x89, 0x50, 0x4E, 0x47] }], // .PNG
  jpg: [{ offset: 0, bytes: [0xFF, 0xD8, 0xFF] }],
  jpeg: [{ offset: 0, bytes: [0xFF, 0xD8, 0xFF] }],
  gif: [{ offset: 0, bytes: [0x47, 0x49, 0x46] }], // GIF
  doc: [{ offset: 0, bytes: [0xD0, 0xCF, 0x11, 0xE0] }], // OLE2
  xls: [{ offset: 0, bytes: [0xD0, 0xCF, 0x11, 0xE0] }], // OLE2
  docx: [{ offset: 0, bytes: [0x50, 0x4B, 0x03, 0x04] }], // ZIP (OOXML)
  xlsx: [{ offset: 0, bytes: [0x50, 0x4B, 0x03, 0x04] }], // ZIP (OOXML)
};

function validateMagicBytes(buffer: ArrayBuffer, ext: string): boolean {
  const signatures = MAGIC_BYTES[ext];
  if (!signatures) return true; // csv has no magic bytes
  const view = new Uint8Array(buffer);
  return signatures.some(sig =>
    sig.bytes.every((byte, i) => view[sig.offset + i] === byte)
  );
}

function getExtension(filename: string): string {
  return (filename.split('.').pop() || '').toLowerCase();
}

export const POST = withAdminGuard(async (request: NextRequest) => {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Content-Type must be multipart/form-data' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('files');

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    let totalSize = 0;
    const attachments: Array<{
      filename: string;
      content: string; // base64
      contentType: string;
      size: number;
    }> = [];

    for (const file of files) {
      if (!(file instanceof File)) {
        continue;
      }

      const ext = getExtension(file.name);
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        return NextResponse.json(
          { error: `File type ".${ext}" is not allowed. Allowed: ${Array.from(ALLOWED_EXTENSIONS).join(', ')}` },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds the 10MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB)` },
          { status: 400 }
        );
      }

      totalSize += file.size;
      if (totalSize > MAX_TOTAL_SIZE) {
        return NextResponse.json(
          { error: `Total attachment size exceeds the 25MB limit` },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();

      if (!validateMagicBytes(arrayBuffer, ext)) {
        return NextResponse.json(
          { error: `File "${file.name}" content does not match its extension ".${ext}"` },
          { status: 400 }
        );
      }

      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const contentTypeForFile = MIME_MAP[ext] || file.type || 'application/octet-stream';

      attachments.push({
        filename: file.name,
        content: base64,
        contentType: contentTypeForFile,
        size: file.size,
      });
    }

    logger.info('[Attachments] Files uploaded', {
      count: attachments.length,
      totalSize,
      filenames: attachments.map(a => a.filename),
    });

    return NextResponse.json({
      attachments: attachments.map(a => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
        size: a.size,
      })),
    });
  } catch (error) {
    logger.error('[Attachments] Upload error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
