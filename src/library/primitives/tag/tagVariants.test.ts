import { TAG_DECORATIVE_VARIANTS, tagVariantFromKey } from './tagVariants';

describe(tagVariantFromKey.name, () => {
  it('returns a decorative variant', () => {
    expect(TAG_DECORATIVE_VARIANTS).toContain(tagVariantFromKey('Mechanical'));
  });

  it('gives the same key the same variant', () => {
    expect(tagVariantFromKey('Instrument')).toBe(tagVariantFromKey('Instrument'));
  });

  it('ignores case and surrounding space', () => {
    expect(tagVariantFromKey('  Electrical ')).toBe(tagVariantFromKey('electrical'));
  });

  it('spreads a handful of keys over more than one variant', () => {
    const variants = new Set(['Mechanical', 'Electrical', 'Instrument', 'Process', 'Safety', 'Civil'].map(tagVariantFromKey));

    expect(variants.size).toBeGreaterThan(2);
  });

  it('handles an empty key', () => {
    expect(tagVariantFromKey('')).toBe('decorative-1');
  });
});
