/**
 * Shaft-relative behaviour of a rotor on fluid-film bearings, from the textbook single-mass
 * (Jeffcott) model: enough to draw believable Bode, polar, orbit and shaft-centreline plots.
 */

export type PlotPoint = { x: number; y: number };

export type RotorModel = {
  /** First critical speed in rpm. */
  criticalRpm: number;
  /** Damping ratio; 0.05–0.15 is typical for fluid-film bearings. */
  dampingRatio: number;
  /** Amplitude the response settles at far above the critical speed (the mass eccentricity). */
  eccentricity: number;
};

export type RotorResponse = { speedRpm: number; amplitude: number; phaseLagDeg: number };

/** Synchronous (1×) response to unbalance at a speed: amplitude and phase lag (0° to 180°). */
export function rotorResponse(speedRpm: number, model: RotorModel): RotorResponse {
  const ratio = model.criticalRpm > 0 ? speedRpm / model.criticalRpm : 0;
  const real = 1 - ratio ** 2;
  const imaginary = 2 * model.dampingRatio * ratio;
  const magnitude = Math.hypot(real, imaginary);
  const amplitude = magnitude === 0 ? 0 : (model.eccentricity * ratio ** 2) / magnitude;
  const phaseLagDeg = ratio === 0 ? 0 : (Math.atan2(imaginary, real) * 180) / Math.PI;
  return { speedRpm, amplitude, phaseLagDeg };
}

/** The response at evenly spaced speeds, as recorded during a run-up or coast-down. */
export function runUp(model: RotorModel, fromRpm: number, toRpm: number, steps: number): RotorResponse[] {
  const count = Math.max(2, Math.floor(steps));
  return Array.from({ length: count }, (_, index) => rotorResponse(fromRpm + ((toRpm - fromRpm) * index) / (count - 1), model));
}

/** The speed with the highest amplitude in a run-up; `null` when it is empty. */
export function peakResponse(points: readonly RotorResponse[]): RotorResponse | null {
  return points.reduce<RotorResponse | null>((best, point) => (!best || point.amplitude > best.amplitude ? point : best), null);
}

/** Amplitude and phase as a point on a polar plot: 0° to the right, lag angles turning against rotation. */
export function polarPoint(amplitude: number, phaseLagDeg: number): PlotPoint {
  const angle = (phaseLagDeg * Math.PI) / 180;
  return { x: amplitude * Math.cos(angle), y: amplitude * Math.sin(angle) };
}

export type OrbitOptions = {
  /** 1× amplitude seen by the X and Y probes (peak). */
  xAmplitude: number;
  yAmplitude: number;
  /** Phase of Y relative to X, in degrees. 90 gives a forward circular or elliptical orbit. */
  phaseDeg?: number;
  /** 2× content as a fraction of 1×: bends the ellipse into a banana or figure of eight (misalignment, preload). */
  secondOrder?: number;
  /** 0.5× content as a fraction of 1×, for a rub or oil whirl; the orbit then closes over two revolutions. */
  halfOrder?: number;
  /** Shaft revolutions to trace. */
  revolutions?: number;
  /** Samples per revolution. */
  samplesPerRev?: number;
};

/** The path of the shaft centre as an X–Y probe pair sees it. The first point is at the keyphasor pulse. */
export function orbitPoints(options: OrbitOptions): PlotPoint[] {
  const { xAmplitude, yAmplitude, phaseDeg = 90, secondOrder = 0, halfOrder = 0, revolutions = 1, samplesPerRev = 64 } = options;
  const lag = (phaseDeg * Math.PI) / 180;
  const total = Math.max(1, Math.round(revolutions * samplesPerRev));
  return Array.from({ length: total + 1 }, (_, index) => {
    const angle = (2 * Math.PI * index) / samplesPerRev;
    return {
      x: xAmplitude * (Math.cos(angle) + secondOrder * Math.cos(2 * angle + 0.6) + halfOrder * Math.cos(angle / 2)),
      y: yAmplitude * (Math.cos(angle - lag) + secondOrder * Math.cos(2 * angle - lag - 0.4) + halfOrder * Math.cos(angle / 2 - lag)),
    };
  });
}

/** Largest distance from the centre in an orbit. */
export function orbitRadius(points: readonly PlotPoint[]): number {
  return points.reduce((largest, point) => Math.max(largest, Math.hypot(point.x, point.y)), 0);
}

export type CentrelineOptions = {
  /** Radial bearing clearance; the journal rests at (0, −clearance) at standstill. */
  clearance: number;
  /** Eccentricity ratio at full speed: how far from the bearing centre the journal settles (0–1). */
  runningEccentricity?: number;
  /** Attitude angle at full speed, in degrees from straight down in the direction of rotation. */
  attitudeDeg?: number;
};

/**
 * Average position of the journal in its bearing at a fraction (0–1) of full speed. It starts at
 * the bottom of the clearance and climbs along an arc as the oil wedge builds.
 */
export function centrelinePosition(speedFraction: number, options: CentrelineOptions): PlotPoint {
  const { clearance, runningEccentricity = 0.45, attitudeDeg = 38 } = options;
  const progress = Math.min(1, Math.max(0, speedFraction));
  // The wedge forms early: most of the lift happens in the first third of the speed range.
  const eased = 1 - (1 - progress) ** 2.2;
  const eccentricity = 1 - (1 - runningEccentricity) * eased;
  const attitude = ((attitudeDeg * Math.PI) / 180) * eased;
  return { x: clearance * eccentricity * Math.sin(attitude), y: -clearance * eccentricity * Math.cos(attitude) };
}
