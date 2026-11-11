import { addVec3, boundsCenter, boundsRadius, distanceToFit, normalizeVec3, scaleVec3 } from '../cameraTargets';
import type { Bounds, CameraTarget, Vec3 } from '../cameraTargets';

/** The six faces of a view cube, with the direction from the subject towards a camera that looks at that face. */
export type CubeFaceId = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom';

export type CubeFace = {
  id: CubeFaceId;
  label: string;
  /** From the subject towards the camera. x east, y up, z south: "front" is seen from the south. */
  direction: Vec3;
  /** The camera never goes below the ground, so the bottom face is shown but cannot be chosen. */
  reachable: boolean;
};

/** Top and bottom are tilted a hair off vertical so orbit controls keep a stable "north is up". */
export const CUBE_FACES: readonly CubeFace[] = [
  { id: 'front', label: 'Front', direction: [0, 0.12, 1], reachable: true },
  { id: 'back', label: 'Back', direction: [0, 0.12, -1], reachable: true },
  { id: 'left', label: 'Left', direction: [-1, 0.12, 0], reachable: true },
  { id: 'right', label: 'Right', direction: [1, 0.12, 0], reachable: true },
  { id: 'top', label: 'Top', direction: [0, 1, 0.012], reachable: true },
  { id: 'bottom', label: 'Bottom', direction: [0, -1, 0.012], reachable: false },
];

export const findFace = (id: CubeFaceId): CubeFace => CUBE_FACES.find((face) => face.id === id) ?? CUBE_FACES[0];

export type ViewAngles = { azimuth: number; elevation: number };

const DEGREES = 180 / Math.PI;

/** Azimuth (0° from the south, growing towards the east) and elevation (0° level, 90° from above) of a camera direction. */
export function anglesFromDirection(direction: Vec3): ViewAngles {
  const [x, y, z] = normalizeVec3(direction);
  return { azimuth: Math.atan2(x, z) * DEGREES, elevation: Math.asin(Math.max(-1, Math.min(1, y))) * DEGREES };
}

export function directionFromAngles(angles: ViewAngles): Vec3 {
  const azimuth = angles.azimuth / DEGREES;
  const elevation = angles.elevation / DEGREES;
  return [Math.sin(azimuth) * Math.cos(elevation), Math.sin(elevation), Math.cos(azimuth) * Math.cos(elevation)];
}

/** The direction from the subject to the camera, from a camera pose. */
export function directionOfPose(pose: CameraTarget): Vec3 {
  return normalizeVec3([pose.position[0] - pose.lookAt[0], pose.position[1] - pose.lookAt[1], pose.position[2] - pose.lookAt[2]]);
}

/** CSS transform that turns a cube the way the scene is turned, so it shows what the camera sees. */
export function cubeTransform(angles: ViewAngles): string {
  const round = (value: number) => Math.round(value * 10) / 10;
  return `rotateX(${round(-angles.elevation)}deg) rotateY(${round(-angles.azimuth)}deg)`;
}

/** Cosine of the largest angle at which a face still counts as the one being looked at. */
const ACTIVE_FACE_COSINE = Math.cos((35 * Math.PI) / 180);

/** The outward normal of each face of the cube, unlike `direction`, which is tilted a hair for stable orbit controls. */
const FACE_NORMALS: Record<CubeFaceId, Vec3> = { front: [0, 0, 1], back: [0, 0, -1], left: [-1, 0, 0], right: [1, 0, 0], top: [0, 1, 0], bottom: [0, -1, 0] };

/** Whether a face turns towards a camera in the given direction (from the subject to the camera). */
export function isFacingCamera(face: CubeFaceId, direction: Vec3): boolean {
  const normal = FACE_NORMALS[face];
  return normal[0] * direction[0] + normal[1] * direction[1] + normal[2] * direction[2] > 0.05;
}

/** The face the camera looks at most squarely, or `null` when it is between faces (an oblique view). */
export function activeFace(direction: Vec3): CubeFaceId | null {
  const unit = normalizeVec3(direction);
  let best: CubeFaceId | null = null;
  let bestCosine = ACTIVE_FACE_COSINE;
  for (const face of CUBE_FACES) {
    const target = normalizeVec3(face.direction);
    const cosine = unit[0] * target[0] + unit[1] * target[1] + unit[2] * target[2];
    if (cosine > bestCosine) {
      bestCosine = cosine;
      best = face.id;
    }
  }
  return best;
}

export type ViewPresetId = 'top' | 'front' | 'side' | 'iso';

export type ViewPreset = { id: ViewPresetId; label: string; direction: Vec3; shortcut: string };

export const VIEW_PRESETS: readonly ViewPreset[] = [
  { id: 'top', label: 'Top', direction: [0, 1, 0.012], shortcut: '1' },
  { id: 'front', label: 'Front', direction: [0, 0.12, 1], shortcut: '2' },
  { id: 'side', label: 'Side', direction: [1, 0.12, 0], shortcut: '3' },
  { id: 'iso', label: 'Isometric', direction: [1, 0.82, 1], shortcut: '4' },
];

export const findPreset = (id: ViewPresetId): ViewPreset => VIEW_PRESETS.find((preset) => preset.id === id) ?? VIEW_PRESETS[3];

export type FrameOptions = { fov?: number; aspect?: number; padding?: number };

/** The camera pose that frames a box from a given direction. */
export function frameFromDirection(bounds: Bounds, direction: Vec3, options: FrameOptions = {}): CameraTarget {
  const { fov = 40, aspect = 1.6, padding = 1.15 } = options;
  const lookAt = boundsCenter(bounds);
  const distance = distanceToFit(boundsRadius(bounds), fov, aspect) * padding;
  return { position: addVec3(lookAt, scaleVec3(normalizeVec3(direction), distance)), lookAt };
}

/** The preset's pose for a box. */
export const presetTarget = (bounds: Bounds, id: ViewPresetId, options?: FrameOptions): CameraTarget => frameFromDirection(bounds, findPreset(id).direction, options);

/** The face's pose for a box. */
export const faceTarget = (bounds: Bounds, id: CubeFaceId, options?: FrameOptions): CameraTarget => frameFromDirection(bounds, findFace(id).direction, options);

/** Camera description for a viewpoint list or announcements: "From the front, 12° above". */
export function describeView(direction: Vec3): string {
  const face = activeFace(direction);
  const { azimuth, elevation } = anglesFromDirection(direction);
  const name = face ? `From the ${face === 'top' ? 'top' : face}` : `Oblique, ${Math.round(((azimuth % 360) + 360) % 360)}° round`;
  return face === 'top' || face === 'bottom' ? name : `${name}, ${Math.round(elevation)}° above`;
}
