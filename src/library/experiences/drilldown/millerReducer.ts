import { DRILL_LEVELS } from './hierarchy';
import type { DrillLevel, DrillNode } from './hierarchy';

/**
 * State of a column browser: the selected id in each column from the left (`path`), the column
 * the keyboard is in, and one type-ahead filter per column.
 */
export type MillerState = {
  path: readonly string[];
  column: number;
  filters: readonly string[];
};

export type MillerAction =
  | { type: 'select'; column: number; id: string }
  /** Next or previous visible row in the active column. Stops at the ends. */
  | { type: 'move'; delta: 1 | -1 }
  | { type: 'edge'; to: 'first' | 'last' }
  /** Into the next column, selecting its first row. */
  | { type: 'right' }
  /** Back to the previous column, dropping the selection in this one. */
  | { type: 'left' }
  | { type: 'filter'; column: number; text: string }
  /** Type-ahead on the active column. */
  | { type: 'type'; char: string }
  | { type: 'erase' }
  | { type: 'clear' };

export type MillerColumn = {
  index: number;
  level: DrillLevel;
  /** The node whose children the column lists; `null` for the first column and for empty ones. */
  parent: DrillNode | null;
  /** Rows after the filter. */
  items: readonly DrillNode[];
  /** Rows before the filter. */
  total: number;
  selectedId: string | null;
  filter: string;
};

export const MILLER_COLUMNS = DRILL_LEVELS.length;

/** Case-insensitive match on tag or name. An empty filter matches everything. */
export function matchesFilter(node: Pick<DrillNode, 'tag' | 'name'>, text: string): boolean {
  const query = text.trim().toLowerCase();
  if (query === '') return true;
  return node.tag.toLowerCase().includes(query) || node.name.toLowerCase().includes(query);
}

function indexNodes(roots: readonly DrillNode[]): Map<string, DrillNode> {
  const byId = new Map<string, DrillNode>();
  const visit = (node: DrillNode) => {
    byId.set(node.id, node);
    node.children.forEach(visit);
  };
  roots.forEach(visit);
  return byId;
}

function sourceItems(roots: readonly DrillNode[], byId: ReadonlyMap<string, DrillNode>, path: readonly string[], column: number): readonly DrillNode[] {
  if (column === 0) return roots;
  const parentId = path[column - 1];
  return parentId === undefined ? [] : (byId.get(parentId)?.children ?? []);
}

export function createMillerState(roots: readonly DrillNode[], startPath: readonly string[] = []): MillerState {
  const first = roots[0];
  const path = startPath.length > 0 ? startPath : first ? [first.id] : [];
  return { path, column: Math.max(0, path.length - 1), filters: DRILL_LEVELS.map(() => '') };
}

/** The four columns as they should be drawn for a state. */
export function millerColumns(roots: readonly DrillNode[], state: MillerState): MillerColumn[] {
  const byId = indexNodes(roots);
  return DRILL_LEVELS.map((level, index) => {
    const all = sourceItems(roots, byId, state.path, index);
    const filter = state.filters[index] ?? '';
    const parentId = index === 0 ? undefined : state.path[index - 1];
    return {
      index,
      level,
      parent: parentId === undefined ? null : (byId.get(parentId) ?? null),
      items: all.filter((node) => matchesFilter(node, filter)),
      total: all.length,
      selectedId: state.path[index] ?? null,
      filter,
    };
  });
}

/** The selected nodes from the first column down. */
export function millerSelection(roots: readonly DrillNode[], state: Pick<MillerState, 'path'>): DrillNode[] {
  const byId = indexNodes(roots);
  return state.path.flatMap((id) => byId.get(id) ?? []);
}

const withFilter = (filters: readonly string[], column: number, text: string): string[] =>
  filters.map((value, index) => (index === column ? text : value));

/** Clears the filters of every column to the right of `column`: their content has changed. */
const clearRight = (filters: readonly string[], column: number): string[] => filters.map((value, index) => (index > column ? '' : value));

export function createMillerReducer(roots: readonly DrillNode[]): (state: MillerState, action: MillerAction) => MillerState {
  const byId = indexNodes(roots);
  const visible = (state: MillerState, column: number): readonly DrillNode[] =>
    sourceItems(roots, byId, state.path, column).filter((node) => matchesFilter(node, state.filters[column] ?? ''));

  const select = (state: MillerState, column: number, id: string): MillerState => {
    if (column < 0 || column >= MILLER_COLUMNS) return state;
    if (!sourceItems(roots, byId, state.path, column).some((node) => node.id === id)) return state;
    if (state.path[column] === id && state.path.length === column + 1 && state.column === column) return state;
    return { path: [...state.path.slice(0, column), id], column, filters: clearRight(state.filters, column) };
  };

  return (state, action) => {
    switch (action.type) {
      case 'select':
        return select(state, action.column, action.id);
      case 'move': {
        const items = visible(state, state.column);
        if (items.length === 0) return state;
        const index = items.findIndex((node) => node.id === state.path[state.column]);
        const next = index === -1 ? (action.delta === 1 ? 0 : items.length - 1) : Math.min(items.length - 1, Math.max(0, index + action.delta));
        const target = items[next];
        return target ? select(state, state.column, target.id) : state;
      }
      case 'edge': {
        const items = visible(state, state.column);
        const target = action.to === 'first' ? items[0] : items[items.length - 1];
        return target ? select(state, state.column, target.id) : state;
      }
      case 'right': {
        const selectedId = state.path[state.column];
        if (selectedId === undefined || state.column >= MILLER_COLUMNS - 1) return state;
        const cleared = { ...state, filters: clearRight(state.filters, state.column) };
        const first = visible(cleared, state.column + 1)[0];
        return first ? select(cleared, state.column + 1, first.id) : state;
      }
      case 'left': {
        if (state.column === 0) return state;
        return { path: state.path.slice(0, state.column), column: state.column - 1, filters: clearRight(state.filters, state.column - 1) };
      }
      case 'filter': {
        if (action.column < 0 || action.column >= MILLER_COLUMNS || state.filters[action.column] === action.text) return state;
        return { ...state, filters: withFilter(state.filters, action.column, action.text) };
      }
      case 'type':
        return { ...state, filters: withFilter(state.filters, state.column, `${state.filters[state.column] ?? ''}${action.char}`) };
      case 'erase': {
        const current = state.filters[state.column] ?? '';
        return current === '' ? state : { ...state, filters: withFilter(state.filters, state.column, current.slice(0, -1)) };
      }
      case 'clear':
        return (state.filters[state.column] ?? '') === '' ? state : { ...state, filters: withFilter(state.filters, state.column, '') };
      default:
        return state;
    }
  };
}

/**
 * The action a key stands for in the active column. Arrows move; Enter goes right; Escape and
 * Backspace first undo the type-ahead filter and then go back a column; any other single
 * character is added to the filter.
 */
export function millerKeyAction(key: string, state: Pick<MillerState, 'column' | 'filters'>): MillerAction | null {
  const filter = state.filters[state.column] ?? '';
  switch (key) {
    case 'ArrowDown':
      return { type: 'move', delta: 1 };
    case 'ArrowUp':
      return { type: 'move', delta: -1 };
    case 'ArrowRight':
    case 'Enter':
      return { type: 'right' };
    case 'ArrowLeft':
      return { type: 'left' };
    case 'Home':
      return { type: 'edge', to: 'first' };
    case 'End':
      return { type: 'edge', to: 'last' };
    case 'Escape':
      return filter !== '' ? { type: 'clear' } : state.column > 0 ? { type: 'left' } : null;
    case 'Backspace':
      return filter !== '' ? { type: 'erase' } : state.column > 0 ? { type: 'left' } : null;
    default:
      if (key.length !== 1) return null;
      if (key === ' ' && filter === '') return null;
      return { type: 'type', char: key };
  }
}
