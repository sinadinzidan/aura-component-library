export type RunRuleFlag = {
  index: number;
  /** 1: beyond a control limit. 2: eight in a row on one side of the centre line. 3: six in a row rising or falling. */
  rule: 1 | 2 | 3;
  text: string;
};

const RULE_TEXT: Record<RunRuleFlag['rule'], string> = {
  1: 'Beyond a control limit',
  2: 'Eight in a row on one side of the centre line',
  3: 'Six in a row rising or falling',
};

/** Points that break a run rule. A point is reported once, under the lowest-numbered rule it breaks. */
export function runRules(values: readonly number[], center: number, ucl: number, lcl: number): RunRuleFlag[] {
  const flags = new Map<number, RunRuleFlag['rule']>();
  const flag = (index: number, rule: RunRuleFlag['rule']) => {
    const current = flags.get(index);
    if (current === undefined || rule < current) flags.set(index, rule);
  };

  let side = 0;
  let sideRun = 0;
  let direction = 0;
  let trendRun = 1;
  values.forEach((value, index) => {
    if (value > ucl || value < lcl) flag(index, 1);

    const currentSide = Math.sign(value - center);
    sideRun = currentSide !== 0 && currentSide === side ? sideRun + 1 : 1;
    side = currentSide;
    if (currentSide !== 0 && sideRun >= 8) flag(index, 2);

    if (index > 0) {
      const currentDirection = Math.sign(value - values[index - 1]);
      trendRun = currentDirection !== 0 && currentDirection === direction ? trendRun + 1 : currentDirection === 0 ? 1 : 2;
      direction = currentDirection;
      if (trendRun >= 6) flag(index, 3);
    }
  });

  return [...flags.entries()].sort((a, b) => a[0] - b[0]).map(([index, rule]) => ({ index, rule, text: RULE_TEXT[rule] }));
}

export type Capability = { mean: number; sigma: number; cp: number; cpk: number };

/** Mean, sample standard deviation, Cp and Cpk of the values against the specification limits. */
export function capability(values: readonly number[], lsl: number, usl: number): Capability {
  const count = values.length || 1;
  const mean = values.reduce((sum, value) => sum + value, 0) / count;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(count - 1, 1);
  const sigma = Math.sqrt(variance) || Number.EPSILON;
  return { mean, sigma, cp: (usl - lsl) / (6 * sigma), cpk: Math.min(usl - mean, mean - lsl) / (3 * sigma) };
}

/** Counts per equal-width bin between `min` and `max`; values outside land in the end bins. */
export function histogramBins(values: readonly number[], min: number, max: number, bins: number): number[] {
  const counts = Array.from({ length: bins }, () => 0);
  const width = (max - min) / bins || 1;
  for (const value of values) {
    const index = Math.min(bins - 1, Math.max(0, Math.floor((value - min) / width)));
    counts[index] += 1;
  }
  return counts;
}

/** Height of the normal curve at `x`, as a share of its peak (0–1). */
export function normalShare(x: number, mean: number, sigma: number): number {
  return Math.exp(-((x - mean) ** 2) / (2 * sigma ** 2));
}

export type SpecVerdict = { word: 'In spec' | 'Above spec' | 'Below spec'; ok: boolean };

/** Judges a result against a one- or two-sided specification. Limits are inclusive. */
export function specVerdict(value: number, lsl?: number, usl?: number): SpecVerdict {
  if (usl !== undefined && value > usl) return { word: 'Above spec', ok: false };
  if (lsl !== undefined && value < lsl) return { word: 'Below spec', ok: false };
  return { word: 'In spec', ok: true };
}

/** The specification in words: "0.50 – 2.00", "max 2.00", "min 0.50". */
export function specText(format: (value: number) => string, lsl?: number, usl?: number): string {
  if (lsl !== undefined && usl !== undefined) return `${format(lsl)} – ${format(usl)}`;
  if (usl !== undefined) return `max ${format(usl)}`;
  if (lsl !== undefined) return `min ${format(lsl)}`;
  return 'none';
}

/** Round tick values inside a domain that does not start at zero. */
export function axisTicks(lo: number, hi: number, count = 4): number[] {
  const rough = Math.max(hi - lo, Number.EPSILON) / count;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((factor) => factor * magnitude).find((candidate) => candidate >= rough * (1 - 1e-9)) ?? rough;
  const ticks: number[] = [];
  for (let tick = Math.ceil(lo / step - 1e-9) * step; tick <= hi + 1e-9; tick += step) ticks.push(Number(tick.toPrecision(12)));
  return ticks;
}
