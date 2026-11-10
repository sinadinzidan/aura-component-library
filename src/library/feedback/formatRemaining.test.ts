import { formatRemaining } from './formatRemaining';

describe(formatRemaining.name, () => {
  it.each([
    [Number.NaN, 'Estimating time left…'],
    [-5, 'Estimating time left…'],
    [0, 'Done'],
    [42, 'Less than a minute left'],
    [240, 'About 4 min left'],
    [7200, 'About 2 h left'],
    [5400, 'About 1 h 30 min left'],
  ])('formats %s seconds as "%s"', (seconds, expected) => {
    expect(formatRemaining(seconds)).toBe(expected);
  });
});
