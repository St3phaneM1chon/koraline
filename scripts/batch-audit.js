/**
 * Batch Playwright Audit Script
 * Navigates all admin pages, collects errors, takes screenshots, outputs JSON results.
 * Usage: node scripts/batch-audit.js [section]
 * Available sections: accounting, system, crm, media, marketing, telephony, emails, community, loyalty
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(__dirname, '..', 'docs', 'tutorials', 'screenshots');
const RESULTS_FILE = path.join(__dirname, '..', 'docs', 'tutorials', 'audit-results.json');

// All pages organized by section
const PAGES = {
  accounting: [
    '/admin/comptabilite/recherche',
    '/admin/comptabilite/saisie-rapide',
    '/admin/comptabilite/ecritures',
    '/admin/comptabilite/recurrentes',
    '/admin/comptabilite/ocr',
    '/admin/comptabilite/depenses',
    '/admin/comptabilite/devis',
    '/admin/comptabilite/temps',
    '/admin/comptabilite/grand-livre',
    '/admin/comptabilite/plan-comptable',
    '/admin/comptabilite/factures-clients',
    '/admin/comptabilite/factures-fournisseurs',
    '/admin/comptabilite/notes-credit',
    '/admin/comptabilite/aging',
    '/admin/comptabilite/immobilisations',
    '/admin/comptabilite/inventaire',
    '/admin/comptabilite/banques',
    '/admin/comptabilite/import-bancaire',
    '/admin/comptabilite/regles-bancaires',
    '/admin/comptabilite/rapprochement',
    '/admin/comptabilite/devises',
    '/admin/comptabilite/etats-financiers',
    '/admin/comptabilite/previsions',
    '/admin/comptabilite/budget',
    '/admin/comptabilite/rapports',
    '/admin/comptabilite/rapports-personnalises',
    '/admin/comptabilite/exports',
    '/admin/comptabilite/audit',
    '/admin/comptabilite/cloture',
    '/admin/comptabilite/parametres',
    '/admin/comptabilite/calendrier-fiscal',
    '/admin/comptabilite/declaration-tps-tvq',
    '/admin/fiscal',
    '/admin/fiscal/reports',
    '/admin/fiscal/tasks',
    '/admin/comptabilite/rsde',
    '/admin/comptabilite/paie',
    '/admin/comptabilite/projets-couts',
    '/admin/comptabilite/workflows',
    '/admin/comptabilite/bons-commande',
    '/admin/comptabilite/operations-lot',
    '/admin/comptabilite/ai-assistant',
    '/admin/comptabilite/api-publique',
    '/admin/comptabilite/multi-entite',
    '/admin/comptabilite/portail-client',
  ],
  system: [
    '/admin/permissions',
    '/admin/logs',
    '/admin/employes',
    '/admin/parametres',
    '/admin/parametres/modules',
    '/admin/uat',
    '/admin/diagnostics',
    '/admin/mots-magiques',
    '/admin/audits',
    '/admin/audits/catalog',
    '/admin/audits/security',
    '/admin/backups',
    '/admin/monitoring',
    '/admin/system/crons',
    '/admin/webhooks',
    '/admin/analytics',
    '/admin/analytics/cross-module',
    '/admin/securite',
    '/admin/livraison',
    '/admin/devises',
    '/admin/seo',
    '/admin/traductions',
    '/admin/contenu',
    '/admin/navigateur',
  ],
  crm: [
    '/admin/crm',
    '/admin/crm/pipeline',
    '/admin/crm/pipelines',
    '/admin/crm/leads',
    '/admin/crm/lists',
    '/admin/scraper',
    '/admin/crm/deals',
    '/admin/crm/quotes',
    '/admin/crm/forecast',
    '/admin/crm/leaderboard',
    '/admin/crm/quotas',
    '/admin/crm/approvals',
    '/admin/crm/contracts',
    '/admin/crm/exchange-rates',
    '/admin/crm/inbox',
    '/admin/crm/campaigns',
    '/admin/crm/sms-campaigns',
    '/admin/crm/sms-templates',
    '/admin/crm/snippets',
    '/admin/crm/knowledge-base',
    '/admin/crm/tickets',
    '/admin/crm/dialer',
    '/admin/crm/wallboard',
    '/admin/crm/agents/performance',
    '/admin/crm/reps',
    '/admin/crm/call-analytics',
    '/admin/crm/call-center-kpis',
    '/admin/crm/scheduling',
    '/admin/crm/adherence',
    '/admin/crm/workflows',
    '/admin/crm/compliance',
    '/admin/crm/qa',
    '/admin/crm/qualification',
    '/admin/crm/duplicates',
    '/admin/crm/forms',
    '/admin/crm/playbooks',
    '/admin/crm/workflow-analytics',
    '/admin/crm/analytics',
    '/admin/crm/reports/builder',
    '/admin/crm/funnel-analysis',
    '/admin/crm/activity-reports',
    '/admin/crm/recurring-revenue',
    '/admin/crm/attribution',
    '/admin/crm/churn',
    '/admin/crm/clv',
    '/admin/crm/cohort-analysis',
    '/admin/crm/heatmaps',
    '/admin/crm/deal-journey',
    '/admin/crm/snapshots',
    '/admin/crm/dashboard-builder',
  ],
  media: [
    '/admin/media',
    '/admin/media/analytics',
    '/admin/media/launch-teams',
    '/admin/media/launch-zoom',
    '/admin/media/launch-webex',
    '/admin/media/launch-google-meet',
    '/admin/media/launch-whatsapp',
    '/admin/media/ads-youtube',
    '/admin/media/ads-x',
    '/admin/media/ads-tiktok',
    '/admin/media/ads-google',
    '/admin/media/ads-linkedin',
    '/admin/media/ads-meta',
    '/admin/media/api-zoom',
    '/admin/media/api-teams',
    '/admin/media/api-whatsapp',
    '/admin/media/api-webex',
    '/admin/media/api-google-meet',
    '/admin/media/api-youtube',
    '/admin/media/api-vimeo',
    '/admin/media/api-x',
    '/admin/media/api-tiktok',
    '/admin/media/api-google-ads',
    '/admin/media/api-linkedin',
    '/admin/media/api-meta',
    '/admin/media/content-hub',
    '/admin/media/videos',
    '/admin/media/video-categories',
    '/admin/media/connections',
    '/admin/media/imports',
    '/admin/media/sessions',
    '/admin/media/consents',
    '/admin/media/consent-templates',
    '/admin/media/images',
    '/admin/media/library',
    '/admin/media/brand-kit',
    '/admin/media/social-scheduler',
  ],
  marketing: [
    '/admin/promo-codes',
    '/admin/promotions',
    '/admin/newsletter',
    '/admin/bannieres',
    '/admin/upsell',
    '/admin/blog',
    '/admin/blog/analytics',
    '/admin/rapports',
  ],
  telephony: [
    '/admin/telephonie',
    '/admin/telephonie/journal',
    '/admin/telephonie/enregistrements',
    '/admin/telephonie/messagerie',
    '/admin/telephonie/wallboard',
    '/admin/telephonie/conference',
    '/admin/telephonie/campagnes',
    '/admin/telephonie/coaching',
    '/admin/telephonie/transferts',
    '/admin/telephonie/groupes',
    '/admin/telephonie/sondages',
    '/admin/telephonie/ivr-builder',
    '/admin/telephonie/webhooks',
    '/admin/telephonie/analytics',
    '/admin/telephonie/analytics/appels',
    '/admin/telephonie/analytics/agents',
    '/admin/telephonie/analytics/queues',
    '/admin/telephonie/analytics/speech',
    '/admin/telephonie/connexions',
    '/admin/telephonie/numeros',
    '/admin/telephonie/extensions',
    '/admin/telephonie/parametres',
  ],
  emails: [
    '/admin/emails?folder=inbox',
    '/admin/emails?folder=sent',
    '/admin/emails?folder=drafts',
    '/admin/emails?folder=deleted',
    '/admin/emails?folder=junk',
    '/admin/emails?folder=notes',
    '/admin/emails?folder=archive',
    '/admin/emails?folder=search',
    '/admin/emails?tab=templates',
    '/admin/emails?tab=campaigns',
    '/admin/emails?tab=flows',
    '/admin/emails?tab=analytics',
    '/admin/emails?tab=segments',
    '/admin/emails?tab=mailing-list',
    '/admin/emails?tab=settings',
  ],
  community: [
    '/admin/avis',
    '/admin/questions',
    '/admin/chat',
    '/admin/ambassadeurs',
  ],
  loyalty: [
    '/admin/fidelite',
    '/admin/webinaires',
  ],
};

function slugify(url) {
  return url.replace(/^\/admin\//, '').replace(/[\/\?=&]/g, '-').replace(/-+/g, '-').replace(/-$/, '');
}

function calculateScore(errors) {
  let score = 100;
  const consoleErrors = errors.filter(e => e.type === 'console');
  const networkErrors = errors.filter(e => e.type === 'network');
  const is404 = errors.some(e => e.type === 'page_404');

  if (is404) return 0; // Page doesn't exist

  score -= consoleErrors.length * 5; // -5 per console error (capped)
  score -= networkErrors.filter(e => e.status >= 500).length * 15; // -15 per 5xx
  score -= networkErrors.filter(e => e.status >= 400 && e.status < 500).length * 3; // -3 per 4xx (reduced for notifications)

  return Math.max(0, Math.min(100, score));
}

function getGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

async function auditPage(page, url) {
  const errors = [];
  const consoleMessages = [];
  const networkErrors = [];

  // Collect console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleMessages.push(msg.text().substring(0, 200));
    }
  });

  // Collect network errors
  page.on('response', response => {
    if (response.status() >= 400) {
      networkErrors.push({ url: response.url().substring(0, 150), status: response.status() });
    }
  });

  const startTime = Date.now();

  try {
    const response = await page.goto(`${BASE_URL}${url}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000); // Wait for HMR + data loading

    const loadTime = Date.now() - startTime;

    // Get page info
    const pageInfo = await page.evaluate(() => ({
      title: document.title,
      h1: document.querySelector('h1')?.textContent?.trim() || 'N/A',
      hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      is404: document.body?.innerText?.includes('404') && document.body?.innerText?.includes('Page non trouvée'),
      elements: {
        links: document.querySelectorAll('a').length,
        buttons: document.querySelectorAll('button').length,
        inputs: document.querySelectorAll('input, textarea, select').length,
        images: document.querySelectorAll('img').length,
        tables: document.querySelectorAll('table').length,
      },
    }));

    // Build errors list
    consoleMessages.forEach(msg => {
      if (!msg.includes('Fast Refresh') && !msg.includes('React DevTools')) {
        errors.push({ type: 'console', message: msg });
      }
    });
    networkErrors.forEach(ne => {
      errors.push({ type: 'network', url: ne.url, status: ne.status });
    });
    if (pageInfo.is404) errors.push({ type: 'page_404' });
    if (pageInfo.hasOverflow) errors.push({ type: 'overflow' });

    // Take screenshot
    const screenshotName = slugify(url) + '.png';
    try {
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, screenshotName),
        fullPage: true,
        type: 'png',
      });
    } catch (e) {
      // Screenshot may fail for very tall pages
    }

    const score = calculateScore(errors);

    return {
      url,
      title: pageInfo.title,
      h1: pageInfo.h1,
      score,
      grade: getGrade(score),
      loadTime,
      errors: errors.length,
      errorDetails: errors.slice(0, 10), // Cap at 10
      elements: pageInfo.elements,
      hasOverflow: pageInfo.hasOverflow,
      is404: pageInfo.is404 || false,
      screenshot: screenshotName,
    };
  } catch (error) {
    return {
      url,
      title: 'ERROR',
      h1: 'N/A',
      score: 0,
      grade: 'F',
      loadTime: Date.now() - startTime,
      errors: 1,
      errorDetails: [{ type: 'navigation', message: error.message?.substring(0, 200) }],
      elements: {},
      hasOverflow: false,
      is404: false,
      screenshot: null,
    };
  }
}

async function main() {
  const section = process.argv[2] || 'accounting';
  const pages = PAGES[section];

  if (!pages) {
    console.error(`Unknown section: ${section}. Available: ${Object.keys(PAGES).join(', ')}`);
    process.exit(1);
  }

  console.log(`\n🔍 Auditing ${pages.length} ${section} pages...\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });

  // Login first - use API-based login to bypass UI issues
  const loginPage = await context.newPage();

  // Direct API login instead of UI-based login
  try {
    const response = await loginPage.request.post(`${BASE_URL}/api/auth/callback/credentials`, {
      form: {
        email: 'admin@peptideplus.ca',
        password: 'St3ph@ne1234',
        csrfToken: '',
        callbackUrl: `${BASE_URL}/admin/dashboard`,
        json: 'true',
      },
    });
    // Navigate to admin to set session cookie
    await loginPage.goto(`${BASE_URL}/auth/signin`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await loginPage.waitForTimeout(5000);

    // Try filling the form
    const emailInput = loginPage.locator('input[placeholder*="exemple"], input[name="email"], input[type="email"]').first();
    const pwInput = loginPage.locator('input[placeholder*="••"], input[name="password"], input[type="password"]').first();
    const submitBtn = loginPage.locator('button[type="submit"], button:has-text("connecter")').first();

    await emailInput.fill('admin@peptideplus.ca');
    await pwInput.fill('St3ph@ne1234');
    await submitBtn.click();
    await loginPage.waitForTimeout(8000);
  } catch (loginError) {
    console.error('Login attempt error:', loginError.message);
  }

  if (!loginPage.url().includes('/admin')) {
    // Fallback: navigate directly (cookies may already be set from previous session)
    await loginPage.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await loginPage.waitForTimeout(3000);
  }

  if (loginPage.url().includes('/admin')) {
    console.log('✅ Login successful\n');
  } else {
    console.error('❌ Login failed! URL:', loginPage.url());
    console.error('Attempting to continue anyway (session may persist from previous run)...\n');
  }

  const results = [];

  for (let i = 0; i < pages.length; i++) {
    const url = pages[i];
    const slug = slugify(url);
    process.stdout.write(`[${i + 1}/${pages.length}] ${url} ... `);

    // Create fresh page for each navigation to avoid stale listeners
    const page = await context.newPage();
    const result = await auditPage(page, url);
    await page.close();

    results.push(result);
    console.log(`${result.grade} (${result.score}/100) ${result.errors} errors ${result.h1}`);
  }

  await browser.close();

  // Load existing results or create new
  let allResults = {};
  try {
    allResults = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));
  } catch (e) {
    allResults = { generated_at: new Date().toISOString(), sections: {} };
  }

  // Save section results
  allResults.sections[section] = {
    audited_at: new Date().toISOString(),
    total_pages: results.length,
    avg_score: Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length),
    pages_by_grade: {
      A: results.filter(r => r.grade === 'A').length,
      B: results.filter(r => r.grade === 'B').length,
      C: results.filter(r => r.grade === 'C').length,
      D: results.filter(r => r.grade === 'D').length,
      F: results.filter(r => r.grade === 'F').length,
    },
    pages: results,
  };
  allResults.generated_at = new Date().toISOString();

  fs.writeFileSync(RESULTS_FILE, JSON.stringify(allResults, null, 2));

  // Summary
  console.log('\n📊 SUMMARY:');
  console.log(`  Pages audited: ${results.length}`);
  console.log(`  Average score: ${allResults.sections[section].avg_score}/100`);
  console.log(`  A: ${allResults.sections[section].pages_by_grade.A} | B: ${allResults.sections[section].pages_by_grade.B} | C: ${allResults.sections[section].pages_by_grade.C} | D: ${allResults.sections[section].pages_by_grade.D} | F: ${allResults.sections[section].pages_by_grade.F}`);

  const errorPages = results.filter(r => r.score < 50);
  if (errorPages.length > 0) {
    console.log('\n⚠️  Critical pages (score < 50):');
    errorPages.forEach(p => console.log(`  ${p.url} → ${p.score}/100 (${p.errors} errors)`));
  }
}

main().catch(console.error);
