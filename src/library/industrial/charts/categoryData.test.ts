import { categoryValues, isNumber, isPair } from './categoryData';
import type { CategoryRow, CategorySeries } from './categoryData';

const ROWS: readonly CategoryRow[] = [
  { category: '10 Mar', actual: 4.2, plan: 4.5 },
  { category: '11 Mar', actual: 4.6, plan: 4.5 },
];

const SERIES: readonly CategorySeries[] = [
  { key: 'actual', label: 'Gas export' },
  { key: 'plan', label: 'Plan', type: 'step', dashed: true },
];

describe(categoryValues.name, () => {
  it('collects plain values', () => {
    expect(categoryValues(ROWS, SERIES)).toEqual([4.2, 4.5, 4.6, 4.5]);
  });

  it('sums stacked bars per row, positives and negatives apart', () => {
    const values = categoryValues(
      [{ category: 'Day', a: 3, b: 4, c: -2 }],
      [
        { key: 'a', label: 'A', stack: 's' },
        { key: 'b', label: 'B', stack: 's' },
        { key: 'c', label: 'C', stack: 's' },
      ]
    );

    expect(values).toEqual([7, -2]);
  });

  it('includes both ends of floating bars and skips gaps and text', () => {
    const values = categoryValues([{ category: 'Loss', span: [60, 85], other: null }], [
      { key: 'span', label: 'Span' },
      { key: 'other', label: 'Other' },
      { key: 'category', label: 'Name' },
    ]);

    expect(values).toEqual([60, 85]);
  });
});

describe('guards', () => {
  it('accepts finite numbers only', () => {
    expect(isNumber(4.2)).toBe(true);
    expect(isNumber(Number.NaN)).toBe(false);
    expect(isNumber('4.2')).toBe(false);
  });

  it('accepts a pair of numbers only', () => {
    expect(isPair([60, 85])).toBe(true);
    expect(isPair([60])).toBe(false);
    expect(isPair([60, '85'])).toBe(false);
    expect(isPair(60)).toBe(false);
  });
});
