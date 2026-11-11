/** A station that adds pressure to the line: a compressor or pump station. */
export type Booster = { kp: number; boost: number };

export type HydraulicInput = {
  /** Length of the line in kilometres. */
  totalKm: number;
  /** Pressure at kilometre 0, in barg. */
  inletPressure: number;
  /** Friction loss in bar per kilometre. */
  lossPerKm: number;
  boosters?: readonly Booster[];
  /** Ground elevation at a chainage, in metres. Climbing costs pressure, descending returns it. */
  elevation?: (kp: number) => number;
  /** Bar lost per metre climbed. Small for gas, about 0.08 for oil. */
  barPerMetre?: number;
};

export type PressurePoint = { kp: number; pressure: number };

/**
 * Pressure along a pipeline at steady flow: the inlet pressure, minus friction, minus the static
 * head of the climb so far, plus every booster station already passed. This is the hydraulic
 * gradient an operator compares with the maximum allowable operating pressure.
 */
export function pressureAt(input: HydraulicInput, kp: number): number {
  const at = Math.min(input.totalKm, Math.max(0, kp));
  const boosted = (input.boosters ?? []).filter((booster) => booster.kp <= at).reduce((sum, booster) => sum + booster.boost, 0);
  const climb = input.elevation ? input.elevation(at) - input.elevation(0) : 0;
  return input.inletPressure - input.lossPerKm * at - climb * (input.barPerMetre ?? 0) + boosted;
}

/** The gradient as points every `stepKm`, with a point on each side of every booster so the step is drawn vertical. */
export function pressureProfile(input: HydraulicInput, stepKm = 1): PressurePoint[] {
  const step = Math.max(stepKm, 0.01);
  const points: PressurePoint[] = [];
  for (let kp = 0; kp < input.totalKm; kp += step) points.push({ kp, pressure: pressureAt(input, kp) });
  points.push({ kp: input.totalKm, pressure: pressureAt(input, input.totalKm) });
  for (const booster of input.boosters ?? []) {
    if (booster.kp <= 0 || booster.kp > input.totalKm) continue;
    points.push({ kp: booster.kp - 1e-6, pressure: pressureAt(input, booster.kp) - booster.boost });
    points.push({ kp: booster.kp, pressure: pressureAt(input, booster.kp) });
  }
  return points.sort((a, b) => a.kp - b.kp);
}

export type LeakWave = {
  /** Where the leak is. */
  kp: number;
  /** Pressure lost at the leak itself, in bar. */
  drop: number;
  /** How far the rarefaction wave has travelled up and down the line, in kilometres. */
  reachKm: number;
};

/**
 * The gradient just after a leak opens: a pressure wave runs away from the leak in both
 * directions, so the profile shows a V centred on it whose arms end at the wave fronts.
 */
export function applyLeak(profile: readonly PressurePoint[], leak: LeakWave): PressurePoint[] {
  const reach = Math.max(leak.reachKm, 1e-6);
  return profile.map((point) => {
    const distance = Math.abs(point.kp - leak.kp);
    return distance >= reach ? point : { kp: point.kp, pressure: point.pressure - leak.drop * (1 - distance / reach) };
  });
}

/** The positions of the two wave fronts of a leak, clamped to the line. */
export function waveFronts(leak: LeakWave, totalKm: number): [number, number] {
  return [Math.max(0, leak.kp - leak.reachKm), Math.min(totalKm, leak.kp + leak.reachKm)];
}

/**
 * The gradient once a stretch is shut in between two block valves: inside it the pressure has
 * settled to one value; the rest of the line is unchanged.
 */
export function applyIsolation(profile: readonly PressurePoint[], fromKp: number, toKp: number, settledPressure: number): PressurePoint[] {
  const from = Math.min(fromKp, toKp);
  const to = Math.max(fromKp, toKp);
  return profile.map((point) => (point.kp >= from && point.kp <= to ? { kp: point.kp, pressure: settledPressure } : point));
}

/** The block valves on each side of a chainage: the nearest one upstream and the nearest one downstream. */
export function isolationValves<T extends { kp: number }>(valves: readonly T[], kp: number): { upstream: T; downstream: T } | null {
  const ordered = [...valves].sort((a, b) => a.kp - b.kp);
  const upstream = [...ordered].reverse().find((valve) => valve.kp <= kp);
  const downstream = ordered.find((valve) => valve.kp > kp);
  return upstream && downstream ? { upstream, downstream } : null;
}

/** The largest pressure on a profile, and the smallest margin to the allowable limit. */
export function pressureMargin(profile: readonly PressurePoint[], maop: number): { peak: number; margin: number } {
  const peak = profile.reduce((max, point) => Math.max(max, point.pressure), Number.NEGATIVE_INFINITY);
  return { peak, margin: maop - peak };
}
