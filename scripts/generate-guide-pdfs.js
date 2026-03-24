#!/usr/bin/env node

/**
 * generate-guide-pdfs.js
 *
 * Generates print-ready HTML files from user guide markdown files.
 * Produces 3 types of output:
 *   - Master HTML: complete guide with all 127 pages
 *   - Section HTMLs: one per section (13 files)
 *   - Individual HTMLs: one per guide page (127 files)
 *
 * Usage: node scripts/generate-guide-pdfs.js
 *
 * Output: docs/user-guide/pdf/
 */

const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────

const GUIDE_DIR = path.join(__dirname, '..', 'docs', 'user-guide');
const OUTPUT_DIR = path.join(GUIDE_DIR, 'pdf');
const INDIVIDUAL_DIR = path.join(OUTPUT_DIR, 'individual');

const SECTIONS = [
  { dir: '00-introduction', label: '00 — Introduction',         shortLabel: 'Introduction' },
  { dir: '01-dashboard',    label: '01 — Tableau de bord',      shortLabel: 'Dashboard' },
  { dir: '02-commerce',     label: '02 — Commerce',             shortLabel: 'Commerce' },
  { dir: '03-catalogue',    label: '03 — Catalogue',            shortLabel: 'Catalogue' },
  { dir: '04-marketing',    label: '04 — Marketing',            shortLabel: 'Marketing' },
  { dir: '05-communaute',   label: '05 — Communaute',           shortLabel: 'Communaute' },
  { dir: '06-fidelite',     label: '06 — Fidelite',             shortLabel: 'Fidelite' },
  { dir: '07-media',        label: '07 — Media',                shortLabel: 'Media' },
  { dir: '08-emails',       label: '08 — Emails',               shortLabel: 'Emails' },
  { dir: '09-telephonie',   label: '09 — Telephonie',           shortLabel: 'Telephonie' },
  { dir: '10-crm',          label: '10 — CRM',                  shortLabel: 'CRM' },
  { dir: '11-comptabilite', label: '11 — Comptabilite',         shortLabel: 'Comptabilite' },
  { dir: '12-systeme',      label: '12 — Systeme',              shortLabel: 'Systeme' },
];

const TODAY = new Date().toISOString().slice(0, 10);

// ─────────────────────────────────────────────────
// CSS Template
// ─────────────────────────────────────────────────

const CSS = `
  /* ── Reset & Base ── */
  *, *::before, *::after { box-sizing: border-box; }

  @page {
    margin: 2cm 2.5cm;
    size: A4;
    @bottom-center {
      content: counter(page);
      font-size: 9pt;
      color: #999;
    }
  }

  @media print {
    .page-break { page-break-before: always; }
    .no-print { display: none !important; }
    .toc-container { page-break-after: always; }
    h1, h2, h3 { page-break-after: avoid; }
    table, figure, pre { page-break-inside: avoid; }
    body { font-size: 10pt; }
    a { color: #0066CC !important; text-decoration: none !important; }
    a[href]::after { content: none !important; }
  }

  body {
    font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    line-height: 1.7;
    color: #2c3e50;
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem 2.5rem;
    background: #fff;
    -webkit-font-smoothing: antialiased;
  }

  /* ── Typography ── */
  h1 {
    color: #0066CC;
    font-size: 1.8rem;
    font-weight: 700;
    border-bottom: 3px solid #0066CC;
    padding-bottom: 0.6rem;
    margin-top: 2.5rem;
    margin-bottom: 1.2rem;
    letter-spacing: -0.02em;
  }

  h2 {
    color: #003366;
    font-size: 1.4rem;
    font-weight: 600;
    margin-top: 2.2rem;
    margin-bottom: 0.8rem;
    padding-bottom: 0.3rem;
    border-bottom: 1px solid #e0e8f0;
  }

  h3 {
    color: #004488;
    font-size: 1.15rem;
    font-weight: 600;
    margin-top: 1.8rem;
    margin-bottom: 0.6rem;
  }

  h4 {
    color: #335577;
    font-size: 1.05rem;
    font-weight: 600;
    margin-top: 1.4rem;
    margin-bottom: 0.5rem;
  }

  p {
    margin: 0.6rem 0;
    text-align: justify;
    hyphens: auto;
  }

  /* ── Links ── */
  a {
    color: #0066CC;
    text-decoration: none;
    border-bottom: 1px solid rgba(0, 102, 204, 0.2);
    transition: border-color 0.2s;
  }
  a:hover { border-bottom-color: #0066CC; }

  /* ── Tables ── */
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 1.2rem 0;
    font-size: 0.92em;
    border: 1px solid #d0d7de;
    border-radius: 6px;
    overflow: hidden;
  }

  thead { background: #f0f4f8; }
  th {
    font-weight: 600;
    color: #003366;
    text-align: left;
    padding: 10px 14px;
    border-bottom: 2px solid #0066CC;
    font-size: 0.88em;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  td {
    padding: 9px 14px;
    border-bottom: 1px solid #e8ecf0;
    vertical-align: top;
  }
  tr:nth-child(even) { background: #f8fafc; }
  tr:hover { background: #eef3f8; }

  /* ── Code ── */
  code {
    background: #f0f4f8;
    padding: 2px 7px;
    border-radius: 4px;
    font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
    font-size: 0.88em;
    color: #c7254e;
    border: 1px solid #e0e8f0;
  }

  pre {
    background: #1e293b;
    color: #e2e8f0;
    padding: 1.2rem 1.4rem;
    border-radius: 8px;
    overflow-x: auto;
    font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
    font-size: 0.85em;
    line-height: 1.6;
    margin: 1.2rem 0;
    border: 1px solid #334155;
  }

  pre code {
    background: none;
    border: none;
    padding: 0;
    color: inherit;
    font-size: inherit;
  }

  /* ── Blockquotes ── */
  blockquote {
    border-left: 4px solid #0066CC;
    padding: 0.8rem 1.2rem;
    margin: 1.2rem 0;
    background: #f0f6ff;
    border-radius: 0 6px 6px 0;
    color: #334155;
    font-style: italic;
  }

  blockquote p { margin: 0.3rem 0; text-align: left; }
  blockquote strong { color: #0066CC; font-style: normal; }

  /* ── Lists ── */
  ul, ol {
    padding-left: 1.8rem;
    margin: 0.8rem 0;
  }
  li {
    margin: 0.35rem 0;
    line-height: 1.6;
  }
  li > ul, li > ol { margin: 0.2rem 0; }

  /* ── Horizontal Rule ── */
  hr {
    border: none;
    border-top: 2px solid #e0e8f0;
    margin: 2rem 0;
  }

  /* ── Images (placeholder) ── */
  img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    border: 1px solid #e0e8f0;
    margin: 1rem 0;
    display: block;
  }

  /* ── Cover Page ── */
  .cover {
    text-align: center;
    padding: 6rem 2rem 4rem;
    min-height: 80vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .cover-logo {
    width: 120px;
    height: 120px;
    background: linear-gradient(135deg, #0066CC 0%, #003366 100%);
    border-radius: 24px;
    margin: 0 auto 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 2.8rem;
    font-weight: 700;
    letter-spacing: -0.05em;
    box-shadow: 0 8px 30px rgba(0, 102, 204, 0.25);
  }

  .cover h1 {
    font-size: 2.6rem;
    border: none;
    padding: 0;
    margin: 0 0 0.8rem;
    color: #003366;
    letter-spacing: -0.03em;
  }

  .cover .subtitle {
    font-size: 1.25rem;
    color: #5a6f84;
    margin: 0.5rem 0;
    font-weight: 400;
  }

  .cover .version {
    font-size: 0.95rem;
    color: #8899aa;
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e0e8f0;
  }

  .cover .brand {
    color: #0066CC;
    font-weight: 600;
    font-size: 1.1rem;
    margin-top: 0.5rem;
  }

  /* ── Table of Contents ── */
  .toc-container {
    margin: 2rem 0 3rem;
  }

  .toc-container h2 {
    font-size: 1.5rem;
    text-align: center;
    border-bottom: 3px solid #0066CC;
    padding-bottom: 0.8rem;
    margin-bottom: 1.5rem;
  }

  .toc {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .toc > li {
    margin: 0;
    padding: 0;
  }

  .toc-section {
    font-weight: 600;
    color: #003366;
    font-size: 1.05rem;
    padding: 0.6rem 0 0.3rem;
    margin-top: 0.8rem;
    border-bottom: 1px solid #f0f4f8;
  }

  .toc-section:first-child { margin-top: 0; }

  .toc-pages {
    list-style: none;
    padding: 0 0 0 1.2rem;
    margin: 0;
  }

  .toc-pages li {
    margin: 0;
    padding: 0;
  }

  .toc-pages a {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 0.25rem 0.5rem;
    border-bottom: none;
    border-radius: 4px;
    text-decoration: none;
    color: #4a5568;
    font-size: 0.93rem;
    transition: background 0.15s;
  }

  .toc-pages a:hover {
    background: #f0f6ff;
    color: #0066CC;
  }

  .toc-pages a .toc-dots {
    flex: 1;
    border-bottom: 1px dotted #ccd5de;
    margin: 0 0.5rem;
    min-width: 2rem;
  }

  /* ── Header bar ── */
  .doc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.8rem 0;
    margin-bottom: 1.5rem;
    border-bottom: 2px solid #0066CC;
    font-size: 0.85rem;
    color: #5a6f84;
  }

  .doc-header .brand-name {
    font-weight: 700;
    color: #0066CC;
    font-size: 0.95rem;
  }

  /* ── Footer ── */
  .doc-footer {
    text-align: center;
    color: #8899aa;
    font-size: 0.8rem;
    margin-top: 3rem;
    padding-top: 1.2rem;
    border-top: 1px solid #e0e8f0;
  }

  .doc-footer .brand {
    color: #0066CC;
    font-weight: 600;
  }

  /* ── Print-specific button ── */
  .print-btn {
    position: fixed;
    top: 20px;
    right: 20px;
    background: #0066CC;
    color: white;
    border: none;
    padding: 10px 22px;
    border-radius: 8px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 102, 204, 0.3);
    z-index: 1000;
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .print-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(0, 102, 204, 0.4);
  }

  /* ── Section separator ── */
  .section-separator {
    margin: 3rem 0;
    padding: 2rem 0;
    border-top: 3px solid #0066CC;
    text-align: center;
  }
  .section-separator h1 {
    border: none;
    font-size: 2rem;
    color: #003366;
  }
  .section-separator .section-desc {
    color: #5a6f84;
    font-size: 1rem;
  }

  /* ── Emoji / Icon badges ── */
  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.8em;
    font-weight: 600;
    background: #e8f4ff;
    color: #0066CC;
  }
`;

// ─────────────────────────────────────────────────
// Markdown to HTML converter
// ─────────────────────────────────────────────────

function mdToHtml(md) {
  // Normalize line endings
  let text = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // ── Phase 1: Extract and protect blocks that should not be processed inline ──

  const protectedBlocks = [];
  function protect(html) {
    const idx = protectedBlocks.length;
    protectedBlocks.push(html);
    return `\x00BLOCK${idx}\x00`;
  }

  // Fenced code blocks (```lang ... ```)
  text = text.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();
    const langAttr = lang ? ` data-lang="${lang}"` : '';
    return protect(`<pre${langAttr}><code>${escaped}</code></pre>`);
  });

  // Image references (screenshots won't be available in PDF)
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, (match, alt) => {
    return protect(`<div style="background:#f0f4f8; border:1px dashed #ccd5de; border-radius:8px; padding:1.5rem; text-align:center; color:#8899aa; margin:1rem 0; font-size:0.9em;">[Illustration : ${alt}]</div>`);
  });

  // Tables: find consecutive lines starting with |
  text = text.replace(/((?:^\|.+\|\n?){2,})/gm, (tableBlock) => {
    const rows = tableBlock.trim().split('\n');
    if (rows.length < 2) return tableBlock;

    // Check if the second row is a separator row (|---|---|)
    const isSep = /^\|[-\s:|]+$/.test(rows[1].trim());
    if (!isSep) return tableBlock;

    const parseRow = (row, tag) => {
      const cells = row.split('|').slice(1, -1);
      return '  <tr>' + cells.map(c => {
        // Apply inline formatting within cells
        let cell = c.trim();
        cell = cell.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
        cell = cell.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        cell = cell.replace(/\*(.*?)\*/g, '<em>$1</em>');
        cell = cell.replace(/`([^`]+)`/g, '<code>$1</code>');
        cell = cell.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
        return `<${tag}>${cell}</${tag}>`;
      }).join('') + '</tr>';
    };

    const headerHtml = parseRow(rows[0], 'th');
    const bodyHtml = rows.slice(2)
      .filter(r => r.trim() !== '')
      .map(r => parseRow(r, 'td'))
      .join('\n');

    return protect(`<table>\n<thead>\n  ${headerHtml}\n</thead>\n<tbody>\n${bodyHtml}\n</tbody>\n</table>`);
  });

  // ── Phase 2: Line-by-line processing ──

  const lines = text.split('\n');
  const output = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Protected block placeholder — pass through
    if (line.includes('\x00BLOCK')) {
      output.push(line);
      i++;
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      output.push('');
      i++;
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      output.push('<hr>');
      i++;
      continue;
    }

    // Headings
    const h4Match = line.match(/^#### (.+)$/);
    if (h4Match) { output.push(`<h4>${inlineFormat(h4Match[1])}</h4>`); i++; continue; }
    const h3Match = line.match(/^### (.+)$/);
    if (h3Match) { output.push(`<h3>${inlineFormat(h3Match[1])}</h3>`); i++; continue; }
    const h2Match = line.match(/^## (.+)$/);
    if (h2Match) { output.push(`<h2>${inlineFormat(h2Match[1])}</h2>`); i++; continue; }
    const h1Match = line.match(/^# (.+)$/);
    if (h1Match) { output.push(`<h1>${inlineFormat(h1Match[1])}</h1>`); i++; continue; }

    // Blockquotes (collect consecutive > lines)
    if (/^> /.test(line)) {
      const bqLines = [];
      while (i < lines.length && /^> /.test(lines[i])) {
        bqLines.push(lines[i].replace(/^> /, ''));
        i++;
      }
      const bqContent = bqLines.map(l => `<p>${inlineFormat(l)}</p>`).join('\n');
      output.push(`<blockquote>\n${bqContent}\n</blockquote>`);
      continue;
    }

    // Ordered list (collect consecutive numbered lines)
    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''));
        i++;
      }
      const listHtml = items.map(item => `<li>${inlineFormat(item)}</li>`).join('\n');
      output.push(`<ol>\n${listHtml}\n</ol>`);
      continue;
    }

    // Unordered list (collect consecutive - or * lines)
    if (/^[\t ]*[-*]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^[\t ]*[-*]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[\t ]*[-*]\s+/, ''));
        i++;
      }
      const listHtml = items.map(item => `<li>${inlineFormat(item)}</li>`).join('\n');
      output.push(`<ul>\n${listHtml}\n</ul>`);
      continue;
    }

    // Regular paragraph
    output.push(`<p>${inlineFormat(line)}</p>`);
    i++;
  }

  // ── Phase 3: Restore protected blocks and return ──

  let html = output.join('\n');

  // Restore protected blocks
  html = html.replace(/\x00BLOCK(\d+)\x00/g, (match, idx) => protectedBlocks[parseInt(idx)]);

  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');

  return html;
}

/**
 * Apply inline markdown formatting to a string.
 */
function inlineFormat(text) {
  let s = text;
  // Bold+italic
  s = s.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  // Bold
  s = s.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic
  s = s.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Inline code
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Links
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return s;
}

// ─────────────────────────────────────────────────
// HTML Document Wrappers
// ─────────────────────────────────────────────────

function htmlDocument(title, bodyContent, options = {}) {
  const { showPrintBtn = true, sectionLabel = '', dateStr = TODAY } = options;

  const header = sectionLabel
    ? `<div class="doc-header no-print">
        <span class="brand-name">BioCycle Peptides</span>
        <span>Suite Koraline &mdash; ${sectionLabel}</span>
        <span>${dateStr}</span>
      </div>`
    : '';

  const printBtn = showPrintBtn
    ? `<button class="print-btn no-print" onclick="window.print()">Imprimer / PDF</button>`
    : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)} &mdash; Suite Koraline</title>
<style>${CSS}</style>
</head>
<body>
${printBtn}
${header}
${bodyContent}
<div class="doc-footer">
  <span class="brand">BioCycle Peptides</span> &mdash; Suite Koraline &mdash; Guide Utilisateur<br>
  Document genere le ${dateStr} &mdash; Version 1.0<br>
  &copy; ${new Date().getFullYear()} BioCycle Peptides Inc. Tous droits reserves.
</div>
</body>
</html>`;
}

function coverPage(title, subtitle, pageCount) {
  return `
<div class="cover">
  <div class="cover-logo">K</div>
  <h1>${escapeHtml(title)}</h1>
  <div class="subtitle">${escapeHtml(subtitle)}</div>
  <div class="version">
    <div class="brand">BioCycle Peptides Inc.</div>
    Version 1.0 &mdash; ${TODAY}<br>
    ${pageCount} pages &mdash; 13 sections
  </div>
</div>`;
}

function sectionCoverPage(label, pageCount) {
  return `
<div class="cover" style="min-height: 40vh; padding: 3rem 2rem;">
  <div class="cover-logo" style="width:80px; height:80px; font-size:1.8rem; border-radius:16px;">K</div>
  <h1 style="font-size:2rem;">${escapeHtml(label)}</h1>
  <div class="subtitle">Guide Utilisateur &mdash; Suite Koraline</div>
  <div class="version">
    ${pageCount} page${pageCount > 1 ? 's' : ''} dans cette section<br>
    ${TODAY}
  </div>
</div>`;
}

function generateToc(sections, allFiles) {
  let html = '<div class="toc-container">\n<h2>Table des matieres</h2>\n<ul class="toc">\n';

  for (const section of sections) {
    const files = allFiles.filter(f => f.section === section.dir);
    if (files.length === 0) continue;

    html += `<li class="toc-section">${escapeHtml(section.label)}</li>\n`;
    html += '<ul class="toc-pages">\n';
    for (const file of files) {
      html += `<li><a href="#${file.anchor}"><span>${escapeHtml(file.title)}</span><span class="toc-dots"></span></a></li>\n`;
    }
    html += '</ul>\n';
  }

  html += '</ul>\n</div>';
  return html;
}

function generateSectionToc(files) {
  if (files.length <= 1) return '';

  let html = '<div class="toc-container" style="margin:1rem 0 2rem;">\n<h2>Contenu de cette section</h2>\n<ul class="toc">\n';
  html += '<ul class="toc-pages">\n';
  for (const file of files) {
    html += `<li><a href="#${file.anchor}"><span>${escapeHtml(file.title)}</span><span class="toc-dots"></span></a></li>\n`;
  }
  html += '</ul>\n</ul>\n</div>';
  return html;
}

// ─────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function extractTitle(md) {
  const match = md.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : 'Sans titre';
}

function slugify(str) {
  return str.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function getMarkdownFiles(sectionDir) {
  const dirPath = path.join(GUIDE_DIR, sectionDir);
  if (!fs.existsSync(dirPath)) return [];

  return fs.readdirSync(dirPath)
    .filter(f => f.endsWith('.md'))
    .sort()
    .map(filename => {
      const filePath = path.join(dirPath, filename);
      const content = fs.readFileSync(filePath, 'utf-8');
      const title = extractTitle(content);
      const baseName = path.basename(filename, '.md');
      return {
        filename,
        baseName,
        filePath,
        content,
        title,
        section: sectionDir,
        anchor: `${sectionDir}--${baseName}`,
      };
    });
}

// ─────────────────────────────────────────────────
// Generation Functions
// ─────────────────────────────────────────────────

function generateIndividualPage(file, sectionLabel) {
  const htmlContent = mdToHtml(file.content);
  return htmlDocument(file.title, htmlContent, { sectionLabel });
}

function generateSectionPage(section, files) {
  let body = sectionCoverPage(section.label, files.length);
  body += generateSectionToc(files);

  for (let i = 0; i < files.length; i++) {
    if (i > 0) body += '<div class="page-break"></div>\n';
    body += `<div id="${files[i].anchor}">\n`;
    body += mdToHtml(files[i].content);
    body += '\n</div>\n';
  }

  return htmlDocument(section.label, body, { sectionLabel: section.label });
}

function generateMasterDocument(allFiles) {
  let body = coverPage(
    'Guide Utilisateur Complet',
    'Suite Koraline &mdash; Documentation exhaustive de l\'interface d\'administration',
    allFiles.length
  );

  body += '<div class="page-break"></div>\n';
  body += generateToc(SECTIONS, allFiles);

  let currentSection = '';
  for (let i = 0; i < allFiles.length; i++) {
    const file = allFiles[i];

    // Section separator
    if (file.section !== currentSection) {
      currentSection = file.section;
      const section = SECTIONS.find(s => s.dir === currentSection);
      const sectionFiles = allFiles.filter(f => f.section === currentSection);
      body += '<div class="page-break"></div>\n';
      body += `<div class="section-separator">\n`;
      body += `  <h1>${escapeHtml(section ? section.label : currentSection)}</h1>\n`;
      body += `  <div class="section-desc">${sectionFiles.length} page${sectionFiles.length > 1 ? 's' : ''}</div>\n`;
      body += `</div>\n`;
    }

    body += '<div class="page-break"></div>\n';
    body += `<div id="${file.anchor}">\n`;
    body += mdToHtml(file.content);
    body += '\n</div>\n';
  }

  return htmlDocument('Guide Complet Koraline', body, { sectionLabel: 'Guide Complet' });
}

// ─────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────

function main() {
  console.log('='.repeat(60));
  console.log('  Guide Utilisateur Koraline - Generateur HTML/PDF');
  console.log('  BioCycle Peptides Inc.');
  console.log('='.repeat(60));
  console.log();

  // Prepare output directories
  ensureDir(OUTPUT_DIR);
  ensureDir(INDIVIDUAL_DIR);

  // Collect all files
  const allFiles = [];
  const sectionData = [];

  for (const section of SECTIONS) {
    const files = getMarkdownFiles(section.dir);
    if (files.length === 0) {
      console.log(`  [SKIP] ${section.label} - aucun fichier markdown`);
      continue;
    }
    sectionData.push({ section, files });
    allFiles.push(...files);
    console.log(`  [OK]   ${section.label} - ${files.length} fichier${files.length > 1 ? 's' : ''}`);
  }

  console.log();
  console.log(`  Total: ${allFiles.length} pages dans ${sectionData.length} sections`);
  console.log();

  // ── Phase 1: Individual pages ──
  console.log('Phase 1/3 : Generation des pages individuelles...');
  let individualCount = 0;

  for (const { section, files } of sectionData) {
    const sectionOutDir = path.join(INDIVIDUAL_DIR, section.dir);
    ensureDir(sectionOutDir);

    for (const file of files) {
      const outPath = path.join(sectionOutDir, `${file.baseName}.html`);
      const html = generateIndividualPage(file, section.label);
      fs.writeFileSync(outPath, html, 'utf-8');
      individualCount++;
    }
  }

  console.log(`  -> ${individualCount} fichiers individuels generes`);
  console.log();

  // ── Phase 2: Section pages ──
  console.log('Phase 2/3 : Generation des pages par section...');
  let sectionCount = 0;

  for (const { section, files } of sectionData) {
    // Clean section dir name for the filename (e.g., "02-Commerce")
    const label = section.dir.replace(/^(\d+)-/, (m, num) => `${num}-`);
    const sectionFileName = label.charAt(0).toUpperCase() + label.slice(1);
    // Capitalize after dash
    const prettyName = section.dir.split('-').map((part, i) => {
      if (i === 0) return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    }).join('-');

    const outPath = path.join(OUTPUT_DIR, `${prettyName}.html`);
    const html = generateSectionPage(section, files);
    fs.writeFileSync(outPath, html, 'utf-8');
    sectionCount++;
    console.log(`  [OK] ${prettyName}.html (${files.length} pages)`);
  }

  console.log(`  -> ${sectionCount} fichiers section generes`);
  console.log();

  // ── Phase 3: Master document ──
  console.log('Phase 3/3 : Generation du document maitre...');

  const masterPath = path.join(OUTPUT_DIR, 'Guide_Complet_Koraline.html');
  const masterHtml = generateMasterDocument(allFiles);
  fs.writeFileSync(masterPath, masterHtml, 'utf-8');

  const masterSizeKb = Math.round(fs.statSync(masterPath).size / 1024);
  console.log(`  [OK] Guide_Complet_Koraline.html (${masterSizeKb} Ko)`);
  console.log();

  // ── Summary ──
  console.log('='.repeat(60));
  console.log('  GENERATION TERMINEE');
  console.log('='.repeat(60));
  console.log();
  console.log(`  Documents generes dans : ${OUTPUT_DIR}`);
  console.log();
  console.log(`  Document maitre :    1 fichier  (${allFiles.length} pages combinees)`);
  console.log(`  Par section :        ${sectionCount} fichiers`);
  console.log(`  Individuels :        ${individualCount} fichiers`);
  console.log(`  Total :              ${1 + sectionCount + individualCount} fichiers HTML`);
  console.log();
  console.log('  Pour convertir en PDF :');
  console.log('    - Ouvrir le fichier .html dans Chrome/Safari');
  console.log('    - Cliquer le bouton "Imprimer / PDF" en haut a droite');
  console.log('    - Ou Cmd+P > "Enregistrer en PDF"');
  console.log();

  // ── File listing ──
  console.log('  Fichiers generes :');
  console.log(`    ${masterPath}`);
  for (const { section } of sectionData) {
    const prettyName = section.dir.split('-').map((part, i) => {
      if (i === 0) return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    }).join('-');
    console.log(`    ${path.join(OUTPUT_DIR, prettyName + '.html')}`);
  }
  console.log(`    ${INDIVIDUAL_DIR}/ (${individualCount} fichiers)`);
  console.log();
}

main();
