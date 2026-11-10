import type { StatusDescriptor, Tone } from '../status';

/** Shared safety vocabulary: permit states, barrier states and the 5 × 5 risk matrix. */

export type PermitState = 'requested' | 'approved' | 'active' | 'suspended' | 'closed';

export type BarrierState = 'healthy' | 'degraded' | 'impaired';

export type RiskLevel = 'low' | 'medium' | 'high' | 'extreme';

/** 1 (lowest) to 5 (highest) on either axis of the matrix. */
export type RiskRating = 1 | 2 | 3 | 4 | 5;

export const PERMIT_STATES: readonly PermitState[] = ['requested', 'approved', 'active', 'suspended', 'closed'];

export const RISK_RATINGS: readonly RiskRating[] = [1, 2, 3, 4, 5];

const PERMIT_STATUS: Record<PermitState, StatusDescriptor> = {
  requested: { tone: 'neutral', label: 'Requested', shape: 'ring' },
  approved: { tone: 'info', label: 'Approved', shape: 'ring' },
  active: { tone: 'success', label: 'Active', shape: 'dot' },
  suspended: { tone: 'warning', label: 'Suspended', shape: 'square' },
  closed: { tone: 'neutral', label: 'Closed', shape: 'square' },
};

const BARRIER_STATUS: Record<BarrierState, StatusDescriptor> = {
  healthy: { tone: 'success', label: 'Healthy', shape: 'dot' },
  degraded: { tone: 'warning', label: 'Degraded', shape: 'square' },
  impaired: { tone: 'critical', label: 'Impaired', shape: 'diamond' },
};

const RISK_STATUS: Record<RiskLevel, StatusDescriptor> = {
  low: { tone: 'neutral', label: 'Low', shape: 'ring' },
  medium: { tone: 'info', label: 'Medium', shape: 'dot' },
  high: { tone: 'warning', label: 'High', shape: 'square' },
  extreme: { tone: 'critical', label: 'Extreme', shape: 'diamond' },
};

/** Tone, label and shape of a permit-to-work state. Only a live permit is green. */
export const permitStatus = (state: PermitState): StatusDescriptor => PERMIT_STATUS[state];

export const barrierStatus = (state: BarrierState): StatusDescriptor => BARRIER_STATUS[state];

export const riskStatus = (level: RiskLevel): StatusDescriptor => RISK_STATUS[level];

/** Likelihood × consequence, 1–25. */
export function riskScore(likelihood: RiskRating, consequence: RiskRating): number {
  return likelihood * consequence;
}

/** Risk level of a matrix cell: 1–4 low, 5–9 medium, 10–16 high, 20–25 extreme. */
export function riskLevel(likelihood: RiskRating, consequence: RiskRating): RiskLevel {
  const score = riskScore(likelihood, consequence);
  if (score >= 20) return 'extreme';
  if (score >= 10) return 'high';
  if (score >= 5) return 'medium';
  return 'low';
}

/** The worst state among a set of barriers; healthy when there are none. */
export function worstBarrierState(states: readonly BarrierState[]): BarrierState {
  if (states.includes('impaired')) return 'impaired';
  if (states.includes('degraded')) return 'degraded';
  return 'healthy';
}

/** How many barriers are in each state. */
export function countBarrierStates(states: readonly BarrierState[]): Record<BarrierState, number> {
  return {
    healthy: states.filter((state) => state === 'healthy').length,
    degraded: states.filter((state) => state === 'degraded').length,
    impaired: states.filter((state) => state === 'impaired').length,
  };
}

/**
 * Tone of a gas test reading. Oxygen has a safe window; flammable and toxic gases only have a
 * ceiling. A reading at or beyond a limit is critical: the work does not start.
 */
export function gasReadingTone(value: number, limits: { min?: number; max?: number }): Tone {
  if (limits.max !== undefined && value >= limits.max) return 'critical';
  if (limits.min !== undefined && value <= limits.min) return 'critical';
  return 'neutral';
}
