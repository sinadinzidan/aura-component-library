import { oeeOf, stateDuration, waterfallColumns } from './oee';

describe(oeeOf.name, () => {
  it('multiplies the factors', () => {
    expect(oeeOf([{ value: 90 }, { value: 95 }, { value: 99 }])).toBeCloseTo(84.645, 3);
  });

  it('is 100 without factors', () => {
    expect(oeeOf([])).toBe(100);
  });
});

describe(waterfallColumns.name, () => {
  it('steps down from the total to the result', () => {
    const columns = waterfallColumns({ label: 'Planned', value: 100 }, [{ label: 'Stops', value: 8 }, { label: 'Speed', value: 5, tone: 'amber' }], 'Effective');

    expect(columns.map((column) => [column.kind, column.from, column.to])).toEqual([
      ['total', 0, 100],
      ['loss', 92, 100],
      ['loss', 87, 92],
      ['result', 0, 87],
    ]);
    expect(columns[1].tone).toBe('warning');
    expect(columns[2].tone).toBe('amber');
  });
});

describe(stateDuration.name, () => {
  it('sums the segments of one state', () => {
    const segments = [
      { from: 0, to: 4, state: 'Running', tone: 'success' as const },
      { from: 4, to: 5, state: 'Stopped', tone: 'critical' as const },
      { from: 5, to: 8, state: 'Running', tone: 'success' as const },
    ];
    expect(stateDuration(segments, 'Running')).toBe(7);
    expect(stateDuration(segments, 'Idle')).toBe(0);
  });
});
