import { countDifferences, numericDelta, rowChange } from './compareRows';

describe(rowChange.name, () => {
  it('derives the change from the two values', () => {
    expect(rowChange({ id: 'a', label: 'Name', left: 'x', right: 'y' })).toBe('changed');
    expect(rowChange({ id: 'a', label: 'Name', right: 'y' })).toBe('added');
  });

  it('prefers an explicit change over the derived one', () => {
    expect(rowChange({ id: 'a', label: 'Name', left: 'x', right: 'x', change: 'changed' })).toBe('changed');
  });
});

describe(countDifferences.name, () => {
  it('counts the rows that differ', () => {
    const rows = [
      { id: 'a', label: 'A', left: '1', right: '2' },
      { id: 'b', label: 'B', left: '1', right: '1' },
      { id: 'c', label: 'C', left: '1' },
    ];

    expect(countDifferences(rows)).toBe(2);
  });
});

describe(numericDelta.name, () => {
  it('formats an increase with a plus sign and unit', () => {
    expect(numericDelta(145, 148, 1, '°C')).toEqual({ text: '+3.0 °C', direction: 'up' });
  });

  it('formats a decrease with a true minus sign', () => {
    expect(numericDelta(55, 53.5, 1)).toEqual({ text: '\u22121.5', direction: 'down' });
  });

  it('reports no change as flat', () => {
    expect(numericDelta(40, 40, 0, 'A')).toEqual({ text: '±0 A', direction: 'flat' });
  });

  it('treats a difference below the rounding as flat', () => {
    expect(numericDelta(40, 40.04, 1).direction).toBe('flat');
  });
});
