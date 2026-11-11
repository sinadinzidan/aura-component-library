import { INITIAL_LINKED_SELECTION, hoverTagOn, linkedSelectionReducer, primaryTag } from './linkedSelection';
import type { LinkedSelectionAction, LinkedSelectionState } from './linkedSelection';

const run = (actions: LinkedSelectionAction[], from: LinkedSelectionState = INITIAL_LINKED_SELECTION): LinkedSelectionState =>
  actions.reduce(linkedSelectionReducer, from);

describe(linkedSelectionReducer.name, () => {
  it('starts synced, following and with nothing selected', () => {
    expect(INITIAL_LINKED_SELECTION.selected).toEqual({ drawing: null, scene: null });
    expect(INITIAL_LINKED_SELECTION.sync).toBe(true);
    expect(INITIAL_LINKED_SELECTION.follow).toBe(true);
  });

  it('selects on both sides and frames the item when synced', () => {
    const state = run([{ type: 'select', side: 'drawing', tag: '23-KA-9101' }]);

    expect(state.selected).toEqual({ drawing: '23-KA-9101', scene: '23-KA-9101' });
    expect(state.focusTag).toBe('23-KA-9101');
    expect(state.origin).toBe('drawing');
  });

  it('selects from the scene side too', () => {
    const state = run([{ type: 'select', side: 'scene', tag: '23-HA-9114' }]);

    expect(state.selected.drawing).toBe('23-HA-9114');
    expect(state.origin).toBe('scene');
  });

  it('clears the selection when the selected tag is selected again', () => {
    const state = run([
      { type: 'select', side: 'drawing', tag: '23-KA-9101' },
      { type: 'select', side: 'scene', tag: '23-KA-9101' },
    ]);

    expect(state.selected).toEqual({ drawing: null, scene: null });
    expect(state.focusTag).toBeNull();
    expect(state.origin).toBeNull();
  });

  it('keeps the sides independent with sync off', () => {
    const state = run([
      { type: 'setSync', value: false },
      { type: 'select', side: 'drawing', tag: '23-KA-9101' },
      { type: 'select', side: 'scene', tag: '23-HA-9114' },
    ]);

    expect(state.selected).toEqual({ drawing: '23-KA-9101', scene: '23-HA-9114' });
    expect(state.focusTag).toBe('23-HA-9114');
  });

  it('does not move the camera for a drawing selection with sync off', () => {
    const state = run([
      { type: 'setSync', value: false },
      { type: 'select', side: 'drawing', tag: '23-KA-9101' },
    ]);

    expect(state.focusTag).toBeNull();
  });

  it('copies the most recent selection across when sync is turned on', () => {
    const state = run([
      { type: 'setSync', value: false },
      { type: 'select', side: 'drawing', tag: '23-KA-9101' },
      { type: 'select', side: 'scene', tag: '23-HA-9114' },
      { type: 'setSync', value: true },
    ]);

    expect(state.selected).toEqual({ drawing: '23-HA-9114', scene: '23-HA-9114' });
    expect(state.focusTag).toBe('23-HA-9114');
  });

  it('uses the other side when the leading side has no selection', () => {
    const state = run([
      { type: 'setSync', value: false },
      { type: 'select', side: 'scene', tag: '23-HA-9114' },
      { type: 'select', side: 'scene', tag: '23-HA-9114' },
      { type: 'select', side: 'drawing', tag: '23-KA-9102' },
      { type: 'select', side: 'drawing', tag: '23-KA-9102' },
      { type: 'select', side: 'scene', tag: '23-GT-9001' },
      { type: 'hover', side: 'drawing', tag: '23-KA-9102' },
      { type: 'setSync', value: true },
    ]);

    expect(state.selected.drawing).toBe('23-GT-9001');
  });

  it('leaves the camera where it is with follow off', () => {
    const state = run([
      { type: 'select', side: 'drawing', tag: '23-KA-9101' },
      { type: 'setFollow', value: false },
      { type: 'select', side: 'drawing', tag: '23-HA-9114' },
    ]);

    expect(state.selected.scene).toBe('23-HA-9114');
    expect(state.focusTag).toBe('23-KA-9101');
  });

  it('frames the current selection when follow is turned back on', () => {
    const state = run([
      { type: 'setFollow', value: false },
      { type: 'select', side: 'scene', tag: '23-HA-9114' },
      { type: 'setFollow', value: true },
    ]);

    expect(state.focusTag).toBe('23-HA-9114');
  });

  it('tracks the hovered tag and the side it is on', () => {
    const state = run([{ type: 'hover', side: 'scene', tag: '23-KA-9102' }]);

    expect(state.hover).toEqual({ tag: '23-KA-9102', side: 'scene' });
  });

  it('only clears a hover from the side that owns it', () => {
    const hovered = run([{ type: 'hover', side: 'scene', tag: '23-KA-9102' }]);

    expect(linkedSelectionReducer(hovered, { type: 'hover', side: 'drawing', tag: null })).toBe(hovered);
    expect(linkedSelectionReducer(hovered, { type: 'hover', side: 'scene', tag: null }).hover).toBeNull();
  });

  it('toggles the drawing-only filter without touching the selection', () => {
    const state = run([
      { type: 'select', side: 'drawing', tag: '23-KA-9101' },
      { type: 'setDrawingOnly', value: true },
    ]);

    expect(state.drawingOnly).toBe(true);
    expect(state.selected.scene).toBe('23-KA-9101');
  });

  it('clears selection, hover and camera focus', () => {
    const state = run([
      { type: 'select', side: 'drawing', tag: '23-KA-9101' },
      { type: 'hover', side: 'drawing', tag: '23-HA-9114' },
      { type: 'clear' },
    ]);

    expect(state.selected).toEqual({ drawing: null, scene: null });
    expect(state.hover).toBeNull();
    expect(state.focusTag).toBeNull();
  });

  it('keeps the camera on clear with follow off', () => {
    const state = run([
      { type: 'select', side: 'drawing', tag: '23-KA-9101' },
      { type: 'setFollow', value: false },
      { type: 'clear' },
    ]);

    expect(state.focusTag).toBe('23-KA-9101');
  });
});

describe(hoverTagOn.name, () => {
  const hovered = run([{ type: 'hover', side: 'drawing', tag: '23-KA-9102' }]);

  it('cross-highlights while synced', () => {
    expect(hoverTagOn(hovered, 'drawing')).toBe('23-KA-9102');
    expect(hoverTagOn(hovered, 'scene')).toBe('23-KA-9102');
  });

  it('stays on its own side with sync off', () => {
    const state = linkedSelectionReducer(hovered, { type: 'setSync', value: false });

    expect(hoverTagOn(state, 'drawing')).toBe('23-KA-9102');
    expect(hoverTagOn(state, 'scene')).toBeNull();
  });

  it('is null without a hover', () => {
    expect(hoverTagOn(INITIAL_LINKED_SELECTION, 'scene')).toBeNull();
  });
});

describe(primaryTag.name, () => {
  it('describes the side used last', () => {
    const state = run([
      { type: 'setSync', value: false },
      { type: 'select', side: 'drawing', tag: '23-KA-9101' },
      { type: 'select', side: 'scene', tag: '23-HA-9114' },
    ]);

    expect(primaryTag(state)).toBe('23-HA-9114');
  });

  it('is null with nothing selected', () => {
    expect(primaryTag(INITIAL_LINKED_SELECTION)).toBeNull();
  });
});
