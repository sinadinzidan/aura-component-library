/**
 * Geometry of a replay scrubber: where a time sits on the track, which time a pointer position
 * means, what a signal reads at the playhead and the path that draws it. Pure, so the scrubber
 * component only lays the results out.
 */

export type LanePoint = { t: number; v: number };

/** Position of `t` on the window as a 0–1 fraction, clamped to the window. */
export function fractionAt(t: number, from: number, to: number): number {
  if (to <= from) return 0;
  return Math.min(Math.max((t - from) / (to - from), 0), 1);
}

/** The time a 0–1 position on the track means, snapped to whole steps and kept inside the window. */
export function timeAtFraction(fraction: number, from: number, to: number, stepMs = 1): number {
  const bounded = Math.min(Math.max(fraction, 0), 1);
  const raw = from + bounded * (to - from);
  if (stepMs <= 1) return raw;
  return Math.min(from + Math.round((raw - from) / stepMs) * stepMs, to);
}

/** Value at `t`, interpolated between samples. `null` before the first sample; holds after the last. */
export function laneValueAt(points: readonly LanePoint[], t: number): number | null {
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last || t < first.t) return null;
  if (t >= last.t) return last.v;
  const nextIndex = points.findIndex((point) => point.t > t);
  const before = points[nextIndex - 1] ?? first;
  const after = points[nextIndex] ?? last;
  const span = after.t - before.t;
  return span <= 0 ? before.v : before.v + ((after.v - before.v) * (t - before.t)) / span;
}

/** Height of a value inside a lane of `height`, measured from the top; values outside the domain are clamped. */
export function laneY(value: number, domain: readonly [number, number], height: number): number {
  const [min, max] = domain;
  if (max <= min) return height;
  const share = Math.min(Math.max((value - min) / (max - min), 0), 1);
  return Number((height - share * height).toFixed(2));
}

/** SVG path of a signal across a lane `width` wide and `height` tall. Empty when there is nothing to draw. */
export function lanePath(points: readonly LanePoint[], from: number, to: number, domain: readonly [number, number], width: number, height: number): string {
  if (points.length === 0) return '';
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${(fractionAt(point.t, from, to) * width).toFixed(1)} ${laneY(point.v, domain, height)}`)
    .join(' ');
}

/** The event whose time is nearest before or after `t`, in the direction asked; `null` at either end. */
export function neighbourEvent<Event extends { t: number }>(events: readonly Event[], t: number, direction: 1 | -1): Event | null {
  const sorted = [...events].sort((a, b) => a.t - b.t);
  if (direction === 1) return sorted.find((event) => event.t > t) ?? null;
  return [...sorted].reverse().find((event) => event.t < t) ?? null;
}

/** Index of the latest event at or before `t`; -1 before the first. Events must be sorted by time. */
export function reachedIndex(events: readonly { t: number }[], t: number): number {
  let index = -1;
  events.forEach((event, position) => {
    if (event.t <= t) index = position;
  });
  return index;
}
