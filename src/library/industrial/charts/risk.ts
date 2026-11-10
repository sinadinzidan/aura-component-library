/** Risk grading shared by `RiskMatrix` and anything that totals its items. */

export type RiskLevel = 'low' | 'medium' | 'high';

export type RiskItem = {
  id: string;
  /** What is at risk: an asset, a work order, a finding. */
  label: string;
  /** 1 (least likely) to the number of likelihood steps. */
  likelihood: number;
  /** 1 (least severe) to the number of consequence steps. */
  consequence: number;
};

/** Risk level of a cell from its score, likelihood × consequence. */
export function riskLevel(likelihood: number, consequence: number, thresholds = { medium: 5, high: 15 }): RiskLevel {
  const score = likelihood * consequence;
  if (score >= thresholds.high) return 'high';
  if (score >= thresholds.medium) return 'medium';
  return 'low';
}

/** How many items fall on each risk level. */
export function countByRiskLevel(items: readonly RiskItem[], thresholds = { medium: 5, high: 15 }): Record<RiskLevel, number> {
  const counts: Record<RiskLevel, number> = { low: 0, medium: 0, high: 0 };
  for (const item of items) counts[riskLevel(item.likelihood, item.consequence, thresholds)] += 1;
  return counts;
}
