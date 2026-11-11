import type { Tone } from '../tones';

/** Pure helpers for data-quality views: run summaries, gap coverage, durations and freshness. */

export type RunStatus = 'success' | 'failed' | 'running' | 'skipped';

export type Run = {
  id: string;
  status: RunStatus;
  /** When the run started, as a timestamp. */
  startedAt: number;
  /** How long it took; 0 while running or when skipped. */
  durationMs: number;
  /** Rows written. */
  rows?: number;
  /** What went wrong, for a failed run. */
  error?: string;
};

export const RUN_LABEL: Record<RunStatus, string> = { success: 'Succeeded', failed: 'Failed', running: 'Running', skipped: 'Skipped' };

export const RUN_TONE: Record<RunStatus, Tone> = { success: 'success', failed: 'critical', running: 'info', skipped: 'neutral' };

export type RunSummary = { total: number; success: number; failed: number; successRate: number; consecutiveFailures: number };

/** Counts runs by outcome. The rate ignores running and skipped runs; the streak counts failures at the end. */
export function summarizeRuns(runs: readonly { status: RunStatus }[]): RunSummary {
  const success = runs.filter((run) => run.status === 'success').length;
  const failed = runs.filter((run) => run.status === 'failed').length;
  const finished = success + failed;
  let consecutiveFailures = 0;
  for (let index = runs.length - 1; index >= 0 && runs[index].status === 'failed'; index -= 1) consecutiveFailures += 1;
  return { total: runs.length, success, failed, successRate: finished === 0 ? 100 : (success / finished) * 100, consecutiveFailures };
}

export type Interval = { from: number; to: number };

/** Gaps clipped to the window, sorted and merged where they overlap. */
export function normalizeGaps(start: number, end: number, gaps: readonly Interval[]): Interval[] {
  const clipped = gaps
    .map((gap) => ({ from: Math.max(start, gap.from), to: Math.min(end, gap.to) }))
    .filter((gap) => gap.to > gap.from)
    .sort((a, b) => a.from - b.from);
  const merged: Interval[] = [];
  for (const gap of clipped) {
    const last = merged[merged.length - 1];
    if (last && gap.from <= last.to) last.to = Math.max(last.to, gap.to);
    else merged.push({ ...gap });
  }
  return merged;
}

/** Total time without data inside the window. */
export function missingDuration(start: number, end: number, gaps: readonly Interval[]): number {
  return normalizeGaps(start, end, gaps).reduce((sum, gap) => sum + (gap.to - gap.from), 0);
}

/** Share of the window that has data, in percent. */
export function coveragePercent(start: number, end: number, gaps: readonly Interval[]): number {
  const span = end - start;
  return span <= 0 ? 0 : ((span - missingDuration(start, end, gaps)) / span) * 100;
}

/** The longest single gap in the window, or 0. */
export function longestGap(start: number, end: number, gaps: readonly Interval[]): number {
  return normalizeGaps(start, end, gaps).reduce((longest, gap) => Math.max(longest, gap.to - gap.from), 0);
}

/** "38 s", "4 min 12 s", "3 h 12 min", "2 d 4 h". */
export function formatDuration(ms: number): string {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return seconds % 60 === 0 ? `${minutes} min` : `${minutes} min ${seconds % 60} s`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return minutes % 60 === 0 ? `${hours} h` : `${hours} h ${minutes % 60} min`;
  const days = Math.floor(hours / 24);
  return hours % 24 === 0 ? `${days} d` : `${days} d ${hours % 24} h`;
}

export type Freshness = 'fresh' | 'late' | 'stale';

export const FRESHNESS_LABEL: Record<Freshness, string> = { fresh: 'Fresh', late: 'Late', stale: 'Stale' };

export const FRESHNESS_TONE: Record<Freshness, Tone> = { fresh: 'success', late: 'warning', stale: 'critical' };

/** Fresh within the expected interval, late up to three intervals, stale beyond. */
export function freshness(ageMs: number, expectedMs: number): Freshness {
  if (ageMs <= expectedMs) return 'fresh';
  return ageMs <= expectedMs * 3 ? 'late' : 'stale';
}
