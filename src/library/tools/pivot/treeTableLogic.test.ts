import { branchIds, buildTree, createTreeState, treeKey, treeReducer, visibleTreeRows } from './treeTableLogic';
import type { TreeNodeInput, TreeState } from './treeTableLogic';

const NODES: readonly TreeNodeInput[] = [
  { id: 'nk', parentId: null, label: 'Plant', values: {} },
  { id: 'comp', parentId: 'nk', label: 'Compression', values: {} },
  { id: 'ka1', parentId: 'comp', label: '1st stage', values: { alarms: 2, health: 72, hours: 5 } },
  { id: 'ka3', parentId: 'comp', label: 'Recompressor', values: { alarms: 3, health: 41, hours: 14.5 } },
  { id: 'exp', parentId: 'nk', label: 'Export', values: {} },
  { id: 'pa', parentId: 'exp', label: 'Pump A', values: { alarms: 0, health: 93, hours: 0 } },
  { id: 'lone', parentId: 'missing', label: 'Orphan', values: { alarms: 1, health: 80, hours: 1 } },
];

const ROLLUPS = { alarms: 'sum', health: 'min', hours: 'sum' } as const;

function model() {
  return buildTree(NODES, ROLLUPS);
}

function start(expanded: string[], focusId: string | null = 'nk'): TreeState {
  return { expanded, focusId };
}

describe('buildTree', () => {
  it('assigns depth and children', () => {
    const tree = model();
    expect(tree.rootIds).toEqual(['nk', 'lone']);
    expect(tree.rows.get('ka1')?.depth).toBe(2);
    expect(tree.rows.get('comp')?.childIds).toEqual(['ka1', 'ka3']);
  });

  it('rolls sums up through every level', () => {
    const tree = model();
    expect(tree.rows.get('comp')?.values.alarms).toBe(5);
    expect(tree.rows.get('nk')?.values.alarms).toBe(5);
    expect(tree.rows.get('nk')?.values.hours).toBe(19.5);
  });

  it('rolls the worst health up with min', () => {
    expect(model().rows.get('nk')?.values.health).toBe(41);
  });

  it('supports max and average', () => {
    const tree = buildTree(NODES, { health: 'max', alarms: 'average' });
    expect(tree.rows.get('nk')?.values.health).toBe(93);
    expect(tree.rows.get('comp')?.values.alarms).toBe(2.5);
  });

  it('keeps a leaf value as it is and counts leaves', () => {
    const tree = model();
    expect(tree.rows.get('ka3')?.values.health).toBe(41);
    expect(tree.rows.get('nk')?.leafCount).toBe(3);
    expect(tree.rows.get('ka1')?.leafCount).toBe(1);
  });

  it('treats a node with an unknown parent as a root', () => {
    expect(model().rows.get('lone')?.depth).toBe(0);
  });

  it('gives null for a value no leaf has', () => {
    const tree = buildTree(NODES, { flow: 'sum' });
    expect(tree.rows.get('nk')?.values.flow).toBeNull();
  });

  it('builds an empty tree', () => {
    expect(buildTree([], ROLLUPS).rootIds).toEqual([]);
  });
});

describe('visibleTreeRows', () => {
  it('shows only the roots when nothing is expanded', () => {
    expect(visibleTreeRows(model(), new Set()).map((row) => row.id)).toEqual(['nk', 'lone']);
  });

  it('shows children of expanded branches, in order', () => {
    const rows = visibleTreeRows(model(), new Set(['nk', 'comp']));
    expect(rows.map((row) => row.id)).toEqual(['nk', 'comp', 'ka1', 'ka3', 'exp', 'lone']);
  });

  it('does not show grandchildren of a collapsed branch', () => {
    const rows = visibleTreeRows(model(), new Set(['comp']));
    expect(rows.map((row) => row.id)).toEqual(['nk', 'lone']);
  });

  it('lists branch ids', () => {
    expect(branchIds(model())).toEqual(['nk', 'comp', 'exp']);
  });
});

describe('treeReducer', () => {
  it('starts expanded to the given depth', () => {
    expect(createTreeState(model(), 1).expanded).toEqual(['nk']);
    expect(createTreeState(model(), 0).expanded).toEqual([]);
    expect(createTreeState(model()).focusId).toBe('nk');
  });

  it('expands, collapses and toggles', () => {
    const tree = model();
    const opened = treeReducer(tree, start([]), { type: 'expand', id: 'nk' });
    expect(opened.expanded).toEqual(['nk']);
    expect(treeReducer(tree, opened, { type: 'toggle', id: 'nk' }).expanded).toEqual([]);
    expect(treeReducer(tree, start([]), { type: 'toggle', id: 'comp' }).expanded).toEqual(['comp']);
  });

  it('does not expand a leaf', () => {
    const state = start([]);
    expect(treeReducer(model(), state, { type: 'expand', id: 'ka1' })).toBe(state);
  });

  it('moves focus to the branch when it collapses over the focused row', () => {
    const state = treeReducer(model(), start(['nk', 'comp'], 'ka1'), { type: 'collapse', id: 'nk' });
    expect(state.focusId).toBe('nk');
  });

  it('keeps focus when it collapses a branch that does not hold it', () => {
    const state = treeReducer(model(), start(['nk', 'comp'], 'exp'), { type: 'collapse', id: 'comp' });
    expect(state.focusId).toBe('exp');
  });

  it('expands and collapses everything', () => {
    const tree = model();
    expect(treeReducer(tree, start([]), { type: 'expandAll' }).expanded).toEqual(['nk', 'comp', 'exp']);
    expect(treeReducer(tree, start(['nk'], 'ka1'), { type: 'collapseAll' })).toEqual({ expanded: [], focusId: 'nk' });
  });

  it('moves focus only to known rows', () => {
    const state = start([]);
    expect(treeReducer(model(), state, { type: 'focus', id: 'nope' })).toBe(state);
    expect(treeReducer(model(), state, { type: 'focus', id: 'lone' }).focusId).toBe('lone');
  });
});

describe('treeKey', () => {
  const open = ['nk', 'comp'];

  it('moves between visible rows with the arrows, Home and End', () => {
    const tree = model();
    expect(treeKey(tree, start(open, 'nk'), 'ArrowDown').focusId).toBe('comp');
    expect(treeKey(tree, start(open, 'comp'), 'ArrowUp').focusId).toBe('nk');
    expect(treeKey(tree, start(open, 'ka3'), 'Home').focusId).toBe('nk');
    expect(treeKey(tree, start(open, 'nk'), 'End').focusId).toBe('lone');
  });

  it('stops at the first and last row', () => {
    const tree = model();
    expect(treeKey(tree, start(open, 'nk'), 'ArrowUp').focusId).toBe('nk');
    expect(treeKey(tree, start(open, 'lone'), 'ArrowDown').focusId).toBe('lone');
  });

  it('opens a closed branch on Right, then enters it', () => {
    const tree = model();
    const opened = treeKey(tree, start([], 'nk'), 'ArrowRight');
    expect(opened.expanded).toEqual(['nk']);
    expect(opened.focusId).toBe('nk');
    expect(treeKey(tree, opened, 'ArrowRight').focusId).toBe('comp');
  });

  it('does nothing on Right at a leaf', () => {
    expect(treeKey(model(), start(open, 'ka1'), 'ArrowRight').focusId).toBe('ka1');
  });

  it('closes an open branch on Left, then goes to the parent', () => {
    const tree = model();
    const closed = treeKey(tree, start(open, 'comp'), 'ArrowLeft');
    expect(closed.expanded).toEqual(['nk']);
    expect(treeKey(tree, closed, 'ArrowLeft').focusId).toBe('nk');
  });

  it('goes to the parent on Left from a leaf and stays at a root', () => {
    const tree = model();
    expect(treeKey(tree, start(open, 'ka3'), 'ArrowLeft').focusId).toBe('comp');
    expect(treeKey(tree, start([], 'lone'), 'ArrowLeft').focusId).toBe('lone');
  });

  it('ignores keys for an empty tree', () => {
    const empty = buildTree([], ROLLUPS);
    const state = start([], null);
    expect(treeKey(empty, state, 'ArrowDown')).toBe(state);
  });
});
