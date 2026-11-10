import type { StatusDescriptor, Tone } from '../status';

/** Life cycle of a simulation run. */
export type RunStatus = 'draft' | 'queued' | 'running' | 'done' | 'failed';

const RUN_STATUS: Record<RunStatus, StatusDescriptor> = {
  draft: { tone: 'neutral', label: 'Draft', shape: 'ring' },
  queued: { tone: 'neutral', label: 'Queued', shape: 'square' },
  running: { tone: 'info', label: 'Running', shape: 'ring' },
  done: { tone: 'success', label: 'Done', shape: 'dot' },
  failed: { tone: 'critical', label: 'Failed', shape: 'diamond' },
};

/** Tone, label and shape of a run status: spread it into `StatusIndicator`. */
export const runStatus = (status: RunStatus): StatusDescriptor => RUN_STATUS[status];

export type TornadoInput = { id: string; label: string; low: number; high: number; lowLabel?: string; highLabel?: string };

export type TornadoRow = TornadoInput & {
  /** Smaller and larger of the two outcomes. */
  from: number;
  to: number;
  /** Total swing of the outcome across the input's range. */
  span: number;
};

/** Sensitivity rows sorted by swing, largest first — the shape that gives the chart its name. */
export function tornadoRows(items: readonly TornadoInput[]): TornadoRow[] {
  return items
    .map((item) => ({ ...item, from: Math.min(item.low, item.high), to: Math.max(item.low, item.high), span: Math.abs(item.high - item.low) }))
    .sort((a, b) => b.span - a.span);
}

/** A shared, symmetric-enough scale for a tornado chart: covers every outcome and the baseline. */
export function tornadoDomain(rows: readonly TornadoRow[], baseline: number): [number, number] {
  const low = Math.min(baseline, ...rows.map((row) => row.from));
  const high = Math.max(baseline, ...rows.map((row) => row.to));
  const pad = (high - low) * 0.05 || Math.abs(baseline) * 0.05 || 1;
  return [low - pad, high + pad];
}

export type ConstraintCheck = { ok: boolean; tone: Tone; label: string; margin: number };

/** A result against a constraint: respected or violated, with the distance to the nearest bound. */
export function checkConstraint(value: number, bounds: { min?: number; max?: number }): ConstraintCheck {
  const margins = [bounds.max === undefined ? Infinity : bounds.max - value, bounds.min === undefined ? Infinity : value - bounds.min];
  const margin = Math.min(...margins);
  const ok = margin >= 0;
  return { ok, tone: ok ? 'success' : 'critical', label: ok ? 'Respected' : 'Violated', margin };
}

/** Relative change of a scenario against its baseline, in percent. `null` for a zero baseline. */
export function percentChange(scenario: number, baseline: number): number | null {
  if (baseline === 0) return null;
  return ((scenario - baseline) / Math.abs(baseline)) * 100;
}
