import { amplitudeSpectrum, dft, hannWindow, noiseBandwidth } from './dft';
import { synthesizeSignal } from './signal';

describe('dft', () => {
  it('finds a single bin for a sine on a bin', () => {
    const samples = synthesizeSignal({ components: [{ frequencyHz: 8, amplitude: 1 }], sampleRateHz: 64, samples: 64 });
    const result = dft(samples);
    expect(Math.hypot(result[8].re, result[8].im)).toBeCloseTo(32, 6);
    expect(Math.hypot(result[3].re, result[3].im)).toBeCloseTo(0, 6);
  });

  it('limits the number of bins', () => {
    expect(dft([1, 2, 3, 4], 2)).toHaveLength(2);
    expect(dft([1, 2, 3, 4], 99)).toHaveLength(4);
    expect(dft([])).toEqual([]);
  });

  it('puts a constant entirely in bin 0', () => {
    const result = dft([2, 2, 2, 2]);
    expect(result[0].re).toBeCloseTo(8);
    expect(Math.hypot(result[1].re, result[1].im)).toBeCloseTo(0);
  });
});

describe('hannWindow', () => {
  it('starts at zero and peaks in the middle', () => {
    const window = hannWindow(8);
    expect(window[0]).toBeCloseTo(0);
    expect(window[4]).toBeCloseTo(1);
  });

  it('handles tiny sizes', () => {
    expect(hannWindow(1)).toEqual([1]);
    expect(hannWindow(0)).toEqual([]);
  });
});

describe('amplitudeSpectrum', () => {
  const sampleRateHz = 256;
  const samples = synthesizeSignal({ components: [{ frequencyHz: 32, amplitude: 2 }, { frequencyHz: 64, amplitude: 1 }], sampleRateHz, samples: 256 });

  it('reports peak amplitude on the right lines', () => {
    const spectrum = amplitudeSpectrum(samples, sampleRateHz, { window: 'rectangular', scale: 'peak' });
    expect(spectrum[32].frequencyHz).toBe(32);
    expect(spectrum[32].amplitude).toBeCloseTo(2, 6);
    expect(spectrum[64].amplitude).toBeCloseTo(1, 6);
  });

  it('reports RMS by default', () => {
    const spectrum = amplitudeSpectrum(samples, sampleRateHz, { window: 'rectangular' });
    expect(spectrum[32].amplitude).toBeCloseTo(2 / Math.SQRT2, 6);
  });

  it('corrects the Hann window gain', () => {
    const spectrum = amplitudeSpectrum(samples, sampleRateHz, { scale: 'peak' });
    expect(spectrum[32].amplitude).toBeCloseTo(2, 2);
  });

  it('covers 0 Hz up to below Nyquist', () => {
    const spectrum = amplitudeSpectrum(samples, sampleRateHz);
    expect(spectrum).toHaveLength(128);
    expect(spectrum[0].frequencyHz).toBe(0);
  });

  it('returns nothing for no samples', () => {
    expect(amplitudeSpectrum([], 100)).toEqual([]);
  });

  it('exposes the noise bandwidth of each window', () => {
    expect(noiseBandwidth()).toBe(1.5);
    expect(noiseBandwidth('rectangular')).toBe(1);
  });
});
