import { batteryRuntime, capacityFactor, formatHours, frequencyTone, turbineStatus, warrantedPower } from './power';

const CURVE = [
  { windSpeed: 3, power: 0 },
  { windSpeed: 8, power: 2000 },
  { windSpeed: 12, power: 4200 },
  { windSpeed: 25, power: 4200 },
];

describe(turbineStatus.name, () => {
  it.each([
    ['generating', 'Generating', 'success'],
    ['idle', 'Idle, low wind', 'neutral'],
    ['curtailed', 'Curtailed', 'info'],
    ['stopped', 'Stopped', 'neutral'],
    ['fault', 'Fault', 'critical'],
    ['maintenance', 'Maintenance', 'warning'],
  ] as const)('describes %s', (state, label, tone) => {
    expect(turbineStatus(state)).toMatchObject({ label, tone });
  });
});

describe(capacityFactor.name, () => {
  it('is energy over rated energy in percent', () => {
    expect(capacityFactor(504, 50.4, 24)).toBeCloseTo(41.67, 2);
  });

  it('is null without a rating or a period', () => {
    expect(capacityFactor(500, 0, 24)).toBeNull();
    expect(capacityFactor(500, 50, 0)).toBeNull();
  });
});

describe(warrantedPower.name, () => {
  it('returns the curve value at a curve point', () => {
    expect(warrantedPower(8, CURVE)).toBe(2000);
  });

  it('interpolates between points', () => {
    expect(warrantedPower(10, CURVE)).toBe(3100);
  });

  it('holds rated power on the flat part', () => {
    expect(warrantedPower(18, CURVE)).toBe(4200);
  });

  it('is zero below cut-in and above cut-out', () => {
    expect(warrantedPower(2, CURVE)).toBe(0);
    expect(warrantedPower(26, CURVE)).toBe(0);
  });

  it('is zero for an empty curve', () => {
    expect(warrantedPower(10, [])).toBe(0);
  });
});

describe(batteryRuntime.name, () => {
  it('reports time to full while charging', () => {
    expect(batteryRuntime(60, 40, 8)).toEqual({ mode: 'charging', hours: 2 });
  });

  it('reports time to the reserve while discharging', () => {
    expect(batteryRuntime(60, 40, -10, { reservePercent: 10 })).toEqual({ mode: 'discharging', hours: 2 });
  });

  it('charges only up to the full mark', () => {
    expect(batteryRuntime(60, 40, 8, { fullPercent: 90 }).hours).toBeCloseTo(1.5, 6);
  });

  it('is idle inside the deadband', () => {
    expect(batteryRuntime(60, 40, 0.02)).toEqual({ mode: 'idle', hours: null });
  });

  it('has no time left below the reserve', () => {
    expect(batteryRuntime(8, 40, -10, { reservePercent: 10 }).hours).toBe(0);
  });
});

describe(formatHours.name, () => {
  it.each([
    [2.6667, '2 h 40 min'],
    [0.75, '45 min'],
    [3, '3 h'],
    [0, '0 min'],
    [-1, '0 min'],
  ])('formats %s hours as %s', (hours, text) => {
    expect(formatHours(hours)).toBe(text);
  });
});

describe(frequencyTone.name, () => {
  it('is neutral inside the normal band', () => {
    expect(frequencyTone(50.04, 50, 0.1, 0.2)).toBe('neutral');
  });

  it('warns outside the normal band', () => {
    expect(frequencyTone(49.86, 50, 0.1, 0.2)).toBe('warning');
  });

  it('is critical outside the alert band', () => {
    expect(frequencyTone(50.31, 50, 0.1, 0.2)).toBe('critical');
  });
});
