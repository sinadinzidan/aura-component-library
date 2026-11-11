import type { CameraTarget, Vec3 } from '../cameraTargets';

/**
 * A guided tour over a scene: an overview (`stageIndex` −1) and a fixed number of stops in order.
 * The camera follows the tour until the user grabs the scene (`free`); "Resume" hands it back.
 */
export type TourState = {
  /** Current stop, or −1 for the overview before the first stop. */
  stageIndex: number;
  stageCount: number;
  /** `tour`: the camera is on the current stop. `free`: the user is orbiting on their own. */
  mode: 'tour' | 'free';
  /** A unit picked inside the current stop, if any. */
  selectedUnitId: string | null;
  /** Counts camera flights, so returning to an unchanged stop still flies (see `tourFlightTarget`). */
  flights: number;
};

export type TourAction =
  /** Jump to a stop, optionally picking a unit there. Out-of-range indexes are clamped. */
  | { type: 'goTo'; stageIndex: number; unitId?: string | null }
  | { type: 'next' }
  | { type: 'previous' }
  | { type: 'overview' }
  /** The user started orbiting, panning or zooming. */
  | { type: 'detach' }
  /** Fly back to the current stop. */
  | { type: 'resume' };

export function initialTourState(stageCount: number, stageIndex = -1): TourState {
  const count = Math.max(0, Math.floor(stageCount));
  return { stageIndex: clampStage(stageIndex, count), stageCount: count, mode: 'tour', selectedUnitId: null, flights: 0 };
}

function clampStage(index: number, count: number): number {
  if (!Number.isFinite(index)) return -1;
  return Math.min(Math.max(Math.round(index), -1), count - 1);
}

function arrive(state: TourState, stageIndex: number, unitId: string | null): TourState {
  return { ...state, stageIndex, mode: 'tour', selectedUnitId: unitId, flights: state.flights + 1 };
}

export function tourReducer(state: TourState, action: TourAction): TourState {
  switch (action.type) {
    case 'goTo':
      return arrive(state, clampStage(action.stageIndex, state.stageCount), action.unitId ?? null);
    case 'next':
      if (state.stageIndex >= state.stageCount - 1) return state.mode === 'tour' ? state : arrive(state, state.stageIndex, state.selectedUnitId);
      return arrive(state, state.stageIndex + 1, null);
    case 'previous':
      if (state.stageIndex <= -1) return state.mode === 'tour' ? state : arrive(state, -1, null);
      return arrive(state, state.stageIndex - 1, null);
    case 'overview':
      return arrive(state, -1, null);
    case 'detach':
      return state.mode === 'free' ? state : { ...state, mode: 'free' };
    case 'resume':
      return state.mode === 'tour' ? state : arrive(state, state.stageIndex, state.selectedUnitId);
  }
}

export const tourAtStart = (state: TourState): boolean => state.stageIndex <= -1;
export const tourAtEnd = (state: TourState): boolean => state.stageIndex >= state.stageCount - 1;

/** How far along the tour the current stop is: 0 at the overview and first stop, 1 at the last. */
export function tourProgress(state: TourState): number {
  if (state.stageCount <= 1 || state.stageIndex <= 0) return 0;
  return Math.min(1, state.stageIndex / (state.stageCount - 1));
}

/** Where the camera stands for one stop: a point to look at, and where to look from. */
export type TourStop = {
  /** The point the camera looks at. */
  focus: Vec3;
  /** Distance from the focus to the camera. */
  distance: number;
  /** Compass angle of the camera around the focus, in degrees: 0 looks north from the south, 90 looks west from the east. */
  azimuth?: number;
  /** Height angle of the camera above the horizon, in degrees. */
  elevation?: number;
};

const DEGREES = Math.PI / 180;

/** The camera target for a stop. `zoom` above 1 stands further back, e.g. when overlays cover part of the canvas. */
export function tourCameraTarget(stop: TourStop, zoom = 1): CameraTarget {
  const azimuth = (stop.azimuth ?? 30) * DEGREES;
  const elevation = Math.min(89, Math.max(1, stop.elevation ?? 30)) * DEGREES;
  const distance = Math.max(0.001, stop.distance * zoom);
  const flat = Math.cos(elevation) * distance;
  return {
    position: [stop.focus[0] + Math.sin(azimuth) * flat, stop.focus[1] + Math.sin(elevation) * distance, stop.focus[2] + Math.cos(azimuth) * flat],
    lookAt: stop.focus,
  };
}

/** The stop a state is on: one of `stops`, or `overview` before the first and for unknown indexes. */
export function tourStopFor(state: TourState, stops: readonly TourStop[], overview: TourStop): TourStop {
  return stops[state.stageIndex] ?? overview;
}

/**
 * A camera rig only flies when its target changes. This moves the camera position by a hair per
 * flight, so "Resume tour" on an unchanged stop is still a new target and the camera returns.
 */
export function tourFlightTarget(target: CameraTarget, flights: number): CameraTarget {
  const nudge = (flights % 2) * 1e-4;
  return { position: [target.position[0], target.position[1] + nudge, target.position[2]], lookAt: target.lookAt };
}
