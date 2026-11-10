import { NEON_TONE, neonFromStatus } from './neon';

describe('neon tones', () => {
  it('draws normal states in the accent', () => {
    expect(neonFromStatus('neutral')).toBe('accent');
    expect(neonFromStatus('success')).toBe('accent');
  });

  it('keeps abnormal states in their status colour', () => {
    expect(neonFromStatus('warning')).toBe('warning');
    expect(neonFromStatus('critical')).toBe('critical');
    expect(neonFromStatus('info')).toBe('info');
  });

  it('sets the neon variable from a token for every tone', () => {
    for (const value of Object.values(NEON_TONE)) {
      expect(value).toMatch(/^\[--neon:var\(--[a-z-]+\)\]$/);
    }
  });
});
