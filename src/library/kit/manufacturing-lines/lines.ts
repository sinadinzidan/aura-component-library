import type { Tone } from '../tones';

export const STATION_STATES = ['running', 'starved', 'blocked', 'down', 'changeover', 'idle'] as const;
export type StationState = (typeof STATION_STATES)[number];

export type Station = {
  id: string;
  /** Short code shown on boards: "S3". */
  code: string;
  name: string;
  state: StationState;
  /** Last cycle time in seconds. Leave out when the station is not cycling. */
  cycleSeconds?: number;
  /** Parts waiting in the buffer after this station, and how many it holds. */
  buffer?: { count: number; capacity: number };
  /** Why it is not running: "Torque tool fault E-217". */
  reason?: string;
  /** How long it has been in this state: "12 min". */
  since?: string;
};

export const STATION_TONE: Record<StationState, Tone> = {
  running: 'success',
  starved: 'warning',
  blocked: 'warning',
  down: 'critical',
  changeover: 'info',
  idle: 'neutral',
};

export const STATION_WORD: Record<StationState, string> = {
  running: 'Running',
  starved: 'Starved',
  blocked: 'Blocked',
  down: 'Down',
  changeover: 'Changeover',
  idle: 'Idle',
};

export const STATION_MEANING: Record<StationState, string> = {
  running: 'Cycling and making parts.',
  starved: 'Ready, but no parts are arriving.',
  blocked: 'Finished parts have nowhere to go.',
  down: 'Stopped by a fault. Someone must act.',
  changeover: 'Being set up for the next product.',
  idle: 'Not scheduled to run.',
};

/** Index of the slowest cycling station, or -1 when none is cycling. */
export function bottleneckIndex(stations: readonly Pick<Station, 'cycleSeconds'>[]): number {
  let slowest = -1;
  let longest = 0;
  stations.forEach((station, index) => {
    if (station.cycleSeconds !== undefined && station.cycleSeconds > longest) {
      longest = station.cycleSeconds;
      slowest = index;
    }
  });
  return slowest;
}

export type Verdict = { tone: Tone; word: string };

/** Judges a cycle time against takt: over takt cannot keep up with demand. */
export function taktVerdict(cycleSeconds: number, taktSeconds: number): Verdict {
  if (cycleSeconds > taktSeconds) return { tone: 'critical', word: 'Over takt' };
  if (cycleSeconds > taktSeconds * 0.95) return { tone: 'warning', word: 'At takt' };
  return { tone: 'success', word: 'Under takt' };
}

export type Pace = { expected: number; difference: number; tone: Tone; word: string };

/** Compares the count with where it should be after a share of the shift (0–1). */
export function pace(count: number, target: number, elapsedShare: number): Pace {
  const expected = Math.round(target * Math.max(0, Math.min(1, elapsedShare)));
  const difference = count - expected;
  if (difference >= 0) return { expected, difference, tone: 'success', word: difference === 0 ? 'On pace' : `${difference} ahead of pace` };
  const behind = Math.abs(difference);
  return { expected, difference, tone: behind > target * 0.05 ? 'critical' : 'warning', word: `${behind} behind pace` };
}

/** Share of parts that passed first time, in percent. */
export function firstPassYield(good: number, total: number): number {
  if (total <= 0) return 0;
  return (good / total) * 100;
}

/** Seconds as minutes and seconds: 754 becomes "12:34". */
export function formatClock(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}
