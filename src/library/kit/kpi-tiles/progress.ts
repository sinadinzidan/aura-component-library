import type { Tone } from '../tones';

/** Which direction is good news for a figure. */
export type GoodDirection = 'up' | 'down';

export type Judgement = { tone: Tone; word: string };

/** The value as a share of its target, in percent. Zero when there is no target to measure against. */
export function shareOfTarget(value: number, target: number): number {
  if (target === 0) return 0;
  return (value / target) * 100;
}

/**
 * Judges a figure against its target. Within `watchBand` (a share of the target) on the wrong side
 * is "Watch"; further out is "Off target".
 */
export function judgeAgainstTarget(value: number, target: number, good: GoodDirection = 'up', watchBand = 0.05): Judgement {
  const miss = good === 'up' ? target - value : value - target;
  if (miss <= 0) return { tone: 'success', word: 'On target' };
  if (miss <= Math.abs(target) * watchBand) return { tone: 'warning', word: 'Watch' };
  return { tone: 'critical', word: 'Off target' };
}

/** How many of `blocks` are filled for `value` on a scale that ends at `max`. */
export function filledBlocks(value: number, max: number, blocks: number): number {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(blocks, Math.round((value / max) * blocks)));
}

/** Position of a value on a scale from zero to `max`, clamped to 0–100 percent. */
export function scalePosition(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, (value / max) * 100));
}
