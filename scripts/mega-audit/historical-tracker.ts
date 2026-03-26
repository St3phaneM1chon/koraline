/**
 * AUDIT FORGE — Historical Tracker
 * Stores audit results over time for trend analysis and regression detection.
 */

import * as fs from 'fs';
import * as path from 'path';
import { AuditFinding, Grade } from './audit-config';

const RESULTS_DIR = path.resolve('.audit_results');
const BASELINES_DIR = path.join(RESULTS_DIR, 'baselines');
const WEEKLY_DIR = path.join(RESULTS_DIR, 'weekly');
const MONTHLY_DIR = path.join(RESULTS_DIR, 'monthly');
const TRENDS_DIR = path.join(RESULTS_DIR, 'trends');

interface DomainAuditRecord {
  domain: string;
  date: string;
  score: number;
  grade: Grade;
  functionsAudited: number;
  findings: AuditFinding[];
  criticals: number;
  highs: number;
  mediums: number;
  lows: number;
  gitCommit?: string;
}

interface TrendEntry {
  date: string;
  domain: string;
  score: number;
  findingCount: number;
  criticalCount: number;
}

// ── Directory Setup ────────────────────────────────────────────

export function ensureDirectories(): void {
  for (const dir of [RESULTS_DIR, BASELINES_DIR, WEEKLY_DIR, MONTHLY_DIR, TRENDS_DIR]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

// ── Write Results ──────────────────────────────────────────────

export function saveWeeklyResult(record: DomainAuditRecord): string {
  ensureDirectories();
  const week = getISOWeek(new Date(record.date));
  const filename = `${record.date.slice(0, 4)}-W${String(week).padStart(2, '0')}-${record.domain}.json`;
  const filepath = path.join(WEEKLY_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(record, null, 2));
  appendTrend(record);
  return filepath;
}

export function saveMonthlyReport(data: {
  date: string;
  domainScores: Record<string, { score: number; grade: Grade }>;
  globalScore: number;
  globalGrade: Grade;
  totalFindings: number;
  e2ePassRate?: number;
}): string {
  ensureDirectories();
  const filename = `${data.date.slice(0, 7)}-monthly.json`;
  const filepath = path.join(MONTHLY_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  return filepath;
}

export function saveBaseline(data: {
  date: string;
  quarter: string;
  domainScores: Record<string, { score: number; grade: Grade; findings: AuditFinding[] }>;
  globalScore: number;
}): string {
  ensureDirectories();
  const filename = `${data.quarter}-baseline.json`;
  const filepath = path.join(BASELINES_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  return filepath;
}

// ── Read Results ───────────────────────────────────────────────

export function getLatestWeeklyResult(domain: string): DomainAuditRecord | null {
  if (!fs.existsSync(WEEKLY_DIR)) return null;

  const files = fs.readdirSync(WEEKLY_DIR)
    .filter(f => f.includes(`-${domain}.json`))
    .sort()
    .reverse();

  if (files.length === 0) return null;

  try {
    return JSON.parse(fs.readFileSync(path.join(WEEKLY_DIR, files[0]), 'utf-8'));
  } catch {
    return null;
  }
}

export function getLatestBaseline(): Record<string, { score: number; grade: Grade }> | null {
  if (!fs.existsSync(BASELINES_DIR)) return null;

  const files = fs.readdirSync(BASELINES_DIR).filter(f => f.endsWith('.json')).sort().reverse();
  if (files.length === 0) return null;

  try {
    const data = JSON.parse(fs.readFileSync(path.join(BASELINES_DIR, files[0]), 'utf-8'));
    return data.domainScores;
  } catch {
    return null;
  }
}

// ── Trend Tracking ─────────────────────────────────────────────

function appendTrend(record: DomainAuditRecord): void {
  const trendFile = path.join(TRENDS_DIR, 'domain-scores.json');
  let trends: TrendEntry[] = [];

  if (fs.existsSync(trendFile)) {
    try {
      trends = JSON.parse(fs.readFileSync(trendFile, 'utf-8'));
    } catch {
      trends = [];
    }
  }

  trends.push({
    date: record.date,
    domain: record.domain,
    score: record.score,
    findingCount: record.findings.length,
    criticalCount: record.criticals,
  });

  // Keep last 365 days of data (trim older entries)
  const cutoff = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10);
  trends = trends.filter(t => t.date >= cutoff);

  fs.writeFileSync(trendFile, JSON.stringify(trends, null, 2));
}

export function getTrends(domain?: string, lastNDays: number = 90): TrendEntry[] {
  const trendFile = path.join(TRENDS_DIR, 'domain-scores.json');
  if (!fs.existsSync(trendFile)) return [];

  try {
    const trends: TrendEntry[] = JSON.parse(fs.readFileSync(trendFile, 'utf-8'));
    const cutoff = new Date(Date.now() - lastNDays * 86400000).toISOString().slice(0, 10);
    return trends.filter(t => t.date >= cutoff && (!domain || t.domain === domain));
  } catch {
    return [];
  }
}

/**
 * Detect regressions: domains where score dropped by 5+ since last audit.
 */
export function detectRegressions(): Array<{ domain: string; previousScore: number; currentScore: number; delta: number }> {
  const regressions: Array<{ domain: string; previousScore: number; currentScore: number; delta: number }> = [];

  const trendFile = path.join(TRENDS_DIR, 'domain-scores.json');
  if (!fs.existsSync(trendFile)) return [];

  try {
    const trends: TrendEntry[] = JSON.parse(fs.readFileSync(trendFile, 'utf-8'));

    // Group by domain, get last 2 entries per domain
    const byDomain = new Map<string, TrendEntry[]>();
    for (const t of trends) {
      if (!byDomain.has(t.domain)) byDomain.set(t.domain, []);
      byDomain.get(t.domain)!.push(t);
    }

    for (const [domain, entries] of byDomain) {
      if (entries.length < 2) continue;
      const sorted = entries.sort((a, b) => a.date.localeCompare(b.date));
      const current = sorted[sorted.length - 1];
      const previous = sorted[sorted.length - 2];
      const delta = current.score - previous.score;

      if (delta <= -5) {
        regressions.push({
          domain,
          previousScore: previous.score,
          currentScore: current.score,
          delta,
        });
      }
    }
  } catch {
    // Corrupted trends file
  }

  return regressions;
}

// ── Utilities ──────────────────────────────────────────────────

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
