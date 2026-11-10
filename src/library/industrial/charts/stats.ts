/** Pure statistics helpers behind the distribution and production charts. */

export type Bin = { from: number; to: number; count: number };

export type BucketOptions = {
  /** Number of equal-width bins. */
  bins: number;
  /** Lower edge of the first bin. Defaults to the smallest value. */
  min?: number;
  /** Upper edge of the last bin. Defaults to the largest value. */
  max?: number;
};

/** Counts values into equal-width bins. Values outside `min`–`max` are dropped; `max` lands in the last bin. */
export function bucketize(values: readonly number[], options: BucketOptions): Bin[] {
  const finite = values.filter((value) => Number.isFinite(value));
  const count = Math.max(1, Math.floor(options.bins));
  if (finite.length === 0 && (options.min === undefined || options.max === undefined)) return [];
  const min = options.min ?? Math.min(...finite);
  const max = options.max ?? Math.max(...finite);
  const width = max > min ? (max - min) / count : 1;
  const bins: Bin[] = Array.from({ length: count }, (_, index) => ({
    from: min + index * width,
    to: min + (index + 1) * width,
    count: 0,
  }));
  for (const value of finite) {
    if (value < min || value > max) continue;
    const index = Math.min(count - 1, Math.floor((value - min) / width));
    bins[index].count += 1;
  }
  return bins;
}

/** Linear-interpolated quantile (`q` from 0 to 1) of values in any order. `null` when there are none. */
export function quantile(values: readonly number[], q: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const position = Math.min(1, Math.max(0, q)) * (sorted.length - 1);
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

export type BoxStats = { min: number; q1: number; median: number; q3: number; max: number };

/** Five-number summary for a box plot. `null` when there are no values. */
export function boxStats(values: readonly number[]): BoxStats | null {
  if (values.length === 0) return null;
  return {
    min: Math.min(...values),
    q1: quantile(values, 0.25) ?? 0,
    median: quantile(values, 0.5) ?? 0,
    q3: quantile(values, 0.75) ?? 0,
    max: Math.max(...values),
  };
}

export type ParetoInput = { label: string; value: number };
export type ParetoRow = ParetoInput & {
  /** Share of the total, 0–100. */
  share: number;
  /** Running share including this row, 0–100. */
  cumulative: number;
};

/** Sorts causes largest first and adds each one's share and the running total, as a Pareto chart needs. */
export function paretoRows(rows: readonly ParetoInput[]): ParetoRow[] {
  const sorted = [...rows].sort((a, b) => b.value - a.value);
  const total = sorted.reduce((sum, row) => sum + row.value, 0);
  let running = 0;
  return sorted.map((row) => {
    running += row.value;
    return {
      ...row,
      share: total === 0 ? 0 : (row.value / total) * 100,
      cumulative: total === 0 ? 0 : (running / total) * 100,
    };
  });
}

/** How many leading Pareto rows it takes to reach `threshold` percent of the total. */
export function vitalFew(rows: readonly ParetoRow[], threshold = 80): number {
  const index = rows.findIndex((row) => row.cumulative >= threshold);
  return index === -1 ? rows.length : index + 1;
}

export type CumulativePoint = { value: number; share: number };

/** Empirical cumulative distribution: for each sorted value, the percent of values at or below it. */
export function cumulativeDistribution(values: readonly number[]): CumulativePoint[] {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.map((value, index) => ({ value, share: ((index + 1) / sorted.length) * 100 }));
}

/** Pearson correlation of two equally long series, −1 to 1. `0` when either has no variance. */
export function correlation(a: readonly number[], b: readonly number[]): number {
  const length = Math.min(a.length, b.length);
  if (length < 2) return 0;
  const meanA = a.slice(0, length).reduce((sum, value) => sum + value, 0) / length;
  const meanB = b.slice(0, length).reduce((sum, value) => sum + value, 0) / length;
  let covariance = 0;
  let varianceA = 0;
  let varianceB = 0;
  for (let index = 0; index < length; index += 1) {
    const deltaA = a[index] - meanA;
    const deltaB = b[index] - meanB;
    covariance += deltaA * deltaB;
    varianceA += deltaA * deltaA;
    varianceB += deltaB * deltaB;
  }
  const denominator = Math.sqrt(varianceA * varianceB);
  return denominator === 0 ? 0 : covariance / denominator;
}

export type Summary = { count: number; min: number; max: number; mean: number; last: number };

/** Count, range, mean and latest value of a series. `null` when it is empty. */
export function summarize(values: readonly number[]): Summary | null {
  if (values.length === 0) return null;
  return {
    count: values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    mean: values.reduce((sum, value) => sum + value, 0) / values.length,
    last: values[values.length - 1],
  };
}

/** Which of `levels` equal steps a value falls in, from 0 (lowest) to `levels - 1`. */
export function heatLevel(value: number, min: number, max: number, levels = 4): number {
  if (!(max > min)) return 0;
  const ratio = (value - min) / (max - min);
  return Math.min(levels - 1, Math.max(0, Math.floor(ratio * levels)));
}

function niceStep(rough: number): number {
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const fraction = rough / magnitude;
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;
  return nice * magnitude;
}

/** Round axis ticks that cover `min`–`max` in about `target` steps: 40, 45, 50, 55 rather than 41.3, 46.1. */
export function niceTicks(min: number, max: number, target = 4): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
  if (max <= min) return [min];
  const step = niceStep((max - min) / Math.max(target, 1));
  const start = Math.floor(min / step + 1e-9) * step;
  const end = Math.ceil(max / step - 1e-9) * step;
  const ticks: number[] = [];
  for (let index = 0; start + index * step <= end + step / 1e6; index += 1) {
    ticks.push(Number((start + index * step).toPrecision(12)));
  }
  return ticks;
}
