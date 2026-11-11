/**
 * Statistical process control for individual results: control limits from an earlier baseline,
 * the four Western Electric run rules, and process capability against a specification.
 */

export type SpcLimits = {
  /** Centre line: the mean of the baseline. */
  mean: number;
  /** Short-term sigma, estimated from the average moving range of the baseline. */
  sigma: number;
  ucl: number;
  lcl: number;
};

export const SPC_RULES = [1, 2, 3, 4] as const;
export type SpcRule = (typeof SPC_RULES)[number];

export type SpcViolation = { index: number; rule: SpcRule };

/** What each run rule detects, in words an analyst would use. */
export const SPC_RULE_TEXT: Record<SpcRule, string> = {
  1: 'One result beyond three sigma',
  2: 'Two of three results beyond two sigma on the same side',
  3: 'Four of five results beyond one sigma on the same side',
  4: 'Eight results in a row on the same side of the centre line',
};

/** d2 for a moving range of two consecutive results. */
const D2 = 1.128;

/** Control limits from results that are known to be in control. Never include the result under test. */
export function controlLimits(baseline: readonly number[]): SpcLimits {
  const count = Math.max(baseline.length, 1);
  const mean = baseline.reduce((sum, value) => sum + value, 0) / count;
  const ranges = baseline.slice(1).map((value, index) => Math.abs(value - (baseline[index] ?? value)));
  const averageRange = ranges.length > 0 ? ranges.reduce((sum, value) => sum + value, 0) / ranges.length : 0;
  const sigma = averageRange / D2;
  return { mean, sigma, ucl: mean + 3 * sigma, lcl: mean - 3 * sigma };
}

/** How many sigma a result sits from the centre line, signed. */
export function sigmaDistance(value: number, limits: SpcLimits): number {
  return limits.sigma === 0 ? 0 : (value - limits.mean) / limits.sigma;
}

/** The zone a result falls in: C within one sigma, B within two, A within three, otherwise out. */
export function zoneOf(value: number, limits: SpcLimits): 'A' | 'B' | 'C' | 'out' {
  const distance = Math.abs(sigmaDistance(value, limits));
  if (distance > 3) return 'out';
  if (distance > 2) return 'A';
  if (distance > 1) return 'B';
  return 'C';
}

function sameSideBeyond(window: readonly number[], threshold: number, needed: number): boolean {
  const above = window.filter((distance) => distance > threshold).length;
  const below = window.filter((distance) => distance < -threshold).length;
  return above >= needed || below >= needed;
}

/**
 * The results that break a run rule, each reported once with the most serious rule it breaks.
 * A point is flagged when it completes the pattern, so the flag sits where an analyst would act.
 */
export function findViolations(values: readonly number[], limits: SpcLimits): SpcViolation[] {
  const distances = values.map((value) => sigmaDistance(value, limits));
  const violations: SpcViolation[] = [];

  distances.forEach((distance, index) => {
    const side = Math.sign(distance);
    const last = (size: number) => distances.slice(Math.max(0, index - size + 1), index + 1);
    if (Math.abs(distance) > 3) {
      violations.push({ index, rule: 1 });
    } else if (Math.abs(distance) > 2 && index >= 2 && sameSideBeyond(last(3), 2, 2)) {
      violations.push({ index, rule: 2 });
    } else if (Math.abs(distance) > 1 && index >= 4 && sameSideBeyond(last(5), 1, 4)) {
      violations.push({ index, rule: 3 });
    } else if (side !== 0 && index >= 7 && last(8).every((other) => Math.sign(other) === side)) {
      violations.push({ index, rule: 4 });
    }
  });

  return violations;
}

export type SpcSpec = {
  /** Lower specification limit; leave out for a one-sided maximum. */
  lsl?: number;
  /** Upper specification limit; leave out for a one-sided minimum. */
  usl?: number;
};

export type SpcCapability = {
  /** Potential capability; `null` when the specification is one-sided. */
  cp: number | null;
  /** Actual capability, counting how far the process sits from the nearer limit. */
  cpk: number;
  /** `capable` from 1.33, `marginal` from 1.0, otherwise `incapable`. */
  verdict: 'capable' | 'marginal' | 'incapable';
};

/** Process capability of a process with the given limits against a specification. */
export function capability(limits: SpcLimits, spec: SpcSpec): SpcCapability {
  const spread = 3 * limits.sigma || Number.EPSILON;
  const upper = spec.usl === undefined ? Infinity : (spec.usl - limits.mean) / spread;
  const lower = spec.lsl === undefined ? Infinity : (limits.mean - spec.lsl) / spread;
  const cpk = Math.min(upper, lower);
  const cp = spec.usl === undefined || spec.lsl === undefined ? null : (spec.usl - spec.lsl) / (2 * spread);
  return { cp, cpk, verdict: cpk >= 1.33 ? 'capable' : cpk >= 1 ? 'marginal' : 'incapable' };
}

/** Counts of values per equal-width bin across `[min, max]`, for a capability histogram. */
export function histogram(values: readonly number[], min: number, max: number, bins: number): number[] {
  const counts = Array.from({ length: bins }, () => 0);
  const width = (max - min) / bins || 1;
  for (const value of values) {
    const index = Math.min(bins - 1, Math.max(0, Math.floor((value - min) / width)));
    counts[index] = (counts[index] ?? 0) + 1;
  }
  return counts;
}
