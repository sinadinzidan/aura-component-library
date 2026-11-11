import type { Tone } from '../tones';

export type EnergyType = 'electrical' | 'process' | 'hydraulic' | 'pneumatic' | 'mechanical' | 'thermal';

/** The life of an isolation point, in the order it is worked. */
export const ISOLATION_STATES = ['planned', 'isolated', 'locked', 'verified', 'removed'] as const;
export type IsolationState = (typeof ISOLATION_STATES)[number];

export type IsolationPoint = {
  id: string;
  /** Position in the isolation sequence, from 1. */
  step: number;
  tag: string;
  /** What the point is: "Motor breaker, recompressor". */
  name: string;
  energy: EnergyType;
  /** What is done to it: "Open, rack out and lock". */
  method: string;
  state: IsolationState;
  /** Number of the lock on the point, once locked. */
  lock?: string;
};

export const ENERGY_WORD: Record<EnergyType, string> = {
  electrical: 'Electrical',
  process: 'Process pressure',
  hydraulic: 'Hydraulic',
  pneumatic: 'Pneumatic',
  mechanical: 'Stored mechanical',
  thermal: 'Thermal',
};

export const STATE_WORD: Record<IsolationState, string> = {
  planned: 'Planned',
  isolated: 'Isolated',
  locked: 'Locked and tagged',
  verified: 'Verified',
  removed: 'Removed',
};

export const STATE_TONE: Record<IsolationState, Tone> = {
  planned: 'neutral',
  isolated: 'warning',
  locked: 'info',
  verified: 'success',
  removed: 'neutral',
};

/** What the person at the point does next, as a button label. Undefined when nothing is left. */
export const NEXT_ACTION: Record<IsolationState, string | undefined> = {
  planned: 'Mark isolated',
  isolated: 'Apply lock',
  locked: 'Verify',
  verified: undefined,
  removed: undefined,
};

/** The state that follows when the next action is done. A verified point stays verified. */
export function advanceState(state: IsolationState): IsolationState {
  if (state === 'planned') return 'isolated';
  if (state === 'isolated') return 'locked';
  if (state === 'locked') return 'verified';
  return state;
}

export type BoundaryProgress = { total: number; locked: number; verified: number; removed: number; complete: boolean };

/** Counts a boundary. It is complete only when every point is verified. */
export function boundaryProgress(points: readonly Pick<IsolationPoint, 'state'>[]): BoundaryProgress {
  const count = (wanted: IsolationState) => points.filter((point) => point.state === wanted).length;
  const verified = count('verified');
  return { total: points.length, locked: count('locked') + verified, verified, removed: count('removed'), complete: points.length > 0 && verified === points.length };
}

/** Isolations come off in the reverse of the order they went on. */
export function removalOrder<Point extends Pick<IsolationPoint, 'step'>>(points: readonly Point[]): Point[] {
  return [...points].sort((first, second) => second.step - first.step);
}

export type GateCondition = { id: string; text: string; met: boolean };

/** Work may start only when the boundary is complete, the try step passed and every worker has a lock on. */
export function workGate(points: readonly Pick<IsolationPoint, 'state'>[], tryStepPassed: boolean, crew: number, crewLocksOn: number): GateCondition[] {
  const progress = boundaryProgress(points);
  return [
    { id: 'boundary', text: `All ${progress.total} points locked and verified (${progress.verified} of ${progress.total})`, met: progress.complete },
    { id: 'try', text: 'Try step passed: the machine does not start', met: tryStepPassed },
    { id: 'crew', text: `Every worker has a personal lock on the lock box (${crewLocksOn} of ${crew})`, met: crew > 0 && crewLocksOn === crew },
  ];
}
