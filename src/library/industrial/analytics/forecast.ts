/**
 * Pure forecast helpers for the analytics components: extend a series along its recent trend,
 * widen a confidence band around it, find when it reaches a limit and score a backtest. No clock
 * and no randomness — the same history always gives the same forecast.
 */

export type ForecastPoint = { t: number; v: number };
export type ForecastSample = { t: number; v: number | null };
export type ForecastRange = { t: number; low: number; high: number };

export type ExtendOptions = {
  /** Number of future points. */
  steps: number;
  /** Spacing of the future points. Defaults to the spacing of the last two samples. */
  stepMs?: number;
  /** How many of the latest samples set the trend. */
  lookback?: number;
  /** Scales the fitted slope: 0 holds the last value, 1 follows the trend, 2 doubles it. */
  slopeFactor?: number;
  /** Size of a repeating wave added on top of the trend, for daily patterns. */
  amplitude?: number;
  /** Length of one wave in steps. */
  periodSteps?: number;
  decimals?: number;
  /** Clamp range, for values that cannot leave a physical scale. */
  min?: number;
  max?: number;
};

export type BandOptions = {
  /** Half-width at the first forecast point. */
  initial: number;
  /** Half-width added by the last forecast point. */
  growth: number;
  /** `sqrt` widens fast and then slows, like accumulated random error; `linear` widens evenly. */
  shape?: 'sqrt' | 'linear';
  decimals?: number;
};

export type ConfidenceLevel = 'high' | 'medium' | 'low';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function hasValue(sample: ForecastSample): sample is ForecastPoint {
  return sample.v !== null && Number.isFinite(sample.v);
}

/** The samples that carry a value, in the order given. */
export function knownPoints(samples: readonly ForecastSample[]): ForecastPoint[] {
  return samples.filter(hasValue);
}

/** Least-squares slope of the samples in value per millisecond. Zero for fewer than two samples. */
export function trendSlope(samples: readonly ForecastSample[]): number {
  const points = knownPoints(samples);
  if (points.length < 2) return 0;
  const meanT = points.reduce((sum, point) => sum + point.t, 0) / points.length;
  const meanV = points.reduce((sum, point) => sum + point.v, 0) / points.length;
  let numerator = 0;
  let denominator = 0;
  for (const point of points) {
    numerator += (point.t - meanT) * (point.v - meanV);
    denominator += (point.t - meanT) ** 2;
  }
  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Future points continuing a series from its last value along the slope of its latest samples.
 * The first returned point is one step after the last sample; the history itself is not repeated.
 */
export function extendSeries(history: readonly ForecastSample[], options: ExtendOptions): ForecastPoint[] {
  const points = knownPoints(history);
  const last = points[points.length - 1];
  if (!last || options.steps <= 0) return [];
  const { steps, lookback = 12, slopeFactor = 1, amplitude = 0, periodSteps = 24, decimals = 1, min = -Infinity, max = Infinity } = options;
  const previous = points[points.length - 2];
  const stepMs = options.stepMs ?? (previous ? last.t - previous.t : HOUR);
  const slope = trendSlope(points.slice(-Math.max(lookback, 2))) * slopeFactor;

  return Array.from({ length: steps }, (_, index) => {
    const step = index + 1;
    const wave = amplitude === 0 ? 0 : Math.sin((step / periodSteps) * Math.PI * 2) * amplitude;
    const value = Math.min(max, Math.max(min, last.v + slope * stepMs * step + wave));
    return { t: last.t + step * stepMs, v: round(value, decimals) };
  });
}

/** A band around a forecast that widens with the horizon, e.g. the P10–P90 range. */
export function confidenceBand(forecast: readonly ForecastPoint[], { initial, growth, shape = 'sqrt', decimals = 1 }: BandOptions): ForecastRange[] {
  const last = Math.max(forecast.length - 1, 1);
  return forecast.map((point, index) => {
    const progress = index / last;
    const half = initial + growth * (shape === 'sqrt' ? Math.sqrt(progress) : progress);
    return { t: point.t, low: round(point.v - half, decimals), high: round(point.v + half, decimals) };
  });
}

/**
 * When a series first reaches a limit, interpolated between the two samples around the crossing.
 * `rising` looks for the value going up through the limit, `falling` for it going down.
 * `null` when the series never gets there; the first timestamp when it starts beyond the limit.
 */
export function timeToLimit(samples: readonly ForecastSample[], limit: number, direction: 'rising' | 'falling' = 'rising'): number | null {
  const points = knownPoints(samples);
  const beyond = (value: number) => (direction === 'rising' ? value >= limit : value <= limit);
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    if (!beyond(point.v)) continue;
    const before = points[index - 1];
    if (!before || before.v === point.v) return point.t;
    const fraction = (limit - before.v) / (point.v - before.v);
    return Math.round(before.t + fraction * (point.t - before.t));
  }
  return null;
}

/** Absolute error of each prediction in percent of the actual value, matched by timestamp. */
export function percentErrors(actual: readonly ForecastSample[], predicted: readonly ForecastSample[]): ForecastPoint[] {
  const byTime = new Map(knownPoints(predicted).map((point) => [point.t, point.v]));
  return knownPoints(actual).flatMap((point) => {
    const forecast = byTime.get(point.t);
    if (forecast === undefined || point.v === 0) return [];
    return [{ t: point.t, v: (Math.abs(point.v - forecast) / Math.abs(point.v)) * 100 }];
  });
}

/** Mean absolute percentage error of a backtest. `null` when no timestamps match. */
export function mape(actual: readonly ForecastSample[], predicted: readonly ForecastSample[]): number | null {
  const errors = percentErrors(actual, predicted);
  if (errors.length === 0) return null;
  return errors.reduce((sum, point) => sum + point.v, 0) / errors.length;
}

/**
 * A scenario derived from a base forecast: the change grows evenly from nothing at the first point
 * to `changeAtEnd` (a fraction, 0.1 = +10 %) at the last, so scenarios fan out from "now".
 */
export function fanScenario(forecast: readonly ForecastPoint[], changeAtEnd: number, decimals = 1): ForecastPoint[] {
  const last = Math.max(forecast.length - 1, 1);
  return forecast.map((point, index) => ({ t: point.t, v: round(point.v * (1 + changeAtEnd * (index / last)), decimals) }));
}

/** Confidence in words. A forecast under 50 % should not be presented as a prediction. */
export function confidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.8) return 'high';
  if (confidence >= 0.5) return 'medium';
  return 'low';
}

/** A lead time as people say it: "40 min", "6 h", "3 d". Rounded, because a forecast is not exact. */
export function formatLeadTime(durationMs: number): string {
  const duration = Math.max(0, durationMs);
  if (duration < HOUR) return `${Math.max(1, Math.round(duration / MINUTE))} min`;
  if (duration < 2 * DAY) return `${Math.round(duration / HOUR)} h`;
  return `${Math.round(duration / DAY)} d`;
}
