/**
 * A plain discrete Fourier transform for small blocks (a few hundred to a thousand samples).
 * O(N²), dependency-free and exact enough to turn a synthetic waveform into the spectrum an
 * analyst would read. For long records use a real FFT.
 */

export type Complex = { re: number; im: number };

/** One line of a single-sided amplitude spectrum. */
export type SpectrumLine = { frequencyHz: number; amplitude: number };

/** The first `bins` DFT coefficients of a real signal (all N by default). */
export function dft(samples: readonly number[], bins: number = samples.length): Complex[] {
  const size = samples.length;
  const count = Math.max(0, Math.min(Math.floor(bins), size));
  const result: Complex[] = [];
  for (let bin = 0; bin < count; bin += 1) {
    let re = 0;
    let im = 0;
    for (let index = 0; index < size; index += 1) {
      // Reduce the angle with integer arithmetic first, so large indices lose no precision.
      const angle = (2 * Math.PI * ((bin * index) % size)) / size;
      re += samples[index] * Math.cos(angle);
      im -= samples[index] * Math.sin(angle);
    }
    result.push({ re, im });
  }
  return result;
}

/** Hann window coefficients. Tapers the block ends so a tone between two lines leaks less. */
export function hannWindow(size: number): number[] {
  if (size <= 1) return Array.from({ length: Math.max(0, size) }, () => 1);
  return Array.from({ length: size }, (_, index) => 0.5 - 0.5 * Math.cos((2 * Math.PI * index) / size));
}

export type SpectrumOptions = {
  /** `hann` (default) for real signals; `rectangular` when every tone sits exactly on a line. */
  window?: 'hann' | 'rectangular';
  /** `rms` (default) reports each line as an RMS level; `peak` as the sine's peak value. */
  scale?: 'rms' | 'peak';
};

/**
 * Single-sided amplitude spectrum from 0 Hz up to (not including) half the sample rate. Line
 * amplitudes are corrected for the window, so a sine of peak 1 on a line reads 1 (peak) or
 * 0.707 (RMS).
 */
export function amplitudeSpectrum(samples: readonly number[], sampleRateHz: number, options: SpectrumOptions = {}): SpectrumLine[] {
  const { window = 'hann', scale = 'rms' } = options;
  const size = samples.length;
  if (size === 0) return [];
  const weights = window === 'hann' ? hannWindow(size) : null;
  const windowed = weights ? samples.map((sample, index) => sample * weights[index]) : samples;
  const coherentGain = weights ? weights.reduce((sum, weight) => sum + weight, 0) / size : 1;
  const half = Math.floor(size / 2);
  return dft(windowed, half).map((coefficient, bin) => {
    const magnitude = Math.hypot(coefficient.re, coefficient.im) / size / coherentGain;
    const peakValue = bin === 0 ? magnitude : 2 * magnitude;
    return { frequencyHz: (bin * sampleRateHz) / size, amplitude: scale === 'rms' && bin !== 0 ? peakValue / Math.SQRT2 : peakValue };
  });
}

/** Noise bandwidth of the window in lines: divide summed line power by it to get true power. */
export function noiseBandwidth(window: 'hann' | 'rectangular' = 'hann'): number {
  return window === 'hann' ? 1.5 : 1;
}
