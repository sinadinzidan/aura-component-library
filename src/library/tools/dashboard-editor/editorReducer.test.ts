import { HISTORY_LIMIT, createEditorState, draggedWidget, editorReducer, isDirty } from './editorReducer';
import type { EditorAction, EditorState, EditorWidget } from './editorReducer';

const widget = (id: string, x: number, y: number, w: number, h: number, title = id): EditorWidget => ({ id, x, y, w, h, type: 'kpi', title, range: '24h' });

const WIDGETS = [widget('a', 0, 0, 4, 2, 'Availability'), widget('b', 4, 0, 4, 2, 'Gas export'), widget('c', 0, 2, 8, 3, 'Discharge pressure')];

const start = (overrides: Partial<Parameters<typeof createEditorState>[0]> = {}): EditorState => createEditorState({ widgets: WIDGETS, ...overrides });

const run = (state: EditorState, ...actions: EditorAction[]): EditorState => actions.reduce(editorReducer, state);

const at = (state: EditorState, id: string): Pick<EditorWidget, 'x' | 'y' | 'w' | 'h'> => {
  const found = state.widgets.find((entry) => entry.id === id);
  if (!found) throw new Error(`No widget ${id}`);
  return { x: found.x, y: found.y, w: found.w, h: found.h };
};

describe(createEditorState.name, () => {
  it('compacts the starting layout', () => {
    const state = createEditorState({ widgets: [widget('a', 0, 5, 4, 2)] });

    expect(at(state, 'a').y).toBe(0);
  });

  it('starts clean, in edit mode, with nothing selected', () => {
    const state = start();

    expect(isDirty(state)).toBe(false);
    expect(state).toMatchObject({ mode: 'edit', selectedId: null, changes: 0, past: [], future: [] });
  });
});

describe(editorReducer.name, () => {
  describe('adding and removing', () => {
    it('adds a widget in the first free slot and selects it', () => {
      const state = run(start(), { type: 'add', widget: { type: 'trend', title: 'Suction pressure', range: '8h', w: 4, h: 2 } });

      expect(state.widgets).toHaveLength(4);
      expect(at(state, 'w4')).toMatchObject({ x: 8, y: 0 });
      expect(state.selectedId).toBe('w4');
      expect(state.announcement).toBe('Added Suction pressure at column 9, row 1, 4 wide by 2 tall.');
    });

    it('gives every added widget a new id', () => {
      const add: EditorAction = { type: 'add', widget: { type: 'kpi', title: 'OEE', range: '24h', w: 3, h: 2 } };

      const state = run(start(), add, add);

      expect(new Set(state.widgets.map((entry) => entry.id)).size).toBe(5);
    });

    it('removes a widget and closes the gap', () => {
      const state = run(start(), { type: 'remove', id: 'a' });

      expect(state.widgets.map((entry) => entry.id)).toEqual(['b', 'c']);
      expect(state.announcement).toBe('Removed Availability.');
    });

    it('clears the selection when the selected widget is removed', () => {
      const state = run(start(), { type: 'select', id: 'a' }, { type: 'remove', id: 'a' });

      expect(state.selectedId).toBeNull();
    });

    it('duplicates a widget with the same size and settings', () => {
      const state = run(start(), { type: 'duplicate', id: 'a' });

      const copy = state.widgets.find((entry) => entry.id === 'w4');
      expect(copy).toMatchObject({ title: 'Availability copy', w: 4, h: 2, type: 'kpi', range: '24h' });
      expect(state.selectedId).toBe('w4');
    });

    it('ignores an unknown id', () => {
      const state = start();

      expect(run(state, { type: 'remove', id: 'nope' })).toBe(state);
      expect(run(state, { type: 'duplicate', id: 'nope' })).toBe(state);
    });
  });

  describe('keyboard moves', () => {
    it('moves a widget by one column', () => {
      const state = run(start(), { type: 'nudge', id: 'b', dx: 1, dy: 0 });

      expect(at(state, 'b').x).toBe(5);
      expect(state.announcement).toBe('Moved Gas export to column 6, row 1, 4 wide by 2 tall.');
    });

    it('says so when the widget is at the edge, without adding history', () => {
      const state = run(start(), { type: 'nudge', id: 'a', dx: -1, dy: 0 });

      expect(state.past).toHaveLength(0);
      expect(state.announcement).toBe('Availability cannot move further that way.');
    });

    it('resizes a widget by one cell', () => {
      const state = run(start(), { type: 'grow', id: 'a', dw: 0, dh: 1 });

      expect(at(state, 'a').h).toBe(3);
      expect(at(state, 'c').y).toBe(3);
    });

    it('says so when the widget cannot shrink further', () => {
      const state = run(createEditorState({ widgets: [widget('a', 0, 0, 1, 1)] }), { type: 'grow', id: 'a', dw: -1, dh: 0 });

      expect(state.announcement).toBe('a cannot be resized further that way.');
    });
  });

  describe('settings', () => {
    it('renames a widget and changes its range in one step', () => {
      const state = run(start(), { type: 'configure', id: 'a', patch: { title: 'Plant availability', range: '7d' } });

      expect(state.widgets[0]).toMatchObject({ title: 'Plant availability', range: '7d' });
      expect(state.past).toHaveLength(1);
    });

    it('applies a size and pushes neighbours out of the way', () => {
      const state = run(start(), { type: 'configure', id: 'a', patch: { w: 6, h: 3 } });

      expect(at(state, 'a')).toMatchObject({ w: 6, h: 3 });
      expect(at(state, 'b').y).toBe(3);
    });

    it('adds no history when nothing changed', () => {
      const state = run(start(), { type: 'configure', id: 'a', patch: { title: 'Availability' } });

      expect(state.past).toHaveLength(0);
    });
  });

  describe('dragging', () => {
    it('previews a move without touching history', () => {
      const state = run(start(), { type: 'dragStart', id: 'a', kind: 'move' }, { type: 'dragMove', x: 8, y: 0 });

      expect(at(state, 'a').x).toBe(8);
      expect(state.past).toHaveLength(0);
      expect(draggedWidget(state)?.id).toBe('a');
    });

    it('computes each preview from where the drag began', () => {
      const state = run(start(), { type: 'dragStart', id: 'a', kind: 'move' }, { type: 'dragMove', x: 4, y: 0 }, { type: 'dragMove', x: 0, y: 0 });

      expect(state.widgets).toEqual(start().widgets);
    });

    it('commits one history step on drop', () => {
      const state = run(start(), { type: 'dragStart', id: 'a', kind: 'move' }, { type: 'dragMove', x: 6, y: 0 }, { type: 'dragMove', x: 8, y: 0 }, { type: 'dragEnd' });

      expect(state.drag).toBeNull();
      expect(state.past).toHaveLength(1);
      expect(state.announcement).toBe('Dropped Availability at column 9, row 1, 4 wide by 2 tall.');
    });

    it('adds no history when dropped where it started', () => {
      const state = run(start(), { type: 'dragStart', id: 'a', kind: 'move' }, { type: 'dragEnd' });

      expect(state.past).toHaveLength(0);
      expect(state.announcement).toBe('Availability stays where it was.');
    });

    it('restores the layout on cancel', () => {
      const state = run(start(), { type: 'dragStart', id: 'a', kind: 'move' }, { type: 'dragMove', x: 8, y: 0 }, { type: 'dragCancel' });

      expect(state.widgets).toEqual(start().widgets);
      expect(state.drag).toBeNull();
    });

    it('previews and commits a resize', () => {
      const state = run(start(), { type: 'dragStart', id: 'a', kind: 'resize' }, { type: 'dragResize', w: 6, h: 2 }, { type: 'dragEnd' });

      expect(at(state, 'a').w).toBe(6);
      expect(state.announcement).toBe('Resized Availability at column 1, row 1, 6 wide by 2 tall.');
    });

    it('ignores a move while resizing and a resize while moving', () => {
      const resizing = run(start(), { type: 'dragStart', id: 'a', kind: 'resize' });
      const moving = run(start(), { type: 'dragStart', id: 'a', kind: 'move' });

      expect(run(resizing, { type: 'dragMove', x: 8, y: 0 })).toBe(resizing);
      expect(run(moving, { type: 'dragResize', w: 8, h: 4 })).toBe(moving);
    });

    it('moves a picked-up widget with the arrow keys', () => {
      const state = run(start(), { type: 'dragStart', id: 'b', kind: 'move' }, { type: 'dragNudge', dx: 1, dy: 0 }, { type: 'dragNudge', dx: 1, dy: 0 }, { type: 'dragEnd' });

      expect(at(state, 'b').x).toBe(6);
      expect(state.past).toHaveLength(1);
    });

    it('resizes with the arrow keys while a resize is picked up', () => {
      const state = run(start(), { type: 'dragStart', id: 'b', kind: 'resize' }, { type: 'dragNudge', dx: 2, dy: 1 });

      expect(at(state, 'b')).toMatchObject({ w: 6, h: 3 });
    });

    it('does not start a second drag while one is running', () => {
      const dragging = run(start(), { type: 'dragStart', id: 'a', kind: 'move' });

      expect(run(dragging, { type: 'dragStart', id: 'b', kind: 'move' })).toBe(dragging);
    });
  });

  describe('history', () => {
    it('undoes and redoes a change', () => {
      const moved = run(start(), { type: 'nudge', id: 'b', dx: 1, dy: 0 });
      const undone = run(moved, { type: 'undo' });
      const redone = run(undone, { type: 'redo' });

      expect(at(undone, 'b').x).toBe(4);
      expect(at(redone, 'b').x).toBe(5);
    });

    it('drops the redo stack after a new change', () => {
      const state = run(start(), { type: 'nudge', id: 'b', dx: 1, dy: 0 }, { type: 'undo' }, { type: 'remove', id: 'a' });

      expect(state.future).toHaveLength(0);
    });

    it('brings a removed widget back on undo', () => {
      const state = run(start(), { type: 'remove', id: 'a' }, { type: 'undo' });

      expect(state.widgets).toEqual(start().widgets);
    });

    it('does nothing when there is nothing to undo or redo', () => {
      const state = start();

      expect(run(state, { type: 'undo' })).toBe(state);
      expect(run(state, { type: 'redo' })).toBe(state);
    });

    it('keeps a bounded number of steps', () => {
      let state = createEditorState({ widgets: [widget('a', 0, 0, 1, 1)] });
      for (let step = 0; step < HISTORY_LIMIT + 10; step += 1) {
        state = run(state, { type: 'grow', id: 'a', dw: 0, dh: 1 });
      }

      expect(state.past).toHaveLength(HISTORY_LIMIT);
    });
  });

  describe('saving', () => {
    it('counts unsaved changes and takes one away on undo', () => {
      const twice = run(start(), { type: 'nudge', id: 'b', dx: 1, dy: 0 }, { type: 'remove', id: 'a' });

      expect(twice.changes).toBe(2);
      expect(run(twice, { type: 'undo' }).changes).toBe(1);
    });

    it('is clean again after saving', () => {
      const state = run(start(), { type: 'remove', id: 'a' }, { type: 'save' });

      expect(isDirty(state)).toBe(false);
      expect(state.changes).toBe(0);
    });

    it('goes back to the saved layout on discard and clears history', () => {
      const state = run(start(), { type: 'remove', id: 'a' }, { type: 'discard' });

      expect(state.widgets).toEqual(start().widgets);
      expect(state.past).toHaveLength(0);
    });

    it('replaces the whole layout as one undoable step', () => {
      const state = run(start(), { type: 'replace', widgets: [widget('z', 0, 0, 12, 4)], label: 'the wall board layout' });

      expect(state.widgets.map((entry) => entry.id)).toEqual(['z']);
      expect(state.announcement).toBe('Applied the wall board layout.');
      expect(run(state, { type: 'undo' }).widgets).toEqual(start().widgets);
    });
  });

  describe('modes', () => {
    it('ignores every edit in view mode', () => {
      const viewing = start({ mode: 'view' });

      expect(run(viewing, { type: 'remove', id: 'a' })).toBe(viewing);
      expect(run(viewing, { type: 'nudge', id: 'a', dx: 1, dy: 0 })).toBe(viewing);
      expect(run(viewing, { type: 'select', id: 'a' })).toBe(viewing);
      expect(run(viewing, { type: 'dragStart', id: 'a', kind: 'move' })).toBe(viewing);
    });

    it('clears the selection and cancels a drag when switching to view', () => {
      const state = run(start(), { type: 'dragStart', id: 'a', kind: 'move' }, { type: 'dragMove', x: 8, y: 0 }, { type: 'setMode', mode: 'view' });

      expect(state).toMatchObject({ mode: 'view', selectedId: null, drag: null });
      expect(state.widgets).toEqual(start().widgets);
    });

    it('announces the mode', () => {
      expect(run(start({ mode: 'view' }), { type: 'setMode', mode: 'edit' }).announcement).toBe('Editing dashboard.');
    });
  });
});
