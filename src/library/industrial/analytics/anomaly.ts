/**
 * Pure anomaly helpers: score samples against an expected band or their own recent history, turn a
 * sensitivity setting into a threshold, and group flagged samples into periods. Scores run from
 * 0 (as expected) to 1 (far outside), so one threshold works for every sensor.
 */

export type AnomalySample = { t: number; v: number | null };
export type ExpectedRange = { t: number; low: number; high: number };
export type ScorePoint = { t: number; score: number };

export type AnomalyRegion = {
  from: number;
  to: number;
  /** Highest score inside the period. */
  peak: number;
  /** Flagged samples in the period. */
  count: number;
};

export type AnomalyPattern = 'flatline' | 'spike' | 'drift' | 'none';
export type ScoreLevel = 'normal' | 'elevated' | 'anomalous';

export type ThresholdRange = { strict?: number; loose?: number };

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

function numbers(samples: readonly AnomalySample[]): number[] {
  return samples.flatMap((sample) => (sample.v === null || !Number.isFinite(sample.v) ? [] : [sample.v]));
}

function mean(values: readonly number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function deviation(values: readonly number[]): number {
  if (values.length < 2) return 0;
  const average = mean(values);
  return Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length);
}

/**
 * Score against an expected band, matched by timestamp: 0 in the middle of the band, 0.5 on its
 * edge, 1 from one full band-width outside. Gaps and samples without a band score 0.
 */
export function bandScores(samples: readonly AnomalySample[], expected: readonly ExpectedRange[]): ScorePoint[] {
  const byTime = new Map(expected.map((range) => [range.t, range]));
  return samples.map((sample) => {
    const range = byTime.get(sample.t);
    if (!range || sample.v === null || range.high <= range.low) return { t: sample.t, score: 0 };
    const half = (range.high - range.low) / 2;
    const distance = Math.abs(sample.v - (range.low + range.high) / 2);
    const score = distance <= half ? (distance / half) * 0.5 : 0.5 + ((distance - half) / (half * 2)) * 0.5;
    return { t: sample.t, score: clamp(score, 0, 1) };
  });
}

/**
 * Score against the sample's own recent history: how many standard deviations it sits from the
 * mean of the `window` samples before it, with 6 or more scoring 1. The first samples, which have
 * no history yet, score 0.
 */
export function rollingScores(samples: readonly AnomalySample[], window = 12, minDeviation = 0.001): ScorePoint[] {
  return samples.map((sample, index) => {
    const history = numbers(samples.slice(Math.max(0, index - window), index));
    if (sample.v === null || history.length < 3) return { t: sample.t, score: 0 };
    const spread = Math.max(deviation(history), minDeviation);
    return { t: sample.t, score: clamp(Math.abs(sample.v - mean(history)) / spread / 6, 0, 1) };
  });
}

/**
 * The score threshold for a sensitivity setting of 0–100. More sensitive means a lower threshold,
 * so more samples are flagged: 0 gives `strict` (0.95), 100 gives `loose` (0.35).
 */
export function sensitivityThreshold(sensitivity: number, { strict = 0.95, loose = 0.35 }: ThresholdRange = {}): number {
  const fraction = clamp(sensitivity, 0, 100) / 100;
  return Math.round((strict - (strict - loose) * fraction) * 100) / 100;
}

/** The samples at or above the threshold. */
export function flaggedScores(scores: readonly ScorePoint[], threshold: number): ScorePoint[] {
  return scores.filter((point) => point.score >= threshold);
}

/**
 * Flagged samples grouped into periods. Runs separated by at most `bridge` unflagged samples are
 * joined, so one event with a short dip in the score stays one anomaly.
 */
export function anomalyRegions(scores: readonly ScorePoint[], threshold: number, bridge = 0): AnomalyRegion[] {
  const regions: AnomalyRegion[] = [];
  let current: AnomalyRegion | null = null;
  let gap = 0;

  for (const point of scores) {
    if (point.score >= threshold) {
      if (current) {
        current = { from: current.from, to: point.t, peak: Math.max(current.peak, point.score), count: current.count + 1 };
      } else {
        current = { from: point.t, to: point.t, peak: point.score, count: 1 };
      }
      gap = 0;
    } else if (current) {
      gap += 1;
      if (gap > bridge) {
        regions.push(current);
        current = null;
        gap = 0;
      }
    }
  }
  if (current) regions.push(current);
  return regions;
}

/** Where a score stands against its threshold: anomalous at or above it, elevated from 70 % of it. */
export function scoreLevel(score: number, threshold: number): ScoreLevel {
  if (score >= threshold) return 'anomalous';
  if (score >= threshold * 0.7) return 'elevated';
  return 'normal';
}

/**
 * The shape of an abnormal stretch. `flatline`: the end of the series stopped moving. `spike`:
 * one sample far from all the others. `drift`: the second half sits clearly away from the first.
 */
export function classifyPattern(samples: readonly AnomalySample[]): AnomalyPattern {
  const values = numbers(samples);
  if (values.length < 6) return 'none';
  const spread = deviation(values);
  if (spread === 0) return 'flatline';

  const tail = values.slice(-Math.max(4, Math.floor(values.length / 4)));
  if (Math.max(...tail) - Math.min(...tail) < spread * 0.02) return 'flatline';

  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const distances = values.map((value) => Math.abs(value - median)).sort((a, b) => a - b);
  const typical = Math.max(distances[Math.floor(distances.length / 2)], spread * 0.05);
  const far = values.filter((value) => Math.abs(value - median) > typical * 8).length;
  if (far > 0 && far <= Math.max(1, Math.floor(values.length / 20))) return 'spike';

  const half = Math.floor(values.length / 2);
  const first = values.slice(0, half);
  const second = values.slice(half);
  const noise = Math.max((deviation(first) + deviation(second)) / 2, spread * 0.05);
  if (Math.abs(mean(second) - mean(first)) > noise * 2) return 'drift';
  return 'none';
}

/** Contributors sorted largest first with each one's share of the total in percent. */
export function rankContributors<T extends { contribution: number }>(items: readonly T[]): (T & { share: number })[] {
  const total = items.reduce((sum, item) => sum + Math.max(item.contribution, 0), 0);
  return [...items]
    .sort((a, b) => b.contribution - a.contribution)
    .map((item) => ({ ...item, share: total > 0 ? (Math.max(item.contribution, 0) / total) * 100 : 0 }));
}
