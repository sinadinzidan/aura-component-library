import type { Vec3 } from '../cameraTargets';

/** One primitive of a wireframe model. The model's axis is y; boxes use `width` and `depth`. */
export type WireframePart = {
  id: string;
  shape: 'cylinder' | 'box';
  center: Vec3;
  height: number;
  /** Cylinders: radius at the bottom, and at the top unless `radiusTop` is set. */
  radius?: number;
  radiusTop?: number;
  /** Boxes: size across x and z. */
  width?: number;
  depth?: number;
  segments?: number;
};

/** The stretch of the scan axis a part occupies, and how wide it is there. */
export type ScanSlice = { id: string; from: number; to: number; radius: number };

/** Half the width of a part across the scan axis. */
export function partRadius(part: WireframePart): number {
  if (part.shape === 'box') return Math.hypot(part.width ?? 0, part.depth ?? 0) / 2;
  return Math.max(part.radius ?? 0, part.radiusTop ?? part.radius ?? 0);
}

export function partSlice(part: WireframePart): ScanSlice {
  return { id: part.id, from: part.center[1] - part.height / 2, to: part.center[1] + part.height / 2, radius: partRadius(part) };
}

/** The slices a plane at `height` passes through, lowest first. */
export function slicesAt(slices: readonly ScanSlice[], height: number): ScanSlice[] {
  return slices.filter((slice) => height >= slice.from && height <= slice.to).sort((a, b) => a.from - b.from);
}

/** Radius of the cross-section a plane at `height` cuts: the widest part it passes, or `null` in a gap. */
export function sectionRadiusAt(slices: readonly ScanSlice[], height: number): number | null {
  const hit = slicesAt(slices, height);
  return hit.length === 0 ? null : Math.max(...hit.map((slice) => slice.radius));
}

/** The lowest and highest point of a set of slices. */
export function scanRange(slices: readonly ScanSlice[]): { min: number; max: number } {
  if (slices.length === 0) return { min: 0, max: 0 };
  return { min: Math.min(...slices.map((slice) => slice.from)), max: Math.max(...slices.map((slice) => slice.to)) };
}

/** Position of a sweep (0–1) that runs up and back down once per `period` seconds. */
export function sweepFraction(elapsed: number, period: number): number {
  if (period <= 0) return 0;
  const phase = (((elapsed % period) + period) % period) / period;
  return phase < 0.5 ? phase * 2 : 2 - phase * 2;
}

/** Height on the scan axis for a sweep fraction. */
export function scanHeight(range: { min: number; max: number }, fraction: number): number {
  return range.min + (range.max - range.min) * Math.min(1, Math.max(0, fraction));
}

/** Rounds a fraction to one of `steps` positions, so a moving sweep only reports real changes. */
export function quantizeFraction(fraction: number, steps = 100): number {
  return Math.round(Math.min(1, Math.max(0, fraction)) * steps) / steps;
}

/** Where the scan plane is and whether it sweeps by itself. */
export type ScanState = { scan: number; auto: boolean };

export type ScanAction =
  /** The sweep reports its position. Ignored once the sweep is off, so a late report cannot undo a manual move. */
  | { type: 'sweep'; fraction: number }
  /** Someone placed the plane by hand: the sweep stops there. */
  | { type: 'moveTo'; fraction: number }
  | { type: 'setAuto'; auto: boolean };

export function scanReducer(state: ScanState, action: ScanAction): ScanState {
  switch (action.type) {
    case 'sweep':
      return state.auto ? { ...state, scan: Math.min(1, Math.max(0, action.fraction)) } : state;
    case 'moveTo':
      return { scan: Math.min(1, Math.max(0, action.fraction)), auto: false };
    case 'setAuto':
      return { ...state, auto: action.auto };
  }
}
