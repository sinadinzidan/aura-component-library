import type { SheetColumn } from './columns';
import { createSheetState, isEditable, selectionOf, sheetReducer } from './sheetReducer';
import type { SheetAction, SheetState } from './sheetReducer';

const COLUMNS: readonly SheetColumn[] = [
  { id: 'tag', title: 'Tag', type: 'text', readOnly: true },
  { id: 'low', title: 'Low', type: 'number' },
  { id: 'high', title: 'High', type: 'number' },
  { id: 'enabled', title: 'Enabled', type: 'checkbox' },
];

const ROWS = [
  ['23-PT-92531', '40', '52', 'true'],
  ['23-PT-92530', '10', '15', 'true'],
  ['23-TT-92532', '90', '145', 'false'],
  ['23-VT-92540', '0', '7.1', 'true'],
];

function start(overrides: Partial<Parameters<typeof createSheetState>[0]> = {}): SheetState {
  return createSheetState({ columns: COLUMNS, rows: ROWS, ...overrides });
}

function run(state: SheetState, ...actions: SheetAction[]): SheetState {
  return actions.reduce(sheetReducer, state);
}

describe('createSheetState', () => {
  it('pads short rows and cuts long ones to the columns', () => {
    const state = createSheetState({ columns: COLUMNS, rows: [['a'], ['a', 'b', 'c', 'd', 'e']] });
    expect(state.cells).toEqual([['a', '', '', ''], ['a', 'b', 'c', 'd']]);
  });

  it('clamps the starting selection into the grid', () => {
    const state = start({ active: { row: 9, col: 9 }, extent: { row: 1, col: 1 } });
    expect(state.active).toEqual({ row: 3, col: 3 });
    expect(selectionOf(state)).toEqual({ r1: 1, c1: 1, r2: 3, c2: 3 });
  });
});

describe('moving', () => {
  it('moves the active cell and collapses the selection', () => {
    const state = run(start({ active: { row: 1, col: 1 }, extent: { row: 2, col: 2 } }), { type: 'move', direction: 'down' });
    expect(state.active).toEqual({ row: 2, col: 1 });
    expect(state.extent).toEqual(state.active);
  });

  it('stops at the edges', () => {
    const state = run(start(), { type: 'move', direction: 'up' }, { type: 'move', direction: 'left' });
    expect(state.active).toEqual({ row: 0, col: 0 });
  });

  it('extends the selection from the active cell with extend', () => {
    const state = run(start({ active: { row: 1, col: 1 } }), { type: 'move', direction: 'down', extend: true }, { type: 'move', direction: 'right', extend: true });
    expect(state.active).toEqual({ row: 1, col: 1 });
    expect(selectionOf(state)).toEqual({ r1: 1, c1: 1, r2: 2, c2: 2 });
  });

  it('jumps to the edge of the grid with toEdge', () => {
    const state = run(start({ active: { row: 1, col: 1 } }), { type: 'move', direction: 'down', toEdge: true }, { type: 'move', direction: 'right', toEdge: true });
    expect(state.active).toEqual({ row: 3, col: 3 });
  });

  it('extends to the edge with toEdge and extend', () => {
    const state = run(start({ active: { row: 1, col: 1 } }), { type: 'move', direction: 'up', toEdge: true, extend: true });
    expect(selectionOf(state)).toEqual({ r1: 0, c1: 1, r2: 1, c2: 1 });
  });

  it('moves to a given cell, clamped', () => {
    expect(run(start(), { type: 'moveTo', pos: { row: 2, col: 9 } }).active).toEqual({ row: 2, col: 3 });
  });

  it.each([
    ['rowStart', { row: 2, col: 0 }],
    ['rowEnd', { row: 2, col: 3 }],
    ['gridStart', { row: 0, col: 0 }],
    ['gridEnd', { row: 3, col: 3 }],
  ] as const)('jumps to %s', (to, expected) => {
    expect(run(start({ active: { row: 2, col: 1 } }), { type: 'jump', to }).active).toEqual(expected);
  });

  it('extends a jump', () => {
    const state = run(start({ active: { row: 2, col: 1 } }), { type: 'jump', to: 'rowEnd', extend: true });
    expect(selectionOf(state)).toEqual({ r1: 2, c1: 1, r2: 2, c2: 3 });
  });
});

describe('selecting rows and columns', () => {
  it('selects a whole row', () => {
    const state = run(start(), { type: 'selectRow', row: 2 });
    expect(selectionOf(state)).toEqual({ r1: 2, c1: 0, r2: 2, c2: 3 });
    expect(state.announcement).toBe('Row 3 selected');
  });

  it('extends a row selection', () => {
    const state = run(start(), { type: 'selectRow', row: 1 }, { type: 'selectRow', row: 3, extend: true });
    expect(selectionOf(state)).toEqual({ r1: 1, c1: 0, r2: 3, c2: 3 });
    expect(state.announcement).toBe('3 rows selected');
  });

  it('selects a whole column', () => {
    const state = run(start(), { type: 'selectColumn', col: 2 });
    expect(selectionOf(state)).toEqual({ r1: 0, c1: 2, r2: 3, c2: 2 });
    expect(state.announcement).toBe('Column High selected');
  });

  it('extends a column selection', () => {
    const state = run(start(), { type: 'selectColumn', col: 1 }, { type: 'selectColumn', col: 2, extend: true });
    expect(selectionOf(state)).toEqual({ r1: 0, c1: 1, r2: 3, c2: 2 });
  });

  it('selects everything', () => {
    expect(selectionOf(run(start(), { type: 'selectAll' }))).toEqual({ r1: 0, c1: 0, r2: 3, c2: 3 });
  });
});

describe('editing', () => {
  it('opens an edit with the cell text', () => {
    const state = run(start({ active: { row: 0, col: 1 } }), { type: 'startEdit' });
    expect(state.edit).toEqual({ pos: { row: 0, col: 1 }, draft: '40' });
  });

  it('opens an edit with the typed character', () => {
    const state = run(start({ active: { row: 0, col: 1 } }), { type: 'startEdit', initial: '7' });
    expect(state.edit?.draft).toBe('7');
  });

  it('refuses to edit a read-only column and says why', () => {
    const state = run(start(), { type: 'startEdit' });
    expect(state.edit).toBeNull();
    expect(state.announcement).toBe('Tag is read-only');
  });

  it('refuses to edit a read-only sheet', () => {
    const state = run(start({ readOnly: true, active: { row: 0, col: 1 } }), { type: 'startEdit' });
    expect(state.edit).toBeNull();
    expect(state.announcement).toBe('This sheet is read-only');
    expect(isEditable(state, { row: 0, col: 1 })).toBe(false);
  });

  it('commits the draft, normalized for the column, and moves', () => {
    const state = run(start({ active: { row: 0, col: 1 } }), { type: 'startEdit' }, { type: 'setDraft', draft: ' 41,5 ' }, { type: 'commitEdit', move: 'down' });
    expect(state.cells[0][1]).toBe('41.5');
    expect(state.edit).toBeNull();
    expect(state.active).toEqual({ row: 1, col: 1 });
    expect(state.past).toHaveLength(1);
  });

  it('commits without moving', () => {
    const state = run(start({ active: { row: 0, col: 1 } }), { type: 'startEdit', initial: '1' }, { type: 'commitEdit' });
    expect(state.active).toEqual({ row: 0, col: 1 });
    expect(state.announcement).toBe('B1 set to 1');
  });

  it('does not add history when the text did not change', () => {
    const state = run(start({ active: { row: 0, col: 1 } }), { type: 'startEdit' }, { type: 'commitEdit' });
    expect(state.past).toHaveLength(0);
  });

  it('cancels an edit and keeps the cell', () => {
    const state = run(start({ active: { row: 0, col: 1 } }), { type: 'startEdit', initial: '999' }, { type: 'cancelEdit' });
    expect(state.cells[0][1]).toBe('40');
    expect(state.edit).toBeNull();
    expect(state.announcement).toBe('Edit cancelled');
  });

  it('commits an open edit when the selection moves', () => {
    const state = run(start({ active: { row: 0, col: 1 } }), { type: 'startEdit', initial: '33' }, { type: 'moveTo', pos: { row: 2, col: 2 } });
    expect(state.cells[0][1]).toBe('33');
    expect(state.active).toEqual({ row: 2, col: 2 });
  });

  it('ignores a draft or commit without an open edit', () => {
    const state = start();
    expect(run(state, { type: 'setDraft', draft: 'x' })).toBe(state);
    expect(run(state, { type: 'commitEdit' })).toBe(state);
    expect(run(state, { type: 'cancelEdit' })).toBe(state);
  });

  it('sets one cell directly', () => {
    const state = run(start(), { type: 'setCell', pos: { row: 2, col: 3 }, value: 'yes' });
    expect(state.cells[2][3]).toBe('true');
  });

  it('does not set a read-only cell', () => {
    const state = run(start(), { type: 'setCell', pos: { row: 0, col: 0 }, value: 'x' });
    expect(state.cells[0][0]).toBe('23-PT-92531');
    expect(state.announcement).toBe('Tag is read-only');
  });
});

describe('clearing', () => {
  it('empties the selection, unchecks checkboxes and skips read-only cells', () => {
    const state = run(start({ active: { row: 0, col: 0 }, extent: { row: 0, col: 3 } }), { type: 'clear' });
    expect(state.cells[0]).toEqual(['23-PT-92531', '', '', 'false']);
    expect(state.announcement).toBe('Cleared 3 cells, 1 read-only skipped');
  });
});

describe('pasting', () => {
  it('writes a block from the top-left of the selection and selects it', () => {
    const state = run(start({ active: { row: 1, col: 1 } }), { type: 'paste', rows: [['1', '2'], ['3', '4']] });
    expect(state.cells[1].slice(1, 3)).toEqual(['1', '2']);
    expect(state.cells[2].slice(1, 3)).toEqual(['3', '4']);
    expect(selectionOf(state)).toEqual({ r1: 1, c1: 1, r2: 2, c2: 2 });
    expect(state.announcement).toBe('Pasted 4 cells');
  });

  it('is one undo step', () => {
    const state = run(start({ active: { row: 1, col: 1 } }), { type: 'paste', rows: [['1', '2'], ['3', '4']] }, { type: 'undo' });
    expect(state.cells).toEqual(ROWS);
  });

  it('repeats one copied cell over the selection', () => {
    const state = run(start({ active: { row: 0, col: 1 }, extent: { row: 2, col: 2 } }), { type: 'paste', rows: [['5']] });
    expect(state.cells.slice(0, 3).map((row) => row.slice(1, 3))).toEqual([['5', '5'], ['5', '5'], ['5', '5']]);
  });

  it('repeats a copied row down a taller selection', () => {
    const state = run(start({ active: { row: 0, col: 1 }, extent: { row: 3, col: 2 } }), { type: 'paste', rows: [['1', '2']] });
    expect(state.cells.map((row) => row.slice(1, 3))).toEqual([['1', '2'], ['1', '2'], ['1', '2'], ['1', '2']]);
  });

  it('skips read-only cells and reports them', () => {
    const state = run(start(), { type: 'paste', rows: [['X', '1']] });
    expect(state.cells[0].slice(0, 2)).toEqual(['23-PT-92531', '1']);
    expect(state.announcement).toBe('Pasted 1 cell, 1 read-only skipped');
  });

  it('cuts what falls outside the sheet and reports it', () => {
    const state = run(start({ active: { row: 3, col: 2 } }), { type: 'paste', rows: [['1', 'true', 'extra'], ['2', 'false', 'extra']] });
    expect(state.cells[3].slice(2)).toEqual(['1', 'true']);
    expect(state.announcement).toBe('Pasted 1 cell, 4 outside the sheet');
    expect(selectionOf(state)).toEqual({ r1: 3, c1: 2, r2: 3, c2: 3 });
  });

  it('normalizes pasted values for their column', () => {
    const state = run(start({ active: { row: 0, col: 2 } }), { type: 'paste', rows: [['53,5', 'no']] });
    expect(state.cells[0].slice(2)).toEqual(['53.5', 'false']);
  });

  it('does nothing for an empty clipboard', () => {
    const state = run(start(), { type: 'paste', rows: [] });
    expect(state.announcement).toBe('Nothing to paste');
    expect(state.past).toHaveLength(0);
  });
});

describe('filling', () => {
  it('copies the top row of the selection down', () => {
    const state = run(start({ active: { row: 0, col: 1 }, extent: { row: 2, col: 2 } }), { type: 'fillDown' });
    expect(state.cells.slice(0, 3).map((row) => row.slice(1, 3))).toEqual([['40', '52'], ['40', '52'], ['40', '52']]);
    expect(state.announcement).toBe('Filled 4 cells down');
  });

  it('copies from the row above when one row is selected', () => {
    const state = run(start({ active: { row: 2, col: 1 } }), { type: 'fillDown' });
    expect(state.cells[2][1]).toBe('10');
  });

  it('has nothing to fill from on the first row', () => {
    const state = run(start({ active: { row: 0, col: 1 } }), { type: 'fillDown' });
    expect(state.announcement).toBe('Nothing above to fill from');
  });

  it('shifts formulas as it fills', () => {
    const base = run(start({ active: { row: 0, col: 2 } }), { type: 'setCell', pos: { row: 0, col: 2 }, value: '=B1*1.1' });
    const state = run({ ...base, extent: { row: 2, col: 2 } }, { type: 'fillDown' });
    expect(state.cells.slice(0, 3).map((row) => row[2])).toEqual(['=B1*1.1', '=B2*1.1', '=B3*1.1']);
  });

  it('extends the selection down to a row with the fill handle, repeating the pattern', () => {
    const state = run(start({ active: { row: 0, col: 1 }, extent: { row: 1, col: 1 } }), { type: 'fillTo', row: 3 });
    expect(state.cells.map((row) => row[1])).toEqual(['40', '10', '40', '10']);
    expect(selectionOf(state)).toEqual({ r1: 0, c1: 1, r2: 3, c2: 1 });
  });

  it('ignores a fill handle released inside the selection', () => {
    const state = start({ active: { row: 0, col: 1 }, extent: { row: 2, col: 1 } });
    expect(run(state, { type: 'fillTo', row: 1 })).toBe(state);
  });

  it('skips read-only columns', () => {
    const state = run(start({ active: { row: 0, col: 0 }, extent: { row: 1, col: 1 } }), { type: 'fillDown' });
    expect(state.cells[1].slice(0, 2)).toEqual(['23-PT-92530', '40']);
    expect(state.announcement).toBe('Filled 1 cell down, 1 read-only skipped');
  });
});

describe('history', () => {
  it('undoes and redoes a change', () => {
    const changed = run(start(), { type: 'setCell', pos: { row: 0, col: 1 }, value: '41' });
    const undone = run(changed, { type: 'undo' });
    const redone = run(undone, { type: 'redo' });
    expect(undone.cells[0][1]).toBe('40');
    expect(redone.cells[0][1]).toBe('41');
    expect(redone.future).toHaveLength(0);
  });

  it('drops the redo stack on a new change', () => {
    const state = run(start(), { type: 'setCell', pos: { row: 0, col: 1 }, value: '41' }, { type: 'undo' }, { type: 'setCell', pos: { row: 0, col: 1 }, value: '42' });
    expect(state.future).toHaveLength(0);
    expect(run(state, { type: 'redo' }).announcement).toBe('Nothing to redo');
  });

  it('says when there is nothing to undo', () => {
    expect(run(start(), { type: 'undo' }).announcement).toBe('Nothing to undo');
  });

  it('keeps a bounded history', () => {
    let state = start();
    for (let index = 0; index < 130; index += 1) state = sheetReducer(state, { type: 'setCell', pos: { row: 0, col: 1 }, value: String(index + 100) });
    expect(state.past).toHaveLength(100);
  });
});

describe('announcing', () => {
  it('stores a message for the live region', () => {
    expect(run(start(), { type: 'announce', message: 'Copied 4 cells' }).announcement).toBe('Copied 4 cells');
  });
});

describe('an empty sheet', () => {
  it('ignores every action', () => {
    const state = createSheetState({ columns: COLUMNS, rows: [] });
    expect(run(state, { type: 'move', direction: 'down' }, { type: 'selectAll' }, { type: 'startEdit' })).toBe(state);
  });
});
