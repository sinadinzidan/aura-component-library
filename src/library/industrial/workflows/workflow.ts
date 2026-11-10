/**
 * Pure helpers shared by the workflow components: sequence progress, run history, data gaps,
 * durations, zoom steps, limits, mass balance and unit conversion. No React, no clock.
 */

import type { StatusDescriptor } from '../status';

export type StepState = 'done' | 'active' | 'pending' | 'failed' | 'skipped' | 'held';

export type StepProgress = {
  /** Steps that are finished, skipped ones included. */
  settled: number;
  total: number;
  /** 0–100, whole number. */
  percent: number;
  /** The step that needs attention now: the first failed, held or active one, else the first pending. −1 when all are settled. */
  currentIndex: number;
};

/** Where a sequence stands. */
export function stepProgress(steps: readonly { state: StepState }[]): StepProgress {
  const settled = steps.filter((step) => step.state === 'done' || step.state === 'skipped').length;
  const attention = steps.findIndex((step) => step.state === 'failed' || step.state === 'held' || step.state === 'active');
  const currentIndex = attention >= 0 ? attention : steps.findIndex((step) => step.state === 'pending');
  return {
    settled,
    total: steps.length,
    percent: steps.length === 0 ? 0 : Math.round((settled / steps.length) * 100),
    currentIndex,
  };
}

export type RunStatus = 'success' | 'failed' | 'running' | 'skipped';

export type RunSummary = {
  total: number;
  counts: Record<RunStatus, number>;
  /** Share of finished runs that succeeded, 0–100. `null` when no run has finished. */
  successRate: number | null;
  /** "12 of 14 runs succeeded, 2 failed". */
  text: string;
};

/** Counts a run history and puts it in words for captions and accessible names. */
export function summarizeRuns(runs: readonly { status: RunStatus }[]): RunSummary {
  const counts: Record<RunStatus, number> = { success: 0, failed: 0, running: 0, skipped: 0 };
  for (const run of runs) counts[run.status] += 1;
  const finished = counts.success + counts.failed;
  const parts = [`${counts.success} of ${runs.length} runs succeeded`];
  if (counts.failed > 0) parts.push(`${counts.failed} failed`);
  if (counts.skipped > 0) parts.push(`${counts.skipped} skipped`);
  if (counts.running > 0) parts.push(`${counts.running} running`);
  return {
    total: runs.length,
    counts,
    successRate: finished === 0 ? null : Math.round((counts.success / finished) * 100),
    text: runs.length === 0 ? 'No runs' : parts.join(', '),
  };
}

export type Interval = { from: number; to: number };

/** A stretch of a timeline as percentages of its width. */
export type TimelineSegment = { left: number; width: number };

/** Gaps clamped to the period, sorted and merged where they touch or overlap. */
export function normalizeGaps(start: number, end: number, gaps: readonly Interval[]): Interval[] {
  const clamped = gaps
    .map((gap) => ({ from: Math.max(start, Math.min(gap.from, gap.to)), to: Math.min(end, Math.max(gap.from, gap.to)) }))
    .filter((gap) => gap.to > gap.from)
    .sort((a, b) => a.from - b.from);
  const merged: Interval[] = [];
  for (const gap of clamped) {
    const last = merged[merged.length - 1];
    if (last && gap.from <= last.to) last.to = Math.max(last.to, gap.to);
    else merged.push({ ...gap });
  }
  return merged;
}

/** The stretches of a period that have data, as percentages, given where data is missing. */
export function presentSegments(start: number, end: number, gaps: readonly Interval[]): TimelineSegment[] {
  const span = end - start;
  if (span <= 0) return [];
  const segments: TimelineSegment[] = [];
  let cursor = start;
  const push = (to: number) => {
    if (to > cursor) segments.push({ left: ((cursor - start) / span) * 100, width: ((to - cursor) / span) * 100 });
  };
  for (const gap of normalizeGaps(start, end, gaps)) {
    push(gap.from);
    cursor = gap.to;
  }
  push(end);
  return segments;
}

/** Total time without data inside the period, in milliseconds. */
export function missingDuration(start: number, end: number, gaps: readonly Interval[]): number {
  return normalizeGaps(start, end, gaps).reduce((sum, gap) => sum + (gap.to - gap.from), 0);
}

/** Share of the period that has data, 0–100 with one decimal. */
export function coveragePercent(start: number, end: number, gaps: readonly Interval[]): number {
  const span = end - start;
  if (span <= 0) return 0;
  return Math.round((1 - missingDuration(start, end, gaps) / span) * 1000) / 10;
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** A duration in at most two units: "45 s", "12 min", "2 h 10 min", "3 d 4 h". */
export function formatDuration(ms: number): string {
  const value = Math.max(0, ms);
  if (value < MINUTE) return `${Math.round(value / SECOND)} s`;
  if (value < HOUR) return `${Math.round(value / MINUTE)} min`;
  if (value < DAY) {
    const hours = Math.floor(value / HOUR);
    const minutes = Math.round((value - hours * HOUR) / MINUTE);
    if (minutes === 60) return `${hours + 1} h`;
    return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
  }
  const days = Math.floor(value / DAY);
  const hours = Math.round((value - days * DAY) / HOUR);
  if (hours === 24) return `${days + 1} d`;
  return hours === 0 ? `${days} d` : `${days} d ${hours} h`;
}

export type ZoomRange = { min?: number; max?: number; step?: number };

/** The next zoom level in a direction, snapped to the step and kept inside the range. */
export function stepZoom(zoom: number, direction: 1 | -1, { min = 25, max = 400, step = 25 }: ZoomRange = {}): number {
  const snapped = direction === 1 ? Math.floor(zoom / step) * step + step : Math.ceil(zoom / step) * step - step;
  return Math.min(max, Math.max(min, snapped));
}

/** Whether a reading sits inside its limits. A missing limit does not constrain. */
export function isWithinLimits(value: number, low?: number, high?: number): boolean {
  if (low !== undefined && value < low) return false;
  if (high !== undefined && value > high) return false;
  return true;
}

export type MassBalance = {
  totalIn: number;
  totalOut: number;
  /** In minus out. */
  difference: number;
  /** Difference as a percentage of what came in; `null` when nothing came in. */
  percent: number | null;
};

/** In versus out for a unit or a plant section. */
export function massBalance(inlets: readonly number[], outlets: readonly number[]): MassBalance {
  const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);
  const totalIn = sum(inlets);
  const totalOut = sum(outlets);
  const difference = totalIn - totalOut;
  return { totalIn, totalOut, difference, percent: totalIn === 0 ? null : (difference / totalIn) * 100 };
}

/** How far a value is from its setpoint; `percent` is `null` for a zero setpoint. */
export function deviation(value: number, setpoint: number): { absolute: number; percent: number | null } {
  const absolute = value - setpoint;
  return { absolute, percent: setpoint === 0 ? null : (absolute / Math.abs(setpoint)) * 100 };
}

type Conversion = (value: number) => number;

const CONVERSIONS: Record<string, Conversion> = {
  'barg>psig': (value) => value * 14.5038,
  'psig>barg': (value) => value / 14.5038,
  'barg>kPag': (value) => value * 100,
  'kPag>barg': (value) => value / 100,
  '°C>°F': (value) => (value * 9) / 5 + 32,
  '°F>°C': (value) => ((value - 32) * 5) / 9,
  '°C>K': (value) => value + 273.15,
  'K>°C': (value) => value - 273.15,
  'm³/h>bbl/d': (value) => value * 150.955,
  'bbl/d>m³/h': (value) => value / 150.955,
  'mm/s>in/s': (value) => value / 25.4,
  'in/s>mm/s': (value) => value * 25.4,
};

/** Converts between the engineering units the plant uses. `null` when the pair is not supported. */
export function convertUnit(value: number, from: string, to: string): number | null {
  if (from === to) return value;
  const convert = CONVERSIONS[`${from}>${to}`];
  return convert ? convert(value) : null;
}

export type CauseState = 'confirmed' | 'ruled-out' | 'open';

const CAUSE_STATUS: Record<CauseState, StatusDescriptor> = {
  confirmed: { tone: 'warning', label: 'Confirmed', shape: 'square' },
  'ruled-out': { tone: 'neutral', label: 'Ruled out', shape: 'ring' },
  open: { tone: 'info', label: 'Open', shape: 'dot' },
};

/** How a suspected cause stands in an investigation, as a descriptor for `StatusIndicator`. */
export const causeStatus = (state: CauseState): StatusDescriptor => CAUSE_STATUS[state];

export type ConditionState = 'met' | 'unmet' | 'bypassed';

/** True when every condition is met. A bypassed condition does not count as met. */
export function allConditionsMet(conditions: readonly { state: ConditionState }[]): boolean {
  return conditions.every((condition) => condition.state === 'met');
}

export type DocumentKind = 'pid' | 'drawing' | 'datasheet' | 'procedure' | 'report' | 'certificate';

const DOCUMENT_KIND_LABEL: Record<DocumentKind, string> = {
  pid: 'P&ID',
  drawing: 'Drawing',
  datasheet: 'Data sheet',
  procedure: 'Procedure',
  report: 'Report',
  certificate: 'Certificate',
};

/** The word for a document kind, for rows, filters and legends. */
export const documentKindLabel = (kind: DocumentKind): string => DOCUMENT_KIND_LABEL[kind];

export type LogCategory = 'operations' | 'safety' | 'maintenance' | 'environment';

const LOG_CATEGORY_LABEL: Record<LogCategory, string> = {
  operations: 'Operations',
  safety: 'Safety',
  maintenance: 'Maintenance',
  environment: 'Environment',
};

/** The word for a shift log category, for badges, filters and headings. */
export const logCategoryLabel = (category: LogCategory): string => LOG_CATEGORY_LABEL[category];
