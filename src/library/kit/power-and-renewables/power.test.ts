import { batteryRuntime, capacityFactor, compassPoint, formatHours, frequencyState, isUnderperforming, warrantedPower, wedgePath } from './power';

const CURVE = [
  { windSpeed: 3, power: 0 },
  { windSpeed: 12, power: 4.2 },
  { windSpeed: 20, power: 4.2 },
];

describe('power', () => {
  it('computes a capacity factor and refuses an empty period', () => {
    expect(capacityFactor(504, 42, 24)).toBe(50);
    expect(capacityFactor(10, 0, 24)).toBeNull();
  });

  it('interpolates the warranted curve and is zero outside it', () => {
    expect(warrantedPower(7.5, CURVE)).toBeCloseTo(2.1);
    expect(warrantedPower(16, CURVE)).toBe(4.2);
    expect(warrantedPower(2, CURVE)).toBe(0);
    expect(warrantedPower(25, CURVE)).toBe(0);
  });

  it('flags a point well under the curve', () => {
    expect(isUnderperforming({ windSpeed: 12, power: 3 }, CURVE)).toBe(true);
    expect(isUnderperforming({ windSpeed: 12, power: 4 }, CURVE)).toBe(false);
    expect(isUnderperforming({ windSpeed: 2, power: 0 }, CURVE)).toBe(false);
  });

  it('says how long a battery can go on', () => {
    expect(batteryRuntime(68, 20, -5, { reservePercent: 20 })).toEqual({ mode: 'discharging', hours: 1.92 });
    expect(batteryRuntime(50, 20, 4).hours).toBe(2.5);
    expect(batteryRuntime(50, 20, 0.01)).toEqual({ mode: 'idle', hours: null });
  });

  it('formats hours', () => {
    expect(formatHours(2.6667)).toBe('2 h 40 min');
    expect(formatHours(0.75)).toBe('45 min');
    expect(formatHours(3)).toBe('3 h');
  });

  it('judges a frequency against its bands', () => {
    expect(frequencyState(49.97, 50, 0.1, 0.2).word).toBe('Normal');
    expect(frequencyState(50.14, 50, 0.1, 0.2).tone).toBe('warning');
    expect(frequencyState(49.7, 50, 0.1, 0.2).tone).toBe('critical');
  });

  it('puts north at the top of the compass', () => {
    const [x, y] = compassPoint(50, 50, 40, 0);
    expect(x).toBeCloseTo(50);
    expect(y).toBeCloseTo(10);
    expect(compassPoint(50, 50, 40, 90)[0]).toBeCloseTo(90);
  });

  it('draws a wedge from the centre', () => {
    expect(wedgePath(50, 50, 40, 0, 40)).toMatch(/^M 50 50 L /);
  });
});
