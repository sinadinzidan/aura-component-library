/**
 * Steps of a loss waterfall: a starting total, the losses that eat into it, and the total that is
 * left. Each step carries the level it starts and ends on, so a chart only has to draw bars.
 */
export type WaterfallLoss = { id: string; label: string; value: number };

export type WaterfallStep = {
  id: string;
  label: string;
  kind: 'start' | 'loss' | 'end';
  /** Size of the bar: the total for `start` and `end`, the loss for `loss`. */
  value: number;
  /** Lower and upper level of the bar. */
  from: number;
  to: number;
  /** Share of the starting total, 0–1. */
  share: number;
};

export type WaterfallInput = {
  start: { id?: string; label: string; value: number };
  losses: readonly WaterfallLoss[];
  endLabel: string;
  endId?: string;
};

const clean = (value: number): number => Math.round(value * 1e6) / 1e6;

/** Start, one step per loss (each hanging from the level the previous one left), then the end. */
export function waterfallSteps({ start, losses, endLabel, endId = 'end' }: WaterfallInput): WaterfallStep[] {
  const share = (value: number): number => (start.value === 0 ? 0 : clean(value / start.value));
  const steps: WaterfallStep[] = [
    { id: start.id ?? 'start', label: start.label, kind: 'start', value: start.value, from: 0, to: start.value, share: share(start.value) },
  ];
  let level = start.value;
  for (const loss of losses) {
    const size = Math.max(loss.value, 0);
    const next = clean(level - size);
    steps.push({ id: loss.id, label: loss.label, kind: 'loss', value: size, from: next, to: level, share: share(size) });
    level = next;
  }
  steps.push({ id: endId, label: endLabel, kind: 'end', value: level, from: 0, to: level, share: share(level) });
  return steps;
}

/** Sum of the losses in a set of steps. */
export function totalLoss(steps: readonly WaterfallStep[]): number {
  return clean(steps.filter((step) => step.kind === 'loss').reduce((sum, step) => sum + step.value, 0));
}

/**
 * A y range that keeps small losses readable: it starts a little below the end total instead of
 * at zero when the losses are a small part of the start. Returns `[0, start]` when zero is close
 * enough to keep. `floorStep` rounds the lower end down to a tidy number.
 */
export function waterfallDomain(steps: readonly WaterfallStep[], floorStep = 1): [number, number] {
  const top = Math.max(...steps.map((step) => step.to), 0);
  const lowest = Math.min(...steps.map((step) => (step.kind === 'loss' ? step.from : step.to)));
  const lost = top - lowest;
  if (top === 0 || lost / top > 0.4) return [0, top];
  const floor = Math.floor((lowest - lost * 0.6) / floorStep) * floorStep;
  return [Math.max(clean(floor), 0), top];
}
