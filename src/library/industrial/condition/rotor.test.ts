import { centrelinePosition, orbitPoints, orbitRadius, peakResponse, polarPoint, rotorResponse, runUp } from './rotor';

const model = { criticalRpm: 3000, dampingRatio: 0.1, eccentricity: 10 };

describe('rotorResponse', () => {
  it('is quiet at standstill and settles at the eccentricity far above critical', () => {
    expect(rotorResponse(0, model).amplitude).toBe(0);
    expect(rotorResponse(30000, model).amplitude).toBeCloseTo(10, 0);
  });

  it('peaks at the critical speed with 90° of phase lag', () => {
    const at = rotorResponse(3000, model);
    expect(at.amplitude).toBeCloseTo(10 / (2 * 0.1), 6);
    expect(at.phaseLagDeg).toBeCloseTo(90, 6);
  });

  it('approaches 180° of lag above the critical', () => {
    expect(rotorResponse(9000, model).phaseLagDeg).toBeGreaterThan(160);
  });

  it('copes with a zero critical speed', () => {
    expect(rotorResponse(100, { ...model, criticalRpm: 0 }).phaseLagDeg).toBe(0);
  });
});

describe('runUp', () => {
  it('spans the speed range in even steps', () => {
    const points = runUp(model, 0, 6000, 7);
    expect(points).toHaveLength(7);
    expect(points[0].speedRpm).toBe(0);
    expect(points[6].speedRpm).toBe(6000);
    expect(points[1].speedRpm).toBe(1000);
  });

  it('puts the peak near the critical speed', () => {
    expect(peakResponse(runUp(model, 0, 6000, 61))?.speedRpm).toBe(3000);
    expect(peakResponse([])).toBeNull();
  });
});

describe('polarPoint', () => {
  it('turns amplitude and phase into x and y', () => {
    expect(polarPoint(2, 0)).toEqual({ x: 2, y: 0 });
    const quarter = polarPoint(2, 90);
    expect(quarter.x).toBeCloseTo(0);
    expect(quarter.y).toBeCloseTo(2);
  });
});

describe('orbitPoints', () => {
  it('closes a one-revolution circular orbit', () => {
    const points = orbitPoints({ xAmplitude: 5, yAmplitude: 5 });
    expect(points).toHaveLength(65);
    expect(points[0].x).toBeCloseTo(5);
    expect(points[64].x).toBeCloseTo(points[0].x);
    expect(orbitRadius(points)).toBeCloseTo(5, 1);
  });

  it('flattens to a line when X and Y are in phase', () => {
    const points = orbitPoints({ xAmplitude: 4, yAmplitude: 4, phaseDeg: 0 });
    expect(points.every((point) => Math.abs(point.x - point.y) < 1e-9)).toBe(true);
  });

  it('traces several revolutions and adds harmonic content', () => {
    expect(orbitPoints({ xAmplitude: 1, yAmplitude: 1, revolutions: 2, samplesPerRev: 16 })).toHaveLength(33);
    expect(orbitRadius(orbitPoints({ xAmplitude: 5, yAmplitude: 5, secondOrder: 0.5 }))).toBeGreaterThan(5);
    expect(orbitRadius(orbitPoints({ xAmplitude: 5, yAmplitude: 5, halfOrder: 0.4 }))).toBeGreaterThan(5);
  });

  it('measures an empty orbit as zero', () => {
    expect(orbitRadius([])).toBe(0);
  });
});

describe('centrelinePosition', () => {
  const options = { clearance: 100 };

  it('rests at the bottom at standstill', () => {
    const start = centrelinePosition(0, options);
    expect(start.x).toBeCloseTo(0);
    expect(start.y).toBeCloseTo(-100);
  });

  it('climbs towards the running eccentricity', () => {
    const end = centrelinePosition(1, options);
    expect(Math.hypot(end.x, end.y)).toBeCloseTo(45, 4);
    expect(end.x).toBeGreaterThan(0);
  });

  it('clamps the speed fraction', () => {
    expect(centrelinePosition(5, options)).toEqual(centrelinePosition(1, options));
    expect(centrelinePosition(-1, options)).toEqual(centrelinePosition(0, options));
  });
});
