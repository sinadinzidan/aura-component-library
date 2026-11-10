/**
 * Pure OEE maths: the three factors, their product, and how the losses stack up between
 * planned time and what was actually produced. Percentages are 0–100 throughout.
 */

export type OeeFactors = {
  /** Run time as a share of planned production time. */
  availability: number;
  /** Actual rate as a share of the ideal rate while running. */
  performance: number;
  /** Good (on-spec) output as a share of total output. */
  quality: number;
};

export type OeeCounts = {
  /** Planned production time, in any time unit. */
  plannedTime: number;
  /** Time actually running, in the same unit. */
  runTime: number;
  /** Output per time unit at the ideal rate. */
  idealRate: number;
  totalCount: number;
  goodCount: number;
};

export type OeeLosses = {
  /** Points of OEE lost to stops. */
  availabilityLoss: number;
  /** Points lost to running below the ideal rate. */
  performanceLoss: number;
  /** Points lost to off-spec output. */
  qualityLoss: number;
  oee: number;
};

export type WaterfallStep = {
  label: string;
  kind: 'start' | 'loss' | 'result';
  /** Size of the bar. */
  value: number;
  /** Where the bar starts and ends on the start value's scale. */
  from: number;
  to: number;
};

function ratio(part: number, whole: number): number {
  return whole > 0 ? (part / whole) * 100 : 0;
}

/** OEE in percent: availability × performance × quality. */
export function oee({ availability, performance, quality }: OeeFactors): number {
  return (availability * performance * quality) / 10_000;
}

/** The three factors from time and counts. A factor with nothing to divide by is 0. */
export function oeeFromCounts({ plannedTime, runTime, idealRate, totalCount, goodCount }: OeeCounts): OeeFactors {
  return {
    availability: ratio(runTime, plannedTime),
    performance: ratio(totalCount, runTime * idealRate),
    quality: ratio(goodCount, totalCount),
  };
}

/**
 * OEE points lost at each factor, in the order the losses occur. The three losses and the OEE
 * always add up to 100.
 */
export function oeeLosses(factors: OeeFactors): OeeLosses {
  const afterAvailability = factors.availability;
  const afterPerformance = (afterAvailability * factors.performance) / 100;
  const afterQuality = (afterPerformance * factors.quality) / 100;
  return {
    availabilityLoss: 100 - afterAvailability,
    performanceLoss: afterAvailability - afterPerformance,
    qualityLoss: afterPerformance - afterQuality,
    oee: afterQuality,
  };
}

/** Rows of a waterfall: the start value, each loss stepping down from the one before, and what is left. */
export function waterfallSteps(
  start: { label: string; value: number },
  losses: readonly { label: string; value: number }[],
  resultLabel: string
): WaterfallStep[] {
  const steps: WaterfallStep[] = [{ label: start.label, kind: 'start', value: start.value, from: 0, to: start.value }];
  let remaining = start.value;
  for (const loss of losses) {
    const next = Math.max(0, remaining - loss.value);
    steps.push({ label: loss.label, kind: 'loss', value: loss.value, from: next, to: remaining });
    remaining = next;
  }
  steps.push({ label: resultLabel, kind: 'result', value: remaining, from: 0, to: remaining });
  return steps;
}

/** Actual as a share of plan, 0 and up. 0 when there is no plan. */
export function attainment(actual: number, plan: number): number {
  return ratio(actual, plan);
}
