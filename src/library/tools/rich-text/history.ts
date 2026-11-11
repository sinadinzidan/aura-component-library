/** A linear undo history: what came before, what is current, and what was undone. */
export type History<T> = { past: readonly T[]; present: T; future: readonly T[] };

export const HISTORY_LIMIT = 100;

export function createHistory<T>(present: T): History<T> {
  return { past: [], present, future: [] };
}

/** Records a new state. Anything that was undone is dropped, and the oldest entries fall off past `limit`. */
export function pushHistory<T>(history: History<T>, next: T, limit: number = HISTORY_LIMIT): History<T> {
  const past = [...history.past, history.present];
  return { past: past.slice(Math.max(0, past.length - Math.max(1, limit))), present: next, future: [] };
}

/** Replaces the current state without adding an undo step, for a burst of typing or a moved caret. */
export function replacePresent<T>(history: History<T>, next: T): History<T> {
  return { past: history.past, present: next, future: history.future };
}

export const canUndo = <T,>(history: History<T>): boolean => history.past.length > 0;
export const canRedo = <T,>(history: History<T>): boolean => history.future.length > 0;

export function undo<T>(history: History<T>): History<T> {
  if (!canUndo(history)) return history;
  return {
    past: history.past.slice(0, -1),
    present: history.past[history.past.length - 1],
    future: [history.present, ...history.future],
  };
}

export function redo<T>(history: History<T>): History<T> {
  if (!canRedo(history)) return history;
  return { past: [...history.past, history.present], present: history.future[0], future: history.future.slice(1) };
}
