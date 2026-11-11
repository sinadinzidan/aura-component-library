import { addVec3, frameBounds, normalizeVec3, scaleVec3 } from '../cameraTargets';
import type { Bounds, CameraTarget, Vec3 } from '../cameraTargets';
import { pointAlong, polylineLength } from '../pipeGeometry';

import type { HeightFunction } from './terrainHeight';

/** The networks a subsea field is made of. */
export type SubseaSystem = 'production' | 'injection' | 'control' | 'mooring';

/** A system to highlight, or `all` for the whole field. */
export type SubseaSystemFilter = SubseaSystem | 'all';

/** The three altitudes the camera can sit at. */
export type DepthLevel = 'surface' | 'water-column' | 'seabed';

export const DEPTH_LEVELS: readonly DepthLevel[] = ['surface', 'water-column', 'seabed'];

export type SubseaStructureKind = 'template' | 'manifold' | 'plet' | 'termination';

/** Something that stands on the seabed. */
export type SubseaStructure = {
  id: string;
  tag: string;
  name?: string;
  kind: SubseaStructureKind;
  system: SubseaSystem;
  /** Where it stands on the plan: x, z. Its height comes from the terrain. */
  position: readonly [number, number];
  rotationY?: number;
  /** Well slots, for templates. */
  slots?: number;
  selectable?: boolean;
};

export type SubseaLineKind = 'flowline' | 'umbilical' | 'jumper' | 'riser' | 'pipeline' | 'mooring';

/** Anything long and thin: flowlines, umbilicals, jumpers, risers and mooring lines. */
export type SubseaLine = {
  id: string;
  tag: string;
  name?: string;
  kind: SubseaLineKind;
  system: SubseaSystem;
  /** The path in scene coordinates. For lines that carry fluid it runs in flow direction. */
  points: readonly Vec3[];
  radius?: number;
  selectable?: boolean;
  /** Whether flow chevrons make sense on this line. */
  flow?: boolean;
};

/** The floating production vessel. It lies along x with its turret towards −x when not rotated. */
export type SubseaVessel = {
  id: string;
  tag: string;
  /** Midships on the waterline. */
  position: Vec3;
  rotationY?: number;
  length: number;
};

export type SubseaFieldLayout = {
  /** Width (x) and depth (z) of the mapped seabed, centred on the origin. */
  size: readonly [number, number];
  /** Height of the sea surface above the mean seabed, in scene units. */
  waterDepth: number;
  /** Middle of the subsea installations on the plan, which the seabed view looks at. */
  fieldCenter: readonly [number, number];
  vessel: SubseaVessel;
  structures: readonly SubseaStructure[];
  lines: readonly SubseaLine[];
};

/** Where along the hull the turret sits, as a fraction of the length from midships towards the bow. */
export const TURRET_FRACTION = 0.36;

/** Whether an item fades back under a system filter. */
export function isGhosted(filter: SubseaSystemFilter, system: SubseaSystem): boolean {
  return filter !== 'all' && filter !== system;
}

/** The point where risers and mooring lines meet the vessel: the bottom of its turret. */
export function turretPosition(vessel: SubseaVessel, keelDepth = 3): Vec3 {
  const angle = vessel.rotationY ?? 0;
  const offset = -vessel.length * TURRET_FRACTION;
  return [vessel.position[0] + Math.cos(angle) * offset, vessel.position[1] - keelDepth, vessel.position[2] - Math.sin(angle) * offset];
}

/** The point halfway along a line, by length. */
export function lineMidpoint(points: readonly Vec3[]): Vec3 | null {
  if (points.length === 0) return null;
  if (points.length === 1) return points[0];
  return pointAlong(points, polylineLength(points) / 2)?.position ?? points[0];
}

/** The box around a line's points. */
export function lineBounds(points: readonly Vec3[]): Bounds | null {
  if (points.length === 0) return null;
  const min: [number, number, number] = [points[0][0], points[0][1], points[0][2]];
  const max: [number, number, number] = [points[0][0], points[0][1], points[0][2]];
  for (const point of points) {
    for (const axis of [0, 1, 2] as const) {
      min[axis] = Math.min(min[axis], point[axis]);
      max[axis] = Math.max(max[axis], point[axis]);
    }
  }
  return { min, max };
}

/** The point an item is "at": a structure's base on the seabed, a line's midpoint, the vessel's deck. */
export function itemAnchor(layout: SubseaFieldLayout, id: string, height: HeightFunction): Vec3 | null {
  if (id === layout.vessel.id) return layout.vessel.position;
  const structure = layout.structures.find((candidate) => candidate.id === id);
  if (structure) return [structure.position[0], height(structure.position[0], structure.position[1]), structure.position[1]];
  const line = layout.lines.find((candidate) => candidate.id === id);
  return line ? lineMidpoint(line.points) : null;
}

/** The system an item belongs to; `null` for the vessel and unknown ids. */
export function systemOf(layout: SubseaFieldLayout, id: string): SubseaSystem | null {
  return layout.structures.find((candidate) => candidate.id === id)?.system ?? layout.lines.find((candidate) => candidate.id === id)?.system ?? null;
}

const LEVEL_VIEW: Record<DepthLevel, { direction: Vec3; distance: number }> = {
  surface: { direction: [-0.35, 0.42, 0.85], distance: 2.7 },
  'water-column': { direction: [-0.18, 0.1, 1], distance: 2.9 },
  seabed: { direction: [0.3, 0.3, 0.9], distance: 1.35 },
};

/**
 * The camera pose for a depth level: above the vessel at the surface, side-on through the water
 * column where the risers hang, and low over the installations on the seabed.
 */
export function depthLevelTarget(layout: SubseaFieldLayout, level: DepthLevel): CameraTarget {
  const view = LEVEL_VIEW[level];
  const depth = layout.waterDepth;
  const lookAt: Vec3 =
    level === 'surface'
      ? [layout.vessel.position[0] * 0.6 + layout.fieldCenter[0] * 0.4, depth * 0.8, layout.vessel.position[2] * 0.6 + layout.fieldCenter[1] * 0.4]
      : level === 'water-column'
        ? [(layout.vessel.position[0] + layout.fieldCenter[0]) / 2, depth * 0.48, (layout.vessel.position[2] + layout.fieldCenter[1]) / 2]
        : [layout.fieldCenter[0], depth * 0.04, layout.fieldCenter[1]];
  return { position: addVec3(lookAt, scaleVec3(normalizeVec3(view.direction), depth * view.distance)), lookAt };
}

/** The camera pose that frames one item: tight on a structure, wide enough to see a whole line. */
export function itemCameraTarget(layout: SubseaFieldLayout, id: string, height: HeightFunction, aspect = 1.6): CameraTarget | null {
  const anchor = itemAnchor(layout, id, height);
  if (!anchor) return null;
  const line = layout.lines.find((candidate) => candidate.id === id);
  if (line) {
    const bounds = lineBounds(line.points);
    return bounds ? frameBounds(bounds, { aspect, padding: 0.95, minDistance: layout.waterDepth * 0.7 }) : null;
  }
  const reach = id === layout.vessel.id ? layout.vessel.length / 2 : 7;
  const bounds: Bounds = { min: [anchor[0] - reach, anchor[1], anchor[2] - reach], max: [anchor[0] + reach, anchor[1] + reach * 0.6, anchor[2] + reach] };
  return frameBounds(bounds, { aspect, padding: 1.2, minDistance: layout.waterDepth * 0.6 });
}

/**
 * Where an inspection vehicle hovers to look at an item: above and a little to the side of its
 * anchor, never closer to the seabed than `clearance`. `null` for an unknown id.
 */
export function rovStation(layout: SubseaFieldLayout, id: string, height: HeightFunction, clearance = 3): Vec3 | null {
  const anchor = itemAnchor(layout, id, height);
  if (!anchor) return null;
  const x = anchor[0] + 3.5;
  const z = anchor[2] + 4.5;
  return [x, Math.max(anchor[1] + clearance, height(x, z) + clearance), z];
}

/** Water depth in metres at a height in the scene: 0 at the surface, growing downwards. */
export function depthInMetres(layout: SubseaFieldLayout, y: number, metresPerUnit: number): number {
  return Math.max(0, (layout.waterDepth - y) * metresPerUnit);
}

/** The ids of everything that can be selected, structures first. */
export function selectableIds(layout: SubseaFieldLayout): string[] {
  return [
    ...layout.structures.filter((structure) => structure.selectable !== false).map((structure) => structure.id),
    ...layout.lines.filter((line) => line.selectable).map((line) => line.id),
  ];
}
