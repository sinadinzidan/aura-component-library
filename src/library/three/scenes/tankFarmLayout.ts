import { boundsFromFootprint, unionBounds } from '../cameraTargets';
import type { Bounds, Vec3 } from '../cameraTargets';

/** Where a tank stands and how big it is. */
export type TankSpot = {
  id: string;
  /** Centre on the ground plane: x (east), z (south). */
  center: readonly [number, number];
  diameter: number;
  /** Shell height. */
  height: number;
};

/** A rectangle on the ground: a bund wall, a paved area. */
export type GroundRect = { center: readonly [number, number]; size: readonly [number, number] };

/**
 * The pipe manifold of a tank farm: one header running east–west at `headerZ`, a branch from every
 * tank straight to it, and two ways out — the jetty line at the east end and the pipeline tie-in at
 * the west end.
 */
export type Manifold = {
  headerZ: number;
  /** Height of the pipe centre lines above ground. */
  y: number;
  /** The route from the east end of the header out to the loading arm, starting on the header. */
  jetty: readonly Vec3[];
  /** The route from the west end of the header to the pipeline tie-in, starting on the header. */
  pipeline: readonly Vec3[];
};

/** Where a movement enters or leaves the farm. */
export type ManifoldPort = 'jetty' | 'pipeline';

/** The branch of one tank: from its shell, on the side facing the header, to the header. */
export function branchRoute(tank: TankSpot, manifold: Manifold): Vec3[] {
  const [x, z] = tank.center;
  const side = manifold.headerZ >= z ? 1 : -1;
  return [
    [x, manifold.y, z + side * (tank.diameter / 2)],
    [x, manifold.y, manifold.headerZ],
  ];
}

/** The whole header, west end to east end, spanning every branch and both ports. */
export function headerRoute(tanks: readonly TankSpot[], manifold: Manifold): Vec3[] {
  const xs = [...tanks.map((tank) => tank.center[0]), manifold.jetty[0][0], manifold.pipeline[0][0]];
  return [
    [Math.min(...xs), manifold.y, manifold.headerZ],
    [Math.max(...xs), manifold.y, manifold.headerZ],
  ];
}

function portRoute(manifold: Manifold, port: ManifoldPort): readonly Vec3[] {
  return port === 'jetty' ? manifold.jetty : manifold.pipeline;
}

function dedupe(points: readonly Vec3[]): Vec3[] {
  return points.filter((point, index) => index === 0 || point.some((value, axis) => value !== points[index - 1][axis]));
}

/**
 * The path product takes for one movement, in flow direction. `from` or `to` is a tank; `null` is
 * the outside world, reached through `port`. Returns an empty route when both ends are outside.
 */
export function movementRoute(from: TankSpot | null, to: TankSpot | null, manifold: Manifold, port: ManifoldPort = 'jetty'): Vec3[] {
  if (!from && !to) return [];
  const outside = portRoute(manifold, port);
  const leave = from ? branchRoute(from, manifold) : [...outside].reverse();
  const arrive = to ? [...branchRoute(to, manifold)].reverse() : [...outside];
  return dedupe([...leave, ...arrive]);
}

/** The rectangle of a bund wall around a row of tanks, `margin` clear of the widest shell. */
export function bundRect(tanks: readonly TankSpot[], margin: number): GroundRect | null {
  if (tanks.length === 0) return null;
  const minX = Math.min(...tanks.map((tank) => tank.center[0] - tank.diameter / 2)) - margin;
  const maxX = Math.max(...tanks.map((tank) => tank.center[0] + tank.diameter / 2)) + margin;
  const minZ = Math.min(...tanks.map((tank) => tank.center[1] - tank.diameter / 2)) - margin;
  const maxZ = Math.max(...tanks.map((tank) => tank.center[1] + tank.diameter / 2)) + margin;
  return { center: [(minX + maxX) / 2, (minZ + maxZ) / 2], size: [maxX - minX, maxZ - minZ] };
}

export function tankBounds(tank: TankSpot): Bounds {
  return boundsFromFootprint([tank.center[0], 0, tank.center[1]], [tank.diameter, tank.height * 1.15, tank.diameter]);
}

/** Box around all tanks; `null` for none. */
export function farmBounds(tanks: readonly TankSpot[]): Bounds | null {
  return unionBounds(tanks.map(tankBounds));
}

/** Where a tank's label goes: above the middle of its roof. */
export function tankLabelAnchor(tank: TankSpot, gap = 1.2): Vec3 {
  return [tank.center[0], tank.height * 1.1 + gap, tank.center[1]];
}

/** Working volume of a cylindrical tank from its size, rounded to the nearest 10. */
export function shellVolume(diameter: number, height: number): number {
  return Math.round((Math.PI * (diameter / 2) ** 2 * height) / 10) * 10;
}
