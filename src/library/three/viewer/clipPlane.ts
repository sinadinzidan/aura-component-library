import type { Bounds, Vec3 } from '../cameraTargets';

export type ClipAxis = 'x' | 'y' | 'z';

export type ClipState = {
  enabled: boolean;
  axis: ClipAxis;
  /** Position along the axis across the model's bounds, 0–1. */
  position: number;
  /** Keeps the far side instead of the near side. */
  flip: boolean;
};

export const INITIAL_CLIP: ClipState = { enabled: false, axis: 'x', position: 0.5, flip: false };

const AXES: Record<ClipAxis, number> = { x: 0, y: 1, z: 2 };
const NAMES: Record<ClipAxis, string> = { x: 'east–west', y: 'height', z: 'north–south' };

export const clampUnit = (value: number): number => Math.min(1, Math.max(0, value));

/** World position of the plane along its axis. */
export function clipWorldPosition(bounds: Bounds, state: ClipState): number {
  const index = AXES[state.axis];
  return bounds.min[index] + clampUnit(state.position) * (bounds.max[index] - bounds.min[index]);
}

/**
 * A plane in the form three.js takes: `normal · p + constant`, where points with a negative result
 * are clipped. By default the part of the model beyond the plane is removed; `flip` keeps it instead.
 */
export function clipPlaneFor(bounds: Bounds, state: ClipState): { normal: Vec3; constant: number } {
  const position = clipWorldPosition(bounds, state);
  const sign = state.flip ? 1 : -1;
  const normal: Vec3 = state.axis === 'x' ? [sign, 0, 0] : state.axis === 'y' ? [0, sign, 0] : [0, 0, sign];
  return { normal, constant: -sign * position };
}

/** Whether a point survives the clip. Used to say how many parts the plane cuts through. */
export function isKept(point: Vec3, bounds: Bounds, state: ClipState): boolean {
  if (!state.enabled) return true;
  const { normal, constant } = clipPlaneFor(bounds, state);
  return normal[0] * point[0] + normal[1] * point[1] + normal[2] * point[2] + constant >= 0;
}

/** Centre and size of a plane helper that spans the bounds across the clip axis. */
export function clipHelperPose(bounds: Bounds, state: ClipState): { position: Vec3; size: [number, number]; rotation: Vec3 } {
  const at = clipWorldPosition(bounds, state);
  const centre: Vec3 = [(bounds.min[0] + bounds.max[0]) / 2, (bounds.min[1] + bounds.max[1]) / 2, (bounds.min[2] + bounds.max[2]) / 2];
  const extent = (index: number) => bounds.max[index] - bounds.min[index] + 1;
  if (state.axis === 'x') return { position: [at, centre[1], centre[2]], size: [extent(2), extent(1)], rotation: [0, Math.PI / 2, 0] };
  if (state.axis === 'y') return { position: [centre[0], at, centre[2]], size: [extent(0), extent(2)], rotation: [-Math.PI / 2, 0, 0] };
  return { position: [centre[0], centre[1], at], size: [extent(0), extent(1)], rotation: [0, 0, 0] };
}

/** "Section across east–west at 3.2 m, keeping the near side". */
export function describeClip(bounds: Bounds, state: ClipState): string {
  if (!state.enabled) return 'Section plane off';
  const at = Math.round(clipWorldPosition(bounds, state) * 10) / 10;
  return `Section across ${NAMES[state.axis]} at ${at} m, keeping the ${state.flip ? 'far' : 'near'} side`;
}

export type ClipAction = { type: 'enable'; enabled: boolean } | { type: 'axis'; axis: ClipAxis } | { type: 'position'; position: number } | { type: 'flip'; flip: boolean } | { type: 'reset' };

export function clipReducer(state: ClipState, action: ClipAction): ClipState {
  switch (action.type) {
    case 'enable':
      return { ...state, enabled: action.enabled };
    case 'axis':
      return { ...state, axis: action.axis, position: 0.5 };
    case 'position':
      return { ...state, position: clampUnit(action.position) };
    case 'flip':
      return { ...state, flip: action.flip };
    case 'reset':
      return INITIAL_CLIP;
  }
}
