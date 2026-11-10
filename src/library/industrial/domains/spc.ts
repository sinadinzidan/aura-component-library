/**
 * Pure statistical process control maths: X-bar and R control limits, run rules, process
 * capability and histogram bins. No rendering — `ControlChart` and `CapabilitySummary` draw the
 * results, and the same numbers can feed a table or an alert rule.
 */

/** Centre line with upper and lower control limits. */
export type ControlLimits = { center: number; ucl: number; lcl: number };

export type XbarRLimits = {
  /** Mean of each subgroup, in order. */
  means: number[];
  /** Range (max − min) of each subgroup, in order. */
  ranges: number[];
  xbar: ControlLimits;
  range: ControlLimits;
  /** Estimated process standard deviation, R̄ / d2. */
  sigma: number;
  subgroupSize: number;
};

/** Which run rule a point breaks. Numbers follow the Nelson rules. */
export type RunRule = 1 | 2 | 3 | 5;

export type RunRuleViolation = { index: number; rule: RunRule };

export type Capability = {
  mean: number;
  /** Sample standard deviation. */
  sigma: number;
  /** Potential capability: spec width over six sigma. */
  cp: number;
  /** Capability against the upper spec limit. */
  cpu: number;
  /** Capability against the lower spec limit. */
  cpl: number;
  /** Actual capability: the worse of `cpu` and `cpl`. */
  cpk: number;
};

export type CapabilityVerdict = 'capable' | 'marginal' | 'not-capable';

export type HistogramBin = { from: number; to: number; count: number };

/** Shewhart constants for subgroup sizes 2–10. */
const XBAR_R_CONSTANTS: Record<number, { a2: number; d3: number; d4: number; d2: number }> = {
  2: { a2: 1.88, d3: 0, d4: 3.267, d2: 1.128 },
  3: { a2: 1.023, d3: 0, d4: 2.574, d2: 1.693 },
  4: { a2: 0.729, d3: 0, d4: 2.282, d2: 2.059 },
  5: { a2: 0.577, d3: 0, d4: 2.114, d2: 2.326 },
  6: { a2: 0.483, d3: 0, d4: 2.004, d2: 2.534 },
  7: { a2: 0.419, d3: 0.076, d4: 1.924, d2: 2.704 },
  8: { a2: 0.373, d3: 0.136, d4: 1.864, d2: 2.847 },
  9: { a2: 0.337, d3: 0.184, d4: 1.816, d2: 2.97 },
  10: { a2: 0.308, d3: 0.223, d4: 1.777, d2: 3.078 },
};

/** What each run rule means, for legends and violation lists. */
export const RUN_RULE_TEXT: Record<RunRule, string> = {
  1: 'One point beyond a control limit',
  2: 'Nine points in a row on one side of the centre line',
  3: 'Six points in a row rising or falling',
  5: 'Two of three points beyond two sigma on one side',
};

/** Arithmetic mean; 0 for an empty list. */
export function mean(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** Sample standard deviation (n − 1); 0 with fewer than two values. */
export function sampleStdDev(values: readonly number[]): number {
  if (values.length < 2) return 0;
  const center = mean(values);
  const squares = values.reduce((sum, value) => sum + (value - center) ** 2, 0);
  return Math.sqrt(squares / (values.length - 1));
}

/**
 * X-bar and R chart limits from rational subgroups of equal size (2–10 measurements each):
 * X̿ ± A2·R̄ for the means, D3·R̄ and D4·R̄ for the ranges.
 */
export function controlLimits(subgroups: readonly (readonly number[])[]): XbarRLimits {
  const subgroupSize = subgroups[0]?.length ?? 0;
  const constants = XBAR_R_CONSTANTS[subgroupSize];
  if (!constants) throw new Error('Subgroup size must be between 2 and 10');
  if (subgroups.some((subgroup) => subgroup.length !== subgroupSize)) throw new Error('Subgroups must have equal size');

  const means = subgroups.map((subgroup) => mean(subgroup));
  const ranges = subgroups.map((subgroup) => Math.max(...subgroup) - Math.min(...subgroup));
  const grandMean = mean(means);
  const meanRange = mean(ranges);

  return {
    means,
    ranges,
    xbar: { center: grandMean, ucl: grandMean + constants.a2 * meanRange, lcl: grandMean - constants.a2 * meanRange },
    range: { center: meanRange, ucl: constants.d4 * meanRange, lcl: constants.d3 * meanRange },
    sigma: meanRange / constants.d2,
    subgroupSize,
  };
}

function side(value: number, center: number): -1 | 0 | 1 {
  if (value > center) return 1;
  if (value < center) return -1;
  return 0;
}

/**
 * Points that break a run rule, oldest first, each reported once with the lowest-numbered rule
 * it breaks. Rule 2, 3 and 5 flag the point that completes the pattern.
 */
export function runRuleViolations(values: readonly number[], limits: ControlLimits): RunRuleViolation[] {
  const sigma = (limits.ucl - limits.center) / 3;
  const violations: RunRuleViolation[] = [];

  values.forEach((value, index) => {
    if (value > limits.ucl || value < limits.lcl) {
      violations.push({ index, rule: 1 });
      return;
    }

    if (index >= 8) {
      const window = values.slice(index - 8, index + 1).map((entry) => side(entry, limits.center));
      if (window[0] !== 0 && window.every((entry) => entry === window[0])) {
        violations.push({ index, rule: 2 });
        return;
      }
    }

    if (index >= 5) {
      const window = values.slice(index - 5, index + 1);
      const rising = window.every((entry, position) => position === 0 || entry > window[position - 1]);
      const falling = window.every((entry, position) => position === 0 || entry < window[position - 1]);
      if (rising || falling) {
        violations.push({ index, rule: 3 });
        return;
      }
    }

    if (index >= 2 && sigma > 0) {
      const window = values.slice(index - 2, index + 1);
      const above = window.filter((entry) => entry > limits.center + 2 * sigma).length;
      const below = window.filter((entry) => entry < limits.center - 2 * sigma).length;
      const current = Math.abs(value - limits.center) > 2 * sigma;
      if (current && (above >= 2 || below >= 2)) violations.push({ index, rule: 5 });
    }
  });

  return violations;
}

/** Process capability of measurements against a lower and upper specification limit. */
export function capability(values: readonly number[], lsl: number, usl: number): Capability {
  const center = mean(values);
  const sigma = sampleStdDev(values);
  if (sigma === 0) return { mean: center, sigma, cp: Infinity, cpu: Infinity, cpl: Infinity, cpk: Infinity };
  const cpu = (usl - center) / (3 * sigma);
  const cpl = (center - lsl) / (3 * sigma);
  return { mean: center, sigma, cp: (usl - lsl) / (6 * sigma), cpu, cpl, cpk: Math.min(cpu, cpl) };
}

/** The usual reading of Cpk: 1.33 and above is capable, 1.00–1.33 marginal, below 1.00 not capable. */
export function capabilityVerdict(cpk: number): CapabilityVerdict {
  if (cpk >= 1.33) return 'capable';
  if (cpk >= 1) return 'marginal';
  return 'not-capable';
}

/** Equal-width bins across `min`–`max`. Values outside the range are dropped; `max` lands in the last bin. */
export function histogram(values: readonly number[], binCount: number, min: number, max: number): HistogramBin[] {
  if (binCount < 1 || !(max > min)) return [];
  const width = (max - min) / binCount;
  const bins = Array.from({ length: binCount }, (_, index) => ({ from: min + index * width, to: min + (index + 1) * width, count: 0 }));
  for (const value of values) {
    if (value < min || value > max) continue;
    const index = Math.min(binCount - 1, Math.floor((value - min) / width));
    bins[index].count += 1;
  }
  return bins;
}

/** Share of values inside the specification limits, 0–100. 100 for an empty list. */
export function specCompliance(values: readonly number[], lsl: number, usl: number): number {
  if (values.length === 0) return 100;
  return (values.filter((value) => value >= lsl && value <= usl).length / values.length) * 100;
}
