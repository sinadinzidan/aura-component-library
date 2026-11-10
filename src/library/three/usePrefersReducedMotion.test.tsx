import { act, renderHook } from '@testing-library/react';

import { usePrefersReducedMotion } from './usePrefersReducedMotion';

describe(usePrefersReducedMotion.name, () => {
  it('reports the current preference', () => {
    const { result } = renderHook(() => usePrefersReducedMotion(() => ({ matches: true })));

    expect(result.current).toBe(true);
  });

  it('is false when matchMedia is unavailable', () => {
    const { result } = renderHook(() => usePrefersReducedMotion(undefined));

    expect(result.current).toBe(false);
  });

  it('follows changes to the preference', () => {
    const listeners: (() => void)[] = [];
    const media = {
      matches: false,
      addEventListener: (_type: 'change', listener: () => void) => listeners.push(listener),
      removeEventListener: vi.fn(),
    };
    const { result } = renderHook(() => usePrefersReducedMotion(() => media));

    act(() => {
      media.matches = true;
      listeners.forEach((listener) => listener());
    });

    expect(result.current).toBe(true);
  });
});
