import type { Vec3 } from '../cameraTargets';

/** One directional survey station: measured depth along the hole, inclination from vertical and azimuth from north, in degrees. */
export type SurveyStation = { md: number; inc: number; azi: number };

/** A computed point on a well path. Depths and offsets share the unit of the survey's measured depth. */
export type WellPathPoint = {
  md: number;
  /** True vertical depth below the wellhead. */
  tvd: number;
  /** Offset from the wellhead towards north and east. */
  north: number;
  east: number;
  inc: number;
  azi: number;
};

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/** Signed shortest turn from one azimuth to another, in degrees (−180 to 180). */
export function azimuthDelta(from: number, to: number): number {
  return ((((to - from) % 360) + 540) % 360) - 180;
}

/**
 * The 3D path of a well from its survey, by the minimum curvature method: each pair of stations is
 * joined by a circular arc, so doglegs are smooth instead of kinked. Stations must be ordered by
 * measured depth; the first one is the wellhead.
 */
export function wellPath(survey: readonly SurveyStation[]): WellPathPoint[] {
  const path: WellPathPoint[] = [];
  let tvd = 0;
  let north = 0;
  let east = 0;

  survey.forEach((station, index) => {
    if (index > 0) {
      const previous = survey[index - 1];
      const length = station.md - previous.md;
      const i1 = toRadians(previous.inc);
      const i2 = toRadians(station.inc);
      const a1 = toRadians(previous.azi);
      const a2 = toRadians(station.azi);
      const cosDogleg = Math.cos(i2 - i1) - Math.sin(i1) * Math.sin(i2) * (1 - Math.cos(a2 - a1));
      const dogleg = Math.acos(Math.min(1, Math.max(-1, cosDogleg)));
      const ratio = dogleg < 1e-7 ? 1 : (2 / dogleg) * Math.tan(dogleg / 2);
      north += (length / 2) * (Math.sin(i1) * Math.cos(a1) + Math.sin(i2) * Math.cos(a2)) * ratio;
      east += (length / 2) * (Math.sin(i1) * Math.sin(a1) + Math.sin(i2) * Math.sin(a2)) * ratio;
      tvd += (length / 2) * (Math.cos(i1) + Math.cos(i2)) * ratio;
    }
    path.push({ md: station.md, tvd, north, east, inc: station.inc, azi: station.azi });
  });

  return path;
}

/** Extra stations every `step` of measured depth, with inclination and azimuth interpolated, so a drawn path is smooth. */
export function densifySurvey(survey: readonly SurveyStation[], step: number): SurveyStation[] {
  if (survey.length === 0 || step <= 0) return [...survey];
  const dense: SurveyStation[] = [survey[0]];
  for (let index = 1; index < survey.length; index += 1) {
    const from = survey[index - 1];
    const to = survey[index];
    const pieces = Math.max(1, Math.ceil((to.md - from.md) / step));
    const turn = azimuthDelta(from.azi, to.azi);
    for (let piece = 1; piece <= pieces; piece += 1) {
      const t = piece / pieces;
      dense.push(
        piece === pieces
          ? to
          : { md: from.md + (to.md - from.md) * t, inc: from.inc + (to.inc - from.inc) * t, azi: (from.azi + turn * t + 360) % 360 }
      );
    }
  }
  return dense;
}

/** A planned trajectory in the terms a well planner uses. Angles in degrees, depths in metres. */
export type WellPlan = {
  /** Measured depth where the well leaves vertical. */
  kickoffMd: number;
  /** Build rate in degrees per 30 m. */
  buildRate: number;
  /** Inclination held in the tangent section. */
  holdInc: number;
  azimuth: number;
  /** Total depth along the hole. */
  tdMd: number;
  /** A second build into the reservoir, e.g. to horizontal. */
  landing?: { startMd: number; inc: number; buildRate: number };
  /** Azimuth change per 100 m once the well has kicked off, for a path that turns as it goes. */
  turnRate?: number;
};

/** Inclination of a planned well at a measured depth. */
export function plannedInclination(plan: WellPlan, md: number): number {
  if (md <= plan.kickoffMd) return 0;
  const built = Math.min(plan.holdInc, ((md - plan.kickoffMd) / 30) * plan.buildRate);
  if (!plan.landing || md <= plan.landing.startMd) return built;
  const landed = built + ((md - plan.landing.startMd) / 30) * plan.landing.buildRate;
  return Math.min(Math.max(plan.landing.inc, built), landed);
}

/** Survey stations for a planned well: vertical, build, hold and an optional landing, sampled every `step` metres. */
export function planSurvey(plan: WellPlan, step = 100): SurveyStation[] {
  const depths = new Set<number>([0, plan.kickoffMd, plan.tdMd]);
  for (let md = step; md < plan.tdMd; md += step) depths.add(md);
  if (plan.landing) depths.add(plan.landing.startMd);
  return [...depths]
    .filter((md) => md >= 0 && md <= plan.tdMd)
    .sort((a, b) => a - b)
    .map((md) => ({
      md,
      inc: plannedInclination(plan, md),
      azi: (((plan.azimuth + (Math.max(0, md - plan.kickoffMd) / 100) * (plan.turnRate ?? 0)) % 360) + 360) % 360,
    }));
}

function interpolate(from: WellPathPoint, to: WellPathPoint, t: number): WellPathPoint {
  const mix = (a: number, b: number): number => a + (b - a) * t;
  return {
    md: mix(from.md, to.md),
    tvd: mix(from.tvd, to.tvd),
    north: mix(from.north, to.north),
    east: mix(from.east, to.east),
    inc: mix(from.inc, to.inc),
    azi: (from.azi + azimuthDelta(from.azi, to.azi) * t + 360) % 360,
  };
}

/** Where a well first reaches a true vertical depth; `null` when it never gets that deep. */
export function pointAtTvd(path: readonly WellPathPoint[], tvd: number): WellPathPoint | null {
  if (path.length === 0 || tvd < path[0].tvd) return null;
  for (let index = 1; index < path.length; index += 1) {
    const from = path[index - 1];
    const to = path[index];
    if (tvd >= from.tvd && tvd <= to.tvd) {
      return to.tvd === from.tvd ? from : interpolate(from, to, (tvd - from.tvd) / (to.tvd - from.tvd));
    }
  }
  return path.length === 1 && path[0].tvd === tvd ? path[0] : null;
}

/** The point at a measured depth; `null` outside the surveyed interval. */
export function pointAtMd(path: readonly WellPathPoint[], md: number): WellPathPoint | null {
  if (path.length === 0 || md < path[0].md || md > path[path.length - 1].md) return null;
  for (let index = 1; index < path.length; index += 1) {
    const from = path[index - 1];
    const to = path[index];
    if (md <= to.md) return to.md === from.md ? to : interpolate(from, to, (md - from.md) / (to.md - from.md));
  }
  return path[0];
}

/** Deepest true vertical depth a well reaches. */
export function deepestTvd(path: readonly WellPathPoint[]): number {
  return path.reduce((deepest, point) => Math.max(deepest, point.tvd), 0);
}

/**
 * A path point in scene coordinates: east is +x, north is −z and depth runs down −y from the
 * wellhead at `origin`. `scale` converts metres to scene units.
 */
export function pathPointToScene(point: Pick<WellPathPoint, 'tvd' | 'north' | 'east'>, origin: Vec3, scale: number): Vec3 {
  return [origin[0] + point.east * scale, origin[1] - point.tvd * scale, origin[2] - point.north * scale];
}

export function pathToScene(path: readonly WellPathPoint[], origin: Vec3, scale: number): Vec3[] {
  return path.map((point) => pathPointToScene(point, origin, scale));
}

/** A casing or liner string and the measured depth of its shoe. */
export type CasingString = { name: string; shoeMd: number };

/**
 * What lines the hole at a measured depth: the innermost string whose shoe is at or below it, and
 * whether the depth is at that shoe (within `tolerance`). `null` below the last shoe: open hole.
 */
export function casingAtMd(casings: readonly CasingString[], md: number, tolerance = 25): { casing: CasingString; atShoe: boolean } | null {
  const sorted = [...casings].sort((a, b) => a.shoeMd - b.shoeMd);
  const casing = sorted.find((candidate) => candidate.shoeMd >= md - tolerance);
  if (!casing) return null;
  return { casing, atShoe: Math.abs(casing.shoeMd - md) <= tolerance };
}
