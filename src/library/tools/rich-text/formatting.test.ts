import {
  activeFormats,
  continueList,
  headingLevelOf,
  indentLines,
  insertCodeBlock,
  insertLink,
  insertRule,
  isSafeUrl,
  listKindOf,
  outdentLines,
  setHeading,
  toggleInline,
  toggleList,
  toggleQuote,
} from './formatting';
import type { TextState } from './textState';

/** Builds a state from text where `|` marks the caret or both ends of the selection. */
function at(marked: string): TextState {
  const first = marked.indexOf('|');
  const rest = marked.slice(0, first) + marked.slice(first + 1);
  const second = rest.indexOf('|');
  if (second === -1) return { value: rest, selectionStart: first, selectionEnd: first };
  return { value: rest.slice(0, second) + rest.slice(second + 1), selectionStart: first, selectionEnd: second };
}

/** The inverse of `at`, so expectations read like the text on screen. */
function show(state: TextState): string {
  const { value, selectionStart, selectionEnd } = state;
  if (selectionStart === selectionEnd) return `${value.slice(0, selectionStart)}|${value.slice(selectionStart)}`;
  return `${value.slice(0, selectionStart)}|${value.slice(selectionStart, selectionEnd)}|${value.slice(selectionEnd)}`;
}

describe(toggleInline.name, () => {
  it('wraps the selection and keeps it selected', () => {
    expect(show(toggleInline(at('Restart |23-KA-9103| now'), 'bold'))).toBe('Restart **|23-KA-9103|** now');
  });

  it('unwraps when the markers sit just outside the selection', () => {
    expect(show(toggleInline(at('Restart **|23-KA-9103|** now'), 'bold'))).toBe('Restart |23-KA-9103| now');
  });

  it('unwraps when the markers are part of the selection', () => {
    expect(show(toggleInline(at('Restart |**23-KA-9103**| now'), 'bold'))).toBe('Restart |23-KA-9103| now');
  });

  it('inserts an empty pair at a bare caret', () => {
    expect(show(toggleInline(at('Trip at |'), 'italic'))).toBe('Trip at _|_');
  });

  it('removes an empty pair when toggled again', () => {
    expect(show(toggleInline(at('Trip at _|_'), 'italic'))).toBe('Trip at |');
  });

  it('keeps surrounding spaces outside the markers', () => {
    expect(show(toggleInline(at('hold| for 10 minutes |then ramp'), 'code'))).toBe('hold `|for 10 minutes|` then ramp');
  });

  it('leaves a selection of only spaces alone', () => {
    expect(show(toggleInline(at('a|  |b'), 'bold'))).toBe('a|  |b');
  });

  it.each([
    ['bold', '**'],
    ['italic', '_'],
    ['code', '`'],
  ] as const)('uses the %s marker', (format, marker) => {
    expect(toggleInline(at('|x|'), format).value).toBe(`${marker}x${marker}`);
  });
});

describe(setHeading.name, () => {
  it('turns the caret line into a heading and keeps the caret in its text', () => {
    expect(show(setHeading(at('Before\nStart se|quence\nAfter'), 2))).toBe('Before\n## Start se|quence\nAfter');
  });

  it('changes the level of an existing heading', () => {
    expect(setHeading(at('# Sta|rt'), 3).value).toBe('### Start');
  });

  it('turns a heading back into text when the same level is applied', () => {
    expect(show(setHeading(at('## Sta|rt'), 2))).toBe('Sta|rt');
  });

  it('replaces a list marker rather than stacking prefixes', () => {
    expect(setHeading(at('- Seal gas|'), 1).value).toBe('# Seal gas');
  });

  it('applies to every selected line', () => {
    expect(setHeading(at('|One\nTwo|\nThree'), 1).value).toBe('# One\n# Two\nThree');
  });

  it('level 0 always removes the heading', () => {
    expect(setHeading(at('### Not|e'), 0).value).toBe('Note');
  });
});

describe(headingLevelOf.name, () => {
  it.each([
    ['Text', 0],
    ['# One', 1],
    ['## Two', 2],
    ['### Three', 3],
    ['##### Five', 3],
    ['#tag', 0],
  ])('reads %s as level %i', (line, level) => {
    expect(headingLevelOf(line)).toBe(level);
  });
});

describe(toggleList.name, () => {
  it('makes selected lines a bullet list', () => {
    expect(show(toggleList(at('|Seal gas\nLube oil|'), 'bullet'))).toBe('|- Seal gas\n- Lube oil|');
  });

  it('numbers lines from 1', () => {
    expect(toggleList(at('|Reset\nStart\nRamp|'), 'numbered').value).toBe('1. Reset\n2. Start\n3. Ramp');
  });

  it('starts check items unchecked', () => {
    expect(toggleList(at('Permit closed|'), 'check').value).toBe('- [ ] Permit closed');
  });

  it('removes the list when every line already has it', () => {
    expect(toggleList(at('|- Seal gas\n- Lube oil|'), 'bullet').value).toBe('Seal gas\nLube oil');
  });

  it('converts one kind of list into another', () => {
    expect(toggleList(at('|- Reset\n- Start|'), 'numbered').value).toBe('1. Reset\n2. Start');
  });

  it('converts a check list to bullets without leaving the box behind', () => {
    expect(toggleList(at('- [x] Don|e'), 'bullet').value).toBe('- Done');
  });

  it('keeps the indent of nested items', () => {
    expect(toggleList(at('|- Valve\n  - Opening|'), 'numbered').value).toBe('1. Valve\n  2. Opening');
  });

  it('skips blank lines inside the selection', () => {
    expect(toggleList(at('|One\n\nTwo|'), 'bullet').value).toBe('- One\n\n- Two');
  });

  it('starts an empty item on an empty line', () => {
    expect(show(toggleList(at('|'), 'bullet'))).toBe('- |');
  });
});

describe(listKindOf.name, () => {
  it.each([
    ['- a', 'bullet'],
    ['* a', 'bullet'],
    ['  3. a', 'numbered'],
    ['2) a', 'numbered'],
    ['- [ ] a', 'check'],
    ['- [x] a', 'check'],
    ['a - b', null],
  ])('reads %s as %s', (line, kind) => {
    expect(listKindOf(line)).toBe(kind);
  });
});

describe(toggleQuote.name, () => {
  it('quotes the selected lines', () => {
    expect(toggleQuote(at('|Stop at once\nif vibration rises|')).value).toBe('> Stop at once\n> if vibration rises');
  });

  it('removes the quote when all lines have it', () => {
    expect(toggleQuote(at('|> Stop\n> now|')).value).toBe('Stop\nnow');
  });
});

describe('indent and outdent', () => {
  it('indents every selected line by two spaces', () => {
    expect(show(indentLines(at('|- a\n- b|')))).toBe('|  - a\n  - b|');
  });

  it('moves the caret with its line', () => {
    expect(show(indentLines(at('- a|')))).toBe('  - a|');
  });

  it('outdents one step and stops at the margin', () => {
    expect(outdentLines(at('|    - a\n- b|')).value).toBe('  - a\n- b');
  });

  it('outdent is the inverse of indent', () => {
    const start = at('|- a\n  - b|');
    expect(outdentLines(indentLines(start)).value).toBe(start.value);
  });
});

describe(insertLink.name, () => {
  it('uses the given text and selects it', () => {
    expect(show(insertLink(at('See |'), { text: 'the procedure', url: 'https://docs.example.test/restart' }))).toBe(
      'See [|the procedure|](https://docs.example.test/restart)'
    );
  });

  it('falls back to the selected text', () => {
    expect(insertLink(at('See |restart steps|'), { text: '', url: 'https://docs.example.test' }).value).toBe(
      'See [restart steps](https://docs.example.test)'
    );
  });

  it('falls back to the address when there is no text at all', () => {
    expect(insertLink(at('|'), { text: ' ', url: 'https://docs.example.test' }).value).toBe('[https://docs.example.test](https://docs.example.test)');
  });

  it('drops brackets that would break the link', () => {
    expect(insertLink(at('|'), { text: 'P&ID [rev C]', url: 'https://docs.example.test' }).value).toBe('[P&ID rev C](https://docs.example.test)');
  });
});

describe(isSafeUrl.name, () => {
  it.each(['https://docs.example.test', 'https://docs.example.test/a?b=1', 'mailto:ops@example.test'])('accepts %s', (url) => {
    expect(isSafeUrl(url)).toBe(true);
  });

  it.each(['', 'docs.example.test', 'http://docs.example.test', 'javascript:alert(1)', 'https://', 'https://has space.test'])('rejects %s', (url) => {
    expect(isSafeUrl(url)).toBe(false);
  });
});

describe(insertCodeBlock.name, () => {
  it('inserts an empty fence with the caret inside', () => {
    expect(show(insertCodeBlock(at('|')))).toBe('```\n|\n```\n');
  });

  it('separates the fence from the text before it', () => {
    expect(show(insertCodeBlock(at('Limits:|')))).toBe('Limits:\n\n```\n|\n```\n');
  });

  it('wraps whole selected lines', () => {
    expect(show(insertCodeBlock(at('Limits:\n|speed >= 7000\nvib < 7.1|\nEnd')))).toBe('Limits:\n\n```\n|speed >= 7000\nvib < 7.1|\n```\n\nEnd');
  });
});

describe(insertRule.name, () => {
  it('adds a rule after the current line', () => {
    expect(show(insertRule(at('Day sh|ift\nNight shift')))).toBe('Day shift\n\n---\n\n|Night shift');
  });

  it('adds a rule at the end of the note', () => {
    expect(insertRule(at('Day shift|')).value).toBe('Day shift\n\n---\n');
  });
});

describe(continueList.name, () => {
  it('starts the next bullet', () => {
    expect(show(continueList(at('- Seal gas|') )!)).toBe('- Seal gas\n- |');
  });

  it('counts numbered items up', () => {
    expect(show(continueList(at('1. Reset\n2. Start|'))!)).toBe('1. Reset\n2. Start\n3. |');
  });

  it('starts the next check item unchecked', () => {
    expect(show(continueList(at('- [x] Permit closed|'))!)).toBe('- [x] Permit closed\n- [ ] |');
  });

  it('continues a quote', () => {
    expect(show(continueList(at('> Stop at once|'))!)).toBe('> Stop at once\n> |');
  });

  it('keeps the indent of a nested item', () => {
    expect(show(continueList(at('- Valve\n  - Opening|'))!)).toBe('- Valve\n  - Opening\n  - |');
  });

  it('splits an item at the caret', () => {
    expect(show(continueList(at('- Seal| gas'))!)).toBe('- Seal\n- | gas');
  });

  it('ends the list on an empty item', () => {
    expect(show(continueList(at('- Seal gas\n- |'))!)).toBe('- Seal gas\n|');
  });

  it('steps a nested empty item out one level first', () => {
    expect(show(continueList(at('- Valve\n  - |'))!)).toBe('- Valve\n- |');
  });

  it.each(['Plain text|', '- |Seal gas'.replace('- |', '|- '), '|- a\n- b|'])('returns null for %s', (text) => {
    expect(continueList(at(text))).toBeNull();
  });
});

describe(activeFormats.name, () => {
  it('reports inline formats around the caret', () => {
    expect(activeFormats(at('Restart **23-KA|-9103** now'))).toMatchObject({ bold: true, italic: false, code: false });
  });

  it('does not report a format the caret has left', () => {
    expect(activeFormats(at('Restart **23-KA-9103** n|ow')).bold).toBe(false);
  });

  it('reports the block format of the caret line', () => {
    expect(activeFormats(at('## Before st|art'))).toMatchObject({ heading: 2, list: null, quote: false });
    expect(activeFormats(at('1. Res|et'))).toMatchObject({ heading: 0, list: 'numbered' });
    expect(activeFormats(at('> Sto|p'))).toMatchObject({ quote: true });
  });
});
