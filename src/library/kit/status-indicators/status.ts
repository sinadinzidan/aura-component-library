import type { Tone } from '../tones';

/** The outline a state is drawn with, so it can be told apart without colour. */
export type StateShape = 'circle' | 'ring' | 'square' | 'triangle' | 'diamond' | 'cross' | 'bar';

export type StateDescriptor = {
  /** The state as a word, sentence case. */
  label: string;
  tone: Tone;
  shape: StateShape;
  /** Higher is worse; used to sort and to find the worst state of a group. */
  rank: number;
};

export type RunStateKey = 'running' | 'standby' | 'stopped' | 'tripped' | 'maintenance';
export type HealthKey = 'good' | 'watch' | 'poor';
export type QualityKey = 'good' | 'uncertain' | 'bad';
export type SeverityKey = 'critical' | 'high' | 'medium' | 'low';

export const RUN_STATES: Record<RunStateKey, StateDescriptor> = {
  running: { label: 'Running', tone: 'success', shape: 'circle', rank: 0 },
  standby: { label: 'Standby', tone: 'info', shape: 'ring', rank: 1 },
  stopped: { label: 'Stopped', tone: 'neutral', shape: 'square', rank: 2 },
  maintenance: { label: 'Maintenance', tone: 'warning', shape: 'diamond', rank: 3 },
  tripped: { label: 'Tripped', tone: 'critical', shape: 'triangle', rank: 4 },
};

export const HEALTH_STATES: Record<HealthKey, StateDescriptor> = {
  good: { label: 'Good', tone: 'success', shape: 'circle', rank: 0 },
  watch: { label: 'Watch', tone: 'warning', shape: 'diamond', rank: 1 },
  poor: { label: 'Poor', tone: 'critical', shape: 'triangle', rank: 2 },
};

export const QUALITY_STATES: Record<QualityKey, StateDescriptor> = {
  good: { label: 'Good', tone: 'success', shape: 'circle', rank: 0 },
  uncertain: { label: 'Uncertain', tone: 'warning', shape: 'diamond', rank: 1 },
  bad: { label: 'Bad', tone: 'neutral', shape: 'cross', rank: 2 },
};

export const SEVERITY_STATES: Record<SeverityKey, StateDescriptor> = {
  low: { label: 'Low', tone: 'neutral', shape: 'bar', rank: 0 },
  medium: { label: 'Medium', tone: 'info', shape: 'square', rank: 1 },
  high: { label: 'High', tone: 'warning', shape: 'diamond', rank: 2 },
  critical: { label: 'Critical', tone: 'critical', shape: 'triangle', rank: 3 },
};

export type TallyEntry = StateDescriptor & { count: number };

/** Counts descriptors by label, worst state first. */
export function tally(states: readonly StateDescriptor[]): TallyEntry[] {
  const byLabel = new Map<string, TallyEntry>();
  for (const state of states) {
    const entry = byLabel.get(state.label);
    if (entry) entry.count += 1;
    else byLabel.set(state.label, { ...state, count: 1 });
  }
  return [...byLabel.values()].sort((a, b) => b.rank - a.rank);
}

/** The worst state in a group, or `undefined` for an empty one. */
export function worst(states: readonly StateDescriptor[]): StateDescriptor | undefined {
  return states.reduce<StateDescriptor | undefined>((found, state) => (found === undefined || state.rank > found.rank ? state : found), undefined);
}
