import { addVec3, distanceToFit, normalizeVec3, scaleVec3 } from '../cameraTargets';
import type { CameraTarget, Vec3 } from '../cameraTargets';

export type WellFieldView = 'perspective' | 'section' | 'plan';

/** Direction from the subsurface block towards the camera, per view. */
export const WELL_FIELD_VIEW_DIRECTIONS: Record<WellFieldView, Vec3> = {
  perspective: [0.5, 0.27, 0.82],
  // Almost level, looking north: a cross-section with depth straight down.
  section: [0, 0.04, 1],
  // Not exactly vertical, so orbit controls keep north up.
  plan: [0, 1, 0.012],
};

export type WellFieldBlock = {
  /** Half the width of the block on the map, in scene units. */
  halfExtent: number;
  /** Depth of the block below the seabed, in scene units. */
  depth: number;
};

/** The camera target that frames a subsurface block (seabed at y = 0, extending down) from a view preset. */
export function wellFieldCameraTarget(
  view: WellFieldView,
  block: WellFieldBlock,
  options: { fov?: number; aspect?: number; padding?: number } = {}
): CameraTarget {
  const { fov = 40, aspect = 1.4, padding = 1 } = options;
  const lookAt: Vec3 = [0, -block.depth / 2, 0];
  const radius =
    view === 'plan'
      ? Math.hypot(block.halfExtent, block.halfExtent)
      : view === 'section'
        ? Math.hypot(block.halfExtent, block.depth / 2)
        : Math.hypot(block.halfExtent, block.halfExtent, block.depth / 2);
  const distance = distanceToFit(radius, fov, aspect) * padding;
  return { position: addVec3(lookAt, scaleVec3(normalizeVec3(WELL_FIELD_VIEW_DIRECTIONS[view]), distance)), lookAt };
}
