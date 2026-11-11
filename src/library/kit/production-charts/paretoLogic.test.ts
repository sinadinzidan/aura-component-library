import { calendarWeeks, paretoRows, symmetricExtent } from './paretoLogic';

describe(paretoRows.name, () => {
  it('sorts largest first and accumulates shares', () => {
    const rows = paretoRows([
      { label: 'B', value: 20 },
      { label: 'A', value: 60 },
      { label: 'C', value: 15 },
      { label: 'D', value: 5 },
    ]);

    expect(rows.map((row) => row.label)).toEqual(['A', 'B', 'C', 'D']);
    expect(rows.map((row) => row.cumulative)).toEqual([60, 80, 95, 100]);
    expect(rows.map((row) => row.vital)).toEqual([true, true, false, false]);
  });

  it('survives an empty total', () => {
    expect(paretoRows([{ label: 'A', value: 0 }])[0].share).toBe(0);
  });
});

describe(symmetricExtent.name, () => {
  it('rounds the largest deviation up to the step', () => {
    expect(symmetricExtent([0.04, -0.21, 0.1], 0.1)).toBeCloseTo(0.3);
    expect(symmetricExtent([], 5)).toBe(5);
  });
});

describe(calendarWeeks.name, () => {
  it('pads the first and last week', () => {
    const weeks = calendarWeeks(Array.from({ length: 10 }, (_, index) => ({ day: index + 1 })), 3);

    expect(weeks).toHaveLength(2);
    expect(weeks[0].slice(0, 4).map((cell) => cell?.day ?? null)).toEqual([null, null, null, 1]);
    expect(weeks[1][6]).toBeNull();
  });
});
