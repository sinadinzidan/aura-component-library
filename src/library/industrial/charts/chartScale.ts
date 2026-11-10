/** Scale and label helpers shared by the recharts-based industrial charts. */

import { niceTicks } from './stats';
import { extent } from './trendData';

/**
 * Opacity of the fill under an area series. The fill reuses the series colour instead of a lighter
 * token, because only the tokens a stylesheet references are guaranteed to exist at runtime.
 */
export const AREA_OPACITY = 0.14;

/**
 * Where an event label goes: centred above its line, or tucked inside the plot beside the line
 * when the event is so close to an edge that a centred label would be cut off.
 */
export function eventLabelPosition(label: string, percent: number): 'top' | 'insideTopLeft' | 'insideTopRight' {
  const reach = Math.min(30, label.length * 1.2);
  if (percent > 100 - reach) return 'insideTopRight';
  if (percent < reach) return 'insideTopLeft';
  return 'top';
}

export type AxisScale = { domain: [number, number]; ticks: number[] };

/** A padded, round y scale for the given values, or the explicit domain when one is set. */
export function axisScale(
  values: readonly (number | null | undefined)[],
  explicit?: readonly [number, number],
  explicitTicks?: readonly number[]
): AxisScale {
  if (explicit) {
    const ticks = explicitTicks ?? niceTicks(explicit[0], explicit[1]).filter((tick) => tick >= explicit[0] && tick <= explicit[1]);
    return { domain: [explicit[0], explicit[1]], ticks: [...ticks] };
  }
  const range = extent(values) ?? [0, 1];
  const padding = (range[1] - range[0]) * 0.08 || Math.abs(range[1]) * 0.05 || 1;
  const ticks = niceTicks(range[0] - padding, range[1] + padding);
  return { domain: [ticks[0], ticks[ticks.length - 1]], ticks };
}
