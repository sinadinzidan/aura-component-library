/**
 * Synthetic vibration signals for condition-monitoring views: a sum of sinusoids, optional
 * impact trains from a bearing defect, and seeded noise. Everything is pure and deterministic,
 * so a screen renders the same waveform on every load.
 */

/** One sinusoid of a signal. `amplitude` is the peak value; `phase` is in radians. */
export type SignalComponent = { frequencyHz: number; amplitude: number; phase?: number };

/** Repeating impacts that ring down, as a rolling element passing a defect produces. */
export type ImpulseTrain = {
  /** Impacts per second, e.g. the outer-race defect frequency. */
  rateHz: number;
  /** Peak of each impact. */
  amplitude: number;
  /** Frequency the structure rings at after each impact. */
  ringHz: number;
  /** Decay rate of the ringing, per second. */
  decay: number;
};

export type SignalOptions = {
  components: readonly SignalComponent[];
  impulses?: readonly ImpulseTrain[];
  /** Peak size of the uniform noise added to every sample. */
  noise?: number;
  seed?: number;
  sampleRateHz: number;
  samples: number;
};

/** Small seeded PRNG (mulberry32). Returns numbers in [0, 1). */
export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

/** The sampled signal: sinusoids + ringing impacts + noise. */
export function synthesizeSignal(options: SignalOptions): number[] {
  const { components, impulses = [], noise = 0, seed = 1, sampleRateHz, samples } = options;
  const random = createSeededRandom(seed);
  return Array.from({ length: Math.max(0, Math.floor(samples)) }, (_, index) => {
    const time = index / sampleRateHz;
    let value = 0;
    for (const component of components) {
      value += component.amplitude * Math.sin(2 * Math.PI * component.frequencyHz * time + (component.phase ?? 0));
    }
    for (const train of impulses) {
      if (train.rateHz <= 0) continue;
      const sinceImpact = time % (1 / train.rateHz);
      value += train.amplitude * Math.exp(-train.decay * sinceImpact) * Math.sin(2 * Math.PI * train.ringHz * sinceImpact);
    }
    return value + (random() - 0.5) * 2 * noise;
  });
}

export function mean(samples: readonly number[]): number {
  if (samples.length === 0) return 0;
  return samples.reduce((sum, sample) => sum + sample, 0) / samples.length;
}

/** Root mean square: the energy-equivalent level of a signal. */
export function rms(samples: readonly number[]): number {
  if (samples.length === 0) return 0;
  return Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length);
}

/** Largest excursion from zero. */
export function peak(samples: readonly number[]): number {
  return samples.reduce((largest, sample) => Math.max(largest, Math.abs(sample)), 0);
}

/** Peak over RMS. A sine is 1.41; impacts from an early bearing defect push it above 3. */
export function crestFactor(samples: readonly number[]): number {
  const level = rms(samples);
  return level === 0 ? 0 : peak(samples) / level;
}

/** Fourth moment over variance squared. Gaussian noise is 3, a sine 1.5; impacts raise it. */
export function kurtosis(samples: readonly number[]): number {
  if (samples.length === 0) return 0;
  const average = mean(samples);
  let second = 0;
  let fourth = 0;
  for (const sample of samples) {
    const deviation = sample - average;
    second += deviation ** 2;
    fourth += deviation ** 4;
  }
  second /= samples.length;
  fourth /= samples.length;
  return second === 0 ? 0 : fourth / second ** 2;
}

/** A rolling-element bearing, as far as its defect frequencies need it. */
export type BearingGeometry = {
  rollingElements: number;
  /** Ball or roller diameter, in the same unit as `pitchDiameter`. */
  ballDiameter: number;
  pitchDiameter: number;
  contactAngleDeg?: number;
};

/** Defect frequencies of a bearing with a rotating inner ring, in Hz. */
export type BearingFrequencies = {
  /** Ball pass frequency, outer race. */
  bpfo: number;
  /** Ball pass frequency, inner race. */
  bpfi: number;
  /** Ball spin frequency. */
  bsf: number;
  /** Fundamental train (cage) frequency. */
  ftf: number;
};

export function bearingFrequencies(geometry: BearingGeometry, shaftHz: number): BearingFrequencies {
  const ratio = (geometry.ballDiameter / geometry.pitchDiameter) * Math.cos(((geometry.contactAngleDeg ?? 0) * Math.PI) / 180);
  return {
    bpfo: (geometry.rollingElements / 2) * (1 - ratio) * shaftHz,
    bpfi: (geometry.rollingElements / 2) * (1 + ratio) * shaftHz,
    bsf: (geometry.pitchDiameter / (2 * geometry.ballDiameter)) * (1 - ratio ** 2) * shaftHz,
    ftf: 0.5 * (1 - ratio) * shaftHz,
  };
}

/** How strongly each common fault shows on one measurement point. Amplitudes are peak values. */
export type MachineCondition = {
  /** Shaft speed in Hz (rpm / 60). */
  runningHz: number;
  /** 1× running speed. */
  unbalance?: number;
  /** 2× running speed, with a little 3×. */
  misalignment?: number;
  /** A comb of harmonics and half-orders. */
  looseness?: number;
  /** Vane or blade pass: `vanes` × running speed. */
  vanePass?: { vanes: number; amplitude: number };
  /** Steady tones at bearing defect frequencies, with a weaker second harmonic. */
  bearingTones?: readonly { frequencyHz: number; amplitude: number }[];
};

/** The sinusoids a machine in the given condition produces. */
export function machineComponents(condition: MachineCondition): SignalComponent[] {
  const { runningHz, unbalance = 0, misalignment = 0, looseness = 0, vanePass, bearingTones = [] } = condition;
  const components: SignalComponent[] = [];
  const push = (frequencyHz: number, amplitude: number, phase: number) => {
    if (amplitude > 0) components.push({ frequencyHz, amplitude, phase });
  };
  push(runningHz, unbalance, 0.4);
  push(2 * runningHz, misalignment, 1.3);
  push(3 * runningHz, misalignment * 0.35, 2.1);
  if (looseness > 0) {
    for (let order = 1; order <= 8; order += 1) push(order * runningHz, looseness / Math.sqrt(order), order * 0.7);
    for (const order of [0.5, 1.5, 2.5]) push(order * runningHz, looseness * 0.3, order * 1.9);
  }
  if (vanePass) push(vanePass.vanes * runningHz, vanePass.amplitude, 0.9);
  for (const tone of bearingTones) {
    push(tone.frequencyHz, tone.amplitude, 0.2);
    push(2 * tone.frequencyHz, tone.amplitude * 0.45, 1.1);
  }
  return components;
}
