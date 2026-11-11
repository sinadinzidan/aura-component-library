import { applyIsolation, applyLeak, isolationValves, pressureAt, pressureMargin, pressureProfile, waveFronts } from './hydraulicGradient';
import type { HydraulicInput } from './hydraulicGradient';

const LINE: HydraulicInput = { totalKm: 80, inletPressure: 100, lossPerKm: 0.5, boosters: [{ kp: 40, boost: 15 }] };

describe(pressureAt.name, () => {
  it('starts at the inlet pressure', () => {
    expect(pressureAt(LINE, 0)).toBe(100);
  });

  it('loses friction pressure with distance', () => {
    expect(pressureAt(LINE, 20)).toBe(90);
  });

  it('gains the boost from the station onwards', () => {
    expect(pressureAt(LINE, 39.9)).toBeCloseTo(80.05, 9);
    expect(pressureAt(LINE, 40)).toBe(95);
    expect(pressureAt(LINE, 80)).toBe(75);
  });

  it('charges for the climb and refunds the descent', () => {
    const hill: HydraulicInput = { totalKm: 10, inletPressure: 50, lossPerKm: 0, elevation: (kp) => (kp <= 5 ? kp * 20 : (10 - kp) * 20), barPerMetre: 0.08 };

    expect(pressureAt(hill, 5)).toBeCloseTo(42, 9);
    expect(pressureAt(hill, 10)).toBeCloseTo(50, 9);
  });

  it('clamps the chainage to the line', () => {
    expect(pressureAt(LINE, -5)).toBe(100);
    expect(pressureAt(LINE, 500)).toBe(75);
  });
});

describe(pressureProfile.name, () => {
  it('covers the line from end to end in order', () => {
    const profile = pressureProfile(LINE, 10);

    expect(profile[0]).toEqual({ kp: 0, pressure: 100 });
    expect(profile[profile.length - 1]).toEqual({ kp: 80, pressure: 75 });
    for (let index = 1; index < profile.length; index += 1) expect(profile[index].kp).toBeGreaterThanOrEqual(profile[index - 1].kp);
  });

  it('draws the booster as a vertical step', () => {
    const profile = pressureProfile(LINE, 10);
    const before = profile.find((point) => point.kp > 39.9 && point.kp < 40);

    expect(before?.pressure).toBeCloseTo(80, 9);
    expect(profile.filter((point) => point.kp === 40).some((point) => point.pressure === 95)).toBe(true);
  });

  it('survives a zero step', () => {
    expect(pressureProfile({ totalKm: 0.05, inletPressure: 10, lossPerKm: 1 }, 0).length).toBeGreaterThan(2);
  });
});

describe(applyLeak.name, () => {
  const profile = pressureProfile({ totalKm: 80, inletPressure: 100, lossPerKm: 0 }, 5);
  const leak = { kp: 50, drop: 12, reachKm: 10 };

  it('drops the full amount at the leak', () => {
    expect(applyLeak(profile, leak).find((point) => point.kp === 50)?.pressure).toBe(88);
  });

  it('fades to nothing at the wave fronts', () => {
    const result = applyLeak(profile, leak);

    expect(result.find((point) => point.kp === 45)?.pressure).toBe(94);
    expect(result.find((point) => point.kp === 40)?.pressure).toBe(100);
    expect(result.find((point) => point.kp === 20)?.pressure).toBe(100);
  });

  it('does not change the input', () => {
    applyLeak(profile, leak);

    expect(profile.every((point) => point.pressure === 100)).toBe(true);
  });
});

describe(waveFronts.name, () => {
  it('sits one reach on each side of the leak', () => {
    expect(waveFronts({ kp: 50, drop: 5, reachKm: 6 }, 80)).toEqual([44, 56]);
  });

  it('stops at the ends of the line', () => {
    expect(waveFronts({ kp: 3, drop: 5, reachKm: 6 }, 80)).toEqual([0, 9]);
    expect(waveFronts({ kp: 78, drop: 5, reachKm: 6 }, 80)).toEqual([72, 80]);
  });
});

describe(applyIsolation.name, () => {
  it('settles the shut-in stretch and leaves the rest', () => {
    const result = applyIsolation(pressureProfile({ totalKm: 80, inletPressure: 100, lossPerKm: 0 }, 10), 60, 40, 31);

    expect(result.filter((point) => point.pressure === 31).map((point) => point.kp)).toEqual([40, 50, 60]);
    expect(result.find((point) => point.kp === 30)?.pressure).toBe(100);
    expect(result.find((point) => point.kp === 70)?.pressure).toBe(100);
  });
});

describe(isolationValves.name, () => {
  const valves = [
    { id: 'bv-1', kp: 12 },
    { id: 'bv-3', kp: 48 },
    { id: 'bv-2', kp: 36 },
    { id: 'bv-4', kp: 60 },
  ];

  it('finds the valves on each side of a leak', () => {
    const pair = isolationValves(valves, 53.4);

    expect(pair?.upstream.id).toBe('bv-3');
    expect(pair?.downstream.id).toBe('bv-4');
  });

  it('counts a valve at the leak as upstream', () => {
    expect(isolationValves(valves, 36)?.upstream.id).toBe('bv-2');
  });

  it('returns null when there is no valve on one side', () => {
    expect(isolationValves(valves, 5)).toBeNull();
    expect(isolationValves(valves, 70)).toBeNull();
  });
});

describe(pressureMargin.name, () => {
  it('reports the peak and the margin to the limit', () => {
    expect(pressureMargin(pressureProfile(LINE, 10), 110)).toEqual({ peak: 100, margin: 10 });
  });

  it('goes negative above the limit', () => {
    expect(pressureMargin([{ kp: 0, pressure: 120 }], 110).margin).toBe(-10);
  });
});
