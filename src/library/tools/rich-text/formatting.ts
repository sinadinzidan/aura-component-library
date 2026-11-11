import { caretAt, lineBounds, mapSelectedLines, normalizeSelection, replaceSelection } from './textState';
import type { TextState } from './textState';

export type InlineFormat = 'bold' | 'italic' | 'code';
export type ListKind = 'bullet' | 'numbered' | 'check';
export type HeadingLevel = 0 | 1 | 2 | 3;

export const INLINE_MARKERS: Readonly<Record<InlineFormat, string>> = { bold: '**', italic: '_', code: '`' };

const LIST_PREFIX = /^(\s*)(?:[-*] \[[ xX]\] |[-*] |\d+[.)] )/;
const QUOTE_PREFIX = /^(\s*)> ?/;
const HEADING_PREFIX = /^#{1,6} +/;
const INDENT = '  ';

/**
 * Wraps the selection in an inline marker, or removes the marker when the selection already has
 * it — whether the markers sit inside the selection or just outside it. With nothing selected it
 * inserts an empty pair and puts the caret between; inside an empty pair it removes the pair.
 */
export function toggleInline(state: TextState, format: InlineFormat): TextState {
  const marker = INLINE_MARKERS[format];
  const size = marker.length;
  const { value, selectionStart: start, selectionEnd: end } = normalizeSelection(state);
  const selected = value.slice(start, end);

  if (value.slice(start - size, start) === marker && value.slice(end, end + size) === marker && start >= size) {
    return {
      value: value.slice(0, start - size) + selected + value.slice(end + size),
      selectionStart: start - size,
      selectionEnd: end - size,
    };
  }
  if (selected.length >= size * 2 && selected.startsWith(marker) && selected.endsWith(marker)) {
    const inner = selected.slice(size, -size);
    return { value: value.slice(0, start) + inner + value.slice(end), selectionStart: start, selectionEnd: start + inner.length };
  }
  // Markers hug the words: surrounding spaces stay outside, or the Markdown would not parse.
  const lead = selected.length - selected.trimStart().length;
  const trail = selected.length - selected.trimEnd().length;
  const core = selected.slice(lead, selected.length - trail);
  if (selected !== '' && core === '') return { value, selectionStart: start, selectionEnd: end };
  const wrapped = selected.slice(0, lead) + marker + core + marker + selected.slice(selected.length - trail);
  return {
    value: value.slice(0, start) + wrapped + value.slice(end),
    selectionStart: start + lead + size,
    selectionEnd: start + lead + size + core.length,
  };
}

/** Whether the selection (or the caret) sits directly inside a pair of the format's markers. */
export function hasInline(state: TextState, format: InlineFormat): boolean {
  const marker = INLINE_MARKERS[format];
  const { value, selectionStart: start, selectionEnd: end } = normalizeSelection(state);
  const { start: lineStart, end: lineEnd } = lineBounds({ value, selectionStart: start, selectionEnd: start });
  const before = value.slice(lineStart, start);
  const after = value.slice(end, Math.max(end, lineEnd));
  const count = (text: string) => text.split(marker).length - 1;
  // An odd number of markers before the caret means one is still open; it needs a partner after.
  return count(before) % 2 === 1 && count(after) >= 1;
}

function stripBlockPrefix(line: string): { indent: string; text: string } {
  const list = LIST_PREFIX.exec(line);
  if (list) return { indent: list[1], text: line.slice(list[0].length) };
  const indent = /^\s*/.exec(line)?.[0] ?? '';
  return { indent, text: line.slice(indent.length) };
}

/** The heading level of a line: 0 when it is not a heading. Levels past 3 read as 3. */
export function headingLevelOf(line: string): HeadingLevel {
  const match = /^(#{1,6}) +/.exec(line);
  if (!match) return 0;
  return match[1].length === 1 ? 1 : match[1].length === 2 ? 2 : 3;
}

/** Makes the selected lines headings of one level; the same level again turns them back into text. */
export function setHeading(state: TextState, level: HeadingLevel): TextState {
  const { start, end } = lineBounds(state);
  const lines = state.value.slice(start, end).split('\n');
  const allAtLevel = level !== 0 && lines.every((line) => headingLevelOf(line) === level);
  const target = allAtLevel ? 0 : level;
  return mapSelectedLines(state, (line) => {
    const text = stripBlockPrefix(line.replace(HEADING_PREFIX, '').replace(QUOTE_PREFIX, '$1')).text;
    return target === 0 ? text : `${'#'.repeat(target)} ${text}`;
  });
}

/** Which list a line belongs to, or `null`. */
export function listKindOf(line: string): ListKind | null {
  if (/^\s*[-*] \[[ xX]\] /.test(line)) return 'check';
  if (/^\s*[-*] /.test(line)) return 'bullet';
  if (/^\s*\d+[.)] /.test(line)) return 'numbered';
  return null;
}

/**
 * Turns the selected lines into a list of one kind. Lines that are already that kind go back to
 * plain text; lines of another kind are converted, keeping their indent. Numbering restarts at 1.
 */
export function toggleList(state: TextState, kind: ListKind): TextState {
  const { start, end } = lineBounds(state);
  const lines = state.value.slice(start, end).split('\n');
  const filled = lines.filter((line) => line.trim() !== '');
  const remove = filled.length > 0 && filled.every((line) => listKindOf(line) === kind);
  let number = 0;
  return mapSelectedLines(state, (line) => {
    if (line.trim() === '' && lines.length > 1) return line;
    const { indent, text } = stripBlockPrefix(line.replace(HEADING_PREFIX, ''));
    if (remove) return indent + text;
    number += 1;
    const marker = kind === 'bullet' ? '- ' : kind === 'check' ? '- [ ] ' : `${number}. `;
    return indent + marker + text;
  });
}

/** Whether a line is a block quote. */
export function isQuote(line: string): boolean {
  return /^\s*>/.test(line);
}

/** Quotes the selected lines, or removes the quote when they all have it. */
export function toggleQuote(state: TextState): TextState {
  const { start, end } = lineBounds(state);
  const lines = state.value.slice(start, end).split('\n');
  const remove = lines.every(isQuote);
  return mapSelectedLines(state, (line) => (remove ? line.replace(QUOTE_PREFIX, '$1') : `> ${line.replace(HEADING_PREFIX, '')}`));
}

/** Indents the selected lines one step (two spaces). */
export function indentLines(state: TextState): TextState {
  return mapSelectedLines(state, (line) => (line === '' ? line : INDENT + line));
}

/** Removes one indent step from the selected lines; lines without indent stay as they are. */
export function outdentLines(state: TextState): TextState {
  return mapSelectedLines(state, (line) => line.replace(/^(?: {1,2}|\t)/, ''));
}

export type LinkInput = { text: string; url: string };

/** Only `https:` and `mailto:` links are written, so a note cannot carry a script link. */
export function isSafeUrl(url: string): boolean {
  return /^(https:\/\/[^\s]+\.[^\s]+|mailto:[^\s@]+@[^\s@]+)$/i.test(url.trim());
}

/** Replaces the selection with a Markdown link and selects its text. */
export function insertLink(state: TextState, link: LinkInput): TextState {
  const { value, selectionStart: start, selectionEnd: end } = normalizeSelection(state);
  const text = (link.text.trim() || value.slice(start, end).trim() || link.url.trim()).replace(/[[\]]/g, '');
  const markdown = `[${text}](${link.url.trim()})`;
  return {
    value: value.slice(0, start) + markdown + value.slice(end),
    selectionStart: start + 1,
    selectionEnd: start + 1 + text.length,
  };
}

/** The break needed before a block that starts at `offset`, so it stands on its own lines. */
function gapBefore(value: string, offset: number): string {
  if (offset === 0) return '';
  if (value.slice(0, offset).endsWith('\n\n')) return '';
  return value[offset - 1] === '\n' ? '\n' : '\n\n';
}

function gapAfter(value: string, offset: number): string {
  if (offset >= value.length) return '\n';
  if (value.slice(offset).startsWith('\n\n')) return '';
  return value[offset] === '\n' ? '\n' : '\n\n';
}

/** Wraps the selected lines in a fenced code block, or inserts an empty one with the caret inside. */
export function insertCodeBlock(state: TextState): TextState {
  const normal = normalizeSelection(state);
  const hasSelection = normal.selectionEnd > normal.selectionStart;
  const { start, end } = hasSelection ? lineBounds(normal) : { start: normal.selectionStart, end: normal.selectionStart };
  const body = normal.value.slice(start, end);
  const lead = gapBefore(normal.value, start);
  const block = `${lead}\`\`\`\n${body}\n\`\`\`${gapAfter(normal.value, end)}`;
  const bodyStart = start + lead.length + 4;
  return {
    value: normal.value.slice(0, start) + block + normal.value.slice(end),
    selectionStart: bodyStart,
    selectionEnd: bodyStart + body.length,
  };
}

/** Inserts a horizontal rule on its own line after the current line. */
export function insertRule(state: TextState): TextState {
  const normal = normalizeSelection(state);
  const { end } = lineBounds(normal);
  const lead = gapBefore(normal.value, end);
  const rule = `${lead}---${gapAfter(normal.value, end)}`;
  const value = normal.value.slice(0, end) + rule + normal.value.slice(end);
  const after = end + rule.length;
  // Land on the line after the rule, past the break that was already there.
  return caretAt(value, value[after] === '\n' ? after + 1 : after);
}

const CONTINUE = /^(\s*)(?:([-*]) \[[ xX]\] |([-*]) |(\d+)([.)]) |(>) ?)(.*)$/;

/**
 * What Enter does inside a list or quote: a filled item starts the next one (numbers count up,
 * check items start unchecked); an empty item ends the list by removing its marker. Returns
 * `null` when the caret is not in a list, so the field can insert a plain line break.
 */
export function continueList(state: TextState): TextState | null {
  const normal = normalizeSelection(state);
  if (normal.selectionStart !== normal.selectionEnd) return null;
  const caret = normal.selectionStart;
  const { start, end } = lineBounds(normal);
  const line = normal.value.slice(start, end);
  const match = CONTINUE.exec(line);
  if (!match) return null;
  const [, indent, checkBullet, bullet, number, numberEnd, quote, text] = match;
  const prefixLength = line.length - text.length;
  if (caret - start < prefixLength) return null;

  if (text.trim() === '') {
    // Enter on an empty item leaves the list; a nested item first steps out one level.
    const kept = indent.length >= 2 ? indent.slice(2) + line.slice(indent.length) : '';
    return caretAt(normal.value.slice(0, start) + kept + normal.value.slice(end), start + kept.length);
  }
  const marker = checkBullet
    ? `${checkBullet} [ ] `
    : bullet
      ? `${bullet} `
      : number
        ? `${Number(number) + 1}${numberEnd} `
        : quote
          ? '> '
          : '';
  return replaceSelection(normal, `\n${indent}${marker}`);
}

export type ActiveFormats = {
  bold: boolean;
  italic: boolean;
  code: boolean;
  heading: HeadingLevel;
  list: ListKind | null;
  quote: boolean;
};

/** The formats in effect at the selection, for the pressed state of toolbar buttons. */
export function activeFormats(state: TextState): ActiveFormats {
  const { start, end } = lineBounds(state);
  const line = state.value.slice(start, end).split('\n')[0];
  return {
    bold: hasInline(state, 'bold'),
    italic: hasInline(state, 'italic'),
    code: hasInline(state, 'code'),
    heading: headingLevelOf(line),
    list: listKindOf(line),
    quote: isQuote(line),
  };
}
