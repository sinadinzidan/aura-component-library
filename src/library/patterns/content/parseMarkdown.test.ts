import { parseInline, parseMarkdown } from './parseMarkdown';

describe(parseInline.name, () => {
  it('returns plain text as one run', () => {
    expect(parseInline('Reset the trip')).toEqual([{ text: 'Reset the trip', style: 'plain' }]);
  });

  it('splits bold, italic and code runs', () => {
    expect(parseInline('Open **XV-1105** to `25%`, _slowly_.')).toEqual([
      { text: 'Open ', style: 'plain' },
      { text: 'XV-1105', style: 'bold' },
      { text: ' to ', style: 'plain' },
      { text: '25%', style: 'code' },
      { text: ', ', style: 'plain' },
      { text: 'slowly', style: 'italic' },
      { text: '.', style: 'plain' },
    ]);
  });

  it('leaves unclosed markers as they were typed', () => {
    expect(parseInline('5 * 3 and **open')).toEqual([{ text: '5 * 3 and **open', style: 'plain' }]);
  });

  it('returns nothing for an empty line', () => {
    expect(parseInline('')).toEqual([]);
  });
});

describe(parseMarkdown.name, () => {
  it('reads headings at two levels', () => {
    expect(parseMarkdown('# Start-up\n## Checks')).toEqual([
      { type: 'heading', level: 2, text: 'Start-up' },
      { type: 'heading', level: 3, text: 'Checks' },
    ]);
  });

  it('joins wrapped lines into one paragraph and splits on a blank line', () => {
    expect(parseMarkdown('Confirm the cause\nbefore resetting.\n\nThen start.')).toEqual([
      { type: 'paragraph', text: 'Confirm the cause before resetting.' },
      { type: 'paragraph', text: 'Then start.' },
    ]);
  });

  it('groups bullets into one list', () => {
    expect(parseMarkdown('- Seal gas\n* Lube oil')).toEqual([{ type: 'list', ordered: false, items: ['Seal gas', 'Lube oil'] }]);
  });

  it('groups numbered lines into an ordered list', () => {
    expect(parseMarkdown('1. Isolate\n2) Vent')).toEqual([{ type: 'list', ordered: true, items: ['Isolate', 'Vent'] }]);
  });

  it('ends a paragraph where a list starts', () => {
    expect(parseMarkdown('Before start:\n- Seal gas')).toEqual([
      { type: 'paragraph', text: 'Before start:' },
      { type: 'list', ordered: false, items: ['Seal gas'] },
    ]);
  });

  it('joins quoted lines', () => {
    expect(parseMarkdown('> Do not restart\n> without approval.')).toEqual([{ type: 'quote', text: 'Do not restart without approval.' }]);
  });

  it('keeps fenced code as typed, including blank lines', () => {
    expect(parseMarkdown('```\nSELECT 1\n\n- not a list\n```\nAfter')).toEqual([
      { type: 'code', text: 'SELECT 1\n\n- not a list' },
      { type: 'paragraph', text: 'After' },
    ]);
  });

  it('closes an unfinished code fence at the end', () => {
    expect(parseMarkdown('```\nSELECT 1')).toEqual([{ type: 'code', text: 'SELECT 1' }]);
  });

  it('handles Windows line endings and blank input', () => {
    expect(parseMarkdown('# A\r\nB')).toEqual([
      { type: 'heading', level: 2, text: 'A' },
      { type: 'paragraph', text: 'B' },
    ]);
    expect(parseMarkdown('  \n\n')).toEqual([]);
  });
});
