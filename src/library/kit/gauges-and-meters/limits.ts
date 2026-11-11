import type { StatusTone } from '../tones';

/** Operating limits of a measurement. `trip` is the shutdown limit above `high`. */
export type Limits = { low?: number; high?: number; trip?: number };

export type LimitState = 'normal' | 'near' | 'low' | 'high' | 'trip';

const WORDS: Record<LimitState, string> = { normal: 'Normal', near: 'Near limit', low: 'Low', high: 'High', trip: 'Trip' };
const TONES: Record<LimitState, StatusTone> = { normal: 'success', near: 'warning', low: 'warning', high: 'warning', trip: 'critical' };

/**
 * Where a value sits against its limits. `near` means inside the band but within `nearShare` of
 * its width from the high limit, the moment an operator wants a warning before the alarm.
 */
export function limitState(value: number, limits: Limits, nearShare = 0.08): LimitState {
  const { low, high, trip } = limits;
  if (trip !== undefined && value >= trip) return 'trip';
  if (high !== undefined && value > high) return 'high';
  if (low !== undefined && value < low) return 'low';
  if (high !== undefined) {
    const width = high - (low ?? 0);
    if (high - value <= width * nearShare) return 'near';
  }
  return 'normal';
}

/** The state as a word for a pill or a caption. */
export function limitWord(value: number, limits: Limits): string {
  return WORDS[limitState(value, limits)];
}

/** The status tone that goes with the state. */
export function limitTone(value: number, limits: Limits): StatusTone {
  return TONES[limitState(value, limits)];
}

/** Share of the range a value covers, clamped to 0–1. */
export function rangeShare(value: number, min: number, max: number): number {
  return Math.min(1, Math.max(0, (value - min) / (max - min || 1)));
}
