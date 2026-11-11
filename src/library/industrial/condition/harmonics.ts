import type { SpectrumLine } from './dft';
import { noiseBandwidth } from './dft';

/** A marker on a spectrum at a multiple of some fundamental. */
export type HarmonicCursor = { order: number; frequencyHz: number; label: string };

export type HarmonicFamilyOptions = {
  /** How many harmonics at most. */
  count?: number;
  /** Stop at this frequency. */
  maxHz?: number;
  /** Suffix of each label: "×" gives 1×, 2×, 3×. A name such as "BPFO" gives BPFO, 2 BPFO. */
  name?: string;
};

/** Harmonic cursors at 1, 2, 3 … times a fundamental. */
export function harmonicFamily(fundamentalHz: number, options: HarmonicFamilyOptions = {}): HarmonicCursor[] {
  const { count = 3, maxHz = Infinity, name } = options;
  if (!(fundamentalHz > 0)) return [];
  const cursors: HarmonicCursor[] = [];
  for (let order = 1; order <= count && order * fundamentalHz <= maxHz; order += 1) {
    const label = name === undefined ? `${order}×` : order === 1 ? name : `${order} ${name}`;
    cursors.push({ order, frequencyHz: order * fundamentalHz, label });
  }
  return cursors;
}

/** A frequency as a multiple of running speed. */
export function toOrders(frequencyHz: number, runningHz: number): number {
  return runningHz > 0 ? frequencyHz / runningHz : 0;
}

/** Index of the spectral line closest to a frequency; −1 for an empty spectrum. */
export function lineIndexAt(spectrum: readonly SpectrumLine[], frequencyHz: number): number {
  let best = -1;
  let distance = Infinity;
  spectrum.forEach((line, index) => {
    const gap = Math.abs(line.frequencyHz - frequencyHz);
    if (gap < distance) {
      distance = gap;
      best = index;
    }
  });
  return best;
}

/** The highest line within `toleranceHz` of a frequency, or `null` when there is none. */
export function peakNear(spectrum: readonly SpectrumLine[], frequencyHz: number, toleranceHz: number): SpectrumLine | null {
  let best: SpectrumLine | null = null;
  for (const line of spectrum) {
    if (Math.abs(line.frequencyHz - frequencyHz) > toleranceHz) continue;
    if (!best || line.amplitude > best.amplitude) best = line;
  }
  return best;
}

export type PeakOptions = {
  /** Ignore peaks below this amplitude. */
  threshold?: number;
  /** Keep only the highest n. */
  limit?: number;
};

/** Indices of local maxima, highest first. The 0 Hz line is never a peak. */
export function findPeakIndices(spectrum: readonly SpectrumLine[], options: PeakOptions = {}): number[] {
  const { threshold = 0, limit = Infinity } = options;
  const indices: number[] = [];
  for (let index = 1; index < spectrum.length; index += 1) {
    const here = spectrum[index].amplitude;
    const before = spectrum[index - 1].amplitude;
    const after = index + 1 < spectrum.length ? spectrum[index + 1].amplitude : -Infinity;
    if (here >= threshold && here > before && here >= after) indices.push(index);
  }
  return indices.sort((a, b) => spectrum[b].amplitude - spectrum[a].amplitude).slice(0, limit);
}

/** The peaks themselves, highest first. */
export function findPeaks(spectrum: readonly SpectrumLine[], options: PeakOptions = {}): SpectrumLine[] {
  return findPeakIndices(spectrum, options).map((index) => spectrum[index]);
}

/** Overall level between two frequencies: the root of the summed line power, corrected for the window. */
export function bandLevel(spectrum: readonly SpectrumLine[], fromHz: number, toHz: number, window: 'hann' | 'rectangular' = 'hann'): number {
  let power = 0;
  for (const line of spectrum) {
    if (line.frequencyHz >= fromHz && line.frequencyHz < toHz) power += line.amplitude ** 2;
  }
  return Math.sqrt(power / noiseBandwidth(window));
}

export type FrequencyBand = { id: string; label: string; fromHz: number; toHz: number; alarm?: number };
export type BandLevel = FrequencyBand & { level: number; exceeded: boolean };

/** The level in each band, and whether it is above the band's alarm. */
export function bandLevels(spectrum: readonly SpectrumLine[], bands: readonly FrequencyBand[], window: 'hann' | 'rectangular' = 'hann'): BandLevel[] {
  return bands.map((band) => {
    const level = bandLevel(spectrum, band.fromHz, band.toHz, window);
    return { ...band, level, exceeded: band.alarm !== undefined && level > band.alarm };
  });
}

/** One step of an alarm envelope: the highest any line may be between two frequencies. */
export type MaskSegment = { fromHz: number; toHz: number; limit: number };

/** The mask limit at a frequency; `null` outside every segment. */
export function maskLimitAt(mask: readonly MaskSegment[], frequencyHz: number): number | null {
  const segment = mask.find((candidate) => frequencyHz >= candidate.fromHz && frequencyHz < candidate.toHz);
  return segment ? segment.limit : null;
}

/** Lines that break through the mask. */
export function maskExceedances(spectrum: readonly SpectrumLine[], mask: readonly MaskSegment[]): SpectrumLine[] {
  return spectrum.filter((line) => {
    const limit = maskLimitAt(mask, line.frequencyHz);
    return limit !== null && line.amplitude > limit;
  });
}

const STANDARD_GRAVITY = 9.80665;

/** Acceleration in g of a line with the given velocity in mm/s: a = 2πf·v. */
export function velocityToAcceleration(velocityMmPerS: number, frequencyHz: number): number {
  return (2 * Math.PI * frequencyHz * velocityMmPerS) / 1000 / STANDARD_GRAVITY;
}

/** A velocity spectrum (mm/s) as an acceleration spectrum (g). High frequencies gain weight. */
export function toAccelerationSpectrum(spectrum: readonly SpectrumLine[]): SpectrumLine[] {
  return spectrum.map((line) => ({ frequencyHz: line.frequencyHz, amplitude: velocityToAcceleration(line.amplitude, line.frequencyHz) }));
}
