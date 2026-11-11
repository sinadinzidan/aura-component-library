/**
 * Layout of a circular scope: equal sectors around a centre, contacts placed by sector and by a
 * score that sets their distance from the centre, and a rotation that brings one sector to the top.
 * Angles are degrees clockwise from twelve o'clock, as in `polar.ts`.
 */

export type ScopePlacement = { angle: number; radius: number };

/** Width of one sector in degrees. */
export function sectorSize(count: number): number {
  return 360 / Math.max(count, 1);
}

/** Rotation of the scope that puts the middle of sector `focus` at twelve o'clock. */
export function focusRotation(focus: number, count: number): number {
  return -(focus + 0.5) * sectorSize(count);
}

/** The next focus index when rotating by `step` sectors, wrapping around. */
export function stepFocus(focus: number, step: number, count: number): number {
  const size = Math.max(count, 1);
  return (((focus + step) % size) + size) % size;
}

/**
 * Distance from the centre for a score: the best score sits near the centre, the worst at the rim.
 * `inner` and `outer` are the radii for `best` and `worst`.
 */
export function scoreRadius(score: number, best: number, worst: number, inner: number, outer: number): number {
  const share = Math.min(1, Math.max(0, (best - score) / (best - worst || 1)));
  return Math.round(inner + share * (outer - inner));
}

/**
 * Where contact `slot` of `slots` sits in a sector, before rotation: spread across the sector
 * with a margin at both edges so contacts never sit on a sector line.
 */
export function slotAngle(sector: number, count: number, slot: number, slots: number, margin = 0.16): number {
  const size = sectorSize(count);
  const usable = size * (1 - margin * 2);
  const offset = slots <= 1 ? 0.5 : slot / (slots - 1);
  return sector * size + size * margin + usable * offset;
}

/** A contact's place on the scope after the scope has been rotated. */
export function placeContact(
  sector: number,
  count: number,
  slot: number,
  slots: number,
  radius: number,
  rotation: number
): ScopePlacement {
  return { angle: slotAngle(sector, count, slot, slots) + rotation, radius };
}
