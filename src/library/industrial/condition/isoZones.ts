import type { Tone } from '../status';

/** Evaluation zones of ISO 10816 / 20816 for broadband velocity on non-rotating parts. */
export type IsoZone = 'A' | 'B' | 'C' | 'D';

/** Zone boundaries in mm/s RMS. */
export type IsoBoundaries = { ab: number; bc: number; cd: number };

/** ISO 10816-3 boundaries by machine group and foundation, velocity in mm/s RMS. */
export const ISO_10816_3 = {
  /** Large machines, 300 kW to 50 MW. */
  group1Rigid: { ab: 2.3, bc: 4.5, cd: 7.1 },
  group1Flexible: { ab: 3.5, bc: 7.1, cd: 11 },
  /** Medium machines, 15 kW to 300 kW. */
  group2Rigid: { ab: 1.4, bc: 2.8, cd: 4.5 },
  group2Flexible: { ab: 2.3, bc: 4.5, cd: 7.1 },
} as const satisfies Record<string, IsoBoundaries>;

export const ISO_ZONES: readonly IsoZone[] = ['A', 'B', 'C', 'D'];

/** The zone a velocity falls in. A boundary value belongs to the better zone. */
export function isoZone(velocity: number, boundaries: IsoBoundaries): IsoZone {
  if (velocity <= boundaries.ab) return 'A';
  if (velocity <= boundaries.bc) return 'B';
  if (velocity <= boundaries.cd) return 'C';
  return 'D';
}

export type IsoZoneBand = { zone: IsoZone; from: number; to: number };

/** The four zones as bands from 0 to `max`, for shading a trend or a gauge. Bands above `max` are left out. */
export function isoZoneBands(boundaries: IsoBoundaries, max: number): IsoZoneBand[] {
  const edges = [0, boundaries.ab, boundaries.bc, boundaries.cd, Infinity];
  return ISO_ZONES.flatMap((zone, index) => {
    const from = edges[index];
    const to = Math.min(edges[index + 1], max);
    return to > from ? [{ zone, from, to }] : [];
  });
}

/** A and B are acceptable and stay quiet; C is a warning; D is damaging. */
export const ISO_ZONE_TONE: Record<IsoZone, Tone> = { A: 'neutral', B: 'neutral', C: 'warning', D: 'critical' };

export const ISO_ZONE_MEANING: Record<IsoZone, string> = {
  A: 'Newly commissioned machines',
  B: 'Acceptable for unrestricted long-term operation',
  C: 'Not suitable for long-term operation; plan corrective action',
  D: 'Severe enough to cause damage',
};
