import { INITIAL_TREE_VISIBILITY, displayCounts, nodeVisibility, resolveDisplay, treeReducer } from './modelTree';
import { VIEWER_PARTS, VIEWER_TREE } from './viewerModelLogic';

const hide = (ids: string[]) => ({ hiddenIds: ids, isolatedId: null });

describe('nodeVisibility', () => {
  it('is visible by default', () => {
    expect(nodeVisibility(VIEWER_TREE, INITIAL_TREE_VISIBILITY, 'module')).toBe('visible');
  });

  it('is partial when some parts are hidden and hidden when all are', () => {
    expect(nodeVisibility(VIEWER_TREE, hide(['separator']), 'sys-separation')).toBe('partial');
    expect(nodeVisibility(VIEWER_TREE, hide(['separator', 'scrubber']), 'sys-separation')).toBe('hidden');
    expect(nodeVisibility(VIEWER_TREE, hide(['separator']), 'separator')).toBe('hidden');
  });

  it('treats an unknown id as visible', () => {
    expect(nodeVisibility(VIEWER_TREE, hide(['separator']), 'nope')).toBe('visible');
  });
});

describe('treeReducer', () => {
  it('hides a whole group and shows it again', () => {
    const hidden = treeReducer(VIEWER_TREE, INITIAL_TREE_VISIBILITY, { type: 'toggle', id: 'sys-separation' });
    expect([...hidden.hiddenIds].sort()).toEqual(['scrubber', 'separator']);
    expect(treeReducer(VIEWER_TREE, hidden, { type: 'toggle', id: 'sys-separation' }).hiddenIds).toEqual([]);
  });

  it('shows a partly hidden group on toggle', () => {
    const partial = hide(['separator']);
    expect(treeReducer(VIEWER_TREE, partial, { type: 'toggle', id: 'sys-separation' }).hiddenIds).toEqual([]);
  });

  it('ignores an unknown node', () => {
    expect(treeReducer(VIEWER_TREE, INITIAL_TREE_VISIBILITY, { type: 'toggle', id: 'nope' })).toBe(INITIAL_TREE_VISIBILITY);
  });

  it('isolates a node, toggles isolation off, and ignores the root', () => {
    const isolated = treeReducer(VIEWER_TREE, INITIAL_TREE_VISIBILITY, { type: 'isolate', id: 'compressor' });
    expect(isolated.isolatedId).toBe('compressor');
    expect(treeReducer(VIEWER_TREE, isolated, { type: 'isolate', id: 'compressor' }).isolatedId).toBeNull();
    expect(treeReducer(VIEWER_TREE, isolated, { type: 'isolate', id: 'module' }).isolatedId).toBeNull();
  });

  it('isolating clears hidden parts, and showing all resets', () => {
    expect(treeReducer(VIEWER_TREE, hide(['motor']), { type: 'isolate', id: 'compressor' }).hiddenIds).toEqual([]);
    expect(treeReducer(VIEWER_TREE, { hiddenIds: ['motor'], isolatedId: 'cooler' }, { type: 'showAll' })).toEqual(INITIAL_TREE_VISIBILITY);
  });
});

describe('resolveDisplay', () => {
  const display = (extra: Partial<Parameters<typeof resolveDisplay>[0]> = {}) => resolveDisplay({ tree: VIEWER_TREE, visibility: INITIAL_TREE_VISIBILITY, ...extra });

  it('draws every part solid by default', () => {
    const result = display();
    expect(Object.keys(result)).toHaveLength(VIEWER_PARTS.length);
    expect(new Set(Object.values(result))).toEqual(new Set(['solid']));
  });

  it('hides parts switched off in the tree', () => {
    expect(display({ visibility: hide(['motor']) }).motor).toBe('hidden');
  });

  it('ghosts everything but the isolated node', () => {
    const result = display({ visibility: { hiddenIds: [], isolatedId: 'sys-compression' } });
    expect(result.compressor).toBe('solid');
    expect(result.motor).toBe('solid');
    expect(result.cooler).toBe('ghost');
  });

  it('ghosts or hides filtered layers', () => {
    expect(display({ filteredOut: ['cooler'] }).cooler).toBe('ghost');
    expect(display({ filteredOut: ['cooler'], filterMode: 'hide' }).cooler).toBe('hidden');
  });

  it('lets a tree toggle win over a layer filter', () => {
    expect(display({ visibility: hide(['cooler']), filteredOut: ['cooler'], filterMode: 'ghost' }).cooler).toBe('hidden');
  });

  it('counts displays', () => {
    expect(displayCounts(display({ visibility: hide(['motor']), filteredOut: ['cooler'] }))).toEqual({ solid: 8, ghost: 1, hidden: 1 });
  });
});
