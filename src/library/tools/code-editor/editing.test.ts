import type { TextState } from '../rich-text/textState';

import { backspacePair, caretLine, caretPosition, commentPrefix, enterWithIndent, indentSelection, outdentSelection, toggleComment, typeCharacter } from './editing';

/** Builds a state from text where `|` marks the caret or both ends of the selection. */
function at(marked: string): TextState {
  const first = marked.indexOf('|');
  const rest = marked.slice(0, first) + marked.slice(first + 1);
  const second = rest.indexOf('|');
  if (second === -1) return { value: rest, selectionStart: first, selectionEnd: first };
  return { value: rest.slice(0, second) + rest.slice(second + 1), selectionStart: first, selectionEnd: second };
}

function show(state: TextState | null): string {
  if (!state) return 'null';
  const { value, selectionStart, selectionEnd } = state;
  if (selectionStart === selectionEnd) return `${value.slice(0, selectionStart)}|${value.slice(selectionStart)}`;
  return `${value.slice(0, selectionStart)}|${value.slice(selectionStart, selectionEnd)}|${value.slice(selectionEnd)}`;
}

describe(typeCharacter.name, () => {
  it.each([
    ['(', '()'],
    ['[', '[]'],
    ['{', '{}'],
    ["'", "''"],
    ['"', '""'],
  ])('closes %s with its partner and puts the caret between', (char, pair) => {
    expect(show(typeCharacter(at('SELECT |'), char))).toBe(`SELECT ${pair[0]}|${pair[1]}`);
  });

  it('wraps a selection', () => {
    expect(show(typeCharacter(at('WHERE unit = |barg|'), "'"))).toBe("WHERE unit = '|barg|'");
  });

  it('steps over a closing character that is already there', () => {
    expect(show(typeCharacter(at('count(|)'), ')'))).toBe('count()|');
    expect(show(typeCharacter(at("'abc|'"), "'"))).toBe("'abc'|");
  });

  it('types an apostrophe after a letter as itself', () => {
    expect(typeCharacter(at('don|'), "'")).toBeNull();
  });

  it('does not pair in front of a word', () => {
    expect(typeCharacter(at('|tag'), '(')).toBeNull();
  });

  it('leaves other characters to the browser', () => {
    expect(typeCharacter(at('a|'), 'b')).toBeNull();
    expect(typeCharacter(at('a|'), ')')).toBeNull();
  });
});

describe(backspacePair.name, () => {
  it('removes an empty pair', () => {
    expect(show(backspacePair(at("x = '|'")))).toBe('x = |');
    expect(show(backspacePair(at('f(|)')))).toBe('f|');
  });

  it('leaves a pair with text in it', () => {
    expect(backspacePair(at("'a|'"))).toBeNull();
  });

  it('leaves a selection and the start of the text alone', () => {
    expect(backspacePair(at('(|)|'))).toBeNull();
    expect(backspacePair(at('|()'))).toBeNull();
  });
});

describe(enterWithIndent.name, () => {
  it('keeps the indent of the current line', () => {
    expect(show(enterWithIndent(at('  SELECT a|')))).toBe('  SELECT a\n  |');
  });

  it('adds a step after an opening bracket', () => {
    expect(show(enterWithIndent(at('{|')))).toBe('{\n  |');
  });

  it('opens a bracket pair onto its own lines', () => {
    expect(show(enterWithIndent(at('  {|}')))).toBe('  {\n    |\n  }');
  });

  it('defers to the browser when nothing applies', () => {
    expect(enterWithIndent(at('SELECT a|'))).toBeNull();
  });
});

describe('indent and outdent', () => {
  it('inserts an indent step at a bare caret', () => {
    expect(show(indentSelection(at('a|b')))).toBe('a  |b');
  });

  it('indents every selected line', () => {
    expect(show(indentSelection(at('|a\nb|')))).toBe('|  a\n  b|');
  });

  it('indents a selection within one line as a line', () => {
    expect(indentSelection(at('a|bc|d')).value).toBe('  abcd');
  });

  it('outdents every selected line by up to one step', () => {
    expect(outdentSelection(at('|    a\n b\nc|')).value).toBe('  a\nb\nc');
  });

  it('moves a bare caret back with its line and never past the line start', () => {
    expect(show(outdentSelection(at('  a|')))).toBe('a|');
    expect(show(outdentSelection(at(' | a')))).toBe('|a');
  });
});

describe(toggleComment.name, () => {
  it('comments the selected lines at their shallowest indent', () => {
    expect(toggleComment(at('|SELECT a\n  FROM b|'), '--').value).toBe('-- SELECT a\n--   FROM b');
  });

  it('removes the comment when every line has it', () => {
    expect(toggleComment(at('|-- SELECT a\n--   FROM b|'), '--').value).toBe('SELECT a\n  FROM b');
  });

  it('comments a mixed selection instead of removing', () => {
    expect(toggleComment(at('|-- a\nb|'), '--').value).toBe('-- -- a\n-- b');
  });

  it('skips blank lines', () => {
    expect(toggleComment(at('|a\n\nb|'), '#').value).toBe('# a\n\n# b');
  });

  it('works with the yaml marker', () => {
    expect(toggleComment(at('# retries: 3|'), '#').value).toBe('retries: 3');
  });

  it('is its own inverse', () => {
    const start = at('|SELECT a\n  FROM b|');
    expect(toggleComment(toggleComment(start, '--'), '--').value).toBe(start.value);
  });
});

describe('caret helpers', () => {
  it('gives one-based line and column', () => {
    expect(caretPosition(at('ab\ncd|e'))).toEqual({ line: 2, column: 3 });
    expect(caretPosition(at('|'))).toEqual({ line: 1, column: 1 });
  });

  it('gives the zero-based line', () => {
    expect(caretLine(at('a\nb\nc|'))).toBe(2);
  });

  it('knows which languages have comments', () => {
    expect(commentPrefix('sql')).toBe('--');
    expect(commentPrefix('yaml')).toBe('#');
    expect(commentPrefix('json')).toBeNull();
  });
});
