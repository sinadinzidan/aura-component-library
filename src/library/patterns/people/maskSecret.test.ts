import { MASK_CHARACTER, maskSecret } from './maskSecret';

const MASK = MASK_CHARACTER.repeat(8);

describe(maskSecret.name, () => {
  it('keeps the last four characters by default', () => {
    expect(maskSecret('example-key-historian-0001')).toBe(`${MASK}0001`);
  });

  it('keeps a readable prefix and suffix', () => {
    expect(maskSecret('example-key-historian-0001', { visibleStart: 12, visibleEnd: 4 })).toBe(`example-key-${MASK}0001`);
  });

  it('uses the same mask length whatever the secret length', () => {
    const short = maskSecret('example-0001');
    const long = maskSecret('example-key-with-a-much-longer-body-0001');

    expect(short).toBe(long);
  });

  it('masks everything when no end is kept', () => {
    expect(maskSecret('example-key-0001', { visibleEnd: 0 })).toBe(MASK);
  });

  it('masks a value completely when it is too short to hide anything', () => {
    expect(maskSecret('0001')).toBe(MASK);
    expect(maskSecret('abc', { visibleStart: 2, visibleEnd: 2 })).toBe(MASK);
  });

  it('returns an empty string for an empty value', () => {
    expect(maskSecret('')).toBe('');
  });

  it('honours a custom mask length', () => {
    expect(maskSecret('example-key-0001', { maskLength: 4 })).toBe(`${MASK_CHARACTER.repeat(4)}0001`);
  });

  it('treats negative options as zero', () => {
    expect(maskSecret('example-key-0001', { visibleStart: -3, visibleEnd: -1 })).toBe(MASK);
  });
});
