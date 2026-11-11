import { createHistory, pushHistory, redo, replacePresent, undo } from './history';
import type { History } from './history';
import { normalizeSelection } from './textState';
import type { TextState } from './textState';

export type EditorState = {
  history: History<TextState>;
  /** True while the last change was typing, so the next keystroke joins the same undo step. */
  typing: boolean;
  /** Counts programmatic changes, so the field knows when to restore the selection. */
  revision: number;
};

export type EditorAction =
  /** The person typed, pasted or deleted in the field. */
  | { type: 'input'; state: TextState }
  /** A toolbar command or shortcut produced a new text state. */
  | { type: 'apply'; state: TextState }
  /** The caret or selection moved without a change to the text. */
  | { type: 'select'; selectionStart: number; selectionEnd: number }
  | { type: 'undo' }
  | { type: 'redo' }
  /** Replaces everything and forgets the history, for loading another document. */
  | { type: 'reset'; value: string };

export function createEditorState(value: string): EditorState {
  return { history: createHistory<TextState>({ value, selectionStart: value.length, selectionEnd: value.length }), typing: false, revision: 0 };
}

/** A word boundary ends a typing burst, so undo steps back a word or so at a time. */
function startsNewStep(previous: string, next: string): boolean {
  if (Math.abs(next.length - previous.length) !== 1) return true;
  const longer = next.length > previous.length ? next : previous;
  const shorter = next.length > previous.length ? previous : next;
  let index = 0;
  while (index < shorter.length && shorter[index] === longer[index]) index += 1;
  return /\s/.test(longer[index] ?? '');
}

/**
 * Text, selection and undo history of an editor that owns its history rather than leaning on
 * the browser's, because toolbar commands rewrite the field and would otherwise break native undo.
 */
export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'input': {
      const next = normalizeSelection(action.state);
      const previous = state.history.present;
      if (next.value === previous.value) return { ...state, history: replacePresent(state.history, next) };
      const join = state.typing && !startsNewStep(previous.value, next.value);
      return { ...state, history: join ? replacePresent(state.history, next) : pushHistory(state.history, next), typing: true };
    }
    case 'apply': {
      const next = normalizeSelection(action.state);
      const previous = state.history.present;
      const same = next.value === previous.value;
      return {
        history: same ? replacePresent(state.history, next) : pushHistory(state.history, next),
        typing: false,
        revision: state.revision + 1,
      };
    }
    case 'select': {
      const previous = state.history.present;
      if (previous.selectionStart === action.selectionStart && previous.selectionEnd === action.selectionEnd) return state;
      const next = normalizeSelection({ value: previous.value, selectionStart: action.selectionStart, selectionEnd: action.selectionEnd });
      return { ...state, history: replacePresent(state.history, next), typing: false };
    }
    case 'undo':
      return { history: undo(state.history), typing: false, revision: state.revision + 1 };
    case 'redo':
      return { history: redo(state.history), typing: false, revision: state.revision + 1 };
    case 'reset':
      return { ...createEditorState(action.value), revision: state.revision + 1 };
  }
}
