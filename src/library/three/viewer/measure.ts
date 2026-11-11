import type { Vec3 } from '../cameraTargets';

/** Point-to-point measurement: two picked points, the straight-line distance and its components. */
export type MeasureState = { points: readonly Vec3[] };

export type MeasureAction = { type: 'pick'; point: Vec3 } | { type: 'undo' } | { type: 'clear' };

export const INITIAL_MEASURE: MeasureState = { points: [] };

/** A third pick starts a new measurement from that point. */
export function measureReducer(state: MeasureState, action: MeasureAction): MeasureState {
  switch (action.type) {
    case 'pick':
      return { points: state.points.length >= 2 ? [action.point] : [...state.points, action.point] };
    case 'undo':
      return { points: state.points.slice(0, -1) };
    case 'clear':
      return state.points.length === 0 ? state : INITIAL_MEASURE;
  }
}

export function distanceBetween(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

export type Measurement = {
  distance: number;
  /** Per-axis differences, absolute: east–west, height, north–south. */
  dx: number;
  dy: number;
  dz: number;
  /** Distance in the ground plane. */
  horizontal: number;
  midpoint: Vec3;
};

/** The measurement once two points are picked; `null` before. */
export function measurementOf(state: MeasureState): Measurement | null {
  if (state.points.length < 2) return null;
  const [a, b] = state.points;
  const dx = Math.abs(a[0] - b[0]);
  const dy = Math.abs(a[1] - b[1]);
  const dz = Math.abs(a[2] - b[2]);
  return { distance: distanceBetween(a, b), dx, dy, dz, horizontal: Math.hypot(dx, dz), midpoint: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2] };
}

/** "4.82 m" for metres; under a metre in millimetres: "640 mm". */
export function formatLength(metres: number): string {
  if (metres < 1) return `${Math.round(metres * 1000)} mm`;
  return `${(Math.round(metres * 100) / 100).toFixed(2)} m`;
}

/** What to tell the user next, for the live region and the readout. */
export function measureHint(state: MeasureState): string {
  if (state.points.length === 0) return 'Pick the first point on the model.';
  if (state.points.length === 1) return 'Pick the second point.';
  const measurement = measurementOf(state);
  return measurement ? `Distance ${formatLength(measurement.distance)}.` : '';
}
