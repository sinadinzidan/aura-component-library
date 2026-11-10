import { attainment, oee, oeeFromCounts, oeeLosses, waterfallSteps } from './oee';

describe(oee.name, () => {
  it('multiplies the three factors', () => {
    expect(oee({ availability: 90, performance: 95, quality: 99 })).toBeCloseTo(84.645, 10);
  });

  it('is 100 when nothing is lost', () => {
    expect(oee({ availability: 100, performance: 100, quality: 100 })).toBe(100);
  });

  it('is 0 when one factor is 0', () => {
    expect(oee({ availability: 0, performance: 95, quality: 99 })).toBe(0);
  });
});

describe(oeeFromCounts.name, () => {
  // A 480 minute shift with 48 minutes stopped, ideal 2 per minute, 778 made, 770 good.
  const counts = { plannedTime: 480, runTime: 432, idealRate: 2, totalCount: 778, goodCount: 770 };

  it('derives availability from run time over planned time', () => {
    expect(oeeFromCounts(counts).availability).toBeCloseTo(90, 10);
  });

  it('derives performance from output over ideal output while running', () => {
    expect(oeeFromCounts(counts).performance).toBeCloseTo((778 / 864) * 100, 10);
  });

  it('derives quality from good over total', () => {
    expect(oeeFromCounts(counts).quality).toBeCloseTo((770 / 778) * 100, 10);
  });

  it('gives an OEE equal to good output over ideal output for the planned time', () => {
    expect(oee(oeeFromCounts(counts))).toBeCloseTo((770 / 960) * 100, 10);
  });

  it('returns 0 for a factor with nothing to divide by', () => {
    expect(oeeFromCounts({ ...counts, plannedTime: 0, runTime: 0, totalCount: 0, goodCount: 0 })).toEqual({
      availability: 0,
      performance: 0,
      quality: 0,
    });
  });
});

describe(oeeLosses.name, () => {
  const factors = { availability: 90, performance: 90, quality: 90 };

  it('steps each loss down from what the previous factor left', () => {
    const losses = oeeLosses(factors);

    expect(losses.availabilityLoss).toBeCloseTo(10, 10);
    expect(losses.performanceLoss).toBeCloseTo(9, 10);
    expect(losses.qualityLoss).toBeCloseTo(8.1, 10);
    expect(losses.oee).toBeCloseTo(72.9, 10);
  });

  it('adds up to 100 with the OEE', () => {
    const losses = oeeLosses({ availability: 96.4, performance: 87.4, quality: 98.2 });

    expect(losses.availabilityLoss + losses.performanceLoss + losses.qualityLoss + losses.oee).toBeCloseTo(100, 10);
  });
});

describe(waterfallSteps.name, () => {
  const steps = waterfallSteps(
    { label: 'Plan', value: 100 },
    [
      { label: 'Stops', value: 10 },
      { label: 'Slow running', value: 5 },
    ],
    'Actual'
  );

  it('starts with the full start bar', () => {
    expect(steps[0]).toEqual({ label: 'Plan', kind: 'start', value: 100, from: 0, to: 100 });
  });

  it('hangs each loss from where the previous one ended', () => {
    expect(steps[1]).toMatchObject({ kind: 'loss', from: 90, to: 100 });
    expect(steps[2]).toMatchObject({ kind: 'loss', from: 85, to: 90 });
  });

  it('ends with what is left', () => {
    expect(steps[3]).toEqual({ label: 'Actual', kind: 'result', value: 85, from: 0, to: 85 });
  });

  it('never goes below zero', () => {
    const over = waterfallSteps({ label: 'Plan', value: 10 }, [{ label: 'Outage', value: 15 }], 'Actual');

    expect(over[2]).toMatchObject({ value: 0, to: 0 });
  });
});

describe(attainment.name, () => {
  it('gives actual as a share of plan', () => {
    expect(attainment(4.38, 4.5)).toBeCloseTo(97.333, 3);
  });

  it('can exceed 100', () => {
    expect(attainment(110, 100)).toBeCloseTo(110, 10);
  });

  it('is 0 without a plan', () => {
    expect(attainment(5, 0)).toBe(0);
  });
});
