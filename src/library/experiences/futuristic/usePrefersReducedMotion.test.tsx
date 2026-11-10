import { renderHook } from '@testing-library/react';

import { usePrefersReducedMotion } from './usePrefersReducedMotion';

describe(usePrefersReducedMotion.name, () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is false when the system has no preference', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));

    const { result } = renderHook(() => usePrefersReducedMotion());

    expect(result.current).toBe(false);
  });

  it('is true when the system asks for reduced motion', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));

    const { result } = renderHook(() => usePrefersReducedMotion());

    expect(result.current).toBe(true);
  });
});
