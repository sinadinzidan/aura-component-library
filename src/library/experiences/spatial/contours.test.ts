import { contourPath, contourPaths, contourY } from './contours';

const FIELD = { width: 400, height: 200, count: 4, step: 100 };

describe('contourY', () => {
  it('rests on the row of the line when the amplitude is zero', () => {
    expect(contourY(0, 120, { ...FIELD, amplitude: 0 })).toBe(25);
    expect(contourY(3, 120, { ...FIELD, amplitude: 0 })).toBe(175);
  });

  it('stays within the displacement the amplitude allows', () => {
    const gap = FIELD.height / FIELD.count;
    for (let x = 0; x <= FIELD.width; x += 20) {
      expect(Math.abs(contourY(1, x, { ...FIELD, amplitude: 1 }) - 75)).toBeLessThanOrEqual(gap * 1.35 + 0.1);
    }
  });

  it('is deterministic', () => {
    expect(contourY(2, 310, FIELD)).toBe(contourY(2, 310, FIELD));
  });
});

describe('contourPath', () => {
  it('runs from the left edge to the right edge', () => {
    const path = contourPath(0, FIELD);

    expect(path.startsWith('M 0 ')).toBe(true);
    expect(path).toContain('L 400 ');
  });

  it('samples one point per step plus the end', () => {
    expect(contourPath(0, FIELD).match(/[ML]/g)).toHaveLength(5);
  });

  it('gives neighbouring lines different shapes', () => {
    const displacement = (index: number) => contourY(index, 200, FIELD) - (index + 0.5) * 50;

    expect(displacement(0)).not.toBeCloseTo(displacement(1), 1);
  });
});

describe('contourPaths', () => {
  it('returns one path per line', () => {
    expect(contourPaths(FIELD)).toHaveLength(4);
  });

  it('returns nothing for a field without lines', () => {
    expect(contourPaths({ ...FIELD, count: 0 })).toEqual([]);
  });
});
