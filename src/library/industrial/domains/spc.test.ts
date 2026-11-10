import {
  capability,
  capabilityVerdict,
  controlLimits,
  histogram,
  mean,
  runRuleViolations,
  sampleStdDev,
  specCompliance,
} from './spc';

const LIMITS = { center: 10, ucl: 13, lcl: 7 };

describe('mean and sampleStdDev', () => {
  it('averages the values', () => {
    expect(mean([2, 4, 6])).toBe(4);
  });

  it('returns 0 for an empty list', () => {
    expect(mean([])).toBe(0);
  });

  it('uses n − 1 for the standard deviation', () => {
    expect(sampleStdDev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.138, 3);
  });

  it('returns 0 for a single value', () => {
    expect(sampleStdDev([5])).toBe(0);
  });
});

describe(controlLimits.name, () => {
  // Three subgroups of five: means 10, 12, 11 and ranges 4, 4, 2.
  const subgroups = [
    [8, 9, 10, 11, 12],
    [10, 11, 12, 13, 14],
    [10, 11, 11, 11, 12],
  ];

  it('reports the mean and range of every subgroup', () => {
    const result = controlLimits(subgroups);

    expect(result.means).toEqual([10, 12, 11]);
    expect(result.ranges).toEqual([4, 4, 2]);
  });

  it('places the X-bar limits at the grand mean ± A2 × mean range', () => {
    const { xbar } = controlLimits(subgroups);

    // Grand mean 11, mean range 10/3, A2 = 0.577 for n = 5.
    expect(xbar.center).toBeCloseTo(11, 10);
    expect(xbar.ucl).toBeCloseTo(11 + 0.577 * (10 / 3), 10);
    expect(xbar.lcl).toBeCloseTo(11 - 0.577 * (10 / 3), 10);
  });

  it('places the range limits at D3 and D4 × mean range', () => {
    const { range } = controlLimits(subgroups);

    expect(range.center).toBeCloseTo(10 / 3, 10);
    expect(range.ucl).toBeCloseTo(2.114 * (10 / 3), 10);
    expect(range.lcl).toBe(0);
  });

  it('estimates sigma as mean range over d2', () => {
    expect(controlLimits(subgroups).sigma).toBeCloseTo(10 / 3 / 2.326, 10);
  });

  it('uses a non-zero lower range limit from subgroup size 7', () => {
    const { range } = controlLimits([
      [1, 2, 3, 4, 5, 6, 7],
      [2, 3, 4, 5, 6, 7, 8],
    ]);

    expect(range.lcl).toBeCloseTo(0.076 * 6, 10);
  });

  it('rejects subgroups of unequal size', () => {
    expect(() => controlLimits([[1, 2, 3], [1, 2]])).toThrow('equal size');
  });

  it('rejects a subgroup size outside 2–10', () => {
    expect(() => controlLimits([[1], [2]])).toThrow('between 2 and 10');
  });
});

describe(runRuleViolations.name, () => {
  it('finds nothing in a process that stays in control', () => {
    expect(runRuleViolations([10, 11, 9, 10.5, 9.5, 10, 11, 9], LIMITS)).toEqual([]);
  });

  it('flags a point above the upper control limit with rule 1', () => {
    expect(runRuleViolations([10, 9, 13.5, 10], LIMITS)).toEqual([{ index: 2, rule: 1 }]);
  });

  it('flags a point below the lower control limit with rule 1', () => {
    expect(runRuleViolations([10, 6.9], LIMITS)).toEqual([{ index: 1, rule: 1 }]);
  });

  it('does not flag a point exactly on a limit', () => {
    expect(runRuleViolations([13, 7], LIMITS)).toEqual([]);
  });

  it('flags the ninth point in a row on one side with rule 2', () => {
    const values = [10.5, 10.2, 10.6, 10.3, 10.5, 10.2, 10.6, 10.3, 10.4];

    expect(runRuleViolations(values, LIMITS)).toEqual([{ index: 8, rule: 2 }]);
  });

  it('keeps flagging while the run on one side continues', () => {
    const values = [10.5, 10.2, 10.6, 10.3, 10.5, 10.2, 10.6, 10.3, 10.4, 10.2];

    expect(runRuleViolations(values, LIMITS).map((violation) => violation.index)).toEqual([8, 9]);
  });

  it('does not count a point on the centre line towards a run', () => {
    const values = [10.5, 10.2, 10.6, 10.3, 10, 10.2, 10.6, 10.3, 10.4];

    expect(runRuleViolations(values, LIMITS)).toEqual([]);
  });

  it('flags the sixth point of a steady rise with rule 3', () => {
    expect(runRuleViolations([9, 9.2, 9.4, 9.6, 9.8, 10.1], LIMITS)).toEqual([{ index: 5, rule: 3 }]);
  });

  it('flags the sixth point of a steady fall with rule 3', () => {
    expect(runRuleViolations([11, 10.8, 10.6, 10.4, 10.2, 9.9], LIMITS)).toEqual([{ index: 5, rule: 3 }]);
  });

  it('flags two of three points beyond two sigma on one side with rule 5', () => {
    expect(runRuleViolations([10, 12.4, 10, 12.6], LIMITS)).toEqual([{ index: 3, rule: 5 }]);
  });

  it('does not combine points beyond two sigma on opposite sides', () => {
    expect(runRuleViolations([10, 12.4, 7.5, 10], LIMITS)).toEqual([]);
  });

  it('reports a point that breaks several rules once, with the lowest rule', () => {
    expect(runRuleViolations([10, 12.5, 13.4], LIMITS)).toEqual([{ index: 2, rule: 1 }]);
  });
});

describe(capability.name, () => {
  // Mean 10, sample standard deviation exactly 1.
  const centred = [9, 10, 11];

  it('computes Cp from the spec width over six sigma', () => {
    expect(capability(centred, 4, 16).cp).toBeCloseTo(2, 10);
  });

  it('gives Cpk equal to Cp for a centred process', () => {
    expect(capability(centred, 4, 16).cpk).toBeCloseTo(2, 10);
  });

  it('takes the nearer spec limit for Cpk when the process is off centre', () => {
    const result = capability(centred, 4, 13);

    expect(result.cp).toBeCloseTo(1.5, 10);
    expect(result.cpu).toBeCloseTo(1, 10);
    expect(result.cpl).toBeCloseTo(2, 10);
    expect(result.cpk).toBeCloseTo(1, 10);
  });

  it('gives a negative Cpk when the mean is outside the spec', () => {
    expect(capability(centred, 4, 9).cpk).toBeCloseTo(-1 / 3, 10);
  });

  it('reports mean and sigma', () => {
    expect(capability(centred, 4, 16)).toMatchObject({ mean: 10, sigma: 1 });
  });

  it('is infinite when there is no variation', () => {
    expect(capability([5, 5, 5], 4, 6).cpk).toBe(Infinity);
  });
});

describe(capabilityVerdict.name, () => {
  it.each([
    [1.67, 'capable'],
    [1.33, 'capable'],
    [1.32, 'marginal'],
    [1, 'marginal'],
    [0.99, 'not-capable'],
    [-0.2, 'not-capable'],
  ] as const)('reads Cpk %s as %s', (cpk, verdict) => {
    expect(capabilityVerdict(cpk)).toBe(verdict);
  });
});

describe(histogram.name, () => {
  it('counts values into equal-width bins', () => {
    const bins = histogram([0.5, 1.5, 1.6, 3.9], 4, 0, 4);

    expect(bins.map((bin) => bin.count)).toEqual([1, 2, 0, 1]);
    expect(bins[1]).toMatchObject({ from: 1, to: 2 });
  });

  it('puts the maximum in the last bin', () => {
    expect(histogram([4], 4, 0, 4).map((bin) => bin.count)).toEqual([0, 0, 0, 1]);
  });

  it('drops values outside the range', () => {
    expect(histogram([-1, 5], 2, 0, 4).map((bin) => bin.count)).toEqual([0, 0]);
  });

  it('returns no bins for an empty range', () => {
    expect(histogram([1], 4, 2, 2)).toEqual([]);
  });
});

describe(specCompliance.name, () => {
  it('gives the share of values inside the limits, limits included', () => {
    expect(specCompliance([1, 2, 3, 4, 5], 2, 4)).toBe(60);
  });

  it('is 100 with no values', () => {
    expect(specCompliance([], 0, 1)).toBe(100);
  });
});
