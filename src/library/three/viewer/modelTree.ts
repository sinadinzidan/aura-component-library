import { assemblyLeafIds, findAssembly, flattenAssemblies } from '../models/assemblyTree';
import type { AssemblyNode } from '../models/assemblyTree';

/** Visibility choices made in a model tree: parts switched off, and at most one node isolated. */
export type TreeVisibility = { hiddenIds: readonly string[]; isolatedId: string | null };

export const INITIAL_TREE_VISIBILITY: TreeVisibility = { hiddenIds: [], isolatedId: null };

export type NodeVisibility = 'visible' | 'hidden' | 'partial';

/** How each part is drawn: solid, faded back, or not at all. */
export type PartDisplay = 'solid' | 'ghost' | 'hidden';

export type TreeAction = { type: 'toggle'; id: string } | { type: 'isolate'; id: string } | { type: 'showAll' };

/** Visibility of a node from the parts under it: all shown, all hidden, or some of each. */
export function nodeVisibility(root: AssemblyNode, state: TreeVisibility, id: string): NodeVisibility {
  const leaves = assemblyLeafIds(root, id);
  if (leaves.length === 0) return 'visible';
  const hidden = leaves.filter((leaf) => state.hiddenIds.includes(leaf)).length;
  if (hidden === 0) return 'visible';
  return hidden === leaves.length ? 'hidden' : 'partial';
}

/** Toggling a node hides all its parts, or shows them all when any was hidden. Toggling clears isolation. */
export function treeReducer(root: AssemblyNode, state: TreeVisibility, action: TreeAction): TreeVisibility {
  switch (action.type) {
    case 'toggle': {
      const leaves = assemblyLeafIds(root, action.id);
      if (leaves.length === 0) return state;
      const visible = nodeVisibility(root, state, action.id) === 'visible';
      const hiddenIds = visible ? [...new Set([...state.hiddenIds, ...leaves])] : state.hiddenIds.filter((leaf) => !leaves.includes(leaf));
      return { hiddenIds, isolatedId: null };
    }
    case 'isolate':
      if (!findAssembly(root, action.id) || action.id === root.id) return { ...state, isolatedId: null };
      return { hiddenIds: [], isolatedId: state.isolatedId === action.id ? null : action.id };
    case 'showAll':
      return INITIAL_TREE_VISIBILITY;
  }
}

export type DisplayOptions = {
  tree: AssemblyNode;
  visibility: TreeVisibility;
  /** Leaf ids belonging to layers that are switched off, with how to draw them. */
  filteredOut?: readonly string[];
  filterMode?: 'hide' | 'ghost';
};

/** The display of every part: tree toggles hide, isolation ghosts the rest, filtered layers hide or ghost. */
export function resolveDisplay(options: DisplayOptions): Record<string, PartDisplay> {
  const { tree, visibility, filteredOut = [], filterMode = 'ghost' } = options;
  const isolated = visibility.isolatedId ? assemblyLeafIds(tree, visibility.isolatedId) : null;
  const result: Record<string, PartDisplay> = {};
  for (const row of flattenAssemblies(tree)) {
    if (row.node.children && row.node.children.length > 0) continue;
    const id = row.node.id;
    if (visibility.hiddenIds.includes(id)) result[id] = 'hidden';
    else if (isolated && !isolated.includes(id)) result[id] = 'ghost';
    else if (filteredOut.includes(id)) result[id] = filterMode === 'hide' ? 'hidden' : 'ghost';
    else result[id] = 'solid';
  }
  return result;
}

/** Count of parts per display, for "7 shown, 2 ghosted, 1 hidden". */
export function displayCounts(display: Record<string, PartDisplay>): Record<PartDisplay, number> {
  const counts: Record<PartDisplay, number> = { solid: 0, ghost: 0, hidden: 0 };
  for (const value of Object.values(display)) counts[value] += 1;
  return counts;
}
