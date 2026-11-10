import { fixtureTree } from './drilldownFixture';
import { buildHierarchy } from './hierarchy';
import { createMillerReducer, createMillerState, matchesFilter, millerColumns, millerKeyAction, millerSelection } from './millerReducer';
import type { MillerAction, MillerState } from './millerReducer';

const other = buildHierarchy({
  assets: [{ id: 'vs', tag: 'VS', name: 'Valhall Sør', type: 'site', parentId: null, state: 'running', health: 'good', healthScore: 93 }],
  sensors: [],
});
const roots = [fixtureTree().root, other.root];
const reduce = createMillerReducer(roots);
const run = (actions: readonly MillerAction[], start: MillerState = createMillerState(roots)): MillerState => actions.reduce(reduce, start);

describe(createMillerState.name, () => {
  it('selects the first root in the first column', () => {
    expect(createMillerState(roots)).toEqual({ path: ['site'], column: 0, filters: ['', '', '', ''] });
  });

  it('can start on a deeper path with the keyboard in its last column', () => {
    expect(createMillerState(roots, ['site', 'area-b', 'comp-1'])).toMatchObject({ path: ['site', 'area-b', 'comp-1'], column: 2 });
  });
});

describe(millerColumns.name, () => {
  it('always returns the four levels', () => {
    expect(millerColumns(roots, createMillerState(roots)).map((column) => column.level)).toEqual(['site', 'area', 'equipment', 'sensor']);
  });

  it('fills each column from the selection to its left', () => {
    const columns = millerColumns(roots, createMillerState(roots, ['site', 'area-b']));

    expect(columns[0]?.items.map((node) => node.id)).toEqual(['site', 'vs']);
    expect(columns[1]?.items.map((node) => node.id)).toEqual(['area-a', 'area-b']);
    expect(columns[2]?.items.map((node) => node.id)).toEqual(['comp-1', 'comp-3']);
    expect(columns[2]?.parent?.id).toBe('area-b');
    expect(columns[3]?.items).toEqual([]);
    expect(columns[3]?.parent).toBeNull();
  });

  it('marks the selected row per column', () => {
    const columns = millerColumns(roots, createMillerState(roots, ['site', 'area-b']));

    expect(columns.map((column) => column.selectedId)).toEqual(['site', 'area-b', null, null]);
  });

  it('applies the filter of a column and keeps the unfiltered count', () => {
    const state = run([{ type: 'filter', column: 1, text: 'compr' }]);
    const column = millerColumns(roots, state)[1];

    expect(column?.items.map((node) => node.id)).toEqual(['area-b']);
    expect(column?.total).toBe(2);
    expect(column?.filter).toBe('compr');
  });
});

describe(createMillerReducer.name, () => {
  it('selects a row and makes its column the active one', () => {
    const state = run([{ type: 'select', column: 1, id: 'area-b' }]);

    expect(state).toMatchObject({ path: ['site', 'area-b'], column: 1 });
  });

  it('drops deeper selections when a row further left is picked', () => {
    const state = run([{ type: 'select', column: 1, id: 'area-a' }], createMillerState(roots, ['site', 'area-b', 'comp-1', 'pt']));

    expect(state.path).toEqual(['site', 'area-a']);
  });

  it('ignores a row that is not in the column', () => {
    const start = createMillerState(roots);

    expect(reduce(start, { type: 'select', column: 1, id: 'comp-1' })).toBe(start);
    expect(reduce(start, { type: 'select', column: 3, id: 'pt' })).toBe(start);
  });

  it('moves down and up inside the active column and stops at the ends', () => {
    const start = createMillerState(roots, ['site', 'area-a']);

    expect(reduce(start, { type: 'move', delta: 1 }).path).toEqual(['site', 'area-b']);
    expect(run([{ type: 'move', delta: 1 }, { type: 'move', delta: 1 }], start).path).toEqual(['site', 'area-b']);
    expect(reduce(start, { type: 'move', delta: -1 })).toBe(start);
  });

  it('jumps to the first and last row', () => {
    const start = createMillerState(roots, ['site', 'area-a']);

    expect(reduce(start, { type: 'edge', to: 'last' }).path).toEqual(['site', 'area-b']);
    expect(run([{ type: 'edge', to: 'last' }, { type: 'edge', to: 'first' }], start).path).toEqual(['site', 'area-a']);
  });

  it('goes right into the first child', () => {
    const state = run([{ type: 'right' }, { type: 'move', delta: 1 }, { type: 'right' }]);

    expect(state).toMatchObject({ path: ['site', 'area-b', 'comp-1'], column: 2 });
  });

  it('does not go right from a row without children or from the last column', () => {
    const empty = createMillerState(roots, ['vs']);
    const last = createMillerState(roots, ['site', 'area-b', 'comp-1', 'pt']);

    expect(reduce(empty, { type: 'right' })).toBe(empty);
    expect(reduce(last, { type: 'right' })).toBe(last);
  });

  it('goes left and drops the selection it leaves', () => {
    const state = run([{ type: 'left' }], createMillerState(roots, ['site', 'area-b', 'comp-1']));

    expect(state).toMatchObject({ path: ['site', 'area-b'], column: 1 });
  });

  it('stays in the first column when going left', () => {
    const start = createMillerState(roots);

    expect(reduce(start, { type: 'left' })).toBe(start);
  });

  it('moves only through rows that match the filter', () => {
    const start = run([{ type: 'filter', column: 2, text: 'recomp' }], createMillerState(roots, ['site', 'area-b', 'comp-1']));

    expect(reduce(start, { type: 'move', delta: 1 }).path).toEqual(['site', 'area-b', 'comp-3']);
  });

  it('builds a type-ahead filter on the active column and erases it', () => {
    const start = createMillerState(roots, ['site', 'area-a']);
    const typed = run([{ type: 'type', char: 'g' }, { type: 'type', char: 'a' }, { type: 'type', char: 's' }], start);

    expect(typed.filters).toEqual(['', 'gas', '', '']);
    expect(reduce(typed, { type: 'erase' }).filters[1]).toBe('ga');
    expect(reduce(typed, { type: 'clear' }).filters[1]).toBe('');
    expect(reduce(start, { type: 'erase' })).toBe(start);
    expect(reduce(start, { type: 'clear' })).toBe(start);
  });

  it('clears filters to the right when the selection changes', () => {
    const start = run([{ type: 'filter', column: 2, text: 'x' }], createMillerState(roots, ['site', 'area-b']));

    expect(reduce(start, { type: 'select', column: 1, id: 'area-a' }).filters).toEqual(['', '', '', '']);
  });
});

describe(millerSelection.name, () => {
  it('returns the selected nodes, left to right', () => {
    expect(millerSelection(roots, { path: ['site', 'area-b', 'comp-3'] }).map((node) => node.tag)).toEqual(['NK', 'NK-23', '23-KA-9103']);
  });
});

describe(matchesFilter.name, () => {
  const node = { tag: '23-KA-9101', name: '1st stage compressor' };

  it('matches tag or name, ignoring case and outer spaces', () => {
    expect(matchesFilter(node, ' ka-91 ')).toBe(true);
    expect(matchesFilter(node, 'STAGE')).toBe(true);
    expect(matchesFilter(node, 'pump')).toBe(false);
    expect(matchesFilter(node, '')).toBe(true);
  });
});

describe(millerKeyAction.name, () => {
  const plain = { column: 1, filters: ['', '', '', ''] };
  const filtered = { column: 1, filters: ['', 'ga', '', ''] };

  it('maps arrows, Enter, Home and End', () => {
    expect(millerKeyAction('ArrowDown', plain)).toEqual({ type: 'move', delta: 1 });
    expect(millerKeyAction('ArrowUp', plain)).toEqual({ type: 'move', delta: -1 });
    expect(millerKeyAction('ArrowRight', plain)).toEqual({ type: 'right' });
    expect(millerKeyAction('Enter', plain)).toEqual({ type: 'right' });
    expect(millerKeyAction('ArrowLeft', plain)).toEqual({ type: 'left' });
    expect(millerKeyAction('Home', plain)).toEqual({ type: 'edge', to: 'first' });
    expect(millerKeyAction('End', plain)).toEqual({ type: 'edge', to: 'last' });
  });

  it('undoes the filter before going back a column', () => {
    expect(millerKeyAction('Escape', filtered)).toEqual({ type: 'clear' });
    expect(millerKeyAction('Backspace', filtered)).toEqual({ type: 'erase' });
    expect(millerKeyAction('Escape', plain)).toEqual({ type: 'left' });
    expect(millerKeyAction('Backspace', plain)).toEqual({ type: 'left' });
    expect(millerKeyAction('Escape', { column: 0, filters: ['', '', '', ''] })).toBeNull();
  });

  it('adds printable characters to the filter', () => {
    expect(millerKeyAction('g', plain)).toEqual({ type: 'type', char: 'g' });
    expect(millerKeyAction(' ', filtered)).toEqual({ type: 'type', char: ' ' });
    expect(millerKeyAction(' ', plain)).toBeNull();
    expect(millerKeyAction('Tab', plain)).toBeNull();
  });
});
