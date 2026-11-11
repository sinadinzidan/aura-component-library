import type { Tone } from '../tones';

export type RiskLevel = 'low' | 'medium' | 'high' | 'extreme';

export type RiskItem = {
  id: string;
  /** Short name shown in the cell: a risk number or a tag. */
  label: string;
  /** 1 (rare) to 5 (almost certain). */
  likelihood: number;
  /** 1 (minor) to 5 (catastrophic). */
  consequence: number;
};

export const RISK_LEVELS: readonly RiskLevel[] = ['low', 'medium', 'high', 'extreme'];

export const RISK_LABEL: Record<RiskLevel, string> = { low: 'Low', medium: 'Medium', high: 'High', extreme: 'Extreme' };

export const RISK_TONE: Record<RiskLevel, Tone> = { low: 'success', medium: 'amber', high: 'warning', extreme: 'critical' };

/** The level of a cell from likelihood × consequence. */
export function riskLevel(likelihood: number, consequence: number): RiskLevel {
  const score = likelihood * consequence;
  if (score >= 15) return 'extreme';
  if (score >= 8) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
}

/** How many items sit at each level. */
export function countByRiskLevel(items: readonly RiskItem[]): Record<RiskLevel, number> {
  const counts: Record<RiskLevel, number> = { low: 0, medium: 0, high: 0, extreme: 0 };
  for (const item of items) counts[riskLevel(item.likelihood, item.consequence)] += 1;
  return counts;
}
