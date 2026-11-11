import type { Tone } from '../tones';

export const PERMIT_STATES = ['draft', 'awaiting', 'issued', 'active', 'suspended', 'closed', 'expired'] as const;
export type PermitState = (typeof PERMIT_STATES)[number];

export type PermitStatus = { label: string; tone: Tone };

const PERMIT_STATUS: Record<PermitState, PermitStatus> = {
  draft: { label: 'Draft', tone: 'neutral' },
  awaiting: { label: 'Awaiting approval', tone: 'info' },
  issued: { label: 'Issued', tone: 'accent' },
  active: { label: 'Active', tone: 'success' },
  suspended: { label: 'Suspended', tone: 'warning' },
  closed: { label: 'Closed', tone: 'neutral' },
  expired: { label: 'Expired', tone: 'critical' },
};

/** The word and tone a permit state is shown with. */
export function permitStatus(state: PermitState): PermitStatus {
  return PERMIT_STATUS[state];
}

/** Share of a validity window that has passed, clamped to 0–1. */
export function validityShare(from: number, to: number, now: number): number {
  if (to <= from) return 1;
  return Math.min(1, Math.max(0, (now - from) / (to - from)));
}

export type RiskRating = { score: number; label: 'Low' | 'Medium' | 'High' | 'Extreme'; tone: Tone };

/** Likelihood times consequence on a 5 × 5 matrix, with the band the score falls in. */
export function riskRating(likelihood: number, consequence: number): RiskRating {
  const score = likelihood * consequence;
  if (score >= 15) return { score, label: 'Extreme', tone: 'critical' };
  if (score >= 10) return { score, label: 'High', tone: 'warning' };
  if (score >= 5) return { score, label: 'Medium', tone: 'amber' };
  return { score, label: 'Low', tone: 'success' };
}

export type GasLimits = { low?: number; high?: number };

/** Whether a gas reading is inside its safe window; a one-sided limit warns from 80 % of it. */
export function gasReadingTone(value: number, limits: GasLimits): Tone {
  if (limits.low !== undefined && value < limits.low) return 'critical';
  if (limits.high !== undefined && value > limits.high) return 'critical';
  if (limits.low === undefined && limits.high !== undefined && value > limits.high * 0.8) return 'warning';
  return 'success';
}
