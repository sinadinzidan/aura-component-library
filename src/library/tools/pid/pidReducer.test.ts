import { FIT_PADDING, initPidState, pidReducer, pinNumber } from './pidReducer';
import type { PidAction, PidState } from './pidReducer';
import { fitRect, toWorld } from './viewport';

const WORLD = { x: 0, y: 0, width: 1200, height: 600 };
const SIZE = { width: 600, height: 300 };

const run = (state: PidState, ...actions: PidAction[]): PidState => actions.reduce(pidReducer, state);
const start = (): PidState => initPidState({ world: WORLD, size: SIZE });

describe('pidReducer', () => {
  it('starts fitted to the drawing with every layer on', () => {
    const state = start();
    expect(state.viewport).toEqual(fitRect(WORLD, SIZE, FIT_PADDING));
    expect(Object.values(state.layers).every(Boolean)).toBe(true);
    expect(state.selection).toBeNull();
  });

  it('accepts initial layers, pins and a selection', () => {
    const state = initPidState({ world: WORLD, layers: { values: false }, pins: [{ id: 'pin-1', x: 1, y: 2, note: 'Check' }], selection: { kind: 'tag', id: 'a' } });
    expect(state.layers.values).toBe(false);
    expect(state.layers.lines).toBe(true);
    expect(state.nextPinNumber).toBe(2);
    expect(state.selection).toEqual({ kind: 'tag', id: 'a' });
  });

  it('refits on resize until the user moves the view', () => {
    const resized = run(start(), { type: 'resize', size: { width: 1200, height: 600 } });
    expect(resized.viewport).toEqual(fitRect(WORLD, { width: 1200, height: 600 }, FIT_PADDING));
    expect(resized.autoFit).toBe(true);
  });

  it('keeps the centre of the view on resize after the user has panned', () => {
    const panned = run(start(), { type: 'pan', dx: 30, dy: 0 });
    const centreBefore = toWorld(panned.viewport, { x: 300, y: 150 });

    const resized = run(panned, { type: 'resize', size: { width: 800, height: 300 } });

    expect(resized.autoFit).toBe(false);
    expect(resized.viewport.k).toBe(panned.viewport.k);
    expect(toWorld(resized.viewport, { x: 400, y: 150 }).x).toBeCloseTo(centreBefore.x);
  });

  it('ignores a resize to the same size', () => {
    const state = start();
    expect(run(state, { type: 'resize', size: SIZE })).toBe(state);
  });

  it('pans and leaves auto-fit', () => {
    const state = run(start(), { type: 'pan', dx: 40, dy: 20 });
    expect(state.autoFit).toBe(false);
    expect(state.viewport.x).toBeCloseTo(start().viewport.x - 40 / start().viewport.k);
  });

  it('zooms one step about the centre and announces the level', () => {
    const before = start();
    const centre = toWorld(before.viewport, { x: 300, y: 150 });

    const after = run(before, { type: 'zoom', direction: 1 });

    expect(after.viewport.k).toBeCloseTo(before.viewport.k * 1.25);
    expect(toWorld(after.viewport, { x: 300, y: 150 }).x).toBeCloseTo(centre.x);
    expect(after.message).toMatch(/^Zoom \d+%$/);
  });

  it('zooms about a pointer position', () => {
    const before = start();
    const anchor = { x: 100, y: 50 };
    const under = toWorld(before.viewport, anchor);

    const after = run(before, { type: 'zoomBy', factor: 1.5, anchor });

    expect(toWorld(after.viewport, anchor).x).toBeCloseTo(under.x);
    expect(toWorld(after.viewport, anchor).y).toBeCloseTo(under.y);
  });

  it('zooms to a percentage and stops at the limits', () => {
    expect(run(start(), { type: 'zoomTo', percent: 200 }).viewport.k).toBe(2);
    expect(run(start(), { type: 'zoomTo', percent: 900 }).viewport.k).toBe(4);
  });

  it('looks at a world point, at the current scale unless one is given', () => {
    const state = run(start(), { type: 'lookAt', centre: { x: 600, y: 300 }, k: 2, announce: 'Showing 23-KA-9101' });
    expect(state.viewport.k).toBe(2);
    expect(toWorld(state.viewport, { x: 300, y: 150 })).toEqual({ x: 600, y: 300 });
    expect(state.message).toBe('Showing 23-KA-9101');

    const moved = run(state, { type: 'lookAt', centre: { x: 100, y: 100 } });
    expect(moved.viewport.k).toBe(2);
    expect(toWorld(moved.viewport, { x: 300, y: 150 })).toEqual({ x: 100, y: 100 });
  });

  it('fits the drawing again on request', () => {
    const state = run(start(), { type: 'zoomTo', percent: 300 }, { type: 'pan', dx: 100, dy: 0 }, { type: 'fit' });
    expect(state.viewport).toEqual(start().viewport);
    expect(state.autoFit).toBe(true);
    expect(state.message).toBe('Drawing fitted to view');
  });

  it('never pans the drawing fully out of view', () => {
    const state = run(start(), { type: 'pan', dx: -100000, dy: 0 });
    const right = (WORLD.width - state.viewport.x) * state.viewport.k;
    expect(right).toBeGreaterThan(0);
  });

  it('selects, announces and clears', () => {
    const selected = run(start(), { type: 'select', selection: { kind: 'tag', id: 'pt' }, announce: 'Showing 23-PT-92531' });
    expect(selected.selection).toEqual({ kind: 'tag', id: 'pt' });
    expect(selected.message).toBe('Showing 23-PT-92531');
    expect(run(selected, { type: 'select', selection: null }).message).toBe('Selection cleared');
  });

  it('toggles a layer and says so', () => {
    const state = run(start(), { type: 'toggleLayer', layer: 'values' });
    expect(state.layers.values).toBe(false);
    expect(state.message).toBe('Live values hidden');
    expect(run(state, { type: 'toggleLayer', layer: 'values' }).message).toBe('Live values shown');
  });

  it('adds a pin, selects it, leaves pin mode and shows annotations', () => {
    const state = run(start(), { type: 'toggleLayer', layer: 'annotations' }, { type: 'setPinMode', on: true }, { type: 'addPin', x: 100.4, y: 50.6 });
    expect(state.pins).toEqual([{ id: 'pin-1', x: 100, y: 51, note: '' }]);
    expect(state.selection).toEqual({ kind: 'pin', id: 'pin-1' });
    expect(state.pinMode).toBe(false);
    expect(state.layers.annotations).toBe(true);
    expect(state.message).toBe('Pin 1 added');
  });

  it('numbers pins without reusing a removed number', () => {
    const state = run(start(), { type: 'addPin', x: 1, y: 1 }, { type: 'removePin', id: 'pin-1' }, { type: 'addPin', x: 2, y: 2 });
    expect(state.pins.map((pin) => pin.id)).toEqual(['pin-2']);
    expect(pinNumber(state.pins[0])).toBe('2');
  });

  it('edits a pin note in place', () => {
    const state = run(start(), { type: 'addPin', x: 1, y: 1 }, { type: 'editPin', id: 'pin-1', note: 'Check gasket' });
    expect(state.pins[0].note).toBe('Check gasket');
    expect(state.pinPast).toHaveLength(1);
  });

  it('removes a pin and clears its selection', () => {
    const state = run(start(), { type: 'addPin', x: 1, y: 1 }, { type: 'removePin', id: 'pin-1' });
    expect(state.pins).toEqual([]);
    expect(state.selection).toBeNull();
    expect(run(state, { type: 'removePin', id: 'missing' })).toBe(state);
  });

  it('undoes pin changes one at a time', () => {
    const added = run(start(), { type: 'addPin', x: 1, y: 1 }, { type: 'addPin', x: 2, y: 2 });
    const removed = run(added, { type: 'removePin', id: 'pin-1' });

    const undone = run(removed, { type: 'undoPins' });
    expect(undone.pins.map((pin) => pin.id)).toEqual(['pin-1', 'pin-2']);

    const undoneTwice = run(undone, { type: 'undoPins' });
    expect(undoneTwice.pins.map((pin) => pin.id)).toEqual(['pin-1']);
    expect(undoneTwice.selection).toBeNull();
  });

  it('does nothing when there is no pin change to undo', () => {
    const state = start();
    expect(run(state, { type: 'undoPins' })).toBe(state);
  });
});
