import { indentLines, insertCodeBlock, insertRule, outdentLines, setHeading, toggleInline, toggleList, toggleQuote } from './formatting';
import { normalizeSelection, replaceSelection } from './textState';
import type { TextState } from './textState';

/** Everything a toolbar button or shortcut can do to the text. Links go through `insertLink`. */
export type RichCommand =
  | 'bold'
  | 'italic'
  | 'code'
  | 'heading-1'
  | 'heading-2'
  | 'heading-3'
  | 'bullet'
  | 'numbered'
  | 'check'
  | 'quote'
  | 'code-block'
  | 'rule'
  | 'indent'
  | 'outdent'
  | 'mention'
  | 'tag';

/** Types a lookup character at the caret, with a space before it when it would otherwise join a word. */
function startLookup(state: TextState, char: '@' | '#'): TextState {
  const normal = normalizeSelection(state);
  const before = normal.value[normal.selectionStart - 1];
  const needsSpace = before !== undefined && !/\s/.test(before);
  return replaceSelection(normal, `${needsSpace ? ' ' : ''}${char}`);
}

/** Applies one formatting command to a text state. Pure: the same input always gives the same text. */
export function applyCommand(state: TextState, command: RichCommand): TextState {
  switch (command) {
    case 'bold':
    case 'italic':
    case 'code':
      return toggleInline(state, command);
    case 'heading-1':
      return setHeading(state, 1);
    case 'heading-2':
      return setHeading(state, 2);
    case 'heading-3':
      return setHeading(state, 3);
    case 'bullet':
    case 'numbered':
    case 'check':
      return toggleList(state, command);
    case 'quote':
      return toggleQuote(state);
    case 'code-block':
      return insertCodeBlock(state);
    case 'rule':
      return insertRule(state);
    case 'indent':
      return indentLines(state);
    case 'outdent':
      return outdentLines(state);
    case 'mention':
      return startLookup(state, '@');
    case 'tag':
      return startLookup(state, '#');
  }
}

/** The command a Ctrl/⌘ shortcut maps to, if any. `K` (link) is handled by the editor itself. */
export function commandForShortcut(key: string, shift: boolean): RichCommand | null {
  const lower = key.toLowerCase();
  if (!shift && lower === 'b') return 'bold';
  if (!shift && lower === 'i') return 'italic';
  if (!shift && lower === 'e') return 'code';
  if (shift && lower === '7') return 'numbered';
  if (shift && lower === '8') return 'bullet';
  if (shift && lower === '9') return 'check';
  return null;
}
