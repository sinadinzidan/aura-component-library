import { areaPoints, makePlotScale, niceCeiling, polylinePoints, ticksIn, toPercent } from './plotScale';

describe('toPercent', () => {
  it('maps a domain to 0–100', () => {
    expect(toPercent(5, [0, 10])).toBe(50);
    expect(toPercent(-10, [-10, 10])).toBe(0);
  });

  it('maps a zero-width domain to 0', () => {
    expect(toPercent(3, [3, 3])).toBe(0);
  });
});

describe('makePlotScale', () => {
  it('inverts y so the top of the plot is 0', () => {
    const scale = makePlotScale([0, 100], [0, 10]);
    expect(scale.x(25)).toBe(25);
    expect(scale.y(10)).toBe(0);
    expect(scale.y(0)).toBe(100);
  });
});

describe('polyline and area', () => {
  const scale = makePlotScale([0, 10], [0, 10]);

  it('builds a points attribute', () => {
    expect(polylinePoints([0, 5, 10], [0, 5, 10], scale)).toBe('0,100 50,50 100,0');
  });

  it('uses the shorter of the two arrays', () => {
    expect(polylinePoints([0, 5, 10], [0], scale)).toBe('0,100');
  });

  it('closes an area down to the baseline', () => {
    expect(areaPoints([0, 10], [5, 5], scale, 0)).toBe('0,100 0,50 100,50 100,100');
    expect(areaPoints([], [], scale, 0)).toBe('');
  });
});

describe('ticksIn and niceCeiling', () => {
  it('keeps ticks inside the domain', () => {
    const ticks = ticksIn([0, 1000]);
    expect(ticks[0]).toBe(0);
    expect(Math.max(...ticks)).toBeLessThanOrEqual(1000);
  });

  it('rounds a maximum up to a tidy value with headroom', () => {
    expect(niceCeiling(6.5)).toBe(8);
    expect(niceCeiling(0.42)).toBe(0.5);
    expect(niceCeiling(100)).toBe(150);
  });

  it('falls back for non-positive values', () => {
    expect(niceCeiling(0)).toBe(1);
  });
});
