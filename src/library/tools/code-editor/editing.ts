import { caretAt, lineBounds, mapSelectedLines, normalizeSelection, replaceSelection } from '../rich-text/textState';
import type { TextState } from '../rich-text/textState';

export type CodeLanguage = 'sql' | 'json' | 'yaml' | 'text';

export const INDENT_UNIT = '  ';

/** The line-comment marker of a language, or `null` where there is none (JSON). */
export function commentPrefix(language: CodeLanguage): string | null {
  switch (language) {
    case 'sql':
      return '--';
    case 'yaml':
      return '#';
    default:
      return null;
  }
}

const PAIRS: Readonly<Record<string, string>> = { '(': ')', '[': ']', '{': '}', "'": "'", '"': '"' };
const CLOSERS = new Set([')', ']', '}', "'", '"']);

/**
 * What typing one character should do inside a code field, or `null` to let the browser type it
 * normally. An opening bracket or quote adds its partner (or wraps the selection), typing the
 * partner right before the same character steps over it, and a quote after a letter or digit is
 * an apostrophe, not a pair.
 */
export function typeCharacter(state: TextState, char: string): TextState | null {
  const { value, selectionStart: start, selectionEnd: end } = normalizeSelection(state);
  const selected = value.slice(start, end);
  const next = value[end];
  const before = value[start - 1];

  if (start === end && CLOSERS.has(char) && next === char) return caretAt(value, start + 1);
  const close = PAIRS[char];
  if (close === undefined) return null;
  if (selected !== '') {
    return { value: value.slice(0, start) + char + selected + close + value.slice(end), selectionStart: start + 1, selectionEnd: end + 1 };
  }
  if (char === close && before !== undefined && /[A-Za-z0-9_]/.test(before)) return null;
  // Before a word, a bracket pair would swallow it: type the bare character.
  if (next !== undefined && /[A-Za-z0-9_]/.test(next)) return null;
  return caretAt(value.slice(0, start) + char + close + value.slice(end), start + 1);
}

/** Backspace between an empty pair (`(|)`, `'|'`) removes both characters; otherwise `null`. */
export function backspacePair(state: TextState): TextState | null {
  const { value, selectionStart: start, selectionEnd: end } = normalizeSelection(state);
  if (start !== end || start === 0) return null;
  const open = value[start - 1];
  if (PAIRS[open] !== undefined && PAIRS[open] === value[start]) return caretAt(value.slice(0, start - 1) + value.slice(start + 1), start - 1);
  return null;
}

/**
 * Enter keeps the indent of the current line, adds one step after an opening bracket, and between
 * a bracket pair opens the pair onto its own line. Returns `null` when nothing special applies.
 */
export function enterWithIndent(state: TextState): TextState | null {
  const normal = normalizeSelection(state);
  const { value, selectionStart: start } = normal;
  const { start: lineStart } = lineBounds(caretAt(value, start));
  const indent = /^[ \t]*/.exec(value.slice(lineStart, start))?.[0] ?? '';
  const before = value[start - 1];
  const after = value[start];
  const opens = before !== undefined && '([{'.includes(before);
  if (indent === '' && !opens) return null;
  if (opens && after !== undefined && PAIRS[before] === after) {
    const inner = `\n${indent}${INDENT_UNIT}`;
    return caretAt(value.slice(0, normal.selectionStart) + inner + `\n${indent}` + value.slice(normal.selectionEnd), start + inner.length);
  }
  return replaceSelection(normal, `\n${indent}${opens ? INDENT_UNIT : ''}`);
}

/** Tab: indent the selected lines, or insert one indent step at a bare caret. */
export function indentSelection(state: TextState): TextState {
  const normal = normalizeSelection(state);
  const spansLines = normal.value.slice(normal.selectionStart, normal.selectionEnd).includes('\n');
  if (normal.selectionStart === normal.selectionEnd || !spansLines) {
    if (normal.selectionStart === normal.selectionEnd) return replaceSelection(normal, INDENT_UNIT);
  }
  return mapSelectedLines(normal, (line) => (line === '' ? line : INDENT_UNIT + line));
}

/** Shift+Tab: remove up to one indent step from every selected line. */
export function outdentSelection(state: TextState): TextState {
  const normal = normalizeSelection(state);
  const bounds = lineBounds(normal);
  const first = normal.value.slice(bounds.start).split('\n')[0];
  const removed = /^(?: {1,2}|\t)/.exec(first)?.[0].length ?? 0;
  const mapped = mapSelectedLines(normal, (line) => line.replace(/^(?: {1,2}|\t)/, ''));
  if (normal.selectionStart === normal.selectionEnd) {
    // mapSelectedLines keeps a caret in its text; make sure it never lands before the line start.
    return caretAt(mapped.value, Math.max(bounds.start, normal.selectionStart - removed));
  }
  return mapped;
}

/**
 * Ctrl/⌘+/: comments the selected lines out, or removes the comment when every non-blank line
 * has it. The marker goes at the shallowest indent so the block stays aligned.
 */
export function toggleComment(state: TextState, prefix: string): TextState {
  const normal = normalizeSelection(state);
  const { start, end } = lineBounds(normal);
  const lines = normal.value.slice(start, end).split('\n');
  const filled = lines.filter((line) => line.trim() !== '');
  const marked = filled.length > 0 && filled.every((line) => line.trimStart().startsWith(prefix));
  const indent = Math.min(...filled.map((line) => line.length - line.trimStart().length), Infinity);
  return mapSelectedLines(normal, (line) => {
    if (line.trim() === '') return line;
    if (marked) return line.replace(new RegExp(`^(\\s*)${prefix.replace(/[#]/g, '\\$&')} ?`), '$1');
    return `${line.slice(0, indent)}${prefix} ${line.slice(indent)}`;
  });
}

/** One-based line and column of the caret, for the status line. */
export function caretPosition(state: TextState): { line: number; column: number } {
  const { value, selectionStart } = normalizeSelection(state);
  const before = value.slice(0, selectionStart);
  return { line: before.split('\n').length, column: selectionStart - (before.lastIndexOf('\n') + 1) + 1 };
}

/** Zero-based line of the caret, for the current-line highlight. */
export function caretLine(state: TextState): number {
  return caretPosition(state).line - 1;
}
