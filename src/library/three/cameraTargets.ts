/** A point or size in scene units: x east, y up, z south. */
export type Vec3 = readonly [number, number, number];

/** An axis-aligned box. */
export type Bounds = { min: Vec3; max: Vec3 };

/** Where the camera stands and what it looks at. `CameraRig` flies between these. */
export type CameraTarget = { position: Vec3; lookAt: Vec3 };

export type CameraView = 'perspective' | 'top' | 'isometric';

/** Direction from the subject towards the camera, per view preset. */
export const VIEW_DIRECTIONS: Record<CameraView, Vec3> = {
  perspective: [0.42, 0.52, 0.74],
  // Not exactly vertical, so orbit controls keep a stable "north is up" orientation.
  top: [0, 1, 0.012],
  isometric: [1, 0.82, 1],
};

export const addVec3 = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const scaleVec3 = (a: Vec3, factor: number): Vec3 => [a[0] * factor, a[1] * factor, a[2] * factor];
export const lengthVec3 = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);

/** Unit vector; a zero vector becomes straight up. */
export function normalizeVec3(a: Vec3): Vec3 {
  const length = lengthVec3(a);
  return length === 0 ? [0, 1, 0] : scaleVec3(a, 1 / length);
}

export function lerpVec3(from: Vec3, to: Vec3, t: number): Vec3 {
  return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t, from[2] + (to[2] - from[2]) * t];
}

/** Slow start, slow stop. Input and output are clamped to 0–1. */
export function easeInOutCubic(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return clamped < 0.5 ? 4 * clamped ** 3 : 1 - (-2 * clamped + 2) ** 3 / 2;
}

/** The camera pose `progress` (0–1, eased) of the way from one target to another. */
export function interpolateTarget(from: CameraTarget, to: CameraTarget, progress: number): CameraTarget {
  const eased = easeInOutCubic(progress);
  return { position: lerpVec3(from.position, to.position, eased), lookAt: lerpVec3(from.lookAt, to.lookAt, eased) };
}

export function sameTarget(a: CameraTarget, b: CameraTarget): boolean {
  return a.position.every((value, index) => value === b.position[index]) && a.lookAt.every((value, index) => value === b.lookAt[index]);
}

export function boundsCenter(bounds: Bounds): Vec3 {
  return [(bounds.min[0] + bounds.max[0]) / 2, (bounds.min[1] + bounds.max[1]) / 2, (bounds.min[2] + bounds.max[2]) / 2];
}

export function boundsSize(bounds: Bounds): Vec3 {
  return [bounds.max[0] - bounds.min[0], bounds.max[1] - bounds.min[1], bounds.max[2] - bounds.min[2]];
}

/** Radius of the sphere that encloses the box. */
export function boundsRadius(bounds: Bounds): number {
  return lengthVec3(boundsSize(bounds)) / 2;
}

/** The smallest box containing all the given boxes; `null` for none. */
export function unionBounds(boxes: readonly Bounds[]): Bounds | null {
  if (boxes.length === 0) return null;
  return boxes.slice(1).reduce<Bounds>(
    (union, box) => ({
      min: [Math.min(union.min[0], box.min[0]), Math.min(union.min[1], box.min[1]), Math.min(union.min[2], box.min[2])],
      max: [Math.max(union.max[0], box.max[0]), Math.max(union.max[1], box.max[1]), Math.max(union.max[2], box.max[2])],
    }),
    boxes[0]
  );
}

/** A box from its centre on the ground and its size. */
export function boundsFromFootprint(center: Vec3, size: Vec3): Bounds {
  return {
    min: [center[0] - size[0] / 2, center[1], center[2] - size[2] / 2],
    max: [center[0] + size[0] / 2, center[1] + size[1], center[2] + size[2] / 2],
  };
}

/** How far a camera with the given vertical field of view must stand to see a sphere of `radius`. */
export function distanceToFit(radius: number, fovDegrees: number, aspect = 1): number {
  const vertical = (fovDegrees * Math.PI) / 180;
  const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * aspect);
  const limiting = Math.min(vertical, horizontal);
  return radius / Math.sin(limiting / 2);
}

export type FrameOptions = {
  view?: CameraView;
  /** Vertical field of view of the camera, in degrees. */
  fov?: number;
  /** Canvas width / height. */
  aspect?: number;
  /** Multiplier on the fitting distance: above 1 leaves air around the subject. */
  padding?: number;
  /** Never stand closer than this, so small subjects keep some context. */
  minDistance?: number;
};

/** The camera target that frames a box from a view preset. */
export function frameBounds(bounds: Bounds, options: FrameOptions = {}): CameraTarget {
  const { view = 'perspective', fov = 40, aspect = 1.6, padding = 1.1, minDistance = 0 } = options;
  const lookAt = boundsCenter(bounds);
  const distance = Math.max(minDistance, distanceToFit(boundsRadius(bounds), fov, aspect) * padding);
  const direction = normalizeVec3(VIEW_DIRECTIONS[view]);
  return { position: addVec3(lookAt, scaleVec3(direction, distance)), lookAt };
}
