/** Arps decline parameters for one well or field. */
export type DeclineParameters = {
  /** Rate at the start of the decline. */
  initialRate: number;
  /** Nominal decline per month at the start, as a fraction (0.03 = 3 % per month). */
  declineRate: number;
  /** Arps exponent: 0 is exponential, 0–1 hyperbolic, 1 harmonic. */
  exponent?: number;
};

export type DeclinePoint = { t: number; v: number };

export type DeclineSeriesOptions = DeclineParameters & {
  /** Number of monthly points, including the first. */
  months: number;
  /** Timestamp of the first point. */
  start: number;
  /** Milliseconds between points. Defaults to 30 days. */
  stepMs?: number;
  /** Month number of the first point on the curve, for a forecast that continues a history. */
  offsetMonths?: number;
  decimals?: number;
};

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

/** Rate after `months` on an Arps curve. Never negative; a non-positive decline holds the rate. */
export function declineRateAt({ initialRate, declineRate, exponent = 0 }: DeclineParameters, months: number): number {
  const elapsed = Math.max(0, months);
  if (!(declineRate > 0)) return Math.max(0, initialRate);
  const b = Math.min(1, Math.max(0, exponent));
  const rate = b === 0 ? initialRate * Math.exp(-declineRate * elapsed) : initialRate / (1 + b * declineRate * elapsed) ** (1 / b);
  return Math.max(0, rate);
}

/** One rate per month along an Arps decline curve, oldest first. */
export function declineSeries({ months, start, stepMs = THIRTY_DAYS, offsetMonths = 0, decimals = 0, ...parameters }: DeclineSeriesOptions): DeclinePoint[] {
  const factor = 10 ** decimals;
  return Array.from({ length: Math.max(0, months) }, (_, index) => ({
    t: start + index * stepMs,
    v: Math.round(declineRateAt(parameters, offsetMonths + index) * factor) / factor,
  }));
}

/**
 * Months until the rate falls to an economic limit, rounded up. `null` when the curve never gets
 * there: no decline, or a limit at or below zero. Zero when the well is already at the limit.
 */
export function monthsToLimit({ initialRate, declineRate, exponent = 0 }: DeclineParameters, limit: number): number | null {
  if (!(limit > 0) || !(declineRate > 0)) return null;
  if (initialRate <= limit) return 0;
  const b = Math.min(1, Math.max(0, exponent));
  const months = b === 0 ? Math.log(initialRate / limit) / declineRate : ((initialRate / limit) ** b - 1) / (b * declineRate);
  return Math.ceil(months - 1e-9);
}
