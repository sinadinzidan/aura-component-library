import { evaluateSheet } from './formula';
import { selectionStats } from './selectionStats';

const RESULTS = evaluateSheet([
  ['Tag', '10', ''],
  ['Other', '20', '=B1/0'],
  ['', '=B1+B2', '4.5'],
]);

describe('selectionStats', () => {
  it('sums and averages the numbers in a range', () => {
    const stats = selectionStats(RESULTS, { r1: 0, c1: 1, r2: 2, c2: 1 });
    expect(stats).toEqual({ count: 3, numericCount: 3, sum: 60, average: 20, min: 10, max: 30 });
  });

  it('counts text and errors as filled but not as numbers', () => {
    const stats = selectionStats(RESULTS, { r1: 0, c1: 0, r2: 2, c2: 2 });
    expect(stats.count).toBe(7);
    expect(stats.numericCount).toBe(4);
    expect(stats.sum).toBe(64.5);
  });

  it('has no average without numbers', () => {
    const stats = selectionStats(RESULTS, { r1: 0, c1: 0, r2: 1, c2: 0 });
    expect(stats).toEqual({ count: 2, numericCount: 0, sum: 0, average: null, min: null, max: null });
  });

  it('accepts corners in any order and ignores cells outside the sheet', () => {
    const stats = selectionStats(RESULTS, { r1: 9, c1: 1, r2: 0, c2: 1 });
    expect(stats.sum).toBe(60);
  });
});
