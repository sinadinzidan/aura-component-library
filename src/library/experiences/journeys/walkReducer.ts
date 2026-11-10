/**
 * State of a stepped journey (a walkthrough, a guided tour, a wizard without forms): which stop
 * the user is at, out of how many, and which way they last moved so a view can animate in the
 * right direction. Pure, so the same reducer drives buttons, arrow keys and clicked stations.
 */
export type WalkDirection = 'forward' | 'back' | 'none';

export type WalkState = {
  /** Zero-based stop. Always within `0 … count - 1`. */
  index: number;
  count: number;
  direction: WalkDirection;
};

export type WalkAction =
  | { type: 'next' }
  | { type: 'previous' }
  | { type: 'first' }
  | { type: 'last' }
  | { type: 'goTo'; index: number };

function clampIndex(index: number, count: number): number {
  if (!Number.isFinite(index)) return 0;
  return Math.min(Math.max(Math.round(index), 0), Math.max(count - 1, 0));
}

/** Initial state. A start index outside the route is clamped onto it. */
export function createWalk(count: number, index = 0): WalkState {
  const safeCount = Math.max(Math.floor(count), 0);
  return { index: clampIndex(index, safeCount), count: safeCount, direction: 'none' };
}

function moveTo(state: WalkState, target: number): WalkState {
  const index = clampIndex(target, state.count);
  // Returning the same object lets React skip the render when a step is refused at either end.
  if (index === state.index) return state;
  return { ...state, index, direction: index > state.index ? 'forward' : 'back' };
}

export function walkReducer(state: WalkState, action: WalkAction): WalkState {
  switch (action.type) {
    case 'next':
      return moveTo(state, state.index + 1);
    case 'previous':
      return moveTo(state, state.index - 1);
    case 'first':
      return moveTo(state, 0);
    case 'last':
      return moveTo(state, state.count - 1);
    case 'goTo':
      return moveTo(state, action.index);
  }
}

export const canGoNext = (state: WalkState): boolean => state.index < state.count - 1;
export const canGoPrevious = (state: WalkState): boolean => state.index > 0;

/** How far along the route the user is, 0–1. A single-stop route counts as complete. */
export function walkProgress(state: WalkState): number {
  if (state.count <= 1) return state.count === 1 ? 1 : 0;
  return state.index / (state.count - 1);
}

/** The action a key stands for, or `null` when the key is not a journey key. */
export function walkActionFromKey(key: string): WalkAction | null {
  switch (key) {
    case 'ArrowRight':
      return { type: 'next' };
    case 'ArrowLeft':
      return { type: 'previous' };
    case 'Home':
      return { type: 'first' };
    case 'End':
      return { type: 'last' };
    default:
      return null;
  }
}
