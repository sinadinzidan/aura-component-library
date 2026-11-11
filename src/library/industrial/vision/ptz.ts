/** State and commands of a pan-tilt-zoom camera. Angles are in degrees, zoom is a multiplier. */

export type PtzState = { pan: number; tilt: number; zoom: number };

export const PTZ_LIMITS = { panMin: -170, panMax: 170, tiltMin: -30, tiltMax: 90, zoomMin: 1, zoomMax: 20 } as const;

export const PTZ_HOME: PtzState = { pan: 0, tilt: 0, zoom: 1 };

export type PtzPreset = { id: string; name: string; state: PtzState };

export type PtzAction =
  | { type: 'pan'; by: number }
  | { type: 'tilt'; by: number }
  | { type: 'zoom'; by: number }
  | { type: 'preset'; state: PtzState }
  | { type: 'home' };

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export function clampPtz(state: PtzState): PtzState {
  return {
    pan: clamp(state.pan, PTZ_LIMITS.panMin, PTZ_LIMITS.panMax),
    tilt: clamp(state.tilt, PTZ_LIMITS.tiltMin, PTZ_LIMITS.tiltMax),
    zoom: clamp(state.zoom, PTZ_LIMITS.zoomMin, PTZ_LIMITS.zoomMax),
  };
}

/** Slower moves when zoomed in: a degree of pan matters more at 10× than at 1×. */
export function panTiltStep(zoom: number, base = 10): number {
  return Math.max(1, Math.round(base / Math.max(1, zoom) ** 0.5));
}

export function ptzReducer(state: PtzState, action: PtzAction): PtzState {
  switch (action.type) {
    case 'pan':
      return clampPtz({ ...state, pan: state.pan + action.by });
    case 'tilt':
      return clampPtz({ ...state, tilt: state.tilt + action.by });
    case 'zoom':
      return clampPtz({ ...state, zoom: Math.round((state.zoom + action.by) * 10) / 10 });
    case 'preset':
      return clampPtz(action.state);
    case 'home':
      return PTZ_HOME;
  }
}

export const samePtz = (a: PtzState, b: PtzState): boolean => a.pan === b.pan && a.tilt === b.tilt && a.zoom === b.zoom;

/** The preset the camera is currently on, if any. */
export function activePreset(state: PtzState, presets: readonly PtzPreset[]): PtzPreset | null {
  return presets.find((preset) => samePtz(clampPtz(preset.state), state)) ?? null;
}

/** Whether a move would change anything, so the button can say why it is disabled. */
export function atLimit(state: PtzState, axis: 'pan' | 'tilt' | 'zoom', direction: 1 | -1): boolean {
  const range = {
    pan: [PTZ_LIMITS.panMin, PTZ_LIMITS.panMax],
    tilt: [PTZ_LIMITS.tiltMin, PTZ_LIMITS.tiltMax],
    zoom: [PTZ_LIMITS.zoomMin, PTZ_LIMITS.zoomMax],
  }[axis];
  return direction === 1 ? state[axis] >= range[1] : state[axis] <= range[0];
}

export function describePtz(state: PtzState): string {
  const signed = (value: number) => `${value > 0 ? '+' : ''}${value}`;
  return `Pan ${signed(state.pan)}°, tilt ${signed(state.tilt)}°, zoom ${state.zoom}×`;
}
