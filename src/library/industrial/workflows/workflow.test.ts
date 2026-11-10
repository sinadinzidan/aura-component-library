import {
  causeStatus,
  convertUnit,
  coveragePercent,
  deviation,
  formatDuration,
  isWithinLimits,
  massBalance,
  missingDuration,
  normalizeGaps,
  presentSegments,
  stepProgress,
  stepZoom,
  summarizeRuns,
} from './workflow';

describe(stepProgress.name, () => {
  it('counts done and skipped steps as settled', () => {
    const result = stepProgress([{ state: 'done' }, { state: 'skipped' }, { state: 'active' }, { state: 'pending' }]);
    expect(result).toEqual({ settled: 2, total: 4, percent: 50, currentIndex: 2 });
  });

  it('points at a failed or held step before a later active one', () => {
    expect(stepProgress([{ state: 'done' }, { state: 'held' }, { state: 'active' }]).currentIndex).toBe(1);
    expect(stepProgress([{ state: 'failed' }, { state: 'pending' }]).currentIndex).toBe(0);
  });

  it('falls back to the first pending step', () => {
    expect(stepProgress([{ state: 'done' }, { state: 'pending' }, { state: 'pending' }]).currentIndex).toBe(1);
  });

  it('reports no current step when everything is settled', () => {
    expect(stepProgress([{ state: 'done' }, { state: 'done' }])).toMatchObject({ percent: 100, currentIndex: -1 });
  });

  it('handles an empty sequence', () => {
    expect(stepProgress([])).toEqual({ settled: 0, total: 0, percent: 0, currentIndex: -1 });
  });
});

describe(summarizeRuns.name, () => {
  it('counts each status and gives the success rate of finished runs', () => {
    const summary = summarizeRuns([{ status: 'success' }, { status: 'success' }, { status: 'failed' }, { status: 'running' }]);
    expect(summary.counts).toEqual({ success: 2, failed: 1, running: 1, skipped: 0 });
    expect(summary.successRate).toBe(67);
  });

  it('puts the history in words', () => {
    const summary = summarizeRuns([{ status: 'success' }, { status: 'failed' }, { status: 'skipped' }, { status: 'running' }]);
    expect(summary.text).toBe('1 of 4 runs succeeded, 1 failed, 1 skipped, 1 running');
  });

  it('leaves out statuses that did not occur', () => {
    expect(summarizeRuns([{ status: 'success' }, { status: 'success' }]).text).toBe('2 of 2 runs succeeded');
  });

  it('has no success rate before any run finishes', () => {
    expect(summarizeRuns([{ status: 'running' }]).successRate).toBeNull();
    expect(summarizeRuns([]).text).toBe('No runs');
  });
});

describe(normalizeGaps.name, () => {
  it('clamps, sorts and merges overlapping gaps', () => {
    const gaps = [
      { from: 60, to: 80 },
      { from: -10, to: 10 },
      { from: 70, to: 120 },
      { from: 30, to: 30 },
    ];
    expect(normalizeGaps(0, 100, gaps)).toEqual([
      { from: 0, to: 10 },
      { from: 60, to: 100 },
    ]);
  });

  it('accepts a reversed interval', () => {
    expect(normalizeGaps(0, 100, [{ from: 40, to: 20 }])).toEqual([{ from: 20, to: 40 }]);
  });
});

describe(presentSegments.name, () => {
  it('returns the stretches between gaps as percentages', () => {
    expect(presentSegments(0, 200, [{ from: 50, to: 100 }])).toEqual([
      { left: 0, width: 25 },
      { left: 50, width: 50 },
    ]);
  });

  it('returns the whole period when nothing is missing', () => {
    expect(presentSegments(0, 10, [])).toEqual([{ left: 0, width: 100 }]);
  });

  it('returns nothing for an empty period or a period that is all gap', () => {
    expect(presentSegments(5, 5, [])).toEqual([]);
    expect(presentSegments(0, 10, [{ from: 0, to: 10 }])).toEqual([]);
  });
});

describe(coveragePercent.name, () => {
  it('gives the share of the period that has data', () => {
    expect(coveragePercent(0, 1000, [{ from: 100, to: 225 }])).toBe(87.5);
    expect(missingDuration(0, 1000, [{ from: 100, to: 225 }])).toBe(125);
  });

  it('is zero for an empty period', () => {
    expect(coveragePercent(10, 10, [])).toBe(0);
  });
});

describe(formatDuration.name, () => {
  it.each([
    [45_000, '45 s'],
    [12 * 60_000, '12 min'],
    [2 * 3_600_000, '2 h'],
    [2 * 3_600_000 + 10 * 60_000, '2 h 10 min'],
    [2 * 3_600_000 + 59.8 * 60_000, '3 h'],
    [3 * 86_400_000 + 4 * 3_600_000, '3 d 4 h'],
    [2 * 86_400_000, '2 d'],
    [86_400_000 + 23.9 * 3_600_000, '2 d'],
    [-5, '0 s'],
  ])('formats %d ms as %s', (ms, text) => {
    expect(formatDuration(ms)).toBe(text);
  });
});

describe(stepZoom.name, () => {
  it('moves one step in either direction', () => {
    expect(stepZoom(100, 1)).toBe(125);
    expect(stepZoom(100, -1)).toBe(75);
  });

  it('snaps an off-step level to the next step', () => {
    expect(stepZoom(110, 1)).toBe(125);
    expect(stepZoom(110, -1)).toBe(100);
  });

  it('stays inside the range', () => {
    expect(stepZoom(400, 1)).toBe(400);
    expect(stepZoom(50, -1, { min: 50, step: 10 })).toBe(50);
  });
});

describe(isWithinLimits.name, () => {
  it('checks both limits and ignores missing ones', () => {
    expect(isWithinLimits(5, 1, 10)).toBe(true);
    expect(isWithinLimits(0.5, 1, 10)).toBe(false);
    expect(isWithinLimits(11, 1, 10)).toBe(false);
    expect(isWithinLimits(11, 1)).toBe(true);
    expect(isWithinLimits(10, undefined, 10)).toBe(true);
  });
});

describe(massBalance.name, () => {
  it('sums in and out and gives the imbalance', () => {
    const balance = massBalance([100, 50], [90, 57]);
    expect(balance).toMatchObject({ totalIn: 150, totalOut: 147, difference: 3 });
    expect(balance.percent).toBeCloseTo(2);
  });

  it('has no percentage when nothing came in', () => {
    expect(massBalance([], [10]).percent).toBeNull();
  });
});

describe(deviation.name, () => {
  it('gives the absolute and relative distance from a setpoint', () => {
    expect(deviation(55, 50)).toEqual({ absolute: 5, percent: 10 });
    expect(deviation(-12, -10).percent).toBeCloseTo(-20);
  });

  it('has no percentage for a zero setpoint', () => {
    expect(deviation(3, 0)).toEqual({ absolute: 3, percent: null });
  });
});

describe(convertUnit.name, () => {
  it('converts pressure, temperature and flow', () => {
    expect(convertUnit(10, 'barg', 'psig')).toBeCloseTo(145.038);
    expect(convertUnit(100, '°C', '°F')).toBe(212);
    expect(convertUnit(212, '°F', '°C')).toBeCloseTo(100);
    expect(convertUnit(1, 'm³/h', 'bbl/d')).toBeCloseTo(150.955);
  });

  it('returns the value for the same unit and null for an unknown pair', () => {
    expect(convertUnit(7, 'barg', 'barg')).toBe(7);
    expect(convertUnit(7, 'barg', '°C')).toBeNull();
  });
});

describe('causeStatus', () => {
  it('gives each state its own label and shape', () => {
    expect(causeStatus('confirmed')).toEqual({ tone: 'warning', label: 'Confirmed', shape: 'square' });
    expect(causeStatus('ruled-out').label).toBe('Ruled out');
    expect(causeStatus('open').shape).toBe('dot');
  });
});
