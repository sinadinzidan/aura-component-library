import type { StatusDescriptor, Tone } from '../status';

/** State of one station on a production line. */
export type StationState = 'running' | 'idle' | 'blocked' | 'starved' | 'down';

const STATION_STATUS: Record<StationState, StatusDescriptor> = {
  running: { tone: 'success', label: 'Running', shape: 'dot' },
  idle: { tone: 'neutral', label: 'Idle', shape: 'ring' },
  blocked: { tone: 'warning', label: 'Blocked', shape: 'square' },
  starved: { tone: 'info', label: 'Starved', shape: 'ring' },
  down: { tone: 'critical', label: 'Down', shape: 'diamond' },
};

/** Tone, label and shape of a station state: spread it into `StatusIndicator`. */
export const stationStatus = (state: StationState): StatusDescriptor => STATION_STATUS[state];

export const STATION_STATES: readonly StationState[] = ['running', 'idle', 'blocked', 'starved', 'down'];

/** How many stations are in each state. */
export function countStates(states: readonly StationState[]): Record<StationState, number> {
  const counts: Record<StationState, number> = { running: 0, idle: 0, blocked: 0, starved: 0, down: 0 };
  for (const state of states) counts[state] += 1;
  return counts;
}

/** Takt time: available seconds divided by the units the customer needs. `null` without demand. */
export function taktTime(availableSeconds: number, demand: number): number | null {
  if (!(demand > 0)) return null;
  return availableSeconds / demand;
}

export type TaktVerdict = { gap: number; tone: Tone; label: string };

/**
 * A cycle time judged against takt. Over takt the station cannot keep up (critical), within
 * `tolerance` of takt it has no slack (warning), otherwise it is neutral.
 */
export function judgeTakt(cycleTime: number, takt: number, tolerance = 0.05): TaktVerdict {
  const gap = cycleTime - takt;
  if (gap > 0) return { gap, tone: 'critical', label: 'Over takt' };
  if (-gap <= takt * tolerance) return { gap, tone: 'warning', label: 'At takt' };
  return { gap, tone: 'neutral', label: 'Under takt' };
}

/** First-pass yield in percent: units that passed without rework over units started. */
export function firstPassYield(passedFirstTime: number, started: number): number | null {
  if (!(started > 0)) return null;
  return (Math.min(passedFirstTime, started) / started) * 100;
}

/** Index of the slowest cycle time: the constraint of the line. `-1` for an empty list. */
export function bottleneckIndex(cycleTimes: readonly number[]): number {
  return cycleTimes.reduce((worst, value, index) => (worst === -1 || value > cycleTimes[worst] ? index : worst), -1);
}

/** "12:05" from seconds, for changeover and downtime clocks. */
export function formatClock(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
