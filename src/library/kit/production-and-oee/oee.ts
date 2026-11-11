import type { Tone } from '../tones';

export type OeeFactor = {
  /** "Availability", "Performance", "Quality". */
  label: string;
  /** Percent, 0–100. */
  value: number;
  target?: number;
  tone: Tone;
  /** What the factor lost, in words: "31 h of stops". */
  detail?: string;
};

/** OEE in percent: the product of its factors, each given in percent. */
export function oeeOf(factors: readonly Pick<OeeFactor, 'value'>[]): number {
  return factors.reduce((product, factor) => (product * factor.value) / 100, 100);
}

export type WaterfallLoss = { label: string; value: number; tone?: Tone };

export type WaterfallColumn = {
  label: string;
  kind: 'total' | 'loss' | 'result';
  /** Lower and upper edge of the bar, in the unit of the chart. */
  from: number;
  to: number;
  value: number;
  tone: Tone;
};

/** Turns a starting total and its losses into floating columns that step down to the result. */
export function waterfallColumns(total: { label: string; value: number }, losses: readonly WaterfallLoss[], resultLabel: string): WaterfallColumn[] {
  const columns: WaterfallColumn[] = [{ label: total.label, kind: 'total', from: 0, to: total.value, value: total.value, tone: 'neutral' }];
  let level = total.value;
  for (const loss of losses) {
    const next = level - loss.value;
    columns.push({ label: loss.label, kind: 'loss', from: next, to: level, value: loss.value, tone: loss.tone ?? 'warning' });
    level = next;
  }
  columns.push({ label: resultLabel, kind: 'result', from: 0, to: level, value: level, tone: 'accent' });
  return columns;
}

export type StateSegment = { from: number; to: number; state: string; tone: Tone };

/** Total length of the segments in one state, in the unit of the strip. */
export function stateDuration(segments: readonly StateSegment[], state: string): number {
  return segments.filter((segment) => segment.state === state).reduce((sum, segment) => sum + (segment.to - segment.from), 0);
}
