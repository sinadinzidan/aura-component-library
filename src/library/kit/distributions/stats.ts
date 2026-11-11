/** Small statistics helpers for the distribution charts. Pure functions on plain number arrays. */

export type BoxStats = { min: number; q1: number; median: number; q3: number; max: number };

/** Counts per equal-width bin between `min` and `max`; values outside land in the end bins. */
export function bucketize(values: readonly number[], options: { bins: number; min: number; max: number }): number[] {
  const { bins, min, max } = options;
  const counts = Array.from({ length: bins }, () => 0);
  const width = (max - min) / bins || 1;
  for (const value of values) {
    const index = Math.min(bins - 1, Math.max(0, Math.floor((value - min) / width)));
    counts[index] += 1;
  }
  return counts;
}

/** Linear-interpolated quantile, `q` between 0 and 1. */
export function quantile(values: readonly number[], q: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const position = Math.min(1, Math.max(0, q)) * (sorted.length - 1);
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

/** Five-number summary for a box plot. */
export function boxStats(values: readonly number[]): BoxStats {
  return {
    min: quantile(values, 0),
    q1: quantile(values, 0.25),
    median: quantile(values, 0.5),
    q3: quantile(values, 0.75),
    max: quantile(values, 1),
  };
}

/** Pearson correlation of two equally long series, −1 to 1. */
export function correlation(a: readonly number[], b: readonly number[]): number {
  const length = Math.min(a.length, b.length);
  if (length < 2) return 0;
  const meanA = a.slice(0, length).reduce((sum, value) => sum + value, 0) / length;
  const meanB = b.slice(0, length).reduce((sum, value) => sum + value, 0) / length;
  let cross = 0;
  let squareA = 0;
  let squareB = 0;
  for (let index = 0; index < length; index += 1) {
    const da = a[index] - meanA;
    const db = b[index] - meanB;
    cross += da * db;
    squareA += da * da;
    squareB += db * db;
  }
  const scale = Math.sqrt(squareA * squareB);
  return scale === 0 ? 0 : cross / scale;
}

/** Running share of the total after each bin, in percent. */
export function cumulativeShare(counts: readonly number[]): number[] {
  const total = counts.reduce((sum, count) => sum + count, 0) || 1;
  let running = 0;
  return counts.map((count) => {
    running += count;
    return (running / total) * 100;
  });
}

/** Evenly spaced ticks from `min` to `max`, both included. */
export function linearTicks(min: number, max: number, count: number): number[] {
  const steps = Math.max(1, count);
  return Array.from({ length: steps + 1 }, (_, index) => Number((min + ((max - min) * index) / steps).toPrecision(12)));
}

/** Position of a value on a range as a share, clamped to 0–1. */
export function share(value: number, min: number, max: number): number {
  return Math.min(1, Math.max(0, (value - min) / (max - min || 1)));
}

/** The same position as a CSS percentage. */
export function percent(value: number, min: number, max: number): string {
  return `${(share(value, min, max) * 100).toFixed(2)}%`;
}
