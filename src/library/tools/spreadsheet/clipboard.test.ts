import { parseClipboard, serializeRange } from './clipboard';

describe('serializeRange', () => {
  it('joins cells with tabs and rows with line breaks', () => {
    expect(serializeRange([['23-PT-92531', '52'], ['23-PT-92530', '15']])).toBe('23-PT-92531\t52\n23-PT-92530\t15');
  });

  it('keeps empty cells', () => {
    expect(serializeRange([['a', '', 'c']])).toBe('a\t\tc');
  });

  it('quotes cells that hold a tab, a quote or a line break', () => {
    expect(serializeRange([['two\tparts', 'say "hi"', 'line\nbreak']])).toBe('"two\tparts"\t"say ""hi"""\t"line\nbreak"');
  });

  it('gives empty text for no rows', () => {
    expect(serializeRange([])).toBe('');
  });
});

describe('parseClipboard', () => {
  it('splits rows and cells', () => {
    expect(parseClipboard('a\tb\nc\td')).toEqual([['a', 'b'], ['c', 'd']]);
  });

  it('accepts Windows and old Mac line ends', () => {
    expect(parseClipboard('a\tb\r\nc\td')).toEqual([['a', 'b'], ['c', 'd']]);
    expect(parseClipboard('a\rb')).toEqual([['a'], ['b']]);
  });

  it('ignores one trailing line break', () => {
    expect(parseClipboard('a\tb\n')).toEqual([['a', 'b']]);
    expect(parseClipboard('a\r\n')).toEqual([['a']]);
  });

  it('keeps an empty row in the middle', () => {
    expect(parseClipboard('a\n\nb')).toEqual([['a'], [''], ['b']]);
  });

  it('keeps empty cells', () => {
    expect(parseClipboard('a\t\tc')).toEqual([['a', '', 'c']]);
    expect(parseClipboard('\t')).toEqual([['', '']]);
  });

  it('reads quoted cells with tabs, line breaks and doubled quotes', () => {
    expect(parseClipboard('"two\tparts"\t"say ""hi"""\t"line\nbreak"')).toEqual([['two\tparts', 'say "hi"', 'line\nbreak']]);
  });

  it('treats a quote inside an unquoted cell as text', () => {
    expect(parseClipboard('5" pipe\tb')).toEqual([['5" pipe', 'b']]);
  });

  it('returns no rows for empty text', () => {
    expect(parseClipboard('')).toEqual([]);
  });

  it('reads a single value', () => {
    expect(parseClipboard('52')).toEqual([['52']]);
  });

  it('round-trips what serializeRange writes', () => {
    const rows = [['a "quoted" tag', 'x\ty', ''], ['1.5', 'multi\nline', 'z']];
    expect(parseClipboard(serializeRange(rows))).toEqual(rows);
  });
});
