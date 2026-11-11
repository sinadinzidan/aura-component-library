import { PTZ_HOME, PTZ_LIMITS, activePreset, atLimit, clampPtz, describePtz, panTiltStep, ptzReducer, samePtz } from './ptz';

describe('ptzReducer', () => {
  it('pans, tilts and zooms by the given amount', () => {
    let state = ptzReducer(PTZ_HOME, { type: 'pan', by: 20 });
    state = ptzReducer(state, { type: 'tilt', by: -10 });
    state = ptzReducer(state, { type: 'zoom', by: 2 });
    expect(state).toEqual({ pan: 20, tilt: -10, zoom: 3 });
  });

  it('stops at the mechanical limits', () => {
    expect(ptzReducer(PTZ_HOME, { type: 'pan', by: 999 }).pan).toBe(PTZ_LIMITS.panMax);
    expect(ptzReducer(PTZ_HOME, { type: 'pan', by: -999 }).pan).toBe(PTZ_LIMITS.panMin);
    expect(ptzReducer(PTZ_HOME, { type: 'tilt', by: 999 }).tilt).toBe(PTZ_LIMITS.tiltMax);
    expect(ptzReducer(PTZ_HOME, { type: 'zoom', by: -5 }).zoom).toBe(PTZ_LIMITS.zoomMin);
    expect(ptzReducer(PTZ_HOME, { type: 'zoom', by: 99 }).zoom).toBe(PTZ_LIMITS.zoomMax);
  });

  it('avoids floating point drift when zooming in tenths', () => {
    let state = PTZ_HOME;
    for (let index = 0; index < 3; index += 1) state = ptzReducer(state, { type: 'zoom', by: 0.1 });
    expect(state.zoom).toBe(1.3);
  });

  it('recalls a preset, clamped, and goes home', () => {
    expect(ptzReducer(PTZ_HOME, { type: 'preset', state: { pan: 400, tilt: 10, zoom: 4 } })).toEqual({ pan: 170, tilt: 10, zoom: 4 });
    expect(ptzReducer({ pan: 5, tilt: 5, zoom: 5 }, { type: 'home' })).toEqual(PTZ_HOME);
  });
});

describe('ptz helpers', () => {
  it('moves in smaller steps when zoomed in', () => {
    expect(panTiltStep(1)).toBe(10);
    expect(panTiltStep(16)).toBe(3);
    expect(panTiltStep(400)).toBe(1);
  });

  it('compares states and finds the active preset', () => {
    const presets = [{ id: 'a', name: 'Pump bay', state: { pan: 30, tilt: 5, zoom: 2 } }];
    expect(samePtz(PTZ_HOME, PTZ_HOME)).toBe(true);
    expect(activePreset({ pan: 30, tilt: 5, zoom: 2 }, presets)?.id).toBe('a');
    expect(activePreset(PTZ_HOME, presets)).toBeNull();
  });

  it('knows when a move is at its limit', () => {
    expect(atLimit({ pan: 170, tilt: 0, zoom: 1 }, 'pan', 1)).toBe(true);
    expect(atLimit({ pan: 170, tilt: 0, zoom: 1 }, 'pan', -1)).toBe(false);
    expect(atLimit(PTZ_HOME, 'zoom', -1)).toBe(true);
    expect(atLimit({ pan: 0, tilt: 90, zoom: 1 }, 'tilt', 1)).toBe(true);
  });

  it('clamps and describes a state', () => {
    expect(clampPtz({ pan: 500, tilt: -500, zoom: 0 })).toEqual({ pan: 170, tilt: -30, zoom: 1 });
    expect(describePtz({ pan: 20, tilt: -5, zoom: 3 })).toBe('Pan +20°, tilt -5°, zoom 3×');
  });
});
