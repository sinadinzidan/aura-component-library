/**
 * The colour ramp for values mapped onto a model, coldest first. Resolve the tokens outside the
 * canvas with `useTokenColors(RAMP_TOKENS, ref)`; in the DOM use the matching `RAMP_SWATCH` class.
 */
export const RAMP_TOKENS = {
  step0: 'chart-info-450',
  step1: 'chart-1-450',
  step2: 'chart-warning-450',
  step3: 'chart-critical-450',
} as const;

export type RampKey = keyof typeof RAMP_TOKENS;

export const RAMP_KEYS: readonly RampKey[] = ['step0', 'step1', 'step2', 'step3'];

/** Background utilities for legend swatches, in ramp order. */
export const RAMP_SWATCH: Record<RampKey, string> = {
  step0: 'bg-chart-info-450',
  step1: 'bg-chart-1-450',
  step2: 'bg-chart-warning-450',
  step3: 'bg-chart-critical-450',
};

/** Words for the steps, so a legend never relies on colour alone. */
export const RAMP_LABELS: Record<RampKey, string> = { step0: 'Low', step1: 'Normal', step2: 'Elevated', step3: 'High' };

/** Which of `steps` equal bands a value falls in, clamped to the domain. The top of the domain is in the last band. */
export function rampIndex(value: number, min: number, max: number, steps: number = RAMP_KEYS.length): number {
  const count = Math.max(1, Math.floor(steps));
  if (!Number.isFinite(value) || max <= min) return 0;
  const fraction = (value - min) / (max - min);
  return Math.min(count - 1, Math.max(0, Math.floor(fraction * count)));
}

/** The ramp key for a value. */
export function rampKey(value: number, min: number, max: number): RampKey {
  return RAMP_KEYS[rampIndex(value, min, max, RAMP_KEYS.length)];
}

/** The value range each band covers, coldest first, for a legend. */
export function rampStops(min: number, max: number, steps: number = RAMP_KEYS.length): { from: number; to: number }[] {
  const count = Math.max(1, Math.floor(steps));
  const width = (max - min) / count;
  return Array.from({ length: count }, (_, index) => ({ from: min + index * width, to: index === count - 1 ? max : min + (index + 1) * width }));
}
