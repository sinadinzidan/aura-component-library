import { act, renderHook } from '@testing-library/react';

import { useSimulatedWait, type WaitTimers } from './useSimulatedWait';

function makeTimers() {
  const pending = new Map<number, () => void>();
  let next = 1;
  const timers: WaitTimers = {
    set: vi.fn((callback: () => void) => {
      pending.set(next, callback);
      return next++;
    }),
    clear: vi.fn((handle: number) => {
      pending.delete(handle);
    }),
  };
  const flush = () => {
    const callbacks = [...pending.values()];
    pending.clear();
    callbacks.forEach((callback) => callback());
  };
  return { timers, flush, pending };
}

describe(useSimulatedWait.name, () => {
  it('starts idle', () => {
    const { timers } = makeTimers();
    const { result } = renderHook(() => useSimulatedWait(500, timers));

    expect(result.current.phase).toBe('idle');
  });

  it('waits for the given delay after start', () => {
    const { timers } = makeTimers();
    const { result } = renderHook(() => useSimulatedWait(500, timers));

    act(() => result.current.start());

    expect(result.current.phase).toBe('waiting');
    expect(timers.set).toHaveBeenCalledWith(expect.any(Function), 500);
  });

  it('is done when the delay has passed', () => {
    const { timers, flush } = makeTimers();
    const { result } = renderHook(() => useSimulatedWait(500, timers));
    act(() => result.current.start());

    act(() => flush());

    expect(result.current.phase).toBe('done');
  });

  it('returns to idle and cancels the wait on reset', () => {
    const { timers, pending } = makeTimers();
    const { result } = renderHook(() => useSimulatedWait(500, timers));
    act(() => result.current.start());

    act(() => result.current.reset());

    expect(result.current.phase).toBe('idle');
    expect(pending.size).toBe(0);
  });

  it('restarts the delay when started again while waiting', () => {
    const { timers, pending } = makeTimers();
    const { result } = renderHook(() => useSimulatedWait(500, timers));
    act(() => result.current.start());

    act(() => result.current.start());

    expect(timers.clear).toHaveBeenCalledTimes(1);
    expect(pending.size).toBe(1);
  });

  it('cancels a wait in flight on unmount', () => {
    const { timers, pending } = makeTimers();
    const { result, unmount } = renderHook(() => useSimulatedWait(500, timers));
    act(() => result.current.start());

    unmount();

    expect(pending.size).toBe(0);
  });
});
