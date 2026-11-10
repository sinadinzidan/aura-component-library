import { DRILL_LEVELS, pathTo } from './hierarchy';
import type { DrillLevel, DrillNode, DrillTree } from './hierarchy';

/**
 * State of one drill-down journey: where you are (`path`), how deep you have been (`trail`, so a
 * level rail can take you back down), which child the keyboard is on (`focusId`), what the pointer
 * is over (`hoverId`) and the active lens (`lens`, e.g. the metric a treemap is sized by).
 */
export type DrillState = {
  /** Node ids from the root to the current node. Never empty. */
  path: readonly string[];
  /** The deepest path visited that still runs through the current node. */
  trail: readonly string[];
  focusId: string | null;
  hoverId: string | null;
  lens: string;
};

export type DrillAction =
  /** Go into a child of the current node. */
  | { type: 'drill'; id: string }
  /** One level up. */
  | { type: 'up' }
  /** Go straight to any node in the tree. */
  | { type: 'jump'; id: string }
  /** Go to a depth along the trail: 0 is the root. */
  | { type: 'depth'; depth: number }
  | { type: 'focus'; id: string | null }
  /** Move the keyboard focus to the next or previous child, and preview it like a hover. Wraps. */
  | { type: 'focus-step'; delta: 1 | -1 }
  | { type: 'hover'; id: string | null }
  | { type: 'lens'; lens: string }
  | { type: 'reset' };

const startsWith = (long: readonly string[], short: readonly string[]): boolean =>
  short.length <= long.length && short.every((id, index) => long[index] === id);

export function createDrillState(tree: DrillTree, options: { lens?: string; startId?: string } = {}): DrillState {
  const start = options.startId ? pathTo(tree, options.startId).map((node) => node.id) : [];
  const path = start.length > 0 ? start : [tree.root.id];
  const current = tree.byId.get(path[path.length - 1] ?? tree.root.id) ?? tree.root;
  return { path, trail: path, focusId: current.children[0]?.id ?? null, hoverId: null, lens: options.lens ?? '' };
}

/** The node the journey is on. */
export function currentNode(tree: DrillTree, state: Pick<DrillState, 'path'>): DrillNode {
  return tree.byId.get(state.path[state.path.length - 1] ?? tree.root.id) ?? tree.root;
}

/** The nodes of the path, root first. */
export function pathNodes(tree: DrillTree, state: Pick<DrillState, 'path'>): DrillNode[] {
  return state.path.flatMap((id) => tree.byId.get(id) ?? []);
}

function moveTo(tree: DrillTree, state: DrillState, path: readonly string[], focusId?: string | null): DrillState {
  const node = tree.byId.get(path[path.length - 1] ?? '');
  if (!node) return state;
  return {
    ...state,
    path,
    trail: startsWith(state.trail, path) ? state.trail : path,
    focusId: focusId === undefined ? (node.children[0]?.id ?? null) : focusId,
    hoverId: null,
  };
}

/** The reducer for a tree. Invalid moves (unknown ids, up from the root) return the same state. */
export function createDrillReducer(tree: DrillTree): (state: DrillState, action: DrillAction) => DrillState {
  return (state, action) => {
    const current = currentNode(tree, state);
    switch (action.type) {
      case 'drill': {
        if (!current.children.some((child) => child.id === action.id)) return state;
        return moveTo(tree, state, [...state.path, action.id]);
      }
      case 'up': {
        if (state.path.length <= 1) return state;
        return moveTo(tree, state, state.path.slice(0, -1), current.id);
      }
      case 'jump': {
        const path = pathTo(tree, action.id).map((node) => node.id);
        if (path.length === 0) return state;
        if (path.length === state.path.length && startsWith(state.path, path)) return state;
        // Going to an ancestor keeps the keyboard on the branch you came from.
        const cameFrom = startsWith(state.path, path) ? state.path[path.length] : undefined;
        return moveTo(tree, state, path, cameFrom);
      }
      case 'depth': {
        if (action.depth < 0 || action.depth >= state.trail.length || action.depth === state.path.length - 1) return state;
        const path = state.trail.slice(0, action.depth + 1);
        return moveTo(tree, state, path, state.trail[action.depth + 1] ?? null);
      }
      case 'focus': {
        if (action.id !== null && !current.children.some((child) => child.id === action.id)) return state;
        return action.id === state.focusId ? state : { ...state, focusId: action.id };
      }
      case 'focus-step': {
        const ids = current.children.map((child) => child.id);
        if (ids.length === 0) return state;
        const index = state.focusId === null ? -1 : ids.indexOf(state.focusId);
        const next = index === -1 ? (action.delta === 1 ? 0 : ids.length - 1) : (index + action.delta + ids.length) % ids.length;
        // The keyboard previews what it is on, the same way a pointer does by hovering.
        return { ...state, focusId: ids[next] ?? null, hoverId: ids[next] ?? null };
      }
      case 'hover':
        return action.id === state.hoverId ? state : { ...state, hoverId: action.id };
      case 'lens':
        return action.lens === state.lens ? state : { ...state, lens: action.lens };
      case 'reset':
        return { ...createDrillState(tree, { lens: state.lens }), trail: state.trail };
      default:
        return state;
    }
  };
}

/**
 * The action a key stands for on a drill-down surface: arrows move between children, Enter or
 * Space goes in, Escape or Backspace goes up, Home returns to the top. `null` for any other key.
 */
export function drillKeyAction(key: string, state: Pick<DrillState, 'focusId' | 'path'>): DrillAction | null {
  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
      return { type: 'focus-step', delta: 1 };
    case 'ArrowLeft':
    case 'ArrowUp':
      return { type: 'focus-step', delta: -1 };
    case 'Enter':
    case ' ':
      return state.focusId === null ? null : { type: 'drill', id: state.focusId };
    case 'Escape':
    case 'Backspace':
      return state.path.length > 1 ? { type: 'up' } : null;
    case 'Home':
      return state.path.length > 1 ? { type: 'reset' } : null;
    default:
      return null;
  }
}

export type LevelStep = {
  level: DrillLevel;
  depth: number;
  /** The node on the path or the trail at this level; `null` when nothing has been picked yet. */
  node: DrillNode | null;
  current: boolean;
  /** Whether the journey can go straight to this level. */
  reachable: boolean;
};

/** The four levels as steps of a rail: what is selected at each, where you are, where you can go. */
export function levelSteps(tree: DrillTree, state: Pick<DrillState, 'path' | 'trail'>): LevelStep[] {
  return DRILL_LEVELS.map((level, depth) => {
    const id = state.trail[depth];
    const node = id === undefined ? null : (tree.byId.get(id) ?? null);
    return { level, depth, node, current: depth === state.path.length - 1, reachable: node !== null };
  });
}
