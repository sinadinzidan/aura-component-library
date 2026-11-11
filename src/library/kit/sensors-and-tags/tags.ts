import type { Tone } from '../tones';

export type TagLimits = { low?: number; high?: number; highHigh?: number };

export type TagJudgement = { tone: Tone; word: string };

/** Where a value sits against its limits: within, near the high limit, outside, or tripped. */
export function judgeValue(value: number, limits: TagLimits, nearShare = 0.95): TagJudgement {
  if (limits.highHigh !== undefined && value >= limits.highHigh) return { tone: 'critical', word: 'Trip level' };
  if (limits.high !== undefined && value > limits.high) return { tone: 'critical', word: 'Above limit' };
  if (limits.low !== undefined && value < limits.low) return { tone: 'critical', word: 'Below limit' };
  if (limits.high !== undefined && value >= limits.high * nearShare) return { tone: 'warning', word: 'Near limit' };
  return { tone: 'success', word: 'Normal' };
}

export type TagQuality = 'good' | 'uncertain' | 'bad' | 'stale';

const QUALITY: Record<TagQuality, TagJudgement> = {
  good: { tone: 'success', word: 'Good' },
  uncertain: { tone: 'warning', word: 'Uncertain' },
  bad: { tone: 'critical', word: 'Bad' },
  stale: { tone: 'neutral', word: 'Stale' },
};

/** The word and tone a signal quality is shown with. */
export function qualityStatus(quality: TagQuality): TagJudgement {
  return QUALITY[quality];
}

/** Position of a value on a range as a share from 0 to 1, clamped. */
export function rangeShare(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

export type TagParts = { area: string; func: string; loop: string };

/** Splits an ISA-style tag such as `23-PT-92531` into area, function letters and loop number. */
export function parseTag(tag: string): TagParts | undefined {
  const match = /^(\d+)-([A-Z]+)-(\w+)$/.exec(tag);
  if (!match) return undefined;
  return { area: match[1] ?? '', func: match[2] ?? '', loop: match[3] ?? '' };
}

const PRESSURE: Record<string, number> = { barg: 1, psi: 14.5038, kPa: 100 };

/** Converts a gauge pressure between barg, psi and kPa. Unknown units return the value unchanged. */
export function convertPressure(value: number, from: string, to: string): number {
  const a = PRESSURE[from];
  const b = PRESSURE[to];
  if (a === undefined || b === undefined) return value;
  return (value / a) * b;
}

/** Share of samples that fall inside the limits, 0–1. */
export function shareInside(values: readonly number[], limits: TagLimits): number {
  if (values.length === 0) return 1;
  const inside = values.filter((value) => (limits.low === undefined || value >= limits.low) && (limits.high === undefined || value <= limits.high));
  return inside.length / values.length;
}
