import { isEmail, parseEmails } from './parseEmails';

describe(isEmail.name, () => {
  it('accepts a plain address', () => {
    expect(isEmail('ingrid.haugen@nordkapp.example')).toBe(true);
  });

  it('ignores surrounding whitespace', () => {
    expect(isEmail('  liv.wold@nordkapp.example ')).toBe(true);
  });

  it('rejects an address without a domain dot', () => {
    expect(isEmail('ingrid@nordkapp')).toBe(false);
  });

  it('rejects an address without an at sign', () => {
    expect(isEmail('nordkapp.example')).toBe(false);
  });

  it('rejects an empty domain label', () => {
    expect(isEmail('ingrid@nordkapp..example')).toBe(false);
  });
});

describe(parseEmails.name, () => {
  it('returns nothing for empty text', () => {
    expect(parseEmails('  ')).toEqual({ valid: [], invalid: [] });
  });

  it('parses a single address', () => {
    expect(parseEmails('aisha.khan@nordkapp.example').valid).toEqual(['aisha.khan@nordkapp.example']);
  });

  it('splits on commas, semicolons, spaces and new lines', () => {
    const { valid } = parseEmails('a@x.example, b@x.example;c@x.example\nd@x.example e@x.example');

    expect(valid).toEqual(['a@x.example', 'b@x.example', 'c@x.example', 'd@x.example', 'e@x.example']);
  });

  it('lower-cases and removes duplicates', () => {
    expect(parseEmails('Liv.Wold@Nordkapp.example, liv.wold@nordkapp.example').valid).toEqual([
      'liv.wold@nordkapp.example',
    ]);
  });

  it('collects malformed entries as typed', () => {
    expect(parseEmails('jonas@nordkapp.example, Tomas, tomas@')).toEqual({
      valid: ['jonas@nordkapp.example'],
      invalid: ['Tomas', 'tomas@'],
    });
  });

  it('lists a repeated malformed entry once', () => {
    expect(parseEmails('tomas tomas').invalid).toEqual(['tomas']);
  });
});
