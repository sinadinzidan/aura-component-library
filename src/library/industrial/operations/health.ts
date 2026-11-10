/**
 * Condition vocabulary for equipment health: turning a 0–100 score into good / watch / poor, the
 * tone each gets (good is neutral, because normal is not news) and a simple risk score.
 */
import type { Health, Tone } from '../status';

export type HealthThresholds = {
  /** Scores below this are "watch". */
  watch: number;
  /** Scores below this are "poor". */
  poor: number;
};

export type Criticality = 'A' | 'B' | 'C';

export const DEFAULT_HEALTH_THRESHOLDS: HealthThresholds = { watch: 80, poor: 60 };

export function healthFromScore(score: number, thresholds: HealthThresholds = DEFAULT_HEALTH_THRESHOLDS): Health {
  if (score < thresholds.poor) return 'poor';
  if (score < thresholds.watch) return 'watch';
  return 'good';
}

const HEALTH_TONE: Record<Health, Tone> = { good: 'neutral', watch: 'warning', poor: 'critical' };

/** Tone for a health mark: neutral while good, coloured only once it needs attention. */
export const healthTone = (health: Health): Tone => HEALTH_TONE[health];

const CRITICALITY_WEIGHT: Record<Criticality, number> = { A: 3, B: 2, C: 1 };

/**
 * Risk as criticality × condition: the weight of the equipment (A = 3, B = 2, C = 1) times how
 * far its health score is from perfect. 0 is no risk, 300 the worst case.
 */
export function riskScore(criticality: Criticality, healthScore: number): number {
  const lost = Math.min(100, Math.max(0, 100 - healthScore));
  return CRITICALITY_WEIGHT[criticality] * lost;
}

/** Highest risk first. Does not mutate the input. */
export function rankByRisk<T extends { criticality: Criticality; healthScore: number }>(assets: readonly T[]): T[] {
  return [...assets].sort((a, b) => riskScore(b.criticality, b.healthScore) - riskScore(a.criticality, a.healthScore));
}
