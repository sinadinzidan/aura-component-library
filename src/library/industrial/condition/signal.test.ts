import { bearingFrequencies, crestFactor, createSeededRandom, kurtosis, machineComponents, mean, peak, rms, synthesizeSignal } from './signal';

describe('createSeededRandom', () => {
  it('repeats for the same seed', () => {
    const a = createSeededRandom(7);
    const b = createSeededRandom(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('stays within [0, 1)', () => {
    const random = createSeededRandom(3);
    for (let index = 0; index < 200; index += 1) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('synthesizeSignal', () => {
  it('returns the requested number of samples', () => {
    expect(synthesizeSignal({ components: [], sampleRateHz: 100, samples: 25 })).toHaveLength(25);
  });

  it('samples a sine at the right values', () => {
    const samples = synthesizeSignal({ components: [{ frequencyHz: 10, amplitude: 2 }], sampleRateHz: 40, samples: 4 });
    expect(samples[0]).toBeCloseTo(0);
    expect(samples[1]).toBeCloseTo(2);
    expect(samples[3]).toBeCloseTo(-2);
  });

  it('is deterministic with noise', () => {
    const options = { components: [], noise: 0.5, seed: 9, sampleRateHz: 100, samples: 10 };
    expect(synthesizeSignal(options)).toEqual(synthesizeSignal(options));
  });

  it('keeps noise within its peak size', () => {
    const samples = synthesizeSignal({ components: [], noise: 0.5, sampleRateHz: 100, samples: 200 });
    expect(peak(samples)).toBeLessThanOrEqual(0.5);
  });

  it('adds ringing impacts that repeat at the impulse rate', () => {
    const samples = synthesizeSignal({ components: [], impulses: [{ rateHz: 10, amplitude: 1, ringHz: 200, decay: 400 }], sampleRateHz: 1000, samples: 300 });
    expect(Math.abs(samples[2])).toBeGreaterThan(0.1);
    expect(Math.abs(samples[102])).toBeCloseTo(Math.abs(samples[2]), 6);
  });

  it('ignores impulse trains with no rate', () => {
    expect(peak(synthesizeSignal({ components: [], impulses: [{ rateHz: 0, amplitude: 1, ringHz: 100, decay: 1 }], sampleRateHz: 100, samples: 20 }))).toBe(0);
  });

  it('returns nothing for zero samples', () => {
    expect(synthesizeSignal({ components: [], sampleRateHz: 100, samples: 0 })).toEqual([]);
  });
});

describe('statistics', () => {
  const sine = synthesizeSignal({ components: [{ frequencyHz: 5, amplitude: 1 }], sampleRateHz: 1000, samples: 1000 });

  it('computes mean, rms and peak', () => {
    expect(mean([1, 2, 3])).toBe(2);
    expect(rms(sine)).toBeCloseTo(Math.SQRT1_2, 3);
    expect(peak([-3, 2])).toBe(3);
  });

  it('gives a sine a crest factor of √2 and kurtosis of 1.5', () => {
    expect(crestFactor(sine)).toBeCloseTo(Math.SQRT2, 2);
    expect(kurtosis(sine)).toBeCloseTo(1.5, 1);
  });

  it('raises kurtosis and crest factor for impacts', () => {
    const impacts = synthesizeSignal({ components: [], impulses: [{ rateHz: 7, amplitude: 1, ringHz: 300, decay: 500 }], sampleRateHz: 2000, samples: 2000 });
    expect(kurtosis(impacts)).toBeGreaterThan(3);
    expect(crestFactor(impacts)).toBeGreaterThan(crestFactor(sine));
  });

  it('handles empty and flat signals', () => {
    expect(mean([])).toBe(0);
    expect(rms([])).toBe(0);
    expect(crestFactor([0, 0])).toBe(0);
    expect(kurtosis([])).toBe(0);
    expect(kurtosis([2, 2, 2])).toBe(0);
  });
});

describe('bearingFrequencies', () => {
  const geometry = { rollingElements: 9, ballDiameter: 8, pitchDiameter: 40 };

  it('computes defect frequencies from geometry', () => {
    const result = bearingFrequencies(geometry, 100);
    expect(result.bpfo).toBeCloseTo(360);
    expect(result.bpfi).toBeCloseTo(540);
    expect(result.ftf).toBeCloseTo(40);
    expect(result.bsf).toBeCloseTo(240);
  });

  it('takes the contact angle into account', () => {
    expect(bearingFrequencies({ ...geometry, contactAngleDeg: 40 }, 100).bpfo).toBeGreaterThan(bearingFrequencies(geometry, 100).bpfo);
  });

  it('keeps BPFO + BPFI equal to the element count times speed', () => {
    const result = bearingFrequencies(geometry, 50);
    expect(result.bpfo + result.bpfi).toBeCloseTo(9 * 50);
  });
});

describe('machineComponents', () => {
  it('returns nothing for a healthy machine', () => {
    expect(machineComponents({ runningHz: 50 })).toEqual([]);
  });

  it('puts unbalance at 1× and misalignment at 2× and 3×', () => {
    expect(machineComponents({ runningHz: 50, unbalance: 2 }).map((component) => component.frequencyHz)).toEqual([50]);
    expect(machineComponents({ runningHz: 50, misalignment: 2 }).map((component) => component.frequencyHz)).toEqual([100, 150]);
  });

  it('builds a comb of harmonics and half orders for looseness', () => {
    const frequencies = machineComponents({ runningHz: 10, looseness: 1 }).map((component) => component.frequencyHz);
    expect(frequencies).toContain(80);
    expect(frequencies).toContain(5);
  });

  it('adds vane pass and bearing tones with a second harmonic', () => {
    const frequencies = machineComponents({ runningHz: 10, vanePass: { vanes: 5, amplitude: 1 }, bearingTones: [{ frequencyHz: 36, amplitude: 1 }] }).map((component) => component.frequencyHz);
    expect(frequencies).toEqual([50, 36, 72]);
  });
});
