/** Pure arithmetic on a time window, shared by the stepper, zoom and playback controls. */

export type TimeWindow = readonly [from: number, to: number];

export type WindowBounds = {
  /** Latest allowed end, normally "now": a window never reaches into the future. */
  max?: number;
  /** Earliest allowed start, e.g. the first datapoint. */
  min?: number;
  minSpanMs?: number;
  maxSpanMs?: number;
};

/** Moves a window so it fits inside `min`–`max`, keeping its length where possible. */
export function clampWindow([from, to]: TimeWindow, { min, max }: WindowBounds = {}): [number, number] {
  let start = from;
  let end = to;
  if (max !== undefined && end > max) {
    start -= end - max;
    end = max;
  }
  if (min !== undefined && start < min) {
    end = max === undefined ? end + (min - start) : Math.min(max, end + (min - start));
    start = min;
  }
  return [start, end];
}

/** The window of length `spanMs` that ends at `end`. */
export function windowEndingAt(end: number, spanMs: number): [number, number] {
  return [end - spanMs, end];
}

/** Steps a window back (`-1`) or forward (`1`) by `fraction` of its own length. */
export function shiftWindow(window: TimeWindow, direction: -1 | 1, bounds: WindowBounds = {}, fraction = 1): [number, number] {
  const offset = (window[1] - window[0]) * fraction * direction;
  return clampWindow([window[0] + offset, window[1] + offset], bounds);
}

/** Whether a window can still move forward before it hits `max`. */
export function canShiftForward(window: TimeWindow, bounds: WindowBounds = {}): boolean {
  return bounds.max === undefined || window[1] < bounds.max;
}

/** Whether a window can still move back before it hits `min`. */
export function canShiftBack(window: TimeWindow, bounds: WindowBounds = {}): boolean {
  return bounds.min === undefined || window[0] > bounds.min;
}

/**
 * Scales a window by `factor` (0.5 zooms in to half the span, 2 zooms out to double). `end` keeps
 * the latest edge fixed, which suits live trends; `center` keeps the middle fixed.
 */
export function zoomWindow(window: TimeWindow, factor: number, bounds: WindowBounds = {}, anchor: 'center' | 'end' = 'center'): [number, number] {
  const span = window[1] - window[0];
  const target = Math.min(bounds.maxSpanMs ?? Infinity, Math.max(bounds.minSpanMs ?? 0, span * factor));
  if (anchor === 'end') return clampWindow([window[1] - target, window[1]], bounds);
  const middle = (window[0] + window[1]) / 2;
  return clampWindow([middle - target / 2, middle + target / 2], bounds);
}

/** Whether zooming by `factor` would change the span, given the span limits. */
export function canZoom(window: TimeWindow, factor: number, bounds: WindowBounds = {}): boolean {
  const span = window[1] - window[0];
  const target = Math.min(bounds.maxSpanMs ?? Infinity, Math.max(bounds.minSpanMs ?? 0, span * factor));
  return target !== span;
}

/** The next playback position, stopping at `to`. */
export function advancePlayback(position: number, stepMs: number, speed: number, to: number): number {
  return Math.min(to, position + stepMs * speed);
}

/** The speed after `current` in the list, wrapping to the first. */
export function nextSpeed(speeds: readonly number[], current: number): number {
  const index = speeds.indexOf(current);
  return speeds[(index + 1) % speeds.length] ?? current;
}
