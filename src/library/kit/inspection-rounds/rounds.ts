import type { Tone } from '../tones';

export type CheckpointResult = 'pending' | 'pass' | 'fail' | 'skipped';

export type Checkpoint = {
  id: string;
  /** Asset or instrument tag the operator stands in front of. */
  tag: string;
  name: string;
  /** Where on the route: "Compressor hall, level 2". */
  location: string;
  /** Unit of the field reading; leave out for a visual check. */
  unit?: string;
  low?: number;
  high?: number;
  /** The reading taken, when there is one. */
  value?: number;
  decimals?: number;
  result: CheckpointResult;
  /** Why it failed or was skipped. */
  note?: string;
};

export const RESULT_TONE: Record<CheckpointResult, Tone> = {
  pending: 'neutral',
  pass: 'success',
  fail: 'critical',
  skipped: 'warning',
};

export const RESULT_WORD: Record<CheckpointResult, string> = {
  pending: 'To do',
  pass: 'Pass',
  fail: 'Fail',
  skipped: 'Skipped',
};

export type ReadingVerdict = { result: CheckpointResult; tone: Tone; text: string };

/** Judges a field reading against its limits and says by how much it misses. */
export function judgeReading(value: number | undefined, low: number | undefined, high: number | undefined, decimals = 1): ReadingVerdict {
  if (value === undefined || Number.isNaN(value)) return { result: 'pending', tone: 'neutral', text: 'Enter a reading' };
  if (high !== undefined && value > high) return { result: 'fail', tone: 'critical', text: `${(value - high).toFixed(decimals)} above the high limit` };
  if (low !== undefined && value < low) return { result: 'fail', tone: 'critical', text: `${(low - value).toFixed(decimals)} below the low limit` };
  return { result: 'pass', tone: 'success', text: 'Within limits' };
}

export type RoundProgress = { total: number; done: number; passed: number; failed: number; skipped: number; percent: number };

/** Counts a round: a checkpoint is done once it has any result other than pending. */
export function roundProgress(results: readonly CheckpointResult[]): RoundProgress {
  const count = (wanted: CheckpointResult) => results.filter((result) => result === wanted).length;
  const total = results.length;
  const done = total - count('pending');
  return { total, done, passed: count('pass'), failed: count('fail'), skipped: count('skipped'), percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}

/** The first checkpoint that still needs a result, or undefined when the round is complete. */
export function nextCheckpoint<Item extends { result: CheckpointResult }>(checkpoints: readonly Item[]): Item | undefined {
  return checkpoints.find((checkpoint) => checkpoint.result === 'pending');
}
