import { parseCssColor, resolveTokenColors, sameTokenColors } from './tokenColors';

describe(parseCssColor.name, () => {
  it('reads an opaque rgb colour', () => {
    expect(parseCssColor('rgb(31, 38, 56)')).toEqual({ color: 'rgb(31, 38, 56)', opacity: 1 });
  });

  it('splits rgba into colour and opacity', () => {
    expect(parseCssColor('rgba(95, 131, 226, 0.85)')).toEqual({ color: 'rgb(95, 131, 226)', opacity: 0.85 });
  });

  it('reads the space-separated syntax with a slash alpha', () => {
    expect(parseCssColor('rgb(95 131 226 / 50%)')).toEqual({ color: 'rgb(95, 131, 226)', opacity: 0.5 });
  });

  it('reads color(srgb …) as browsers return it from color-mix', () => {
    expect(parseCssColor('color(srgb 1 0.5 0 / 0.4)')).toEqual({ color: 'rgb(255, 128, 0)', opacity: 0.4 });
  });

  it('clamps channels and alpha into range', () => {
    expect(parseCssColor('rgba(300, -4, 12.6, 3)')).toEqual({ color: 'rgb(255, 0, 13)', opacity: 1 });
  });

  it('returns null for other colour spaces', () => {
    expect(parseCssColor('color(display-p3 1 0 0)')).toBeNull();
  });

  it('returns null for text that is not a colour', () => {
    expect(parseCssColor('')).toBeNull();
    expect(parseCssColor('rgb(1, 2)')).toBeNull();
    expect(parseCssColor('rgb(a, b, c)')).toBeNull();
  });
});

describe(resolveTokenColors.name, () => {
  it('resolves every key through the reader', () => {
    const read = vi.fn((token: string) => (token === 'card-background' ? 'rgb(1, 2, 3)' : 'rgba(4, 5, 6, 0.5)'));

    const colors = resolveTokenColors({ surface: 'card-background', series: 'chart-1-450' }, read);

    expect(colors).toEqual({
      surface: { color: 'rgb(1, 2, 3)', opacity: 1 },
      series: { color: 'rgb(4, 5, 6)', opacity: 0.5 },
    });
    expect(read).toHaveBeenCalledWith('chart-1-450');
  });

  it('returns null when a token cannot be read', () => {
    expect(resolveTokenColors({ surface: 'card-background' }, () => '')).toBeNull();
  });
});

describe(sameTokenColors.name, () => {
  const a = { surface: { color: 'rgb(1, 2, 3)', opacity: 1 } };

  it('is true for equal maps', () => {
    expect(sameTokenColors(a, { surface: { color: 'rgb(1, 2, 3)', opacity: 1 } })).toBe(true);
  });

  it('is false when a colour, an opacity or the key set differs', () => {
    expect(sameTokenColors(a, { surface: { color: 'rgb(1, 2, 4)', opacity: 1 } })).toBe(false);
    expect(sameTokenColors(a, { surface: { color: 'rgb(1, 2, 3)', opacity: 0.5 } })).toBe(false);
    expect(sameTokenColors(a, { other: { color: 'rgb(1, 2, 3)', opacity: 1 } })).toBe(false);
    expect(sameTokenColors(a, null)).toBe(false);
  });

  it('treats two nulls as the same', () => {
    expect(sameTokenColors(null, null)).toBe(true);
  });
});
