import { normalizeSelection } from './textState';
import type { TextState } from './textState';

export type TriggerChar = '@' | '#';

/** An open `@` or `#` lookup: which character started it, what was typed since, and where it starts. */
export type Trigger = { char: TriggerChar; query: string; start: number };

/** Something a lookup can insert: a person for `@`, a tag for `#`. */
export type Suggestion = { id: string; label: string; detail?: string };

const QUERY_LIMIT = 24;

/**
 * Finds the lookup the caret is in: an `@` or `#` at the start of a word, followed by text
 * without white space up to the caret. A line start `# ` is a heading, not a lookup.
 */
export function findTrigger(state: TextState): Trigger | null {
  const { value, selectionStart, selectionEnd } = normalizeSelection(state);
  if (selectionStart !== selectionEnd) return null;
  for (let index = selectionStart - 1; index >= 0 && selectionStart - index <= QUERY_LIMIT + 1; index -= 1) {
    const char = value[index];
    if (char === '\n' || char === ' ' || char === '\t') return null;
    if (char === '@' || char === '#') {
      const before = index === 0 ? ' ' : value[index - 1];
      if (!/[\s(>]/.test(before)) return null;
      return { char, query: value.slice(index + 1, selectionStart), start: index };
    }
  }
  return null;
}

const fold = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** Suggestions that match what was typed: by the start of any word first, then anywhere. */
export function filterSuggestions(suggestions: readonly Suggestion[], query: string, limit = 6): Suggestion[] {
  const needle = fold(query);
  if (needle === '') return suggestions.slice(0, limit);
  const rank = (suggestion: Suggestion): number => {
    const label = fold(suggestion.label);
    if (label.startsWith(needle)) return 0;
    if (label.split(/[\s-]+/).some((word) => word.startsWith(needle))) return 1;
    if (label.includes(needle) || fold(suggestion.detail ?? '').includes(needle)) return 2;
    return 3;
  };
  return suggestions
    .map((suggestion, index) => ({ suggestion, rank: rank(suggestion), index }))
    .filter((entry) => entry.rank < 3)
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .slice(0, limit)
    .map((entry) => entry.suggestion);
}

/** Replaces the typed lookup with the chosen label and a space, leaving the caret after it. */
export function applySuggestion(state: TextState, trigger: Trigger, suggestion: Suggestion): TextState {
  const { value, selectionStart } = normalizeSelection(state);
  const inserted = `${trigger.char}${suggestion.label} `;
  const next = value.slice(0, trigger.start) + inserted + value.slice(selectionStart);
  const caret = trigger.start + inserted.length;
  return { value: next, selectionStart: caret, selectionEnd: caret };
}

/** Moves the highlighted row in a list of `count`, wrapping at both ends. */
export function moveActive(active: number, delta: number, count: number): number {
  if (count <= 0) return 0;
  return (((active + delta) % count) + count) % count;
}

/** Id of one row of a suggestion list, for `aria-activedescendant` on the field that drives it. */
export function suggestionOptionId(listId: string, index: number): string {
  return `${listId}-option-${index}`;
}
