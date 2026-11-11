import { capability, controlLimits, findViolations, histogram, sigmaDistance, zoneOf, type SpcLimits } from './spc';

const LIMITS: SpcLimits = { mean: 10, sigma: 1, ucl: 13, lcl: 7 };

describe('controlLimits', () => {
  it('centres on the mean and estimates sigma from the average moving range', () => {
    const limits = controlLimits([10, 12, 10, 12, 10]);

    expect(limits.mean).toBeCloseTo(10.8);
    expect(limits.sigma).toBeCloseTo(2 / 1.128);
    expect(limits.ucl).toBeCloseTo(10.8 + (3 * 2) / 1.128);
    expect(limits.lcl).toBeCloseTo(10.8 - (3 * 2) / 1.128);
  });

  it('returns zero sigma for a single result', () => {
    expect(controlLimits([5])).toEqual({ mean: 5, sigma: 0, ucl: 5, lcl: 5 });
  });
});

describe('sigmaDistance and zoneOf', () => {
  it('measures the signed distance from the centre line', () => {
    expect(sigmaDistance(8.5, LIMITS)).toBeCloseTo(-1.5);
    expect(sigmaDistance(8.5, { ...LIMITS, sigma: 0 })).toBe(0);
  });

  it('names the zone of a result', () => {
    expect(zoneOf(10.4, LIMITS)).toBe('C');
    expect(zoneOf(8.4, LIMITS)).toBe('B');
    expect(zoneOf(12.5, LIMITS)).toBe('A');
    expect(zoneOf(13.2, LIMITS)).toBe('out');
  });
});

describe('findViolations', () => {
  it('finds nothing in a process that wanders around its centre', () => {
    expect(findViolations([10.2, 9.7, 10.5, 9.9, 10.1, 9.6, 10.4, 9.8, 10.3], LIMITS)).toEqual([]);
  });

  it('flags one result beyond three sigma as rule 1', () => {
    expect(findViolations([10, 13.4, 10], LIMITS)).toEqual([{ index: 1, rule: 1 }]);
  });

  it('flags two of three beyond two sigma on one side as rule 2', () => {
    expect(findViolations([10, 12.3, 10.2, 12.4], LIMITS)).toEqual([{ index: 3, rule: 2 }]);
  });

  it('does not combine results on opposite sides for rule 2', () => {
    expect(findViolations([10, 12.3, 10.2, 7.6], LIMITS)).toEqual([]);
  });

  it('flags four of five beyond one sigma on one side as rule 3', () => {
    expect(findViolations([11.2, 11.4, 10.2, 11.3, 11.5], LIMITS)).toEqual([{ index: 4, rule: 3 }]);
  });

  it('flags the eighth result in a row on one side as rule 4', () => {
    expect(findViolations([9.8, 9.7, 9.9, 9.6, 9.8, 9.9, 9.7, 9.8, 10.3], LIMITS)).toEqual([{ index: 7, rule: 4 }]);
  });

  it('reports the most serious rule when a result breaks several', () => {
    expect(findViolations([10, 12.4, 13.5], LIMITS)).toEqual([{ index: 2, rule: 1 }]);
  });
});

describe('capability', () => {
  it('computes Cp and Cpk for a two-sided specification', () => {
    const result = capability(LIMITS, { lsl: 5, usl: 14 });

    expect(result.cp).toBeCloseTo(1.5);
    expect(result.cpk).toBeCloseTo(4 / 3);
    expect(result.verdict).toBe('capable');
  });

  it('leaves Cp out for a one-sided specification', () => {
    const result = capability(LIMITS, { usl: 13.3 });

    expect(result.cp).toBeNull();
    expect(result.cpk).toBeCloseTo(1.1);
    expect(result.verdict).toBe('marginal');
  });

  it('calls a process that crowds its limit incapable', () => {
    expect(capability(LIMITS, { lsl: 5, usl: 12 }).verdict).toBe('incapable');
  });
});

describe('histogram', () => {
  it('counts values per bin and keeps outliers in the end bins', () => {
    expect(histogram([0, 1, 1.5, 2.5, 3.9, 9, -4], 0, 4, 4)).toEqual([2, 2, 1, 2]);
  });
});
