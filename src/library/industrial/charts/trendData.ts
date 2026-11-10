/** Pure data shaping for `TrendChart`: merging series into rows, aggregation, thresholds and domains. */

export type TrendPoint = { t: number; v: number | null };
export type RangePoint = { t: number; low: number; high: number };
export type AggregatePoint = { t: number; min: number; max: number; avg: number };
export type TrendRow = { t: number } & Record<string, number | null | readonly [number, number]>;

type KeyedPoints = { key: string; points: readonly TrendPoint[] };
type KeyedRanges = { key: string; points: readonly RangePoint[] };

/**
 * One row per timestamp with a column per series, the shape recharts wants. A series with no point
 * at a timestamp gets `null` there, so set `connectNulls` on series sampled less often than others.
 */
export function mergeSeries(series: readonly KeyedPoints[], ranges: readonly KeyedRanges[] = []): TrendRow[] {
  const rows = new Map<number, TrendRow>();
  const rowAt = (t: number): TrendRow => {
    const existing = rows.get(t);
    if (existing) return existing;
    const created: TrendRow = { t };
    for (const entry of series) created[entry.key] = null;
    rows.set(t, created);
    return created;
  };
  for (const entry of series) {
    for (const point of entry.points) rowAt(point.t)[entry.key] = point.v;
  }
  for (const entry of ranges) {
    for (const point of entry.points) rowAt(point.t)[entry.key] = [point.low, point.high];
  }
  return [...rows.values()].sort((a, b) => a.t - b.t);
}

/** Min, max and average per bucket of `bucketMs`, stamped at the bucket start. Null points are skipped. */
export function aggregatePoints(points: readonly TrendPoint[], bucketMs: number): AggregatePoint[] {
  const buckets = new Map<number, number[]>();
  for (const point of points) {
    if (point.v === null) continue;
    const start = Math.floor(point.t / bucketMs) * bucketMs;
    const values = buckets.get(start);
    if (values) values.push(point.v);
    else buckets.set(start, [point.v]);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([t, values]) => ({
      t,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((sum, value) => sum + value, 0) / values.length,
    }));
}

/**
 * Splits a series at a threshold so the part above it can be drawn in another colour. Both results
 * gain a point exactly on the threshold at each crossing, so the coloured part starts and ends on
 * the limit line instead of at the nearest sample.
 */
export function splitAtThreshold(
  points: readonly TrendPoint[],
  threshold: number
): { base: TrendPoint[]; over: TrendPoint[] } {
  const base: TrendPoint[] = [];
  const over: TrendPoint[] = [];
  points.forEach((point, index) => {
    const previous = index > 0 ? points[index - 1] : undefined;
    if (previous && previous.v !== null && point.v !== null) {
      const wasOver = previous.v > threshold;
      const isOver = point.v > threshold;
      if (wasOver !== isOver && previous.v !== threshold && point.v !== threshold) {
        const ratio = (threshold - previous.v) / (point.v - previous.v);
        const crossing = { t: previous.t + (point.t - previous.t) * ratio, v: threshold };
        base.push(crossing);
        over.push(crossing);
      }
    }
    base.push(point);
    over.push({ t: point.t, v: point.v !== null && point.v >= threshold ? point.v : null });
  });
  return { base, over };
}

/** Value of the point closest in time to `t`; `null` when the series is empty or that point is a gap. */
export function valueAt(points: readonly TrendPoint[], t: number): number | null {
  let closest: TrendPoint | undefined;
  for (const point of points) {
    if (!closest || Math.abs(point.t - t) < Math.abs(closest.t - t)) closest = point;
  }
  return closest ? closest.v : null;
}

/** Keeps the points inside `from`–`to`, both ends included. */
export function sliceByTime<T extends { t: number }>(points: readonly T[], from: number, to: number): T[] {
  return points.filter((point) => point.t >= from && point.t <= to);
}

/** Smallest and largest of the given numbers, ignoring nulls. `null` when nothing is left. */
export function extent(values: readonly (number | null | undefined)[]): [number, number] | null {
  let min = Infinity;
  let max = -Infinity;
  for (const value of values) {
    if (value === null || value === undefined || !Number.isFinite(value)) continue;
    if (value < min) min = value;
    if (value > max) max = value;
  }
  return min === Infinity ? null : [min, max];
}

/** Position of `t` between `from` and `to` as a percentage, clamped to 0–100. */
export function timeFraction(t: number, from: number, to: number): number {
  if (!(to > from)) return 0;
  return Math.min(100, Math.max(0, ((t - from) / (to - from)) * 100));
}
