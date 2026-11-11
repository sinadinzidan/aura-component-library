/** Pure questions about a process line: does mass balance, how far a sequence is, what holds a start. */

export type MassBalance = { totalIn: number; totalOut: number; difference: number; percent: number; closes: boolean };

/** Compares what enters with what leaves. `closes` is true inside the tolerance, in per cent of the feed. */
export function massBalance(inflows: readonly number[], outflows: readonly number[], tolerancePercent = 1): MassBalance {
  const totalIn = inflows.reduce((sum, value) => sum + value, 0);
  const totalOut = outflows.reduce((sum, value) => sum + value, 0);
  const difference = totalIn - totalOut;
  const percent = totalIn === 0 ? 0 : (difference / totalIn) * 100;
  return { totalIn, totalOut, difference, percent, closes: Math.abs(percent) <= tolerancePercent };
}

export type StepState = 'done' | 'active' | 'held' | 'failed' | 'pending';

export type StepProgress = { done: number; total: number; percent: number; current: number | null; held: boolean };

/** How far a sequence has come. `current` is the index of the step in hand, if any. */
export function stepProgress(states: readonly StepState[]): StepProgress {
  const done = states.filter((state) => state === 'done').length;
  const current = states.findIndex((state) => state === 'active' || state === 'held' || state === 'failed');
  return {
    done,
    total: states.length,
    percent: states.length === 0 ? 0 : Math.round((done / states.length) * 100),
    current: current === -1 ? null : current,
    held: states.some((state) => state === 'held' || state === 'failed'),
  };
}

export type ConditionState = 'met' | 'unmet' | 'bypassed';

export type ConditionSummary = { met: number; unmet: number; bypassed: number; total: number; clear: boolean };

/** Counts conditions. A bypassed condition does not block, but it is never counted as met. */
export function summariseConditions(states: readonly ConditionState[]): ConditionSummary {
  const count = (wanted: ConditionState) => states.filter((state) => state === wanted).length;
  const unmet = count('unmet');
  return { met: count('met'), unmet, bypassed: count('bypassed'), total: states.length, clear: unmet === 0 };
}

/** The stage that limits the line: the one running closest to its capacity. */
export function bottleneckOf<Stage extends { id: string; load?: number }>(stages: readonly Stage[]): Stage | undefined {
  return stages.reduce<Stage | undefined>((worst, stage) => (stage.load !== undefined && (worst?.load === undefined || stage.load > worst.load) ? stage : worst), undefined);
}

/** Heights of stacked segments as shares of the total, for drawing a balance. */
export function shares(values: readonly number[]): number[] {
  const total = values.reduce((sum, value) => sum + value, 0);
  return values.map((value) => (total === 0 ? 0 : value / total));
}

export type StackSegment = { top: number; height: number };

/**
 * Stacks values in a column of `height` px with `gap` px between them. A value too small to hold a
 * label still gets `min` px; the others share what is left in proportion.
 */
export function stackLayout(values: readonly number[], height: number, gap = 6, min = 24): StackSegment[] {
  const room = height - gap * Math.max(0, values.length - 1);
  const total = values.reduce((sum, value) => sum + value, 0);
  const raw = values.map((value) => (total === 0 ? room / Math.max(1, values.length) : (value / total) * room));
  const small = raw.map((size) => size < min);
  const reserved = small.filter(Boolean).length * min;
  const largeTotal = raw.reduce((sum, size, index) => (small[index] ? sum : sum + size), 0);
  const sizes = raw.map((size, index) => (small[index] ? min : largeTotal === 0 ? size : (size / largeTotal) * (room - reserved)));
  let top = 0;
  return sizes.map((size) => {
    const segment = { top, height: size };
    top += size + gap;
    return segment;
  });
}
