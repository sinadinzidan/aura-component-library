/** The whole state of a plain text field: its text and where the selection sits. */
export type TextState = { value: string; selectionStart: number; selectionEnd: number };

/** A text state with the caret at one offset and nothing selected. */
export function caretAt(value: string, offset: number): TextState {
  const caret = Math.min(value.length, Math.max(0, offset));
  return { value, selectionStart: caret, selectionEnd: caret };
}

/** Clamps and orders a selection so it is always valid for its text. */
export function normalizeSelection(state: TextState): TextState {
  const clamp = (offset: number) => Math.min(state.value.length, Math.max(0, offset));
  const a = clamp(state.selectionStart);
  const b = clamp(state.selectionEnd);
  return { value: state.value, selectionStart: Math.min(a, b), selectionEnd: Math.max(a, b) };
}

/** Offsets of the first character of the first selected line and the end of the last one. */
export function lineBounds(state: TextState): { start: number; end: number } {
  const { value, selectionStart, selectionEnd } = normalizeSelection(state);
  const start = value.lastIndexOf('\n', selectionStart - 1) + 1;
  // A selection that ends right after a line break does not include the line that follows.
  const last = selectionEnd > selectionStart && value[selectionEnd - 1] === '\n' ? selectionEnd - 1 : selectionEnd;
  const nextBreak = value.indexOf('\n', last);
  return { start, end: nextBreak === -1 ? value.length : nextBreak };
}

/** Replaces the selection with `text` and leaves the caret after it. */
export function replaceSelection(state: TextState, text: string): TextState {
  const { value, selectionStart, selectionEnd } = normalizeSelection(state);
  return caretAt(value.slice(0, selectionStart) + text + value.slice(selectionEnd), selectionStart + text.length);
}

/**
 * Rewrites the selected lines one by one and keeps them selected, which is how every block
 * format (heading, list, quote, indent) is applied.
 */
export function mapSelectedLines(state: TextState, map: (line: string, index: number) => string): TextState {
  const normal = normalizeSelection(state);
  const { start, end } = lineBounds(normal);
  const before = normal.value.slice(start, end).split('\n');
  const after = before.map(map);
  const block = after.join('\n');
  const value = normal.value.slice(0, start) + block + normal.value.slice(end);
  if (normal.selectionStart === normal.selectionEnd) {
    // A bare caret keeps its place in the text of its line, whatever the prefix became.
    const column = normal.selectionStart - start;
    const shift = after[0].length - before[0].length;
    return caretAt(value, start + Math.max(0, Math.min(after[0].length, column + shift)));
  }
  return { value, selectionStart: start, selectionEnd: start + block.length };
}
