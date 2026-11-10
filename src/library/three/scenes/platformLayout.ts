import { boundsFromFootprint, frameBounds, unionBounds } from '../cameraTargets';
import type { Bounds, CameraTarget, Vec3 } from '../cameraTargets';
import { equipmentBounds } from '../plantLayout';
import type { PlantEquipment } from '../plantLayout';

import { levelBounds, stackBounds } from './explode';
import type { ExplodeLevel } from './explode';

export type PlatformFeatureKind = 'derrick' | 'crane' | 'helideck' | 'flare-boom' | 'quarters';

/** A landmark structure on a deck. Positions are relative to the middle of the deck floor. */
export type PlatformFeature = {
  id: string;
  kind: PlatformFeatureKind;
  position: Vec3;
  rotationY?: number;
};

/** One level of a platform, bottom first: the jacket, then each deck. */
export type PlatformLevel = {
  id: string;
  name: string;
  kind: 'jacket' | 'deck';
  /** Height of the level's floor above the sea when assembled. For the jacket: its top. */
  elevation: number;
  /** Clear height up to the next deck. 0 for the top (weather) deck. */
  height: number;
  /** Equipment on the deck, positioned relative to the middle of the floor. */
  equipment: readonly PlantEquipment[];
  features?: readonly PlatformFeature[];
};

/** A whole platform as data. Render it with `OffshorePlatform`. */
export type PlatformLayout = {
  /** Deck footprint: width (x) and depth (z). */
  size: readonly [number, number];
  /** How far apart neighbouring levels move when fully exploded. */
  gap: number;
  /** How far the jacket shows below the waterline in the camera framing. */
  draught: number;
  levels: readonly PlatformLevel[];
};

/** Space each feature takes around its position: x, y and z extents as [min, max]. Rotation is ignored. */
const FEATURE_EXTENTS: Record<PlatformFeatureKind, { x: readonly [number, number]; y: readonly [number, number]; z: readonly [number, number] }> = {
  derrick: { x: [-4.5, 4.5], y: [0, 30], z: [-4.5, 4.5] },
  crane: { x: [-3, 16], y: [0, 22], z: [-3, 3] },
  helideck: { x: [-7.5, 7.5], y: [-4, 0.5], z: [-7.5, 7.5] },
  'flare-boom': { x: [-24, 24], y: [0, 19], z: [-24, 24] },
  quarters: { x: [-5.5, 5.5], y: [0, 10.5], z: [-9.5, 9.5] },
};

function featureBounds(feature: PlatformFeature): Bounds {
  const extents = FEATURE_EXTENTS[feature.kind];
  const [x, y, z] = feature.position;
  return { min: [x + extents.x[0], y + extents.y[0], z + extents.z[0]], max: [x + extents.x[1], y + extents.y[1], z + extents.z[1]] };
}

/** World-space box around a level when assembled: its deck, its equipment and its features. */
export function levelEnvelope(layout: PlatformLayout, level: PlatformLevel): Bounds {
  const [width, depth] = layout.size;
  if (level.kind === 'jacket') return boundsFromFootprint([0, -layout.draught, 0], [width, level.elevation + layout.draught, depth]);
  const local = unionBounds([
    boundsFromFootprint([0, -0.6, 0], [width, Math.max(level.height, 1.5) + 0.6, depth]),
    ...level.equipment.map(equipmentBounds),
    ...(level.features ?? []).map(featureBounds),
  ]);
  const box = local ?? boundsFromFootprint([0, 0, 0], [width, 1, depth]);
  return { min: [box.min[0], box.min[1] + level.elevation, box.min[2]], max: [box.max[0], box.max[1] + level.elevation, box.max[2]] };
}

/** The platform's levels in the shape the explode maths works on. */
export function toExplodeLevels(layout: PlatformLayout): ExplodeLevel[] {
  return layout.levels.map((level) => ({ id: level.id, envelope: levelEnvelope(layout, level) }));
}

export function findLevel(layout: PlatformLayout, levelId: string): PlatformLevel | undefined {
  return layout.levels.find((level) => level.id === levelId);
}

/** The level a piece of equipment stands on, with the equipment; `null` for an unknown id. */
export function findPlatformEquipment(layout: PlatformLayout, equipmentId: string): { level: PlatformLevel; equipment: PlantEquipment } | null {
  for (const level of layout.levels) {
    const equipment = level.equipment.find((candidate) => candidate.id === equipmentId);
    if (equipment) return { level, equipment };
  }
  return null;
}

export type PlatformFraming = {
  /** 0–1, how far the levels are separated. */
  explode: number;
  /** Frame this level only; the whole platform when null or unknown. */
  levelId?: string | null;
  /** Canvas width / height. */
  aspect?: number;
  fov?: number;
};

/** The camera target for a platform view: the whole exploded stack, or one level where it now floats. */
export function platformCameraTarget(layout: PlatformLayout, framing: PlatformFraming): CameraTarget {
  const levels = toExplodeLevels(layout);
  const whole = stackBounds(levels, framing.explode, layout.gap) ?? boundsFromFootprint([0, 0, 0], [layout.size[0], 10, layout.size[1]]);
  const level = framing.levelId ? levelBounds(levels, framing.levelId, framing.explode, layout.gap) : null;
  const isJacket = framing.levelId ? findLevel(layout, framing.levelId)?.kind === 'jacket' : false;
  return frameBounds(level ?? whole, {
    view: 'perspective',
    aspect: framing.aspect,
    fov: framing.fov,
    padding: level ? (isJacket ? 0.95 : 0.8) : 0.82,
    minDistance: 30,
  });
}
