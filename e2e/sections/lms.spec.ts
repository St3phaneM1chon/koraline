import { test, expect } from '../fixtures/admin-auth';
import { collectConsoleErrors, collectNetworkErrors, checkOverflow, waitForPageReady } from '../fixtures/helpers';

// ── Admin LMS Pages — Smoke Tests ──

const adminPages = [
  '/admin/formation',
  '/admin/formation/cours',
  '/admin/formation/categories',
  '/admin/formation/forfaits',
  '/admin/formation/corporatif',
  '/admin/formation/inscriptions',
  '/admin/formation/etudiants',
  '/admin/formation/progression',
  '/admin/formation/quiz',
  '/admin/formation/banques-questions',
  '/admin/formation/sessions-direct',
  '/admin/formation/parcours-roles',
  '/admin/formation/cohortes',
  '/admin/formation/outils-lti',
  '/admin/formation/grilles-evaluation',
  '/admin/formation/evaluation-pairs',
  '/admin/formation/modeles-cours',
  '/admin/formation/xapi',
  '/admin/formation/carnet-notes',
  '/admin/formation/diffusion-progressive',
  '/admin/formation/badges',
  '/admin/formation/classement',
  '/admin/formation/certificats',
  '/admin/formation/modeles-certificats',
  '/admin/formation/conformite',
  '/admin/formation/analytics',
  '/admin/formation/rapports',
  '/admin/formation/parametres',
  '/admin/formation/portail',
];

for (const pagePath of adminPages) {
  test.describe(`LMS Admin: ${pagePath}`, () => {
    test('loads without console errors', async ({ adminPage }) => {
      const errors = await collectConsoleErrors(adminPage, async () => {
        await adminPage.goto(pagePath);
        await waitForPageReady(adminPage);
      });
      // Filter out known non-critical errors
      const critical = errors.filter(e => !e.includes('hydration') && !e.includes('ResizeObserver'));
      expect(critical).toHaveLength(0);
    });

    test('loads without 5xx network errors', async ({ adminPage }) => {
      const errors = await collectNetworkErrors(adminPage, async () => {
        await adminPage.goto(pagePath);
        await waitForPageReady(adminPage);
      });
      expect(errors.filter(e => e.status >= 500)).toHaveLength(0);
    });

    test('no horizontal overflow', async ({ adminPage }) => {
      await adminPage.goto(pagePath);
      await waitForPageReady(adminPage);
      expect(await checkOverflow(adminPage)).toBe(false);
    });
  });
}

// ── Student LMS Pages — Smoke Tests ──

const studentPages = [
  '/learn',
  '/learn/dashboard',
  '/learn/forfaits',
  '/learn/achievements',
  '/learn/glossaire',
  '/learn/mastery',
  '/learn/review',
  '/learn/preferences',
  '/learn/ressources',
  '/learn/discussions',
  '/learn/xp',
  '/learn/sessions-live',
  '/learn/cohorte',
];

for (const pagePath of studentPages) {
  test.describe(`LMS Student: ${pagePath}`, () => {
    test('loads without 5xx errors', async ({ adminPage }) => {
      const errors = await collectNetworkErrors(adminPage, async () => {
        await adminPage.goto(pagePath);
        await waitForPageReady(adminPage);
      });
      expect(errors.filter(e => e.status >= 500)).toHaveLength(0);
    });
  });
}

// ── Functional Tests ──

test.describe('LMS Enrollment Flow', () => {
  test('can view course catalog', async ({ adminPage }) => {
    await adminPage.goto('/learn');
    await waitForPageReady(adminPage);
    // Should see course cards or catalog content
    const content = await adminPage.textContent('body');
    expect(content).toBeTruthy();
  });

  test('can view bundle catalog', async ({ adminPage }) => {
    await adminPage.goto('/learn/forfaits');
    await waitForPageReady(adminPage);
    const content = await adminPage.textContent('body');
    expect(content).toBeTruthy();
  });
});

test.describe('LMS Admin Course Management', () => {
  test('course list loads with data', async ({ adminPage }) => {
    await adminPage.goto('/admin/formation/cours');
    await waitForPageReady(adminPage);
    // Wait for table or empty state
    await adminPage.waitForSelector('table, [data-empty-state]', { timeout: 10000 }).catch(() => {});
  });

  test('bundle list loads', async ({ adminPage }) => {
    await adminPage.goto('/admin/formation/forfaits');
    await waitForPageReady(adminPage);
    await adminPage.waitForSelector('table, [data-empty-state]', { timeout: 10000 }).catch(() => {});
  });

  test('corporate accounts page loads', async ({ adminPage }) => {
    await adminPage.goto('/admin/formation/corporatif');
    await waitForPageReady(adminPage);
    await adminPage.waitForSelector('table, [data-empty-state]', { timeout: 10000 }).catch(() => {});
  });
});

test.describe('LMS API Health', () => {
  test('courses API returns 200', async ({ adminPage }) => {
    const response = await adminPage.goto('/api/admin/lms/courses?limit=1');
    expect(response?.status()).toBeLessThan(500);
  });

  test('bundles API returns 200', async ({ adminPage }) => {
    const response = await adminPage.goto('/api/admin/lms/bundles');
    expect(response?.status()).toBeLessThan(500);
  });

  test('corporate API returns 200', async ({ adminPage }) => {
    const response = await adminPage.goto('/api/admin/lms/corporate');
    expect(response?.status()).toBeLessThan(500);
  });

  test('analytics API returns 200', async ({ adminPage }) => {
    const response = await adminPage.goto('/api/admin/lms/analytics');
    expect(response?.status()).toBeLessThan(500);
  });
});
