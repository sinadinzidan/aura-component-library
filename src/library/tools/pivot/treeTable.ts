/**
 * Hierarchical rows for a tree table: builds the tree from flat nodes with a parent id, rolls
 * numeric values up to every branch, lists the visible rows for an expanded set, and resolves
 * treegrid keyboard movement. All pure.
 */

export type TreeRollup = 'sum' | 'min' | 'max' | 'average';

export type TreeNodeInput = {
  id: string;
  parentId: string | null;
  label: string;
  /** Short identifier shown in monospace, such as a tag. */
  code?: string;
  /** Values of this node itself. Branches may leave a value out; it is then rolled up from children. */
  values: Readonly<Record<string, number>>;
};

export type TreeRow = {
  id: string;
  parentId: string | null;
  label: string;
  code?: string;
  depth: number;
  childIds: readonly string[];
  /** Own value or, for a branch, the roll-up of all descendants' leaf values. */
  values: Readonly<Record<string, number | null>>;
  /** Number of leaves below (1 for a leaf). */
  leafCount: number;
};

export type TreeModel = {
  rows: ReadonlyMap<string, TreeRow>;
  rootIds: readonly string[];
};

function rollup(values: readonly number[], how: TreeRollup): number | null {
  if (values.length === 0) return null;
  if (how === 'sum') return values.reduce((total, value) => total + value, 0);
  if (how === 'min') return Math.min(...values);
  if (how === 'max') return Math.max(...values);
  return values.reduce((total, value) => total + value, 0) / values.length;
}

/**
 * Builds the tree. `rollups` says how each value is combined over the leaves below a branch
 * (`sum` for counts and hours, `min` for the worst health). A leaf keeps its own value.
 */
export function buildTree(nodes: readonly TreeNodeInput[], rollups: Readonly<Record<string, TreeRollup>>): TreeModel {
  const known = new Set(nodes.map((node) => node.id));
  const childrenOf = new Map<string | null, TreeNodeInput[]>();
  for (const node of nodes) {
    const parent = node.parentId !== null && known.has(node.parentId) ? node.parentId : null;
    childrenOf.set(parent, [...(childrenOf.get(parent) ?? []), node]);
  }
  const rows = new Map<string, TreeRow>();
  const leafValues = new Map<string, Record<string, number[]>>();

  const parentOf = (node: TreeNodeInput): string | null => (node.parentId !== null && known.has(node.parentId) ? node.parentId : null);
  const visit = (node: TreeNodeInput, depth: number): { leaves: Record<string, number[]>; count: number } => {
    const children = childrenOf.get(node.id) ?? [];
    if (children.length === 0) {
      const leaves: Record<string, number[]> = {};
      for (const [key, value] of Object.entries(node.values)) leaves[key] = [value];
      leafValues.set(node.id, leaves);
      rows.set(node.id, { id: node.id, parentId: parentOf(node), label: node.label, code: node.code, depth, childIds: [], values: { ...node.values }, leafCount: 1 });
      return { leaves, count: 1 };
    }
    const merged: Record<string, number[]> = {};
    let count = 0;
    for (const child of children) {
      const below = visit(child, depth + 1);
      count += below.count;
      for (const [key, list] of Object.entries(below.leaves)) merged[key] = [...(merged[key] ?? []), ...list];
    }
    const values: Record<string, number | null> = {};
    for (const key of Object.keys(rollups)) values[key] = rollup(merged[key] ?? [], rollups[key]);
    rows.set(node.id, { id: node.id, parentId: parentOf(node), label: node.label, code: node.code, depth, childIds: children.map((child) => child.id), values, leafCount: count });
    return { leaves: merged, count };
  };

  const roots = childrenOf.get(null) ?? [];
  for (const root of roots) visit(root, 0);
  return { rows, rootIds: roots.map((root) => root.id) };
}

/** Ids of every row that has children. */
export function branchIds(model: TreeModel): string[] {
  const ids: string[] = [];
  const walk = (list: readonly string[]) => {
    for (const id of list) {
      const row = model.rows.get(id);
      if (!row || row.childIds.length === 0) continue;
      ids.push(id);
      walk(row.childIds);
    }
  };
  walk(model.rootIds);
  return ids;
}

/** Visible rows in display order: a row's children follow it when it is in `expanded`. */
export function visibleTreeRows(model: TreeModel, expanded: ReadonlySet<string>): TreeRow[] {
  const out: TreeRow[] = [];
  const walk = (ids: readonly string[]) => {
    for (const id of ids) {
      const row = model.rows.get(id);
      if (!row) continue;
      out.push(row);
      if (expanded.has(id)) walk(row.childIds);
    }
  };
  walk(model.rootIds);
  return out;
}

export type TreeState = {
  expanded: readonly string[];
  /** Id of the row that holds the roving focus. */
  focusId: string | null;
};

export type TreeAction =
  | { type: 'toggle'; id: string }
  | { type: 'expand'; id: string }
  | { type: 'collapse'; id: string }
  | { type: 'expandAll' }
  | { type: 'collapseAll' }
  | { type: 'focus'; id: string };

export function createTreeState(model: TreeModel, expandedDepth = 0): TreeState {
  const expanded = branchIds(model).filter((id) => (model.rows.get(id)?.depth ?? 0) < expandedDepth);
  return { expanded, focusId: model.rootIds[0] ?? null };
}

/** Collapsing a branch moves focus to it when focus was on one of its descendants. */
function isBelow(model: TreeModel, id: string, ancestorId: string): boolean {
  let current = model.rows.get(id)?.parentId ?? null;
  while (current !== null) {
    if (current === ancestorId) return true;
    current = model.rows.get(current)?.parentId ?? null;
  }
  return false;
}

export function treeReducer(model: TreeModel, state: TreeState, action: TreeAction): TreeState {
  const open = new Set(state.expanded);
  switch (action.type) {
    case 'focus':
      return model.rows.has(action.id) ? { ...state, focusId: action.id } : state;
    case 'expand': {
      if ((model.rows.get(action.id)?.childIds.length ?? 0) === 0) return state;
      open.add(action.id);
      return { ...state, expanded: [...open] };
    }
    case 'collapse': {
      open.delete(action.id);
      const focusId = state.focusId !== null && isBelow(model, state.focusId, action.id) ? action.id : state.focusId;
      return { expanded: [...open], focusId };
    }
    case 'toggle':
      return treeReducer(model, state, { type: open.has(action.id) ? 'collapse' : 'expand', id: action.id });
    case 'expandAll':
      return { ...state, expanded: branchIds(model) };
    case 'collapseAll': {
      const focusId = state.focusId === null ? null : (rootOf(model, state.focusId) ?? state.focusId);
      return { expanded: [], focusId };
    }
    default:
      return state;
  }
}

function rootOf(model: TreeModel, id: string): string | null {
  let current: TreeRow | undefined = model.rows.get(id);
  while (current && current.parentId !== null) current = model.rows.get(current.parentId);
  return current?.id ?? null;
}

export type TreeKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight' | 'Home' | 'End';

/**
 * Treegrid keys: Up and Down move between visible rows; Right opens a closed branch, then enters
 * it; Left closes an open branch, then goes to the parent; Home and End go to the first and last row.
 */
export function treeKey(model: TreeModel, state: TreeState, key: TreeKey): TreeState {
  const rows = visibleTreeRows(model, new Set(state.expanded));
  if (rows.length === 0) return state;
  const index = Math.max(0, rows.findIndex((row) => row.id === state.focusId));
  const current = rows[index];
  const focus = (id: string): TreeState => ({ ...state, focusId: id });

  switch (key) {
    case 'ArrowDown':
      return focus(rows[Math.min(rows.length - 1, index + 1)].id);
    case 'ArrowUp':
      return focus(rows[Math.max(0, index - 1)].id);
    case 'Home':
      return focus(rows[0].id);
    case 'End':
      return focus(rows[rows.length - 1].id);
    case 'ArrowRight': {
      if (current.childIds.length === 0) return focus(current.id);
      if (!state.expanded.includes(current.id)) return treeReducer(model, focus(current.id), { type: 'expand', id: current.id });
      return focus(current.childIds[0]);
    }
    case 'ArrowLeft': {
      if (current.childIds.length > 0 && state.expanded.includes(current.id)) return treeReducer(model, focus(current.id), { type: 'collapse', id: current.id });
      return current.parentId === null ? focus(current.id) : focus(current.parentId);
    }
    default:
      return state;
  }
}
