import { act, renderHook } from '@testing-library/react';

import { prefersReducedMotion, useTween } from './useTween';

const mix = (from: number, to: number, progress: number): number => from + (to - from) * progress;

describe(useTween.name, () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('starts on the target, settled', () => {
    const { result } = renderHook(() => useTween(10, mix, { key: 'a' }));

    expect(result.current).toEqual({ value: 10, settled: true });
  });

  it('jumps straight to a new target when animation is off', () => {
    const { result, rerender } = renderHook(({ target, key }) => useTween(target, mix, { key, animate: false }), {
      initialProps: { target: 10, key: 'a' },
    });

    rerender({ target: 50, key: 'b' });

    expect(result.current).toEqual({ value: 50, settled: true });
  });

  it('moves from the shown value to the new target over the duration', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'setTimeout', 'clearTimeout'] });
    const { result, rerender } = renderHook(({ target, key }) => useTween(target, mix, { key, durationMs: 400 }), {
      initialProps: { target: 0, key: 'a' },
    });

    rerender({ target: 100, key: 'b' });
    expect(result.current).toEqual({ value: 0, settled: false });

    act(() => {
      vi.advanceTimersByTime(216);
    });
    expect(result.current.settled).toBe(false);
    expect(result.current.value).toBeGreaterThan(0);
    expect(result.current.value).toBeLessThan(100);

    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(result.current).toEqual({ value: 100, settled: true });
  });

  it('does not restart when the target object changes but the key does not', () => {
    const { result, rerender } = renderHook(({ target }) => useTween(target, mix, { key: 'same' }), { initialProps: { target: 1 } });

    rerender({ target: 2 });

    expect(result.current).toEqual({ value: 1, settled: true });
  });

  it('skips the motion for viewers who prefer reduced motion', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'setTimeout', 'clearTimeout'] });
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    const { result, rerender } = renderHook(({ target, key }) => useTween(target, mix, { key, durationMs: 400 }), {
      initialProps: { target: 0, key: 'a' },
    });

    rerender({ target: 100, key: 'b' });
    act(() => {
      vi.advanceTimersByTime(20);
    });

    expect(prefersReducedMotion()).toBe(true);
    expect(result.current).toEqual({ value: 100, settled: true });
  });
});
