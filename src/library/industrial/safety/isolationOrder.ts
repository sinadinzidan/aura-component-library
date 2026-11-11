import type { StatusDescriptor } from '../status';

/**
 * Lock-out, tag-out vocabulary and the rules that do not depend on a screen: the four states of
 * an isolation point, the order points go on and come off, and the gate that decides whether the
 * equipment may be released for work.
 */

export type IsolationState = 'planned' | 'applied' | 'verified' | 'removed';

export const ISOLATION_STATES: readonly IsolationState[] = ['planned', 'applied', 'verified', 'removed'];

export type EnergyType = 'electrical' | 'pressure' | 'thermal' | 'stored';

export const ENERGY_TYPES: readonly EnergyType[] = ['electrical', 'pressure', 'thermal', 'stored'];

export const ENERGY_LABEL: Record<EnergyType, string> = {
  electrical: 'Electrical',
  pressure: 'Pressure',
  thermal: 'Thermal',
  stored: 'Stored energy',
};

const ISOLATION_STATUS: Record<IsolationState, StatusDescriptor> = {
  planned: { tone: 'neutral', label: 'Planned', shape: 'ring' },
  applied: { tone: 'warning', label: 'Applied, not verified', shape: 'square' },
  verified: { tone: 'success', label: 'Locked and verified', shape: 'dot' },
  removed: { tone: 'neutral', label: 'Removed', shape: 'square' },
};

/** Tone, words and shape of an isolation state. Only a verified point is green. */
export const isolationStatus = (state: IsolationState): StatusDescriptor => ISOLATION_STATUS[state];

type Ordered = { id: string; step: number };

/** Points in the order they are applied: by step number, ties kept in the order given. */
export function applicationOrder<T extends Ordered>(points: readonly T[]): T[] {
  return points.map((point, index) => ({ point, index })).sort((a, b) => a.point.step - b.point.step || a.index - b.index).map((entry) => entry.point);
}

/**
 * Points in the order they are removed: the exact reverse of application, so the last barrier put
 * on is the first taken off. Points already removed are left out. `removeStep` counts from 1.
 */
export function deIsolationOrder<T extends Ordered & { state?: IsolationState }>(points: readonly T[]): (T & { removeStep: number })[] {
  return applicationOrder(points)
    .reverse()
    .filter((point) => point.state !== 'removed')
    .map((point, index) => ({ ...point, removeStep: index + 1 }));
}

/** How many points are in each state. */
export function countIsolationStates(points: readonly { state: IsolationState }[]): Record<IsolationState, number> {
  return {
    planned: points.filter((point) => point.state === 'planned').length,
    applied: points.filter((point) => point.state === 'applied').length,
    verified: points.filter((point) => point.state === 'verified').length,
    removed: points.filter((point) => point.state === 'removed').length,
  };
}

export type GateCheck = { id: string; label: string; done: boolean };

export type ReleaseBlocker = { id: string; reason: string };

export type ReleaseGate = {
  /** True only when every point is verified and every check is done. */
  ready: boolean;
  blockers: ReleaseBlocker[];
  /** One sentence for the screen: why release is blocked, or that it is not. */
  summary: string;
};

const BLOCK_REASON: Record<Exclude<IsolationState, 'verified'>, string> = {
  planned: 'not applied',
  applied: 'applied but not verified by a second person',
  removed: 'removed',
};

const plural = (count: number, word: string): string => `${count} ${word}${count === 1 ? '' : 's'}`;

/**
 * Decides whether the equipment may be released for work. Every isolation point must be verified
 * and every extra check (such as the try step) done; anything else is listed as a blocker with
 * its reason. An empty plan is never ready.
 */
export function releaseGate(points: readonly { id: string; state: IsolationState; tag?: string }[], checks: readonly GateCheck[] = []): ReleaseGate {
  const blockers: ReleaseBlocker[] = [];
  for (const point of points) {
    if (point.state !== 'verified') blockers.push({ id: point.id, reason: `${point.tag ?? point.id} is ${BLOCK_REASON[point.state]}` });
  }
  for (const check of checks) {
    if (!check.done) blockers.push({ id: check.id, reason: `${check.label} is not confirmed` });
  }

  if (points.length === 0) return { ready: false, blockers, summary: 'The isolation plan has no points. Nothing can be released.' };

  const openPoints = points.filter((point) => point.state !== 'verified').length;
  const openChecks = checks.filter((check) => !check.done).length;
  if (openPoints === 0 && openChecks === 0) {
    return { ready: true, blockers, summary: `All ${plural(points.length, 'point')} verified. The equipment can be released for work.` };
  }
  const parts = [
    ...(openPoints > 0 ? [`${openPoints} of ${plural(points.length, 'point')} not verified`] : []),
    ...(openChecks > 0 ? [`${plural(openChecks, 'check')} not confirmed`] : []),
  ];
  return { ready: false, blockers, summary: `Release is blocked: ${parts.join(' and ')}.` };
}

/** Isolations may only come off when nobody's personal lock is still on the lock box. */
export function removalGate(people: readonly { name: string; lockOn: boolean }[]): { ready: boolean; summary: string } {
  const on = people.filter((person) => person.lockOn);
  if (on.length === 0) return { ready: true, summary: 'All personal locks are off. The isolations can be removed.' };
  return { ready: false, summary: `${plural(on.length, 'personal lock')} still on: ${on.map((person) => person.name).join(', ')}.` };
}
