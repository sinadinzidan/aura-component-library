/**
 * Pure forecast helpers: continue a series along its recent trend, widen a range around it, find
 * where it meets a limit and score a backtest. No clock and no randomness — the same history
 * always gives the same forecast.
 */

export type ForecastRange = { low: number; high: number };

export type ProjectOptions = {
  /** Number of future points. */
  steps: number;
  /** How many of the latest values set the trend. */
  lookback?: number;
  /** Scales the fitted slope: 0 holds the last value, 1 follows the trend, 2 doubles it. */
  slopeFactor?: number;
  /** Size of a repeating wave on top of the trend, for daily patterns. */
  amplitude?: number;
  /** Length of one wave in steps. */
  period?: number;
  decimals?: number;
  min?: number;
  max?: number;
};

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Least-squares slope of evenly spaced values, in value per step. Zero for fewer than two. */
export function trendSlope(values: readonly number[]): number {
  if (values.length < 2) return 0;
  const meanX = (values.length - 1) / 2;
  const meanY = values.reduce((sum, value) => sum + value, 0) / values.length;
  let numerator = 0;
  let denominator = 0;
  values.forEach((value, index) => {
    numerator += (index - meanX) * (value - meanY);
    denominator += (index - meanX) ** 2;
  });
  return denominator === 0 ? 0 : numerator / denominator;
}

/** Future values continuing a series from its last value. The history itself is not repeated. */
export function project(history: readonly number[], options: ProjectOptions): number[] {
  const last = history[history.length - 1];
  if (last === undefined || options.steps <= 0) return [];
  const { steps, lookback = 12, slopeFactor = 1, amplitude = 0, period = 24, decimals = 1, min = -Infinity, max = Infinity } = options;
  const slope = trendSlope(history.slice(-Math.max(lookback, 2))) * slopeFactor;
  return Array.from({ length: steps }, (_, index) => {
    const step = index + 1;
    const wave = amplitude === 0 ? 0 : Math.sin((step / period) * Math.PI * 2) * amplitude;
    return round(Math.min(max, Math.max(min, last + slope * step + wave)), decimals);
  });
}

/** A range around a forecast that widens with the horizon the way accumulated error does. */
export function widen(forecast: readonly number[], initial: number, growth: number, decimals = 1): ForecastRange[] {
  const last = Math.max(forecast.length - 1, 1);
  return forecast.map((value, index) => {
    const half = initial + growth * Math.sqrt(index / last);
    return { low: round(value - half, decimals), high: round(value + half, decimals) };
  });
}

/**
 * The fractional step at which a forecast first reaches a limit, counted from the last history
 * point (step 0). `null` when it never gets there.
 */
export function stepsToLimit(last: number, forecast: readonly number[], limit: number, direction: 'rising' | 'falling' = 'rising'): number | null {
  const beyond = (value: number) => (direction === 'rising' ? value >= limit : value <= limit);
  if (beyond(last)) return 0;
  let before = last;
  for (let index = 0; index < forecast.length; index += 1) {
    const value = forecast[index];
    if (beyond(value)) return index + (limit - before) / (value - before || 1);
    before = value;
  }
  return null;
}

/** Mean absolute percentage error of predictions against what happened. `null` with nothing to compare. */
export function mape(actual: readonly number[], predicted: readonly number[]): number | null {
  const pairs = actual.flatMap((value, index) => (predicted[index] === undefined || value === 0 ? [] : [Math.abs(value - predicted[index]) / Math.abs(value)]));
  if (pairs.length === 0) return null;
  return (pairs.reduce((sum, value) => sum + value, 0) / pairs.length) * 100;
}

/** Share of actual values that fell inside the forecast range, in percent. */
export function coverage(actual: readonly number[], ranges: readonly ForecastRange[]): number | null {
  const checked = actual.flatMap((value, index) => (ranges[index] ? [value >= ranges[index].low && value <= ranges[index].high] : []));
  if (checked.length === 0) return null;
  return (checked.filter(Boolean).length / checked.length) * 100;
}

/** A scenario fanned out from a base forecast: no change at the first point, `changeAtEnd` (0.1 = +10 %) at the last. */
export function fan(forecast: readonly number[], changeAtEnd: number, decimals = 1): number[] {
  const last = Math.max(forecast.length - 1, 1);
  return forecast.map((value, index) => round(value * (1 + changeAtEnd * (index / last)), decimals));
}

/** A lead time in hours as "3 d 4 h", "5 h" or "40 min". */
export function formatLead(hours: number): string {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min`;
  const whole = Math.round(hours);
  const days = Math.floor(whole / 24);
  const rest = whole % 24;
  if (days === 0) return `${whole} h`;
  return rest === 0 ? `${days} d` : `${days} d ${rest} h`;
}

export type ConfidenceLevel = 'high' | 'medium' | 'low';

/** The level a confidence score falls in: high from 80 %, medium from 60 %. */
export function confidenceLevel(percent: number): ConfidenceLevel {
  if (percent >= 80) return 'high';
  return percent >= 60 ? 'medium' : 'low';
}
