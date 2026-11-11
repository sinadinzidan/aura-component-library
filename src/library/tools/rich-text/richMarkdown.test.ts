import { parseRichInline, parseRichMarkdown, plainText } from './richMarkdown';

describe(parseRichInline.name, () => {
  it('splits bold, italic and code runs', () => {
    expect(parseRichInline('Restart **now** and _hold_ at `7000 rpm`.')).toEqual([
      { type: 'text', text: 'Restart ' },
      { type: 'bold', text: 'now' },
      { type: 'text', text: ' and ' },
      { type: 'italic', text: 'hold' },
      { type: 'text', text: ' at ' },
      { type: 'code', text: '7000 rpm' },
      { type: 'text', text: '.' },
    ]);
  });

  it('reads an https link', () => {
    expect(parseRichInline('See [the procedure](https://docs.example.test/p).')[1]).toEqual({
      type: 'link',
      text: 'the procedure',
      url: 'https://docs.example.test/p',
    });
  });

  it('keeps only the text of a link with an unsafe scheme', () => {
    expect(parseRichInline('[click](javascript:alert(1))')[0]).toEqual({ type: 'text', text: 'click' });
  });

  it('reads tags with digits and hyphens', () => {
    expect(parseRichInline('Check #23-KA-9103 first')[1]).toEqual({ type: 'tag', text: '23-KA-9103' });
  });

  it('reads a mention only for a known name', () => {
    const runs = parseRichInline('Ask @Ingrid Haugen and @Nobody', { mentions: ['Ingrid Haugen'] });
    expect(runs).toEqual([
      { type: 'text', text: 'Ask ' },
      { type: 'mention', text: 'Ingrid Haugen' },
      { type: 'text', text: ' and @Nobody' },
    ]);
  });

  it('prefers the longest known name', () => {
    expect(parseRichInline('@Liv Wold', { mentions: ['Liv', 'Liv Wold'] })).toEqual([{ type: 'mention', text: 'Liv Wold' }]);
  });

  it('does not read underscores inside a word as italic', () => {
    expect(parseRichInline('snake_case_name')).toEqual([{ type: 'text', text: 'snake_case_name' }]);
  });

  it('leaves formatting inside code alone', () => {
    expect(parseRichInline('`**x**`')).toEqual([{ type: 'code', text: '**x**' }]);
  });
});

describe(parseRichMarkdown.name, () => {
  it('reads three heading levels', () => {
    expect(parseRichMarkdown('# A\n## B\n### C')).toEqual([
      { type: 'heading', level: 1, text: 'A' },
      { type: 'heading', level: 2, text: 'B' },
      { type: 'heading', level: 3, text: 'C' },
    ]);
  });

  it('joins wrapped lines into one paragraph', () => {
    expect(parseRichMarkdown('Line one\nline two\n\nNext')).toEqual([
      { type: 'paragraph', text: 'Line one line two' },
      { type: 'paragraph', text: 'Next' },
    ]);
  });

  it('reads bullet and numbered lists', () => {
    const [bullets, numbers] = parseRichMarkdown('- a\n- b\n\n1. c\n2. d');
    expect(bullets).toMatchObject({ type: 'list', ordered: false, items: [{ text: 'a' }, { text: 'b' }] });
    expect(numbers).toMatchObject({ type: 'list', ordered: true, items: [{ text: 'c' }, { text: 'd' }] });
  });

  it('reads check items with their state', () => {
    const [list] = parseRichMarkdown('- [x] Permit closed\n- [ ] Trip reset');
    expect(list).toMatchObject({ items: [{ text: 'Permit closed', checked: true }, { text: 'Trip reset', checked: false }] });
  });

  it('nests indented items under the item before them', () => {
    const [list] = parseRichMarkdown('- Valve\n  - Opening\n  - Mode\n- Pump');
    expect(list).toMatchObject({
      items: [{ text: 'Valve', children: [{ text: 'Opening' }, { text: 'Mode' }] }, { text: 'Pump', children: [] }],
    });
  });

  it('reads a quote over several lines', () => {
    expect(parseRichMarkdown('> Stop at once\n> if it rises')).toEqual([{ type: 'quote', text: 'Stop at once if it rises' }]);
  });

  it('keeps fenced code verbatim', () => {
    expect(parseRichMarkdown('```\n- not a list\n  x < 1\n```')).toEqual([{ type: 'code', text: '- not a list\n  x < 1' }]);
  });

  it('reads a horizontal rule', () => {
    expect(parseRichMarkdown('Day\n\n---\n\nNight').map((block) => block.type)).toEqual(['paragraph', 'rule', 'paragraph']);
  });

  it('treats a line that starts with a tag as text, not a heading', () => {
    expect(parseRichMarkdown('#23-KA-9103 tripped')).toEqual([{ type: 'paragraph', text: '#23-KA-9103 tripped' }]);
  });

  it('returns nothing for white space', () => {
    expect(parseRichMarkdown(' \n\n')).toEqual([]);
  });
});

describe(plainText.name, () => {
  it('strips the Markdown and joins the blocks', () => {
    expect(plainText('# Restart\n- **Seal gas** above `0.5 bar`\n  - nested\n\n---\n\nSee [docs](https://docs.example.test).')).toBe(
      'Restart Seal gas above 0.5 bar nested See docs.'
    );
  });
});
