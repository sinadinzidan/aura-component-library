import { annotationNumbers, type YearPoint } from './annotations';

const POINTS: YearPoint[] = [
  { id: 'jan', label: 'Jan', name: 'January 2026', value: 4.53, group: '2026' },
  { id: 'feb', label: 'Feb', name: 'February 2026', value: 4.36, annotated: true },
  { id: 'mar', label: 'Mar', name: 'March 2026', value: 4.34, annotated: true },
];

describe(annotationNumbers.name, () => {
  it('numbers the annotated points in order and skips the others', () => {
    expect([...annotationNumbers(POINTS)]).toEqual([
      ['feb', 1],
      ['mar', 2],
    ]);
  });
});
