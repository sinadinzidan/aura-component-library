import { checkConstraint, percentChange, runStatus, tornadoDomain, tornadoRows } from './scenarios';

describe(runStatus.name, () => {
  it.each([
    ['draft', 'Draft', 'neutral'],
    ['queued', 'Queued', 'neutral'],
    ['running', 'Running', 'info'],
    ['done', 'Done', 'success'],
    ['failed', 'Failed', 'critical'],
  ] as const)('describes %s', (status, label, tone) => {
    expect(runStatus(status)).toMatchObject({ label, tone });
  });
});

describe(tornadoRows.name, () => {
  const rows = tornadoRows([
    { id: 'eff', label: 'Efficiency', low: 10.9, high: 9.8 },
    { id: 'flow', label: 'Flow', low: 9.0, high: 11.3 },
    { id: 'temp', label: 'Suction temperature', low: 10.2, high: 10.4 },
  ]);

  it('sorts by swing, largest first', () => {
    expect(rows.map((row) => row.id)).toEqual(['flow', 'eff', 'temp']);
  });

  it('orders each bar from the smaller to the larger outcome', () => {
    expect(rows[1]).toMatchObject({ from: 9.8, to: 10.9 });
    expect(rows[1].span).toBeCloseTo(1.1, 6);
  });

  it('keeps which end came from the low input', () => {
    expect(rows[1]).toMatchObject({ low: 10.9, high: 9.8 });
  });
});

describe(tornadoDomain.name, () => {
  it('covers every outcome and the baseline with a small pad', () => {
    const [low, high] = tornadoDomain(tornadoRows([{ id: 'flow', label: 'Flow', low: 9, high: 11 }]), 10.3);

    expect(low).toBeCloseTo(8.9, 6);
    expect(high).toBeCloseTo(11.1, 6);
  });

  it('includes a baseline that lies outside the bars', () => {
    const [low] = tornadoDomain(tornadoRows([{ id: 'flow', label: 'Flow', low: 9, high: 11 }]), 8);

    expect(low).toBeLessThan(8);
  });

  it('still has width with no rows', () => {
    const [low, high] = tornadoDomain([], 10);

    expect(high).toBeGreaterThan(low);
  });
});

describe(checkConstraint.name, () => {
  it('is respected below a maximum', () => {
    expect(checkConstraint(143.5, { max: 145 })).toMatchObject({ ok: true, label: 'Respected', tone: 'success' });
  });

  it('is violated above a maximum, with a negative margin', () => {
    const check = checkConstraint(149, { max: 145 });

    expect(check).toMatchObject({ ok: false, label: 'Violated', tone: 'critical' });
    expect(check.margin).toBe(-4);
  });

  it('uses the nearest bound of a range', () => {
    expect(checkConstraint(11, { min: 10, max: 15 }).margin).toBe(1);
  });

  it('is violated below a minimum', () => {
    expect(checkConstraint(9, { min: 10 }).ok).toBe(false);
  });

  it('counts a value on the bound as respected', () => {
    expect(checkConstraint(145, { max: 145 }).ok).toBe(true);
  });
});

describe(percentChange.name, () => {
  it('is the relative change in percent', () => {
    expect(percentChange(11, 10)).toBeCloseTo(10, 6);
    expect(percentChange(9, 10)).toBeCloseTo(-10, 6);
  });

  it('is null for a zero baseline', () => {
    expect(percentChange(5, 0)).toBeNull();
  });
});
