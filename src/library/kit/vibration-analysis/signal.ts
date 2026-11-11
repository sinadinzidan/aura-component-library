/**
 * Deterministic vibration maths for the catalogue: a machine's fault components, the spectrum and
 * waveform they produce, peak naming and ISO 10816-3 severity zones. No randomness beyond a seed.
 */
import type { Tone } from '../tones';

export type SpectrumLine = { hz: number; amplitude: number };

/** One sinusoidal component of the signal: where it is and how strong (mm/s RMS). */
export type VibrationComponent = { hz: number; amplitude: number };

export type MachineCondition = {
  /** Amplitude at 1× running speed. */
  unbalance: number;
  /** Amplitude at 2×, with a smaller 3×. */
  misalignment?: number;
  /** Raises a comb of harmonics from 3× to 7× and a half-order line. */
  looseness?: number;
  /** Blade or vane pass: `vanes` × running speed. */
  vanePass?: { vanes: number; amplitude: number };
  /** An outer-race defect: its frequency and two harmonics. */
  bearing?: { hz: number; amplitude: number };
};

/** A small seeded generator, so every spectrum is the same on every render. */
export function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

/** Turns a machine condition into the lines it puts in the spectrum. */
export function machineComponents(runningHz: number, condition: MachineCondition): VibrationComponent[] {
  const { unbalance, misalignment = 0, looseness = 0, vanePass, bearing } = condition;
  const components: VibrationComponent[] = [
    { hz: runningHz, amplitude: unbalance },
    { hz: runningHz * 2, amplitude: 0.18 * unbalance + misalignment },
    { hz: runningHz * 3, amplitude: 0.08 * unbalance + 0.4 * misalignment + 0.5 * looseness },
  ];
  if (looseness > 0) {
    components.push({ hz: runningHz * 0.5, amplitude: 0.35 * looseness });
    for (const order of [4, 5, 6, 7]) components.push({ hz: runningHz * order, amplitude: (looseness * 1.6) / order });
  }
  if (vanePass) components.push({ hz: runningHz * vanePass.vanes, amplitude: vanePass.amplitude });
  if (bearing) {
    components.push({ hz: bearing.hz, amplitude: bearing.amplitude });
    components.push({ hz: bearing.hz * 2, amplitude: bearing.amplitude * 0.55 });
    components.push({ hz: bearing.hz * 3, amplitude: bearing.amplitude * 0.3 });
  }
  return components.filter((component) => component.amplitude > 0);
}

type SpectrumOptions = { maxHz: number; lines?: number; floor?: number; seed?: number };

/** The amplitude spectrum of a set of components: narrow peaks on a noise floor. */
export function synthSpectrum(components: readonly VibrationComponent[], { maxHz, lines = 320, floor = 0.04, seed = 1 }: SpectrumOptions): SpectrumLine[] {
  const random = seeded(seed);
  const step = maxHz / lines;
  return Array.from({ length: lines }, (_, index) => {
    const hz = (index + 0.5) * step;
    const noise = floor * (0.35 + random() * 0.9);
    const peaks = components.reduce((sum, component) => sum + component.amplitude * Math.exp(-(((hz - component.hz) / (step * 0.85)) ** 2)), 0);
    return { hz, amplitude: Number((noise + peaks).toFixed(4)) };
  });
}

type WaveformOptions = { samples?: number; seconds: number; noise?: number; seed?: number; impacts?: { hz: number; amplitude: number } };

/** The time waveform of the same components, with optional repeating impacts from a bearing defect. */
export function synthWaveform(components: readonly VibrationComponent[], { samples = 480, seconds, noise = 0.1, seed = 1, impacts }: WaveformOptions): number[] {
  const random = seeded(seed);
  const phases = components.map(() => random() * Math.PI * 2);
  return Array.from({ length: samples }, (_, index) => {
    const time = (index / samples) * seconds;
    const tones = components.reduce((sum, component, k) => sum + component.amplitude * Math.SQRT2 * Math.sin(2 * Math.PI * component.hz * time + phases[k]), 0);
    const sinceImpact = impacts ? (time * impacts.hz) % 1 : 1;
    const ring = impacts ? impacts.amplitude * Math.exp(-sinceImpact * 9) * Math.cos(sinceImpact * 40) : 0;
    return Number((tones + ring + (random() - 0.5) * 2 * noise).toFixed(4));
  });
}

export function rms(samples: readonly number[]): number {
  if (samples.length === 0) return 0;
  return Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length);
}

export function peak(samples: readonly number[]): number {
  return samples.reduce((top, value) => Math.max(top, Math.abs(value)), 0);
}

/** Peak over RMS: about 1.4 for a clean sine, well above 3 when impacts ride on the signal. */
export function crestFactor(samples: readonly number[]): number {
  const level = rms(samples);
  return level === 0 ? 0 : peak(samples) / level;
}

/** Overall velocity of a set of components: the root of the summed squares. */
export function overall(components: readonly VibrationComponent[]): number {
  return Math.sqrt(components.reduce((sum, component) => sum + component.amplitude ** 2, 0));
}

/** The strongest local maxima of a spectrum, strongest first. */
export function findPeaks(lines: readonly SpectrumLine[], count: number, minAmplitude = 0): SpectrumLine[] {
  return lines
    .filter((line, index) => line.amplitude >= minAmplitude && line.amplitude > (lines[index - 1]?.amplitude ?? 0) && line.amplitude >= (lines[index + 1]?.amplitude ?? 0))
    .sort((a, b) => b.amplitude - a.amplitude)
    .slice(0, count);
}

export type PeakContext = { runningHz: number; bearingHz?: number; vanes?: number };
export type PeakReading = { label: string; cause: string };

/** Names a peak by its order of running speed and says what usually causes it. */
export function readPeak(hz: number, { runningHz, bearingHz, vanes }: PeakContext): PeakReading {
  const near = (target: number) => Math.abs(hz - target) <= Math.max(1.5, target * 0.03);
  if (bearingHz) {
    for (const multiple of [1, 2, 3]) {
      if (near(bearingHz * multiple)) return { label: multiple === 1 ? 'BPFO' : `${multiple}× BPFO`, cause: 'Outer-race bearing defect: a non-synchronous line with harmonics.' };
    }
  }
  const order = hz / runningHz;
  const whole = Math.round(order);
  if (vanes && whole === vanes && near(runningHz * vanes)) return { label: 'Vane pass', cause: 'Vane-pass pulsation: check the operating point against best efficiency.' };
  if (near(runningHz * 0.5)) return { label: '½×', cause: 'Half-order line: looseness or rub.' };
  if (whole === 1 && near(runningHz)) return { label: '1×', cause: 'Unbalance: a dominant line at running speed, steady phase.' };
  if (whole === 2 && near(runningHz * 2)) return { label: '2×', cause: 'Misalignment: a high second order, often with axial vibration.' };
  if (whole >= 3 && near(runningHz * whole)) return { label: `${whole}×`, cause: 'A run of higher harmonics: mechanical looseness.' };
  return { label: `${order.toFixed(2)}×`, cause: 'Non-synchronous line: compare with the bearing and gear frequencies.' };
}

export type FrequencyBand = { label: string; fromHz: number; toHz: number; alarm: number };

/** The highest line inside each band, for band alarms. */
export function bandLevels(lines: readonly SpectrumLine[], bands: readonly FrequencyBand[]): number[] {
  return bands.map((band) => lines.filter((line) => line.hz >= band.fromHz && line.hz < band.toHz).reduce((top, line) => Math.max(top, line.amplitude), 0));
}

export type IsoZone = 'A' | 'B' | 'C' | 'D';

/** ISO 10816-3 zone boundaries in mm/s RMS: A/B, B/C and C/D. Group 1 machines on rigid foundations. */
export const ISO_GROUP1_RIGID: readonly [number, number, number] = [2.3, 4.5, 7.1];

export const ISO_ZONES: readonly IsoZone[] = ['A', 'B', 'C', 'D'];
export const ISO_ZONE_TONE: Record<IsoZone, Tone> = { A: 'success', B: 'info', C: 'warning', D: 'critical' };
export const ISO_ZONE_WORD: Record<IsoZone, string> = { A: 'Good', B: 'Acceptable', C: 'Alert', D: 'Danger' };
export const ISO_ZONE_MEANING: Record<IsoZone, string> = {
  A: 'Newly commissioned machines',
  B: 'Unrestricted long-term operation',
  C: 'Limited operation until repair',
  D: 'Vibration can cause damage',
};

export function isoZone(value: number, boundaries: readonly [number, number, number] = ISO_GROUP1_RIGID): IsoZone {
  if (value < boundaries[0]) return 'A';
  if (value < boundaries[1]) return 'B';
  if (value < boundaries[2]) return 'C';
  return 'D';
}

export type OrbitPoint = { x: number; y: number };
type OrbitOptions = { xAmplitude: number; yAmplitude: number; phaseDeg: number; secondOrder?: number; steps?: number };

/** One shaft revolution seen by two probes at 90°: an ellipse, bent into a banana or figure of eight by 2×. */
export function orbitPoints({ xAmplitude, yAmplitude, phaseDeg, secondOrder = 0, steps = 120 }: OrbitOptions): OrbitPoint[] {
  const phase = (phaseDeg * Math.PI) / 180;
  return Array.from({ length: steps + 1 }, (_, index) => {
    const angle = (index / steps) * Math.PI * 2;
    return {
      x: xAmplitude * (Math.cos(angle) + secondOrder * Math.cos(2 * angle)),
      y: yAmplitude * (Math.cos(angle - phase) + secondOrder * Math.cos(2 * angle - phase + Math.PI / 3)),
    };
  });
}
