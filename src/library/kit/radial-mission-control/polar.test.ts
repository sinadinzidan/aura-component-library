import { arcBand, arcLine, normalizeAngle, polarPoint, valueAngle } from './polar';

describe('polarPoint', () => {
  it('puts 0 degrees at twelve o clock', () => {
    expect(polarPoint(100, 100, 50, 0)).toEqual({ x: 100, y: 50 });
  });

  it('runs clockwise', () => {
    expect(polarPoint(100, 100, 50, 90)).toEqual({ x: 150, y: 100 });
    expect(polarPoint(100, 100, 50, 180)).toEqual({ x: 100, y: 150 });
  });
});

describe('arcLine', () => {
  it('draws a short arc with the small-arc flag', () => {
    expect(arcLine(100, 100, 50, 0, 90)).toBe('M 100 50 A 50 50 0 0 1 150 100');
  });

  it('uses the large-arc flag past half a turn', () => {
    expect(arcLine(100, 100, 50, 0, 270)).toContain('A 50 50 0 1 1');
  });

  it('keeps a full turn drawable', () => {
    const path = arcLine(100, 100, 50, 0, 360);
    expect(path.startsWith('M 100 50')).toBe(true);
    expect(path.endsWith('100 50')).toBe(false);
  });
});

describe('arcBand', () => {
  it('closes a ring segment between two radii', () => {
    const path = arcBand(100, 100, 50, 40, 0, 90);
    expect(path).toBe('M 100 50 A 50 50 0 0 1 150 100 L 140 100 A 40 40 0 0 0 100 60 Z');
  });

  it('draws a wedge from the centre when there is no inner radius', () => {
    expect(arcBand(100, 100, 50, 0, 0, 90)).toBe('M 100 100 L 100 50 A 50 50 0 0 1 150 100 Z');
  });
});

describe('valueAngle', () => {
  it('maps the range onto the dial', () => {
    expect(valueAngle(50, 0, 100, -120, 120)).toBe(0);
  });

  it('clamps values outside the range', () => {
    expect(valueAngle(140, 0, 100, -120, 120)).toBe(120);
    expect(valueAngle(-5, 0, 100, -120, 120)).toBe(-120);
  });
});

describe('normalizeAngle', () => {
  it('wraps negative and large angles', () => {
    expect(normalizeAngle(-90)).toBe(270);
    expect(normalizeAngle(450)).toBe(90);
  });
});
