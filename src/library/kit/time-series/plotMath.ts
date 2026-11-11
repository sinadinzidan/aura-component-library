/**
 * Geometry and statistics for hand-drawn time-series plots: scales, tick positions, path
 * building with gaps, and the aggregates a trend header needs. Pure functions only.
 */

export type Scale = { min: number; max: number; ticks: number[] };

/** A y scale with round tick values that covers `low`–`high` with a little headroom. */
export function niceScale(low: number, high: number, count = 4): Scale {
  const span = high - low || Math.abs(high) || 1;
  const rough = (span * 1.1) / count;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((factor) => factor * magnitude).find((candidate) => candidate >= rough) ?? rough;
  const min = Math.floor((low - span * 0.04) / step) * step;
  const max = Math.ceil((high + span * 0.04) / step) * step;
  const steps = Math.round((max - min) / step);
  const ticks = Array.from({ length: steps + 1 }, (_, index) => Number((min + index * step).toPrecision(12)));
  return { min: Number(min.toPrecision(12)), max: Number(max.toPrecision(12)), ticks };
}

/** A fixed scale from `min` to `max` with round ticks inside it. */
export function fixedScale(min: number, max: number, count = 4): Scale {
  const rough = (max - min || 1) / count;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((factor) => factor * magnitude).find((candidate) => candidate >= rough - 1e-9) ?? rough;
  const first = Math.ceil(min / step - 1e-9) * step;
  const ticks: number[] = [];
  for (let tick = first; tick <= max + step * 1e-9; tick += step) ticks.push(Number(tick.toPrecision(12)));
  return { min, max, ticks };
}

/** Position of a value on a scale as a share from 0 (min) to 1 (max), clamped. */
export function share(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

/** Smallest and largest number in the lists, skipping gaps. */
export function extent(lists: ReadonlyArray<ReadonlyArray<number | null>>): [number, number] {
  let low = Number.POSITIVE_INFINITY;
  let high = Number.NEGATIVE_INFINITY;
  for (const list of lists) {
    for (const value of list) {
      if (value === null) continue;
      if (value < low) low = value;
      if (value > high) high = value;
    }
  }
  return Number.isFinite(low) ? [low, high] : [0, 1];
}

export type Point = { x: number; y: number };

/** Splits a series into runs of consecutive points, breaking at gaps (`null`). */
export function runs(values: ReadonlyArray<number | null>, toPoint: (value: number, index: number) => Point): Point[][] {
  const result: Point[][] = [];
  let current: Point[] = [];
  values.forEach((value, index) => {
    if (value === null) {
      if (current.length > 0) result.push(current);
      current = [];
      return;
    }
    current.push(toPoint(value, index));
  });
  if (current.length > 0) result.push(current);
  return result;
}

const fixed = (value: number): string => value.toFixed(1);

/** An SVG path through the points: straight, stepped (value holds until the next sample) or smoothed. */
export function linePath(points: readonly Point[], curve: 'linear' | 'stepAfter' | 'monotone'): string {
  if (points.length === 0) return '';
  const [first, ...rest] = points;
  let path = `M${fixed(first.x)} ${fixed(first.y)}`;
  if (curve === 'linear') return path + rest.map((point) => `L${fixed(point.x)} ${fixed(point.y)}`).join('');
  if (curve === 'stepAfter') {
    let previous = first;
    for (const point of rest) {
      path += `H${fixed(point.x)}V${fixed(point.y)}`;
      previous = point;
    }
    return previous === first ? `${path}h0` : path;
  }
  for (let index = 0; index < points.length - 1; index += 1) {
    const before = points[Math.max(index - 1, 0)];
    const from = points[index];
    const to = points[index + 1];
    const after = points[Math.min(index + 2, points.length - 1)];
    const low = Math.min(from.y, to.y);
    const high = Math.max(from.y, to.y);
    const clamp = (value: number): number => Math.min(high, Math.max(low, value));
    const c1 = { x: from.x + (to.x - before.x) / 6, y: clamp(from.y + (to.y - before.y) / 6) };
    const c2 = { x: to.x - (after.x - from.x) / 6, y: clamp(to.y - (after.y - from.y) / 6) };
    path += `C${fixed(c1.x)} ${fixed(c1.y)} ${fixed(c2.x)} ${fixed(c2.y)} ${fixed(to.x)} ${fixed(to.y)}`;
  }
  return path;
}

/** Closes a line path down to `baseline`, for the fill under a series. */
export function areaPath(points: readonly Point[], curve: 'linear' | 'stepAfter' | 'monotone', baseline: number): string {
  if (points.length === 0) return '';
  const last = points[points.length - 1];
  return `${linePath(points, curve)}L${fixed(last.x)} ${fixed(baseline)}L${fixed(points[0].x)} ${fixed(baseline)}Z`;
}

export type Summary = { min: number; max: number; mean: number; last: number; first: number; change: number; count: number };

/** Min, max, mean, first, last and change of a series, skipping gaps. */
export function summarise(values: ReadonlyArray<number | null>): Summary {
  const present = values.filter((value): value is number => value !== null);
  if (present.length === 0) return { min: 0, max: 0, mean: 0, last: 0, first: 0, change: 0, count: 0 };
  const total = present.reduce((sum, value) => sum + value, 0);
  const first = present[0];
  const last = present[present.length - 1];
  return { min: Math.min(...present), max: Math.max(...present), mean: total / present.length, last, first, change: last - first, count: present.length };
}

export type Bucket = { min: number; max: number; mean: number };

/** Aggregates raw samples into buckets of `size` points: the min, max and mean of each. */
export function aggregate(values: readonly number[], size: number): Bucket[] {
  const width = Math.max(1, Math.floor(size));
  const buckets: Bucket[] = [];
  for (let start = 0; start < values.length; start += width) {
    const slice = values.slice(start, start + width);
    buckets.push({ min: Math.min(...slice), max: Math.max(...slice), mean: slice.reduce((sum, value) => sum + value, 0) / slice.length });
  }
  return buckets;
}

/** Evenly spaced indexes into a list of `length`, always including the first and the last. */
export function tickIndexes(length: number, count: number): number[] {
  if (length <= 1) return length === 1 ? [0] : [];
  const steps = Math.max(1, Math.min(count - 1, length - 1));
  return Array.from({ length: steps + 1 }, (_, index) => Math.round((index * (length - 1)) / steps));
}
