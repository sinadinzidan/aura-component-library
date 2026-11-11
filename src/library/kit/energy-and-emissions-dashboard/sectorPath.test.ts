import { sectorPath } from './sectorPath';

describe(sectorPath.name, () => {
  it('draws a closed sector from the outer arc back along the inner arc', () => {
    const path = sectorPath(0, 90, 50, 80);

    expect(path.startsWith('M 100.00 20.00 A 80 80 0 0 1 180.00 100.00')).toBe(true);
    expect(path.endsWith('A 50 50 0 0 0 100.00 50.00 Z')).toBe(true);
  });

  it('uses the large arc for more than half a turn', () => {
    expect(sectorPath(0, 270, 50, 80)).toContain('A 80 80 0 1 1');
  });
});
