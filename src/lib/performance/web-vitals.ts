/**
 * Web Vitals Tracker — Koraline
 *
 * Client-side script that captures Core Web Vitals (LCP, FID/INP, CLS, TTFB)
 * and reports them to the backend API for aggregation and display in the
 * Performance Dashboard.
 *
 * Usage (in a client component or layout):
 *   import { initWebVitals } from '@/lib/performance/web-vitals';
 *   useEffect(() => { initWebVitals(); }, []);
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WebVitalReport {
  page: string;
  metric: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

type MetricName = 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'INP';

interface PerformanceEntryLCP extends PerformanceEntry {
  renderTime?: number;
  loadTime?: number;
}

// ---------------------------------------------------------------------------
// Thresholds (Google recommendations)
// ---------------------------------------------------------------------------

const THRESHOLDS: Record<MetricName, [number, number]> = {
  LCP: [2500, 4000],     // Good < 2.5s, Poor > 4s
  FID: [100, 300],       // Good < 100ms, Poor > 300ms
  CLS: [0.1, 0.25],     // Good < 0.1, Poor > 0.25
  TTFB: [800, 1800],    // Good < 800ms, Poor > 1.8s
  INP: [200, 500],      // Good < 200ms, Poor > 500ms
};

function getRating(metric: MetricName, value: number): 'good' | 'needs-improvement' | 'poor' {
  const [good, poor] = THRESHOLDS[metric];
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

// ---------------------------------------------------------------------------
// Reporter: sends metrics to /api/performance/vitals
// ---------------------------------------------------------------------------

const reportQueue: WebVitalReport[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function queueReport(report: WebVitalReport): void {
  reportQueue.push(report);

  // Batch: flush after 2s or when we have 5 metrics
  if (reportQueue.length >= 5) {
    flush();
  } else if (!flushTimer) {
    flushTimer = setTimeout(flush, 2000);
  }
}

function flush(): void {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (reportQueue.length === 0) return;

  const batch = reportQueue.splice(0, reportQueue.length);

  // Use sendBeacon for reliability (fires even on page unload)
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify({ vitals: batch })], { type: 'application/json' });
    navigator.sendBeacon('/api/performance/vitals', blob);
  } else {
    fetch('/api/performance/vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vitals: batch }),
      keepalive: true,
    }).catch(() => {
      // Silently fail — performance reporting is non-critical
    });
  }
}

// ---------------------------------------------------------------------------
// Metric Observers
// ---------------------------------------------------------------------------

function observeLCP(): void {
  if (typeof PerformanceObserver === 'undefined') return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1] as PerformanceEntryLCP;
      if (!last) return;
      const value = last.renderTime || last.loadTime || last.startTime;
      queueReport({
        page: location.pathname,
        metric: 'LCP',
        value: Math.round(value),
        rating: getRating('LCP', value),
      });
    });
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {
    // Not supported
  }
}

function observeFID(): void {
  if (typeof PerformanceObserver === 'undefined') return;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fidEntry = entry as PerformanceEntry & { processingStart?: number };
        const value = (fidEntry.processingStart || 0) - entry.startTime;
        if (value > 0) {
          queueReport({
            page: location.pathname,
            metric: 'FID',
            value: Math.round(value),
            rating: getRating('FID', value),
          });
        }
      }
    });
    observer.observe({ type: 'first-input', buffered: true });
  } catch {
    // Not supported
  }
}

function observeCLS(): void {
  if (typeof PerformanceObserver === 'undefined') return;

  try {
    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
        if (!layoutShift.hadRecentInput && layoutShift.value) {
          clsValue += layoutShift.value;
        }
      }
    });
    observer.observe({ type: 'layout-shift', buffered: true });

    // Report CLS on page hide (full lifecycle value)
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          queueReport({
            page: location.pathname,
            metric: 'CLS',
            value: Math.round(clsValue * 1000) / 1000,
            rating: getRating('CLS', clsValue),
          });
          flush();
        }
      }, { once: true });
    }
  } catch {
    // Not supported
  }
}

function observeTTFB(): void {
  if (typeof performance === 'undefined') return;

  try {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (nav) {
      const value = nav.responseStart - nav.requestStart;
      if (value > 0) {
        queueReport({
          page: location.pathname,
          metric: 'TTFB',
          value: Math.round(value),
          rating: getRating('TTFB', value),
        });
      }
    }
  } catch {
    // Not supported
  }
}

function observeINP(): void {
  if (typeof PerformanceObserver === 'undefined') return;

  try {
    let maxINP = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const duration = entry.duration;
        if (duration > maxINP) {
          maxINP = duration;
        }
      }
    });
    observer.observe({ type: 'event', buffered: true });

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && maxINP > 0) {
          queueReport({
            page: location.pathname,
            metric: 'INP',
            value: Math.round(maxINP),
            rating: getRating('INP', maxINP),
          });
        }
      }, { once: true });
    }
  } catch {
    // Not supported
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

let initialized = false;

/**
 * Initialize all Web Vitals observers. Safe to call multiple times (idempotent).
 * Must be called client-side only (useEffect or dynamic import).
 */
export function initWebVitals(): void {
  if (initialized) return;
  if (typeof window === 'undefined') return;

  initialized = true;

  observeLCP();
  observeFID();
  observeCLS();
  observeTTFB();
  observeINP();

  // Flush on page unload as a fallback
  window.addEventListener('beforeunload', flush);
}

/**
 * Compute a Lighthouse-style performance score (0-100) from CWV metrics.
 * Weights: LCP 25%, FID 10%, CLS 25%, TTFB 15%, INP 25%
 */
export function computePerformanceScore(metrics: {
  lcp?: number;
  fid?: number;
  cls?: number;
  ttfb?: number;
  inp?: number;
}): number {
  let score = 100;

  if (metrics.lcp !== undefined) {
    if (metrics.lcp > 4000) score -= 25;
    else if (metrics.lcp > 2500) score -= Math.round(((metrics.lcp - 2500) / 1500) * 25);
  }

  if (metrics.fid !== undefined) {
    if (metrics.fid > 300) score -= 10;
    else if (metrics.fid > 100) score -= Math.round(((metrics.fid - 100) / 200) * 10);
  }

  if (metrics.cls !== undefined) {
    if (metrics.cls > 0.25) score -= 25;
    else if (metrics.cls > 0.1) score -= Math.round(((metrics.cls - 0.1) / 0.15) * 25);
  }

  if (metrics.ttfb !== undefined) {
    if (metrics.ttfb > 1800) score -= 15;
    else if (metrics.ttfb > 800) score -= Math.round(((metrics.ttfb - 800) / 1000) * 15);
  }

  if (metrics.inp !== undefined) {
    if (metrics.inp > 500) score -= 25;
    else if (metrics.inp > 200) score -= Math.round(((metrics.inp - 200) / 300) * 25);
  }

  return Math.max(0, Math.min(100, score));
}
